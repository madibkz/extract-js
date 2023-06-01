function f() {
  console.log("f called");
}

function g() {
  console.log("g called");
}

(1 == 2) ? f() : g();
