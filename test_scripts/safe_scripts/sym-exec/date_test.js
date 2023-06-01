if (Date.now() === 300) {
  console.log("Found first date");
  let x = new Date(300);
  if (x.getFullYear() === 2022) {
    console.log("Found second date");
  } else if (x.getYear() === 2019) {
    console.log("Found third date");
  } else if (x.getTime() === 9238157) {
    console.log("Found fourth date");
  }
}
