//alert test
alert("test");

//btoa atob test
console.log(btoa("test"));
console.log(atob("dGVzdA=="));

//document
console.log(document.referrer);
document.title = "test_title";
console.log(document.createElement("div"));

//location
console.log(location);
console.log(location.href);

//navigator
console.log(window.navigator.userAgent);
console.log(navigator.javaEnabled());

//origin
console.log(origin);

//read only window test (window.innerWidth should be the same after modifying)
console.log(window.innerWidth);
window.innerWidth = 100;
console.log(window.innerWidth);
//window write to property
window.name = "test";
//scroll test (unimplemented jsdom functions that have been added)
window.scroll(10, 20);

//screen test
console.log(screen.colorDepth);
screen.colorDepth = 3;
console.log(screen);

//setTimeout setInterval
setTimeout(100, () => console.log("setTimeout"));
setInterval(100, () => console.log("setInterval"));


/*
START_EXPECTED_OUTPUT
[info] DOM: Code called alert(test, )
[info] DOM: Code called btoa(test, )
[info] Script output: "dGVzdA=="
[info] DOM: Code called atob(dGVzdA==, )
[info] Script output: "test"
[info] DOM: Code accessed window.document.referrer
[info] Script output: "https://example.org/"
[info] DOM: Code modified window.document.title with value test_title
[info] DOM: Code called window.document.createElement(div, )
[info] Script output: {}
[info] DOM: Code accessed window.location.toString
[info] Script output: https://example.org/
[info] DOM: Code accessed window.location.href
[info] Script output: "https://example.org/"
[info] DOM: Code accessed window.navigator.userAgent
[info] Script output: "Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/19.0.0"
[info] DOM: Code called window.navigator.javaEnabled()
[info] Script output: false
[info] DOM: Code accessed window.origin
[info] Script output: "https://example.org"
[info] DOM: Code accessed window.name
[info] Script output: ""
[info] DOM: Code modified window.name with value test
[info] DOM: Code modified window.name with value test
[info] DOM: Code accessed window.name
[info] Script output: "test"
[info] DOM: Code modified window.name with value test
[info] DOM: Code modified window.name with value test
[info] DOM: Code called scroll(10, 20, )
[info] DOM: Code accessed window.screen.colorDepth
[info] Script output: 24
[info] DOM: Code modified window.screen.colorDepth with value 3
[info] Script output: {}
[info] DOM: Code called setTimeout(100, () => (fun => {
    return function () {
        if (fun == eval)
            arguments[0] = rewrite(arguments[0], true);
        return fun.apply(console, arguments);
    };
})(console.log)('setTimeout'), )
[info] DOM: Code called setInterval(100, () => (fun => {
    return function () {
        if (fun == eval)
            arguments[0] = rewrite(arguments[0], true);
        return fun.apply(console, arguments);
    };
})(console.log)('setInterval'), )
END_EXPECTED_OUTPUT
 */