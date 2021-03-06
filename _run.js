const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const walk = require("walk-sync");
const argv = require("./argv.js").run;

// Read and format JSON flag documentation
if (argv.help || process.argv.length === 2) {
    const columnify = require("columnify");
    console.log(`extract-js is a utility to analyze malicious JavaScript files.

Usage:
    extract-js [flags] <files|directories>

    Pass a list of samples to be analyzed. Note that directories are searched
      recursively, so you can pass a directory that contains several samples and
      they will be analyzed in parallel.
    Creates one .results directory for each sample; see README.md for more
      information.

Flags:
	`);
    console.log(columnify(
	require("./argv.js").flags.run.map((flag) => ({
	    name: (flag.alias ? `-${flag.alias}, ` : "") + `--${flag.name}`,
	    description: flag.description,
	})),
	{
	    config: {
		description: {
		    maxWidth: 80,
		},
	    },
	}
    ));
    process.exit(0);
}

if (argv.version) {
    console.log(require("./package.json").version);
    process.exit(0);
}

if (argv.license) {
    console.log(fs.readFileSync(__dirname + "/LICENSE", "utf8"));
    process.exit(0);
}

let timeout = argv.timeout;
if (!timeout) {
	if (argv["all"] || argv["sym-exec"]) {
		console.log("Using a 100 seconds timeout, pass --timeout to specify another timeout in seconds");
		timeout = 100;
	} else {
		console.log("Using a 10 seconds timeout, pass --timeout to specify another timeout in seconds");
		timeout = 10;
	}
}

Array.prototype.functionalSplit = function(f) {
    // Call f on every item, put it in a if f returns true, put it in b otherwise.
    const a = [];
    const b = [];
    for (const elem of this)
	if (f(elem))
	    a.push(elem);
    else
	b.push(elem);
    return [a, b];
}

const args = process.argv.slice(2);
args.push(`--timeout=${timeout}`);

let [targets, options] = args.functionalSplit(fs.existsSync);

function set_proper_path_for_arg(arg) {
	//file options are detected as target files, so delete it from targets so it's not analyzed
	if (argv[arg]) {
		options.push(`--${arg}=${argv[arg]}`);
		targets.splice(targets.indexOf(argv[arg]), 1);
	}
}

set_proper_path_for_arg("cookie-file");
set_proper_path_for_arg("session-storage-file");
set_proper_path_for_arg("local-storage-file");
set_proper_path_for_arg("output-dir");

// Array of {filepath, filename}
const tasks = [];

const [folders, files] = targets.functionalSplit(path => fs.statSync(path).isDirectory());

files
    .map(filepath => ({
	filepath,
	filename: path.basename(filepath),
    }))
    .forEach(task => tasks.push(task));

folders
    .map(root => ({root, files: walk(root, {directories: false})}))
    .map(({root, files}) => files.map(file => root + "/" + file))
    .reduce((a, b) => a.concat(b), []) // flatten
    .map(filepath => ({
	filepath,
	filename: path.basename(filepath),
    }))
    .forEach(task => tasks.push(task));

if (tasks.length === 0) {
    console.log("Please pass one or more filenames or directories as an argument.");
    process.exit(255);
}
if (argv["multi-exec"] && argv["multi-exec-brute"]) {
	console.log("Cannot have --multi-exec and --multi-exec-brute at the same time");
	process.exit(255);
}

// Prevent "possible memory leak" warning
process.setMaxListeners(Infinity);

const q = require("queue")();
// Screw you, buggy option parser
if (argv.threads === 0) q.concurrency = Infinity;
else if (argv.threads)  q.concurrency = argv.threads;
else                    q.concurrency = require("os").cpus().length;

if (tasks.length > 1) // If batch mode
    if (argv.threads)
	console.log(`Analyzing ${tasks.length} items with ${q.concurrency} threads`)
else
    console.log(`Analyzing ${tasks.length} items with ${q.concurrency} threads (use --threads to change this value)`)

// queue the input files for analysis
const outputDir = argv["output-dir"] || "./";
let results_dirs = [];
let all_flag = argv["all"];
let default_flag = argv["default"];
let multi_flag = argv["multi-exec"];
let multi_brute_flag = argv["multi-exec-brute"];
let sym_flag = argv["sym-exec"];

function multi_brute_push_q(q, results_dir, filepath, filename) {
	let mutually_exclusive_opts = ["", "--multi-exec-only-eval", "--multi-exec-no-eval"];
	let total_opts = {};
	fs.mkdirSync(results_dir + "/multi-exec");

	let count = 0;
	for (let i of mutually_exclusive_opts) {
		for (let j of ["", "--no-multi-exec-loop"]) {
			for (let k of ["", "--multi-exec-loop-limit=1000"]) {
				for (let l of ["", "--multi-exec-function-limit=1000"]) {
					for (let m of ["", "--no-multi-exec-events"]) {
						for (let n of ["", "--no-multi-exec-function"]) {
							let multi_opts = [i, j, k, l, m, n];
							multi_opts = multi_opts.filter((o) => o !== "");
							let c = count;
							q.push(cb => analyze(results_dir, filepath, filename, cb, "multi-exec", false, multi_opts, c));
							total_opts[count] = multi_opts;
							count++;
						}
					}
				}
			}
		}
	}

	fs.writeFileSync(results_dir + "/multi-exec-brute-opts.json", JSON.stringify(total_opts, null, 4));
}

tasks.forEach(({filepath, filename}) => {
	const results_dir = get_results_dir(filename);
	results_dirs.push(results_dir);

	if (all_flag) {
		q.push(cb => analyze(results_dir, filepath, filename, cb, "default", false))
		if (multi_brute_flag) {
			multi_brute_push_q(q, results_dir, filepath, filename);
		} else {
			q.push(cb => analyze(results_dir, filepath, filename, cb, "multi-exec", false));
		}
		q.push(cb => analyze(results_dir, filepath, filename, cb, "sym-exec", false))
	} else if (!default_flag && !multi_flag && !multi_brute_flag && !sym_flag) {
		q.push(cb => analyze(results_dir, filepath, filename, cb, "default"))
	} else {
		let log_to_stdout = ((default_flag?1:0) + (multi_flag?1:0) + (sym_flag?1:0)) === 1;
		if (default_flag) {
			q.push(cb => analyze(results_dir, filepath, filename, cb, "default", log_to_stdout));
		}
		if (multi_flag) {
			q.push(cb => analyze(results_dir, filepath, filename, cb, "multi-exec", log_to_stdout));
		}
		if (multi_brute_flag) {
			multi_brute_push_q(q, results_dir, filepath, filename);
		}
		if (sym_flag) {
			q.push(cb => analyze(results_dir, filepath, filename, cb, "sym-exec", log_to_stdout));
		}
	}
});

let completed = 0;

q.on("success", () => {
    completed++;
    if (tasks.length !== 1)
	console.log(`Progress: ${completed}/${tasks.length} (${(100 * completed/tasks.length).toFixed(2)}%)`);
});

if (!argv["no-summary"]) {
	q.on("end", () => {
		for (let i = 0; i < results_dirs.length; i++) {
			require("./aggregator.js").summarize(results_dirs[i], !argv["no-summary-file-copying"]);
		}
	});
}

q.start();

function get_results_dir(filename) {
	let directory = path.join(outputDir, filename + ".results");

	// Find a suitable directory name
	for (let i = 1; fs.existsSync(directory); i++)
		directory = path.join(outputDir, filename + "." + i + ".results");

	fs.mkdirSync(directory);
	directory += "/"; // For ease of use
	return directory;
}

function analyze(directory, filepath, filename, cb, mode = "default", logToStdout = true, multi_brute_opts = null, multi_brute_count = -1) {

	directory += mode + (multi_brute_opts ?  "/" + multi_brute_count : "");
	fs.mkdirSync(directory);
	fs.mkdirSync(directory + "/resources");
	fs.mkdirSync(directory + "/snippets");
	directory += "/";

	console.log(`(${mode.toUpperCase()}${multi_brute_opts ? "-" + multi_brute_count : ""} MODE) Starting thread for analyzing ${filename}...`);
	let final_options = multi_brute_opts ? options.concat(multi_brute_opts) : options;
	const worker = cp.fork(path.join(__dirname, "analyze"), [filepath, directory, /*multi_exec?*/ mode, logToStdout, ...final_options]);
	if (multi_brute_opts) mode += "-" + multi_brute_count;

	const killTimeout = setTimeout(() => {
		console.log(`(${mode.toUpperCase()} MODE) Analysis for ${filename} timed out.`);
		if (!argv.preprocess)
			console.log("Hint: if the script is heavily obfuscated, --preprocess --unsafe-preprocess can speed up the emulation.");
		worker.kill();
		if (argv.debug) process.exit(2);
		cb();
	}, timeout * 1000);

	let expectShellError = false;

	worker.on("message", function(message) {
		switch (message) {
			case "expect-shell-error":
				expectShellError = true;
				break;
			case "no-expect-shell-error":
				expectShellError = false;
				break;
		}
	});

	worker.on("exit", function(code) {
		if (argv.debug && expectShellError) {
			// Use the appropriate exit code, as documented in the README
			process.exit(5);
		}
		if (code === 1) {
			console.log(`(${mode.toUpperCase()} MODE) Analysis for ${filename} failed.
 * If the error is about a weird \"Unknown ActiveXObject\", try --no-kill.
 * Otherwise, report a bug at https://github.com/CapacitorSet/box-js/issues/ .`);
		}
		clearTimeout(killTimeout);
		worker.kill();
		if (argv.debug) process.exit(code);
		cb();
	});

	worker.on("error", function(err) {
		console.log(`(${mode.toUpperCase()} MODE) Analysis for ${filename} has an error:
					${err}`);
		clearTimeout(killTimeout);
		worker.kill();
		if (argv.debug) process.exit(1);
		cb();
	});

	process.on("exit", () => {
		console.log(`(${mode.toUpperCase()} MODE) Analysis for ${filename} exited`);
		worker.kill();
		cb();
	});
	process.on("SIGINT", () => {
		worker.kill();
		cb();
	});
	// process.on('uncaughtException', () => worker.kill());
}
