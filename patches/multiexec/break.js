/*
replaces break with console.log("break")
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
                "value": args.label ? `break ${escodegen.generate(args.label)})` : "break",
            },
            {
                "type": "Literal",
                "value": 1,
            }
        ]
    }
});
