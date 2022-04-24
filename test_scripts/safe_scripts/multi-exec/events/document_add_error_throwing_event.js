document.addEventListener("click", (e) => {
  console.log(e.detail.undefinedthing); 
  1+2;
  console.log(e.detail.anotherundefinedthing); 
  console.log("got to end of event code anyway");
});
