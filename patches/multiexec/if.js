/*
turns:
    if (expression) {
        consequent statement ;
    } else if (expression) {
        alternate
    }
=>
    lib.logControl("if (expression)");
    consequent statement
    lib.logControl("else");
    alternate
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
                    "type": "Identifier",
                    "name": "logMultiexec"
                },
                "arguments": [
                    {
                        "type": "Literal",
                        "value": `if (${escodegen.generate(args.test)})`,
                    },
                    {
                        "type": "Literal",
                        "value": 2,
                    }
                ],
                "optional": false
            }
        },
        args.consequent,
    ].concat(args.alternate ? [{
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
                    "value": "else",
                },
                {
                    "type": "Literal",
                    "value": 0,
                }
            ]
        }
        }, args.alternate] : [{
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
                    "value": "} (end if)",
                },
                {
                    "type": "Literal",
                    "value": 0,
                }
            ]
        }
    }])
});
