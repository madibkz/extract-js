function f(x) {
  if (x === 1) {
    console.log(1);
    return "a";
  } else if (x === 2) {
    console.log(2);
    return "b";
  } else if (x === 3) {
    console.log(3);
    //return f(x - 1);
    //return
  }
  console.log(4);
  return;
}

function y(z) {
  console.log(5);
}

if (1 === 2) {
  console.log(6);
  switch ("something") {
    case "one":
      console.log(7);
    case "two":
      console.log(8);
      break;
    case "three":
      try {
        console.log(9);
      } catch (e) {
        console.log(10);
      } finally {
        console.log(11);
      }
    default:
      console.log(12);
  }
} else if (1 === 1) {
  console.log(13);
  while (false) {
    console.log(14);
  }
  let a = null;
  a.nonexistentfield ? console.log(15) : console.log(16);
  do {
    console.log(17);
  } while (false);
} else {
  console.log(18);
  for (let i = 0; i < 4; i++) {
    continue;
    console.log(19);
    f(i);
  }
  for (let i = 0; i < -1; i++) {
    console.log(20);
  }
  for (let i in []) {
    console.log(21);
  }
  if (y(3)) {
    console.log(22);
  }
}
