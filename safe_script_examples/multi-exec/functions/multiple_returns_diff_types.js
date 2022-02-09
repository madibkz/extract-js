function test(x) {
  return;
  if (x == 1) {
    return 5;
  }
  return 3;
}

//should print undefined
console.log(test(1));
