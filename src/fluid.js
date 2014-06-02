// These are kind of just guesses for the API at the moment
// Hopefully they work well enough to get started

// Helper functions
function make_grid(size, is)
{
	var out = []
	for (var x = 0; x < size[0]; x++) { out[x]          = []
	for (var y = 0; y < size[1]; y++) { out[x][y]       = []
	for (var z = 0; z < size[2]; z++) { out[x][y][z]    = []
	for (var i = 0; i < is;      i++) { out[x][y][z][i] = 0
	} } } }
	return out
}

/*************************
 * Fluid Dynamics Object *
 *************************/
CS274C.Fluid = function(size, scale, offset) {
	// Testing
	// Set parameters
	this.xs     = size[0]
	this.ys     = size[1]
	this.zs     = size[2]
	this.is     = size.length
	this.size   = size
	this.scale  = scale
	this.offset = offset
	this.vel    = make_grid(this.size, this.is)

	// Testing
	//this.vel[Math.floor(this.xs/2)-1][1][1] = 5
	//this.vel[Math.floor(this.xs/2)  ][1][1] = 5
	//this.vel[Math.floor(this.xs/2)+1][1][1] = 5
	//this.vel[Math.floor(this.xs/2)-1][2][1] = 5
	//this.vel[Math.floor(this.xs/2)  ][2][1] = 5
	//this.vel[Math.floor(this.xs/2)+1][2][1] = 5
}

// Run the dynamics system to the next time step
CS274C.Fluid.prototype.step = function(dt) {
	var prev_vel = make_grid(this.size, this.is)

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
	for (var p = 0; p < points.length; p++) {
		points[p].x += (Math.random()-0.5) * 1 * dt
		points[p].y += (Math.random()-0.5) * 1 * dt
		points[p].z += (Math.random()-0.5) * 1 * dt
	}

	// Fluid motion
	for (var p = 0; p < points.length; p++) {
		// Linear interp
		var xc  = ((points[p].x - this.offset[0]) / this.scale[0])
		var yc  = ((points[p].y - this.offset[1]) / this.scale[1])
		var zc  = ((points[p].z - this.offset[2]) / this.scale[2])

		var x0  = Math.floor(xc)
		var y0  = Math.floor(yc)
		var z0  = Math.floor(zc)

		var x1  = x0 + 1
		var y1  = y0 + 1
		var z1  = z0 + 1

		var xsf = x1 - xc
		var ysf = y1 - yc
		var zsf = z1 - zc

		var v000 = this.vel[x0][y0][z0]
		var v001 = this.vel[x0][y0][z1]
		var v010 = this.vel[x0][y1][z0]
		var v011 = this.vel[x0][y1][z1]
		var v100 = this.vel[x1][y0][z0]
		var v101 = this.vel[x1][y0][z1]
		var v110 = this.vel[x1][y1][z0]
		var v111 = this.vel[x1][y1][z1]

		var vel = []
		for (var i = 0; i < this.is; i++) {
			vel[i] = v000[i]*(  xsf)*(  ysf)*(  zsf) +
			         v001[i]*(  xsf)*(  ysf)*(1-zsf) +
			         v010[i]*(  xsf)*(1-ysf)*(  zsf) +
			         v011[i]*(  xsf)*(1-ysf)*(1-zsf) +
			         v100[i]*(1-xsf)*(  ysf)*(  zsf) +
			         v101[i]*(1-xsf)*(  ysf)*(1-zsf) +
			         v110[i]*(1-xsf)*(1-ysf)*(  zsf) +
			         v111[i]*(1-xsf)*(1-ysf)*(1-zsf);
		}

		//alert('xyz0='+xc+','+yc+','+zc+' vel0='+vel[0]*dt+','+vel[1]*dt+','+vel[2]*dt)

		points[p].x += vel[0] * dt * this.scale[0]
		points[p].y += vel[1] * dt * this.scale[1]
		points[p].z += vel[2] * dt * this.scale[2]
	}
	//alert("pause")
}

// Apply a force to the velocity field
//    - e.g. adding heat will reduce mass
CS274C.Fluid.prototype.addForce = function(x, y, z, vel) {
	//alert('of=' + this.offset);
	//alert('sf=' + this.scale);

	var xc = ((x - this.offset[0]) / this.scale[0])
	var yc = ((y - this.offset[1]) / this.scale[1])
	var zc = ((z - this.offset[2]) / this.scale[2])

	var x0  = Math.floor(xc)
	var y0  = Math.floor(yc)
	var z0  = Math.floor(zc)

	var x1  = x0 + 1
	var y1  = y0 + 1
	var z1  = z0 + 1

	var xsf = x1 - xc
	var ysf = y1 - yc
	var zsf = z1 - zc

	for (var i = 0; i < this.is; i++) {
		this.vel[x0][y0][z0][i] += vel[i]*(  xsf)*(  ysf)*(  zsf)
		this.vel[x0][y0][z1][i] += vel[i]*(  xsf)*(  ysf)*(1-zsf)
		this.vel[x0][y1][z0][i] += vel[i]*(  xsf)*(1-ysf)*(  zsf)
		this.vel[x0][y1][z1][i] += vel[i]*(  xsf)*(1-ysf)*(1-zsf)
		this.vel[x1][y0][z0][i] += vel[i]*(1-xsf)*(  ysf)*(  zsf)
		this.vel[x1][y0][z1][i] += vel[i]*(1-xsf)*(  ysf)*(1-zsf)
		this.vel[x1][y1][z0][i] += vel[i]*(1-xsf)*(1-ysf)*(  zsf)
		this.vel[x1][y1][z1][i] += vel[i]*(1-xsf)*(1-ysf)*(1-zsf)
	}
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
	for (var x = 0; x < this.xs; x++)
	for (var y = 0; y < this.ys; y++)
	for (var z = 0; z < this.zs; z++)
	for (var i = 0; i < this.is; i++)
		dst[x][y][z][i] = src[x][y][z][i]
}

CS274C.Fluid.prototype.vel_advect = function(dst, src, vel, dt)
{
	for (var x = 1; x < this.xs-1; x++)
	for (var y = 1; y < this.ys-1; y++)
	for (var z = 1; z < this.zs-1; z++)
	for (var i = 0; i < this.is; i++) {
		//var xc = x - dt*(xs-2) * vel[x][y][z][0]
		//var yc = y - dt*(ys-2) * vel[x][y][z][1]
		//var zc = z - dt*(zs-2) * vel[x][y][z][2]

		var xc = x - dt/this.scale[0] * vel[x][y][z][0]
		var yc = y - dt/this.scale[1] * vel[x][y][z][1]
		var zc = z - dt/this.scale[2] * vel[x][y][z][2]

		if (xc < 0.5)
			xc = 0.5
		else if (xc > (this.xs-2)+0.5)
			xc = (this.xs-2)+0.5
		var x0 = xc | 0
		var x1 = x0 + 1

		if (yc < 0.5)
			yc = 0.5
		else if (yc > (this.ys-2)+0.5)
			yc = (this.ys-2)+0.5
		var y0 = yc | 0
		var y1 = y0 + 1

		if (zc < 0.5)
			zc = 0.5
		else if (zc > (this.zs-2)+0.5)
			zc = (this.zs-2)+0.5
		var z0 = zc | 0
		var z1 = z0 + 1

		var s1 = xc - x0
		var s0 = 1  - s1
		var t1 = yc - y0
		var t0 = 1  - t1
		var u1 = zc - z0
		var u0 = 1  - u1

		dst[x][y][z][i] =
			s0 * (t0 * (u0 * src[x0][y0][z0][i]   +
			            u1 * src[x0][y0][z1][i])  +
			      t1 * (u0 * src[x0][y1][z0][i]   +
			            u1 * src[x0][y1][z1][i])) +
			s1 * (t0 * (u0 * src[x1][y0][z0][i]   +
			            u1 * src[x1][y0][z1][i])  +
			      t1 * (u0 * src[x1][y1][z0][i]   +
			            u1 * src[x1][y1][z1][i]))
	}
}

CS274C.Fluid.prototype.vel_project = function(dst, src)
{
	var n = this.xs-2;

	for (var x = 1; x < this.xs-1; x++)
	for (var y = 1; y < this.ys-1; y++)
	for (var z = 1; z < this.zs-1; z++) {
		src[x][y][z][0] =  0
		src[x][y][z][1] = -0.5 * (1/n) *
			(dst[x+1][y  ][z  ][0] -
			 dst[x-1][y  ][z  ][0] +
			 dst[x  ][y+1][z  ][1] -
			 dst[x  ][y-1][z  ][1] +
			 dst[x  ][y  ][z+1][2] -
			 dst[x  ][y  ][z-1][2])
	}

	for (var n = 0; n < 10; n++) {
		for (var x = 1; x < this.xs-1; x++)
		for (var y = 1; y < this.ys-1; y++)
		for (var z = 1; z < this.zs-1; z++) {
			src[x][y][z][0] = (1/6) *
				(src[x  ][y  ][z  ][1] +
				 src[x-1][y  ][z  ][0] +
				 src[x+1][y  ][z  ][0] +
				 src[x  ][y-1][z  ][0] +
				 src[x  ][y+1][z  ][0] +
				 src[x  ][y  ][z-1][0] +
				 src[x  ][y  ][z+1][0])
		}
	}

	for (var x = 1; x < this.xs-1; x++)
	for (var y = 1; y < this.ys-1; y++)
	for (var z = 1; z < this.zs-1; z++) {
		dst[x][y][z][0] -= 0.5 * n *
			(src[x+1][y  ][z  ][0] -
			 src[x-1][y  ][z  ][0])
		dst[x][y][z][1] -= 0.5 * n *
			(src[x  ][y+1][z  ][0] -
			 src[x  ][y-1][z  ][0])
		dst[x][y][z][2] -= 0.5 * n *
			(src[x  ][y  ][z+1][0] -
			 src[x  ][y  ][z-1][0])
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
