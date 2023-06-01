function getProxyHandler() {
    return {
        get: function (target, name) {
            switch (name) {
                case Symbol.toPrimitive:
                    return () => "[object Navigator]";
                default:
                    if (name in target) {
                        return target[name];
                    }
                    if (name === "__safe_item_to_string") {
                        return false;
                    }
                    throw `extract-js error: ${name} in proxy navigator is not implemented!`
            }
        },
        set: function (target, name, value) { //navigator is read only
            if (name === "__safe_item_to_string") {
                target[name] = value;
                return true;
            }
            return false;
        }
    };
}

function getDefaultFields() {
    return {
//https://developer.mozilla.org/en-US/docs/Web/API/Navigator
//STANDARD PROPERTIES:
        //connection: S$.symbol('navigator.connection', {}), experimental complex feature //TODO
        cookieEnabled: true,
        //credentials: S$.symbol('navigator.credentials', ""), need CredentialsContainer interface implemented //TODO show it was checked
        deviceMemory: 2.0,
        //geolocation: S$.symbol('navigator.geolocation', {}), needs Geolocation object and browser permission //TODO show if it was checked for?
        //hid: S$.symbol('navigator.hid', {}), needs HID object but I really doubt malware would use HID
        //keyboard: S$.symbol('navigator.keyboard', {}),  complicated object //maybe TODO?
        language: "en-US", //technically uses DOMString object but is a string
        languages: ["en-US", "en"],
        //locks: S$.symbol('navigator.languages', ["en-US", "en"]), needs LockManage object
        maxTouchPoints: 1, //seems like malware wouldnt use this
        //mediaCapabilities: S$.symbol('navigator.mediaCapabilities', ["en-US", "en"]), complex object/ API needed //maybe TODO?
        //mediaDevices: S$.symbol('navigator.mediaDevices', {}), //needs MediaDevices object plus malware not sure //TODO show if checked or something
        //mediaSession: S$.symbol('navigator.mediaSession', {}), needs MediaSession object //
        onLine: true,
        //permissions: S$.symbol('navigator.permissions', {}), //complex object Permissions needed //TODO
        //presentation: S$.symbol('navigator.presentation', {}), //presentation object needed
        //serial: S$.symbol('navigator.serial', {}), //needs serial object //TODO maybe to show if enabled
        //serviceWorker: S$.symbol('navigator.serviceWorker', {}), //needs ServiceWorkerContainer object //TODO maybe show if the script checks if enabled
        //storage: S$.symbol('navigator.storage', {}), //needs storagemanager object TODO
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
        webdriver: false,
        //windowControlsOverlay: S$.symbol('navigator.windowControlsOverlay', {}),//needs WindowControlsOverlay intrface
        //xr: S$.symbol('navigator.xr', {}), //needs XRsystem object
//NON-STANDARD PROPERTIES:
        buildID: "20181001000000", //only used in firefox and not that useful for malware
        //contacts: //TODO show if checked
        //securitypolicy: //TODO ez
        //standalone: //TODO ez
        //wakeLock:
//DEPRECATED PROPERTIES:
        appName: "Netscape",
        appVersion: "4.0",
        //activeVRDisplays: S$.symbol('navigator.', {}), needs VRDisplay and doubt its useful
        //battery: S$.symbol('navigator.', {}), needs BatteryManager and doubt its useful
        doNotTrack: "yes",
        oscpu: "Windows NT 6.0",
        platform: "Win64",
        product: "Gecko",
        prodSub: "20010725",
        vendor: "Google Inc.",
        shareBool: true,
    };
}

function getInnerProxies() {
    return {
        userAgentData: {
            file_path: "./emulator/navigator/NavigatorUAData.js",
            symex_prefix: "navigator.userAgentData."
        },
        plugins: {
            file_path: "./emulator/navigator/PluginArray.js",
            symex_prefix: "navigator.plugins."
        },
        mimeTypes: {
            file_path: "./emulator/navigator/MimeTypes.js",
            symex_prefix: "navigator.mimeTypes."
        },
    };
}

function getObject() {
    return {
//STANDARD PROPERTIES:
        hardwareConcurrency: 1, //can range but I doubt malware would want to ask for this
//NON-STANDARD PROPERTIES:
//DEPRECATED PROPERTIES:
        vendorSub: "",
        appCodeName: "Mozilla",
//METHODS:
        canShare() {
            return this.shareBool;
        },
        clearAppBadge() {
            throw "clearAppBadge() is not implemented in proxy navigator"
        },
        getBattery() {
            throw "getBattery() is not implemented in proxy navigator"
        },
        registerProtocolHandler() {
            throw "registerProtocolHandler() is not implemented in proxy navigator"
        },
        requestMediaKeySystemAccess() {
            throw "requestMediaKeySystemAccess() is not implemented in proxy navigator"
        },
        sendBeacon() {
            throw "sendBeacon() is not implemented in proxy navigator"
        },
        setAppBadge() {
            throw "setAppBadge() is not implemented in proxy navigator"
        },
        share() {
            throw "share() is not implemented in proxy navigator"
        },
        vibrate() {
            throw "vibrate() is not implemented in proxy navigator"
        },
//DEPRECATED METHODS:
        getVRDisplays() {
            throw "getVRDisplays() is not implemented in proxy navigator"
        },
        getUserMedia() {
            throw "getUserMedia() is not implemented in proxy navigator"
        },
        taintEnabled() {
            return false;
        },
        javaEnabled() {
            return false;
        },
    };
}

module.exports = {
    getProxyHandler,
    getDefaultFields,
    getInnerProxies,
    getObject,
}