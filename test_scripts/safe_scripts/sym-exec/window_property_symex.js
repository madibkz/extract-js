if (window.name === "TESTVALUE") {
    console.log("Symex found the other branch (test works).");
} else if (window.innerHeight === 300) {
    console.log("Symex found the innerHeight branch.");
} else {
    console.log("Default branch");
}