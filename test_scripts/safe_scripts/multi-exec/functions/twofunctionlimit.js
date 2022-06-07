function f() {
  console.log("f");
  g();
  return;
}

function g() {
  console.log("g");
  f();
  return;
}

f();
console.log("reached end");
