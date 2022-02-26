//taken from https://nodejs.dev/learn/modern-asynchronous-javascript-with-async-and-await
///var async = require("async");

//async function aFunction() {
  //return 'test'
//}

let aFunction = async () => {
  return 'test';
}

let function2 = async () => {
  let v = await aFunction();
  console.log(v);
};

function2();
