/*
foo(bar, baz) becomes (x => eval == x ? arg => eval(rewrite(arg, true)) : x)(foo)(bar, baz)
however, if multiexec is on then
 foo(bar, baz) becomes (x => eval == x ?
    arg => evalUntilPasses(rewrite(arg, true), eval)
 	: x)(foo)(bar, baz) */
module.exports = (foo, multiexec) => {
	if (foo["nothis_rewritten"]) {
		return;
	}

	if (!multiexec) {
		return {
			"nothis_rewritten": true,
			"autogenerated": true,
			"type": "CallExpression",
			"callee": {
				"nothis_rewritten": true,
				"type": "ArrowFunctionExpression",
				"id": null,
				"params": [
					{
						"type": "Identifier",
						"name": "x",
					},
				],
				"defaults": [],
				"body": {
					"type": "ConditionalExpression",
					"test": {
						"type": "BinaryExpression",
						"operator": "==",
						"left": {
							"type": "Identifier",
							"name": "eval",
						},
						"right": {
							"type": "Identifier",
							"name": "x",
						},
					},
					"consequent": {
						"type": "ArrowFunctionExpression",
						"id": null,
						"params": [
							{
								"type": "Identifier",
								"name": "arg",
							},
						],
						"defaults": [],
						"body": {
							"type": "CallExpression",
							"callee": {
								"nothis_rewritten": true,
								"type": "MemberExpression",
								"computed": false,
								"object": {
									"type": "Identifier",
									"name": "eval",
								},
								"property": {
									"type": "Identifier",
									"name": "call",
								},
							},
							"nothis_rewritten": true,
							"arguments": [
								{
									"type": "ThisExpression",
								},
								{
									"type": "CallExpression",
									"callee": {
										"nothis_rewritten": true,
										"type": "Identifier",
										"name": "rewrite",
									},
									"nothis_rewritten": true,
									"arguments": [
										{
											"type": "Identifier",
											"name": "arg",
										},
										{
											"type": "Literal",
											"value": true,
										},
									],
								},
							],
						},
						"generator": false,
						"expression": true,
					},
					"alternate": {
						"type": "Identifier",
						"name": "x",
					},
				},
				"generator": false,
				"expression": true,
			},
			"arguments": [
				foo,
			],
		};
	} else {
		return {
			"nothis_rewritten": true,
			"autogenerated": true,
			"type": "CallExpression",
			"callee": {
				"nothis_rewritten": true,
				"type": "ArrowFunctionExpression",
				"id": null,
				"params": [
					{
						"type": "Identifier",
						"name": "x",
					},
				],
				"defaults": [],
				"body": {
					"type": "ConditionalExpression",
					"test": {
						"type": "BinaryExpression",
						"operator": "==",
						"left": {
							"type": "Identifier",
							"name": "eval",
						},
						"right": {
							"type": "Identifier",
							"name": "x",
						},
					},
					"consequent": {
						"type": "ArrowFunctionExpression",
						"id": null,
						"params": [
							{
								"type": "Identifier",
								"name": "arg",
							},
						],
						"defaults": [],
						"body": {
							"type": "CallExpression",
							"callee": {
								"nothis_rewritten": true,
								"type": "MemberExpression",
								"computed": false,
								"object": {
									"type": "Identifier",
									"name": "evalUntilPasses",
								},
								"property": {
									"type": "Identifier",
									"name": "call",
								},
							},
							"nothis_rewritten": true,
							"arguments": [
								{
									"type": "ThisExpression",
								},
								{
									"type": "CallExpression",
									"callee": {
										"nothis_rewritten": true,
										"type": "Identifier",
										"name": "rewrite",
									},
									"nothis_rewritten": true,
									"arguments": [
										{
											"type": "Identifier",
											"name": "arg",
										},
										{
											"type": "Literal",
											"value": true,
										},
									],
								},
								{
									"type": "Identifier",
									"name": "eval"
								}
							],
						},
						"generator": false,
						"expression": true,
					},
					"alternate": {
						"type": "Identifier",
						"name": "x",
					},
				},
				"generator": false,
				"expression": true,
			},
			"arguments": [
				foo,
			],
		};

	}
}