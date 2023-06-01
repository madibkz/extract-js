var S$ = require('S$'); //TODO: wrap this in an anonymous function maybe?

var window = global;
var self = global;

global.origin = S$.symbol("origin", "");

//build DOM emulation / symbol tracking
(() => {
    function buildProxyForEmulatedObject(symex_prefix, file_path) {
        let emulatedPatch = require(file_path);
        let emulatedObject = emulatedPatch.getObject();
        let emulatedHandler = emulatedPatch.getProxyHandler();
        let emulatedDefaultFields = emulatedPatch.getDefaultFields();
        let emulatedInnerProxies = emulatedPatch.getInnerProxies();

        for (let field in emulatedDefaultFields) {
            if (emulatedDefaultFields.hasOwnProperty(field)) {
                //We initialize symbols with the default value that ExpoSE uses for each type
                emulatedObject[field] = S$.symbol(`${symex_prefix}${field}`, getDefaultValForType(emulatedDefaultFields[field]));
            }
        }

        for (let field in emulatedInnerProxies) {
            if (emulatedInnerProxies.hasOwnProperty(field)) {
                let innerProxy = emulatedInnerProxies[field];
                if (Array.isArray(emulatedObject)) {
                    for (let a = 0; a < emulatedObject.length; a++) {
                        if (emulatedObject[a] === field) {
                            emulatedObject[a] = buildProxyForEmulatedObject(innerProxy.symex_prefix, innerProxy.file_path);
                        }
                    }
                } else {
                    emulatedObject[field] = buildProxyForEmulatedObject(innerProxy.symex_prefix, innerProxy.file_path);
                }
            }
        }

        return new Proxy(emulatedObject, emulatedHandler);
    }

    function getDefaultValForType(o) {
        if (Array.isArray(o)) {
            return [getDefaultValForType(o[0])];
        } else if (typeof o === "string") {
            return "";
        } else if (typeof o === "number") {
            return 0;
        } else if (typeof o === "boolean") {
            return false;
        } else if (typeof o === "object") {
            return o;
        }
        throw new Error("(SYM-EXEC MODE): Error in prepend_sym_script.js: cannot find type of object " + o);
    }

    global.location = buildProxyForEmulatedObject("location.", "./emulator/location.js");
    global.navigator = buildProxyForEmulatedObject("navigator.", "./emulator/navigator/navigator.js");
    global.document = buildProxyForEmulatedObject("document.", "./emulator/document.js")
})();

//build active x emulation/symbol tracking
(() => {
    global.GetObject = require("./emulator/WMI").GetObject;
    global.InstallProduct = (x) => {
        console.log("InstallProduct " + x);
    }

    let activex_mock = require("./activex_mock");

    let activex_symbolize = true;
    let activex_buffers_symbolize = true;

    if (activex_symbolize) {
        let activex_symbols = {
            "wscript.shell.os": S$.symbol("wscript.shell.os", ""),
            "wscript.shell.windows-xp": S$.symbol("wscript.shell.windows-xp", false),

            "xmlhttp.status200": S$.symbol("xmlhttp.status200", false),

            "adodb.stream.charset": S$.symbol("adodb.stream.charset", ""),
            "adodb.stream.position": S$.symbol("adodb.stream.position", 0),

            "scripting.filesystemobject.fileexists": S$.symbol("scripting.filesystemobject.fileexists", false),
            "scripting.filesystemobject.folderexists": S$.symbol("scripting.filesystemobject.folderexists", false),


            "wscript.proxy.buildversion": S$.symbol("wscript.proxy.buildversion", ""),
            "wscript.proxy.interactive": S$.symbol("wscript.proxy.interactive", false),
            "wscript.proxy.path": S$.symbol("wscript.proxy.path", ""),
            "wscript.proxy.scriptfullname": S$.symbol("wscript.proxy.scriptfullname", ""),
            "wscript.proxy.scriptname": S$.symbol("wscript.proxy.scriptname", ""),
            "wscript.proxy.version": S$.symbol("wscript.proxy.version", ""),
        }

        if (activex_buffers_symbolize) {
            activex_symbols["xmlhttp.responsebody"] = S$.symbol("xmlhttp.responsebody", "");
            activex_symbols["adodb.stream.buffer"] = S$.symbol("adodb.stream.buffer", "");
            activex_symbols["scripting.filesystemobject.buffer"] = S$.symbol("scripting.filesystemobject.buffer", "");
        }

        activex_mock.setSymexInput(activex_symbols);
    }


    let wscript_proxy = activex_mock.makeWscriptProxy();
    global.WScript = wscript_proxy;
    global.WSH = wscript_proxy;
    global.ActiveXObject = activex_mock.ActiveXObject;
})();

