
// go through all declared variables in the script looking for valid JavaScript in the contents
// eval the javascript so it gets sandboxed
toggleLogDOM()
console.log("(SEARCHING STRINGS AFTER FINISHED EXECUTION.)");
const vm = require('vm');
let number_of_js_str = 0;
for (varName in this) {
    varValue = this[varName]
    if (typeof(varValue) == "string") {
        // check that the string is valid JS syntax
        try {
            if (varValue.trim() !== "" && varValue !== "dangerously" && varValue.match(/[a-zA-Z]+[a-zA-Z0-9]*/)[0] !== varValue) {

                const script = new vm.Script(varValue);
                logJS(varValue, `STRING_${++number_of_js_str}_`, "", true, null, "JavaScript string found in var " + varName)
                // Automatically evaling all JS can result in the program state getting polluted.
                //eval(varValue)
            }
        }
        catch (err) {}
        // check that the string is a valid url
        if (varValue.trim() === "https://example.com") continue; //skip the default URL var that will always be logged
        if (isURL(varValue.trim()) || isIP(varValue.trim())) {
            logUrl("UNKNOWNMETHOD", varValue);
        }
    }
}

window.emulationFinished = true;
