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
    //__loopcount is only there with --multi-exec-loop-limit
    let __loopcount = 0;
    for (init; test && ++__loopcount < 100; update) {
        body
    }
 */

const escodegen = require("escodegen");

module.exports = (args, forcebodyflag, looplimit) => {
    if (!args.haveAlreadyForcedBody) {
        args.haveAlreadyForcedBody = true;
        let res = {
            "type": "BlockStatement",
            "body": [],
        };

        //FORCED EXECUTION OF BODY PART
        let forcedbody = {
            "type": "BlockStatement",
            "body": [
                args.init ? JSON.parse(JSON.stringify(args.init)) : getPlaceholderStatement(),
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
                            "type": "Literal",
                            "value": true,
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
        };
        if (forcebodyflag)
            res.body.push(forcedbody);

        if (looplimit !== 0) {
            res.body.push({
                "type": "VariableDeclaration",
                "declarations": [
                    {
                        "type": "VariableDeclarator",
                        "id": {
                            "type": "Identifier",
                            "name": "__loopcount"
                        },
                        "init": {
                            "type": "Literal",
                            "value": 0,
                        }
                    }
                ],
                "kind": "let"}
            );

            if (args.test === null) {
                args.test = {
                    "type": "BinaryExpression",
                    "left": {
                        "type": "UpdateExpression",
                        "operator": "++",
                        "prefix": false,
                        "argument": {
                            "type": "Identifier",
                            "name": "__loopcount"
                        }
                    },
                    "operator": "<",
                    "right": {
                        "type": "Literal",
                        "value": looplimit,
                    }
                };
            } else {
                args.test = {
                    "type": "LogicalExpression",
                    "left": args.test,
                    "operator": "&&",
                    "right": {
                        "type": "BinaryExpression",
                        "left": {
                            "type": "UpdateExpression",
                            "operator": "++",
                            "prefix": false,
                            "argument": {
                                "type": "Identifier",
                                "name": "__loopcount"
                            }
                        },
                        "operator": "<",
                        "right": {
                            "type": "Literal",
                            "value": looplimit,
                        }
                    }
                };
            }
        }

        //FOR LOOP
        let forloop = [
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
            }
        ];

        res.body = res.body.concat(forloop);

        return res;
    }
}

function getPlaceholderStatement() {
    return {
            "type": "Literal",
            "value": 1,
    }
}