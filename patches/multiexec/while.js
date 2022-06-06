/*
make sure that while's body is executed at least once
turns:
    while (test) {
        body
    }
=>
    if (!test) {
        body
    }
    while (test) {
        body
    }
(and with --multi-exec-loop-limit):
    if (!test) {
        body
    }
    let __loopcount = 0;
    while (test && __loopcount++ < 100) {
        body
    }
 */

const escodegen = require("escodegen");

module.exports = (args, forcebodyflag, looplimit) => {
    if (!args.haveAlreadyForcedBody) {
        args.haveAlreadyForcedBody = true;

        let res = {
            "type": "BlockStatement",
            "body": [
            ],
        };

        //FORCED EXECUTION OF WHILE BODY
        let forced_body = {
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
                                    "value": `while (${escodegen.generate(args.test)}) { (FORCED EXECUTION OF WHILE BODY)`,
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
                                    "value": `} (EXITED FORCED EXECUTION OF BODY OF while (${escodegen.generate(args.test)}))`,
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
        };
        if (forcebodyflag)
            res.body.push(forced_body);

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

        //WHILE LOOP
        let while_loop = [{
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
                        "value": `while (${escodegen.generate(args.test)}) {`,
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
                            "value": `} (EXITED while (${escodegen.generate(args.test)}))`,
                        },
                        {
                            "type": "Literal",
                            "value": 0
                        }
                    ]
                }
            }
        ];

        res.body = res.body.concat(while_loop);

        return res;
    }
}
