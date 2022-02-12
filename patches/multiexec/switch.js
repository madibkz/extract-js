/*
turns:
    switch (discriminant) {
        case CASE1:
            consequent1
        case CASE2:
            consequent2
        ...
        default:
            consequent3
    }
=>
    lib.logControl("switch (discriminant)");
    lib.logControl("case (CASE1):");
    consequent1
    lib.logControl("case (CASE2):");
    consequent2
    lib.logControl("default:");
    consequent3
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
                        "value": `Entering switch (${escodegen.generate(args.discriminant)})`,
                    },
                    {
                        "type": "Literal",
                        "value": 2,
                    }
                ]
            }
        },
    ].concat(args.cases.map(switchcase => {
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
                                "value": switchcase.test ? `case (${escodegen.generate(switchcase.test)}):` : "default:",
                            },
                            {
                                "type": "Literal",
                                "value": 2,
                            }
                        ]
                    }
                },
            ].concat(switchcase.consequent).concat({
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
                            "value": "",
                        },
                        {
                            "type": "Literal",
                            "value": 0,
                        }
                    ]
                },
            })
        }
        }),
    ).concat({
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
                    "value": `Exited switch (${escodegen.generate(args.discriminant)})`,
                },
                {
                    "type": "Literal",
                    "value": 0,
                }
            ]
        }
    })
});
