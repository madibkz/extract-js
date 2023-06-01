/*
there is a high chance that the body of a for in statement will fail without the init var, so use a try statement

turns:
    for (var x in y) {
        body
    }
=>
    try {
        logMultiexec("Attempting to force execution of For In statement");
        body
        logMultiexec("Attempt to force execution of For In statement succeeded");
    } catch (e) {
        logMultiexec("Attempt to force execution of For In statement failed");
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
                                            "value": `for (${escodegen.generate(args.left)} in ${escodegen.generate(args.right)}) (ATTEMPTING TO FORCE EXECUTION OF BODY)`,
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
                                            "value": `} (ATTEMPT TO FORCE EXECUTION OF for (${escodegen.generate(args.left)} in ${escodegen.generate(args.right)}) SUCCEEDED)`,
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
                                                "value": `} (ATTEMPT TO FORCE EXECUTION OF for (${escodegen.generate(args.left)} in ${escodegen.generate(args.right)}) FAILED)`,
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
                                "value": `for (${escodegen.generate(args.left)} in ${escodegen.generate(args.right)}) {`,
                            },
                            {
                                "type": "Literal",
                                "value": 2
                            }
                        ]
                    }
                },
                args,
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
                                "value": `} (EXITED for (${escodegen.generate(args.left)} in ${escodegen.generate(args.right)}))`,
                            },
                            {
                                "type": "Literal",
                                "value": 0
                            }
                        ]
                    }
                },
            ],
        };
    }
}
