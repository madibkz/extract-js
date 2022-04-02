const xo = new ActiveXObject('MSXML2.XMLHTTP');
xo.onreadystatechange = function() {
};
xo.open('GET', 'http://document.php', false);
xo.send();
