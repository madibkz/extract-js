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
	this.timeout(10000);
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

describe("DOM", function() {
	this.timeout(10000);

	let run_dom_script_and_check_output = (testScript, checkOutput, extraArgsStr = "") =>
		run_script_and_check_output(`${domScriptsDir}/${testScript}`, checkOutput, extraArgsStr);

	function check_snippets(test_script_name, list_of_start_snippet_strs, list_of_as_values, list_of_snippet_values) {
		function get_snippets_object(test_script_name)  {
			let path_to_snippets_json = `${getTestResultsFolder(test_script_name)}default/snippets.json`;
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

		function read_snippet_files(test_script_name, list_of_snippet_file_names) {
			let code_snips = [];
			for (let i in list_of_snippet_file_names) {
				code_snips.push(fs.readFileSync(`${getTestResultsFolder(test_script_name)}default/snippets/${list_of_snippet_file_names[i]}`, "utf8"));
			}
			return code_snips;
		}

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
			assert(stdout.includes(`Script output: "https://example.org"`));
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
			assert(stdout.includes(
`[info] DOM: Code called setTimeout(100, () => (fun => {
    return function () {
        if (fun == eval)
            arguments[0] = rewrite(arguments[0], true);
        return fun.apply(console, arguments);
    };
})(console.log)('setTimeout function'), )
[info] DOM: Code called setInterval(100, () => (fun => {
    return function () {
        if (fun == eval)
            arguments[0] = rewrite(arguments[0], true);
        return fun.apply(console, arguments);
    };
})(console.log)('setInterval function'), )`
			));
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


	//cookies
	it(
		"should log in dom_logs.json/stdout when document.cookie is read or a cookie is added",
		run_dom_script_and_check_output("cookie_read_and_add_test.js", (stdout) => {
			assert(stdout.includes(`Code called cookieJar.getCookieStringSync(https://example.org/, [object Object], )`));
			assert(stdout.includes(`Code called cookieJar.setCookieSync(username=garfield;, https://example.org/, [object Object], )`));
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
				["setTimeout call", "setInterval call"],
				["() => 'some code setTimeout'", "() => 'some code setInterval'"]
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

describe("aggregator.js", function() {
	//need a really long timeout for the tests involving symbolic execution mode
	this.timeout(100000);

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
		}, "--sym-exec --no-sym-exec-activex")
	);

	it(
		"should not copy the contexts.json file from symex mode into summary/unique_contexts.json if there are no unique contexts",
		run_agg_script_and_check_output("symex_mode_no_unique_contexts.js", (stdout) => {
			assert(!fs.existsSync(`${getTestResultsFolder("symex_mode_no_unique_contexts.js")}summary/unique_contexts.json`));
		}, "--sym-exec --no-sym-exec-activex")
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
			assert(urls[0][0] === "http://document1.php");
			assert(urls[1][0] === "http://document2.php");
			//check locations
			assert(urls[0][1][0].includes("default"));
			assert(urls[0][1][1].includes("multi-exec"));
			assert(urls[1][1][0].includes("multi-exec"));
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
