//https://stackoverflow.com/questions/7266069/adding-external-stylesheet-using-javascript
var css = document.createElement("link");
css.setAttribute("rel", "stylesheet");
css.setAttribute("type", "text/css");
css.setAttribute("href", "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css");
document.body.appendChild(css);
