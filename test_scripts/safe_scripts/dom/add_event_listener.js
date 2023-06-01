function myFunction() {
  console.log("should log this function in a new snippet");
}
document.addEventListener("click", myFunction);
document.addEventListener("click", () => "anonymous function should also be logged");
window.addEventListener("resize", () => {console.log("window event should also be logged");});

let b = document.createElement("button");
b.addEventListener("click", () => "this should be logged");

b.onclick = () => "properties should also be logged";

window.onclick = () => "awfawfawfawfawf";
