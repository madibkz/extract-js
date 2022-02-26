//taken from https://nodejs.dev/learn/modern-asynchronous-javascript-with-async-and-await
///var async = require("async");

async function aFunction() {
  return 'test'
}

aFunction().then(console.log) // This will alert 'test'
