const ROOTXOF2 = Math.pow(2,-8);

const audioCtxConstructor = (window.AudioContext || window.webkitAudioContext),
      audioCtx   = new audioCtxConstructor();

class WavetableSynth {
    constructor(numSamples) {
        let source = audioCtx.createBufferSource(),
            buffer = audioCtx.createBuffer(2, numSamples,  audioCtx.sampleRate);

        let channels = {
            left: buffer.getChannelData(0),
            write: buffer.getChannelData(1)
        };

        let mutedvolume;

        let gain = audioCtx.createGain();

        this.DEFAULT_PITCH = 1/8;

        source.playbackRate.value = this.DEFAULT_PITCH;
        source.loop   = true;
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(audioCtx.destination);
        source.start();

        this.gain = gain;
        this.source = source;
        this.channels = channels;
        this.readOffset = 0;
    }

    set wavetable([samplesL, samplesR]) {

        let left  = this.channels.left,
            right = this.channels.right;

        for (let i = this.readOffset, len = left.length; i < len; i++) {
            left[i]  = samplesL[i % samplesL.length];
            // FIXME: why does this throw an "undefined" error
            //right[i] = samples[i % samplesR.length];
        }

        this.source.loopEnd = samplesL.length;
    }


    get wavetable() {
        return [this.channels.left, this.channels.right];
    }


    set pitch(pitch) {
        this.source.playbackRate.value = pitch;
    }

    // forward compatibility
    get pitch() {
        return this.source.playbackRate;
    }


    pitchChangeBy(factor) {
        var rate = this.source.playbackRate.value;
        rate *= factor;
        // if (rate > 1)
        //   rate = 1;
        this.source.playbackRate.value = rate;
        return rate;
    }

    set volume(value) {
        this.gain.gain.value = value;
    }
    get volume() {
        return this.gain.gain.value;
    }


    togglemute() {
        if (this.mutedvolume === undefined) {
            this.mutedvolume = this.gain.gain.value;
            this.gain.gain.value = 0.0;
        }
        else {
            this.gain.gain.value = this.mutedvolume;
            this.mutedvolume = undefined;
        }
    }

}



let synth = new WavetableSynth(800*600);

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

let img;


const picture = function(p) {

    // let img;

    const keyDownActions = new Map(
        [
            /* use e, d, s, f to resize the marquee */

            [/* s */ 83, () => marquee.rx = p.max(marquee.rx - 1, 1)],
            [/* f */ 70, () => marquee.rx = p.min(marquee.rx + 1, 100)],
            [/* d */ 68, () => marquee.ry = p.max(marquee.ry - 1, 1)],
            [/* e */ 69, () => marquee.ry = p.min(marquee.ry + 1, 100)],

            /* use -, =, 0 to adjust the pitch */

            [/* - */ 189, () => synth.pitch.value -= 1/16 ],
            [/* = */ 187, () => synth.pitch.value += 1/16 ],
            // [/* - */ 189, () => synth.pitch.value *= ROOTXOF2 ],
            // [/* = */ 187, () => synth.pitch.value *= 1/ROOTXOF2 ],
            [/* 0 */ 48, () => synth.pitch.value = synth.DEFAULT_PITCH ],

            /* use r, g, b to specify the sonification channel */
            [/* r */ 82, () => synth.readOffset = 0 ],
            [/* r */ 71, () => synth.readOffset = 1 ],
            [/* r */ 66, () => synth.readOffset = 2 ]
        ]);

    p.preload = function() {
        img = p.loadImage('Philips_PM5544.svg.png');
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
        play();
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
            p.image(marquee.img, 0, 0, marquee.img.width*2, marquee.img.height*2 );
        }
    };
};



window.synth = synth;

function play() {
    marquee.img.loadPixels();
    let pixels = marquee.img.pixels;

    let wavetable = [];
    for (let i=synth.readOffset, j=0; i<pixels.length; i+=4, j++) {
        wavetable[j] = pixels[i] / 256;
    }

    synth.wavetable = [wavetable, wavetable];

}


const marquee = Marquee();

new p5(picture, "leftpane");
new p5(controls, "rightpane");
