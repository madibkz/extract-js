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
                        "value": `if (${escodegen.generate(args.test)})`,
                    }
                ]
            }
        },
        args.consequent,
    ].concat(args.alternate ? [{
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
                    "value": "else",
                }
            ]
        }
    },
        args.alternate] : [{
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
                    "value": "} (end if)",
                }
            ]
        }
    }])
});
