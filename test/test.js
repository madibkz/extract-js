/* eslint-env mocha */

const assert = require("assert");
const exec = require("child_process").exec;
const fs = require("fs");
const fsextra = require("fs-extra");
const tmpDir = require("os").tmpdir();
const extractDir = `${__dirname}/..`;
const testScriptsDir = `${extractDir}/test_scripts/safe_scripts/`;
const testResultsFolder = "test_out";
const runExtractCommand = `node ${extractDir}/run.js --output-dir ${testResultsFolder}`;
const domScriptsDir = `${testScriptsDir}/dom/`;
const aggScriptsDir = `${testScriptsDir}/aggregator/`;
const symexScriptsDir = `${testScriptsDir}/sym-exec/`;
const rewriteScriptsDir = `${testScriptsDir}/rewrite/`;
const multiexScriptsDir = `${testScriptsDir}/multi-exec/`;
const htmlScriptsDir = `${testScriptsDir}/html/`;
//TODO: tests for command line arguments
//assuming that the test is only run once within this test suite
let getTestResultsFolder = (nameOfTest) => `${extractDir}/${testResultsFolder}/${nameOfTest}.results/`;
let run_script_and_check_output = (testScript, checkOutput, extraArgsStr = "") => function (done) {
	exec(`${runExtractCommand} ${extraArgsStr} ${testScript}`, function(err, stdout) {
		assert.strictEqual(err, null);
		checkOutput(stdout);
		done();
	});
};
let run_test_script_and_check_output = (testScript, checkOutput, extraArgsStr = "") =>
	run_script_and_check_output(`${testScriptsDir}/${testScript}`, checkOutput, extraArgsStr);

function get_snippets_object(test_script_name, mode = "default")  {
	let path_to_snippets_json = `${getTestResultsFolder(test_script_name)}${mode}/snippets.json`;
	assert(fs.existsSync(path_to_snippets_json));
	return JSON.parse(fs.readFileSync(path_to_snippets_json, "utf8"));
}

function get_snippets_starting_with(list_of_start_strs, snippets) {
	let dom_snippets = [];
	for (let snip in snippets) {
		list_of_start_strs.forEach((str) => {
				if (snip.startsWith(str)) dom_snippets.push(snip);
			}
		);
	}
	return dom_snippets;
}

function read_snippet_files(test_script_name, list_of_snippet_file_names, mode = "default") {
	let code_snips = [];
	for (let i in list_of_snippet_file_names) {
		code_snips.push(fs.readFileSync(`${getTestResultsFolder(test_script_name)}${mode}/snippets/${list_of_snippet_file_names[i]}`, "utf8"));
	}
	return code_snips;
}

fsextra.emptyDirSync(`${extractDir}/test_out`)

describe("package.json", function() {
	const source = fs.readFileSync(`${extractDir}/package.json`, "UTF8");
	const config = JSON.parse(source);
	it("should include a extract-js executable", function() {
		assert("bin" in config);
		const bin = config.bin;
		assert("extract-js" in bin);
	});
});

describe("run.js", function() {
	this.timeout(20000);
	it("should exist", function() {
		assert.doesNotThrow(function() {
			fs.accessSync(`${extractDir}/run.js`, fs.F_OK);
		});
	});
	it("should display a help text when no files are passed", function(done) {
		exec(`node ${extractDir}/run.js`, function(err, stdout) {
			assert.strictEqual(err, null);
			assert(stdout.includes("Usage:"));
			done();
		});
	});
	it("should run on a blank script", function(done) {
		const path = `${tmpDir}/blank.js`;
		fs.writeFileSync(`${tmpDir}/blank.js`, "");
		exec(`${runExtractCommand} ${path}`, done);
	});
	it("should run on all files in a folder", function(done) {
		const folder = `${tmpDir}/all_files_folder`;
		try {
			fs.mkdirSync(folder);
			fs.writeFileSync(`${folder}/blank.js`, "");
			fs.writeFileSync(`${folder}/blank2.js`, "");
		} catch (e) {
			//they might already be made
			if (!e.toString().includes("already exists")) {
				throw e;
			}
		}
		exec(`${runExtractCommand} ${folder}`, done);
	});
	it("should accept several paths", function(done) {
		const folder = `${tmpDir}/several_paths_folder`;
		try {
			fs.mkdirSync(folder);
			fs.writeFileSync(`${folder}/blank.js`, "");
			fs.writeFileSync(`${folder}/blank2.js`, "");
		} catch (e) {
			//they might already be made
			if (!e.toString().includes("already exists")) {
				throw e;
			}
		}
		exec(`${runExtractCommand} ${folder}/blank.js ${folder}/blank2.js`, done);
	});
	//TODO: more run.js tests to do with the other modes
});

//TODO: code rewriting tests - test function-rewriting, etc
describe("code rewriting", function() {
	this.timeout(20000);

	let run_rewrite_script_and_check_output = (testScript, checkOutput, extraArgsStr = "") =>
		run_script_and_check_output(`${rewriteScriptsDir}/${testScript}`, checkOutput, extraArgsStr);

	it(
		"should not rewrite NewExpressions where the function is a constructor",
		run_rewrite_script_and_check_output("function_rewrite_new.js", (stdout) => {
			assert(stdout.includes(`Script output: "1st one worked"`));
			assert(stdout.includes(`Script output: "2nd one worked"`));
		})
	);
	it(
		"should find and log any string literals which are urls/ips",
		run_rewrite_script_and_check_output("url_in_literal.js", (stdout) => {
			assert(stdout.includes(`FOUND URL: https://google.com | METHOD: UNKNOWN | INFO: FOUND IN STRING LITERAL WHILE TRAVERSING THE TREE PRE-EMULATION (START CHAR: 10 END CHAR: 30)`));
		})
	);
});

//tests that don't really have a concrete category
describe("other-category", function() {
	this.timeout(20000);

	it(
		"should find and log any strings containing URLs/IPs",
		run_test_script_and_check_output("find_urls_ips.js", (stdout) => {
			assert(stdout.includes(`FOUND URL: https://atest.com/?query=parameter | METHOD: UNKNOWNMETHOD | INFO: FOUND IN URL SEARCH AT THE END IN A VARIABLE CALLED: something1`));
			assert(stdout.includes(`FOUND URL: 123.123.213.4:2999 | METHOD: UNKNOWNMETHOD | INFO: FOUND IN URL SEARCH AT THE END IN A VARIABLE CALLED: something2`));
		})
	);
	it(
		"should set the userAgent to the supplied string is --user-agent is used",
		run_test_script_and_check_output("user-agent.js", (stdout) => {
			assert(stdout.includes(`Script output: "user agent is: fake user string"`));
			assert(stdout.includes(``));
		}, "--user-agent \"fake user string\"")
	);
});

describe("DOM", function() {
	this.timeout(20000);

	let run_dom_script_and_check_output = (testScript, checkOutput, extraArgsStr = "") =>
		run_script_and_check_output(`${domScriptsDir}/${testScript}`, checkOutput, extraArgsStr);

	function check_snippets(test_script_name, list_of_start_snippet_strs, list_of_as_values, list_of_snippet_values) {

		let snippets = get_snippets_object(test_script_name);
		let snippet_names = get_snippets_starting_with(list_of_start_snippet_strs, snippets);

		list_of_as_values.forEach((val, i) => {
			assert(snippets[snippet_names[i]].as === val);
		});

		let code_snips = read_snippet_files(test_script_name, snippet_names);

		list_of_snippet_values.forEach((val, i) => {
			assert(code_snips[i] === val);
		});
	}

	//DOM_LOG.JSON TESTS
	it(
		"should not create a dom_logs.json file if there are no DOM logs",
		run_dom_script_and_check_output("no_dom_logs_test.js", (stdout) => {
			let path_to_dom_logs = `${getTestResultsFolder("no_dom_logs_test.js")}default/dom_logs.json`;
			assert(!fs.existsSync(path_to_dom_logs));
		})
	);
	it(
		"should create a dom_logs.json file if there are DOM logs",
		run_dom_script_and_check_output("dom_logs_test.js", (stdout) => {
			let path_to_dom_logs = `${getTestResultsFolder("dom_logs_test.js")}default/dom_logs.json`;
			assert(fs.existsSync(path_to_dom_logs));
		})
	);

	//RESOURCE LOADING TESTS
	it(
		"should not log the url src for a new script element added to the dom if there is no dom-resource-loading flag",
		run_dom_script_and_check_output("no_dom_resource_loading.js", (stdout) => {
			assert(!stdout.includes(`Resource at https://code.jquery.com/jquery-3.6.0.slim.min.js was requested from DOM emulation from element script.`));
			let path_to_urls = `${getTestResultsFolder("no_dom_resource_loading.js")}default/urls.json`;
		})
	);
	it(
		"should log the url src for a new script element added to the dom",
		run_dom_script_and_check_output("create_linked_script.js", (stdout) => {
			assert(stdout.includes(`Resource at https://code.jquery.com/jquery-3.6.0.slim.min.js [GET] was requested from DOM emulation from element script.`));
			let path_to_urls = `${getTestResultsFolder("create_linked_script.js")}default/urls.json`;
			assert(fs.readFileSync(path_to_urls, "utf8").includes("https://code.jquery.com/jquery-3.6.0.slim.min.js"));
		}, "--dom-resource-loading")
	);
	it(
		"should log the url src for a new stylesheet element added to the dom",
		run_dom_script_and_check_output("create_linked_stylesheet.js", (stdout) => {
			assert(stdout.includes(`Resource at https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css [GET] was requested from DOM emulation from element link.`));
			let path_to_urls = `${getTestResultsFolder("create_linked_stylesheet.js")}default/urls.json`;
			assert(fs.readFileSync(path_to_urls, "utf8").includes("https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"));
		}, "--dom-resource-loading")
	);
	it(
		"should log the url src for a new iframe element added to the dom",
		run_dom_script_and_check_output("create_linked_iframe.js", (stdout) => {
			assert(stdout.includes(`Resource at https://google.com/ [GET] was requested from DOM emulation from element iframe.`));
			let path_to_urls = `${getTestResultsFolder("create_linked_iframe.js")}default/urls.json`;
			assert(fs.readFileSync(path_to_urls, "utf8").includes("https://google.com/"));
		}, `--dom-resource-loading --url "https://google.com/"`)
	);
	//url searching tests
	it(
		"should log a URL if it finds it in the argument/val for a DOM object interaction",
		run_dom_script_and_check_output("log_url_val.js", (stdout) => {
			assert(stdout.includes(`Resource at https://google.com [UNKNOWNMETHOD] was found in DOM emulation from element window.name.`));
			let path_to_urls = `${getTestResultsFolder("log_url_val.js")}default/urls.json`;
			assert(fs.readFileSync(path_to_urls, "utf8").includes("https://google.com"));
		})
	);


	//TODO: REFACTOR: maybe reduce the duplication more in these logging tests
	//DOM LOGGING TESTS
	it(
		"should log that alert was called",
		run_dom_script_and_check_output("alert_test.js", (stdout) => {
			assert(stdout.includes(`called alert(ay`));
		})
	);

	it(
		"should log that btoa and atob was called",
		run_dom_script_and_check_output("btoa_atob_test.js", (stdout) => {
			assert(stdout.includes(`Code called btoa(test`));
			assert(stdout.includes(`Script output: "dGVzdA=="`));
			assert(stdout.includes(`Code called atob(dGVzdA==`));
			assert(stdout.includes(`Script output: "test"`));
		})
	);

	it(
		"should log document property reads, writes and function calls",
		run_dom_script_and_check_output("document.js", (stdout) => {
			assert(stdout.includes(`Code accessed window.document.referrer`));
			assert(stdout.includes(`Code modified window.document.title with value test_title`));
			assert(stdout.includes(`Code called window.document.createElement(div, )`));
		})
	);

	it(
		"should log location property reads",
		run_dom_script_and_check_output("location_test.js", (stdout) => {
			assert(stdout.includes(`Code accessed window.location.toString`));
			assert(stdout.includes(`Code accessed window.location.href`));
		})
	);

	it(
		"should log navigator property reads and function calls",
		run_dom_script_and_check_output("navigator_read_val.js", (stdout) => {
			assert(stdout.includes(`Code accessed window.navigator.userAgent`));
			assert(stdout.includes(`Code called window.navigator.javaEnabled()`));
		})
	);

	it(
		"should log that window.origin was accessed",
		run_dom_script_and_check_output("origin.js", (stdout) => {
			assert(stdout.includes(`accessed window.origin`));
			assert(stdout.includes(`Script output: "https://example.com"`));
		})
	);

	it(
		"should show that window's read only properties cannot be modified",
		run_dom_script_and_check_output("readonly_window_test.js", (stdout) => {
			assert(stdout.includes(`Script output: true`));
		})
	);

	it(
		"should log screen's property accesses and modifications",
		run_dom_script_and_check_output("screen_test.js", (stdout) => {
			assert(stdout.includes(`Code accessed window.screen.colorDepth`));
			assert(stdout.includes(`Script output: 24`));
			assert(stdout.includes(`Code modified window.screen.colorDepth with value 3`));
		})
	);

	it(
		"should log history's property accesses",
		run_dom_script_and_check_output("history_test.js", (stdout) => {
			assert(stdout.includes(`Code accessed window.history.length`));
		})
	);

	it(
		"should log window.scroll being called (it is one of the unimplemented functions I added)",
		run_dom_script_and_check_output("scroll_test.js", (stdout) => {
			assert(stdout.includes(`Code called scroll(10, 20, )`));
		})
	);

	it(
		"should log setTimeout and setInterval calls",
		run_dom_script_and_check_output("set_timeout_interval_test.js", (stdout) => {
			assert(stdout.includes(`DOM: Code called setTimeout(() => console.log('setTimeout function'), 100, )`));
			assert(stdout.includes(`DOM: Code called setInterval(() => console.log('setInterval function'), 100, )`));
		})
	);
	it(
		"should log setTimeout and setInterval calls where the function is passed in as a string",
		run_dom_script_and_check_output("set_timeout_interval_string.js", (stdout) => {
			assert(stdout.includes(`Code called setTimeout(() => console.log("setTimeout function"), 100, )`));
			assert(stdout.includes(`Code called setInterval(() => console.log("setInterval function"), 100, )`));
		})
	);

	it(
		"should log when one of window's properties is modified",
		run_dom_script_and_check_output("window_edit_name.js", (stdout) => {
			assert(stdout.includes(`Code modified window.name with value test`));
			assert(stdout.includes(`Script output: "test"`));
		})
	);

	it(
		"should log the accesses/writes to a HTMLElement/Node that is returned from a document function",
		run_dom_script_and_check_output("create_element_log_test.js", (stdout) => {
			assert(stdout.includes(`Code called window.document.createElement(p, )`));
			assert(stdout.includes(`Code modified window.document.createElement(p).innerHTML with value TEST TEXT`));
		})
	);

	it(
		"should log the accesses/writes to HTMLElements/Nodes that were returned from a document function returning a HTMLCollection/NodeList",
		run_dom_script_and_check_output("document_body_children_log_test.js", (stdout) => {
			assert(stdout.includes(`Code called window.document.body.children[0].toString()`));
			assert(stdout.includes(`Code modified window.document.body.children[0].innerHTML with value TEST`));
		})
	);

	it(
		"should change the url used by location, and document.URL when the url is specified through --url",
		run_dom_script_and_check_output("url_test.js", (stdout) => {
			assert(stdout.includes(`Script output: "https://google.com/"`));
			assert(!stdout.includes(`Script output: "https://example.org/"`));
		}, "--url \"https://google.com\"")
	);

	it(
		"should log the beginning HTML used in the jsdom emulation",
		run_dom_script_and_check_output("html_initial.js", (stdout) => {
			check_snippets(
				"html_initial.js",
				["HTML_1"],
				["the initial HTML set for the jsdom emulation"],
				[]
			)
		})
	);

	it(
		"should log the end HTML in the jsdom emulation if there is a new script added/differences",
		run_dom_script_and_check_output("html_end.js", (stdout) => {
			check_snippets(
				"html_end.js",
				["HTML"],
				[
					"the initial HTML set for the jsdom emulation",
					"the end HTML from the jsdom emulation once it was finished"
				],
				[]
			)
		})
	);

	it(
		"should limit the length of logged values in lib.logDOM when --limit-dom-log-length is on",
		run_dom_script_and_check_output("limit-dom-log-length.js", (stdout) => {
			assert(stdout.includes(`Code modified window.document.onclick with value () => 'this is a really long s...`));
		}, "--limit-dom-log-length")
	);

	it(
		"should not log the URL and functions of window.XMLHttpRequest if --dom-network-apis is not there",
		run_dom_script_and_check_output("no_XHR.js", (stdout) => {
			assert(stdout.includes(`[error] Code called window.XMLHttpRequest() but it's not enabled!`));
		})
	);
	it(
		"should log the URL and functions of window.XMLHttpRequest if --dom-network-apis is not there",
		run_dom_script_and_check_output("XHR.js", (stdout) => {
			assert(stdout.includes(`Code called window.XMLHttpRequest.open(GET, https://example.com/, )`));
			assert(stdout.includes(`Resource at https://example.com/ [GET] was requested from DOM emulation from element window.XMLHttpRequest.`));
			assert(stdout.includes(`Code called window.XMLHttpRequest.send()`));
			assert(stdout.includes(`Code modified window.XMLHttpRequest.onload`));
		}, "--dom-network-apis")
	);

	it(
		"should log the URL of window.navigator.sendBeacon",
		run_dom_script_and_check_output("send_beacon.js", (stdout) => {
			assert(stdout.includes(`Code called window.navigator.sendBeacon(https://example.com/, )`));
			assert(stdout.includes(`Resource at https://example.com/ [POST] was requested from DOM emulation from element window.navigator.sendBeacon.`));
		}, "--dom-network-apis")
	);

	it(
		"should log the URL/args of window.fetch",
		run_dom_script_and_check_output("fetch.js", (stdout) => {
			assert(stdout.includes(`Code called window.fetch(https://example.com/, [object Object], )`));
			assert(stdout.includes(`Resource at https://example.com/ [POST] was requested from DOM emulation from element window.navigator.fetch. Options: {"element":{"localName":"window.navigator.fetch"},"args":{"method":"POST"}}`));
			assert(stdout.includes(`[error] Code called window.navigator.fetch() but it's not implemented!`));
		}, "--dom-network-apis")
	);


	//cookies
	it(
		"should log in dom_logs.json/stdout when document.cookie is read or a cookie is added",
		run_dom_script_and_check_output("cookie_read_and_add_test.js", (stdout) => {
			assert(stdout.includes(`Code called cookieJar.getCookieStringSync(https://example.com/, [object Object], )`));
			assert(stdout.includes(`Code called cookieJar.setCookieSync(username=garfield;, https://example.com/, [object Object], )`));
		})
	);
	//cookie log file
	it(
		"should not create a cookies.json file if there are no cookies",
		run_dom_script_and_check_output("no_cookies_test.js", (stdout) => {
			let path_to_cookies_json = `${getTestResultsFolder("no_cookies_test.js")}default/cookies.json`;
			assert(!fs.existsSync(path_to_cookies_json));
		})
	);
	it(
		"should create a cookies.json file if there are cookies with correct cookie values",
		run_dom_script_and_check_output("cookie_create_test.js", (stdout) => {
			let path_to_cookies_json = `${getTestResultsFolder("cookie_create_test.js")}default/cookies.json`;
			assert(fs.existsSync(path_to_cookies_json));
			let cookie = JSON.parse(fs.readFileSync(path_to_cookies_json, "utf8")).cookies[0];
			assert(cookie.key === "test");
			assert(cookie.value === "value");
			assert(cookie.extensions[0] === "something=another thing");
		})
	);
	//cookie option
	it(
		"should initialize the cookieJar with the cookie specified in the cookie argument",
		run_dom_script_and_check_output("cookie_cli.js", (stdout) => {
			let path_to_cookies_json = `${getTestResultsFolder("cookie_cli.js")}default/cookies.json`;
			let cookies = JSON.parse(fs.readFileSync(path_to_cookies_json, "utf8")).cookies;
			assert(cookies[0].key === "test");
			assert(cookies[0].value === "value");
		}, `--cookie "test= value;"`)
	);
	//cookie-file option
	it(
		"should initialize the cookieJar with the cookies specified in the cookie-file argument",
		run_dom_script_and_check_output("cookie_initialized_test.js", (stdout) => {
			let path_to_cookies_json = `${getTestResultsFolder("cookie_initialized_test.js")}default/cookies.json`;
			let cookies = JSON.parse(fs.readFileSync(path_to_cookies_json, "utf8")).cookies;
			assert(cookies[0].key === "test");
			assert(cookies[0].value === "first");
			assert(cookies[1].key === "test2");
			assert(cookies[1].value === "second");
			assert(cookies[1].extensions[0] === "extra=val");
		}, `--cookie-file ${domScriptsDir}/cookie_initialized_test.txt`)
	);

	//storage
	["local", "session"].forEach(t => {
		//storage proxy logging
		it(
			`should log in dom_logs.json/stdout when ${t}Storage properties are read or called`,
			run_dom_script_and_check_output(`${t}Storage_proxy_logging.js`, (stdout) => {
				assert(stdout.includes(`Code called window.${t}Storage.setItem(key1, value1, )`));
				assert(stdout.includes(`Code called window.${t}Storage.getItem(key1, )`));
				assert(stdout.includes(`Script output: "value1"`));
				assert(stdout.includes(`Code called window.${t}Storage.removeItem(key1, )`));
				assert(stdout.includes(`Code called window.${t}Storage.clear()`));
			})
		);
		//storage.json
		it(
			`should not create a ${t}Storage.json file if there is no ${t}Storage`,
			run_dom_script_and_check_output(`no_${t}Storage.js`, (stdout) => {
				let path_to_storage = `${getTestResultsFolder(`no_${t}Storage.js`)}default/${t}Storage.json`;
				assert(!fs.existsSync(path_to_storage));
			})
		);
		it(
			`should create a ${t}Storage.json file if there is ${t}Storage with the correct values`,
			run_dom_script_and_check_output(`save_${t}Storage.js`, (stdout) => {
				let path_to_storage = `${getTestResultsFolder(`save_${t}Storage.js`)}default/${t}Storage.json`;
				assert(fs.existsSync(path_to_storage));
				let storage = JSON.parse(fs.readFileSync(path_to_storage, "utf8"));
				assert(storage.key1 === "value1");
			})
		);
		//--${t}/session-storage-file
		it(
			`should initialize the ${t}Storage with the values specified in the ${t}-storage-file argument`,
			run_dom_script_and_check_output(`initial_${t}Storage.js`, (stdout) => {
				let path_to_storage = `${getTestResultsFolder(`initial_${t}Storage.js`)}default/${t}Storage.json`;
				let storage = JSON.parse(fs.readFileSync(path_to_storage, "utf8"));
				assert(storage["something.test"] === "{\"test\":{\"pass\":true,\"version\":\"21.41.14\"}}");
				assert(storage["another"] === "value");
			}, `--${t}-storage-file ${domScriptsDir}/initial_storage.txt`)
		);
	});

	//scripts
	it(
		"should log the code set for a new script element in a snippet file",
		run_dom_script_and_check_output("add_script.js", (stdout) => {
			check_snippets(
				"add_script.js",
				["DOM_1"],
				["JavaScript string found in write value for window.document.createElement(script).innerHTML"],
				["console.log(1);"]
			)
		})
	);
	it(
		"should log the code set for img onerror attribute in a snippet file",
		run_dom_script_and_check_output("img_code_test.js", (stdout) => {
			check_snippets(
				"img_code_test.js",
				["DOM_1"],
				["JavaScript string found in arg [1] of call of window.document.createElement(img).setAttribute(onerror, console.log(\"XSS or code or something\"), )"],
				["console.log(\"XSS or code or something\")"]
			)
		})
	);
	it(
		"should log the function/code for setTimeout and setInterval calls in a snippet file",
		run_dom_script_and_check_output("set_timeout_interval_snippet_test.js", (stdout) => {
			check_snippets(
				"set_timeout_interval_snippet_test.js",
				["setTimeout_1", "setInterval_1"],
				["setTimeout call", "setTimeout call", "setInterval call", "setInterval call"],
				["() => 'some code setTimeout'", "() => 'some code setTimeout'", "() => 'some code setInterval'", "() => 'some code setInterval'"]
			)
		})
	);
	it(
		"should log the function/code for setTimeout and setInterval calls in a snippet file when the code is passed as a string",
		run_dom_script_and_check_output("set_timeout_interval_string_snippet.js", (stdout) => {
			check_snippets(
				"set_timeout_interval_string_snippet.js",
				["setTimeout_1", "setInterval_1"],
				["setTimeout call", "setTimeout call", "setInterval call", "setInterval call"],
					["() => 'some code setTimeout'", "() => 'some code setTimeout'", "() => 'some code setInterval'", "() => 'some code setInterval'"]
			)
		})
	);
	it(
		"should log the code set for events in their own snippet files",
		run_dom_script_and_check_output("add_event_listener.js", (stdout) => {
			check_snippets(
				"add_event_listener.js",
				[
					"DOM"
				],
				[
					"JavaScript function found in arg [1] of call of window.document.addEventListener(click, function myFunction() {\n    return 'should log this function in a new snippet';\n}, )",
					"JavaScript function found in arg [1] of call of window.document.addEventListener(click, () => 'anonymous function should also be logged', )",
					"JavaScript function found in arg [1] of call of addEventListener(resize, () => 'window event should also be logged', )",
					"JavaScript function found in arg [1] of call of window.document.createElement(button).addEventListener(click, () => 'createElement elements events should also be logged', )",
					"JavaScript function found in write value for window.document.createElement(button).onclick"
				],
				[
					`function myFunction() {
    return 'should log this function in a new snippet';
}`,
					"() => 'anonymous function should also be logged'",
					"() => 'window event should also be logged'",
					"() => 'createElement elements events should also be logged'",
					"() => 'event attributes should also be logged'"
				]
			)
		})
	);
});

describe("html", function() {
	this.timeout(20000);

	let run_html_script_and_check_output = (testScript, checkOutput, extraArgsStr = "") =>
		run_script_and_check_output(`${htmlScriptsDir}/${testScript}`, checkOutput, extraArgsStr);

	it(
		"should parse and run a html file with --html enabled without errors",
		run_html_script_and_check_output("basic_html.html", (stdout) => {
		}, "--html")
	);
	it(
		"should parse and run the scripts within a html file",
		run_html_script_and_check_output("basic_script.html", (stdout) => {
			assert(stdout.includes(`Script output: "first script"`));
			assert(stdout.includes(`Script output: "second script"`));
		}, "--html")
	);
	it(
		"should log and rewrite javascript within on<something> attributes",
		run_html_script_and_check_output("attribute.html", (stdout) => {
			let snippets = get_snippets_object("attribute.html", "default");
			let snippet_names = get_snippets_starting_with(["1_"], snippets);
			let code_snips = read_snippet_files(
				"attribute.html",
				[snippet_names[0]],
				"default"
			);
			assert(code_snips[0] === "console.log('found the attribute code');");
		}, "--html")
	);
	it(
		"should download and run externally linked scripts within a html file when --dom-resource-loading is on",
		run_html_script_and_check_output("external_linked_js.html", (stdout) => {
			assert(stdout.includes(`Resource at https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js [GET] was requested from DOM emulation`));
			assert(stdout.includes(`Code called window.XMLHttpRequest() but it's not enabled`));
		}, "--html --dom-resource-loading")
	);
	//checking that the setup of --cookie, --cookie-file, --localStorage and --sessionStorage still works
	it(
		"should initialize the cookieJar with the cookie specified in the cookie argument in html mode",
		run_html_script_and_check_output("cookie_cli.html", (stdout) => {
			let path_to_cookies_json = `${getTestResultsFolder("cookie_cli.html")}default/cookies.json`;
			let cookies = JSON.parse(fs.readFileSync(path_to_cookies_json, "utf8")).cookies;
			assert(cookies[0].key === "test");
			assert(cookies[0].value === "value");
		}, `--html --cookie "test=value;"`)
	);
	it(
		"should initialize the cookieJar with the cookies specified in the cookie-file argument in html mode",
		run_html_script_and_check_output("cookie_file_cli.html", (stdout) => {
			let path_to_cookies_json = `${getTestResultsFolder("cookie_file_cli.html")}default/cookies.json`;
			let cookies = JSON.parse(fs.readFileSync(path_to_cookies_json, "utf8")).cookies;
			assert(cookies[0].key === "test");
			assert(cookies[0].value === "first");
			assert(cookies[1].key === "test2");
			assert(cookies[1].value === "second");
			assert(cookies[1].extensions[0] === "extra=val");
		}, `--html --cookie-file ${htmlScriptsDir}/cookie_file_cli.txt`)
	);
	["local", "session"].forEach(t => {
		//--${t}/session-storage-file
		it(
			`should initialize the ${t}Storage with the values specified in the ${t}-storage-file argument in html mode`,
			run_html_script_and_check_output(`initial_${t}Storage.html`, (stdout) => {
				let path_to_storage = `${getTestResultsFolder(`initial_${t}Storage.html`)}default/${t}Storage.json`;
				let storage = JSON.parse(fs.readFileSync(path_to_storage, "utf8"));
				assert(storage["something.test"] === "{\"test\":{\"pass\":true,\"version\":\"21.41.14\"}}");
				assert(storage["another"] === "value");
			}, `--html --${t}-storage-file ${htmlScriptsDir}/initial_storage.txt`)
		);
	});
});

describe("multi-exec", function() {
	this.timeout(3000);

	let run_multiexec_script_and_check_output = (testScript, checkOutput, extraArgsStr = "") =>
		run_script_and_check_output(`${multiexScriptsDir}/${testScript}`, checkOutput, extraArgsStr);

	//testing AST transformations work as expected
	it(
		"should skip and log break statements",
		run_multiexec_script_and_check_output("break.js", (stdout) => {
			assert(stdout.includes(`Script output: "0"`));
			assert(stdout.includes(`Script output: "1"`));
			assert(stdout.includes(`break (SKIPPED)`));
		}, "--multi-exec --no-multi-exec-loop")
	);
	it(
		"should skip and log continue statements",
		run_multiexec_script_and_check_output("continue.js", (stdout) => {
			assert(stdout.includes(`Script output: 0`));
			assert(stdout.includes(`Script output: 1`));
			assert(stdout.includes(`continue (SKIPPED)`));
		}, "--multi-exec --no-multi-exec-loop")
	);
	it(
		"should skip and log if statements",
		run_multiexec_script_and_check_output("if_test.js", (stdout) => {
			assert(stdout.includes(`if (3 === 3)`));
			assert(stdout.includes(`first branch`));
			assert(stdout.includes(`if (7 === 7)`));
			assert(stdout.includes(`second branch`));
			assert(stdout.includes(`else`));
			assert(stdout.includes(`third branch`));
		}, "--multi-exec")
	);
	it(
		"should skip and log one branch if statements",
		run_multiexec_script_and_check_output("simple_if_test.js", (stdout) => {
			assert(stdout.includes(`if (1 + 2 == 3)`));
			assert(stdout.includes(`First branch`));
			assert(stdout.includes(`if (1 + 2 == 3)`));
		}, "--multi-exec")
	);
	it(
		"should skip and log switch statements",
		run_multiexec_script_and_check_output("switch_test.js", (stdout) => {
			assert(stdout.includes(`switch (x)`));
			assert(stdout.includes(`case (0):`));
			assert(stdout.includes(`first case`));
			assert(stdout.includes(`break (SKIPPED)`));
			assert(stdout.includes(`case (1):`));
			assert(stdout.includes(`second case`));
			assert(stdout.includes(`break (SKIPPED)`));
			assert(stdout.includes(`default:`));
			assert(stdout.includes(`default case`));
			assert(stdout.includes(`} (EXITED switch (x))`));
		}, "--multi-exec")
	);
	it(
		"should skip and log try catch statements",
		run_multiexec_script_and_check_output("trycatch.js", (stdout) => {
			assert(stdout.includes(`try {`));
			assert(stdout.includes(`try statement`));
			assert(stdout.includes(`} catch {`));
			assert(stdout.includes(`catch statement`));
			assert(stdout.includes(`} (EXITED CATCH CLAUSE)`));
		}, "--multi-exec")
	);
	it(
		"should skip and log try catch finally statements",
		run_multiexec_script_and_check_output("trycatchfinally.js", (stdout) => {
			assert(stdout.includes(`try {`));
			assert(stdout.includes(`"1"`));
			assert(stdout.includes(`} catch {`));
			assert(stdout.includes(`"2"`));
			assert(stdout.includes(`} (EXITED CATCH CLAUSE)`));
			assert(stdout.includes(`} finally {`));
			assert(stdout.includes(`"3"`));
			assert(stdout.includes(`} (EXITED FINALLY CLAUSE)`));
		}, "--multi-exec")
	);
	it(
		"should force the body of while statements with false conditonals",
		run_multiexec_script_and_check_output("while_test.js", (stdout) => {
			assert(stdout.includes(`while (i > 1) { (FORCED EXECUTION OF WHILE BODY)`));
			assert(stdout.includes(`"TEST PASS: forced execution of while body successful"`));
			assert(stdout.includes(`} (EXITED FORCED EXECUTION OF BODY OF while (i > 1))`));
			assert(stdout.includes(`while (i > 1) {`));
			assert(stdout.includes(`} (EXITED while (i > 1))`));
		}, "--multi-exec")
	);
	it(
		"should let do while statements run normally",
		run_multiexec_script_and_check_output("do_while_test.js", (stdout) => {
			assert(stdout.includes(`do {`));
			assert(stdout.includes(`do while loop iteration 0`));
			assert(stdout.includes(`do while loop iteration 1`));
			assert(stdout.includes(`} while (i < 2) (EXITED)`));
		}, "--multi-exec")
	);
	it(
		"should force execution of for loop bodies if test is false, or otherwise let it run normally",
		run_multiexec_script_and_check_output("for_test.js", (stdout) => {
			assert(stdout.includes(`for (var i = 0;; i < -1; i++;) { (FORCED EXECUTION OF FOR BODY)`));
			assert(stdout.includes(`"First test passed"`));
			assert(stdout.includes(`} (EXITED FORCED EXECUTION OF BODY OF for (var i = 0;; i < -1; i++;))`));
			assert(stdout.includes(`for (var i = 0;; i < -1; i++;)`));
			assert(stdout.includes(`} (EXITED for (var i = 0;; i < -1; i++;))`));
			assert(stdout.includes(`for (var i = 0;; i < 2; i++;)`));
			assert(stdout.includes(`"FOR body loop 0"`));
			assert(stdout.includes(`"FOR body loop 1"`));
			assert(stdout.includes(`} (EXITED for (var i = 0;; i < 2; i++;))`));
		}, "--multi-exec")
	);
	it(
		"should try to force execution of for in body but let the for in loop run after like normal if forcing doesn't work",
		run_multiexec_script_and_check_output("for_in_test.js", (stdout) => {
			assert(stdout.includes(`for (var i; in x) (ATTEMPTING TO FORCE EXECUTION OF BODY)`));
			assert(stdout.includes(`undefined`));
			assert(stdout.includes(`} (ATTEMPT TO FORCE EXECUTION OF for (var i; in x) SUCCEEDED)`));
			assert(stdout.includes(`for (var i; in x) {`));
			assert(stdout.includes(`"0"`));
			assert(stdout.includes(`"1"`));
			assert(stdout.includes(`"2"`));
			assert(stdout.includes(`} (EXITED for (var i; in x))`));
		}, "--multi-exec")
	);
	it(
		"should try to force execution of for of body but let the for of loop run after like normal if forcing doesn't work",
		run_multiexec_script_and_check_output("for_of.js", (stdout) => {
			assert(stdout.includes(`for (let i; in []) (ATTEMPTING TO FORCE EXECUTION OF BODY)`));
			assert(stdout.includes(`test`));
			assert(stdout.includes(`} (ATTEMPT TO FORCE EXECUTION OF for (let i; in []) SUCCEEDED)`));
			assert(stdout.includes(`for (let i; in []) {`));
			assert(stdout.includes(`} (EXITED for (let i; in []))`));
		}, "--multi-exec")
	);
	it(
		"should force execution of the for in body where the conditional doesn't cause any loops",
		run_multiexec_script_and_check_output("for_in_test_2.js", (stdout) => {
			assert(stdout.includes(`for (var i; in x) (ATTEMPTING TO FORCE EXECUTION OF BODY)`));
			assert(stdout.includes(`EXECUTED BODY`));
			assert(stdout.includes(`} (ATTEMPT TO FORCE EXECUTION OF for (var i; in x) SUCCEEDED)`));
			assert(stdout.includes(`for (var i; in x) {`));
			assert(stdout.includes(`} (EXITED for (var i; in x))`));
		}, "--multi-exec")
	);
	//function tests
	it(
		"should log that a function was called and that it exited with no return value if it just does return;",
		run_multiexec_script_and_check_output("functions/simple_function_test.js", (stdout) => {
			assert(stdout.includes(`test() GOT CALLED`));
			assert(stdout.includes(`EXITED FUNCTION test() WITH NO RETURN VALUE`));
		}, "--multi-exec")
	);
	it(
		"should log that a function was called and that it exited with no return value if it didn't have a return statement",
		run_multiexec_script_and_check_output("functions/no_return.js", (stdout) => {
			assert(stdout.includes(`test() GOT CALLED`));
			assert(stdout.includes(`"No return"`));
			assert(stdout.includes(`EXITED FUNCTION test() WITH NO RETURN VALUE`));
		}, "--multi-exec")
	);
	it(
		"should log that a function was called and that it exited with it's return value",
		run_multiexec_script_and_check_output("functions/simple_return_val.js", (stdout) => {
			assert(stdout.includes(`test() GOT CALLED`));
			assert(stdout.includes(`EXITED FUNCTION test() WITH RETURN VALUE: TEST RETURN VALUE`));
		}, "--multi-exec")
	);
	it(
		"should log the different return values that are being skipped within the function and the final return value",
		run_multiexec_script_and_check_output("functions/multiple_returns.js", (stdout) => {
			assert(stdout.includes(`test(1) GOT CALLED`));
			assert(stdout.includes(`return 0 (SKIPPED WITH VALUE: 0)`));
			assert(stdout.includes(`return 5 (SKIPPED WITH VALUE: 5)`));
			assert(stdout.includes(`EXITED FUNCTION test(1) WITH RETURN VALUE: 3`));
		}, "--multi-exec")
	);
	it(
		"should log the different return values that are being skipped within the function and the final return value even if they are different types",
		run_multiexec_script_and_check_output("functions/multiple_returns_diff_types.js", (stdout) => {
			assert(stdout.includes(`test(1) GOT CALLED`));
			assert(stdout.includes(`return 3 (SKIPPED WITH VALUE: 3)`));
			assert(stdout.includes(`return 5 (SKIPPED WITH VALUE: 5)`));
			assert(stdout.includes(`EXITED FUNCTION test(1) WITH NO RETURN VALUE`));
		}, "--multi-exec")
	);
	it(
		"should be able to log nested function calls",
		run_multiexec_script_and_check_output("functions/multiple_functions.js", (stdout) => {
			assert(stdout.includes(`test() GOT CALLED`));
			assert(stdout.includes(`test2() GOT CALLED`));
			assert(stdout.includes(`EXITED FUNCTION test2() WITH RETURN VALUE: 1`));
			assert(stdout.includes(`EXITED FUNCTION test() WITH RETURN VALUE: 1`));
		}, "--multi-exec")
	);
	it(
		"should be able to log nested function calls with multiple returns in them",
		run_multiexec_script_and_check_output("functions/multiple_functions_4.js", (stdout) => {
			assert(stdout.includes(`test1() GOT CALLED`));
			assert(stdout.includes(`test2() GOT CALLED`));
			assert(stdout.includes(`return 'SHOULDSKIP1' (SKIPPED WITH VALUE: SHOULDSKIP1`));
			assert(stdout.includes(`test3() GOT CALLED`));
			assert(stdout.includes(`return 'SHOULDSKIP2' (SKIPPED WITH VALUE: SHOULDSKIP2`));
			assert(stdout.includes(`test4() GOT CALLED`));
			assert(stdout.includes(`return 'SHOULDSKIP3' (SKIPPED WITH VALUE: SHOULDSKIP3`));
			assert(stdout.includes(`EXITED FUNCTION test4() WITH RETURN VALUE: FINALRETURNVALUE`));
			assert(stdout.includes(`EXITED FUNCTION test3() WITH RETURN VALUE: FINALRETURNVALUE`));
			assert(stdout.includes(`EXITED FUNCTION test2() WITH RETURN VALUE: FINALRETURNVALUE`));
			assert(stdout.includes(`EXITED FUNCTION test1() WITH RETURN VALUE: FINALRETURNVALUE`));
		}, "--multi-exec")
	);
	//event tests
	it(
		"should not force execution of events if command line argument --no-multi-exec-events",
		run_multiexec_script_and_check_output("events/no-multi-exec-events.js", (stdout) => {
			assert(!stdout.includes(`Script output: "test failed"`));
		}, "--multi-exec --no-multi-exec-events")
	);
	it(
		"should force execution of events added to document through addEventListener",
		run_multiexec_script_and_check_output("events/document_add_event.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.addEventListener`));
			assert(stdout.includes(`Script output: "event ran"`));
			assert(stdout.includes(`END FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.addEventListener`));
		}, "--multi-exec")
	);
	it(
		"should force execution of events added to document through .on<event>",
		run_multiexec_script_and_check_output("events/document_add_on_event.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.onclick`));
			assert(stdout.includes(`Script output: "event ran"`));
			assert(stdout.includes(`END FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.onclick`));
		}, "--multi-exec")
	);
	it(
		"should work through addEventListener events that throw errors, skipping errors like other code",
		run_multiexec_script_and_check_output("events/document_add_error_throwing_event.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.addEventListener.click`));
			assert(stdout.includes(`Script output: "got to end of event code anyway"`));
			assert(stdout.includes(`END FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.addEventListener.click`));
		}, "--multi-exec")
	);
	it(
		"should work through attribute events that throw errors, skipping errors like other code",
		run_multiexec_script_and_check_output("events/document_add_on_error_event.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.onclick`));
			assert(stdout.includes(`Script output: "got to end of event (test pass)"`));
			assert(stdout.includes(`END FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.onclick`));
		}, "--multi-exec")
	);
	it(
		"should force events added to new HTMLElements",
		run_multiexec_script_and_check_output("events/button_add_event.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.createElement(button).addEventListener`));
			assert(stdout.includes(`Script output: "addEventListener works"`));
			assert(stdout.includes(`Script output: "attribute works"`));
			assert(stdout.includes(`Script output: "skipping errors works"`));
			assert(stdout.includes(`END FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.document.createElement(button).addEventListener`));
		}, "--multi-exec")
	);
	it(
		"should force events added to window",
		run_multiexec_script_and_check_output("events/window_add_event.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.addEventListener`));
			assert(stdout.includes(`Script output: "addEventListener works"`));
			assert(stdout.includes(`Script output: "attribute works"`));
			assert(stdout.includes(`Script output: "skipping errors works"`));
			assert(stdout.includes(`END FORCING EXECUTION OF NEW EVENT REGISTERED FOR window.addEventListener`));
		}, "--multi-exec")
	);
	//setTimeout/setInterval
	it(
		"should force new setTimeout calls immediately",
		run_multiexec_script_and_check_output("events/setTimeout.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF setTimeout((code in snippet setTimeout_1_), 1000000)`));
			assert(stdout.includes(`Script output: "test passed"`));
			assert(stdout.includes(`END FORCING EXECUTION OF setTimeout((code in snippet setTimeout_1_), 1000000)`));
		}, "--multi-exec")
	);
	it(
		"should force new setTimeout calls immediately, skipping over errors that are thrown",
		run_multiexec_script_and_check_output("events/setTimeout_error.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF setTimeout((code in snippet setTimeout_1_), 1000000)`));
			assert(stdout.includes(`SKIPPED ERROR IN GLOBAL SCOPE: ReferenceError: undefinedthing is not defined at g(undefinedthing);`));
			assert(stdout.includes(`SKIPPED ERROR IN GLOBAL SCOPE: ReferenceError: anotherundefinedthing is not defined at g(anotherundefinedthing)`));
			assert(stdout.includes(`Script output: "test passed"`));
			assert(stdout.includes(`END FORCING EXECUTION OF setTimeout((code in snippet setTimeout_1_), 1000000)`));
		}, "--multi-exec")
	);
	it(
		"should force new setTimeout calls immediately with the code passed as a string, skipping over errors that are thrown",
		run_multiexec_script_and_check_output("events/setTimeout_string_error.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF setTimeout((code in snippet setTimeout_1_), 1000000)`));
			assert(stdout.includes(`SKIPPED ERROR IN AN EVAL CALL: ReferenceError: undefinedthing is not defined at (undefinedthing);`));
			assert(stdout.includes(`SKIPPED ERROR IN AN EVAL CALL: ReferenceError: anotherundefinedthing is not defined at g(anotherundefinedthing)`));
			assert(stdout.includes(`Script output: "test passed"`));
			assert(stdout.includes(`END FORCING EXECUTION OF setTimeout((code in snippet setTimeout_1_), 1000000)`));
		}, "--multi-exec")
	);
	it(
		"should force new setInterval calls immediately",
		run_multiexec_script_and_check_output("events/setInterval.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF setInterval((code in snippet setInterval_1_), 1000)`));
			assert(stdout.includes(`Script output: "test passed"`));
			assert(stdout.includes(`END FORCING EXECUTION OF setInterval((code in snippet setInterval_1_), 1000)`));
		}, "--multi-exec")
	);
	it(
		"should force new setInterval calls immediately, skipping over errors that are thrown",
		run_multiexec_script_and_check_output("events/setInterval_error.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF setInterval((code in snippet setInterval_1_), 1000)`));
			assert(stdout.includes(`SKIPPED ERROR IN GLOBAL SCOPE: ReferenceError: undefinedthing is not defined at g(undefinedthing)`));
			assert(stdout.includes(`SKIPPED ERROR IN GLOBAL SCOPE: ReferenceError: anotherundefinedthing is not defined at g(anotherundefinedthing)`));
			assert(stdout.includes(`Script output: "test passed"`));
			assert(stdout.includes(`END FORCING EXECUTION OF setInterval((code in snippet setInterval_1_), 1000)`));
		}, "--multi-exec")
	);
	it(
		"should force new setInterval calls immediately with the code passed as a string, skipping over errors that are thrown",
		run_multiexec_script_and_check_output("events/setInterval_string_error.js", (stdout) => {
			assert(stdout.includes(`FORCING EXECUTION OF setInterval((code in snippet setInterval_1_), 1000000)`));
			assert(stdout.includes(`SKIPPED ERROR IN AN EVAL CALL: ReferenceError: undefinedthing is not defined at (undefinedthing);\\nconsole`));
			assert(stdout.includes(`SKIPPED ERROR IN AN EVAL CALL: ReferenceError: anotherundefinedthing is not defined at g(anotherundefinedthing)`));
			assert(stdout.includes(`Script output: "test passed"`));
			assert(stdout.includes(`END FORCING EXECUTION OF setInterval((code in snippet setInterval_1_), 1000000)`));
		}, "--multi-exec")
	);


	//tests for skipping errors
	it(
		"should skip and log an error-causing line and continue executing the rest of the code",
		run_multiexec_script_and_check_output("errors/skiponerror.js", (stdout) => {
			assert(stdout.includes(`*RESTARTING MULTI-EXECUTION AFTER ERROR OCCURRED*`));
			assert(stdout.includes(`Script output: "start of script"`));
			assert(stdout.includes(`SKIPPED ERROR IN GLOBAL SCOPE`));
			assert(stdout.includes(`Script output: "end of script (TEST PASS)"`));
		}, "--multi-exec")
	);
	it(
		"should skip and log multiple error-causing lines and continue executing the rest of the code",
		run_multiexec_script_and_check_output("errors/skipmultipleerrors.js", (stdout) => {
			assert(stdout.includes(`*RESTARTING MULTI-EXECUTION AFTER ERROR OCCURRED*`));
			assert(stdout.includes(`Script output: "end of script reached (test pass)"`));
		}, "--multi-exec")
	);
	it(
		"should skip and log an error caused by an eval and continue executing the rest of the code",
		run_multiexec_script_and_check_output("errors/skipevalerror.js", (stdout) => {
			assert(stdout.includes(`*RESTARTING EVAL CALL AFTER ERROR OCCURRED WITHIN IT*`));
			assert(stdout.includes(`SKIPPED ERROR IN AN EVAL CALL:`));
			assert(stdout.includes(`Script output: "end of script reached (test pass)"`));
		}, "--multi-exec")
	);
	it(
		"should skip and log multiple errors in an eval and continue executing the rest of the eval",
		run_multiexec_script_and_check_output("errors/skiperrorsineval.js", (stdout) => {
			assert(stdout.includes(`*RESTARTING EVAL CALL AFTER ERROR OCCURRED WITHIN IT*`));
			assert(stdout.includes(`SKIPPED ERROR IN AN EVAL CALL: ReferenceError: undefinedFunction is not defined at ;\\nundefinedFunction();\\ncons`));
			assert(stdout.includes(`SKIPPED ERROR IN AN EVAL CALL: ReferenceError: anotherUndefined is not defined at ;\\nanotherUndefined();\\nconso`));
			assert(stdout.includes(`Script output: 1`));
			assert(stdout.includes(`Script output: 2`));
			assert(stdout.includes(`Script output: "end of script reached (test pass)"`));
		}, "--multi-exec")
	);
	it(
		"should log the final instrumented eval code with skipped errors that passed as a snippet",
		run_multiexec_script_and_check_output("errors/skiperrorsineval.js", (stdout) => {
			//assumes previous test has run
			let snippets = get_snippets_object("skiperrorsineval.js", "multi-exec");
			let snippet_names = get_snippets_starting_with(["2_"], snippets);
			let code_snips = read_snippet_files("skiperrorsineval.js", [snippet_names.filter((name) => name.includes("INSTRUMENTED"))[0]], "multi-exec");
			code_snips[0].includes("logMultiexec('SKIPPED ERROR IN AN EVAL CALL");
		}, "--multi-exec")
	);
	it(
		"should skip and log multiple errors even in nested evals and continue executing the rest of the code",
		run_multiexec_script_and_check_output("errors/skipnestedevalerror.js", (stdout) => {
			assert(stdout.includes(`SKIPPED ERROR IN AN EVAL CALL: ReferenceError: undefinedFunction is not defined at ;\\nundefinedFunction();\\ncons`));
			assert(stdout.includes(`SKIPPED ERROR IN AN EVAL CALL: ReferenceError: anotherUndefined is not defined at ;\\nanotherUndefined();\\nconso`));
			assert(stdout.includes(`Script output: 1`));
			assert(stdout.includes(`Script output: 2`));
			assert(stdout.includes(`Script output: 3`));
			assert(stdout.includes(`Script output: 4`));
			assert(stdout.includes(`Script output: "end of script reached (test pass)"`));
		}, "--multi-exec")
	);
	it(
		"should log the final instrumented eval code with skipped errors that passed as a snippet for nested evals",
		run_multiexec_script_and_check_output("errors/skipnestedevalerror.js", (stdout) => {
			//assumes previous test has run
			let snippets = get_snippets_object("skipnestedevalerror.js", "multi-exec");
			let snippet_names = get_snippets_starting_with(["2_", "3_"], snippets);
			let code_snips = read_snippet_files("skipnestedevalerror.js", snippet_names.filter((name) => name.includes("INSTRUMENTED")), "multi-exec");
			code_snips[0].includes("logMultiexec('SKIPPED ERROR IN AN EVAL CALL");
			code_snips[1].includes("logMultiexec('SKIPPED ERROR IN AN EVAL CALL");
		}, "--multi-exec")
	);
});

describe("aggregator.js", function() {
	//need a really long timeout for the tests involving symbolic execution mode
	this.timeout(1000000);

	let run_agg_script_and_check_output = (testScript, checkOutput, extraArgsStr = "") =>
		run_script_and_check_output(`${aggScriptsDir}/${testScript}`, checkOutput, extraArgsStr);

	//check that summary folder is made appropriately
	it(
		"should not create a summary folder if only one mode is being run",
		run_test_script_and_check_output("just_console_log.js", (stdout) => {
			assert(!fs.existsSync(`${getTestResultsFolder("just_console_log.js")}summary`));
		})
	);
	it(
		"should create a summary folder if more than one mode has been run",
		run_agg_script_and_check_output("summary_folder_test.js", (stdout) => {
			assert(fs.existsSync(`${getTestResultsFolder("summary_folder_test.js")}summary`));
		}, "--default --multi-exec")
	);
	it(
		"should create a summary folder if only symex mode has run but it has produced multiple contexts",
		run_agg_script_and_check_output("symex_mode_unique_contexts.js", (stdout) => {
			assert(fs.existsSync(`${getTestResultsFolder("symex_mode_unique_contexts.js")}summary`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);

	it(
		"should not copy the contexts.json file from symex mode into summary/unique_contexts.json if there are no unique contexts",
		run_agg_script_and_check_output("symex_mode_no_unique_contexts.js", (stdout) => {
			assert(!fs.existsSync(`${getTestResultsFolder("symex_mode_no_unique_contexts.js")}summary/unique_contexts.json`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);
	it(
		"should copy the contexts.json file from symex mode into summary/unique_contexts.json if there are unique contexts",
		function (done) {
			//assuming that the symex_mode_unique_contexts.js test has run from the previous test above
			assert(fs.existsSync(`${getTestResultsFolder("symex_mode_unique_contexts.js")}summary/sym_ex_contexts.json`))
			done()
		}
	);

	function parse_JSON_file(test_script_name, file_name) {
		return JSON.parse(fs.readFileSync(`${getTestResultsFolder(test_script_name)}summary/${file_name}`));
	}

	//resources
	it(
		"should aggregate resources into summary/unique_resources.json with locations",
		run_agg_script_and_check_output("aggregator_resources.js", (stdout) => {
			let resources = parse_JSON_file("aggregator_resources.js", "unique_resources.json")

			let first_resource = "";
			let second_resource = "";
			for (let r in resources) {
				if (resources[r].location.length === 2) {
					first_resource = r;
				} else {
					second_resource = r;
				}
			}

			assert(resources[first_resource].path === "path1");
			assert(resources[second_resource].path === "path2");

			assert(resources[first_resource].location[0].includes("default"));
			assert(resources[first_resource].location[1].includes("multi-exec"));
			assert(resources[second_resource].location[0].includes("multi-exec"));

			assert(fs.readFileSync(`${getTestResultsFolder("aggregator_resources.js")}summary/unique_resources/${first_resource}`).toString() === "something");
			assert(fs.readFileSync(`${getTestResultsFolder("aggregator_resources.js")}summary/unique_resources/${second_resource}`).toString() === "something else");
		}, "--default --multi-exec")
	);
	//snippets
	it(
		"should aggregate snippets into summary/unique_snippets.json with locations",
		run_agg_script_and_check_output("aggregator_snippets.js", (stdout) => {
			let snippets = parse_JSON_file("aggregator_snippets.js", "unique_snippets.json")

			let first_snippet = Object.keys(snippets).filter((name) => name.startsWith("DOM_1"))[0];
			let second_snippet = Object.keys(snippets).filter((name) => name.startsWith("DOM_2"))[0];

			assert(snippets[first_snippet].as === "JavaScript function found in arg [1] of call of window.document.addEventListener(click, () => 'first', )");
			assert(snippets[second_snippet].as === "JavaScript function found in arg [1] of call of window.document.addEventListener(click, () => 'second', )");

			assert(snippets[first_snippet].location[0].includes("default"));
			assert(snippets[first_snippet].location[1].includes("multi-exec"));
			assert(snippets[second_snippet].location[0].includes("multi-exec"));

			assert(fs.readFileSync(`${getTestResultsFolder("aggregator_snippets.js")}summary/unique_snippets/${first_snippet}`).toString() === "() => 'first'");
			assert(fs.readFileSync(`${getTestResultsFolder("aggregator_snippets.js")}summary/unique_snippets/${second_snippet}`).toString() === "() => 'second'");
		}, "--default --multi-exec")
	);
	//iocs
	it(
		"should aggregate iocs into summary/unique_IOCs.json with locations",
		run_agg_script_and_check_output("aggregator_iocs.js", (stdout) => {
			let iocs = parse_JSON_file("aggregator_iocs.js", "unique_IOCs.json")

			assert(iocs[0].type === "UrlFetch");
			assert(iocs[0].value.method === "GET");
			assert(iocs[0].value.url === "http://document1.php");
			assert(iocs[1].type === "UrlFetch");
			assert(iocs[1].value.method === "GET");
			assert(iocs[1].value.url === "http://document2.php");

			assert(iocs[0].location[0].includes("default"));
			assert(iocs[0].location[1].includes("multi-exec"));
			assert(iocs[1].location[0].includes("multi-exec"));
		}, "--default --multi-exec")
	);
	//urls
	it(
		"should aggregate urls into summary/unique_urls.json with locations",
		run_agg_script_and_check_output("aggregator_urls.js", (stdout) => {
			//parse the unique_urls.json file
			let urls = parse_JSON_file("aggregator_urls.js", "unique_urls.json")
			//check values
			assert(urls.length === 2);
			assert(urls[0].url === "http://document1.php");
			assert(urls[1].url === "http://document2.php");
			//check locations
			assert(urls[0].location[0].includes("default"));
			assert(urls[0].location[1].includes("multi-exec"));
			assert(urls[1].location[0].includes("multi-exec"));
		}, "--default --multi-exec")
	);
	// //active urls
	// it(
	// 	"should aggregate active urls into summary/unique_active_urls.json with locations",
	// 	run_agg_script_and_check_output(".js", (stdout) => {
	// 	})
	// );
	//cookies
	it(
		"should aggregate cookies into summary/unique_cookies.json with locations",
		run_agg_script_and_check_output("aggregator_cookie_test.js", (stdout) => {
			let cookies = parse_JSON_file("aggregator_cookie_test.js", "unique_cookies.json");

			assert(cookies.length === 2);
			assert(cookies[0].key === "test");
			assert(cookies[0].value === "value");
			assert(cookies[1].key === "test2");
			assert(cookies[1].value === "value3");

			assert(cookies[0].location[0].includes("default"));
			assert(cookies[0].location[1].includes("multi-exec"));
			assert(cookies[1].location[0].includes("multi-exec"));
		}, "--default --multi-exec")
	);
	//localStorage and sessionStorage
	["local", "session"].forEach((t) => {
		it(
			`should aggregate ${t}Storage into summary/unique_${t}Storage.json with locations`,
			run_agg_script_and_check_output(`aggregator_${t}Storage.js`, (stdout) => {
				let storage = parse_JSON_file(`aggregator_${t}Storage.js`, `unique_${t}Storage.json`);

				assert(storage.key1.value === "value1");
				assert(storage.key2.value === "value2");

				assert(storage.key2.location[0].includes("default"));
				assert(storage.key2.location[1].includes("multi-exec"));
				assert(storage.key1.location[0].includes("multi-exec"));

			}, "--default --multi-exec")
		);
	})
});

describe("sym-exec", function() {
	this.timeout(1000000);

	let run_symex_script_and_check_output = (testScript, checkOutput, extraArgsStr = "") =>
		run_script_and_check_output(`${symexScriptsDir}/${testScript}`, checkOutput, extraArgsStr);


	//DOM symbolic tracking
	it(
		"should symbolically track the specified window's properties and set them appropriately in the specific execution context",
		run_symex_script_and_check_output("window_property_symex.js", (stdout) => {
			assert(stdout.includes(`Script output: "Default branch"`));
			assert(stdout.includes(`Script output: "Symex found the innerHeight branch."`));
			assert(stdout.includes(`Script output: "Symex found the other branch (test works)."`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);
	it(
		"should symbolically track the specified navigator's properties and set them appropriately in the specific execution context",
		run_symex_script_and_check_output("navigator.js", (stdout) => {
			assert(stdout.includes(`Script output: "Default branch"`));
			assert(stdout.includes(`Script output: "Found the navigator.language branch"`));
			assert(stdout.includes(`Script output: "Found navigator.webdriver branch"`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);
	it(
		"should symbolically track the specified navigator.userAgentData properties and set them appropriately in the specific execution context",
		run_symex_script_and_check_output("userAgentData.js", (stdout) => {
			assert(stdout.includes(`Script output: "Default branch reached."`));
			assert(stdout.includes(`Script output: "mobile branch reached."`));
			assert(stdout.includes(`Script output: "platform branch reached."`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);
	it(
		"should symbolically track the specified navigator.plugins.plugin properties and set them appropriately in the specific execution context",
		run_symex_script_and_check_output("plugins.js", (stdout) => {
			assert(stdout.includes(`Script output: "Found plugin description branch"`));
			assert(stdout.includes(`Script output: "Found plugin name branch"`));
			assert(stdout.includes(`Script output: "Found default branch"`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);
	it(
		"should symbolically track the specified navigator.mimetypes.mimetype properties and set them appropriately in the specific execution context",
		run_symex_script_and_check_output("mimetypes.js", (stdout) => {
			assert(stdout.includes(`Script output: "Found testtype branch"`));
			assert(stdout.includes(`Script output: "Found fakedescription branch"`));
			assert(stdout.includes(`Script output: "Found default branch"`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);
	it(
		"should symbolically track the navigator.userAgent and set it as the jsdom user agent",
		run_symex_script_and_check_output("useragent.js", (stdout) => {
			assert(stdout.includes(`Script output: "test passed"`));
			assert(stdout.includes(`Script output: "default branch"`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);
	it(
		"should symbolically track the specified document properties and set it correctly in the jsdom emulation",
		run_symex_script_and_check_output("document.js", (stdout) => {
			assert(stdout.includes(`Script output: "document.title branch reached"`));
			assert(stdout.includes(`Script output: "document.hidden branch reached"`));
			assert(stdout.includes(`Script output: "document.hasFocus branch reached"`));
			assert(stdout.includes(`Script output: "default branch reached"`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);
	it(
		"should symbolically track the specified screen properties and set it correctly in the jsdom emulation",
		run_symex_script_and_check_output("screen.js", (stdout) => {
			assert(stdout.includes(`Script output: "reached screen height"`));
			assert(stdout.includes(`Script output: "reached screen pixelDepth"`));
			assert(stdout.includes(`Script output: "default branch reached"`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);
	it(
		"should symbolically track the specified location properties and set it correctly in the jsdom emulation",
		run_symex_script_and_check_output("location.js", (stdout) => {
			assert(stdout.includes(`Script output: "location.hostname branch"`));
			assert(stdout.includes(`Script output: "location.hash branch"`));
			assert(stdout.includes(`Script output: "default branch"`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);

	it(
		"should rewrite the code to be wrapped in try/catch statements so that unimplemented API functions don't stop the symbolic exec",
		run_symex_script_and_check_output("symex_wrap_trycatch.js", (stdout) => {
			assert(stdout.includes(`Script output: 1`));
			assert(stdout.includes(`Script output: 2`));
		}, "--sym-exec --no-sym-exec-activex --timeout 1000")
	);


	//activex testing
	it(
		"should symbolically track the filesystemobject's fileexists property",
		run_symex_script_and_check_output("activex/filesystemobject.js", (stdout) => {
			assert(stdout.includes(`Script output: "FILE EXISTS BRANCH"`));
			assert(stdout.includes(`Script output: "NO FILE EXISTS BRANCH"`));
			assert(stdout.includes(`Script output: "folder EXISTS BRANCH"`));
			assert(stdout.includes(`Script output: "NO folder EXISTS BRANCH"`));
			assert(stdout.includes(`Script output: "BUFFER BRANCH"`));
			assert(stdout.includes(`Script output: "NO BUFFER BRANCH"`));
		}, "--sym-exec --no-sym-exec-dom --timeout 1000")
	);
	it(
		"should symbolically track the MSXML2.XMLHTTP's status and response property",
		run_symex_script_and_check_output("activex/xmlhttp.js", (stdout) => {
			assert(stdout.includes(`Script output: "first branch"`));
			assert(stdout.includes(`Script output: "second branch"`));
		}, "--sym-exec --no-sym-exec-dom --timeout 1000")
	);
	it(
		"should symbolically track the wscript.shell's appdata property",
		run_symex_script_and_check_output("activex/wscriptshell.js", (stdout) => {
			assert(stdout.includes(`Script output: "first branch"`));
			assert(stdout.includes(`Script output: "second branch"`));
		}, "--sym-exec --no-sym-exec-dom --timeout 1000")
	);
	it(
		"should symbolically track the adodb.stream's properties and buffer",
		run_symex_script_and_check_output("activex/adodbstream.js", (stdout) => {
			assert(stdout.includes(`Script output: "Got position right"`));
			assert(stdout.includes(`Script output: "Got charset right"`));
			assert(stdout.includes(`Script output: "Got it"`));
		}, "--sym-exec --no-sym-exec-dom --timeout 1000")
	);
	it(
		"should symbolically track the wscript.proxy's properties",
		run_symex_script_and_check_output("activex/wscript.js", (stdout) => {
			assert(stdout.includes(`Script output: "SYMEX WORKS"`));
			assert(stdout.includes(`Script output: "SYMEX WORKS2"`));
			assert(stdout.includes(`Script output: "SYMEX WORKS3"`));
			assert(stdout.includes(`Script output: "SYMEX WORKS4"`));
			assert(stdout.includes(`Script output: "SYMEX WORKS5"`));
		}, "--sym-exec --no-sym-exec-dom --timeout 1000")
	);
	it(
		"should symbolically track the wmi's properties",
		run_symex_script_and_check_output("activex/wmi.js", (stdout) => {
			assert(stdout.includes(`Script output: "computersystem branch"`));
			assert(stdout.includes(`Script output: "networkadapterconfiguration branch"`));
			assert(stdout.includes(`Script output: "operatingsystem branch"`));
			assert(stdout.includes(`Script output: "processstoptrace branch"`));
		}, "--sym-exec --no-sym-exec-dom --timeout 1000")
	);
});