/*
foo.bar(baz) becomes:

(fun => {
	return function() {
		if (fun == eval) arguments[0] = rewrite(arguments[0], true);
		return fun.apply(foo, arguments)
	}
})(foo.bar)(baz)
however if multiexec is enabled:
foo.bar(baz) becomes:

(fun => {
	return function() {
		if (fun == eval) {
			arguments[0] = rewrite(arguments[0], true);
			fun = evalUntilPasses;
		// from https://stackoverflow.com/questions/13610987/javascript-add-extra-argument
			[].push.call(arguments, eval);
		};
		return fun.apply(foo, arguments)
	}
})(foo.bar)(baz)
*/
module.exports = (foo, foobar, multiexec) => {
	if (!multiexec) {
		return {
			"type": "CallExpression",
			"callee": {
				"autogenerated": true,
				"type": "ArrowFunctionExpression",
				"id": null,
				"params": [
					{
						"type": "Identifier",
						"name": "fun",
					},
				],
				"defaults": [],
				"body": {
					"type": "BlockStatement",
					"body": [
						{
							"type": "ReturnStatement",
							"argument": {
								"type": "FunctionExpression",
								"id": null,
								"params": [],
								"defaults": [],
								"body": {
									"type": "BlockStatement",
									"body": [
										{
											"type": "IfStatement",
											"test": {
												"type": "BinaryExpression",
												"operator": "==",
												"left": {
													"type": "Identifier",
													"name": "fun",
												},
												"right": {
													"type": "Identifier",
													"name": "eval",
												},
											},
											"consequent": {
												"type": "ExpressionStatement",
												"expression": {
													"type": "AssignmentExpression",
													"operator": "=",
													"left": {
														"type": "MemberExpression",
														"object": {
															"type": "Identifier",
															"name": "arguments"
														},
														"property": {
															"type": "Literal",
															"value": 0,
														},
														"computed": true,
														"optional": false
													},
													"right": {
														"type": "CallExpression",
														"callee": {
															"type": "Identifier",
															"name": "rewrite"
														},
														"arguments": [
															{
																"type": "MemberExpression",
																"object": {
																	"type": "Identifier",
																	"name": "arguments"
																},
																"property": {
																	"type": "Literal",
																	"value": 0,
																},
																"computed": true,
																"optional": false
															},
															{
																"type": "Literal",
																"value": true,
															}
														],
														"optional": false
													}
												}
											},
											"alternate": null,
										},
										{
											"type": "ReturnStatement",
											"argument": {
												"type": "CallExpression",
												"callee": {
													"type": "MemberExpression",
													"computed": false,
													"object": {
														"type": "Identifier",
														"name": "fun",
													},
													"property": {
														"type": "Identifier",
														"name": "apply",
													},
												},
												"arguments": [
													foo,
													{
														"type": "Identifier",
														"name": "arguments",
													},
												],
											},
										},
									],
								},
								"generator": false,
								"expression": false,
							},
						},
					],
				},
				"generator": false,
				"expression": false,
			},
			"arguments": [
				foobar,
			],
		}
	} else {
		return {
			"type": "CallExpression",
			"callee": {
				"autogenerated": true,
				"type": "ArrowFunctionExpression",
				"id": null,
				"params": [
					{
						"type": "Identifier",
						"name": "fun",
					},
				],
				"defaults": [],
				"body": {
					"type": "BlockStatement",
					"body": [
						{
							"type": "ReturnStatement",
							"argument": {
								"type": "FunctionExpression",
								"id": null,
								"params": [],
								"defaults": [],
								"body": {
									"type": "BlockStatement",
									"body": [
										{
											"type": "IfStatement",
											"test": {
												"type": "BinaryExpression",
												"operator": "==",
												"left": {
													"type": "Identifier",
													"name": "fun",
												},
												"right": {
													"type": "Identifier",
													"name": "eval",
												},
											},
											"consequent": {
												"type": "BlockStatement",
												"body": [
													{
														"type": "ExpressionStatement",
														"expression": {
															"type": "AssignmentExpression",
															"operator": "=",
															"left": {
																"type": "MemberExpression",
																"object": {
																	"type": "Identifier",
																	"name": "arguments"
																},
																"property": {
																	"type": "Literal",
																	"value": 0,
																},
																"computed": true,
																"optional": false
															},
															"right": {
																"type": "CallExpression",
																"callee": {
																	"type": "Identifier",
																	"name": "rewrite"
																},
																"arguments": [
																	{
																		"type": "MemberExpression",
																		"object": {
																			"type": "Identifier",
																			"name": "arguments"
																		},
																		"property": {
																			"type": "Literal",
																			"value": 0,
																		},
																		"computed": true,
																		"optional": false
																	},
																	{
																		"type": "Literal",
																		"value": true,
																	}
																],
																"optional": false
															}
														}
													},
													{
														"type": "ExpressionStatement",
														"expression": {
															"type": "AssignmentExpression",
															"operator": "=",
															"left": {
																"type": "Identifier",
																"name": "fun"
															},
															"right": {
																"type": "Identifier",
																"name": "evalUntilPasses"
															}
														}
													},
													{
														"type": "ExpressionStatement",
														"expression": {
															"type": "CallExpression",
															"callee": {
																"type": "MemberExpression",
																"object": {
																	"type": "MemberExpression",
																	"object": {
																		"type": "ArrayExpression",
																		"elements": []
																	},
																	"property": {
																		"type": "Identifier",
																		"name": "push"
																	},
																	"computed": false,
																	"optional": false
																},
																"property": {
																	"type": "Identifier",
																	"name": "call"
																},
																"computed": false,
																"optional": false
															},
															"arguments": [
																{
																	"type": "Identifier",
																	"name": "arguments"
																},
																{
																	"type": "Identifier",
																	"name": "eval"
																}
															],
															"optional": false
														}
													}
												]
											},
											"alternate": null,
										},
										{
											"type": "ReturnStatement",
											"argument": {
												"type": "CallExpression",
												"callee": {
													"type": "MemberExpression",
													"computed": false,
													"object": {
														"type": "Identifier",
														"name": "fun",
													},
													"property": {
														"type": "Identifier",
														"name": "apply",
													},
												},
												"arguments": [
													foo,
													{
														"type": "Identifier",
														"name": "arguments",
													},
												],
											},
										},
									],
								},
								"generator": false,
								"expression": false,
							},
						},
					],
				},
				"generator": false,
				"expression": false,
			},
			"arguments": [
				foobar,
			],
		}
	}
};