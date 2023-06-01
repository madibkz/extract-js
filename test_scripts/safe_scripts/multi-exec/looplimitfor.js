for (let i = 1; i < 10; i++) {
  console.log(i);
}

for (; ; ) {
  console.log("empty for loop");
}


for (let i = 1; i < 10; i++) {
  console.log(i);
  for (let j = 1; j < 10; j++) {
    console.log(j);
  }
}

for (let k = 1; k < 10; k++)
  for (let m = 1; m < 10; m++)
    console.log(m);
