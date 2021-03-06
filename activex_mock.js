const run_by_extract_js = process.argv[1].endsWith("extract-js/analyze");
const lib = run_by_extract_js ? require("./lib") : require("./symbol-lib");

let activex_requires = {
    "wscript.shell": require("./emulator/WScriptShell"),
    "xmlhttp": require("./emulator/XMLHTTP"),
    "adodb.stream": require("./emulator/ADODBStream"),
    "scripting.filesystemobject": require("./emulator/FileSystemObject")
}

let sym_vals = {};

function makeWscriptProxy() {
    return new Proxy({
        arguments: new Proxy((n) => `${n}th argument`, {
            get: function (target, name) {
                switch (name) {
                    case "name":
                        return "wscript proxy arguments function";
                    case "Unnamed":
                        return [];
                    case "length":
                        return 0;
                    case "ShowUsage":
                        return {
                            typeof: "unknown",
                        };
                    case "Named":
                        return [];
                    default:
                        return new Proxy(
                             target[name],
                            {
                                get: (target, name) => {
                                    return name.toLowerCase() === "typeof" ? "unknown" : target[name];
                                },
                            }
                        );
                }
            },
        }),
        buildversion: sym_vals.hasOwnProperty("wscript.proxy.buildversion") ? sym_vals["wscript.proxy.buildversion"] : "1234", //symex
        fullname: "C:\\WINDOWS\\system32\\wscript.exe",
        interactive: sym_vals.hasOwnProperty("wscript.proxy.interactive") ? sym_vals["wscript.proxy.interactive"] : true, //symex
        name: "wscript.exe",
        path: sym_vals.hasOwnProperty("wscript.proxy.path") ? sym_vals["wscript.proxy.path"] : "C:\\TestFolder\\", //symex
        //scriptfullname: "C:\\Documents and Settings\\User\\Desktop\\sample.js",
        //scriptfullname: "C:\\Users\\Sysop12\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\ons.jse",
        scriptfullname: sym_vals.hasOwnProperty("wscript.proxy.scriptfullname") ? sym_vals["wscript.proxy.scriptfullname"] : "C:\Users\\Sysop12\\AppData\\Roaming\\Microsoft\\Templates\\0.2638666.jse", //symex?
        scriptname: sym_vals.hasOwnProperty("wscript.proxy.scriptname") ? sym_vals["wscript.proxy.scriptname"] : "0.2638666.jse", //symex?
        stderr: () =>  {
            lib.error("WScript.StdErr not implemented");
        },
        stdin: () => {
            lib.error("WScript.StdIn not implemented");
        },
        stdout: () => {
            lib.error("WScript.StdOut not implemented");
        },
        version: sym_vals.hasOwnProperty("wscript.proxy.version") ? sym_vals["wscript.proxy.version"] : "5.8", //symex
        connectobject: () => {
            lib.error("WScript.ConnectObject not implemented");
        },
        createobject: ActiveXObject,
        disconnectobject: () => {
            lib.error("WScript.DisconnectObject not implemented");
        },
        echo() {
        },
        getobject: () => {
            lib.error("WScript.GetObject not implemented");
        },
        quit() {
        },
        // Note that Sleep() is implemented in patch.js because it requires
        // access to the variable _globalTimeOffset, which belongs to the script
        // and not to the emulator.
        // [Symbol.toPrimitive]: () => "Windows Script Host",
        tostring: "Windows Script Host",
    }, {
        get(target, prop) {
            // For whatever reasons, WScript.* properties are case insensitive.
            switch (prop) {
                case Symbol.toPrimitive:
                    return () => "Windows Script Host";
                default:
                    if (typeof prop === "string")
                        prop = prop.toLowerCase();
                    return target[prop];
            }
        }
    });
}

function ActiveXObject(name) {
    lib.verbose(`New ActiveXObject: ${name}`);
    name = name.toLowerCase();
    if (name.match("xmlhttp") || name.match("winhttprequest"))
        return activex_requires["xmlhttp"].create();
    if (name.match("dom")) {
        return {
            createElement: require("./emulator/DOM"),
            load: (filename) => {
                // console.log(`Loading ${filename} in a virtual DOM environment...`);
            },
        };
    }

    switch (name) {
        case "windowsinstaller.installer":
            // Stubbed out for now.
            return "";
        case "adodb.stream":
            return activex_requires["adodb.stream"].create();
        case "adodb.recordset":
            return require("./emulator/ADODBRecordSet")();
        case "adodb.connection":
            //return require("./emulator/ADODBConnection")();
            lib.error("Script tried to use ADODBConnection which is not implemented")
        case "scriptcontrol":
            return require("./emulator/ScriptControl");
        case "scripting.filesystemobject":
            return activex_requires["scripting.filesystemobject"].create();
        case "scripting.dictionary":
            return require("./emulator/Dictionary");
        case "shell.application":
            return require("./emulator/ShellApplication");
        case "wscript.network":
            return require("./emulator/WScriptNetwork");
        case "wscript.shell":
            return activex_requires["wscript.shell"].create();
        case "wbemscripting.swbemlocator":
            return require("./emulator/WBEMScriptingSWBEMLocator");
        case "msscriptcontrol.scriptcontrol":
            return require("./emulator/MSScriptControlScriptControl");
        default:
            lib.kill(`Unknown ActiveXObject ${name}`);
            break;
    }
}

function setSymexInput(symex_input) {
    for (let o in activex_requires) {
        if (activex_requires.hasOwnProperty(o)) {
            activex_requires[o].setSymexInput(symex_input);
        }
    }

    if (symex_input)
        sym_vals = symex_input;
}

module.exports = {
    makeWscriptProxy,
    ActiveXObject,
    setSymexInput
}