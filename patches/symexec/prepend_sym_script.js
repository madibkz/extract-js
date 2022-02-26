var S$ = require('S$');

//from sandbox //TODO: see if can uncomment
// let Enumerator = require("./emulator/Enumerator");
// let GetObject = require("./emulator/WMI").GetObject;
let InstallProduct = (x) => {
    console.log("InstallProduct " + x);
}

var window = global;

global.location = new Proxy({
    href: S$.symbol('location.href', "http://www.foobar.com/"),
    protocol: S$.symbol('location.protocol', "http:"),
    host: S$.symbol('location.host', "www.foobar.com"),
    hostname: S$.symbol('location.hostname', "www.foobar.com"),
}, {
    get: function (target, name) {
        switch (name) {
            case Symbol.toPrimitive:
                return () => this.href;
            default:
                return target[name.toLowerCase()];
        }
    },
})

//navigator
global.navigator = (() => {
    function buildProxyForEmulatedObject(symex_prefix, file_path) {
        let emulatedPatch = require(file_path);
        let emulatedObject = emulatedPatch.getObject();
        let emulatedHandler = emulatedPatch.getProxyHandler();
        let emulatedDefaultFields = emulatedPatch.getDefaultFields();
        let emulatedInnerProxies = emulatedPatch.getInnerProxies();

        for (let field in emulatedDefaultFields) {
            if (emulatedDefaultFields.hasOwnProperty(field)) {
                emulatedObject[field] = S$.symbol(`${symex_prefix}${field}`, emulatedDefaultFields[field]);
            }
        }

        for (let field in emulatedInnerProxies) {
            if (emulatedInnerProxies.hasOwnProperty(field)) {
                let innerProxy = emulatedInnerProxies[field];
                emulatedObject[field] = buildProxyForEmulatedObject(innerProxy.symex_prefix, innerProxy.file_path);
            }
        }

        return new Proxy(emulatedObject, emulatedHandler);
    }

    return buildProxyForEmulatedObject("navigator.", "./emulator/navigator/navigator.js");
})();

//active x
// let wscript_proxy = makeWscriptProxy();
// let WScript = wscript_proxy;
// let WSH = wscript_proxy;

