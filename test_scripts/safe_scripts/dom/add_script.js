console.log("About to add script");
let s = document.createElement("script");
s.innerHTML = "console.log(1);";
document.body.appendChild(s);
