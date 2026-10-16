/*
Alejandro B. Kolton
Material didáctico para Mecánica Estadística 
Instituto Balseiro

Modelo de Ising en d=2 con Metropolis MonteCarlo Secuencial
*/

let gridSize = 60;
let grid = [];
let temperatureSlider, fieldSlider;
let temperature = 2.0;  // Adjustable temperature
let J = 1;  // Interaction energy (positive for ferromagnetic interaction)
let h = 0;  // External magnetic field
let iter=0;
let magnetization;
let currentState = false;  // Initial state
let currentStateStagg = false;  // Initial state
let oscilators = [];

// Function to calculate flip probability based on energy difference
let flipProbability = (dE, T) => Math.exp(-dE / T);


let img;
function preload() {
  img = loadImage("ib.png");
}


// Set up the grid and initialize spins randomly
function setup() {
  createCanvas(400, 470);  // Make space for sliders and labels below the grid
  
  // Initialize the grid with random spins
  magnetization=0.0;
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = random() < 0.5 ? 1 : -1;
      magnetization+=grid[i][j];
    }
  }
  
  frameRate(10);  // Controls the speed of the simulation
  
  // Create sliders for temperature and external magnetic field
  temperatureSlider = createSlider(0.1, 5.0, temperature, 0.1);
  temperatureSlider.position(20, 410);
  
  fieldSlider = createSlider(-2.0, 2.0, h, 0.1);
  fieldSlider.position(220, 410);
  
  let button = createButton('Ferro/Antiferro');
  button.position(20, 450);
  button.mousePressed(toggleState);  // Assign the function to be called when button is pressed

  let buttonStagg = createButton('Staggered/Normal');
  buttonStagg.position(220, 450);
  buttonStagg.mousePressed(toggleStateStagg);  // Assign the function to be called when button is pressed

// Linearly spaced frequencies between 20 Hz and 20,000 Hz
  let minFreq = 20;
  let maxFreq = 20000;
  let numFrequencies = 360;
  
  // Fill the frequencies array
  for (let i = 0; i < gridSize; i++) 
  {
    oscilators[i] = [];
    for (let j = 0; j < gridSize; j++) {
      //let freqsample = map(i*gridSize+j, 0, numFrequencies - 1, minFreq, maxFreq);
      //logarithmically spaced
      let freqsample = minFreq * pow(maxFreq / minFreq, i / (numFrequencies - 1));
      // Create an oscillator (default type is 'sine')
      osc = new p5.Oscillator('sine');
      osc.amp(0);
      osc.freq(freqsample);
      oscilators[i][j]=osc;  // Store the oscillator
    }
  }
}

function draw() {
  background(255);
  
  // Get the values from the sliders
  temperature = temperatureSlider.value();
  h = fieldSlider.value();
  
  // Display the temperature and field values
  textSize(16);
  fill(0);
  text(`Temperatura: ${temperature.toFixed(2)}`, 20, 440);
  text(`Campo externo: ${h.toFixed(2)}`, 220, 440);
  text(`J:${J.toFixed(1)}`,130, 465);

  displayGrid();
  
  for(let i=0;i<5;i++)
  monteCarloStep();  // Perform a single Monte Carlo step for the entire grid

  //if(iter%10==0) playSound();
  
  image(img, 400-30, 440-30, 30, 30);
  
  iter++;
}



// Display the spins visually as colored squares
function displayGrid() {
  let w = width / gridSize;
  
    
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let fac=(currentStateStagg)?(pow(-1,i+j%2)):(1.0); 
      if (grid[i][j]*fac == 1) {
        fill(255, 0, 0);  // Red for spin up
      } else {
        fill(0, 0, 255);  // Blue for spin down
      }
      stroke(0);
      rect(i * w, j * w, w, w);
    }
  }
}

// Perform one Monte Carlo step: loop over the grid and flip spins with Metropolis criteria
function monteCarloStep() {
  for (let n = 0; n < gridSize * gridSize; n++) {
    let i = floor(random(gridSize));
    let j = floor(random(gridSize));
    
    // Energy difference due to flipping the spin
    let dE = 2 * J * grid[i][j] * (
      grid[(i + 1) % gridSize][j] + 
      grid[(i - 1 + gridSize) % gridSize][j] + 
      grid[i][(j + 1) % gridSize] + 
      grid[i][(j - 1 + gridSize) % gridSize]
    );
    
    // Add the contribution from the external magnetic field (h)
    dE += 2 * h * grid[i][j];
    
    // Metropolis criterion: flip the spin if dE <= 0 or based on thermal probability
    if (dE <= 0 || random() < flipProbability(dE, temperature)) {
      grid[i][j] *= -1;  // Flip the spin
      magnetization+= 2*grid[i][j];
    }
  }
}





// Function to flip a spin and its first and second neighbors
function flipNeighbors(i, j) {
  let neighbors = [
    [0, 0],  // Center spin (i, j)
    [-1, 0], [1, 0], [0, -1], [0, 1],  // First neighbors (up, down, left, right)
    [-1, -1], [-1, 1], [1, -1], [1, 1] // Second neighbors (diagonals)
  ];
  
  // Loop through the list of relative neighbor positions
  for (let n = 0; n < neighbors.length; n++) {
    let ni = (i + neighbors[n][0] + gridSize) % gridSize;  // Wrap around for periodic boundary
    let nj = (j + neighbors[n][1] + gridSize) % gridSize;
    grid[ni][nj] *= -1;  // Flip the spin at the neighbor position
  }
}

// When the mouse is dragged, flip the spin at the current mouse position and its neighbors
function mouseDragged() {
  let w = width / gridSize;
  let i = floor(mouseX / w);
  let j = floor(mouseY / w);
  
  // Ensure the drag is within the grid area
  if (i >= 0 && i < gridSize && j >= 0 && j < gridSize) {
    flipNeighbors(i, j);  // Flip the spin at (i, j) and its neighbors
  }
}

// Function to toggle between states
function toggleState() {
  currentState = !currentState;  // Switch the state
  J*=-1;
}

// Function to toggle between states
function toggleStateStagg() {
  currentStateStagg = !currentStateStagg;  // Switch the state
}


//Experimental...
function playSound(){
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if(grid[i][j]==1)
      {
        oscilators[i][j].amp(1);  // Fade out the sound over 0.5 seconds
        oscilators[i][j].start();    // Stop after fading out          
      }
    }
  }
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if(grid[i][j]==1)
      {
        oscilators[i][j].stop(1);    // Stop after fading out          
        oscilators[i][j].amp(0);  // Fade out the sound over 0.5 seconds
      }
    }
  }  
}
