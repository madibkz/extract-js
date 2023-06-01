if (location == "locincludesval") {
  console.log(1);
}

let b = document.createElement("button");
document.body.appendChild(b);
console.log(2);

if (navigator.plugins[0].name.includes("navigatorpluginval")) {
  console.log(3);
}

let obj = GetObject();
let instances = obj.InstancesOf("win32_computersystem");
if (instances[0]["pscomputername"] == "TESTNAME") {
  console.log(4);
}

var xb = new ActiveXObject('shockwave.flash');

if (WScript.scriptfullname == "fullname") {
  console.log(5);
}
