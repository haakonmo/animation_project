// Based on http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf
/**
 * Copyright (c) 2009 Oliver Hunt <http://nerget.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

// Helper functions
function make_grid(xs, ys, fn)
{
	var out = []
	for (var x = 0; x < xs; x++) { out[x]    = []
	for (var y = 0; y < ys; y++) { out[x][y] = fn()
	} }
	return out
}

function copy_grid(src)
{
	var xs  = src.length
	var ys  = src[0].length
	var out = []
	for (var x = 0; x < xs; x++) { out[x]    = []
	for (var y = 0; y < ys; y++) { out[x][y] = src[x][y]
	} }
	return out
}

function copy_gridv(src)
{
	var xs  = src.length
	var ys  = src[0].length
	var is  = src[0][0].length
	var out = []
	for (var x = 0; x < xs; x++) { out[x]       = []
	for (var y = 0; y < ys; y++) { out[x][y]    = []
	for (var i = 0; i < is; i++) { out[x][y][i] = src[x][y][i]
	} } }
	return out
}

// Fluid class
Fluid = function(xs, ys, visc, dt)
{

	this.dt   = dt
	this.visc = visc
	this.dens = make_grid(xs, ys, function(){ return  0 })
	this.vel  = make_grid(xs, ys, function(){ return [0,0] })

}

// Density Equations
Fluid.prototype.add_source = function(dst, src, dt)
{
	var xs = src.length
	var ys = src[0].length

	for (var x = 0; x < xs; x++)
	for (var y = 0; y < ys; y++)
		dst[x][y] += src[x][y] * dt
}

Fluid.prototype.diffuse = function(dst, src, dt)
{
	var it = 10
	var xs = src.length
	var ys = src[0].length

	var a  = dt * xs * ys

	for (var n = 0; n < it; n++) {
		for (var x = 1; x < xs-1; x++)
		for (var y = 1; y < ys-1; y++) {
			dst[x][y] = (src[x][y] +
				a*(dst[x-1][y  ]+dst[x+1][y  ]+
				   dst[x  ][y-1]+dst[x  ][y+1]))
				/ (1+4*a)
		}
	}
}

Fluid.prototype.advect = function(dst, src, vel, dt)
{
	var xs = src.length
	var ys = src[0].length

	for (var x = 1; x < xs-1; x++)
	for (var y = 1; y < ys-1; y++) {
		var xc = x - dt*xs * vel[x][y][0]
		var yc = y - dt*ys * vel[x][y][1]

		if (xc < 0.5)
			xc = 0.5
		else if (xc > xs+0.5)
			xc = xs+0.5
		var x0 = xc | 0
		var x1 = x0 + 1
		var s1 = xc - x0
		var s0 = 1  - s1

		if (yc < 0.5)
			yc = 0.5
		else if (yc > ys+0.5)
			yc = ys+0.5
		var y0 = yc | 0
		var y1 = y0 + 1
		var t1 = yc - y0
		var t0 = 1  - t1

		dst[x][y] =
			s0 * (t0 * src[x0][y0] + t1 * src[x0][y1]) +
			s1 * (t0 * src[x1][y0] + t1 * src[x1][y1])
	}
}

Fluid.prototype.dens_step = function(dst, src, vel, dt)
{
	this.add_source(dst, src, dt)
	this.diffuse(src, dst, dt); // ????
	this.advect(dst, src, vel, dt)
}

// Velocity equations
Fluid.prototype.add_sourcev = function(dst, src, dt)
{
	var xs = src.length
	var ys = src[0].length
	var is = src[0][0].length
	//alert(xs +'x'+ ys +'x'+ is)

	for (var x = 0; x < xs; x++)
	for (var y = 0; y < ys; y++)
	for (var i = 0; i < ys; i++)
		dst[x][y][i] += src[x][y][i] * dt
}

Fluid.prototype.diffusev = function(dst, src, dt)
{
	var xs = src.length
	var ys = src[0].length
	var is = src[0][0].length

	for (var x = 0; x < xs; x++)
	for (var y = 0; y < ys; y++)
	for (var i = 0; i < is; i++)
		dst[x][y][i] = src[x][y][i]
}

Fluid.prototype.advectv = function(dst, src, vel, dt)
{
	var xs = src.length
	var ys = src[0].length
	var is = src[0][0].length

	for (var x = 1; x < xs-1; x++)
	for (var y = 1; y < ys-1; y++)
	for (var i = 0; i < is; i++) {
		var xc = x - dt*(xs-2) * vel[x][y][0]
		var yc = y - dt*(ys-2) * vel[x][y][1]

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

Fluid.prototype.projectv = function(dst, src)
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

Fluid.prototype.vel_step = function(dst, src, dt)
{
	//this.add_sourcev(dst, src, dt)

	this.diffusev(src, dst, dt)
	this.projectv(src, dst)

	//alert('x='+dst[1][1][0]+', y='+dst[1][1][1])
	//alert('x='+src[1][1][0]+', y='+src[1][1][1])

	this.advectv(dst, src, src, dt)
	this.projectv(dst, src)

	//var xs = src.length
	//var ys = src[0].length
	//var is = src[0][0].length
	//for (var x = 0; x < xs; x++)
	//for (var y = 0; y < ys; y++)
	//for (var i = 0; i < is; i++)
	//	dst[x][y][i] = src[x][y][i]
}

Fluid.prototype.step = function()
{
	var xs = this.vel.length
	var ys = this.vel[0].length

	var prev_dens = make_grid(xs, ys, function(){ return  0.0 })
	var prev_vel  = make_grid(xs, ys, function(){ return [0.0,0.0] })

	this.vel_step(this.vel, prev_vel, this.dt)
	this.dens_step(this.dens, prev_dens, this.vel, this.dt)
	//this.display(new Field(dens, u, v))
}
