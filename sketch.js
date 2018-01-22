const ROOTXOF2 = Math.pow(2,-12);

// Gibberish.init();

let fft;

function preload() {
    fft = new p5.FFT();
    fft.setInput(Gibberish.node);
}



class GibberishSamplerSynth {
    constructor(options) {
        // let sampler = Gibberish.instruments.Sampler(options);
        let sampler = new Gibberish.Sampler();

        this.DEFAULT_PITCH = 0.015625;
        sampler.pitch = this.DEFAULT_PITCH;

        sampler.loops = true;
        sampler.playOnLoad = sampler.pitch;
        sampler.connect();

        this.sampler = sampler;
        this.mutedvolume = undefined;
        this.amp = 1;
        this.id = sampler.id;
        this.readOffset = 0;
    }

    set wavetable(samples) {
        // this.togglemute();

        this.sampler.setBuffer(samples);
        this.sampler.length = samples.length;

        // this.togglemute();
        //this.sampler.note(this.sampler.pitch);

        // if (!this.sequencer.isRunning)
        //   this.sequencer.start();
    }

    get wavetable() {
        return [this.sampler.getBuffer(), this.sampler.getBuffer()];
    }


    set pitch(pitch) {
        this.sampler.pitch = pitch;
    }

    get pitch() {
        return this.sampler.pitch;
    }

    playRatechange(factor) {
        this.sampler.pitch *= factor;
        return this.sampler.pitch;
    }



    set amp(value) {
        // const s = new Gibberish.Sequencer({
        //   target:this.sampler, key:'amp',
        //   values:[ value ],
        //   durations:[ Gibberish.Time.ms(15) ]
        // }).start();

        this.sampler.amp = value;
    }

    get amp() {
        return this.sampler.amp;
    }


    togglemute() {
        if (this.mutedvolume === undefined) {
            this.mutedvolume = this.volume;
            this.volume = 0.0;
        }
        else {
            this.volume = this.mutedvolume;
            this.mutedvolume = undefined;
        }
    }

    set phase(phase) {
        this.sampler.setPhase(phase);
    }

    get phase() {
        return this.sampler.getPhase();
    }
}


let synth = new GibberishSamplerSynth();


const Marquee = () => {
    return {
        rx: 20,
        ry: 20,

        area: function(mouseX, mouseY) {
            return [mouseX - this.rx, mouseY - this.ry, this.rx*2, this.ry*2 ];
        },

        img: undefined
    };
};

const marquee = Marquee();


const controls = function(p) {

    p.setup = function() {
        let canvas = p.createCanvas(800,600);
        if (marquee.img) {
            p.image(marquee.img, 0, 0);
        }
    };

    p.draw = () => {
        if (marquee.img) {
            p.clear();
            p.image(marquee.img, 0, 0, marquee.img.width*2, marquee.img.height*2 );

            let relativePhase = synth.phase / synth.sampler.length;

            let scannerIndex = relativePhase * (marquee.img.width*marquee.img.height*2*2);
            let x = scannerIndex % (marquee.img.width*2);
            let y = scannerIndex / (marquee.img.width*2);

            p.stroke('white');
            p.strokeWeight(1);
            p.rect(x, y, 2, 2);

        }
    };
};

const picture = function(p) {

    let img;
    let domRect;

    const keyDownActions = new Map(
        [
            /* use e, d, s, f to resize the marquee */

            [/* s */ 83, () => marquee.rx = p.max(marquee.rx - 1, 1)],
            [/* f */ 70, () => marquee.rx = p.min(marquee.rx + 1, 100)],
            [/* d */ 68, () => marquee.ry = p.max(marquee.ry - 1, 1)],
            [/* e */ 69, () => marquee.ry = p.min(marquee.ry + 1, 100)],

            /* use r, g, b to specify the sonification channel */
            [/* r */ 82, () => synth.readOffset = 0 ],
            [/* r */ 71, () => synth.readOffset = 1 ],
            [/* r */ 66, () => synth.readOffset = 2 ],

            /* use -, =, 0 to adjust the pitch */

            [/* - */ 189, () => synth.pitch = p.max(1/1024, synth.pitch - 1/1024) ],
            [/* = */ 187, () => synth.pitch += 1/1024 ],
            // [/* - */ 189, () => synth.pitch *= ROOTXOF2 ],
            // [/* = */ 187, () => synth.pitch *= 1/ROOTXOF2 ],
            [/* 0 */ 48, () => synth.pitch = synth.DEFAULT_PITCH ]

        ]);


    p.preload = function() {
        // img = p.loadImage('Philips_PM5544.svg.png');
        // img = p.loadImage('bg.jpg');
        // img = p.loadImage('DSC_6257.JPG');
        // img = p.loadImage('DSC_6263.JPG');
        // img = p.loadImage('IMG_20170402_120844.jpg');
        img = p.loadImage('Wassily Kandinsky composizione viii, c.1923.jpg');
    };

    p.setup = function() {
        let canvas = p.createCanvas(800,600);

        // TODO: doesn't work -- see #HACK in mouseMoved() below
        //domRect = canvas.getBoundingClientRect();

        p.image(img, 0, 0);
        img.resize(800,600);

        drawMarquee();
    };


    const actOnKeyDown = () => {
        for (let [key, action] of keyDownActions) {
            if (p.keyIsDown(key)) {
                action();
                captureMarquee();
                break;
            }
        }
    };


    p.draw = () => {
        p.image(img, 0, 0);

        actOnKeyDown();

        drawMarquee();
    };

    p.mouseMoved = () => {
        // if (p.mouseX < domRect.right && p.mouseY < domRect.bottom)
        // #HACK
        if (p.mouseX < 800 && p.mouseY < 600)
            captureMarquee();
    };

    const drawMarquee = () => {
        p.noFill();
        p.stroke('white');
        p.strokeWeight(1);
        p.rect(...marquee.area(p.mouseX, p.mouseY));
    };

    const captureMarquee = () => {
        marquee.img = img.get(...marquee.area(p.mouseX, p.mouseY));
        play();
    };

};



const waveform = (p) => {

    p.setup = () => {
        let canvas = p.createCanvas(300,200);
    };


    p.draw = () => {
        p.background(0);

        let spectrum = fft.analyze();
        p.noStroke();
        p.fill(255,0,0); // spectrum is red
        for (let i = 0; i< spectrum.length; i++){
            let x = p.map(i, 0, spectrum.length, 0, p.width);
            let h = -p.height + p.map(spectrum[i], 0, 255, p.height, 0);
            p.rect(x, p.height, p.width / spectrum.length, h );
        }


        let waveform = fft.waveform();
        p.noFill();
        p.beginShape();
        p.stroke(0,255,0); // waveform is green
        p.strokeWeight(1);
        for (let i = 0; i< waveform.length; i++){
            let x = p.map(i, 0, waveform.length, 0, p.width);
            let y = p.map( waveform[i], -1, 1, 0, p.height);
            p.vertex(x,y);
        }
        p.endShape();
    };


};



function play() {
    marquee.img.loadPixels();
    let pixels = marquee.img.pixels;

    let wavetable = [];
    for (let i=synth.readOffset, j=0; i<pixels.length; i+=4, j++) {
        wavetable[j] = pixels[i] / 256;
    }

    synth.wavetable = wavetable;
}




new p5(picture, "picture");
new p5(controls, "marquee");
new p5(waveform, "waveform");
