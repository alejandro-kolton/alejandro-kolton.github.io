let img;
let width, height;

//parametros de control
let amp = 4.0;
let nrun = 10;
let ampdis = 1.0;
let gamma = 0.1;
let beta = 1.0;
let L=120;

let boundaryX="Dirichlet";
//let boundaryX="PBC";

// system
let S;

function setup() {
  width = height = 400;
  S = new SIR(L);
  amp = width / L;
  // El canvas debe cubrir la grilla (width x height) más el panel lateral
  // de controles (ubicado a partir de x = width+5); antes usaba el amp
  // por defecto (4.0) antes de recalcularlo, dejando un canvas de
  // 1600x1600 casi vacío con todo apretado en una esquina.
  cnv = createCanvas(width + 180, height);
  // img debe tener la resolución de la grilla (L x L), no la de pantalla:
  // se escala con amp al dibujarla. Antes era del tamaño de pantalla
  // (400x400) y solo se llenaban sus primeros 120x120 píxeles.
  img = createImage(L, L);
  pixelDensity(1);

  sliderD = createSlider(0, 1, 0.01, 0.001);
  sliderD.position(width+5, 30);
  sliderD.style('width', '80px');

  buttonF = createButton('Reset All Susceptible');
  buttonF.position(width+5, height * 0.2);
  buttonF.mousePressed(resetFlat);
}

function draw() {

  ampdis = sliderD.value();

  background(220);
  S.render();

  S.update(nrun);

  stroke(0);
  textSize(5);
  fill(255);
  text('Vaccination=' + ampdis, L+5, 6.0);

  noStroke();
  fill(color(100, 100, 100));
  if (nrun === 0) text('PAUSED', L+5, 0.9*L, 50, 50);

  textSize(8);
  fill(color(255, 0, 0)); noStroke();
  text('Infected', L+5, 50, 50, 50);

  fill(color(0, 255, 0)); noStroke();
  text('Removed', L+5, 60, 50, 50);

  fill(color(0, 0, 255)); noStroke();
  text('Susceptible', L+5, 70, 50, 50);

  textSize(4);
  fill(color(255, 0, 0)); noStroke();
  text('drag mousse to infect', L+5, L*0.8);
}

class SIR {
  constructor(L) {
    this.dt = 0.02;
    this.L = L;
    this.S = [];
    this.I = [];
    this.forceS = [];
    this.forceI = [];
    this.disorder = [];
    this.tiempo = 0.0;
    this.resetFlat();
  }

  resetFlat() {
    let L = this.L;
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        this.I[n] = 0.0;
        this.S[n] = 1.0;
        this.disorder[n] = random(0, 1);
        if(i>0 && i<3){
          this.I[n] = 1-((i-2)*(i-2));  
          this.S[n] = 0.0;
        }
      }
    }
  }

  update(Nrun) {
    for (let n = 0; n < Nrun; n++)
      this.step();
  }
  step() {
    let L = this.L;
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        let nup = ((i + 1 + L) % L) * L + j;
        let nbo = ((i - 1 + L) % L) * L + j;
        let nle = i * L + (j - 1 + L) % L;
        let nri = i * L + (j + 1 + L) % L;
        let betadis = (this.disorder[n]>ampdis?(1.0):(0.0))* beta;
        this.forceS[n] = -betadis * this.I[n] * this.S[n];
        this.forceI[n] = -4 * this.I[n] +
          this.I[nup] + this.I[nbo] +
          this.I[nri] + this.I[nle] +
          betadis * this.I[n] * this.S[n] -
          gamma * this.I[n];
      }
    }
    
    for (let i = 1; i < L; i++) {
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        this.S[n] += this.forceS[n] * this.dt;
        this.I[n] += this.forceI[n] * this.dt;
      }
    }
    
    if(boundaryX=="Dirichlet"){
      for (let i = 0; i < L; i+=L-1) {
        for (let j = 0; j < L; j++) {
          let n = i * L + j;
          this.S[n]=0.0;
          this.I[n]=0.0;
        }
      }      
    }
 
    this.tiempo += this.dt;
  }
  render() {
    let L = this.L;
    img.loadPixels();
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        let inf = this.I[n] * 255;
        let sus = this.S[n] * 255;
        let rec = (1.0-this.I[n]-this.S[n])*255;
        img.set(i, j, color(inf, rec, sus));
      }
    }
    img.updatePixels();
    scale(amp);
    image(img, 0, 0);
  }

  addCircle(x, y, r) {
    let X = int(x);
    let Y = int(y);
    let L = this.L;
    for (let i = X - r; i <= X + r; i++) {
      for (let j = Y - r; j <= Y + r; j++) {
        if (pow(i - X, 2) + pow(j - Y, 2) < r * r) {
          let n = i * L + j;
          if (n < L * L && n >= 0) this.I[n] = 1.0;
          //console.log(i,j,this.phi[n]);
        }
      }
    }
  }

}


function keyPressed() {
  if (nrun === 0) {
    nrun = 10;
  } else {
    nrun = 0;
  }
}


function mouseDragged() {
  S.addCircle(mouseX / amp, mouseY / amp, 2);
}

function resetFlat() {
  S.resetFlat();
}