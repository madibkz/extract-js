//const Blob = require("cross-blob");
const lib = require("./lib");
const escodegen = require("escodegen");
const acorn = require("acorn");
const fs = require("fs");
const iconv = require("iconv-lite");
const path = require("path");
const {VM} = require("vm2");
//const {NodeVM} = require('vm2');
const child_process = require("child_process");
const argv = require("./argv.js").run;
const jsdom = require("jsdom");
const JSDOM = jsdom.JSDOM;
const traverse = require("./utils.js").traverse
const logged_dom_vals = require("./logged_dom_values");

const filename = process.argv[2];
const directory = process.argv[3];
const mode = process.argv[4];
const default_enabled = mode === "default";
const multi_exec_enabled = mode === "multi-exec";
const sym_exec_enabled = mode === "sym-exec";

// JScriptMemberFunctionStatement plugin registration
require("./patches/prototype-plugin.js")(acorn.Parser);

lib.debug("Analysis launched: " + JSON.stringify(process.argv));
lib.verbose("extract-js version: " + require("./package.json").version);

let git_path = path.join(__dirname, ".git");
if (fs.existsSync(git_path) && fs.lstatSync(git_path).isDirectory()) {
    lib.verbose("Commit: " + fs.readFileSync(path.join(__dirname, ".git/refs/heads/master"), "utf8").replace(/\n/, ""));
} else {
    lib.verbose("No git folder found.");
}
lib.verbose(`Analyzing ${filename}`, false);
const sampleBuffer = fs.readFileSync(filename);
let encoding;
if (argv.encoding) {
    lib.debug("Using argv encoding");
    encoding = argv.encoding;
} else {
    lib.debug("Using detected encoding");
    encoding = require("jschardet").detect(sampleBuffer).encoding;
    if (encoding === null) {
        lib.warning("jschardet (v" + require("jschardet/package.json").version + ") couldn't detect encoding, using UTF-8");
        encoding = "utf8";
    } else {
        lib.debug("jschardet (v" + require("jschardet/package.json").version + ") detected encoding " + encoding);
    }
}

//READ CODE
let code = iconv.decode(sampleBuffer, encoding);

if (code.match("<job") || code.match("<script")) { // The sample may actually be a .wsf, which is <job><script>..</script><script>..</script></job>.
    lib.debug("Sample seems to be WSF");
    code = code.replace(/<\??\/?\w+( [\w=\"\']*)*\??>/g, ""); // XML tags
    code = code.replace(/<!\[CDATA\[/g, "");
    code = code.replace(/\]\]>/g, "");
}

let numberOfExecutedSnippets = 1;
const originalInputScript = code;

lib.logJS(originalInputScript, `${numberOfExecutedSnippets}_input_script`, "", false, null, "INPUT SCRIPT", true);

//*INSTRUMENTING CODE*
code = rewrite(code);

code = prepend_users_prepend_code(code);

// prepend patch code
code = fs.readFileSync(path.join(__dirname, "patch.js"), "utf8") + code;
code = "ReferenceError.prototype.toString = function() { return \"[object Error]\";};\n\n" + code;

// append more code
code += "\n\n" + fs.readFileSync(path.join(__dirname, "appended-code.js"));

//*END INSTRUMENTING CODE*

lib.logJS(code, `${numberOfExecutedSnippets}_input_script_INSTRUMENTED`, "", false, null, "INPUT SCRIPT", false);

Array.prototype.Count = function() {
    return this.length;
};


// See https://github.com/nodejs/node/issues/8071#issuecomment-240259088
// It will prevent console.log from calling the "inspect" property,
// which can be kinda messy with Proxies
require("util").inspect.defaultOptions.customInspect = false;

let multiexec_indent = "";


if (default_enabled || multi_exec_enabled) {
    const sandbox = make_sandbox();
    run_in_vm(code, sandbox);
} else if (sym_exec_enabled) {
    let sym_exec_script = prepend_users_prepend_code(originalInputScript);
    sym_exec_script = prepend_sym_exec_script(sym_exec_script);
    sym_exec_script = rewrite_code_for_symex_script(sym_exec_script);

    //write script to temp file
    let tmp_filename = "./tmpsymexscript";
    let tmp_path = `${tmp_filename}.js`;
    fs.writeFileSync(tmp_path, sym_exec_script);
    //log script
    lib.logJS(sym_exec_script, `input_script_SYM_EX_INSTRUMENTED`, "", false, null, "INPUT SCRIPT INSTRUMENTED FOR SYMBOLIC EXECUTION", false);

    let expose_output_path = path.resolve(directory + "expose_out.json");
    //run expose on temp file
    let expose_result = child_process.spawnSync(`./ExpoSE/expoSE`, [tmp_path], {
        shell: true,
        env: {
            //EXPOSE_PRINT_COVERAGE: 1, TODO: format print coverage to show coverage in txt file format
            EXPOSE_JSON_PATH: expose_output_path
        }
    });

    //delete tmpsymexscript.js and other tmp files from expose since we're done with it
    fs.unlinkSync(tmp_path);
    try {
        fs.unlinkSync(tmp_filename + "_jalangi_.js");
        fs.unlinkSync(tmp_filename + "_jalangi_.json");
    } catch (e) {
        lib.error("(SYM-EXEC MODE) Error: The symbolic execution engine (ExpoSE) has failed");
        throw e;
    }

    //read/log info from results of expose
    fs.writeFileSync(directory + "expose_output.log", expose_result.stdout);
    let expose_json_results = JSON.parse(fs.readFileSync(expose_output_path, "utf8"));
    let ran_inputs = {};

    //run analysis for each combination of input
    for (let i = 0; i < expose_json_results.done.length; i++) {
        numberOfExecutedSnippets = 1;
        let input = expose_json_results.done[i].input;
        //Make new folder for this new input, change directory of logging to be in this folder now
        lib.new_symex_log_context(i, input);

        let unique_context = {};
        for (let field in input) { //only include unique values in context
            if (input.hasOwnProperty(field)) {
                if (!is_default_sym_exec_value(input[field]) && field !== "_bound") {
                    unique_context[field] = input[field];
                }
            }
        }
        //Write to file that this input is associated to this folder
        ran_inputs[i] = {
            "unique_context": unique_context,
            "execution folder": `./executions/${i}`
        };
        fs.writeFileSync(directory + "contexts.json",
            "//unique_context only shows the non-default variables found\n//look at the folder for the full context\n" + JSON.stringify(ran_inputs, null, 4));

        //Run sandbox for this input combination
        const sandbox = make_sandbox(input);
        //pass true to make them run in vm2 rather than jsdom for now
        run_in_vm(code, sandbox, true);
    }
}

function is_default_sym_exec_value(o) {
    if (Array.isArray(o)) {
        return o.length === 0 || is_default_sym_exec_value(o[0]);
    } else if (typeof o === "string" && o === "") {
        return true
    } else if (typeof o === "number" && o == 0) {
        return true;
    } else if (typeof o === "boolean" && o === false) {
        return true;
    } else if (typeof o === "object" && o === Object.keys(o).length) { //check if empty object
        return true;
    }
    return false;
}

function prepend_sym_exec_script(sym_exec_script) {
    let prepend_sym_script = fs.readFileSync("./patches/symexec/prepend_sym_script.js", "utf-8");

    if (argv["no-sym-exec-activex"])
        prepend_sym_script = prepend_sym_script.replace(/let activex_symbolize = true/, "let activex_symbolize = false");

    if (argv["no-sym-exec-activex-buffers"])
        prepend_sym_script = prepend_sym_script.replace(/let activex_buffers_symbolize = true/, "let activex_buffers_symbolize = false");

    sym_exec_script = prepend_sym_script + "\n\n//END OF PATCHING\n" + sym_exec_script;

    return sym_exec_script;
}

function rewrite(code) {
    if (code.match("@cc_on")) {
        lib.debug("Code uses conditional compilation");
        if (!argv["no-cc_on-rewrite"]) {
            code = code
                .replace(/\/\*@cc_on/gi, "")
                .replace(/@cc_on/gi, "")
                .replace(/\/\*@/g, "\n").replace(/@\*\//g, "\n");
            // "@if" processing requires m4 and cc, but don't require them otherwise
            if (/@if/.test(code)) {
                /*
                	"@if (cond) source" becomes "\n _boxjs_if(cond)" with JS
                	"\n _boxjs_if(cond)" becomes "\n #if (cond) \n source" with m4
                	"\n #if (cond) \n source" becomes "source" with the C preprocessor
                */
                code = code
                    .replace(/@if\s*/gi, "\n_boxjs_if")
                    .replace(/@elif\s*/gi, "\n_boxjs_elif")
                    .replace(/@else/gi, "\n#else\n")
                    .replace(/@end/gi, "\n#endif\n")
                    .replace(/@/g, "_boxjs_at");
                // Require m4, cc
                if (lacksBinary("cc")) lib.kill("You must install a C compiler (executable 'cc' not found).");
                if (lacksBinary("m4")) lib.kill("You must install m4.");
                code = `
define(\`_boxjs_if', #if ($1)\n)
define(\`_boxjs_elif', #elif ($1)\n)
` + code;
                lib.info("    Replacing @cc_on statements (use --no-cc_on-rewrite to skip)...", false);
                const outputM4 = child_process.spawnSync("m4", [], {
                    input: code
                });
                const outputCc = child_process.spawnSync("cc", [
                    "-E", "-P", // preprocess, don't compile
                    "-xc", // read from stdin, lang: c
                    "-D_boxjs_at_x86=1", "-D_boxjs_at_win16=0", "-D_boxjs_at_win32=1", "-D_boxjs_at_win64=1", // emulate Windows 32 bit
                    "-D_boxjs_at_jscript=1",
                    "-o-", // print to stdout
                    "-", // read from stdin
                ], {
                    input: outputM4.stdout.toString("utf8"),
                });
                code = outputCc.stdout.toString("utf8");
            }
            code = code.replace(/_boxjs_at/g, "@");
        } else {
            lib.warn(
                `The code appears to contain conditional compilation statements.
If you run into unexpected results, try uncommenting lines that look like

    /*@cc_on
    <JavaScript code>
    @*/

`
            );
        }
    }

    if (!argv["no-rewrite"]) {
        try {
            lib.verbose("Rewriting code...", false);
            if (argv["dumb-concat-simplify"]) {
                lib.verbose("    Simplifying \"dumb\" concatenations (remove --dumb-concat-simplify to skip)...", false);
                code = code.replace(/'[ \r\n]*\+[ \r\n]*'/gm, "");
                code = code.replace(/"[ \r\n]*\+[ \r\n]*"/gm, "");
            }

            if (argv.preprocess) {
                lib.verbose(`    Preprocessing with uglify-es v${require("uglify-es/package.json").version} (remove --preprocess to skip)...`, false);
                const unsafe = !!argv["unsafe-preprocess"];
                lib.debug("Unsafe preprocess: " + unsafe);
                const result = require("uglify-es").minify(code, {
                    parse: {
                        bare_returns: true, // used when rewriting function bodies
                    },
                    compress: {
                        passes: 3,

                        booleans: true,
                        collapse_vars: true,
                        comparisons: true,
                        conditionals: true,
                        dead_code: true,
                        drop_console: false,
                        evaluate: true,
                        if_return: true,
                        inline: true,
                        join_vars: false, // readability
                        keep_fargs: unsafe, // code may rely on Function.length
                        keep_fnames: unsafe, // code may rely on Function.prototype.name
                        keep_infinity: true, // readability
                        loops: true,
                        negate_iife: false, // readability
                        properties: true,
                        pure_getters: false, // many variables are proxies, which don't have pure getters
                        /* If unsafe preprocessing is enabled, tell uglify-es that Math.* functions
                         * have no side effects, and therefore can be removed if the result is
                         * unused. Related issue: mishoo/UglifyJS2#2227
                         */
                        pure_funcs: unsafe ?
                            // https://stackoverflow.com/a/10756976
                            Object.getOwnPropertyNames(Math).map(key => `Math.${key}`) : null,
                        reduce_vars: true,
                        /* Using sequences (a; b; c; -> a, b, c) provides some performance benefits
                         * (https://github.com/CapacitorSet/box-js/commit/5031ba7114b60f1046e53b542c0e4810aad68a76#commitcomment-23243778),
                         * but it makes code harder to read. Therefore, this behaviour is disabled.
                         */
                        sequences: false,
                        toplevel: true,
                        typeofs: false, // typeof foo == "undefined" -> foo === void 0: the former is more readable
                        unsafe,
                        unused: true,
                    },
                    output: {
                        beautify: true,
                        comments: true,
                    },
                });
                if (result.error) {
                    lib.error("Couldn't preprocess with uglify-es: " + JSON.stringify(result.error));
                } else {
                    code = result.code;
                }
            }

            let tree;
            try {
                tree = acorn.parse(code, {
                    allowReturnOutsideFunction: true, // used when rewriting function bodies
                    ecmaVersion: "latest",
                    plugins: {
                        // enables acorn plugin needed by prototype rewrite
                        JScriptMemberFunctionStatement: !argv["no-rewrite-prototype"],
                    },
                });
            } catch (e) {
                lib.error("Couldn't parse with Acorn:");
                lib.error(e);
                lib.error("");
                if (filename.match(/jse$/)) {
                    lib.error(
                        `This appears to be a JSE (JScript.Encode) file.
Please compile the decoder and decode it first:

cc decoder.c -o decoder
./decoder ${filename} ${filename.replace(/jse$/, "js")}

`
                    );
                } else {
                    lib.error(
                        // @@@ Emacs JS mode does not properly parse this block.
                        //`This doesn't seem to be a JavaScript/WScript file.
                        //If this is a JSE file (JScript.Encode), compile
                        //decoder.c and run it on the file, like this:
                        //
                        //cc decoder.c -o decoder
                        //./decoder ${filename} ${filename}.js
                        //
                        //`
                        "Decode JSE. 'cc decoder.c -o decoder'. './decoder ${filename} ${filename}.js'"
                    );
                }
                process.exit(4);
                return;
            }

            if (!argv["no-rewrite-prototype"]) {
                lib.verbose("    Replacing `function A.prototype.B()` (use --no-rewrite-prototype to skip)...", false);
                traverse(tree, function(key, val) {
                    if (!val) return;
                    if (val.type !== "FunctionDeclaration" &&
                        val.type !== "FunctionExpression") return;
                    if (!val.id) return;
                    if (val.id.type !== "MemberExpression") return;
                    return require("./patches/prototype.js")(val);
                });
            }

            if (!argv["no-hoist-prototype"]) {
                lib.verbose("    Hoisting `function A.prototype.B()` (use --no-hoist-prototype to skip)...", false);
                hoist(tree);
            }

            if (!argv["no-function-rewrite"]) {
                lib.verbose("    Rewriting functions (use --no-function-rewrite to skip)...", false);
                traverse(tree, function(key, val) {
                    if (key !== "callee") return;
                    if (val.autogenerated) return;
                    switch (val.type) {
                        case "MemberExpression":
                            return require("./patches/this.js")(val.object, val, multi_exec_enabled);
                        default:
                            return require("./patches/nothis.js")(val, multi_exec_enabled);
                    }
                });
            }

            if (!argv["no-typeof-rewrite"]) {
                lib.verbose("    Rewriting typeof calls (use --no-typeof-rewrite to skip)...", false);
                traverse(tree, function(key, val) {
                    if (!val) return;
                    if (val.type !== "UnaryExpression") return;
                    if (val.operator !== "typeof") return;
                    if (val.autogenerated) return;
                    return require("./patches/typeof.js")(val.argument);
                });
            }

            if (!argv["no-eval-rewrite"]) {
                lib.verbose("    Rewriting eval calls (use --no-eval-rewrite to skip)...", false);
                traverse(tree, function(key, val) {
                    if (!val) return;
                    if (val.type !== "CallExpression") return;
                    if (val.callee.type !== "Identifier") return;
                    if (val.callee.name !== "eval") return;
                    return require("./patches/eval.js")(val.arguments);
                });
            }

            if (!argv["no-catch-rewrite"]) { // JScript quirk
                lib.verbose("    Rewriting try/catch statements (use --no-catch-rewrite to skip)...", false);
                traverse(tree, function(key, val) {
                    if (!val) return;
                    if (val.type !== "TryStatement") return;
                    if (!val.handler) return;
                    if (val.autogenerated) return;
                    return require("./patches/catch.js")(val);
                });
            }

            if (multi_exec_enabled) {
                lib.verbose("    Rewriting code to force multiexecution [because of --multiexec]", false);
                traverse(tree, function(key, val) {
                    if (!val) return;
                    switch (val.type) {
                        case "BreakStatement":
                            return require("./patches/multiexec/break.js")(val);
                        case "ContinueStatement":
                            return require("./patches/multiexec/continue.js")(val);
                        case "IfStatement":
                            return require("./patches/multiexec/if.js")(val);
                        case "SwitchStatement":
                            return require("./patches/multiexec/switch.js")(val);
                        case "TryStatement":
                            return require("./patches/multiexec/try.js")(val);
                        default:
                            break;
                    }
                    if (argv["no-multi-exec-loop"]) {
                        return;
                    }
                    switch (val.type) {
                        case "WhileStatement":
                            return require("./patches/multiexec/while.js")(val);
                        case "DoWhileStatement":
                            return require("./patches/multiexec/dowhile.js")(val);
                        case "ForStatement":
                            return require("./patches/multiexec/for.js")(val);
                        default:
                            break;
                    }
                });
                //run function changes after above, as if statement changes tamper with it
                traverse(tree, function(key, val) {
                    if (!val) return;
                    switch (val.type) {
                        case "FunctionDeclaration":
                            return require("./patches/multiexec/function.js")(val);
                        default:
                            break;
                    }
                    if (argv["no-multi-exec-loop"]) {
                        return;
                    }
                    switch (val.type) {
                        case "ForInStatement":
                            return require("./patches/multiexec/forin.js")(val);
                        default:
                            break;
                    }
                });
            }

            // console.log("rewritten tree is: ", tree)
            //console.log(JSON.stringify(tree));

            // console.log(JSON.stringify(tree, null, "\t"));
            code = escodegen.generate(tree);

            // console.log("rewritten code is: ", code)

            // The modifications may have resulted in more concatenations, eg. "a" + ("foo", "b") + "c" -> "a" + "b" + "c"
            if (argv["dumb-concat-simplify"]) {
                lib.verbose("    Simplifying \"dumb\" concatenations (remove --dumb-concat-simplify to skip)...", false);
                code = code.replace(/'[ \r\n]*\+[ \r\n]*'/gm, "");
                code = code.replace(/"[ \r\n]*\+[ \r\n]*"/gm, "");
            }

            lib.verbose("Rewritten successfully.", false);
        } catch (e) {
            console.log("An error occurred during rewriting:");
            console.log(e);
            process.exit(3);
        }
    }

    return code;
}

function rewrite_code_for_symex_script(code) {
    try {
        lib.verbose("Rewriting code for symbolic execution script...", false);

        let tree;
        try {
            tree = acorn.parse(code, {
                allowReturnOutsideFunction: true, // used when rewriting function bodies
                ecmaVersion: "latest",
            })
        } catch (e) {
            lib.error("Couldn't parse with Acorn:");
            lib.error(e);
            lib.error("");
            process.exit(4);
            return;
        }

        traverse(tree, function(key, val) {
            if (!val) return;
            switch (val.type) {
                case "ThisExpression":
                    return require("./patches/symexec/this.js")(val);
                default:
                    break;
            }
        });

        code = escodegen.generate(tree);

        lib.verbose("Rewritten symbolic exec script successfully.", false);
    } catch (e) {
        console.log("An error occurred during rewriting:");
        console.log(e);
        process.exit(3);
    }

    return code;
}

async function run_in_vm(code, sandbox, sym_ex_vm2_flag = false) {
    if (argv["vm2"] || sym_ex_vm2_flag) {
        lib.debug("Analyzing with vm2 v" + require("vm2/package.json").version);

        // Fake cscript.exe style ReferenceError messages.
        // Fake up Object.toString not being defined in cscript.exe.
        //code = "Object.prototype.toString = undefined;\n\n" + code;

        let codeHadAnError = multi_exec_enabled;
        do {
            try {
                const vm = new VM({
                    timeout: (argv.timeout || 10) * 1000,
                    sandbox,
                });

                vm.run(code);
                codeHadAnError = false;
            } catch (e) {
                if (multi_exec_enabled) {
                    code = replaceErrorCausingCode(e, code);

                    //RESTART LOGGING AND SANDBOX STUFF:
                    restartLoggedState();
                } else if (sym_exec_enabled) {
                    lib.error(e.stack, true, false);
                    return;
                } else {
                    lib.error(e.stack, true, false);
                    throw e;
                }
            }
        } while (codeHadAnError)
    } else if (argv["dangerous-vm"]) {
        lib.verbose("Analyzing with native vm module (dangerous!)");
        const vm = require("vm");
        vm.runInNewContext(code, sandbox, {
            displayErrors: true,
            // lineOffset: -fs.readFileSync(path.join(__dirname, "patch.js"), "utf8").split("\n").length,
             filename: "sample.js",
        });
    } else { //jsdom default emulation context
        lib.debug("Analyzing with jsdom");
        let delete_in_sandbox = ["setInterval", "setTimeout", "alert", "JSON", /*"console",*/ "location", "navigator", "document", "origin", "self", "window"];
        delete_in_sandbox.forEach(field => delete sandbox[field]);

        let url = argv["url"] ? argv["url"] : "https://example.org/";
        let one_cookie = argv.cookie ? "document.cookie = \"" + argv.cookie + "\";" : "";
        let multiple_cookies = ""; //TODO: maybe reduce the duplicate code here
        if (argv["cookie-file"]) {
            try {
                multiple_cookies = fs.readFileSync(argv["cookie-file"], "utf8").split("\n").map((c) => `document.cookie = \"${c}\";`).join("\n");
            } catch (e) {
                lib.error("Error setting cookies from " + argv["cookie-file"]);
            }
        }
        let initialLocalStorage = "";
        if (argv["local-storage-file"]) {
            try {
                let localStorageJSON = JSON.parse(fs.readFileSync(argv["local-storage-file"], "utf8"));
                for (let prop in localStorageJSON) {
                    initialLocalStorage += `localStorage.setItem(\`${prop}\`, \`${localStorageJSON[prop]}\`);\n`;
                }
            } catch (e) {
                lib.error("Error setting local storage from " + argv["local-storage-file"]);
            }
        }
        let initialSessionStorage = "";
        if (argv["session-storage-file"]) {
            try {
                let sessionStorageJSON = JSON.parse(fs.readFileSync(argv["session-storage-file"], "utf8"));
                for (let prop in sessionStorageJSON) {
                    initialSessionStorage += `sessionStorage.setItem(\`${prop}\`, \`${sessionStorageJSON[prop]}\`);\n`;
                }
            } catch (e) {
                lib.error("Error setting session storage from " + argv["session-storage-file"]);
            }
        }

        let codeHadAnError = multi_exec_enabled;
        do {
            try {
                const virtualConsole = new jsdom.VirtualConsole();
                virtualConsole.sendTo(lib, { omitJSDOMErrors: true });
                virtualConsole.on("jsdomError", (e) => {
                    if (e.detail) {
                        throw e.detail
                    } else {
                        throw e
                    }
                });

                let dom_str = `<html><head></head><body></body><script>${initialLocalStorage}${initialSessionStorage}${one_cookie}${multiple_cookies}${code}</script></html>`;
                let cookie_jar = new jsdom.CookieJar();
                let cookie_jar_log_funcs = ["setCookie", "setCookieSync", "getCookies", "getCookiesSync", "getCookieString", "getCookieStringSync", "getSetCookieStrings", "getSetCookieStringsSync", "removeAllCookies", "removeAllCookiesSync"];
                const cookieJar = new Proxy(cookie_jar, {
                    get: (target, name) => {
                        if (name in target) {
                            if (typeof target[name] === "function" && cookie_jar_log_funcs.includes(name)) {
                                return function () {
                                    lib.logDOM(`cookieJar.${name}`,false, null, true, arguments);
                                    return target[name].apply(target, arguments);
                                }
                            }
                            return target[name];
                        }
                        return undefined;
                    },
                    set: function (target, name, val) {
                        if (name in target) {
                            lib.logDOM(`cookieJar.${name}`, true, val);
                            target[name] = val;
                        }
                        return false;
                    },
                });

                //Keep in mind this runs asynchronous
                let dom = new JSDOM(dom_str, {
                    url: url,
                    referrer: url,
                    contentType: "text/html",
                    includeNodeLocations: true,
                    virtualConsole,
                    runScripts: "dangerously",
                    pretendToBeVisual: true,
                    cookieJar,

                    //Setting up the global context of the emulation
                    beforeParse(window) {
                        //add our sandbox properties
                        for (let field in sandbox) {
                            if (sandbox.hasOwnProperty(field)) {
                                window[field] = sandbox[field];
                            }
                        }
                        //this boolean is what we use to check that the emulation has reached the end
                        window.emulationFinished = false;

                        let og_screen = window.screen;
                        delete window.screen;
                        window.screen = new Proxy(og_screen, {
                            get: (target, name) => {
                                if (name in target) {
                                    if (typeof name !== "symbol")
                                        lib.logDOM(`window.screen.${name}`);
                                    return target[name];
                                }
                                return undefined;
                            },
                            set: function (target, name, val) {
                                if (name in target) {
                                    lib.logDOM(`window.screen.${name}`, true, val);
                                    target[name] = val;
                                }
                                return false;
                            },
                        });

                        window.history = new Proxy(window.history, {
                            get: (target, name) => {
                                if (name in target) {
                                    if (typeof name !== "symbol")
                                        lib.logDOM(`window.history.${name}`);
                                    return target[name];
                                }
                                return undefined;
                            },
                            set: function (target, name, val) {
                                if (name in target) {
                                    lib.logDOM(`window.history.${name}`, true, val);
                                    target[name] = val;
                                }
                                return false;
                            },
                        });

                        let og_loc = window.location;
                        let loc_proxy = new Proxy(og_loc, {
                            get: (target, name) => {
                                if (name in target) {
                                    if (typeof name !== "symbol")
                                        lib.logDOM(`window.location.${name}`);
                                    return target[name];
                                }
                                return undefined;
                            },
                            set: function(target, name, val) {
                                if (name in target) {
                                    lib.logDOM(`window.location.${name}`, true, val);
                                    target[name] = val;
                                }
                                return false;
                            },
                        });
                        delete window.location;
                        window.location = loc_proxy;

                        window._document = new Proxy(window._document, {
                            get: (target, name) => {
                                if (name in target) {
                                    if (name === "cookie") return target[name];
                                    if (name === "location") return loc_proxy;
                                    if (typeof name !== "symbol") {
                                        if (typeof target[name] === "function") { //log function calls with arguments
                                            return function () {
                                                lib.logDOM(`window.document.${name}`,false, null, true, arguments);
                                                return target[name].apply(target, arguments);
                                            }
                                        }
                                        lib.logDOM(`window.document.${name}`);
                                    }
                                    return target[name];
                                }
                                return undefined;
                            },
                            set: function (target, name, val) {
                                if (name === "cookie") {
                                    target[name] = val;
                                    return true;
                                }
                                if (name === "location") {
                                    og_loc = val;
                                    return true;
                                }
                                if (name in target) {
                                    lib.logDOM(`window.document.${name}`, true, val);
                                    target[name] = val;
                                    return true;
                                }
                                return false;
                            },
                        });

                        //Add logging to the window's members
                        logged_dom_vals.window.properties.forEach((prop) => {
                            let real_val = window[prop[0]];
                            //if readonly property
                            if (prop[1]) { //TODO: use some hacky workaround for this duplication
                                Object.defineProperty(window, prop[0], {
                                    get: function() {
                                        lib.logDOM(`window.${prop[0]}`);
                                        return real_val;
                                    },
                                    enumerable: true,
                                    configurable: !prop[1]
                                })
                            } else {
                                window[`__${prop[0]}`] = real_val;
                                Object.defineProperty(window, prop[0], {
                                    get: function() {
                                        lib.logDOM(`window.${prop[0]}`);
                                        return window[`__${prop[0]}`];
                                    },
                                    set: function(val) {
                                        lib.logDOM(`window.${prop[0]}`, true, val);
                                        window[`__${prop[0]}`] = val;
                                    },
                                    enumerable: true,
                                    configurable: !prop[1]
                                })
                            }
                        })

                        //window method logging
                        logged_dom_vals.window.methods.forEach((m) => {
                            let og_function = window[m[0]];
                            window[m[0]] = function () {
                                lib.logDOM(m[0], false, null, true, arguments);
                                if (m[1])  //if implemented in jsdom
                                    return og_function.apply(window, arguments);
                            }
                        })

                        window._localStorage = new Proxy(window._localStorage, {
                            get: (target, name) => {
                                if (name in target) {
                                    if (typeof name !== "symbol") {
                                        if (typeof target[name] === "function") { //log function calls with arguments
                                            return function () {
                                                lib.logDOM(`window.localStorage.${name}`,false, null, true, arguments);
                                                return target[name].apply(target, arguments);
                                            }
                                        }
                                        lib.logDOM(`window.localStorage.${name}`);
                                    }
                                    return target[name];
                                }
                                return undefined;
                            },
                            set: function (target, name, val) {
                                if (name in target) {
                                    lib.logDOM(`window.localStorage.${name}`, true, val);
                                    target[name] = val;
                                    return true;
                                }
                                return false;
                            },
                        });

                        window._sessionStorage = new Proxy(window._sessionStorage, {
                            get: (target, name) => {
                                if (name in target) {
                                    if (typeof name !== "symbol") {
                                        if (typeof target[name] === "function") { //log function calls with arguments
                                            return function () {
                                                lib.logDOM(`window.sessionStorage.${name}`,false, null, true, arguments);
                                                return target[name].apply(target, arguments);
                                            }
                                        }
                                        lib.logDOM(`window.sessionStorage.${name}`);
                                    }
                                    return target[name];
                                }
                                return undefined;
                            },
                            set: function (target, name, val) {
                                if (name in target) {
                                    lib.logDOM(`window.sessionStorage.${name}`, true, val);
                                    target[name] = val;
                                    return true;
                                }
                                return false;
                            },
                        });

                        let nav_proxy = new Proxy(window.navigator, {
                            get: (target, name) => {
                                if (name in target) {
                                    if (typeof name !== "symbol")
                                        lib.logDOM(`window.navigator.${name}`);
                                    return target[name];
                                }
                                return undefined;
                            },
                            set: function(target, name, val) {
                                if (name in target) {
                                    lib.logDOM(`window.navigator.${name}`, true, val);
                                    target[name] = val;
                                }
                                return false;
                            },
                        });
                        Object.defineProperty(window, "navigator", {
                            get: function() {
                                // lib.logDOM(`window.navigator`);
                                return nav_proxy;
                            },
                            enumerable: true,
                            configurable: false
                        })
                    }
                });

                //https://stackoverflow.com/questions/14226803/wait-5-seconds-before-executing-next-line
                while (!dom.window.emulationFinished) //poll until emulation of main code has finished
                    await setTimeout[Object.getOwnPropertySymbols(setTimeout)[0]](100);

                lib.logBrowserStorage(dom.window.localStorage, dom.window.sessionStorage);

                dom.window.close();

                lib.logCookies(cookie_jar);

                codeHadAnError = false;
            } catch (e) {
                if (multi_exec_enabled) {
                    code = replaceErrorCausingCode(e, code, false, url);

                    //RESTART LOGGING AND SANDBOX STUFF:
                    restartLoggedState();
                } else {
                    lib.error(e.stack ? e.stack : e, true, false);
                    throw e;
                }
            }
        } while (codeHadAnError)
    }
}

function make_sandbox(symex_input = null) {
    function buildProxyForEmulatedObject(symex_input, symex_prefix, file_path) {
        let emulatedPatch = require(file_path);
        let emulatedObject = emulatedPatch.getObject();
        let emulatedHandler = emulatedPatch.getProxyHandler();
        let emulatedDefaultFields = emulatedPatch.getDefaultFields();
        let emulatedInnerProxies = emulatedPatch.getInnerProxies();

        for (let field in emulatedDefaultFields) {
            if (emulatedDefaultFields.hasOwnProperty(field)) {
                emulatedObject[field] = symex_input ? symex_input[`${symex_prefix}${field}`] : emulatedDefaultFields[field];
            }
        }

        for (let field in emulatedInnerProxies) {
            if (emulatedInnerProxies.hasOwnProperty(field)) {
                let innerProxy = emulatedInnerProxies[field];
                if (Array.isArray(emulatedObject)) {
                    for (let a = 0; a < emulatedObject.length; a++) {
                        if (emulatedObject[a] === field) {
                            emulatedObject[a] = buildProxyForEmulatedObject(symex_input, innerProxy.symex_prefix, innerProxy.file_path);
                        }
                    }
                } else {
                    emulatedObject[field] = buildProxyForEmulatedObject(symex_input, innerProxy.symex_prefix, innerProxy.file_path);
                }
            }
        }

        return new Proxy(emulatedObject, emulatedHandler);
    }

    let activex_mock = require("./activex_mock.js");
    activex_mock.setSymexInput(symex_input);
    var wscript_proxy = activex_mock.makeWscriptProxy();

    let wmi = require("./emulator/WMI");
    wmi.setSymexInput(symex_input);

    return {
        saveAs: function (data, fname) {
            // TODO: If Blob need to extract the data.
            lib.writeFile(fname, data);
        },
        setInterval: function () {
        },
        setTimeout: function (func, time) {

            // The interval should be an int, so do a basic check for int.
            if ((typeof (time) !== "number") || (time == null)) {
                throw("time is not a number.");
            }

            // Just call the function immediately, no waiting.
            if (typeof (func) === "function") {
                func();
            } else {
                throw("Callback must be a function");
            }
        },
        //Blob : Blob,
        // turnOnLogDOM: lib.turnOnLogDOM,
        // turnOffLogDOM: lib.turnOffLogDOM,
        toggleLogDOM: lib.toggleLogDOM,
        logJS: lib.logJS,
        logIOC: lib.logIOC,
        logMultiexec: (x, indent) => { //TODO: maybe reduce the duplication here
            if (indent === 0) {
                (multiexec_indent !== "" && multiexec_indent.length > 1) ?
                    multiexec_indent = multiexec_indent.slice(0, multiexec_indent.length - 2) :
                    multiexec_indent = "";
                if (x !== "") {
                    lib.info("MULTI-EXEC:    " + multiexec_indent + x)
                }
            } else if (indent === 1) {
                if (x !== "") {
                    lib.info("MULTI-EXEC:    " + multiexec_indent + x)
                }
            } else if (indent === 2) {
                if (x !== "") {
                    lib.info("MULTI-EXEC:    " + multiexec_indent + x)
                }
                multiexec_indent += "  ";
            }
        },
        evalUntilPasses: (evalCode, evalFunc) => { //TODO: only have this function in the sandbox (and other multiexec when multiexec is enabled
            let codeHadAnError = true;
            do {
                try {
                    evalFunc(evalCode);
                    codeHadAnError = false;
                } catch (e) {
                    evalCode = replaceErrorCausingCode(e, evalCode, true);
                    //TODO: Maintain correct multiexec_indent
                }
            } while (codeHadAnError)
        },
        ActiveXObject : activex_mock.ActiveXObject,
        alert: (x) => {
        },
        InstallProduct: (x) => {
            lib.logUrl("InstallProduct", x);
        },
        console: {
            //		log: console.log.bind(console),
            log: (x) => lib.info("Script output: " + (multi_exec_enabled ? multiexec_indent : "") + JSON.stringify(x)),
        },
        Enumerator: require("./emulator/Enumerator"),
        GetObject: wmi.GetObject,
        JSON,
        location: buildProxyForEmulatedObject(symex_input, "location.", "./emulator/location.js"),
        navigator: buildProxyForEmulatedObject(symex_input, "navigator.", "./emulator/navigator/navigator.js"),
        document: buildProxyForEmulatedObject(symex_input, "document.", "./emulator/document.js"),
        origin: symex_input ? symex_input["origin"] : "https://default-origin.com",
        window: {},
        parse: (x) => {},
        rewrite: (code, log = false) => {
            const ret = rewrite(code);
            if (log) lib.logJS(code, `${++numberOfExecutedSnippets}_`, "", true, ret, "eval'd JS", true);
            return ret;
        },
        ScriptEngine: () => {
            const type = "JScript"; // or "JavaScript", or "VBScript"
            // lib.warn(`Emulating a ${type} engine (in ScriptEngine)`);
            return type;
        },
        _typeof: (x) => x.typeof ? x.typeof : typeof x,
        WScript: wscript_proxy,
        WSH: wscript_proxy,
        self: {},
        require //require is required for some of the ActiveX stuff to work - TODO: change this
    };
}

function replaceErrorCausingCode(e, code, eval = false, url = "https://example.org/") {
    /* The following code finds the enclosing statement of the error, and replaces it with a logging
    function in the code so that the code can be run again

       1. Get the line number and column number - from this get the index in the code (charNumber)
       2. Parse the code with acorn to get an AST
       3. In this returned AST, traverse to find the most enclosing statement corresponding to this charNumber
       4. Replace the enclosing statement with a logMultiexec function call
       5. Use escodegen to turn the AST back to code
    * */

    //NodeJS doesn't have error.lineNumber, so instead I have to use RegEx to find it from the stack message
    var lineRegexp, regexpResults;
    if (argv["vm2"]) {
        lineRegexp = eval ? new RegExp(/<anonymous>:(\d+):(\d+)/gm) : new RegExp(/at vm.js:(\d+):(\d+)/gm);
        regexpResults = lineRegexp.exec(e.stack);
    } else { //assume running in jsdom
        if (eval) {
            lineRegexp = new RegExp(/<anonymous>:(\d+):(\d+)/gm);
            regexpResults = lineRegexp.exec(e.stack);
        } else {
            lineRegexp = new RegExp(/:(\d+):(\d+)/gm);
            let line_info = e.stack.split("\n")[1].trim().substring(3 + url.length);
            regexpResults = lineRegexp.exec(line_info);
        }
    }
    let lineNumber = parseInt(regexpResults[1]);
    let colNumber = parseInt(regexpResults[2]);
    let charNumber = 0;

    let l = 1;
    for (; charNumber < code.length; charNumber++) {
        if (code.charAt(charNumber) === "\n") {
            l++;
        }
        if (l === lineNumber) {
            //found char number
            charNumber += colNumber;
            break;
        }
    }

    let tree = acorn.parse(code, {
        allowReturnOutsideFunction: true, // used when rewriting function bodies
    })

    let closestStatement = null;
    let closestDistance = -1;
    traverse(tree, function (key, val) {
        if (!val) return;
        if (!val.type) return;
        if (!val.type.includes("Statement") && val.type !== "SwitchCase") return;

        if (val.start <= charNumber && val.end >= charNumber) {
            let val_distance = (charNumber - val.start) + (val.end - charNumber);
            if (closestStatement === null) {
                closestStatement = val;
                closestDistance = val_distance;
            } else {
                if (val_distance < closestDistance) {
                    closestStatement = val;
                    closestDistance = val_distance;
                }
            }
        }
    });
    closestStatement.closestStatement = true;

    //Refind the statement, then replace it:
    traverse(tree, function (key, val) {
        if (!val) return;
        if (val.closestStatement) {
            return {
                "type": "ExpressionStatement",
                "expression": {
                    "type": "CallExpression",
                    "callee": {
                        "type": "Identifier",
                        "name": "logMultiexec"
                    },
                    "arguments": [
                        {
                            "type": "Literal",
                            "value": `SKIPPED ERROR IN ${eval ? "AN EVAL CALL" : "GLOBAL SCOPE"}: ${code.substring(charNumber, code.length - charNumber < 30 ? code.length : charNumber + 30).replace(/\n/g, "\\n")}...`,
                        },
                        {
                            "type": "Literal",
                            "value": 1,
                        }
                    ]
                }
            }
        }
    });

    //generate code again
    return escodegen.generate(tree);
}

//After an error has occured in multi-execution, it removes the error causing code and tries again, so restart the
//stuff that was logged last try to avoid duplication
function restartLoggedState() {
    console.log("*RESTARTING MULTI-EXECUTION AFTER ERROR OCCURRED*");
    //FOR analyze.js
    numberOfExecutedSnippets = 1;
    multiexec_indent = "";

    lib.restartState();

    //relog the input file
    lib.logJS(originalInputScript, `${numberOfExecutedSnippets}_input_script`, "", false, null, "INPUT SCRIPT", true);
    lib.logJS(code, `${numberOfExecutedSnippets}_input_script_INSTRUMENTED`, "", false, null, "INPUT SCRIPT", false);
}

function prepend_users_prepend_code(code) {
// prepend extra JS containing mock objects in the given file(s) onto the code
    if (argv["prepended-code"]) {

        var prependedCode = ""
        var files = []

        // get all the files in the directory and sort them alphebetically
        if (fs.lstatSync(argv["prepended-code"]).isDirectory()) {

            dir_files = fs.readdirSync(argv["prepended-code"]);
            for (var i = 0; i < dir_files.length; i++) {
                files.push(path.join(argv["prepended-code"], dir_files[i]))
            }

            // make sure we're adding mock code in the right order
            files.sort()
        } else {
            files.push(argv["prepended-code"])
        }

        for (var i = 0; i < files.length; i++) {
            prependedCode += fs.readFileSync(files[i], 'utf-8') + "\n\n"
        }

        return prependedCode + "\n\n" + code;
    }
    return code;
}

function lacksBinary(name) {
    const path = child_process.spawnSync("command", ["-v", name], {
        shell: true
    }).stdout;
    return path.length === 0;
}

// Emulation of member function statements hoisting of by doing some reordering within AST
function hoist(obj, scope) {
    scope = scope || obj;
    // All declarations should be moved to the top of current function scope
    let newScope = scope;
    if (obj.type === "FunctionExpression" && obj.body.type === "BlockStatement")
        newScope = obj.body;

    for (const key of Object.keys(obj)) {
        if (obj[key] !== null && typeof obj[key] === "object") {
            const hoisted = [];
            if (Array.isArray(obj[key])) {
                obj[key] = obj[key].reduce((arr, el) => {
                    if (el && el.hoist) {
                        // Mark as hoisted yet
                        el.hoist = false;
                        // Should be hoisted? Add to array and filter out from current.
                        hoisted.push(el);
                        // If it was an expression: leave identifier
                        if (el.hoistExpression)
                            arr.push(el.expression.left);
                    } else
                        arr.push(el);
                    return arr;
                }, []);
            } else if (obj[key].hoist) {
                const el = obj[key];

                el.hoist = false;
                hoisted.push(el);
                obj[key] = el.expression.left;
            }
            scope.body.unshift(...hoisted);
            // Hoist all elements
            hoist(obj[key], newScope);
        }
    }
}

