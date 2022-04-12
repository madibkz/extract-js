console.log(JSON.stringify(sessionStorage));
console.log(sessionStorage);
sessionStorage.setItem("key1", "value1");
console.log(sessionStorage.getItem("key1"));
sessionStorage.removeItem("key1");
sessionStorage.setItem("key2", "value2");
sessionStorage.clear();
