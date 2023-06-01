let xhr = new window.XMLHttpRequest();

xhr.open('GET', 'https://example.com/');

xhr.send();

xhr.onload = function() {
    if (xhr.status !== 200) {
        console.log('Error: ' + xhr.status);
        return;
    }
    console.log("loaded");
};
