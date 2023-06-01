//var xa = new ActiveXObject('scripting.filesystemobject');
//var f = xa.getfile("folder1");
//throw new Error("scripting.filesystemobject " + f.attributes);

// var xa = new ActiveXObject('wscript.shell');
// if ((xa.environment("system"))("appdata") === "C:\\Users\\User\\AppData\\Roaming") {
//   console.log("HERE");
// } else {
//   console.log("second branch");
// }

// const xo = new ActiveXObject('MSXML2.XMLHTTP');
// xo.onreadystatechange = function() {
//   console.log(" " + xo.readyState + xo.status + xo.responsebody);
//   if (xo.readyState == 4 && xo.status == 200) {
//     if (xo.ResponseBody === "response") {
//       console.log("first branch");
//     } else {
//       console.log("second branch");
//     }
//   };
// };
// xo.open('GET', 'http://document.php', false);
// xo.send();
// //
// const xa = new ActiveXObject('MSXML2.XMLHTTP');
// xa.onreadystatechange = function() {
//   if (xa.readyState == 4 && xa.status == 200) {
//     if (xa.ResponseBody === "response2") {
//       console.log("first branch");
//     } else {
//       console.log("second branch");
//     }
//   };
// };
// xa.open('GET', 'http://document.php', false);
// xa.send();

 var xa = new ActiveXObject('ADODB.Stream');
 xa.open();
 xa.write("RANDOM TEXT RANDOM TEXT");
 if (xa.position === 4) {
     console.log("Got position right");
 }
 if (xa.charset === "US") {
     console.log("Got charset right");
 }
 xa.loadfromfile("RANDOMFILE2.txt")
 if (xa.read() === "REQUIRED READ VALUE") {
     console.log("Got it");
 }
 xa.close();

// var xa = new ActiveXObject('scripting.filesystemobject');
// if (xa.fileexists("fakepath")) {
//     console.log("FILE EXISTS BRANCH");
// } else {
//     console.log("NO FILE EXISTS BRANCH");
// }
// if (xa.folderexists("fakepath")) {
//     console.log("folder EXISTS BRANCH");
// } else {
//     console.log("NO folder EXISTS BRANCH");
// }
// let f = xa.opentextfile("faketextfile");
// if (f.readall() === "BUFFER SYMBOLIZATION WORKS") {
//     console.log("BUFFER BRNACH");
// } else {
//     console.log("NO BUFFER BRNACH");
// }

// if (WScript.interactive) {
//     console.log("SYMEX WORKS");
// }
// if (WScript.path == "FAKEPATH") {
//     console.log("SYMEX WORKS2");
// }
// if (WScript.scriptfullname == "fullname") {
//     console.log("SYMEX WORKS3");
// }
// if (WScript.scriptname == "fullname2") {
//     console.log("SYMEX WORKS4");
// }

// if (WScript.version == "3") {
//     console.log("SYMEX WORKS5");
// }

//GetObject tests
// let obj = GetObject();
// let instances = obj.InstancesOf("win32_computersystem");
// if (instances[0]["pscomputername"] === "TESTNAME") {
//     console.log("SYMEX WORKS");
// }

// let obj = GetObject();
// let instances = obj.InstancesOf("win32_networkadapterconfiguration");
// if (instances[0]["ipaddress"][0] === "TESTNAME") {
//     console.log("SYMEX WORKS");
// }

// let obj = GetObject();
// let instances = obj.InstancesOf("win32_operatingsystem");
// if (instances[0]["name"] === "Windows 11") {
//     console.log("SYMEX WORKS");
// }

//let obj = GetObject();
//let instances = obj.InstancesOf("win32_processstoptrace");
//if (instances[0]["processname"] === "firefox.exe") {
    //console.log("SYMEX WORKS");
//}
