var xo = new ActiveXObject('MSXML2.XMLHTTP');
xo.onreadystatechange = function() {
  console.log(" " + xo.readyState + xo.status + xo.responsebody);
  if (xo.readyState == 4 && xo.status == 200) {
    if (xo.ResponseBody === "response") {
      console.log("first branch");
    } else {
      console.log("second branch");
    }
  };
};
xo.open('GET', 'http://document.php', false);
xo.send();
