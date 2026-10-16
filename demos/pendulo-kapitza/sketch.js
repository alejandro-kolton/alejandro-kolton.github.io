/*
 * @name Péndulo de Kapitza
 * @description 
Este programa resuelve numéricamente, usando el método de Leapfrog, el péndulo de Kapitza y lo visualiza. Las entradas son la frecuencia y la amplitud del movimiento vertical del pivote.  

https://en.wikipedia.org/wiki/Kapitza%27s_pendulum

Alejandro B. Kolton
para las Clases de Mecánica 2022
Instituto Balseiro, Bariloche, Argentina

*/

let P1;
let wdrive = 100;
let ampdrive = 0.05;
let inp;
let width = 400;
let friction = 0.0;

function myInputEvent() {
  console.log("you are typing: ", this.value());
}

function changefreq() {
  wdrive = float(inp.value());
  inp.value(wdrive);
}

function changeCI() {
  let ang = float(inp3.value());
  inp3.value(ang);
  P1.ang = ang;
  P1.velang = 0.0;
}

function changeamp() {
  ampdrive = float(inp2.value());
  inp2.value(ampdrive);
}

function preload() {
  // preload() runs once
  //imgIB = loadImage("ib.jpeg");
}

function setup() {
  createCanvas(width, width);
  P1 = new PenduloSimple(3.14, 0.0);

  /*slider = createSlider(0, 1000, 50);
  slider.position(0, 400);
  slider.style('width', '80px');
  */

  inp = createInput(String(wdrive));
  inp.position(0, 0);
  inp.size(100);
  inp.input(myInputEvent);
  button = createButton("cambiar frecuencia w");
  button.position(inp.width, 0);
  button.mousePressed(changefreq);

  inp2 = createInput(String(ampdrive));
  inp2.position(0, 25);
  inp2.size(100);
  inp2.input(myInputEvent);
  button2 = createButton("cambiar amplitud A");
  button2.position(inp.width, 25);
  button2.mousePressed(changeamp);

  inp3 = createInput(String(P1.ang));
  inp3.position(0, 50);
  inp3.size(100);
  inp3.input(myInputEvent);
  button3 = createButton("angulo inicial");
  button3.position(inp.width, 50);
  button3.mousePressed(changeCI);

  let label1 = createP("péndulo de Kapitza");
  label1.style("font-size", "16px");
  label1.position(0, width);

  let tex = createP();
  tex.style("font-size", "20px");
  tex.position(60, 420);
  katex.render(
    "\\ddot{\\theta} = -\\frac{[g-\\omega^2 A \\sin(\\omega t)]}{l}\\sin(\\theta)",
    tex.elt
  );

  /*let latex="g/l=9.8, pivot=A sin(w t)"
  let label2 = createP(latex);
  label2.style("font-size", "16px");
  label2.position(0, width+30);
  */

  //imgIB.loadPixels();
}

function draw() {
  background(220);
  P1.render();
  P1.leapFrog();

  //image(imgIB, width - 50, width - 50, 50, 50);

  let kapitzaparameter = round(pow(wdrive * ampdrive, 2.0) / 9.8, 3);
  text("A^2 w^2 / g l = " + str(kapitzaparameter), 0, width - 10);
}

class PenduloSimple {
  // args: initial angle and angular velocity
  constructor(ang, velang) {
    this.ang = ang;
    this.velang = velang;
    this.g = 9.8;
    this.dt = 0.005;
    this.l = 1.0;
    this.m = 0.1;
    this.E0 = this.Energy();
    this.t = 0;
    this.w1 = 100;
    this.amp = 0.05;
  }
  invertido() {
    this.ang = 3.1;
    this.velang = 0.0;
  }
  drive() {
    this.w1 = wdrive;
    this.amp = ampdrive;
    return this.amp * sin(this.w1 * this.t);
  }
  Energy() {
    let E =
      this.m * this.l * this.l * this.velang * this.velang * 0.5 -
      this.m * this.g * this.l * cos(this.ang);
    return E;
  }
  leapFrog() {
    // Método de Leapfrog
    this.velang =
      this.velang -
      this.dt *
        ((this.g - pow(this.w1, 2.0) * this.drive()) / this.l) *
        sin(this.ang) -
      this.dt * this.velang * friction;

    this.ang = this.ang + this.dt * this.velang;
    this.t += this.dt;
  }
  render() {
    var x = this.l * sin(this.ang);
    var y = this.l * cos(this.ang) - this.drive();

    var xplot = map(x, -this.l * 1.5, this.l * 1.5, 0, width);
    var yplot = map(y, -this.l * 1.5, this.l * 1.5, 0, width) + 30;
    var x0 = map(0, -this.l * 1.5, this.l * 1.5, 0, width);
    var y0 = map(-this.drive(), -this.l * 1.5, this.l * 1.5, 0, width) + 30;

    // Draw a circle
    stroke(50);
    fill(100);
    ellipse(xplot, yplot, 24, 24);

    fill(50);
    ellipse(x0, y0, 5, 5);

    // La cuerda
    stroke(50);
    line(x0, y0, xplot, yplot);
  }
}
