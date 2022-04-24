window.addEventListener("click", () => console.log("addEventListener works"));

window.onfocus = () => console.log("attribute works");

window.addEventListener("abort", () => {console.log(undefinedthing); console.log("skipping errors works")});
