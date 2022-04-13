var img = document.createElement('img');
img.setAttribute('onerror', 'console.log("XSS or code or something")');
document.body.appendChild(img);
