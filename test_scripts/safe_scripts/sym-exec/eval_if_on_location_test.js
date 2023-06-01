eval(`if (location.host == "www.example.com") {
    console.log("EXAMPLE BRANCH");
} else if (window.location.host == "www.foobar.com") {
    console.log("DEFAULT BRANCH");
} else if (location.hostname.includes("fuzz")) { //test without this as well to see if same symbol tracks correctly
    console.log("LAST BRANCH");
}`);
