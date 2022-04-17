function myFunction() {
  return "should log this function in a new snippet";
}
document.addEventListener("click", myFunction);
document.addEventListener("click", () => "anonymous function should also be logged");
window.addEventListener("resize", () => "window event should also be logged");

let b = document.createElement("button");
b.addEventListener("click", () => "createElement elements events should also be logged");
b.onclick = () => "event attributes should also be logged";