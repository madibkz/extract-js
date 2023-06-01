var S$ = require('S$');

//from sandbox //TODO: see if can uncomment
// let Enumerator = require("./emulator/Enumerator");
// let GetObject = require("./emulator/WMI").GetObject;
let InstallProduct = (x) => {
    console.log("InstallProduct " + x);
}

var window = global;
//global.window = global; //TODO: this causes less cases to be found in if_on_location: why?

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

//active x
// let wscript_proxy = makeWscriptProxy();
// let WScript = wscript_proxy;
// let WSH = wscript_proxy;
