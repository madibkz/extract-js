/* transforms function so that it executes all the code in it and returns the last return value it reached at the end
    function example(x) {
        if (x == 1) {
            return 0;
        } else {
            return;
        }
        return 1;
    }
=>
    function example(x) {
        logMultiexec("Entered function example(x)");
        if (x == 1) {
            logMultiexec("skipped return 0");
        } else {
            logMultiexec("skipped return");
        }
        {
            var temp_return_value = 1;
            logMultiexec("Exited function example(x) with return value " + temp_return_value);
            return temp_return_value;
        }
    }
 */

const escodegen = require("escodegen");
const traverse = require("../../utils.js").traverse;

//TODO: copy/clone the return value?
//POSSIBLE TODO: clone a non multi-exec of the function and return the normal value from that, then force exec the function body?
module.exports = (args) => {
    //LOG THAT THAT THE FUNCTION HAS BEEN ENTERED AND WITH WHAT ARGUMENTS
    args.body.body.unshift(
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
                        "type": "BinaryExpression",
                        "left": {
                            "type": "BinaryExpression",
                            "left": {
                                "type": "Literal",
                                "value": `${args.id.name}(`,
                            },
                            "operator": "+",
                            "right": {
                                "type": "CallExpression",
                                "callee": {
                                    "type": "MemberExpression",
                                    "object": {
                                        "type": "Identifier",
                                        "name": "Array"
                                    },
                                    "property": {
                                        "type": "Identifier",
                                        "name": "from"
                                    },
                                    "computed": false,
                                    "optional": false
                                },
                                "arguments": [
                                    {
                                        "type": "Identifier",
                                        "name": "arguments"
                                    }
                                ],
                                "optional": false
                            }
                        },
                        "operator": "+",
                        "right": {
                            "type": "Literal",
                            "value": ") GOT CALLED:",
                        }
                    },
                    {
                        "type": "Literal",
                        "value": 2,
                    }
                ],
                "optional": false
            }
        }
    );

    //TRAVERSE THE FUNCTION BODY TO GET THE LAST RETURN STATEMENT
    let return_count = 0;
    traverse(args.body.body, function(key, val) {
        if (!val) return;
        if (val.type == "ReturnStatement") {
            val.return_count = return_count;
            return_count++;
        }
    });

    //RETURN STATEMENT MODIFICATIONS - LOGGING THE EXIT OF THE FUNCTION AND RETURN VALUE:
    if (return_count == 0) { //IF THERE IS NO RETURN OF THE FUNCTION, JUST MONITOR EXITING OF THE FUNCTION
        args.body.body.push(
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
                            "type": "BinaryExpression",
                            "left": {
                                "type": "BinaryExpression",
                                "left": {
                                    "type": "Literal",
                                    "value": `EXITED FUNCTION ${args.id.name}(`,
                                },
                                //TODO: make it so if the argument string is too long, it truncates it
                                "operator": "+",
                                "right": {
                                    "type": "CallExpression",
                                    "callee": {
                                        "type": "MemberExpression",
                                        "object": {
                                            "type": "Identifier",
                                            "name": "Array"
                                        },
                                        "property": {
                                            "type": "Identifier",
                                            "name": "from"
                                        },
                                        "computed": false,
                                        "optional": false
                                    },
                                    "arguments": [
                                        {
                                            "type": "Identifier",
                                            "name": "arguments"
                                        }
                                    ],
                                    "optional": false
                                }
                            },
                            "operator": "+",
                            "right": {
                                "type": "Literal",
                                "value": ") WITH NO RETURN VALUE",
                            }
                        },
                        {
                            "type": "Literal",
                            "value": 0,
                        }
                    ],
                    "optional": false
                }
            }
        );
    } else { //ELSE IF THERE ARE/IS A RETURN STATEMENT
        traverse(args.body.body, function(key, val) {
            if (!val) return;
            if (val.type == "ReturnStatement") {
                if (val.return_count == "traversed") { //PREVENT RETRAVERSAL OF THE RETURN STATEMENT
                    return;
                }
                if (val.return_count == return_count - 1) { //last return
                    val.return_count = "traversed";
                    return val.argument ? {
                            "type": "BlockStatement",
                            "body": [
                                {
                                    "type": "VariableDeclaration",
                                    "declarations": [
                                        {
                                            "type": "VariableDeclarator",
                                            "id": {
                                                "type": "Identifier",
                                                "name": "temp_return_value"
                                            },
                                            "init": val.argument
                                        }
                                    ],
                                    "kind": "var"
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
                                                "type": "BinaryExpression",
                                                "left": {
                                                    "type": "BinaryExpression",
                                                    "left": {
                                                        "type": "Literal",
                                                        "value": `EXITED FUNCTION ${args.id.name}(`,
                                                    },
                                                    "operator": "+",
                                                    "right": {
                                                        "type": "CallExpression",
                                                        "callee": {
                                                            "type": "MemberExpression",
                                                            "object": {
                                                                "type": "Identifier",
                                                                "name": "Array"
                                                            },
                                                            "property": {
                                                                "type": "Identifier",
                                                                "name": "from"
                                                            },
                                                            "computed": false,
                                                            "optional": false
                                                        },
                                                        "arguments": [
                                                            {
                                                                "type": "Identifier",
                                                                "name": "arguments"
                                                            }
                                                        ],
                                                        "optional": false
                                                    }
                                                },
                                                "operator": "+",
                                                "right": {
                                                    "type": "BinaryExpression",
                                                    "left": {
                                                        "type": "Literal",
                                                        "value": `) WITH RETURN VALUE: `,
                                                    },
                                                    "operator": "+",
                                                    "right": {
                                                        "type": "Identifier",
                                                        "name": "temp_return_value"
                                                    }
                                                }
                                            },
                                            {
                                                "type": "Literal",
                                                "value": 0,
                                            }
                                        ],
                                        "optional": false
                                    }
                                },
                                {
                                    "type": "ReturnStatement",
                                    "argument": {
                                        "type": "Identifier",
                                        "name": "temp_return_value"
                                    },
                                    return_count: "traversed"
                                }
                            ],
                        }
                        :  //IF THERE IS NO RETURN VALUE
                        {
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
                                            "type": "BinaryExpression",
                                            "left": {
                                                "type": "BinaryExpression",
                                                "left": {
                                                    "type": "Literal",
                                                    "value": `EXITED FUNCTION ${args.id.name}(`,
                                                },
                                                "operator": "+",
                                                "right": {
                                                    "type": "CallExpression",
                                                    "callee": {
                                                        "type": "MemberExpression",
                                                        "object": {
                                                            "type": "Identifier",
                                                            "name": "Array"
                                                        },
                                                        "property": {
                                                            "type": "Identifier",
                                                            "name": "from"
                                                        },
                                                        "computed": false,
                                                        "optional": false
                                                    },
                                                    "arguments": [
                                                        {
                                                            "type": "Identifier",
                                                            "name": "arguments"
                                                        }
                                                    ],
                                                    "optional": false
                                                }
                                            },
                                            "operator": "+",
                                            "right": {
                                                "type": "Literal",
                                                "value": ") WITH NO RETURN VALUE",
                                            }
                                        },
                                        {
                                            "type": "Literal",
                                            "value": 0,
                                        }
                                    ],
                                    "optional": false
                                }
                            },
                            val
                        ]
                    }
                } else {
                    val.return_count = "traversed";
                    return {
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "logMultiexec"
                            },
                            "arguments": val.argument ? [
                                    {
                                        "type": "BinaryExpression",
                                        "left": {
                                            "type": "BinaryExpression",
                                            "left": {
                                                "type": "Literal",
                                                "value": `return ${escodegen.generate(val.argument)} (SKIPPED WITH VALUE: `,
                                            },
                                            "operator": "+",
                                            "right": val.argument
                                        },
                                        "operator": "+",
                                        "right": {
                                            "type": "Literal",
                                            "value": ")",
                                        }
                                    },
                                    {
                                        "type": "Literal",
                                        "value": 1,
                                    }
                                ] :
                            [
                                {
                                    "type": "Literal",
                                    "value": `return (SKIPPED)`,
                                },
                                {
                                    "type": "Literal",
                                    "value": 1,
                                }
                            ],
                            "optional": false
                        }

                    }
                }
            }
        });
    }

    return args;
};