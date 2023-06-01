if (location == "locincludesval") {
  console.log(1);
}

if (navigator.plugins[0].name == "navigatorpluginval") {
  console.log(2);
  let b = document.createElement("button");
  document.body.appendChild(b);
  console.log(3);
}

if (document.cookie.includes('cookieincludesthing')) {
  console.log(4);
}

if (WScript.scriptfullname == "fullname") {
    console.log(5);
}

let obj = GetObject();
let instances = obj.InstancesOf("win32_computersystem");
if (instances[0]["pscomputername"] == "TESTNAME") {
  console.log(6);
}

var xb = new ActiveXObject('shockwave.flash');

var xo = new ActiveXObject('MSXML2.XMLHTTP');
xo.onreadystatechange = function() {
  if (xo.readyState == 4 && xo.status == 200) {
    if (xo.ResponseBody == "response") {
      console.log(7);
    }
  };
};
xo.open('GET', 'http://document.php', false);
xo.send();
