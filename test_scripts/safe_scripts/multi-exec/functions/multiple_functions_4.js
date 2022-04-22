function test1() {
  return test2();
}

function test2() {
  if (1 + 2 == 3) {
    return "SHOULDSKIP1";
  } else {
    return test3();
  }
}

function test3() {
  if (1 + 2 == 4) {
    return "SHOULDSKIP2";
  } else {
    return test4();
  }
}

function test4() {
  if (1 + 2 == 3) {
    return "SHOULDSKIP3";
  } else {
    return "FINALRETURNVALUE";
  }
}

console.log(test1());
