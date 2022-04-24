let b = document.createElement("button");

b.addEventListener("click", () => console.log("addEventListener works"));

b.onfocus = () => console.log("attribute works");

b.addEventListener("abort", () => {console.log(undefinedthing); console.log("skipping errors works")});
