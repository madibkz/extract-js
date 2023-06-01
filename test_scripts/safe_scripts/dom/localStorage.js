console.log(JSON.stringify(localStorage));
console.log(localStorage);
localStorage.setItem("key1", "value1");
console.log(localStorage.getItem("key1"));
localStorage.removeItem("key1");
localStorage.setItem("key2", "value2");
localStorage.clear();
