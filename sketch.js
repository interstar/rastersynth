
const Marquee = () => {
    return {
        rx: 5,
        ry: 5,

        area: function(mouseX, mouseY) {
            return [mouseX - this.rx, mouseY - this.ry, this.rx*2, this.ry*2 ];
        },

        img: undefined
    };
};

let img;

const picture = function(p) {

    // let img;

    const keyDownActions = new Map(
        /* use e, d, s, f to resize the marquee */
        [
            [/* s */ 83, () => marquee.rx = p.max(marquee.rx - 1, 1)],
            [/* f */ 70, () => marquee.rx = p.min(marquee.rx + 1, 100)],
            [/* d */ 68, () => marquee.ry = p.max(marquee.ry - 1, 1)],
            [/* e */ 69, () => marquee.ry = p.min(marquee.ry + 1, 100)]
        ]);

    p.preload = function() {
        img = p.loadImage('bg.jpg');
    };

    p.setup = function() {
        let canvas = p.createCanvas(800,600);

        p.image(img, 0, 0);
    };

    p.draw = () => {
        p.image(img, 0, 0);

        for (let [key, action] of keyDownActions) {
            if (p.keyIsDown(key)) {
                action();
                captureMarqueArea();
                break;
            }
        }

        p.noFill();
        p.stroke('white');
        p.strokeWeight(1);
        p.rect(...marquee.area(p.mouseX, p.mouseY));
    };

    p.mouseMoved = () => {
        captureMarqueArea();
    };

    const captureMarqueArea = () => {
        marquee.img = img.get(...marquee.area(p.mouseX, p.mouseY));
    };

};


const controls = function(p) {

    p.setup = function() {
        let canvas = p.createCanvas(800,600);
        if (marquee.img) {
            p.image(marquee.img, 0, 0);
        }
    };

    p.draw = () => {
        if (marquee.img) {
            p.image(marquee.img, 0, 0, 450, 450 );
        }
    };
};


const marquee = Marquee();

new p5(picture, "leftpane");
new p5(controls, "rightpane");
