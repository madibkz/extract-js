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
