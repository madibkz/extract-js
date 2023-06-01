if (location.host == "www.example.com") {
  console.log("EXAMPLE BRANCH");
} else if (location.host == "www.foobar.com") {
  console.log("DEFAULT BRANCH");
} else if (location.hostname.includes("fuzz")) {
  console.log("LAST BRANCH");
}
