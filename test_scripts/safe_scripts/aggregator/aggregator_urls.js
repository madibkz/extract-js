const xo = new ActiveXObject('MSXML2.XMLHTTP');
xo.onreadystatechange = function() {};
xo.open('GET', 'http://document1.php', false);
xo.send();
if (!navigator.cookieEnabled) {
    const xo2 = new ActiveXObject('MSXML2.XMLHTTP');
    xo2.onreadystatechange = function() {};
    xo2.open('GET', 'http://document2.php', false);
    xo2.send();
}
