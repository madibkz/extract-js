// var xa = new ActiveXObject('ADODB.Stream');
// xa.open();
// xa.type = 1;
// xa.write("RANDOM TEXT RANDOM TEXT");
// xa.position = 0;
// xa.savetofile("RANDOMFILE.txt", 2);
// // throw new Error("Read: " + xa.read());
// xa.close();
// throw new Error("REACHED END");

// var xa = new ActiveXObject('scriptcontrol');
// throw new Error("scriptcontrol " + xa.addobject());

// var xa = new ActiveXObject('Scripting.Dictionary');
// xa.add("test", "testvalue");
// throw new Error("scripting.dictionary " + xa.item("test"));

// var xa = new ActiveXObject('Shell.Application');
// xa.shellexecute("fake command");
// throw new Error("scripting.dictionary " + JSON.stringify(xa.namespace(7)));

// var xa = new ActiveXObject('wscript.network');
// throw new Error("wscript.network " + xa.computername + xa.enumprinterconnections() + xa.userdomain);

// var xa = new ActiveXObject('wbemscripting.swbemlocator');
// throw new Error("wbemscripting.swbemlocator " + xa.connectserver("server1", "namespace1"));

// var xa = new ActiveXObject('msscriptcontrol.scriptcontrol');
// throw new Error("msscriptcontrol.scriptcontrol " + xa.Language + xa.Timeout + xa.addcode());

// var xa = ActiveXObject('dom').createElement("something");
// throw new Error("dom " + xa.name + xa.nodetypedvalue);

var xa = new ActiveXObject('MSXML2.XMLHTTP');
xa.open('GET', 'http://example.com', false);
xa.send();
throw new Error("MSXML2.XMLHTTP " + xa.responsebody);

// if ("addcode" in xa) {
//     throw new Error("IT IS IN")
// }
// throw new Error("scriptcontrol is " + xa.addcode());
// xa.open();
// xa.type = 1;
// xa.write("RANDOM TEXT RANDOM TEXT");
// xa.position = 0;
// xa.saveToFile("RANDOMFILE.txt", 2);
// throw new Error("Read: " + xa.read());
// xa.close();
