let Temp;
let f0;
let width = 500;
let height = 500;
let Cuerda;
let slider;
let img
let amp = 3;
let nrun;

function setup() {
  createCanvas(width, height);
  Cuerda = new elasticLine(256);
  /*
  img.loadPixels();
  for (let i = 0; i < img.width; i++) {
    for (let j = 0; j < img.height; j++) {
      img.set(i, j, color(255, 255, 255));
    }
  }
  img.updatePixels();  
  */

  slider = createSlider(0, 10, 1, 0.01);
  slider.position(10, 10);
  slider.style('width', '80px');

  slider2 = createSlider(0, 1, 0.1, 0.0001);
  slider2.position(100, 10);
  slider2.style('width', '80px');

  slider3 = createSlider(0, 1000, 50, 1);
  slider3.position(190, 10);
  slider3.style('tframes', '80px');
  
  //frameRate(20);
}

function draw() {
  background(180);
  
  Temp = slider.value();
  f0 = slider2.value();
  nrun=slider3.value();
  
  textSize(15);
  text('T=' + Temp, 10, 60);
  textSize(15);
  text('f=' + f0, 100, 60);
  textSize(15);
  text('tframes=' + nrun, 190, 60);


  Cuerda.render();
  Cuerda.update(nrun);
}

class elasticLine {
  constructor(L) 
  {
    randomSeed(0);
    this.dt = 0.1;
    this.L = L;
    this.monomer = [];
    this.fuerza = [];
    this.m2 = 0.0;
    this.disorder = [];
    for (let i = 0; i < L; i++) {
      this.monomer[i] = 0;
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        this.disorder[n] = random(-1, 1);
      }
    }

  }

  fuerzas() {
    let L = this.L;
    for (let i = 0; i < L; i++) {
      let ip1 = (i + 1) % L
      let im1 = (i - 1 + L) % L
      this.fuerza[i] =
        this.monomer[ip1] +
        this.monomer[im1] -
        2 * this.monomer[i] +
        f0;
      //let ran=randomSeed(int(this.monomer[i]));
      //(width / 2 - this.monomer[i]) * this.m2 +

      let u = this.monomer[i];
      u = u - floor(u / L) * L;
      let j = int(u) % L;

      let n = i * L + j;
      let np1 = (i * L + (j + 1) % L);

      let force =
        this.disorder[n] +
        (u - j) *
        (this.disorder[np1] - this.disorder[n]);
      this.fuerza[i] += force;
    }
  }

  update(nrun) {
    let L = this.L;
    for (let n = 0; n < nrun; n++) {
      this.fuerzas();
      for (let i = 0; i < L; i++) {
        this.monomer[i] += (
          this.fuerza[i] * this.dt +
          sqrt(Temp * this.dt) * random(-1, 1));
      }
    }
  }

  render() {
    //let amp = 5;
    let L = this.L;
    let a = height / L;
    
    /*for (let i = 0; i < L; i++){    
    for (let j = 0; j < L; j++){
      let x=(i-0.5)*a;
      let y=(j-0.5)*a;
      let dis=255*(this.disorder[i*L+j]+1);
      fill(color(dis,100,255-dis));
      square(x,y,1);      
    }}*/  
    
    for (let i = 0; i < L - 1; i++) {
      let u1 = this.monomer[i] * amp; //+ width / 2;
      let u2 = this.monomer[i + 1] * amp; //+ width / 2;
      u2 = u2 - floor(u2 / width) * width;
      u1 = u1 - floor(u1 / width) * width;
      push();
      stroke('darkred');
      strokeWeight(2);
      if (abs(u1 - u2) < width / 2.0)
        line(u1, i * a, u2, (i + 1) * a);
      pop();
    }
  }

}

