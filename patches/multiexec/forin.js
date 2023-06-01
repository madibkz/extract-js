/*
there is a high chance that the body of a for in statement will fail without the init var

turns:
    for (var x in y) {
        body
    }
=>
    try {
        console.log("Attempting to force execution of For In statement");
        body
        console.log("Attempt to force execution of For In statement succeeded");
    } catch (e) {
        console.log("Attempt to force execution of For In statement failed");
    }
    for (var x in y) {
        body
    }
 */

const escodegen = require("escodegen");

module.exports = (args) => {
    if (!args.haveAlreadyForcedBody) {
        args.haveAlreadyForcedBody = true;
        return {
            "type": "BlockStatement",
            "body": [
                {
                    "type": "TryStatement",
                    "block": {
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
                                            "value": `Attempting to force execution of body of for (${escodegen.generate(args.left)} in ${escodegen.generate(args.right)})`,
                                        },
                                        {
                                            "type": "Literal",
                                            "value": 2,
                                        }
                                    ],
                                    "optional": false
                                }
                            },
                            args.body,
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
                                            "value": `Attempt to force execution of for (${escodegen.generate(args.left)} in ${escodegen.generate(args.right)}) succeeded`,
                                        },
                                        {
                                            "type": "Literal",
                                            "value": 0,
                                        }
                                    ],
                                    "optional": false
                                }
                            }
                        ]
                    },
                    "handler": {
                        "type": "CatchClause",
                        "param": {
                            "type": "Identifier",
                            "name": "e"
                        },
                        "body": {
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
                                                "value": `Attempt to force execution of for (${escodegen.generate(args.left)} in ${escodegen.generate(args.right)}) failed`,
                                            },
                                            {
                                                "type": "Literal",
                                                "value": 0,
                                            }
                                        ],
                                        "optional": false
                                    }
                                }
                            ]
                        }
                    },
                    "finalizer": null
                },
                args,
            ],
        };
    }
}
