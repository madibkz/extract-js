//Unencoded string
console.log("(malware)");
//Unicode string (can still be statically decoded)
console.log("\u0028\u006d\u0061\u006c\u0077\u0061\u0072\u0065\u0029");
//Hexadecimal unicode string (can still be statically decoded)
console.log("\x28\x6d\x61\x6c\x77\x61\x72\x65\x29");
//base64 encoded string (can be manually or dynamically decoded)
//console.log(base64_decode("KG1hbHdhcmUp")); (*\label{code:base64encode}*)
//Encrypted string with key as the url (can be dynamically executed to decrypt)
//console.log(decrypt("0a9AG)(a()PG09u]as[f'; lq2w", window.url));
