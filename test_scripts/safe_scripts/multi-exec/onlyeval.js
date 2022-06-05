if (1 === 1) {
  console.log("first branch");
} else {
  console.log("test failed");
}

eval(`
if (1 === 1) {
  console.log("second first branch");
} else {
  console.log("test passed");
}
`);
