/*
Muestra los bordes de Argentina en 
distintos planetas, luna, sol, etc,
respetando las extensiones relativas.
Usamos a Argentina como una unidad visual de medida.

@droyktton
*/
let earthAngle = 0;
let earthTexture;
let LatArg = [];
let LonArg = [];
let myFont;
let width, height;
let opt = "Moon";
//let opt;

let sel;

function preload() {
  if (opt == "Moon") MarteTexture = loadImage("moonmap1k.jpg");
  else if (opt == "Marte") MarteTexture = loadImage("marsmap1k.jpg");
  else if (opt == "Jupiter") MarteTexture = loadImage("jupitermap.jpg");
  else if (opt == "Saturno") MarteTexture = loadImage("saturnmap.jpg");
  else if (opt == "Mercurio") MarteTexture = loadImage("mercurymap.jpg");
  else if (opt == "Venus") MarteTexture = loadImage("venusmap.jpg");
  else if (opt == "Urano") MarteTexture = loadImage("uranusmap.jpg");
  else if (opt == "Neptuno") MarteTexture = loadImage("neptunemap.jpg");
  else if (opt == "Pluton") MarteTexture = loadImage("plutomap1k.jpg");
  else if (opt == "Sol") MarteTexture = loadImage("sunmap.jpg");
  else if (opt == "Tierra") MarteTexture = loadImage("earth-texture.jpg");
  else {
    MarteTexture = loadImage("moonmap1k.jpg");
    opt = "Moon";
  }

  table = loadTable("ar.csv", "csv", "header");

  myFont = loadFont("Inconsolata.otf");
}

function setup() {
  width = 400;
  height = 400;

  const canvas = createCanvas(width, height, WEBGL);
  noStroke();

  //count the columns
  /*print(table.getRowCount() + " total rows in table");
  print(table.getColumnCount() + " total columns in table");

  print(table.getColumn("LAT"));

  print(table.getColumn("LON"));
  */

  //cycle through the table table.getRowCount()->10
  for (let r = 0; r < table.getRowCount(); r++) {
    //print(table.getString(r, 0),table.getString(r, 1));
    LatArg[r] = table.getString(r, 0);
    LonArg[r] = table.getString(r, 1);
  }

  textAlign(CENTER);
  //background(200);
  sel = createSelect();
  sel.position(10, 10);
  sel.option("Sol");
  sel.option("Mercurio");
  sel.option("Venus");
  sel.option('Tierra');
  sel.option("Luna");
  sel.option("Marte");
  sel.option("Jupiter");
  sel.option("Saturno");
  sel.option("Urano");
  sel.option("Neptuno");
  sel.option("Pluton");
  sel.selected("Luna");
  sel.changed(mySelectEvent);
}

function draw() {
  let radio = 100;
  background(0);

  //ambientLight(200, 200, 200);
  //directionalLight(128, 128, 128, 0, 0, -1);
  let dirX = (mouseX / width - 0.5) * 2;
  let dirY = (mouseY / height - 0.5) * 2;
  directionalLight(255, 255, 255, -dirX, -dirY, -1);
  
  
  textFont(myFont);
  textSize(16);
  fill(255, 255, 255);
  text("by @droyktton", 130, 185);

  orbitControl();
  texture(MarteTexture);
  rotateY(earthAngle);
  earthAngle += 0.01;
  sphere(radio);

  noFill();
  strokeWeight(2.5);
  //stroke(100, 100, 237);
  stroke(255, 0, 0);
  beginShape(POINTS);

  let fac, offtheta, offphi;

  if (opt == "Moon") {
    fac = 3.667818077;
    offtheta = -PI * 0.2;
    offphi = -PI * 0.8;
  } else if (opt == "Marte") {
    fac = 1.879905577;
    offtheta = -PI * 0.6;
    offphi = -PI * 0.5;
  } else if (opt == "Jupiter") {
    fac = 0.09113015119;
    offtheta = -PI;
    offphi = -PI * 0.5;
  } else if (opt == "Saturno") {
    fac = 0.1094071988;
    offtheta = -PI;
    offphi = -PI * 0.5;
  } else if (opt == "Mercurio") {
    fac = 2.612136121;
    offtheta = -PI * 0.45;
    offphi = -PI * 0.5;
  } else if (opt == "Venus") {
    fac = 1.052883821;
    offtheta = -PI * 0.75;
    offphi = -PI * 0.5;
  } else if (opt == "Urano") {
    fac = 0.2512025865;
    offtheta = -PI * 0.9;
    offphi = -PI * 0.5;
  } else if (opt == "Neptuno") {
    fac = 0.2587523353;
    offtheta = -PI * 0.9;
    offphi = -PI * 0.5;
  } else if (opt == "Pluton") {
    fac = 5.362794613;
    offtheta = -PI * 0.1;
    offphi = -PI * 0.5;
  } else if (opt == "Sol") {
    fac = 0.009149266163;
    offtheta = -PI * 0.0;
    offphi = -PI * 0.5;
  } else if (opt == "Tierra") {
    fac = 1.0;
    offtheta = -PI;
    offphi = -PI*0.0;
  } else {
    fac = 3.67;
    offtheta = -PI * 0.2;
    offphi = -PI * 0.8;
  }

  let x, y, z;
  for (i = 0; i < table.getRowCount(); i++) {
    let theta = (fac * LatArg[i] * PI * 0.5) / 90 + offtheta;
    let phi = (fac * LonArg[i] * PI) / 180 + offphi;

    x = radio * cos(theta) * sin(phi);
    z = radio * cos(theta) * cos(phi);
    y = radio * sin(theta);

    vertex(x, y, z);
  }
  endShape();

  noStroke();
}

function mySelectEvent() {
  let item = sel.value();
  opt = item;
  console.log(item);
  preload();
}

/*
Mercurio	2439	2,612136121
Venus	6051	1,052883821
Tierra	6371	1
Marte	3389	1,879905577
Jupiter	69911	0,09113015119
Saturno	58232	0,1094071988
Urano	25362	0,2512025865
Neptuno	24622	0,2587523353
Sol	696340	0,009149266163
Luna	1737	3,667818077
Pluton	1188	5,362794613
Ganimedes	2634	2,418754746
Europa	1560	4,083974359
*/
