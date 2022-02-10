
// go through all declared variables in the script looking for valid JavaScript in the contents
// eval the javascript so it gets sandboxed
const vm = require('vm');
for (varName in this) {
    varValue = this[varName]
    if (typeof(varValue) == "string") {
        // check that the string is valid JS syntax
        try {
            const script = new vm.Script(varValue);
            logJS(varValue, "", "_str", true, null, "javascript string found in var " + varName)
            // Automatically evaling all JS can result in the program state getting polluted.
            //eval(varValue)
        }
        catch (err) {}
    }
}
