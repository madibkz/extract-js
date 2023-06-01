function getProxyHandler() {
    return {
        get: function (target, name) {
            switch (name) {
                case Symbol.toPrimitive:
                    return () => "[object Screen]";
                default:
                    if (name === "toString") {
                        return () => "screen";
                    }
                    if (name in target) {
                        return target[name];
                    }
                    if (name === "__safe_item_to_string") { //this is needed for jalangi/expose
                        return false;
                    }
                    throw `extract-js error: ${name} in proxy Screen is not implemented!`
            }
        },
        set: function (target, name, value) {
            target[name] = value;
            return true;
        }
    };
}

function getDefaultFields() {
    return {
        availHeight: 720,
        availWidth: 1280,
        height: 720,
        width: 1280,
        left: 0,
        top: 0,
        pixelDepth: 24,
    };
}

function getInnerProxies() {
    return {
    };
}

function getObject() {
    return {
    };
}

module.exports = {
    getProxyHandler,
    getDefaultFields,
    getInnerProxies,
    getObject,
}
