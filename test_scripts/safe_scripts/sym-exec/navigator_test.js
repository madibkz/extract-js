//for (var i in navigator) {
  //console.log("NAVIGATOR " + i + navigator[i]);
//}

if (navigator.cookieEnabled) {
  console.log("COOKIE BRANCH REACHED");
} else {
  console.log("NO COOKIE BRANCH REACHED");
}

if (navigator.userAgent.includes("Opera")) {
  console.log("CHROME BRANCH REACHED");
}

if (navigator.canShare()) {
  console.log("IT CAN SHARE");
}
