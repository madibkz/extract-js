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


//console.log(navigator.userAgentData.mobile);
//console.log(navigator.userAgentData.toJSON());
//navigator.userAgentData.getHighEntropyValues(["architecture", "platformVersion"]).then(console.log);
