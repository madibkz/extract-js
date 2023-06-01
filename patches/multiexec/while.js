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
 */

const escodegen = require("escodegen");

module.exports = (args) => {
    if (!args.haveAlreadyForcedBody) {
        args.haveAlreadyForcedBody = true;
        return {
            "type": "BlockStatement",
            "body": [
                //FORCED EXECUTION OF WHILE BODY
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
                },

                //WHILE LOOP
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
                },
            ],
        };
    }
}
