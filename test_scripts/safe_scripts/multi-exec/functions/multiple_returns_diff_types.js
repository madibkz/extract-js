function test(x) {
  return 3;
  if (x == 1) {
    return 5;
  }
  return;
}

//should print undefined
console.log(test(1));
