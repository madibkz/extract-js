function test1() {
  return test2();
}

function test2() {
  if (1 + 2 == 3) {
    return test3();
  } else {
    return "test FAIL";
  }
}

function test3() {
  if (1 + 2 == 4) {
    return test4();
  } else {
    return "test FAIL";
  }
}

function test4() {
  if (1 + 2 == 3) {
    return "TEST PASS";
  } else {
    return "test FAIL";
  }
}

console.log(test1());
