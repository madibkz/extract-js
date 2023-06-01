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
    let navigatorJS = require("./emulator/navigator.js");
    let navigatorObject = navigatorJS.getNavigatorObject();
    let navigatorHandler = navigatorJS.getNavigatorProxyHandler();
    let navigatorDefaultFields = navigatorJS.getNavigatorDefaultFields();

    for (let field in navigatorDefaultFields) {
        if (navigatorDefaultFields.hasOwnProperty(field)) {
            navigatorObject[field] = S$.symbol(`navigator.${field.toString()}`, navigatorDefaultFields[field]);
        }
    }

    return new Proxy(navigatorObject, navigatorHandler);
})();

//active x
// let wscript_proxy = makeWscriptProxy();
// let WScript = wscript_proxy;
// let WSH = wscript_proxy;

