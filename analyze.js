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
const vm = require("vm");
const isURL = require("validator").isURL;
const isIP = require("validator").isIP;

const filename = process.argv[2];
const directory = process.argv[3];
const mode = process.argv[4];
const default_enabled = mode === "default";
const multi_exec_enabled = mode === "multi-exec";
const sym_exec_enabled = mode === "sym-exec";
const html_mode = argv["html"];
const dont_set_in_jsdom_from_sandbox = ["setInterval", "setTimeout", "alert", "JSON", /*"console",*/ "location", "navigator", "document", "origin", "self", "window"];
let listOfKnownScripts = [];

class LoggingResourceLoader extends jsdom.ResourceLoader {
    fetch(url, options) {
        lib.logDOMUrl(url, options);

        let prom = super.fetch(url, options).then(val => {
            lib.logResource("", url, val);

            if (multi_exec_enabled) {
                try { //if val is javascript, then we wrap it with eval
                    const script = new vm.Script(val.toString());
                    listOfKnownScripts.push(val.toString());
                    let rewrite_val = wrap_code_with_eval(val.toString());
                    listOfKnownScripts.push(rewrite_val);
                    lib.logJS(
                        val.toString(),
                        `${numberOfExecutedSnippets++}_input_script_`,
                        "",
                        true,
                        rewrite_val,
                        `external script downloaded from ${url}`,
                        true
                    );
                    return Buffer.from(rewrite_val);
                } catch (e) { //not javascript
                    return val;
                }
            }
            return val;
        });
        prom.abort = () => {}; //when the jsdom emulation closes, this lets the downloads still resolve
        return prom;
    }
}

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

if (!html_mode && (code.match("<job") || code.match("<script"))) { // The sample may actually be a .wsf, which is <job><script>..</script><script>..</script></job>.
    lib.debug("Sample seems to be WSF");
    code = code.replace(/<\??\/?\w+( [\w=\"\']*)*\??>/g, ""); // XML tags
    code = code.replace(/<!\[CDATA\[/g, "");
    code = code.replace(/\]\]>/g, "");
}

let numberOfExecutedSnippets = 1;

const originalInputScript = (sym_exec_enabled && html_mode) ? get_symex_code_from_html(code) : code;

//*INSTRUMENTING CODE*
if (!html_mode) {
    lib.logJS(originalInputScript, `${numberOfExecutedSnippets}_input_script`, "", false, null, "INPUT SCRIPT", true);
    code = rewrite(code);
    code = prepend_users_prepend_code(code);
    // prepend patch code
    code = fs.readFileSync(path.join(__dirname, "patch.js"), "utf8") + code;
    code = "ReferenceError.prototype.toString = function() { return \"[object Error]\";};\n\n" + code;
    // append more code
    code += "\n\n" + fs.readFileSync(path.join(__dirname, "appended-code.js"));
    lib.logJS(code, `${numberOfExecutedSnippets}_input_script_INSTRUMENTED`, "", false, null, "INPUT SCRIPT", false);
} else {
    //https://stackoverflow.com/questions/16369642/javascript-how-to-use-a-regular-expression-to-remove-blank-lines-from-a-string
    code = code.trim().replace(/^\s*\n/gm, "");
    lib.logHTML(code, "the initial HTML inputted for analysis");
    code = instrument_html(code);
}
//*END INSTRUMENTING CODE*

Array.prototype.Count = function() {
    return this.length;
};


// See https://github.com/nodejs/node/issues/8071#issuecomment-240259088
// It will prevent console.log from calling the "inspect" property,
// which can be kinda messy with Proxies
require("util").inspect.defaultOptions.customInspect = false;

//used for multi-exec vars
let multiexec_indent = "";
let currentLogMultiexec = () => {throw new Error("currentLogMultiexec isn't set to the current logMultiexec function of sandbox!")};
let currentWindowEventClass = null;

if (default_enabled || multi_exec_enabled) {
    const sandbox = make_sandbox();
    currentLogMultiexec = sandbox.logMultiexec;
    run_emulation(code, sandbox);
} else if (sym_exec_enabled) {
    let sym_exec_script = rewrite_code_for_symex_script(originalInputScript);
    sym_exec_script = prepend_users_prepend_code(sym_exec_script);
    sym_exec_script = prepend_sym_exec_script(sym_exec_script);

    //write script to temp file
    let tmp_filename = path.join(__dirname, "./tmpsymexscript");
    let tmp_path = `${tmp_filename}.js`;
    fs.writeFileSync(tmp_path, sym_exec_script);
    //log script
    lib.logJS(sym_exec_script, `input_script_SYM_EX_INSTRUMENTED`, "", false, null, "INPUT SCRIPT INSTRUMENTED FOR SYMBOLIC EXECUTION", false);

    let expose_output_path = path.resolve(directory + "expose_out.json");
    //run expose on temp file
    let expose_result = child_process.spawnSync(`${path.join(__dirname, "ExpoSE/expoSE")}`, [tmp_path], {
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
        if (html_mode) {
            lib.logHTML(code, `the input HTML instrumented for jsdom emulation`);
        } else {
            lib.logJS(code, `${numberOfExecutedSnippets}_input_script_INSTRUMENTED`, "", false, null, "INPUT SCRIPT", false);
        }

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
        console.log(`STARTING EMULATION FOR CONTEXT ${i}. (UNIQUE VARS: ${JSON.stringify(unique_context)})`);
        run_emulation(code, sandbox, input);
        console.log(`FINISHED EMULATION FOR CONTEXT ${i}.`);
        console.log(``);
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
    let prepend_sym_script = fs.readFileSync(path.join(__dirname, "./patches/symexec/prepend_sym_script.js"), "utf-8");

    if (argv["no-sym-exec-dom"])
        prepend_sym_script = prepend_sym_script.replace(/const dom_symbolize = true/, "const dom_symbolize = false");

    if (argv["sym-exec-location-object"])
        prepend_sym_script = prepend_sym_script.replace(/const location_object = false/, "const location_object = true");

    if (argv["no-sym-exec-activex"])
        prepend_sym_script = prepend_sym_script.replace(/let activex_symbolize = true/, "let activex_symbolize = false");

    if (argv["no-sym-exec-activex-buffers"])
        prepend_sym_script = prepend_sym_script.replace(/let activex_buffers_symbolize = true/, "let activex_buffers_symbolize = false");

    sym_exec_script = prepend_sym_script + "\n\n//END OF PATCHING\n" + sym_exec_script;

    return sym_exec_script;
}

function get_symex_code_from_html(code) {
    //input code variable is a HTML string
    //concatenate all the scripts' code in the HTML file together
    //return this as the input to the symbolic execution engine
    const dom = new JSDOM(code, { includeNodeLocations: true });
    let symex_code = "";

    //for all script tags:
    let scripts = dom.window.document.scripts;
    for (let s = 0; s < scripts.length; s++) {
        if (scripts[s].innerHTML.trim() !== "") {
            symex_code += "\n" + scripts[s].innerHTML.trim();
        } else {
            if (isURL(scripts[s].src)) {
                lib.logUrl("GET", scripts[s].src, "EXTERNALLY LINKED SCRIPT FOUND IN HTML SCRIPT TAG");
                //download the script if the command line argument is there
                if (argv["sym-exec-external-scripts"]) {
                    lib.info("Attempting to download external script " + scripts[s].src + " for symbolic execution");
                    try {
                        //then add this to the symex_code
                        let res = require('sync-request')('GET', scripts[s].src);
                        symex_code += "\n//external script from " + scripts[s].src + "\n" + res.getBody().toString();
                        lib.info("Attempt succeeded to download external script " + scripts[s].src + " for symbolic execution");
                    } catch (e) {
                        lib.error("Error occurred trying to download external script " + scripts[s].src + " for symbolic execution");
                    }
                }
            }
        }
    }

    return symex_code;
}

function instrument_html(code) {
    //for each script/piece of javascript in the html code, it is logged and replaced with rewrite(*SCRIPT*)
    const dom = new JSDOM(code, { includeNodeLocations: true });

    //for all script tags:
    let scripts = dom.window.document.scripts;
    for (let s = 0; s < scripts.length; s++) {
        if (scripts[s].innerHTML.trim() !== "") {
            let old_js = scripts[s].innerHTML;
            listOfKnownScripts.push(old_js);
            scripts[s].innerHTML = rewrite(scripts[s].innerHTML);
            if (multi_exec_enabled)  //wrap scripts into an eval for multi-exec error skipping
                scripts[s].innerHTML = wrap_code_with_eval(scripts[s].innerHTML);
            lib.logJS(
                old_js,
                `${numberOfExecutedSnippets++}_input_script`,
                "",
                false,
                scripts[s].innerHTML,
                `FOUND IN INPUT HTML IN SCRIPT TAG AT CHAR ${dom.nodeLocation(scripts[s]).startOffset}`,
                true
            );
            listOfKnownScripts.push(scripts[s].innerHTML.trim());
        }
    }

    //for all script attributes log and rewrite js:
    let all_elements = dom.window.document.getElementsByTagName("*");
    for (let e = 0; e < all_elements.length; e++) {
        let elem = all_elements[e];
        let atts = elem.attributes;
        for (let a = 0; a < atts.length; a++) {
            let att = atts[a];
            if (att.nodeName.startsWith("on") && att.nodeValue.trim() !== "") { //script attribute like onclick
                let old_js = att.nodeValue;
                listOfKnownScripts.push(old_js);
                if (!multi_exec_enabled)
                    elem.setAttribute(att.nodeName, rewrite(att.nodeValue));
                lib.logJS(
                    old_js,
                    `${numberOfExecutedSnippets++}_input_attribute_script`,
                    "",
                    false,
                    elem[att.nodeName],
                    `FOUND IN INPUT HTML AT ATTRIBUTE ${att.nodeName} OF ELEMENT ${elem.nodeName} AT CHAR ${dom.nodeLocation(elem).startOffset}`,
                    true
                );
                listOfKnownScripts.push(att.nodeValue.trim());
            }
        }
    }

    //prepend patch code
    let prepend_script = dom.window.document.createElement("script");
    prepend_script.type = "text/javascript";
    let patch_txt = fs.readFileSync(path.join(__dirname, "patch.js"), "utf8");
    listOfKnownScripts.push(patch_txt);
    prepend_script.innerHTML = patch_txt;
    dom.window.document.head.prepend(prepend_script);

    //append patch code
    let append_script = dom.window.document.createElement("script");
    append_script.type = "text/javascript";
    let append_txt = fs.readFileSync(path.join(__dirname, "appended-code.js"));
    listOfKnownScripts.push(append_txt);
    append_script.innerHTML = append_txt;
    dom.window.document.body.appendChild(append_script);

    return dom.serialize();
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

            if (!argv["no-function-rewrite"] && argv["vm2"]) {
                lib.verbose("    Rewriting functions (use --no-function-rewrite to skip)...", false);
                traverse(tree, function(key, val) {
                    //skips any constructor function calls because otherwise the new keyword won't work
                    if (val !== null && val.type === "NewExpression") {
                        val.callee.autogenerated = true;
                        return;
                    }
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

            if (!argv["no-eval-rewrite"] && argv["vm2"]) {
                lib.verbose("    Rewriting eval calls (use --no-eval-rewrite to skip)...", false);
                traverse(tree, function(key, val) {
                    if (!val) return;
                    if (val.type !== "CallExpression") return;
                    if (val.callee.type !== "Identifier") return;
                    if (val.callee.name !== "eval") return;
                    return require("./patches/eval.js")(val.arguments);
                });
            }

            if (!argv["no-catch-rewrite"] && !multi_exec_enabled) { // JScript quirk
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
                        case "ForOfStatement":
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

            const false_flags = ["MSXML2.XMLHTTP"];
            traverse(tree, function(key, val) {
                if (!val) return;
                if (val.type === "Literal" && typeof val.value === "string" && !false_flags.includes(val.value.trim())) {
                    if (isURL(val.value.trim()) || isIP(val.value.trim())) {
                        lib.logUrl("UNKNOWN", val.value.trim(), `FOUND IN STRING LITERAL WHILE TRAVERSING THE TREE IN REWRITE (START CHAR: ${val.start} END CHAR: ${val.end})`);
                    }
                }
            });

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

        function recursively_set_field(obj, field, value) {
            obj[field] = value;
            for (let i of Object.keys(obj))
                if (obj[i] !== null && typeof obj[i] === "object")
                    recursively_set_field(obj[i], field, value);
        }

        traverse(tree, function(key, val) {
            if (!val) return;
            switch (val.type) {
                case "ThisExpression":
                    return require("./patches/symexec/this.js")(val);
                case "ExpressionStatement":
                case "IfStatement":
                case "SwitchStatement":
                case "WhileStatement":
                case "DoWhileStatement":
                case "FunctionDeclaration":
                    return require("./patches/symexec/trycatchwrap.js")(val);
                case "VariableDeclaration":
                    if (val.symexecthistraversed) return val;
                    let assignments = val.declarations.filter(d => d.init).map((d) => {
                        return {
                            type: "ExpressionStatement",
                            expression: {
                                type: "AssignmentExpression",
                                operator: "=",
                                left: d.id,
                                right: d.init
                            },
                        }
                    });
                    val.declarations.forEach((d) => d.init = null);
                    val.symexecthistraversed = true;
                    return [
                            val,
                            ...assignments
                    ];
                case "ForStatement":
                    //prevents the trycatch wrapping of the init part of the for loop
                    val.init ? val.init.symexecthistraversed = true : {};
                    return require("./patches/symexec/trycatchwrap.js")(val);
                case "ForInStatement":
                    //prevents the trycatch wrapping of the init part of the forIn loop
                    val.left ? val.left.symexecthistraversed = true : {};
                    return require("./patches/symexec/trycatchwrap.js")(val);
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

function sandbox_object_is_default(path_to_obj, instance) {
    let obj = require(path_to_obj);
    let obj_default_fields = obj.getDefaultFields();

    for (let f in obj_default_fields)
        if (instance[f] !== obj_default_fields[f])
            return false;

    return true;
}

function log_dom_proxy_get(target, name, prefix) {
    if (name in target) {
        if (typeof name === "symbol") return target[name];
        if (name === "toString" || name === "valueOf") {
            lib.logDOM(`${prefix}.${name}`);
            return target[name];
        }
        if (typeof target[name] === "function") { //log function calls with arguments
            return function () {
                let maybe_snippet_name = lib.logDOM(`${prefix}.${name}`, false, null, true, arguments);
                let res = target[name].apply(target, arguments);
                if (name === "addEventListener" && multi_exec_enabled) {
                    force_event_multi_exec(`${prefix}.${name} (code in snippet ${maybe_snippet_name})`, target, arguments[0]);
                }
                return res;
            }
        }
        lib.logDOM(`${prefix}.${name}`);
        return target[name];
    }
    return undefined;
}

function force_event_multi_exec(register_str, target, event_name) {
    if (!argv["no-multi-exec-events"]) {
        currentLogMultiexec(`FORCING EXECUTION OF NEW EVENT REGISTERED FOR ${register_str}.`, 1)
        target.dispatchEvent(new currentWindowEventClass(event_name));
        currentLogMultiexec(`END FORCING EXECUTION OF NEW EVENT REGISTERED FOR ${register_str}.`, 1)
    }
}

function log_dom_proxy_set(target, name, val, prefix) {
    if (name in target) {
        let maybe_snippet_name = lib.logDOM(`${prefix}.${name}`, true, val);
        target[name] = val;
        if (multi_exec_enabled && name.startsWith("on") && typeof val === "function") {
            force_event_multi_exec(`${prefix}.${name} (code in snippet ${maybe_snippet_name})`, target, name.substring(2));
        }
        return true;
    }
    return false;
}

function make_log_dom_proxy(obj, prefix) {
    return new Proxy(obj, {
        get: (t, n) => log_dom_proxy_get(t, n, prefix),
        set: (t, n, v) => log_dom_proxy_set(t, n, v, prefix),
    });
}

function make_deep_log_dom_proxy(obj, prefix) {
    return new Proxy(obj, {
        get: (t, n) => {
            let res = log_dom_proxy_get(t, n, prefix);
            if (typeof res === "object")
                return make_deep_log_dom_proxy(res, prefix + "." + n)
            return res;
        },
        set: (t, n, v) => log_dom_proxy_set(t, n, v, prefix),
    });
}

function instrument_jsdom_global(sandbox, dont_set_from_sandbox, window, symex_input = null) {
    currentWindowEventClass = window.Event;
    //add our sandbox properties
    for (let field in sandbox) {
        if (sandbox.hasOwnProperty(field) && !dont_set_from_sandbox.includes(field)) {
            window[field] = sandbox[field];
        }
    }
    //this boolean is what we use to check that the emulation has reached the end
    window.emulationFinished = false;

    let og_screen = window.screen;
    delete window.screen;
    window.screen = new Proxy(og_screen, {
        get: (t, n) => {
            if (symex_input && symex_input.hasOwnProperty(`screen.${n}`)) {
                return symex_input[`screen.${n}`];
            }
            return log_dom_proxy_get(t, n, "window.screen");
        },
        set: (t, n, v) => log_dom_proxy_set(t, n, v, "window.screen"),
    });

    let og_history = window.history;
    delete window.history;
    window.history = make_log_dom_proxy(og_history, "window.history");

    let og_loc = window.location;
    let loc_proxy = new Proxy(og_loc, {
        get: (t, n) => {
            if (n == Symbol.toPrimitive && symex_input && symex_input.hasOwnProperty(`location._href`)) return () => symex_input[`location._href`];
            if (symex_input && symex_input.hasOwnProperty(`location.${n}`)) return symex_input[`location.${n}`];
            if (n === "href" && symex_input && symex_input.hasOwnProperty(`location._href`)) return symex_input[`location._href`];
            if (typeof n === "string" && n === "replace") {
              lib.logDOM("window.location.replace", false, null, false);
              return () => null;
            }
            return log_dom_proxy_get(t, n, "window.location");
        },
        set: (t, n, v) => log_dom_proxy_set(t, n, v, "window.location"),
    });
    delete window.location;
    window.location = loc_proxy;

    //xhr
    let og_xhr = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        return new Proxy(new og_xhr(), {
            get: (t, n) => {
                if (n === "open") {
                    return function () {
                        lib.logDOM(`window.XMLHttpRequest.${n}`, false, null, true, arguments);
                        lib.logDOMUrl(arguments[1], {element: {localName: "window.XMLHttpRequest"}, as: "from xmlhttprequest.open"});
                        if (!argv["dom-network-apis"]) {
                            lib.info(`Code called window.XMLHttpRequest.${n} but it's not enabled!`);
                            return null;
                        }
                        return t[n].apply(t, arguments);
                    }
                } else if (typeof t[n] === "function") {
                    return function () {
                        lib.logDOM(`window.XMLHttpRequest.${n}`, false, null, true, arguments);
                        if (!argv["dom-network-apis"]) {
                            lib.info(`Code called window.XMLHttpRequest.${n} but it's not enabled!`);
                            return null;
                        }
                        return t[n].apply(t, arguments);
                    }
                }
                lib.logDOM(`window.XMLHttpRequest.${n}`, false, null, false);
                if (!argv["dom-network-apis"]) {
                    lib.info(`Code accessed window.XMLHttpRequest.${n} but it's not enabled!`);
                    return null;
                }
                return log_dom_proxy_get(t, n, "window.XMLHttpRequest");
            },
            set: (t, n, v) => log_dom_proxy_set(t, n, v, "window.XMLHttpRequest"),
        });
    }


    window._document = new Proxy(window._document, {
        get: (target, name) => {
            if (name in target) {
                if (name === "cookie") return target[name];
                if (name === "location") return loc_proxy;
                if (typeof name === "symbol") return target[name];
                if (symex_input && name === "hasFocus" && symex_input["document.hasFocusValue"]) return () => symex_input["document.hasFocusValue"];
                if (symex_input && symex_input[`document.${name}`]) return symex_input[`document.${name}`];
                if (typeof target[name] === "function") { //log function calls with arguments
                    return function () {
                        return return_node_proxy_or_value("window.document", target, name, true, arguments);
                    }
                }
                return return_node_proxy_or_value("window.document", target, name, false);
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
            return log_dom_proxy_set(target, name, val, "window.document");
        },
    });

    //Add logging to the window's members
    logged_dom_vals.window.properties.forEach((prop) => {
        let real_val = (symex_input && symex_input[prop[0]]) ? symex_input[prop[0]] :  window[prop[0]];
        let attributes = {
            get: function () {
                lib.logDOM(`window.${prop[0]}`);
                return prop[1] ? real_val : window[`__${prop[0]}`];
            },
            enumerable: true,
            configurable: false
        };
        if (!prop[1]) {
            //TODO: make __prop hidden
            window[`__${prop[0]}`] = real_val;
            attributes.set = function (val) {
                if (val !== window[`__${prop[0]}`]) {
                    window[`__${prop[0]}`] = val;
                    if (multi_exec_enabled && prop[0].startsWith("on") && typeof val === "function") {
                        window.addEventListener(prop[0].substring(2), val);
                        return true;
                    }
                    lib.logDOM(`window.${prop[0]}`, true, val);
                } else {
                    window[`__${prop[0]}`] = val;
                }
                return true;
            };
        }
        Object.defineProperty(window, prop[0], attributes);
    })

    //window method logging
    logged_dom_vals.window.methods.forEach((method) => {
        let og_function = window[method[0]];
        window[method[0]] = function () {
            let maybe_snippet_name = lib.logDOM(method[0], false, null, true, arguments);
            if (method[1]) { //if implemented in jsdom
                if (multi_exec_enabled && (method[0] === "setTimeout" || method[0] === "setInterval")) {
                    currentLogMultiexec(`FORCING EXECUTION OF ${method[0]}((code in snippet ${maybe_snippet_name}), ${arguments[1].toString()}).`, 1)
                    if (typeof arguments[0] === "string") {
                        sandbox.evalUntilPasses(sandbox.rewrite(arguments[0]), window.eval);
                    } else {
                        arguments[0]();
                    }
                    currentLogMultiexec(`END FORCING EXECUTION OF ${method[0]}((code in snippet ${maybe_snippet_name}), ${arguments[1].toString()}).`, 1)
                }
                let res = og_function.apply(window, arguments);
                if (multi_exec_enabled && method[0] === "addEventListener") {
                    force_event_multi_exec(`window.addEventListener.${arguments[0]} (code in snippet ${maybe_snippet_name})`, window, arguments[0]);
                }
                return res;
            }
        }
    })

    //window.fetch
    window.fetch = function () {
        lib.logDOM("window.fetch", false, null, true, arguments);
        lib.logDOMUrl(arguments[0].toString(), {element: {localName: "window.navigator.fetch"}, args: arguments[1]}, (arguments[1] && arguments[1].method) ? arguments[1].method : "GET")
        lib.error("Code called window.navigator.fetch() but it's not implemented!");
        return null;
    }

    window._localStorage = make_log_dom_proxy(window._localStorage, "window.localStorage");

    window._sessionStorage = make_log_dom_proxy(window._sessionStorage, "window.sessionStorage");

    let nav_proxy = new Proxy(window.navigator, {
        get: (t, n) => {
            if (n === "sendBeacon") {
                return function () {
                    lib.logDOM(`window.navigator.sendBeacon`, false, null, true, arguments);
                    lib.logDOMUrl(arguments[0], {element: {localName: "window.navigator.sendBeacon"}}, "POST");
                    //sendBeacon is not actually implemented in jsdom TODO: make my own sendBeacon
                    return false;
                }
            }
            if (symex_input && (n === "userAgentData" || n === "plugins" || n === "mimeTypes")) {
                return make_deep_log_dom_proxy(sandbox["navigator"][n], `window.navigator.${n}`);
            }
            if (symex_input && symex_input.hasOwnProperty(`navigator.${n}`)) {
                return symex_input[`navigator.${n}`];
            }
            if (n === "userAgent" && argv["user-agent"]) return argv["user-agent"];
            return log_dom_proxy_get(t, n, "window.navigator");
        },
        set: (t, n, v) => log_dom_proxy_set(t, n, v, "window.navigator"),
    });

    Object.defineProperty(window, "navigator", {
        get: function () {
            return nav_proxy;
        },
        enumerable: true,
        configurable: false
    });

    Object.defineProperty(window.URL, "createObjectURL", {
        get: function () {
            return function() {
              lib.logDOM(`window.URL.createObjectURL`, false, null, true, arguments);
              console.log(JSON.stringify(arguments));
              return null;
            }
        },
        enumerable: true,
        configurable: false
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
        get: function () {
            return function() {
                lib.logDOM(`window.URL.revokeObjectURL`, false, null, true, arguments);
                console.log(JSON.stringify(arguments));
                return null;
            }
        },
        enumerable: true,
        configurable: false
    });

    let real_eval = window.eval;
    Object.defineProperty(window, "eval", {
        get: function ()  {
            return (code) => {
                lib.info("ENTERING EVAL");
                if (multi_exec_enabled) {
                    return sandbox.evalUntilPasses(sandbox.rewrite(code, true), real_eval);
                } else {
                    return real_eval(sandbox.rewrite(code, true));
                }
                lib.info("EXITING EVAL");
            }
        },
        enumerable: true,
        configurable: false,
    });
}

function create_node_proxy(node, prefix, node_name, from_func_call = false, args = null, index_str = null) {
    const args_str = args === null ? "" : Array.from(args).map(a => String(a)).join(", ");
    const prefix_str = `${prefix}.${node_name.toString()}${from_func_call ? "(" + args_str + ")" : ""}${index_str ? index_str : ""}`;

    return new Proxy(node, {
        get: (t, n) => {
            if (n in t) {
                if (typeof n === "symbol") return t[n];
                if (typeof t[n] === "function") {
                    return function () {
                        return return_node_proxy_or_value(prefix_str, t, n, true, arguments);
                    }
                }
                return return_node_proxy_or_value(prefix_str, t, n, false);
            }
            return undefined;
        },
        set: (t, n, v) => log_dom_proxy_set(t, n, v, prefix_str),
    });
}

function return_node_proxy_or_value(prefix_str, t, n, function_ctx, args = null) {
    let maybe_snippet_name = lib.logDOM(`${prefix_str}.${n.toString()}`, false, null, function_ctx, args);
    let result = function_ctx ? t[n].apply(t, args) : t[n];
    let logging_state = lib.domLoggingOn();
    if (logging_state)
        lib.turnOffLogDOM();
    if (typeof result !== "undefined" && result !== null) {
        if (result.nodeType) {
            let p = create_node_proxy(result, prefix_str, n, function_ctx, args);
            if (logging_state)
                lib.turnOnLogDOM();
            return p;
        }
        if (result.toString().includes("HTMLCollection") || result.toString().includes("NodeList")) {
            let new_list = [];
            for (let i = 0; i < result.length; i++) {
                new_list.push(create_node_proxy(result[i], prefix_str, n, function_ctx, args, `[${i}]`));
            }
            if (logging_state)
                lib.turnOnLogDOM();
            return new_list;
        }
    }
    if (logging_state)
        lib.turnOnLogDOM();
    if (function_ctx && multi_exec_enabled && n === "addEventListener") {
        if (!(maybe_snippet_name === undefined && `${prefix_str}.${n}.${args[0]}` === "window.document.addEventListener.load"))
            force_event_multi_exec(`${prefix_str}.${n}.${args[0]} (code in snippet ${maybe_snippet_name})`, t, args[0]);
    }
    return result;
}

async function run_in_jsdom_vm(sandbox, code, symex_input = null) {
    lib.debug("Analyzing with jsdom");

    let url = "https://example.com/";
    if (argv["url"]) {
        url = argv["url"];
    } else if (!sandbox_object_is_default("./emulator/location.js", sandbox.location)) {
        //construct a url from location to set as the url in the jsdom emulation
        // if (require("./emulator/location.js").getDefaultFields().href !== sandbox.location.href)  {
        //     url = sandbox.location.href;
        // } else {
        //     url = sandbox.location.url;
        // }
    }

    function try_to_set_from_file(file_arg, set_func) {
        if (argv[file_arg]) {
            try {
                set_func();
            } catch (e) {
                lib.error(`Error setting values for ${file_arg} from ${argv[file_arg]}`);
            }
        }
    }

    let one_cookie = argv.cookie ? "document.cookie = \"" + argv.cookie + "\";" : "";

    let multiple_cookies = "";
    try_to_set_from_file("cookie-file", () => {multiple_cookies = fs.readFileSync(argv["cookie-file"], "utf8").trim().split("\n").map((c) => `document.cookie = \"${c}\";`).join("\n");})

    let set_storage = (file_arg, name) => {
        let storageJSON = JSON.parse(fs.readFileSync(argv[file_arg], "utf8"));
        let storage_str = "";
        for (let prop in storageJSON)
            storage_str += `${name}.setItem(\`${prop}\`, \`${storageJSON[prop]}\`);\n`;
        return storage_str;
    };

    let initialLocalStorage = "";
    try_to_set_from_file("local-storage-file", () => initialLocalStorage = set_storage("local-storage-file", "localStorage"));

    let initialSessionStorage = "";
    try_to_set_from_file("session-storage-file", () => initialSessionStorage = set_storage("session-storage-file", "sessionStorage"));

    let codeHadAnError = multi_exec_enabled;
    do {
        try {
            const virtualConsole = new jsdom.VirtualConsole();
            virtualConsole.sendTo(lib, {omitJSDOMErrors: true});
            virtualConsole.on("jsdomError", (e) => {
                if (e.detail) {
                    throw e.detail
                } else {
                    throw e
                }
            });

            let cookie_jar = new jsdom.CookieJar();
            let cookie_jar_log_funcs = ["setCookie", "setCookieSync", "getCookies", "getCookiesSync", "getCookieString", "getCookieStringSync", "getSetCookieStrings", "getSetCookieStringsSync", "removeAllCookies", "removeAllCookiesSync"];
            const cookieJar = new Proxy(cookie_jar, {
                get: (target, name) => {
                    if (name in target) {
                        if (typeof target[name] === "function" && cookie_jar_log_funcs.includes(name)) {
                            return function () {
                                lib.logDOM(`cookieJar.${name}`, false, null, true, arguments);
                                return target[name].apply(target, arguments);
                            }
                        }
                        return target[name];
                    }
                    return undefined;
                },
                set: (t, n, v) => log_dom_proxy_set(t, n, v, "cookieJar"),
            });

            const resourceLoader = new LoggingResourceLoader({
                // proxy: "",
                // strictSSL: false,
                // userAgent: "",
                ...((!sym_exec_enabled && argv["user-agent"]) && {userAgent: argv["user-agent"]}),
                ...((sym_exec_enabled && symex_input && symex_input["navigator.userAgent"]) && {userAgent: symex_input["navigator.userAgent"]}),
                //the default userAgent if neither of the above pass
                ...((!(!sym_exec_enabled && argv["user-agent"]) && !(sym_exec_enabled && symex_input && symex_input["navigator.userAgent"])) && {userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"}),
            });

            let dom_str;
            let setup_str = `${initialLocalStorage}${initialSessionStorage}${one_cookie}${multiple_cookies}`;
            listOfKnownScripts.push(setup_str);
            if (!html_mode) {
                dom_str = `<html><head></head><body><form action="/submit.php"><label for="username">Username:</label><br><input type="text" id="username" name="username" value="fakename"><br><label for="password">Password:</label><br><input type="text" id="password" name="password" value="fakepassword"><br><label for="credit-card">Credit card:</label><br><input type="text" id="credit-card" name="credit-card" value="credit-card"><br><input type="submit" value="Submit"></form><button type="button">Fakebutton</button><script>${setup_str}${code}</script></body></html>`;
                lib.logHTML(dom_str, "the initial HTML set for the jsdom emulation");
            } else {
                //add the setup_str as a script in <head>
                if (setup_str.trim() === "") {
                    dom_str = code;
                } else {
                    let index_of_head = code.indexOf("<head>") + 6;
                    dom_str = code.substring(0, index_of_head) + `<script>${setup_str}</script>` + code.substring(index_of_head);
                }
                lib.logHTML(dom_str, "the initial HTML instrumented for the jsdom emulation");
            }

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
                resources: argv["dom-resource-loading"] ? resourceLoader : undefined,

                //Setting up the global context of the emulation
                beforeParse(window) {
                    instrument_jsdom_global(sandbox, dont_set_in_jsdom_from_sandbox, window, symex_input);
                }
            });

            //https://stackoverflow.com/questions/14226803/wait-5-seconds-before-executing-next-line
            while (!dom.window.emulationFinished) //poll until emulation of main code has finished
                await setTimeout[Object.getOwnPropertySymbols(setTimeout)[0]](100);

            lib.logBrowserStorage(dom.window.localStorage, dom.window.sessionStorage);

            dom.window.document.scripts.forEach((x) => {
                lib.checkThatScriptHasBeenLogged(x.innerHTML, listOfKnownScripts);
            })

            lib.logHTML(dom.serialize(), "the end HTML from the jsdom emulation once it was finished");

            dom.window.close();

            lib.logCookies(cookie_jar);

            codeHadAnError = false;
        } catch (e) {
            if (multi_exec_enabled) {
                code = replaceErrorCausingCode(e, code, false, url);

                //RESTART LOGGING AND SANDBOX STUFF:
                restartLoggedState(code);
            } else {
                lib.turnOffLogDOM();
                lib.error(e.stack, true, false);
                if (sym_exec_enabled) {
                    return;
                } else {
                    throw e;
                }
            }
        }
    } while (codeHadAnError)
}

function run_in_vm2(sandbox, code) {
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
                restartLoggedState(code);
            } else if (sym_exec_enabled) {
                lib.error(e.stack, true, false);
                return;
            } else {
                lib.error(e.stack, true, false);
                throw e;
            }
        }
    } while (codeHadAnError)
}

async function run_emulation(code, sandbox, symex_input = null) {
    if (argv["vm2"]) {
        if (argv["html"]) throw new Error("Cannot run --vm2 and --html at the same time.");
        run_in_vm2(sandbox, code);
    } else { //jsdom default emulation context
        await run_in_jsdom_vm(sandbox, code, symex_input);
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
        logInfo: lib.info,
        logJS: lib.logJS,
        logIOC: lib.logIOC,
        logUrl: lib.logUrl,
        logMultiexec: !multi_exec_enabled ? () => {} : (x, indent) => { //TODO: maybe reduce the duplication here
            x = x.replace(/\n/gi, "\\n"); //remove newlines
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
        htmlAndMulti: multi_exec_enabled && html_mode,
        evalUntilPasses: !multi_exec_enabled ? () => {} : (evalCode, evalFunc) => {
            let codeHadAnError = true;
            let multiexec_indent_checkpoint = multiexec_indent;
            let ret_val;
            do {
                try {
                    ret_val = evalFunc(evalCode);
                    codeHadAnError = false;
                } catch (e) {
                    evalCode = replaceErrorCausingCode(e, evalCode, true);
                    if (evalCode === "ERROR PARSING ERROR") return;
                    lib.info("");
                    lib.info("*RESTARTING EVAL CALL AFTER ERROR OCCURRED WITHIN IT*");
                    lib.info("");
                    multiexec_indent = multiexec_indent_checkpoint;
                }
            } while (codeHadAnError)
            //log this code as the final instrumented snippet
            let filename = lib.getLastInstrumentedFilename().split(".")[0];
            lib.logJS(evalCode, filename, "", false, null, "eval code that passed multi-exec with skipped errors", false);
            return ret_val;
        },
        ActiveXObject : activex_mock.ActiveXObject,
        alert: (x) => {
        },
        InstallProduct: (x) => {
            lib.logUrl("InstallProduct", x);
        },
        console: {
            //		log: console.log.bind(console),
            log: (x) => {
                let x_str;
                try {
                    x_str = JSON.stringify(x);
                } catch (e) {
                    x_str = x.toString();
                }
                lib.info("Script output: " + (multi_exec_enabled ? multiexec_indent : "") + x_str);
            },
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
        require, //require is required for some of the ActiveX stuff to work - TODO: change this,
        isURL: require("validator").isURL,
        isIP: require("validator").isIP,
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

    if (e.stack && e.stack.includes("If you can read this, re-run extract.js with the --no-shell-error flag.")) {
        throw new Error("If you can read this, re-run extract.js with the --no-shell-error flag.");
    }

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
    let lineNumber, colNumber;
    try {
        lineNumber = parseInt(regexpResults[1]);
        colNumber = parseInt(regexpResults[2]);
    } catch (err) {
        lib.error("Couldn't skip error in eval in multi-exec mode (skipping the whole eval instead)");
        return "ERROR PARSING ERROR";
    }
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
        ecmaVersion: "latest",
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

    let errMsg = e.stack.split("\n")[0] + " at " + code.substring(charNumber < 3 ? charNumber : charNumber - 2, code.length - charNumber < 25 ? code.length : charNumber + 25).replace(/\n/g, "\\n") + "...";

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
                            "value": `SKIPPED ERROR IN ${eval ? "AN EVAL CALL" : "GLOBAL SCOPE"}: ${errMsg}`,
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

function restartLoggedState(code) {
    lib.info("");
    lib.info("*RESTARTING MULTI-EXECUTION AFTER ERROR OCCURRED*");
    lib.info("");
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

function wrap_code_with_eval(code_str) {
    return "eval(\"" + JSON.stringify(code_str).slice(1, -1) + "\");"
}
