function getProxyHandler() {
    return {
        get: function (target, name) {
            switch (name) {
                case Symbol.toPrimitive:
                    return () => "[object NavigatorUAData]";
                default:
                    if (name in target) {
                        return target[name];
                    }
                    if (name === "__safe_item_to_string") {
                        return false;
                    }
                    throw `extract-js error: ${name} in proxy NavigatorUAData is not implemented!`
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
//https://developer.mozilla.org/en-US/docs/Web/API/Navigator
//PROPERTIES:
        //brands: [{brand: "Chrome", version: "98"}], It breaks ExpoSE when trying to add Brands
        mobile: false,
        platform: "Windows",
//PROPERTIES FOR getHighEntropyValues():
        bitness: "64",
        device: "Pixel 2XL",
        platformVersion: "10.0",
        uaFullVersion: "91.0.4472.124",
    };
}

function getInnerProxies() {
    return {
    };
}

function getObject() {
    return {
//PROPERTIES FOR getHighEntropyValues():
        architecture: "x86",
        brands: [{brand: "Chrome", version: "98"}],
//METHODS:
//         async getHighEntropyValues(queries) { //TODO: ExpoSE errors on async
//             let me = this;
//             return new Promise(function(resolve, reject) {
//                 let result = {brands: me.brands, mobile: me.mobile};
//                 queries.forEach(q => {
//                     if (me.hasOwnProperty(q)) {
//                         result[q] = me[q];
//                     }
//                 });
//                 return resolve(result);
//             });
//         },
        toJSON() {
            return {brands: this.brands, mobile: this.mobile};
        },
    };
}

module.exports = {
    getProxyHandler,
    getDefaultFields,
    getInnerProxies,
    getObject,
}
