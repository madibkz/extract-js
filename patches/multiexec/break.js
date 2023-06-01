/*
replaces break with console.log("break")
 */

const escodegen = require("escodegen");

module.exports = (args) => ({
    "type": "BlockStatement",
    "body": [
        {
            "type": "ExpressionStatement",
            "expression": {
                "type": "CallExpression",
                "callee": {
                    "type": "MemberExpression",
                    "object": {
                        "type": "Identifier",
                        "name": "console"
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "log"
                    },
                    "computed": false
                },
                "arguments": [
                    {
                        "type": "Literal",
                        "value": args.label ? `break ${escodegen.generate(args.label)})` : "break",
                    }
                ]
            }
        },
    ]
});
