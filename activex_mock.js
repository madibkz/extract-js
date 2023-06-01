const lib = require("./lib");
//SYMEXDELETEBEFORE (DO NOT DELETE THIS COMMENT)

function makeWscriptProxy() {
    return new Proxy({
        arguments: new Proxy((n) => `${n}th argument`, {
            get: function (target, name) {
                switch (name) {
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
                            target[name], {
                                get: (target, name) => name.toLowerCase() === "typeof" ? "unknown" : target[name],
                            }
                        );
                }
            },
        }),
        buildversion: "1234",
        fullname: "C:\\WINDOWS\\system32\\wscript.exe",
        interactive: true,
        name: "wscript.exe",
        path: "C:\\TestFolder\\",
        //scriptfullname: "C:\\Documents and Settings\\User\\Desktop\\sample.js",
        //scriptfullname: "C:\\Users\\Sysop12\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\ons.jse",
        scriptfullname: "C:\Users\\Sysop12\\AppData\\Roaming\\Microsoft\\Templates\\0.2638666.jse",
        scriptname: "0.2638666.jse",
        get stderr() {
            lib.error("WScript.StdErr not implemented");
        },
        get stdin() {
            lib.error("WScript.StdIn not implemented");
        },
        get stdout() {
            lib.error("WScript.StdOut not implemented");
        },
        version: "5.8",
        get connectobject() {
            lib.error("WScript.ConnectObject not implemented");
        },
        createobject: ActiveXObject,
        get disconnectobject() {
            lib.error("WScript.DisconnectObject not implemented");
        },
        echo() {
        },
        get getobject() {
            lib.error("WScript.GetObject not implemented");
        },
        quit() {
        },
        // Note that Sleep() is implemented in patch.js because it requires
        // access to the variable _globalTimeOffset, which belongs to the script
        // and not to the emulator.
        [Symbol.toPrimitive]: () => "Windows Script Host",
        tostring: "Windows Script Host",
    }, {
        get(target, prop) {
            // For whatever reasons, WScript.* properties are case insensitive.
            if (typeof prop === "string")
                prop = prop.toLowerCase();
            return target[prop];
        }
    });
}

function ActiveXObject(name) {
    lib.verbose(`New ActiveXObject: ${name}`);
    name = name.toLowerCase();
    if (name.match("xmlhttp") || name.match("winhttprequest"))
        return require("./emulator/XMLHTTP");
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
            return require("./emulator/ADODBStream")();
        case "adodb.recordset":
            return require("./emulator/ADODBRecordSet")();
        case "adodb.connection":
            return require("./emulator/ADODBConnection")();
        case "scriptcontrol":
            return require("./emulator/ScriptControl");
        case "scripting.filesystemobject":
            return require("./emulator/FileSystemObject");
        case "scripting.dictionary":
            return require("./emulator/Dictionary");
        case "shell.application":
            return require("./emulator/ShellApplication");
        case "wscript.network":
            return require("./emulator/WScriptNetwork");
        case "wscript.shell":
            return require("./emulator/WScriptShell");
        case "wbemscripting.swbemlocator":
            return require("./emulator/WBEMScriptingSWBEMLocator");
        case "msscriptcontrol.scriptcontrol":
            return require("./emulator/MSScriptControlScriptControl");
        default:
            lib.kill(`Unknown ActiveXObject ${name}`);
            break;
    }
}

//SYMEXDELETEAFTER (DO NOT DELETE THIS COMMENT)
module.exports = {
    makeWscriptProxy,
    ActiveXObject
}