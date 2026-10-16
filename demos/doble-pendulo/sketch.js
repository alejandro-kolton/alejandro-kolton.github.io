/*
Alejandro B. Kolton
para las Clases de Mecánica 2022
Instituto Balseiro, Bariloche, Argentina
====

Este programa resuelve numéricamente, usando RK4 dos péndulos con distintas condiciones iniciales, las cuales se pueden ajustar interactivamente y reiniciar la simulación. 

RK4 no es un método simpléctico, por lo cual el código chequea cada tanto que el error en la conservación de energía será tolerable. Esto es importante si uno quiere simular un tiempo muy largo. Queda por implementar un método simpléctico, lo cual no es directo ya que el sistema no es separable.

Las coordenadas son los dos ángulos, \theta_1 y \theta_2, medidos a la dirección de la fuerza de gravedad, como se hace usualmente para el péndulo con la fuerza de gravedad apuntando para abajo. De modo que pequeñas oscilaciones son pequeños ángulos. El pendulo 1 es el que esta colgado al pivot fijo.

Los parámetros por default son l_1=l_2=m_1=m_2=1, g=9.81. Otros parámetros son el paso de tiempo y variables de la visualización.

La Lagrangiana es

\begin{align*}
\mathcal{L} =  \tfrac{1}{2}(m_1+m_2)l_1^2\dot{\theta}_1^2 + \tfrac{1}{2}m_2l_2^2\dot{\theta}_2^2 + m_2l_1l_2\dot{\theta}_1\dot{\theta}_2\cos(\theta_1 - \theta_2) + (m_1+m_2)l_1g\cos\theta_1 + m_2gl_2\cos\theta_2.
\end{align*}

Y las ecuaciones de movimiento son

\begin{align*}
\dot{z}_1 = \frac{m_2g\sin\theta_2\cos(\theta_1-\theta_2) - m_2\sin(\theta_1 - \theta_2)[l_1z_1^2\cos(\theta_1 - \theta_2) + l_2z_2^2] - (m_1+m_2)g\sin\theta_1}{l_1[m_1 + m_2\sin^2(\theta_1-\theta_2)]},\\
\dot{z}_2 = \frac{(m_1+m_2)[l_1z_1^2\sin(\theta_1-\theta_2) - g\sin\theta_2 + g\sin\theta_1\cos(\theta_1-\theta_2)]+m_2l_2z_2^2\sin(\theta_1-\theta_2)\cos(\theta_1-\theta_2)}{l_2[m_1 + m_2\sin^2(\theta_1-\theta_2)]}
\end{align*}


Refs
En python: 
https://scipython.com/blog/the-double-pendulum/

*/


// variables globales
let h = 0.002; // paso de tiempo
let S1, S2; // dos pendulos dobles
let E1, E2; // sus energias iniciales para control
let iter = 0; // iteracion
let error1 = 0.0;
let  error2 = 0.0; // errores de conservacion energia
let tolerancia=0.001; // error porcentual en la energía tolerado
let inpa1, inpa2, inpz1, inpz2; // input condiciones iniciales S1
let inpa1b, inpa2b, inpz1b, inpz2b; // input condiciones iniciales S1

// Una clase simple para el pendulo doble
let PenduloDoble = function (a1, a2, z1, z2) {
  // condicion inicial
  this.a1 = a1;
  this.a2 = a2;
  this.z1 = z1;
  this.z2 = z2;

  // parameters [mks]
  this.l1 = 1.0;
  this.l2 = 1.0;
  this.m1 = 1.0;
  this.m2 = 1.0;
  this.g = 9.81;
};

// resetear las condiciones iniciales
PenduloDoble.prototype.reset = function (a1, a2, z1, z2) {
  this.a1 = a1;
  this.a2 = a2;
  this.z1 = z1;
  this.z2 = z2;
  console.log("RESET");
};

// una funcion para calcular la energia mecanica
PenduloDoble.prototype.energia = function () {
  let V =
    -(this.m1 + this.m2) * this.l1 * this.g * cos(this.a1) -
    this.m2 * this.l2 * this.g * cos(this.a2);
  let T =
    0.5 * this.m1 * pow(this.l1 * this.z1, 2.0) +
    0.5 *
      this.m2 *
      (pow(this.l1 * this.z1, 2.0) +
        pow(this.l2 * this.z2, 2.0) +
        2 * this.l1 * this.l2 * this.z1 * this.z2 * cos(this.a1 - this.a2));

  let Energia = T + V;

  return Energia;
};

// fuerzas sobre cada variable de estado
PenduloDoble.prototype.forces = function (a1, a2, z1, z2) {
  let m1 = this.m1;
  let m2 = this.m2;
  let g = this.g;
  let l1 = this.l1;
  let l2 = this.l2;

  let s = sin(a1 - a2);
  let c = cos(a1 - a2);

  let dz1dt =
    (m2 * g * sin(a2) * c -
      m2 * s * (l1 * z1 * z1 * c + l2 * z2 * z2) -
      (m1 + m2) * g * sin(a1)) /
    (l1 * (m1 + m2 * sin(a1 - a2) * s));

  let dz2dt =
    ((m1 + m2) * (l1 * z1 * z1 * s - g * sin(a2) + g * sin(a1) * c) +
      m2 * l2 * z2 * z2 * s * c) /
    (l2 * (m1 + m2 * s * s));

  let da1dt = z1;
  let da2dt = z2;

  let v = [da1dt, da2dt, dz1dt, dz2dt];
  return v;
};

// n pasos de Runge-Kutta RK4
PenduloDoble.prototype.step = function (n) {
  for (let i = 0; i < n; i++) {
    // Paso simple de RK4
    //https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods

    a1 = this.a1;
    a2 = this.a2;
    z1 = this.z1;
    z2 = this.z2;

    let k1 = this.forces(a1, a2, z1, z2);

    let k2 = this.forces(
      a1 + h * 0.5 * k1[0],
      a2 + h * 0.5 * k1[1],
      z1 + h * 0.5 * k1[2],
      z2 + h * 0.5 * k1[3]
    );

    let k3 = this.forces(
      a1 + h * 0.5 * k2[0],
      a2 + h * 0.5 * k2[1],
      z1 + h * 0.5 * k2[2],
      z2 + h * 0.5 * k2[3]
    );

    let k4 = this.forces(
      a1 + h * k3[0],
      a2 + h * k3[1],
      z1 + h * k3[2],
      z2 + h * k3[3]
    );

    this.a1 = a1 + ((k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * h) / 6.0;
    this.a2 = a2 + ((k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * h) / 6.0;
    this.z1 = z1 + ((k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) * h) / 6.0;
    this.z2 = z2 + ((k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]) * h) / 6.0;
  }
};

PenduloDoble.prototype.dibuja = function (col) {
  let x1 = this.l1 * sin(this.a1);
  let y1 = -this.l1 * cos(this.a1);
  let x2 = x1 + this.l2 * sin(this.a2);
  let y2 = y1 - this.l2 * cos(this.a2);

  let max1 = this.l1 + this.l2;

  let px1 = map(x1, -max1, max1, 0, 400);
  let py1 = map(y1, -max1, max1, 400, 0);
  let px2 = map(x2, -max1, max1, 0, 400);
  let py2 = map(y2, -max1, max1, 400, 0);

  line(200, 200, px1, py1);
  line(px1, py1, px2, py2);

  fill(col);
  circle(px1, py1, 20);
  circle(px2, py2, 20);

  fill(51);
  circle(200, 200, 10);
};

function myInputEvent() {
  //console.log('you are typing: ', this.value());
}

let vereqs = 0;
function vereq() {
  let textoecuaciones;
  if (vereqs == 0) {
    textoecuaciones =
      "\\mathcal{L} = \\frac{1}{2}(m_1+m_2)l_1^2\\dot{\\theta}_1^2 + \\frac{1}{2}m_2l_2^2\\dot{\\theta}_2^2 + m_2 l_1 l_2\\dot{\\theta}_1 \\dot{\\theta}_2 \\cos(\\theta_1 - \\theta_2) + (m_1+m_2)l_1 g \\cos\\theta_1 + m_2 g l_2\\cos\\theta_2. \\newline \\newline \\dot{\\theta}_1=z_1,\\;\\; \\dot{\\theta}_2=z_2 \\newline \\dot{z}_1 = \\frac{m_2g\\sin\\theta_2\\cos(\\theta_1-\\theta_2) - m_2\\sin(\\theta_1 - \\theta_2)[l_1z_1^2\\cos(\\theta_1 - \\theta_2) + l_2z_2^2] - (m_1+m_2)g\\sin\\theta_1}{l_1[m_1 + m_2\\sin^2(\\theta_1-\\theta_2)]},\\newline \\dot{z}_2 = \\frac{(m_1+m_2)[l_1z_1^2\\sin(\\theta_1-\\theta_2) - g\\sin\\theta_2 + g\\sin\\theta_1\\cos(\\theta_1-\\theta_2)]+m_2 l_2 z_2^2\\sin(\\theta_1-\\theta_2)\\cos(\\theta_1-\\theta_2)}{l_2[m_1 + m_2\\sin^2(\\theta_1-\\theta_2)]} \\newline m_1=m_2=l_1=l_2=1, g=9.81";

    textolagrangiana =
      "\\mathcal{L} = \\frac{1}{2}(m_1+m_2)l_1^2\\dot{\\theta}_1^2 + \\frac{1}{2}m_2l_2^2\\dot{\\theta}_2^2 + m_2 l_1 l_2\\dot{\\theta}_1 \\dot{\\theta}_2 \\cos(\\theta_1 - \\theta_2) + (m_1+m_2)l_1 g \\cos\\theta_1 + m_2 g l_2\\cos\\theta_2.\\newline m_1=m_2=l_1=l_2=1, g=9.81";

    let tex2 = createP();
    tex2.style("font-size", "14px");
    tex2.position(0, 450);
    katex.render(textoecuaciones, tex2.elt);

    vereqs = 1;
  } else {
    vereqs = 0;
  }
}

function resetear() {
  iter = 0;

  let a1 = float(inpa1.value());
  let a2 = float(inpa2.value());
  let z1 = float(inpz1.value());
  let z2 = float(inpz2.value());
  S1.reset(a1, a2, z1, z2);
  inpa1.value(a1);
  inpa2.value(a2);
  inpz1.value(z1);
  inpz2.value(z2);

  a1 = float(inpa1b.value());
  a2 = float(inpa2b.value());
  z1 = float(inpz1b.value());
  z2 = float(inpz2b.value());
  S2.reset(a1, a2, z1, z2);
  inpa1b.value(a1);
  inpa2b.value(a2);
  inpz1b.value(z1);
  inpz2b.value(z2);

  // energias iniciales para comparar
  E1 = S1.energia();
  E2 = S2.energia();
}

function preload() {
  // preload() runs once
  imgIB = loadImage('ib.jpeg');
  // get color of middle pixel
}
function setup() {
  // condiciones iniciales de pendulo 1
  inpa1 = createInput("1");
  inpa1.position(0, 25);
  inpa1.size(50);
  inpa1.input(myInputEvent);

  inpa2 = createInput("3");
  inpa2.position(0, 45);
  inpa2.size(50);
  inpa2.input(myInputEvent);

  inpz1 = createInput("0");
  inpz1.position(inpa1.x + inpa1.width, 25);
  inpz1.size(50);
  inpz1.input(myInputEvent);

  inpz2 = createInput("0");
  inpz2.position(inpa2.x + inpa2.width, 45);
  inpz2.size(50);
  inpz2.input(myInputEvent);

  // condiciones iniciales de pendulo 2
  inpa1b = createInput("1.00001");
  inpa1b.position(2.5 * inpa1.width, 25);
  inpa1b.size(50);
  inpa1b.input(myInputEvent);

  inpa2b = createInput("3");
  inpa2b.position(2.5 * inpa1.width, 45);
  inpa2b.size(50);
  inpa2b.input(myInputEvent);

  inpz1b = createInput("0");
  inpz1b.position(inpa1b.x + inpa1.width, 25);
  inpz1b.size(50);
  inpz1b.input(myInputEvent);

  inpz2b = createInput("0");
  inpz2b.position(inpa2b.x + inpa2.width, 45);
  inpz2b.size(50);
  inpz2b.input(myInputEvent);

  S1 = new PenduloDoble(1, 3, 0, 0);
  S2 = new PenduloDoble(1.000001, 3, 0, 0);

  createCanvas(450, 450);

  // boton para resetear a condiciones iniciales
  resetButton = createButton("nuevas condiciones iniciales");
  resetButton.position(0, 0);
  resetButton.mousePressed(resetear);

  // boton para resetear a condiciones iniciales
  resetButton = createButton("ver ecuaciones");
  resetButton.position(0, 450);
  resetButton.mousePressed(vereq);

  // energias iniciales para comparar
  E1 = S1.energia();
  E2 = S2.energia();

  let tex = createP();
  tex.style("font-size", "14px");

  tex.position(280, 15);
  katex.render(
    "\\theta_1(0)\\;\\; | \\;\\;\\dot \\theta_1(0)\\newline" +
      "\\theta_2(0)\\;\\; | \\;\\;\\dot \\theta_2(0)",
    tex.elt
  );

  let label1 = createP("péndulo 1");
  label1.style("font-size", "14px");
  label1.position(0, 60);

  let label2 = createP("péndulo 2");
  label2.style("font-size", "14px");
  label2.position(2.5 * inpa1.width, 60);

  imgIB.loadPixels();
}

function draw() {
  background(220);

  image(imgIB, 400, 400, 50, 50);

  if (iter % 100 == 0) {
    error1 = (100 * (S1.energia() - E1)) / E1;
    error2 = (100 * (S2.energia() - E2)) / E2;
    console.log("Err1=" + error1 + "%", "Err2=" + error2 + "%", "iter=" + iter);
  }

  // tolerancia 0.001% en el error de la energia
  if (abs(error1) < 0.001 && abs(error2) < 0.001) {
    S1.step(10);
    S2.step(10);

    S1.dibuja(255);
    S2.dibuja(155);
  }else{
    console.log("¡El error supero lo tolerado!")
  }

  iter++;
}
