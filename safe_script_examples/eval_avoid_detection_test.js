var x = () => 1;
for (var p in this) {
  if (p.length == 4) {
    if (p[0] == 'e') {
    console.log("setting " + p);
    x = this[p];
    }
  }
}
console.log(x);
x("console.log('bypassed');");
