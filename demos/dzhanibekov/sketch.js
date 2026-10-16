/*
A. B. Kolton 2022 @droyktton
Mecanica Analítica, Instituto Balseiro
una app para ver la rotacion libre y 
explorar visualmente teorema del eje intermedio
*/

let inconsolata;
let system;
let ancho = 400;
let img;
let deco = 1;
let checkboxT, checkboxL,checkboxP, checkboxPausa;

//let spanish=true;
let spanish=false;

//let stepOpt="Euler";
let stepOpt="Stormer-Verlet";

function preload() {
  inconsolata = loadFont("Inconsolata.otf");
  img = loadImage("ib.png");
  img2 = loadImage("librochule.png");
}

function setup() {
  createCanvas(720, 400);
  // Notar! Es necesario empezar con theta<>0
  system = new CuerpoRigido(0.0001, 0.0001, 0.0001, 0.0, 0.0, 0.001);
  createCanvas(ancho, ancho, WEBGL);

  sliderp = createSlider(0, 1000, 300);
  sliderp.position(0, 0);

  sliderw1 = createSlider(-1, 1, 2.0, 0.001);
  sliderw1.position(ancho * 0.55, ancho);
  sliderw2 = createSlider(-1, 1, 0.0, 0.001);
  sliderw2.position(ancho * 0.55, ancho + 20);
  sliderw3 = createSlider(-1, 1, 0.0, 0.001);
  sliderw3.position(ancho * 0.55, ancho + 40);
  msg1 = createP("w1");
  msg1.position(ancho - 35, ancho - 15);
  msg2 = createP("w2");
  msg2.position(ancho - 35, ancho - 15 + 20);
  msg3 = createP("w3");
  msg3.position(ancho - 35, ancho - 15 + 40);

  if(spanish)
  msg4 = createP(
    "Cuerpo rígido libre:</br>" +
      "Fijá la velocidad angular inicial</br>" +
      "y reseteá para aplicar</br>"
  );
  else
  msg4 = createP(
    "Free Rigid Body:</br>" +
      "Fix initial angular velocities wi </br>" +
      "and reset to apply changes</br>"
  );
  msg4.position(0, ancho - 10);

  if(spanish)
  button = createButton("Reseteá Condicion Inicial");
  else
  button = createButton("Reset Initial Condition");
  
  button.position(ancho * 0.57, 0);
  button.mousePressed(resetCI);

  /*
  button2 = createButton("¡Envolvelo!");
  button2.position(ancho * 0.5, 25);
  button2.mousePressed(decoIB);
  */

  textFont(inconsolata);
  textSize(20);
  textAlign(CENTER, CENTER);

  if(spanish) checkboxT = createCheckbox("manija T", true);
  else checkboxT = createCheckbox("T handle", true);
  checkboxT.changed(myCheckedEventT);
  checkboxT.position(ancho, 20);

  if(spanish) checkboxL = createCheckbox("Libro", false);
  else checkboxL = createCheckbox("Book", false);
  checkboxL.changed(myCheckedEventL);
  checkboxL.position(ancho, 40);

  if(spanish) checkboxP = createCheckbox("Paleta", false);
  else checkboxP = createCheckbox("Racket", false);
  //checkboxL.changed(myCheckedEventL);
  checkboxP.position(ancho, 60);

  if(spanish) checkboxPausa = createCheckbox("Pausa", false);
  else checkboxPausa = createCheckbox("Pause", false);
  //checkboxL.changed(myCheckedEventL);
  checkboxPausa.position(ancho, 0);

  resetCI();
}

function myCheckedEventT() {
  if (checkboxT.checked()) {
    console.log("Checking!");
  } else {
    console.log("Unchecking!");
  }
}
function myCheckedEventL() {
  if (checkboxL.checked()) {
    console.log("Checking!");
  } else {
    console.log("Unchecking!");
  }
}

function decoIB() {
  deco = deco == 0 ? 1 : 0;
  clear();
}

function resetCI() {
  let epsilon = 0.0000000;
  let w1 = sliderw1.value() + epsilon;
  let w2 = sliderw2.value() + epsilon;
  let w3 = sliderw3.value() + epsilon;

  // Notar! Es necesario empezar con theta<>0
  system.reset(w1, w2, w3, 0, 0, 0.0001);
}

function draw() {
  let locX = mouseX - ancho / 2;
  let locY = mouseY - ancho / 2;
  ambientLight(60, 60, 60);
  pointLight(255, 255, 255, locX, locY, 100);
  ambientMaterial(250);
  //normalMateriambiental(250);

  //drag to move the world.
  //orbitControl();

  background(51);
  image(img, 160, 160, 40, 40);

  textSize(20);
  text(
    "(w1,w2,w3)=" +
      "(" +
      round(system.w1 * 100) / 100 +
      "," +
      +round(system.w2 * 100) / 100 +
      "," +
      +round(system.w3 * 100) / 100 +
      ")",
    -ancho * 0.01,
    ancho * 0.45
  );

  textSize(15);
  if(spanish) text("tiempo x cuadro", -130, -180);
  else text("time per frame", -130, -180);
  
  for (i = 0; i < sliderp.value(); i++) 
    if(!checkboxPausa.checked()) system.step();

  let Ekin=     round(
        100*(system.I1 * system.w1* system.w1/2.+
        system.I2 * system.w2* system.w2/2.+
        system.I3 * system.w3* system.w3/2.)      
      )/100;
  text(
    "Ekin=" +
    Ekin,
    -ancho * 0.25,
    ancho * 0.35
  );
  console.log(Ekin)

  
  
  system.dibujar();
}

let CuerpoRigido = function (w1, w2, w3, phi, psi, theta) {
  this.r1 = ancho * 0.7;
  this.r2 = this.r1 * 0.5;
  this.r3 = this.r2 * 0.25;
  this.I1 = (this.r2 * this.r2 + this.r3 * this.r3) / 100;
  this.I2 = (this.r1 * this.r1 + this.r3 * this.r3) / 100;
  this.I3 = (this.r2 * this.r2 + this.r1 * this.r1) / 100;
  this.w1 = w1;
  this.w2 = w2;
  this.w3 = w3;
  this.phi = phi;
  this.psi = psi;
  this.theta = theta;
  this.dt = 0.0001;
  console.log("I1=" + this.I1);
  console.log("I2=" + this.I2);
  console.log("I3=" + this.I3);
};

CuerpoRigido.prototype.reset = function (w1, w2, w3, phi, psi, theta) {
  this.w1 = w1;
  this.w2 = w2;
  this.w3 = w3;
  this.phi = phi;
  this.psi = psi;
  this.theta = theta;
};

CuerpoRigido.prototype.dibujar = function () {
  angleMode(RADIANS);
  rotateZ(this.phi);
  rotateX(this.theta);
  rotateZ(this.psi);

  if (checkboxL.checked()) {
    box(this.r1, this.r2, this.r3);
    push();
    translate(0, 0, this.r3 * 0.5);
    if (deco) texture(img2);
    box(this.r1, this.r2, this.r3 * 0.01);
    pop();
  }
  if (checkboxT.checked()) {
    push();
    translate(0, this.r1 * 0.17, 0);
    //specularMaterial(250);
    normalMaterial();
    cylinder(10, this.r1 * 0.5);
    pop();

    push();
    let l=this.r1 *1.1;
    rotateX(PI / 2.0);
    rotateZ(PI / 2.0);
    translate(0, 0, l * 0.1);
    //specularMaterial(250);
    normalMaterial();
    cylinder(10, l);
    pop();
  }
  if (checkboxP.checked()) {
    // paleta de ping pong
    push();
    let radioc = ancho * 0.2;
    rotateX(PI / 2);
    translate(radioc * 0.8, 0, 0);
    ambientMaterial('red');
    cylinder(radioc, radioc / 10);
    pop();
    push();
    translate(-radioc * 0.5, 0, 0);
    rotateZ(PI / 2);
    ambientMaterial('beige');
    cylinder(radioc / 5, radioc);
    pop();
  }

  //eje X
  stroke("yellow");
  strokeWeight(1);
  line(0, 0, 0, ancho * 0.5, 0, 0);
  stroke(0);
  /*  push();
  ambientMaterial("yellow");
  rotateZ(PI/2);
  translate(0,-ancho*0.5,0);
  cylinder(7,ancho*0.5);
  pop();
*/
  //eje Y
  //push();
  stroke("red");
  strokeWeight(1);
  line(0, 0, 0, 0, ancho * 0.5, 0);
  stroke(0);
  //pop();

  //  //eje Z
  //push();
  stroke("blue");
  strokeWeight(1);
  line(0, 0, 0, 0, 0, ancho * 0.5);
  stroke(0);
  //pop();

  //push();
  stroke("white");
  strokeWeight(5);
  line(0, 0, 0, -ancho * this.w1, -ancho * this.w2, -ancho * this.w3);
  stroke(0);

  //push();
  stroke("pink");
  strokeWeight(5);
  line(
    0,
    0,
    0,
    -ancho * this.w1 * this.I1,
    -ancho * this.w2 * this.I2,
    -ancho * this.w3 * this.I3
  );
  stroke(0);

  strokeWeight(1);
};


CuerpoRigido.prototype.step = function () 
{
  if(stepOpt="Euler") this.euler_step();  
  if(stepOpt="Symplectic-Euler") this.midpoint_step();  
  if(stepOpt="Stormer-Verlet") this.stormer_verlet_step();  
}

CuerpoRigido.prototype.euler_step = function () {
  let I1 = this.I1;
  let I2 = this.I2;
  let I3 = this.I3;
  let phi = this.phi;
  let psi = this.psi;
  let theta = this.theta;
  let omega1 = this.w1;
  let omega2 = this.w2;
  let omega3 = this.w3;

  // derivadas de las componentes de la velocidad angular
  // Ecs de Euler
  let dw1 = ((I2 - I3) / I1) * omega2 * omega3;
  let dw2 = ((I3 - I1) / I2) * omega1 * omega3;
  let dw3 = ((I1 - I2) / I3) * omega1 * omega2;

  // derivadas de los ángulos de Euler (cinemática)
  dphi = (omega1 * sin(psi) + omega2 * cos(psi)) / sin(theta);
  dpsi =
    (-omega1 * sin(psi)) / tan(theta) -
    (omega2 * cos(psi)) / tan(theta) +
    omega3;
  dtheta = omega1 * cos(psi) - omega2 * sin(psi);

  // paso de Euler de primer orden
  this.w1 += dw1 * this.dt;
  this.w2 += dw2 * this.dt;
  this.w3 += dw3 * this.dt;
  this.phi += dphi * this.dt;
  this.psi += dpsi * this.dt;
  this.theta += dtheta * this.dt;
};



CuerpoRigido.prototype.stormer_verlet_step = function () {
  let I1 = this.I1;
  let I2 = this.I2;
  let I3 = this.I3;
  let phi = this.phi;
  let psi = this.psi;
  let theta = this.theta;
  let omega1 = this.w1;
  let omega2 = this.w2;
  let omega3 = this.w3;

  // derivadas de las componentes de la velocidad angular
  // Ecs de Euler
  let dw1 = ((I2 - I3) / I1) * omega2 * omega3;
  let dw2 = ((I3 - I1) / I2) * omega1 * omega3;
  let dw3 = ((I1 - I2) / I3) * omega1 * omega2;

  // paso de Euler de primer orden
  omega1 += (dw1 ) * this.dt * 0.5;
  omega2 += (dw2 ) * this.dt * 0.5;
  omega3 += (dw3 ) * this.dt * 0.5;
  
  dw1 = ((I2 - I3) / I1) * omega2 * omega3;
  dw2 = ((I3 - I1) / I2) * omega1 * omega3;
  dw3 = ((I1 - I2) / I3) * omega1 * omega2;

  // paso de Euler de primer orden
  this.w1 += (dw1 ) * this.dt * 0.5;
  this.w2 += (dw2 ) * this.dt * 0.5;
  this.w3 += (dw3 ) * this.dt * 0.5;

  omega1=this.w1;
  omega2=this.w2;
  omega3=this.w3;
  //lamba=0;
  
  // derivadas de los ángulos de Euler (cinemática)
  dphi = (omega1 * sin(psi) + omega2 * cos(psi)) / sin(theta);
  dpsi =
    (-omega1 * sin(psi)) / tan(theta) -
    (omega2 * cos(psi)) / tan(theta) +
    omega3;
  dtheta = omega1 * cos(psi) - omega2 * sin(psi);

  // paso de Euler de primer orden
  this.phi += dphi * this.dt;
  this.psi += dpsi * this.dt;
  this.theta += dtheta * this.dt;
  
  /*
  w1_new = w1 + dt * ((I2 - I3) / I1) * w2 * w3
    w2_new = w2 + dt * ((I3 - I1) / I2) * w3 * w1_new  # Use new w1 for symplecticity
    w3_new = w3 + dt * ((I1 - I2) / I3) * w1_new * w2_new  # Use new w1 and w2
  */
};


CuerpoRigido.prototype.midpoint_step = function () {
  let I1 = this.I1;
  let I2 = this.I2;
  let I3 = this.I3;
  let phi = this.phi;
  let psi = this.psi;
  let theta = this.theta;
  let omega1 = this.w1;
  let omega2 = this.w2;
  let omega3 = this.w3;

  // derivadas de las componentes de la velocidad angular
  // Ecs de Euler
  let dw1 = ((I2 - I3) / I1) * omega2 * omega3;
  let dw2 = ((I3 - I1) / I2) * omega1 * omega3;
  let dw3 = ((I1 - I2) / I3) * omega1 * omega2;
  // paso de Euler de primer orden
  omega1 += (dw1 ) * this.dt * 0.5;
  omega2 += (dw2 ) * this.dt * 0.5;
  omega3 += (dw3 ) * this.dt * 0.5;

  
  dw1 = ((I2 - I3) / I1) * omega2 * omega3;
  dw2 = ((I3 - I1) / I2) * omega1 * omega3;
  dw3 = ((I1 - I2) / I3) * omega1 * omega2;

  // paso de Euler de primer orden
  this.w1 += (dw1 ) * this.dt;
  this.w2 += (dw2 ) * this.dt;
  this.w3 += (dw3 ) * this.dt;

  omega1=this.w1;
  omega2=this.w2;
  omega3=this.w3;
  //lamba=0;
  
  // derivadas de los ángulos de Euler (cinemática)
  dphi = (omega1 * sin(psi) + omega2 * cos(psi)) / sin(theta);
  dpsi =
    (-omega1 * sin(psi)) / tan(theta) -
    (omega2 * cos(psi)) / tan(theta) +
    omega3;
  dtheta = omega1 * cos(psi) - omega2 * sin(psi);

  // paso de Euler de primer orden
  this.phi += dphi * this.dt;
  this.psi += dpsi * this.dt;
  this.theta += dtheta * this.dt;
  
  /*
  w1_new = w1 + dt * ((I2 - I3) / I1) * w2 * w3
    w2_new = w2 + dt * ((I3 - I1) / I2) * w3 * w1_new  # Use new w1 for symplecticity
    w3_new = w3 + dt * ((I1 - I2) / I3) * w1_new * w2_new  # Use new w1 and w2
  */
};


