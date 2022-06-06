/*
just logs when do while loop is entered and exited

with //--multi-exec-loop-limit:
let __loopcount = 0;
do {
    body;
} while (test && ++__loopcount < 100);
 */

const escodegen = require("escodegen");

module.exports = (args, looplimit) => {
    if (!args.haveAlreadyForcedBody) {
        args.haveAlreadyForcedBody = true;

        let res = {
            "type": "BlockStatement",
            "body": [
            ],
        };

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
                        "prefix": true,
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

        let dowhile = [
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
                            "value": `do {`,
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
                            "value": `} while (${escodegen.generate(args.test)}) (EXITED)`,
                        },
                        {
                            "type": "Literal",
                            "value": 0
                        }
                    ]
                }
            }
        ];

        res.body = res.body.concat(dowhile);

        return res;
    }
}
