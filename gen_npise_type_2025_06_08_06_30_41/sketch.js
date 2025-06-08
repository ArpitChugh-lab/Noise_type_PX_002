// Full sketch with a toggle to enable/disable the mask visibility
let scl = 20;
let cols, rows;
let zoff = 0;

let particles = [];
let flowfield;

let pngMask;
let maskImage;
let maskReady = false;

let geometricToggle, maskToggle;
let sliderData = [];

function preload() {
  pngMask = loadImage("a_alphabet.png");
}

function setup() {
  createCanvas(1000, 1000);
  colorMode(HSB, 255);
  background(0);

  cols = floor(width / scl);
  rows = floor(height / scl);
  flowfield = new Array(cols * rows);

  maskImage = createImage(width, height);
  maskImage.copy(pngMask, 0, 0, pngMask.width, pngMask.height, width * 0.1, height * 0.1, width * 0.8, height * 0.8);
  maskImage.loadPixels();
  maskReady = true;

  for (let i = 0; i < 1000; i++) {
    particles[i] = new Particle();
  }

  setupUI();
}

function draw() {
  let trail = sliderData[0].slider.value();
  let seed = sliderData[1].slider.value();
  let period = sliderData[2].slider.value();
  let amplitudeVal = sliderData[3].slider.value();
  let exponentVal = sliderData[4].slider.value();
  let snapToGeometric = geometricToggle.checked();
  let useMask = maskToggle.checked();

  fill(0, trail);
  noStroke();
  rect(0, 0, width, height);

  noiseSeed(seed);
  let inc = 1 / period;

  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      let n = noise(xoff, yoff, zoff);
      n = pow(n, exponentVal);

      let angle = n * TWO_PI * 4;
      if (snapToGeometric) {
        let snap = PI / 4;
        angle = round(angle / snap) * snap;
      }

      let v = p5.Vector.fromAngle(angle);
      v.setMag(amplitudeVal);
      flowfield[index] = v;

      xoff += inc;
    }
    yoff += inc;
  }
  zoff += 0.003;

  for (let p of particles) {
    p.follow(flowfield);
    p.update();
    p.edges();
    p.show(useMask);
  }
}

class Particle {
  constructor() {
    this.pos = createVector(random(width * 0.2, width * 0.8), random(height * 0.2, height * 0.8));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxspeed = 2;
    this.hue = random(255);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxspeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  follow(vectors) {
    let x = floor(this.pos.x / scl);
    let y = floor(this.pos.y / scl);
    let index = x + y * cols;
    if (vectors[index]) {
      this.applyForce(vectors[index]);
    }
  }

  show(useMask) {
    let x = floor(this.pos.x);
    let y = floor(this.pos.y);
    let drawIt = true;

    if (useMask && x >= 0 && x < width && y >= 0 && y < height) {
      let idx = 4 * (x + y * width);
      let r = maskImage.pixels[idx];
      let g = maskImage.pixels[idx + 1];
      let b = maskImage.pixels[idx + 2];
      let a = maskImage.pixels[idx + 3];
      let brightness = (r + g + b) / 3;
      drawIt = (brightness > 10 && a > 10);
    }

    if (drawIt) {
      stroke(this.hue, 255, 255, 100);
      strokeWeight(1.5);
      point(this.pos.x, this.pos.y);
    }

    this.hue = (this.hue + 1) % 255;
  }

  edges() {
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }
}

function saveCanvasImage() {
  saveCanvas('flowfield_art', 'png');
}

function setupUI() {
  let uiPanel = createDiv();
  uiPanel.id("ui-panel");

  sliderData = [
    { label: "Trail Fade", min: 0, max: 255, val: 20, step: 1 },
    { label: "Noise Seed", min: 0, max: 10000, val: 0, step: 1 },
    { label: "Noise Period", min: 1, max: 100, val: 10, step: 1 },
    { label: "Amplitude", min: 0.1, max: 5, val: 1, step: 0.1 },
    { label: "Exponent", min: 0.5, max: 5, val: 1, step: 0.1 },
  ];

  for (let item of sliderData) {
    let group = createDiv().class("slider-group").parent(uiPanel);
    item.p = createP(`${item.label}: ${item.val}`).parent(group);
    item.slider = createSlider(item.min, item.max, item.val, item.step).parent(group);
    item.slider.input(() => {
      item.p.html(`${item.label}: ${item.slider.value()}`);
    });
  }

  geometricToggle = createCheckbox("Geometric Mode", false).parent(uiPanel);
  maskToggle = createCheckbox("Mask Mode", true).parent(uiPanel);

  createButton("Save Image").mousePressed(saveCanvasImage).parent(uiPanel);

  const style = document.createElement("style");
  style.innerHTML = `
    #ui-panel {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0,0,0,0.75);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: sans-serif;
      z-index: 1000;
      width: 200px;
    }
    .slider-group {
      margin-bottom: 10px;
    }
    input[type='range'] {
      width: 100%;
    }
    p {
      margin: 0 0 5px 0;
      font-size: 13px;
    }
    label {
      display: inline-block;
      margin-bottom: 10px;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);
}
