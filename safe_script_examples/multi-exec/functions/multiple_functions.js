function test() {
  return test2();
}

function test2() {
  return 1;
}

console.log(test());
