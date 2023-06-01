/*
execute the body of the for loop once, if the for loop will not be executed

turns:
    for (init; test; update) {
        body
    }
=>
    {
        init
        if (!test) {
            logMultiexec("for (init; test; update;) (FORCING EXECUTION OF BODY OF FOR LOOP)", 2);
            body
            logMultiexec("for (init; test; update;) (EXITING FORCED EXECUTION OF BODY OF FOR LOOP)", 0);
        }
    }
    for (init; test; update) {
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
                //FORCED EXECUTION OF BODY PART
                {
                    "type": "BlockStatement",
                    "body": [
                        args.init ? args.init : getPlaceholderStatement(),
                        {
                            dontRemoveIfStatement: true,
                            "type": "IfStatement",
                            "test": args.test ?
                                {
                                    "type": "UnaryExpression",
                                    "operator": "!",
                                    "prefix": true,
                                    "argument": args.test
                                }
                                :
                                {
                                    "type": "ExpressionStatement",
                                    "expression": {
                                        "type": "Literal",
                                        "value": true,
                                },
                            },
                            "consequent": {
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
                                                    "value": `for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};) { (FORCED EXECUTION OF FOR BODY)`,
                                                },
                                                {
                                                    "type": "Literal",
                                                    "value": 2,
                                                }
                                            ]
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
                                                    "value": `} (EXITED FORCED EXECUTION OF BODY OF for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};))`,
                                                },
                                                {
                                                    "type": "Literal",
                                                    "value": 0,
                                                }
                                            ]
                                        }
                                    },
                                ]
                            },
                            "alternate": null
                        },
                    ],
                },

                //FOR LOOP
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
                                "value": `for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};)`,
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
                                "value": `} (EXITED for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};))`,
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

function getPlaceholderStatement() {
    return {
        "type": "ExpressionStatement",
        "expression": {
        "type": "Literal",
            "value": 1,
    }
    }
}