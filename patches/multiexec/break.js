/*
replaces break with logMultiexec("break *label if there is a label* (SKIPPED)")
 */

const escodegen = require("escodegen");

module.exports = (args) => ({
    "type": "ExpressionStatement",
    "expression": {
        "type": "CallExpression",
        "callee": {
            "type": "Identifier",
            "name": "logMultiexec"
        },
        "arguments": [
            {
                "type": "Literal",
                "value": args.label ? `break ${escodegen.generate(args.label)}) (SKIPPED)` : "break (SKIPPED)",
            },
            {
                "type": "Literal",
                "value": 1,
            }
        ]
    }
});
