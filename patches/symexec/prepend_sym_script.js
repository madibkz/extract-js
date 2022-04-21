var S$ = require('S$'); //TODO: wrap this in an anonymous function maybe?

var window = global;
var self = global;

//window symbolic tracking properties
global.origin = S$.symbol("origin", "");
global.closed = S$.symbol("closed", false);
global.devicePixelRatio = S$.symbol("devicePixelRatio", 0);
global.fullScreen = S$.symbol("fullScreen", false);
global.innerHeight = S$.symbol("innerHeight", 0);
global.innerWidth = S$.symbol("innerWidth", 0);
global.name = S$.symbol("name", "");
var opener = global;
global.outerHeight = S$.symbol("outerHeight", 0);
global.outerWidth = S$.symbol("outerWidth", 0);
global.pageXOffset = S$.symbol("pageXOffset", 0);
global.pageYOffset = S$.symbol("pageYOffset", 0);
var parent = global;
global.screenX = S$.symbol("screenX", 0);
global.screenY = S$.symbol("screenY", 0);
global.screenLeft = S$.symbol("screenLeft", 0);
global.screenTop = S$.symbol("screenTop", 0);
global.status = S$.symbol("status", "");
var top = global;


(() => {
    let buildProxyForEmulatedObject = (symex_prefix, file_path) => {
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

    let getDefaultValForType = (o) => {
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

    //build DOM emulation / symbol tracking
    global.location = buildProxyForEmulatedObject("location.", "./emulator/location.js");
    global.navigator = buildProxyForEmulatedObject("navigator.", "./emulator/navigator/navigator.js");
    global.document = buildProxyForEmulatedObject("document.", "./emulator/document.js")
    // document.defaultView = global;
    global.clientInformation = navigator;

    //build active x emulation/symbol tracking
    let wmi = require("./emulator/WMI");
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

        let wmi_getobject_symbols = {
            "wmi.getobject.tables.win32_computersystem.pscomputername": S$.symbol("wmi.getobject.tables.win32_computersystem.pscomputername",""),
            "wmi.getobject.tables.win32_computersystem.adminpasswordstatus": S$.symbol("wmi.getobject.tables.win32_computersystem.adminpasswordstatus",0),
            "wmi.getobject.tables.win32_computersystem.status": S$.symbol("wmi.getobject.tables.win32_computersystem.status",""),
            "wmi.getobject.tables.win32_computersystem.name": S$.symbol("wmi.getobject.tables.win32_computersystem.name",""),
            "wmi.getobject.tables.win32_computersystem.currenttimezone": S$.symbol("wmi.getobject.tables.win32_computersystem.currenttimezone",0),
            "wmi.getobject.tables.win32_computersystem.domain": S$.symbol("wmi.getobject.tables.win32_computersystem.domain",""),
            "wmi.getobject.tables.win32_computersystem.hypervisorpresent": S$.symbol("wmi.getobject.tables.win32_computersystem.hypervisorpresent",""),
            "wmi.getobject.tables.win32_computersystem.manufacturer": S$.symbol("wmi.getobject.tables.win32_computersystem.manufacturer",""),
            "wmi.getobject.tables.win32_computersystem.model": S$.symbol("wmi.getobject.tables.win32_computersystem.model",""),
            "wmi.getobject.tables.win32_computersystem.networkservermodeenabled": S$.symbol("wmi.getobject.tables.win32_computersystem.networkservermodeenabled",""),
            "wmi.getobject.tables.win32_computersystem.primaryownername": S$.symbol("wmi.getobject.tables.win32_computersystem.primaryownername",""),
            "wmi.getobject.tables.win32_computersystem.username": S$.symbol("wmi.getobject.tables.win32_computersystem.username",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.pscomputername": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.pscomputername",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.dhcpenabled": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.dhcpenabled",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.dhcpserver": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.dhcpserver",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.dnsdomain": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.dnsdomain",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.dnshostname": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.dnshostname",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.domaindnsregistrationenabled": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.domaindnsregistrationenabled",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.fulldnsregistrationenabled": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.fulldnsregistrationenabled",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.ipaddress.ip": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.ipaddress.ip",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.ipaddress.mac": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.ipaddress.mac",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.ipenabled": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.ipenabled",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.ipfiltersecurityenabled": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.ipfiltersecurityenabled",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.macaddress": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.macaddress",""),
            "wmi.getobject.tables.win32_networkadapterconfiguration.servicename": S$.symbol("wmi.getobject.tables.win32_networkadapterconfiguration.servicename",""),
            "wmi.getobject.tables.win32_operatingsystem.pscomputername": S$.symbol("wmi.getobject.tables.win32_operatingsystem.pscomputername",""),
            "wmi.getobject.tables.win32_operatingsystem.status": S$.symbol("wmi.getobject.tables.win32_operatingsystem.status",""),
            "wmi.getobject.tables.win32_operatingsystem.name": S$.symbol("wmi.getobject.tables.win32_operatingsystem.name",""),
            "wmi.getobject.tables.win32_operatingsystem.bootdevice": S$.symbol("wmi.getobject.tables.win32_operatingsystem.bootdevice",""),
            "wmi.getobject.tables.win32_operatingsystem.buildnumber": S$.symbol("wmi.getobject.tables.win32_operatingsystem.buildnumber",""),
            "wmi.getobject.tables.win32_operatingsystem.caption": S$.symbol("wmi.getobject.tables.win32_operatingsystem.caption",""),
            "wmi.getobject.tables.win32_operatingsystem.countrycode": S$.symbol("wmi.getobject.tables.win32_operatingsystem.countrycode",0),
            "wmi.getobject.tables.win32_operatingsystem.csname": S$.symbol("wmi.getobject.tables.win32_operatingsystem.csname",""),
            "wmi.getobject.tables.win32_operatingsystem.currenttimezone": S$.symbol("wmi.getobject.tables.win32_operatingsystem.currenttimezone",0),
            "wmi.getobject.tables.win32_operatingsystem.distributed": S$.symbol("wmi.getobject.tables.win32_operatingsystem.distributed",""),
            "wmi.getobject.tables.win32_operatingsystem.encryptionlevel": S$.symbol("wmi.getobject.tables.win32_operatingsystem.encryptionlevel",0),
            "wmi.getobject.tables.win32_operatingsystem.localdatetime": S$.symbol("wmi.getobject.tables.win32_operatingsystem.localdatetime",""),
            "wmi.getobject.tables.win32_operatingsystem.locale": S$.symbol("wmi.getobject.tables.win32_operatingsystem.locale",""),
            "wmi.getobject.tables.win32_operatingsystem.numberofusers": S$.symbol("wmi.getobject.tables.win32_operatingsystem.numberofusers",0),
            "wmi.getobject.tables.win32_operatingsystem.organization": S$.symbol("wmi.getobject.tables.win32_operatingsystem.organization",""),
            "wmi.getobject.tables.win32_operatingsystem.osarchitecture": S$.symbol("wmi.getobject.tables.win32_operatingsystem.osarchitecture",""),
            "wmi.getobject.tables.win32_operatingsystem.oslanguage": S$.symbol("wmi.getobject.tables.win32_operatingsystem.oslanguage",0),
            "wmi.getobject.tables.win32_operatingsystem.osproductsuite": S$.symbol("wmi.getobject.tables.win32_operatingsystem.osproductsuite",0),
            "wmi.getobject.tables.win32_operatingsystem.ostype": S$.symbol("wmi.getobject.tables.win32_operatingsystem.ostype",0),
            "wmi.getobject.tables.win32_operatingsystem.registereduser": S$.symbol("wmi.getobject.tables.win32_operatingsystem.registereduser",""),
            "wmi.getobject.tables.win32_operatingsystem.serialnumber": S$.symbol("wmi.getobject.tables.win32_operatingsystem.serialnumber",""),
            "wmi.getobject.tables.win32_operatingsystem.systemdevice": S$.symbol("wmi.getobject.tables.win32_operatingsystem.systemdevice",""),
            "wmi.getobject.tables.win32_operatingsystem.systemdirectory": S$.symbol("wmi.getobject.tables.win32_operatingsystem.systemdirectory",""),
            "wmi.getobject.tables.win32_operatingsystem.systemdrive": S$.symbol("wmi.getobject.tables.win32_operatingsystem.systemdrive",""),
            "wmi.getobject.tables.win32_operatingsystem.version": S$.symbol("wmi.getobject.tables.win32_operatingsystem.version",""),
            "wmi.getobject.tables.win32_processstoptrace.process": S$.symbol("wmi.getobject.tables.win32_processstoptrace.process",""),
        }

        if (activex_buffers_symbolize) {
            activex_symbols["xmlhttp.responsebody"] = S$.symbol("xmlhttp.responsebody", "");
            activex_symbols["adodb.stream.buffer"] = S$.symbol("adodb.stream.buffer", "");
            activex_symbols["scripting.filesystemobject.buffer"] = S$.symbol("scripting.filesystemobject.buffer", "");
        }

        wmi.setSymexInput(wmi_getobject_symbols);
        activex_mock.setSymexInput(activex_symbols);
    }

    global.GetObject = wmi.GetObject;

    let wscript_proxy = activex_mock.makeWscriptProxy();
    global.WScript = wscript_proxy;
    global.WSH = wscript_proxy;
    global.ActiveXObject = activex_mock.ActiveXObject;
})();
