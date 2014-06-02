// These are kind of just guesses for the API at the moment
// Hopefully they work well enough to get started

// Helper functions
function make_grid(xs, ys, fn)
{
	var out = []
	for (var x = 0; x < xs; x++) { out[x]    = []
	for (var y = 0; y < ys; y++) { out[x][y] = fn()
	} }
	return out
}

/****************
 * Voxel object *
 ****************/
CS274C.Voxel = function() {
	this.vel  = [0, 0, 0]
	this.mass = 0
}

/*************************
 * Fluid Dynamics Object *
 *************************/
CS274C.Fluid = function(size, scale, offset) {
	// Testing
	this.vel = make_grid(size[0], size[1],
			function(){ return [0,0] })

	var xs = this.vel.length
	var ys = this.vel[0].length

	// Testing
	//this.vel[Math.floor(xs/2)-1][1][1] = 5
	//this.vel[Math.floor(xs/2)  ][1][1] = 5
	//this.vel[Math.floor(xs/2)+1][1][1] = 5
	//this.vel[Math.floor(xs/2)-1][2][1] = 5
	//this.vel[Math.floor(xs/2)  ][2][1] = 5
	//this.vel[Math.floor(xs/2)+1][2][1] = 5

	// Set parameters
	this.size   = size
	this.scale  = scale
	this.offset = offset
	this.grid   = []

	// Allocate grid
	for (var x = 0; x < this.size[0]; x++) {
		this.grid[x] = []
		for (var y = 0; y < this.size[1]; y++) {
			this.grid[x][y] = []
			for (var z = 0; z < this.size[2]; z++) {
				this.grid[x][y][z] = new CS274C.Voxel()
			}
		}
	}
}

// Run the dynamics system to the next time step
CS274C.Fluid.prototype.step = function(dt) {
	var xs = this.vel.length
	var ys = this.vel[0].length

	var prev_vel = make_grid(xs, ys, function(){ return [0.0,0.0] })

	// Testing
	//this.vel[Math.floor(xs/2)-1][1][1] = 1
	//this.vel[Math.floor(xs/2)  ][1][1] = 1
	//this.vel[Math.floor(xs/2)+1][1][1] = 1

	//this.vel[0][0][1] += dt
	//this.vel[1][1][1] += dt
	//this.vel[2][2][1] += dt

	this.vel_step(this.vel, prev_vel, dt)
}

// Move a set of points based on the fluid systems velocity field
CS274C.Fluid.prototype.move = function(dt, points) {
	// Brownian motion
	for (var i = 0; i < points.length; i++) {
		points[i].x += (Math.random()-0.5) * 0.5 * dt
		points[i].y += (Math.random()-0.5) * 0.5 * dt
		points[i].z += (Math.random()-0.5) * 0.5 * dt
	}

	// Fluid motion
	for (var i = 0; i < points.length; i++) {
		var xs  = this.vel.length
		var ys  = this.vel[0].length

		//alert('x='+points[i].x+' y='+points[i].y)

		// Linear interp
		var xc  = ((points[i].x - this.offset[0]) / this.scale[0])
		var yc  = ((points[i].z - this.offset[2]) / this.scale[2])

		var x0  = Math.floor(xc)
		var y0  = Math.floor(yc)
		var x1  = x0 + 1
		var y1  = y0 + 1

		var v00 = this.vel[x0][y0]
		var v01 = this.vel[x0][y1]
		var v10 = this.vel[x1][y0]
		var v11 = this.vel[x1][y1]

		var xsf = x1 - xc
		var ysf = y1 - yc

		var vel = [
			v00[0]*(  xsf)*(  ysf) +
			v01[0]*(  xsf)*(1-ysf) +
			v10[0]*(1-xsf)*(  ysf) +
			v11[0]*(1-xsf)*(1-ysf),

			v00[1]*(  xsf)*(  ysf) +
			v01[1]*(  xsf)*(1-ysf) +
			v10[1]*(1-xsf)*(  ysf) +
			v11[1]*(1-xsf)*(1-ysf),
		]

		//alert('xy0='+xc+','+yc+' vel0='+vel[0]*dt+','+vel[1]*dt)

		points[i].x += vel[0] * dt * this.scale[0]
		points[i].z += vel[1] * dt * this.scale[2]
	}
	//alert("pause")
}

// Modify the fluid mass at some point in the fluid
//    - e.g. adding heat will reduce mass
CS274C.Fluid.prototype.addMass = function(x, y, z, mass) {
	this.grid[x][y][z].mass += mass
}

// Apply a force to the velocity field
//    - e.g. adding heat will reduce mass
CS274C.Fluid.prototype.addForce = function(x, y, z, vel) {
	//for (var i = 0; i < 3; i++)
	//	this.grid[x][y][z].vel[i] += vel[i]

	//alert('of=' + this.offset);
	//alert('sf=' + this.scale);

	var xc = ((x - this.offset[0]) / this.scale[0])
	var yc = ((z - this.offset[2]) / this.scale[2])

	var x0  = Math.floor(xc)
	var y0  = Math.floor(yc)
	var x1  = x0 + 1
	var y1  = y0 + 1

	var xsf = x1 - xc
	var ysf = y1 - yc

	this.vel[x0][y0][0] += vel[0]*(  xsf)*(  ysf)
	this.vel[x0][y1][0] += vel[0]*(  xsf)*(1-ysf)
	this.vel[x1][y0][0] += vel[0]*(1-xsf)*(  ysf)
	this.vel[x1][y1][0] += vel[0]*(1-xsf)*(1-ysf)

	this.vel[x0][y0][1] += vel[2]*(  xsf)*(  ysf)
	this.vel[x0][y1][1] += vel[2]*(  xsf)*(1-ysf)
	this.vel[x1][y0][1] += vel[2]*(1-xsf)*(  ysf)
	this.vel[x1][y1][1] += vel[2]*(1-xsf)*(1-ysf)
}

// Get velocity field
CS274C.Fluid.prototype.getVelocity = function() {
	return this.vel
}

/**********************
 * Dynamics Functions *
 **********************/
// Velocity equations
CS274C.Fluid.prototype.vel_diffuse = function(dst, src, dt)
{
	var xs = src.length
	var ys = src[0].length
	var is = src[0][0].length

	for (var x = 0; x < xs; x++)
	for (var y = 0; y < ys; y++)
	for (var i = 0; i < is; i++)
		dst[x][y][i] = src[x][y][i]
}

CS274C.Fluid.prototype.vel_advect = function(dst, src, vel, dt)
{
	var xs = src.length
	var ys = src[0].length
	var is = src[0][0].length

	//dt = 0.001

	for (var x = 1; x < xs-1; x++)
	for (var y = 1; y < ys-1; y++)
	for (var i = 0; i < is; i++) {
		//var xc = x - dt*(xs-2) * vel[x][y][0]
		//var yc = y - dt*(ys-2) * vel[x][y][1]
		var xc = x - dt/this.scale[0] * vel[x][y][0]
		var yc = y - dt/this.scale[2] * vel[x][y][1]

		if (xc < 0.5)
			xc = 0.5
		else if (xc > (xs-2)+0.5)
			xc = (xs-2)+0.5
		var x0 = xc | 0
		var x1 = x0 + 1

		if (yc < 0.5)
			yc = 0.5
		else if (yc > (ys-2)+0.5)
			yc = (ys-2)+0.5
		var y0 = yc | 0
		var y1 = y0 + 1

		var s1 = xc - x0
		var s0 = 1  - s1
		var t1 = yc - y0
		var t0 = 1  - t1

		dst[x][y][i] =
			s0 * (t0 * src[x0][y0][i] + t1 * src[x0][y1][i]) +
			s1 * (t0 * src[x1][y0][i] + t1 * src[x1][y1][i])
	}
}

CS274C.Fluid.prototype.vel_project = function(dst, src)
{
	var xs = src.length
	var ys = src[0].length

	for (var x = 1; x < xs-1; x++)
	for (var y = 1; y < ys-1; y++) {
		src[x][y][0] =  0
		src[x][y][1] = -0.5 * (1/(xs-2)) *
			(dst[x+1][y  ][0] - dst[x-1][y  ][0] +
			 dst[x  ][y+1][1] - dst[x  ][y-1][1])
	}

	for (var n = 0; n < 10; n++) {
		for (var x = 1; x < xs-1; x++)
		for (var y = 1; y < ys-1; y++) {
			src[x][y][0] = (1/4) *
				(src[x  ][y  ][1] +
				 src[x-1][y  ][0] +
				 src[x+1][y  ][0] +
				 src[x  ][y-1][0] +
				 src[x  ][y+1][0])
		}
	}

	for (var x = 1; x < xs-1; x++)
	for (var y = 1; y < ys-1; y++) {
		dst[x][y][0] -= 0.5 * (xs-2) *
			(src[x+1][y  ][0] -
			 src[x-1][y  ][0])
		dst[x][y][1] -= 0.5 * (xs-2) *
			(src[x  ][y+1][0] -
			 src[x  ][y-1][0])
	}
}

CS274C.Fluid.prototype.vel_step = function(dst, src, dt)
{
	//dt = 0.001
	//console.log(dt)

	this.vel_diffuse(src, dst, dt)
	this.vel_project(src, dst)

	this.vel_advect(dst, src, src, dt)
	this.vel_project(dst, src)
}
