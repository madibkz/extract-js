var S$ = require('S$');

//from sandbox //TODO: see if can uncomment
// let Enumerator = require("./emulator/Enumerator");
// let GetObject = require("./emulator/WMI").GetObject;
let InstallProduct = (x) => {
    console.log("InstallProduct " + x);
}

var window = global;
var self = global;

global.origin = S$.symbol("origin", "");

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

//active x
// let wscript_proxy = makeWscriptProxy();
// let WScript = wscript_proxy;
// let WSH = wscript_proxy;

