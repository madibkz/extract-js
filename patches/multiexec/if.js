/*
turns:
    if (expression) {
        consequent statement ;
    } else if (expression) {
        alternate
    }
=>
    logMultiexec("if (expression)");
    expression
    consequent statement
    logMultiexec("else");
    alternate
 */

const escodegen = require("escodegen");

module.exports = (args) => {
    if (args.dontRemoveIfStatement === true) {
        return;
    }
    return {
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
            {
                type: "ExpressionStatement",
                expression: args.test,
            },
            args.consequent,
        ].concat(args.alternate ? [
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
                                "value": "else",
                            },
                            {
                                "type": "Literal",
                                "value": 0,
                            }
                        ]
                    }
                },
                args.alternate
            ]
            :
            [
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
                            "value": "} (END IF)",
                        },
                        {
                            "type": "Literal",
                            "value": 0,
                        }
                    ]
                }
            }
            ]
        )
    }};
