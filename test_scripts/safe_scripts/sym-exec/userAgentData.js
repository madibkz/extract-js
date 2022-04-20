if (navigator.userAgentData.mobile) {
  console.log("mobile branch reached.");
} else if (navigator.userAgentData.platform === "Linux") {
  console.log("platform branch reached.");
} else {
  console.log("Default branch reached.");
}

