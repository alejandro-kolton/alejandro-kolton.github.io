// ABKolton para Statistical Mechanics, Instituto Balseiro

let B;
let omega,omega0,friccion=0;

let pos=200;
let myFont;
let iblogo;

let orbitX = [];
let orbitY = [];

function preload() {
  myFont = loadFont('Inconsolata-Black.otf');
  iblogo = loadImage('iblogo.jpg');
}

function setup() {
  createCanvas(710, 400, WEBGL);
  B=new bolita();

  // velocidad angular impuesta  
  slider = createSlider(0, 1, 0.1, 0.01);
  slider.position(10, 10);
  slider.style('width', '80px');
  
  // sqrt(g/R)
  slider0 = createSlider(0, 1, 0.5, 0.01);
  slider0.position(10, 40);
  slider0.style('width', '80px');

  // friccion
  slider1 = createSlider(0, 1, 0.5, 0.01);
  slider1.position(10, 70);
  slider1.style('width', '80px');

  
  fill('#ED225D');
  textFont(myFont);
  textSize(60);

  let fps=15;
  frameRate(fps);
}



function draw() {
    
  background(100);

  camera(0, 0, 1000, 0, 0, 0, 0, 1, 1);

  text('w='+omega, -700, -510);  
  text('sqrt(g/R)='+omega0, -700, -420);  
  text('friccion='+friccion, -700, -320);  

  omega=slider.value();
  omega0=slider0.value();
  friccion=slider1.value();
  
  
  //textSize(32);
  //text('word', 10, 30);
  console.log('w0=sqrt(g/R)=',omega0,', w=',omega)
  console.log('pos=',pos)
  console.log('frameCount=',frameCount);
  
  B.render();
  for(i=0;i<50;i++) B.leapfrog();
 

}

class bolita {
  constructor() {
    this.dt=0.01;
    //this.omega=0.0;
    //this.omega0=0.1;
    this.p=0;
    this.o=PI+0.3;
    //this.k=0.1;
    this.t=0.0;
  }
  fuerza(x){
    //let omega0=this.omega0;
    //let omega=this.omega;
    return omega0*omega0*sin(x)+2*omega*omega*sin(2*x);
  }
  leapfrog(){
    this.p=this.p+this.dt*(this.fuerza(this.o)-friccion*this.p);
    this.o=this.o+this.dt*this.p;
    this.t+=this.dt;
  }
  render() {
    //let omega=this.omega;

    //let x = 150 * cos(this.o-PI/2);
    //let y = 150 * sin(this.o-PI/2+omega*frameCount);    
    camera(0, 0, 2*pos, 0, 0, 0, 0, 1, 1);
    
    //orbitX[frameCount]=x;
    //orbitY[frameCount]=y;
    
    normalMaterial();

    /*push();
    translate(0, 200, 0);
    rotateX(1.5);
    plane(100);
    pop();*/

    translate(0, 0, 0);
    push();
    //rotateZ(frameCount * 0.01);
    //rotateX(frameCount * 0.01);
    rotateY(omega *this.t);
    torus(150, 10);
    //box(70,70,70);
    cylinder(2, 700);
    let x = 150 * cos(this.o-PI/2);
    let y = 150 * sin(this.o-PI/2);
    translate(x, y, 0);
    texture(iblogo);
    sphere(30);

    
    
    pop();
  }
}


function mouseWheel(event) {
  print(event.delta);
  //move the square according to the vertical scroll amount
  pos += event.delta*5;
  //uncomment to block page scrolling
  //return false;
}