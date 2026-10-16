let img;
let width, height;

//parametros de control
let amp = 4.0;
let nrun = 10;
let pincel=0;
let ampdis=1.0;
let H0=0;
let f0=0;
let Temp=0;

// system
let S;

function setup() {
  width = height = 400;
  // El canvas original usaba width*amp (1600x1600) para el mismo amp que
  // escala la grilla al dibujarla (400x400 visibles), dejando la mayor
  // parte del canvas en blanco; acá se reduce a un tamaño que alcanza
  // para la grilla, el texto de estadísticas (que queda a la derecha,
  // por el mismo scale(amp) que escala el resto del draw() de este frame)
  // y los botones debajo.
  cnv = createCanvas(820, 500);
  // img debe tener la resolución de la grilla (100x100), no la de
  // pantalla (400x400): se escala con amp al dibujarla. Antes quedaban
  // sin usar 300x300 de sus píxeles.
  img = createImage(100, 100);
  S = new phi4(100);
  pixelDensity(1);
 
  sliderD = createSlider(0, 5, 1.0, 0.001);
  sliderD.position(10, 10);
  sliderD.style('width', '80px');

  sliderH = createSlider(-0.1, 0.1, 0.15, 0.00001);
  sliderH.position(10, 30);
  sliderH.style('width', '80px');

  sliderT = createSlider(0, 1, 0.0, 0.001);
  sliderT.position(10, 50);
  sliderT.style('width', '80px');

  sliderF = createSlider(0, 1, 0.5, 0.001);
  sliderF.position(10, 70);
  sliderF.style('width', '80px');

  
  buttonR = createButton('reset Random');
  buttonR.position(19, height*1.05);
  buttonR.mousePressed(resetRandom);

  buttonC = createButton('reset Circle');
  buttonC.position(130, height*1.05);
  buttonC.mousePressed(resetCircle);
  
  buttonF = createButton('reset Flat DW');
  buttonF.position(230, height*1.05);
  buttonF.mousePressed(resetFlat);
}

function draw() {

  ampdis=sliderD.value();
  H0=sliderH.value();
  Temp=sliderT.value();
  f0=sliderF.value();

  background(220);
  S.render();
  
  if(int(pincel)===1) fill('red');
  if(int(pincel)===-1) fill('blue');
  if(int(pincel)===0) fill(255);

  stroke(0);
  if(pincel!=0)
  ellipse(mouseX / amp, mouseY / amp, 10);
  
  //if(keyIsPressed === false) 
  S.update(nrun);

  stroke(0);
  textSize(4);
  fill(255);
  text('Disorder='+ampdis, 30, 6.0);

  textSize(4);
  fill(255);
  text('Field='+H0, 30, 11);

  textSize(4);
  fill(255);
  text('Temp='+Temp, 30, 16);

  textSize(4);
  fill(255);
  text('freq='+f0, 30, 21);
  
  /*noStroke();
  let s = 'pintar magnetizacion:\nUPARROW/DOWNARROW\n'
  +'MOUSE DRAG';
  fill(0);
  text(s, 105, 10,50,50);
  */
  noStroke();
  fill(0);
  if(nrun===0) text('pausado', 82, 95, 50, 50);
  
  textSize(3);
  fill(0);
  text('magnetic brush: UPARROW + mousse drag, DOWNARROW (off)', 0,115,100,50);
  text('pause/resume: any key', 0,119,100,50);  

  textSize(3);
  fill(0);
  text('Magnetization='+Math.round(S.Mag*100.)/100.,105,10, 150,30);  

}

class phi4 {
  constructor(L) {
    this.dt = 0.1;
    this.L = L;
    this.phi = [];
    this.forcePhi = [];
    this.disorder = [];
    this.tiempo=0.0;
    this.Mag=0.0;
    /*for (let i = 0; i < L; i++) {
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        this.phi[n] = random(-1, 1);
        this.disorder[n] = random(-1,1);
      }
    }*/
    //this.resetRandom();
    this.resetCircle();
  }
  
  resetRandom(){
    let L=this.L;
    this.Mag=0.0;
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        this.phi[n] = random(-1, 1);
        this.disorder[n] = random(-1,1);
        this.Mag+=this.phi[n];
      }
    }  
    this.Mag*=1./(L*L);
  }
  
  resetCircle(){
    let L=this.L;
    this.Mag=0.0;
    for (let i = 0; i < L; i++) {
    for (let j = 0; j < L; j++) {
      let n = i * L + j;
      this.phi[n] =-1.0;
      if(pow(i-L/2,2)+pow(j-L/2,2)<15*15)
      this.phi[n] =1.0;  
      
      //if(L-i<sqrt(PI)*15 && L-j<sqrt(PI)*15) this.phi[n] =1.0;      
      this.disorder[n] = random(-1,1);
      this.Mag+=this.phi[n];
    }}
    this.Mag*=1./(L*L);
  }

 
  resetFlat(){
    this.Mag=0.0;
    let L=this.L;
    for (let i = 0; i < L; i++) {
    for (let j = 0; j < L; j++) {
      let n = i * L + j;
      this.phi[n] =-1.0;
      if(i>L/2)
      this.phi[n] =1.0;  
      this.disorder[n] = random(-1,1);
      this.Mag+=this.phi[n];
    }}
    this.Mag*=1./(L*L);
  }
  
  update(Nrun) {
    for (let n = 0; n < Nrun; n++)
      this.step();
  }

  step() {
    this.Mag=0.0;
    let L = this.L;
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        let nup = ((i + 1 + L) % L) * L + j;
        let nbo = ((i - 1 + L) % L) * L + j;
        let nle = i * L + (j - 1 + L) % L;
        let nri = i * L + (j + 1 + L) % L;

        let lap = -4 * this.phi[n] 
          + this.phi[nup] + this.phi[nbo] 
          + this.phi[nri] + this.phi[nle] ;
        
        let grad2 = (this.phi[nup] - this.phi[nbo]) ** 2 +
          (this.phi[nri] - this.phi[nle]) ** 2;
        
        this.forcePhi[n] = 1.5*(lap + lap*grad2*0.1)
          - pow(this.phi[n], 3) 
          + (1+this.disorder[n]*ampdis)*this.phi[n]
          + H0*(cos(f0*this.tiempo)>0?(1.0):(-1.0));
      }
    }
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        this.phi[n] =
          this.phi[n] + this.forcePhi[n] * this.dt 
        + sqrt(Temp*this.dt/3.0)*random(-1,1);
        this.Mag+=this.phi[n];
      }
    }
    this.tiempo+=this.dt;
    this.Mag*=1./(L*L);
  }

  addCircle(x, y, r) {
    let X = int(x);
    let Y = int(y);
    let L = this.L;
    for (let i = X - r; i <= X + r; i++) {
      for (let j = Y - r; j <= Y + r; j++) {
        if (pow(i - X, 2) + pow(j - Y, 2) < r * r) {
          let n = i * L + j;
          if (n < L * L && n >= 0) this.phi[n] = pincel;
          //console.log(i,j,this.phi[n]);
        }
      }
    }
  }

  render() {
    let L = this.L;
    img.loadPixels();
    for (let i = 0; i < L; i++) {
      for (let j = 0; j < L; j++) {
        let n = i * L + j;
        let col = (this.phi[n] + 1) * 255/2.0;
        //let col = (this.phi[n]>0)?(255):(0);
        img.set(i, j, color(col, 0, 255 - col));
        //img.set(i, j, color(100+col, 100+col, 100+col));
      }
    }
    img.updatePixels();
    scale(amp);
    image(img, 0, 0);
  }

}

function mouseDragged() {
  if(pincel!=0) S.addCircle(mouseX/amp, mouseY/amp,5);
}

function mousePressed() {
  if(pincel!=0) S.addCircle(mouseX/amp, mouseY/amp,5);
}

function keyPressed() {
  if(keyCode === UP_ARROW)
    pincel=(pincel>0)?(-1):(1);
  else if(keyCode === DOWN_ARROW)
    pincel = 0;
  else if(keyCode !== LEFT_ARROW && keyCode !==RIGHT_ARROW)
  {
    if (nrun === 0) {
      nrun = 10;
    } else {
      nrun = 0;
    }
  }  
}

function resetRandom() {
  S.resetRandom();
}

function resetCircle() {
  S.resetCircle();
}

function resetFlat() {
  S.resetFlat();
}

