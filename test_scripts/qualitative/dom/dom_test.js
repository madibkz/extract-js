console.log(navigator.userAgent);

let div = document.createElement("div");
div.innerHTML = "test value";
let a = document.createElement("a");
a.href = "https://www.pretend-website.com";
a.innerHTML = "Click me";
div.appendChild(a);
document.body.appendChild(div);

div.addEventListener("click", () => console.log("found event listener"));

document.cookie = "pretend=cookieval; expires=Mon, 1 Dec 3000 12:00:00 GMT; path=/"

localStorage.setItem("localstorage", "gotpretendvalue");

let xhr = new window.XMLHttpRequest();
xhr.open('GET', 'https://example.com/');
xhr.send();
xhr.onload = function() {
    if (xhr.status !== 200) {
        console.log('Error: ' + xhr.status);
        return;
    }
    console.log("loaded");
};
