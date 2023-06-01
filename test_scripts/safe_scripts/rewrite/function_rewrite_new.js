class Something {
    constructor(x) {
        this.x = x;
    }
    worked() {
        console.log("1st one worked");
    }
}

let thing = new Something();
thing.worked();

let obj = {};
class AnotherThing {
    constructor(y) {
        this.y = y;
    }
    worked() {
        console.log("2nd one worked");
    }
}
obj.anotherThing = AnotherThing;

let thing2 = new obj.anotherThing();
thing2.worked();
