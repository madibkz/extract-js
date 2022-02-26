function getProxyHandler() {
    return {
        get: function (target, name) {
            switch (name) {
                case Symbol.toPrimitive:
                    return () => "[object PluginArray]";
                case "item":
                    return (i) => {
                        if (i === 0) {
                            return target[0];
                        }
                        return undefined;
                    }
                case "namedItem":
                    return (nameQuery) => {
                        if (nameQuery === target[0].name) {
                            return target[0];
                        }
                        return undefined;
                    }
                case "refresh":
                    return () => {
                        return true;
                    }
                default:
                    if (name in target) {
                        return target[name];
                    }
                    if (name === "__safe_item_to_string") {
                        return false;
                    }
                    throw `extract-js error: ${name} in proxy PluginArray is not implemented!`
            }
        },
        set: function (target, name, value) { //object is read only in spec
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
//https://developer.mozilla.org/en-US/docs/Web/API/PluginArray
    };
}

function getInnerProxies() {
    return {
        plugin: {
            file_path: "./emulator/navigator/plugin.js",
            symex_prefix: "navigator.plugins.plugin."
        },
    };
}

function getObject() {
    return ["plugin"];
}

module.exports = {
    getProxyHandler,
    getDefaultFields,
    getInnerProxies,
    getObject,
}
