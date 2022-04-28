const child_process = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const request = require("sync-request");
const uuid = require("uuid");
const argv = require("./argv.js").run;
const fsextra = require("fs-extra");
const vm = require("vm");
const {list_of_event_attributes} = require("./utils");
const isURL = require("validator").isURL;
const isIP = require("validator").isIP;

let directory = path.normalize(process.argv[3]);

let urls = [];
let activeUrls = [];
let snippets = {};
let resources = {};
let files = {};
let IOC = [];
let dom_logs = [];
let instrumented_filenames_stack = [];
//TODO: format all code to use the same convention of variables naming (either camelCase or underscores)
let latestUrl = "";
let latestDomStr = "";
let number_of_wscript_code_snippets = 0;
let number_of_set_timeout_calls = 0;
let number_of_set_interval_calls = 0;
let number_of_jsdom_scripts = 0;
let number_of_event_scripts = 0;
let number_of_html_snippets = 0;

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
	instrumented_filenames_stack = [];

	logDom = false;

	latestUrl = "";
	number_of_wscript_code_snippets = 0;
	number_of_set_timeout_calls = 0;
	number_of_set_interval_calls = 0;
	number_of_jsdom_scripts = 0;
	number_of_event_scripts = 0;
	number_of_html_snippets = 0;

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
	instrumented_filenames_stack = [];

	logDom = false;

	latestUrl = "";
	number_of_wscript_code_snippets = 0;
	number_of_set_timeout_calls = 0;
	number_of_set_interval_calls = 0;
	number_of_jsdom_scripts = 0;
	number_of_event_scripts = 0;
	number_of_html_snippets = 0;

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

function saveUrl(url, method = "UNKNOWN", info_str = "UNKNOWN") {
	latestUrl = url;
	let info = `METHOD: ${method}. INFO: ${info_str}`

	let search = urls.filter((u) => u.url === url);
	if (JSON.stringify(search) !== "[]") { //url is alreadys in urls
		search[0].info.push(info);
	} else { //url is not in urls so make new url obj to put there
		urls.push({
			url: url,
			info: [info],
		});
	}
	fs.writeFileSync(path.join(directory, "urls.json"), JSON.stringify(urls, null, "\t"));
}

function logUrl(method, url, info_str = "UNKNOWN") {
	log("info", `FOUND URL: ${url} ${method}`);
	saveUrl(url, method, info_str);
}

function logDOMUrl(url, options, method = "GET", requested = true) {
	let info = `DOM: Resource at ${url} [${method}] was ${requested ? "requested from" : "found in"} DOM emulation${options.element ? " from element " + options.element.localName : ""}. Options: ${JSON.stringify(options)}`;
	log("info", info);
	saveUrl(url, method, info);
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
		instrumented_filenames_stack.push(filename2);
	}
	return code; // Helps with tail call optimization
}

function log_if_unique_snippet(str, log_func, filter_func = () => true) {
	let unique = true;
	str = str.replace(/\s/g, "");
	for (let s of Object.getOwnPropertyNames(snippets).filter(filter_func)) {
		let snip = fs.readFileSync(path.join(directory, `/snippets/${s}`), "utf8");
		if (snip.replace(/\s/g, "") === str) unique = false;
	}
	if (unique)
		log_func();
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
		logUrl(method, url, "FROM CALL TO lib.fetchUrl FROM AN ACTIVEX XMLHTTP OBJECT");
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
	logDOMUrl,
	logDOM: function(property, write = false, write_val = null, func = false, args = null) {
		let return_snippet_prefix = "";

		function args_to_string() {
			let str = "";
			for (let arg of args) {
				// if (arg.nodeType) {
				// 	str += arg.toString() + ", ";
				// } else {
					str += limit_val(arg) + ", ";
				// }
			}
			return str;
		}

		function check_for_javascript_code(value, found_in = "emulation") {
			function is_one_variable(value) {
				//the vm.Script allows "scripts" that are just one variable like "lol"
				//this function is used to filter out these one variable scripts since nothing is happening in them
				//https://stackoverflow.com/questions/50118131/how-to-check-if-regex-matches-whole-string-in-javascript
				return value.match(/[a-zA-Z]+[a-zA-Z0-9]*/)[0] === value;
			}

			function is_event_prop(found) {
				let found_split = found.split(".");
				let prop = found_split[found_split.length - 1];

				// for (let e of list_of_event_attributes) {
				// 	if (prop.startsWith(e)) {
				// 		return true;
				// 	}
				// }
				// return false;

				//technically each event starts with on so this is less computationally expensive however slightly less accurate
				return prop.startsWith("on");
			}


			if (typeof value === "string") {
				try {
					if (value.trim() !== "" && !is_one_variable(value)) {
						const script = new vm.Script(value);
						logJS(value, `DOM_${++number_of_jsdom_scripts}_`, "", true, null, `JavaScript string found in ${found_in}`, true);
					}
				} catch (err) {
				}
			} else if (typeof value === "function" && (found_in.includes("addEventListener") || is_event_prop(found_in))) {
				//this is an event
				return_snippet_prefix = `DOM_${++number_of_event_scripts}_`;
				logJS(value.toString(), return_snippet_prefix, "", true, null, `JavaScript function found in ${found_in}`);
			}
		}

		function check_for_url(value, found_in = "emulation") {
			if (typeof value === "string") {
				if (isURL(value.trim()) || isIP(value.trim())) {
					logDOMUrl(value.trim(), {element: {localName: property}}, `UNKNOWNMETHOD`, false);
				}
			}
		}

		//this function returns val to be capped in length if the command line argument limit-log-dom-length is on
		//otherwise it just returns val back
		function limit_val(val) {
			if (argv["limit-dom-log-length"]) {
				let val_str = val.toString();
				if (val_str.length >= 30)
					return val_str.substring(0, 30) + "...";
				return val_str;
			}
			return val.toString();
		}

		if (logDom) {
			logDom = false;
			//if some JS is logged from the value or arguments, then returns the start of the snippet name so that it can be logged

			try {
				if (args) {
					for (let i = 0; i < args.length; i++) {
						check_for_javascript_code(args[i], `arg [${i}] of call of ${property}(${args_to_string()})`);
						check_for_url(args[i], `arg [${i}] of call of ${property}(${args_to_string()})`);
					}
				} else if (write_val) {
					check_for_javascript_code(write_val, `write value for ${property}`);
					check_for_url(write_val, `write value for ${property}`);
				}

				let dom_str = `DOM: Code ${write ? "modified" : (func ? "called" : "accessed") } ${property}${func ? "(" + (args ? args_to_string() : "") + ")" : ""}${write_val ? " with value " + limit_val(write_val) : ""}`;
				if ((!write && !func) && dom_str === latestDomStr) { //prevent duplicate accessed logs because they're useless
					logDom = true;
					return;
				}
				latestDomStr = dom_str;
				if (property === "setTimeout" || property === "setInterval") {
					return_snippet_prefix = `${property}_${property === "setTimeout" ? ++number_of_set_timeout_calls : ++number_of_set_interval_calls}_`;
					logJS(String(args[0]), return_snippet_prefix, "", true, String(args[0]), `${property} call`, true);
				}
				log("info", dom_str);

				dom_logs.push(dom_str);
				fs.writeFileSync(path.join(directory, "dom_logs.json"), JSON.stringify(dom_logs, null, "\t"));
			} catch (e) {
				log("warn", `Call to lib.logDOM threw an error - args were (${property}, ${write}, ${write_val}, ${func}, ${args})`);
			}

			logDom = true;
			return return_snippet_prefix;
		}
	},
	logHTML: function(html_str, as) {
		log_if_unique_snippet(
			html_str,
			() => logSnippet(`HTML_${++number_of_html_snippets === 1 ? "1_initial" : number_of_html_snippets}_${uuid.v4()}.txt`, {as}, html_str),
			(s) => s.includes("HTML")
		)
	},
	logCookies: function(cookieJar) {
		let serial = cookieJar.serializeSync();
		if (serial.cookies.length !== 0)
			fs.writeFileSync(path.join(directory, "cookies.json"), JSON.stringify(serial, null, "\t"));
	},
	logBrowserStorage: function(localStorage, sessionStorage) {
		if (JSON.stringify(localStorage) !== "{}")  //if not empty
			fs.writeFileSync(path.join(directory, "localStorage.json"), JSON.stringify(localStorage, null, "\t"));
		if (JSON.stringify(sessionStorage) !== "{}")  //if not empty
			fs.writeFileSync(path.join(directory, "sessionStorage.json"), JSON.stringify(sessionStorage, null, "\t"));
	},
	turnOnLogDOM: () => {logDom = true},
	turnOffLogDOM: () => {logDom = false},
	toggleLogDOM: () => {logDom = !logDom},
	domLoggingOn: () => logDom,
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
	},
	checkThatScriptHasBeenLogged: (script_str) => {
		log_if_unique_snippet(
			script_str,
			() => {
				log("info", "Found an extra script in window.documents.script. Saved as snippet.");
				logJS(script_str, `DOM_${++number_of_jsdom_scripts}_`, "", true, null, "JavaScript found in window.document.scripts", true);
			}
		);
	},
	getLastInstrumentedFilename: () => instrumented_filenames_stack.pop(),
};