// These are kind of just guesses for the API at the moment
// Hopefully they work well enough to get started

// Voxel object
CS274C.Voxel = function() {
	this.vel  = [0, 0, 0]
	this.mass = 0
}

// Fluid Dynamics Object
CS274C.Fluid = function(gridSize) {
	// Check arguments
	if (gridSize == undefined)
		gridSize = [10, 10, 10]

	// Set parameters
	this.gridSize = gridSize
	this.grid     = []
	
	// Allocate grid
	for (var x = 0; x < this.gridSize[0]; x++) {
		this.grid[x] = []
		for (var y = 0; y < this.gridSize[1]; y++) {
			this.grid[x][y] = []
			for (var z = 0; z < this.gridSize[2]; z++) {
				this.grid[x][y][z] = new CS274C.Voxel()
			}
		}
	}
}

// Run the dynamics system to the next time step
CS274C.Fluid.prototype.step = function() {
}

// Move a set of points based on the fluid systems velocity field
CS274C.Fluid.prototype.move = function(points) {
	for (var i = 0; i < points.length; i++) {
		points[i].y += Math.random() * 7;
		points[i].x += Math.random() * 10 - 5;
		points[i].z += Math.random() * 10 - 5;
	}
}

// Modify the fluid mass at some point in the fluid
//    - e.g. adding heat will reduce mass
CS274C.Fluid.prototype.addMass = function(x, y, z, mass) {
	this.grid[x][y][z].mass += mass;
}

// Apply a force to the velocity field
//    - e.g. adding heat will reduce mass
CS274C.Fluid.prototype.addForce = function(x, y, z, vel) {
	for (var i = 0; i < 3; i++)
		this.grid[x][y][z].vel[i] += vel[i];
}
