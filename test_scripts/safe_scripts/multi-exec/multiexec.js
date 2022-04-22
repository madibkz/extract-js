function test(x) {
	for (var i = 0; i < 2; i++) {
		continue;
		console.log(i);
	}
	var y = [1,2];
	for (var o in y) {
		console.log(o);
	}

	var i = 0;
	while (i < 2) {
		break;
		console.log(i);
		i++;
	}
	do {
		console.log(i);
		i--;
	} while (i > 0);

	return 5;

	switch (x) {
		case 0:
			console.log(0);
			break;
		case 1:
			console.log(1);
			break;
		default:
			break;
	}

	if (x == 0) {
			console.log(0);
	} else if (x == 1) {
			console.log(1);
	}

	return "FUNCTION FINISHED";
}

try {
	console.log("STARTING");
	test(0);
} catch(e) {
	console.log("IN CATCH CLAUSE");
} finally {
	console.log("FINISHED TEST");
}
