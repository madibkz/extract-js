const child_process = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const request = require("sync-request");
const uuid = require("uuid");
const argv = require("./argv.js").run;
const fsextra = require("fs-extra");

let directory = path.normalize(process.argv[3]);

let urls = [];
let activeUrls = [];
let snippets = {};
let resources = {};
let files = {};
let IOC = [];
let dom_logs = [];

let latestUrl = "";
let number_of_wscript_code_snippets = 0;
let numberOfSetTimeoutCalls = 0;
let numberOfSetIntervalCalls = 0;

let logDom = false;

const logSnippet = function(filename, logContent, content, deobfuscate = false) {
	snippets[filename] = logContent;
	let save_path = path.join(directory + "/snippets/", filename);
	fs.writeFileSync(save_path, require("js-beautify").js(content));
	if (deobfuscate) {
		//write a deobfuscated version of the JS snippet
		child_process.exec(`./illuminatejs/deobfuscate_file.js ${save_path}`);
	}
	fs.writeFileSync(path.join(directory, "snippets.json"), JSON.stringify(snippets, null, "\t"));
};

//used for symbolic execution mode, when running a new combination of inputs, to log to a new folder
function new_symex_log_context(count, input) {
	urls = [];
	activeUrls = [];
	snippets = {};
	resources = {};
	files = {};
	IOC = [];
	dom_logs = [];

	logDom = false;

	latestUrl = "";
	number_of_wscript_code_snippets = 0;
	numberOfSetTimeoutCalls = 0;
	numberOfSetIntervalCalls = 0;

	if (count > 0) {
		//reset directory to normal directory
		//gets second last index of https://stackoverflow.com/questions/25331030/js-get-second-to-last-index-of
		directory = directory.substring(0, directory.lastIndexOf('/', directory.lastIndexOf('/')-1));
	} else {
		directory += "/executions";
		fs.mkdirSync(directory);
	}
	directory += `/${count}/`;
	fs.mkdirSync(directory);
	fs.mkdirSync(directory + "/resources");
	fs.mkdirSync(directory + "/snippets");
	fs.writeFileSync(directory + "/context.json", JSON.stringify(input, null, 4));
}

//used for multi-execution when an error occurs, to restart all the logging states as it's a fresh start
function restartState() {
	urls = [];
	activeUrls = [];
	snippets = {};
	resources = {};
	files = {};
	IOC = [];
	dom_logs = [];

	logDom = false;

	latestUrl = "";
	number_of_wscript_code_snippets = 0;
	numberOfSetTimeoutCalls = 0;
	numberOfSetIntervalCalls = 0;

	//delete any written files
	fsextra.emptyDirSync(directory);
	fs.mkdirSync(directory + "/resources");
	fs.mkdirSync(directory + "/snippets");
}

function kill(message) {
	if (argv["no-kill"])
		throw new Error(message);
	console.trace(message);
	console.log("Exiting (use --no-kill to just simulate a runtime error).");
	process.exit(0);
}

function log(tag, text, toFile = true, toStdout = (path.normalize(process.argv[5]) == 'true')) {
	const levels = {
		"debug": 0,
		"verb": 1,
		"info": 2,
		"warn": 3,
		"error": 4,
	};
	if (!(tag in levels)) {
		log("warn", `Application error: unknown logging tag ${tag}`, false);
		return;
	}
	if (!(argv.loglevel in levels)) {
		const oldLevel = argv.loglevel; // prevents infinite recursion
		argv.loglevel = "debug";
		log("warn", `Log level ${oldLevel} is invalid (valid levels: ${Object.keys(levels).join(", ")}), defaulting to "info"`, false);
	}
	const level = levels[tag];
	if (level < levels[argv.loglevel]) return;
	const message = `[${tag}] ${text}`;
	if (toStdout || argv.loglevel === "debug") // Debug level always writes to stdout and file
		console.log(message);
	if (toFile || argv.loglevel === "debug")
		fs.appendFileSync(path.join(directory, "analysis.log"), message + "\n");
}

function hash(algo, string) {
	return crypto.createHash(algo).update(string).digest("hex");
}

const getUUID = uuid.v4;

function logIOC(type, value, description) {
	log("info", "IOC: " + description);
	IOC.push({type, value, description});
	fs.writeFileSync(path.join(directory, "IOC.json"), JSON.stringify(IOC, null, "\t"));
}

function logUrl(method, url) {
	log("info", `${method} ${url}`);
	latestUrl = url;
	if (urls.indexOf(url) === -1) urls.push(url);
	fs.writeFileSync(path.join(directory, "urls.json"), JSON.stringify(urls, null, "\t"));
}

function logJS(code, prefix = "", suffix = "", id = true, rewrite = null, as = "eval'd JS", deobfuscate = false) {
	const genid = uuid.v4();
	const filename = prefix + (id ? genid : "") + suffix +  ".js";
	log("verb", `Code saved to ${filename}`);
	logSnippet(filename, {as: as}, code, deobfuscate);
	if (rewrite) {
		const filename2 = prefix + (id ? genid : "") + suffix + "_INSTRUMENTED" + ".js";
		log("verb", `Code saved to ${filename2}`);
		logSnippet(filename2, {as: as}, rewrite);
	}
	return code; // Helps with tail call optimization
}

module.exports = {
	argv,
	kill,
	getUUID,
	restartState,
	new_symex_log_context,

	debug: log.bind(null, "debug"),
	verbose: log.bind(null, "verb"),
	info: log.bind(null, "info"),
	warning: log.bind(null, "warn"),
	error: log.bind(null, "error"),

	proxify: (actualObject, objectName = "<unnamed>") => {
		/* Creating a Proxy is a common operation, because they normalize property names
		 * and help catch unimplemented features. This function implements this behaviour.
		 */
		return new Proxy(new actualObject, {
			get: function(target, prop) {
				const lProp = prop.toLowerCase();
				if (lProp in target) return target[lProp];
				kill(`${objectName}.${prop} not implemented!`);
			},
			set: function(a, b, c) {
				b = b.toLowerCase();
				a[b] = c;
				return true;
			},
		});
	},
	fetchUrl: function(method, url, headers = {}, body) {
		// Ignore HTTPS errors
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		logUrl(method, url);
		logIOC("UrlFetch", {method, url, headers, body}, "The script fetched an URL.");
		if (!doDownload) {
			lib.info("Returning HTTP 404 (Not found); use --download to try to download the payload");
			return {
				body: Buffer.from(""),
				headers: {},
			};
		}
		try {
			log("info", "Downloading...");

			headers["User-Agent"] = "Mozilla/4.0 (Windows; MSIE 6.0; Windows NT 6.0)";
			const options = {
				headers,
				maxRedirects: 20,
				timeout: 4000,
			};
			if (body)
				options.body = body;
			if (argv.proxy)
				options.proxy = argv.proxy;

			const file = request(method, url, options);
			Buffer.prototype.charCodeAt = function(index) {
				return this[index];
			};
			log("info", `Downloaded ${file.body.length} bytes.`);
			return file;
		} catch (e) {
			// Log and rethrow
			log("error", `An error occurred while emulating a ${method} request to ${url}.`);
			log("error", e);
			throw e;
		}
	},
	writeFile: function(filename, contents) {
		logIOC("FileWrite", {file: filename, contents}, "The script wrote a file.");
		files[filename] = contents;
	},
	readFile: function(filename) {
		logIOC("FileRead", {file: filename}, "The script read a file.");
		return files[filename];
	},
	logUrl,
	logResource: function(resourceName, emulatedPath, content) {
		const filePath = path.join(directory + "resources/", resourceName);
		fs.writeFileSync(filePath, content);
		log("info", `Saved ${filePath} (${content.length} bytes)`);

		let filetype = child_process.execSync("file " + JSON.stringify(filePath)).toString("utf8");
		filetype = filetype.replace(`${filePath}: `, "").replace("\n", "");
		log("info", `${filePath} has been detected as ${filetype}.`);

		if (/executable/.test(filetype)) {
			log("info", `Active URL detected: ${latestUrl}`);
			// Log active url
			if (activeUrls.indexOf(latestUrl) === -1)
				activeUrls.push(latestUrl);
			fs.writeFileSync(path.join(directory, "active_urls.json"), JSON.stringify(activeUrls, null, "\t"));
		}

		const md5 = hash("md5", content);
		log("verb", "md5:    " + md5);
		const sha1 = hash("sha1", content);
		log("verb", "sha1:   " + sha1);
		const sha256 = hash("sha256", content);
		log("verb", "sha256: " + sha256);

		const resource = {
			path: emulatedPath,
			type: filetype,
			latestUrl,
			md5,
			sha1,
			sha256
		};
		resources[resourceName] = resource;
		logIOC("NewResource", resource, "The script created a resource.");
		fs.writeFileSync(path.join(directory, "resources.json"), JSON.stringify(resources, null, "\t"));
	},
	logSnippet,
	logJS,
	logDOM: function(property, write = false, write_val = null, func = false, args = null) {
		if (logDom) {
			let dom_str = `DOM: Code ${write ? "modified" : (func ? "called" : "accessed") } ${property}${func ? "()" : ""}${write_val ? " with value " + write_val : ""}${args ? " with arguments " + JSON.stringify(args) : ""}`;
			if (property === "setTimeout" || property === "setInterval") {
				logJS(String(args[1]), `${property === "setTimeout" ? ++numberOfSetTimeoutCalls : ++numberOfSetIntervalCalls}_${property}_`, "", true, null, `${property} call`, true);
			}
			log("info", dom_str);

			dom_logs.push(dom_str);
			fs.writeFileSync(path.join(directory, "dom_logs.json"), JSON.stringify(dom_logs, null, "\t"));
		}
	},
	// turnOnLogDOM: () => {logDom = true},
	// turnOffLogDOM: () => {logDom = false},
	toggleLogDOM: () => {logDom = !logDom},
	logIOC,
	runShellCommand: (command) => {
		const filename = "WSCRIPT_CODE_" + (++number_of_wscript_code_snippets) + "_" + getUUID();
		logIOC("Run", {command}, "The script ran a command.");
		log("info", `Executing ${path.join(directory, filename)} in the WScript shell`);
		logSnippet(filename, {as: "WScript code"}, command);
		process.send("expect-shell-error");
		if (!argv["no-shell-error"])
			throw new Error("If you can read this, re-run extract.js with the --no-shell-error flag.");
		process.send("no-expect-shell-error");
	}
};
