/*
transforms function so that it executes all the code in it and returns the last return value it reached at the end

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
        console.log("Entered function example(x)");
        if (x == 1) {
            console.log("skipped return 0");
        } else {
            console.log("skipped return");
        }
        {
            var temp_return_value = 1;
            console.log("Exited function example(x) with return value " + temp_return_value);
            return temp_return_value;
        }
    }
 */

const escodegen = require("escodegen");
const traverse = require("../../utils.js").traverse;

//TODO: copy/clone the return value?
//POSSIBLE TODO: clone a non multi-exec of the function and return the normal value from that, then force exec the function body?
module.exports = (args) => {
    args.body.body.unshift(
        {
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
                            "value": `Entered function ${args.id.name}(`,
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
                        "value": ")",
                    }
                }
            ],
            "optional": false
        }
    );
    let return_count = 0;
    traverse(args.body.body, function(key, val) {
        if (!val) return;
        if (val.type == "ReturnStatement") {
            val.return_count = return_count;
            return_count++;
        }
    });
    if (return_count == 0) {
        args.body.body.push(
            {
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
                                "value": `Exited function ${args.id.name}(`,
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
                            "value": ") with no return value",
                        }
                    }
                ],
                "optional": false
            }
        );
    } else {
        traverse(args.body.body, function(key, val) {
            if (!val) return;
            if (val.type == "ReturnStatement") {
                if (val.return_count == "traversed") {
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
                                                        "value": `Exited function ${args.id.name}(`,
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
                                                        "value": `) with return value `,
                                                    },
                                                    "operator": "+",
                                                    "right": {
                                                        "type": "Identifier",
                                                        "name": "temp_return_value"
                                                    }
                                                }
                                            },
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
                                                "value": `Exited function ${args.id.name}(`,
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
                                            "value": ") with no return value",
                                        }
                                    }
                                ],
                                "optional": false
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
                                                "type": "Literal",
                                                "value": `Skipped return ${escodegen.generate(val.argument)} with value: `,
                                            },
                                            "operator": "+",
                                            "right": val.argument
                                    }
                            ] :
                            [
                                {
                                    "type": "Literal",
                                    "value": `Skipped return`,
                                },
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

//PREVIOUS VERSION:

/*
transforms function so that it executes all the code in it,
but returns the first return value it reached at the end

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
        functionReturnSet.push(false);
        if (x == 1) {
            if (functionReturnSet[functionReturnSet.length - 1] == false) { //if the first return has not been reached
                functionReturnStack.push(0); // push return value on stack
                functionReturnSet[functionReturnSet.length - 1] = true;
            } else {
                console.log("skipped return 0 with value ", 0)
            }
        } else {
            if (functionReturnSet[functionReturnSet.length - 1] == false) {
                functionReturnStack.push("NO RETURN VALUE");
                functionReturnSet[functionReturnSet.length - 1] = true;
            } else {
                console.log("skipped return") :
            }
        }
        if (functionReturnSet[functionReturnSet.length - 1] == false) { //if the first return has not been reached
            functionReturnStack.push(1); // push return value on stack
            functionReturnSet[functionReturnSet.length - 1] = true;
        } else {
            console.log("skipped return 1 with value ", 1)
        }
        if (!functionReturnSet.pop() || functionReturnStack[functionReturnStack.length - 1] == "NO RETURN VALUE") {
            functionReturnStack.pop();
            return;
        }
        return functionReturnStack.pop();
    }
 */

// const escodegen = require("escodegen");
// const traverse = require("../../utils.js").traverse;
//
// //TODO: copy/clone the return value?
// //TODO: realized that due to multi-execution, the first return it reaches won't be the *correct* value so maybe change later to act different tho this still executes the whole function
// module.exports = (args) => {
//     args.body.body.unshift({
//         "type": "ExpressionStatement",
//         "expression": {
//             "type": "CallExpression",
//             "callee": {
//                 "type": "MemberExpression",
//                     "object": {
//                     "type": "Identifier",
//                         "name": "functionReturnSet"
//                 },
//                 "property": {
//                     "type": "Identifier",
//                         "name": "push"
//                 },
//                 "computed": false,
//                     "optional": false
//             },
//             "arguments": [
//             {
//                 "type": "Literal",
//                 "value": false,
//             }
//             ],
//             "optional": false
//         }
//     });
//     args.body.body.unshift({
//         "type": "ExpressionStatement",
//         "expression": {
//         "type": "CallExpression",
//             "callee": {
//                 "type": "Identifier",
//                 "name": "logMultiexec"
//             },
//             "computed": false
//         },
//         "arguments": [
//             {
//                 "type": "Literal",
//                 "value": `Entered function ${args.id.name}`,
//             }
//         ]
//     });
//     traverse(args.body.body, function(key, val) {
//         if (!val) return;
//         if (val.type == "ReturnStatement") {
//             return {
//                 "type": "BlockStatement",
//                 "body": [
//                     {
//                         "type": "IfStatement",
//                         "test": {
//                             "type": "BinaryExpression",
//                             "left": {
//                                 "type": "MemberExpression",
//                                 "object": {
//                                     "type": "Identifier",
//                                     "name": "functionReturnSet"
//                                 },
//                                 "property": {
//                                     "type": "BinaryExpression",
//                                     "left": {
//                                         "type": "MemberExpression",
//                                         "object": {
//                                             "type": "Identifier",
//                                             "name": "functionReturnSet"
//                                         },
//                                         "property": {
//                                             "type": "Identifier",
//                                             "name": "length"
//                                         },
//                                         "computed": false,
//                                         "optional": false
//                                     },
//                                     "operator": "-",
//                                     "right": {
//                                         "type": "Literal",
//                                         "value": 1,
//                                     }
//                                 },
//                                 "computed": true,
//                                 "optional": false
//                             },
//                             "operator": "==",
//                             "right": {
//                                 "type": "Literal",
//                                 "value": false,
//                             }
//                         },
//                         "consequent": {
//                             "type": "BlockStatement",
//                             "body": [
//                                 {
//                                     "type": "ExpressionStatement",
//                                     "expression": {
//                                         "type": "CallExpression",
//                                         "callee": {
//                                             "type": "MemberExpression",
//                                             "object": {
//                                                 "type": "Identifier",
//                                                 "name": "functionReturnStack"
//                                             },
//                                             "property": {
//                                                 "type": "Identifier",
//                                                 "name": "push"
//                                             },
//                                             "computed": false,
//                                             "optional": false
//                                         },
//                                         "arguments": val.argument ? [ val.argument ] : [
//                                             {
//                                                 "type": "Literal",
//                                                 "value": `NO RETURN VALUE`,
//                                             },
//                                         ],
//                                         "optional": false
//                                     }
//                                 },
//                                 {
//                                     "type": "ExpressionStatement",
//                                     "expression": {
//                                         "type": "AssignmentExpression",
//                                         "operator": "=",
//                                         "left": {
//                                             "type": "MemberExpression",
//                                             "object": {
//                                                 "type": "Identifier",
//                                                 "name": "functionReturnSet"
//                                             },
//                                             "property": {
//                                                 "type": "BinaryExpression",
//                                                 "left": {
//                                                     "type": "MemberExpression",
//                                                     "object": {
//                                                         "type": "Identifier",
//                                                         "name": "functionReturnSet"
//                                                     },
//                                                     "property": {
//                                                         "type": "Identifier",
//                                                         "name": "length"
//                                                     },
//                                                     "computed": false,
//                                                     "optional": false
//                                                 },
//                                                 "operator": "-",
//                                                 "right": {
//                                                     "type": "Literal",
//                                                     "value": 1,
//                                                 }
//                                             },
//                                             "computed": true,
//                                             "optional": false
//                                         },
//                                         "right": {
//                                             "type": "Literal",
//                                             "value": true,
//                                         }
//                                     }
//                                 }
//                             ]
//                         },
//                         "alternate": {
//                             "type": "BlockStatement",
//                             "body": [
//                                 {
//                                     "type": "ExpressionStatement",
//                                     "expression": {
//                                         "type": "CallExpression",
//                                         "callee": {
//                                             "type": "Identifier",
//                                             "name": "logMultiexec"
//                                         },
//                                         "arguments": val.argument ? [
//                                                 {
//                                                         "type": "BinaryExpression",
//                                                         "left": {
//                                                             "type": "Literal",
//                                                             "value": `Skipped return ${escodegen.generate(val.argument)} with value: `,
//                                                         },
//                                                         "operator": "+",
//                                                         "right": val.argument
//                                                 }
//                                         ] :
//                                         [
//                                             {
//                                                 "type": "Literal",
//                                                 "value": `Skipped return`,
//                                             },
//                                         ],
//                                         "optional": false
//                                     }
//                                 }
//                             ]
//                         }
//                     }
//                 ]
//             }
//         }
//     });
//     args.body.body.push({
//         "type": "ExpressionStatement",
//         "expression": {
//             "type": "CallExpression",
//             "callee": {
//                 "type": "Identifier",
//                 "name": "logMultiexec"
//             },
//             "arguments": [
//                 {
//                     "type": "Literal",
//                     "value": `Exiting function ${args.id.name}`,
//                 }
//             ]
//         },
//     });
//     args.body.body = args.body.body.concat(
//         [
//             {
//                 "type": "IfStatement",
//                 "test": {
//                     "type": "LogicalExpression",
//                     "left": {
//                         "type": "UnaryExpression",
//                         "operator": "!",
//                         "prefix": true,
//                         "argument": {
//                             "type": "CallExpression",
//                             "callee": {
//                                 "type": "MemberExpression",
//                                 "object": {
//                                     "type": "Identifier",
//                                     "name": "functionReturnSet"
//                                 },
//                                 "property": {
//                                     "type": "Identifier",
//                                     "name": "pop"
//                                 },
//                                 "computed": false,
//                                 "optional": false
//                             },
//                             "arguments": [],
//                             "optional": false
//                         }
//                     },
//                     "operator": "||",
//                     "right": {
//                         "type": "BinaryExpression",
//                         "left": {
//                             "type": "MemberExpression",
//                             "object": {
//                                 "type": "Identifier",
//                                 "name": "functionReturnStack"
//                             },
//                             "property": {
//                                 "type": "BinaryExpression",
//                                 "left": {
//                                     "type": "MemberExpression",
//                                     "object": {
//                                         "type": "Identifier",
//                                         "name": "functionReturnStack"
//                                     },
//                                     "property": {
//                                         "type": "Identifier",
//                                         "name": "length"
//                                     },
//                                     "computed": false,
//                                     "optional": false
//                                 },
//                                 "operator": "-",
//                                 "right": {
//                                     "type": "Literal",
//                                     "value": 1,
//                                 }
//                             },
//                             "computed": true,
//                             "optional": false
//                         },
//                         "operator": "==",
//                         "right": {
//                             "type": "Literal",
//                             "value": "NO RETURN VALUE",
//                         }
//                     }
//                 },
//                 "consequent": {
//                     "type": "BlockStatement",
//                     "body": [
//                         {
//                             "type": "ExpressionStatement",
//                             "expression": {
//                                 "type": "CallExpression",
//                                 "callee": {
//                                     "type": "MemberExpression",
//                                     "object": {
//                                         "type": "Identifier",
//                                         "name": "functionReturnStack"
//                                     },
//                                     "property": {
//                                         "type": "Identifier",
//                                         "name": "pop"
//                                     },
//                                     "computed": false,
//                                     "optional": false
//                                 },
//                                 "arguments": [],
//                                 "optional": false
//                             }
//                         },
//                         {
//                             "type": "ReturnStatement",
//                             "argument": null
//                         }
//                     ]
//                 },
//                 "alternate": null
//             },
//             {
//                 "type": "ReturnStatement",
//                 "argument": {
//                     "type": "CallExpression",
//                     "callee": {
//                         "type": "MemberExpression",
//                         "object": {
//                             "type": "Identifier",
//                             "name": "functionReturnStack"
//                         },
//                         "property": {
//                             "type": "Identifier",
//                             "name": "pop"
//                         },
//                         "computed": false,
//                         "optional": false
//                     },
//                     "arguments": [],
//                     "optional": false
//                 }
//             }
//         ]
//     );
//     return args;
// };