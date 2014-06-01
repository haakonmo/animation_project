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

function FluidField(canvas) {
	function addFields(x, s, dt)
	{
		for (var i=0; i<size ; i++ ) x[i] += dt*s[i];
	}

	function lin_solve(x, x0, a, c)
	{
		if (a === 0 && c === 1) {
			for (var j=1 ; j<=height; j++) {
				var currentRow = j * rowSize;
				++currentRow;
				for (var i = 0; i < width; i++) {
					x[currentRow] = x0[currentRow];
					++currentRow;
				}
			}
		} else {
			var invC = 1 / c;
			for (var k=0 ; k<iterations; k++) {
				for (var j=1 ; j<=height; j++) {
					var lastRow = (j - 1) * rowSize;
					var currentRow = j * rowSize;
					var nextRow = (j + 1) * rowSize;
					var lastX = x[currentRow];
					++currentRow;
					for (var i=1; i<=width; i++)
						lastX = x[currentRow] = (x0[currentRow] + a*(lastX+x[++currentRow]+x[++lastRow]+x[++nextRow])) * invC;
				}
			}
		}
	}

	function diffuse(x, x0, dt)
	{
		var a = 0;
		lin_solve(x, x0, a, 1 + 4*a);
	}

	function lin_solve2(x, x0, y, y0, a, c)
	{
		if (a === 0 && c === 1) {
			for (var j=1 ; j <= height; j++) {
				var currentRow = j * rowSize;
				++currentRow;
				for (var i = 0; i < width; i++) {
					x[currentRow] = x0[currentRow];
					y[currentRow] = y0[currentRow];
					++currentRow;
				}
			}
		} else {
			var invC = 1/c;
			for (var k=0 ; k<iterations; k++) {
				for (var j=1 ; j <= height; j++) {
					var lastRow = (j - 1) * rowSize;
					var currentRow = j * rowSize;
					var nextRow = (j + 1) * rowSize;
					var lastX = x[currentRow];
					var lastY = y[currentRow];
					++currentRow;
					for (var i = 1; i <= width; i++) {
						lastX = x[currentRow] = (x0[currentRow] + a * (lastX + x[currentRow] + x[lastRow] + x[nextRow])) * invC;
						lastY = y[currentRow] = (y0[currentRow] + a * (lastY + y[++currentRow] + y[++lastRow] + y[++nextRow])) * invC;
					}
				}
			}
		}
	}

	function diffuse2(x, x0, y, y0, dt)
	{
		var a = 0;
		lin_solve2(x, x0, y, y0, a, 1 + 4 * a);
	}
	function diffusev(dx, dy, sx, sy, dt)
	{
		var xs = width  + 2
		var ys = height + 2

		for (var x = 0; x < xs; x++)
		for (var y = 0; y < ys; y++) {
			dx[x+xs*y] = sx[x+xs*y]
			dy[x+xs*y] = sy[x+xs*y]
		}
	}

	function advect(d, d0, u, v, dt)
	{
		var Wp5 = width + 0.5;
		var Hp5 = height + 0.5;
		for (var x = 1; x <= width; x++)
		for (var y = 1; y <= height; y++) {
			var xc = x - dt * width  * u[x + y*rowSize]; 
			var yc = y - dt * height * v[x + y*rowSize];

			if (xc < 0.5)
				xc = 0.5;
			else if (xc > Wp5)
				xc = Wp5;
			var x0 = xc | 0;
			var x1 = x0 + 1;

			if (yc < 0.5)
				yc = 0.5;
			else if (yc > Hp5)
				yc = Hp5;
			var y0 = yc | 0;
			var y1 = y0 + 1;

			var s1 = xc - x0;
			var s0 = 1  - s1;
			var t1 = yc - y0;
			var t0 = 1  - t1;

			d[x + y*rowSize] =
				s0 * (t0 * d0[x0 + y0*rowSize] + t1 * d0[x0 + y1*rowSize]) +
				s1 * (t0 * d0[x1 + y0*rowSize] + t1 * d0[x1 + y1*rowSize]);
		}
	}

	function advectv(dst, src, vel, dt)
	{
		var xs = src.length
		var ys = src[0].length
		var is = src[0][0].length

		for (var x = 2; x < xs-2; x++)
		for (var y = 2; y < ys-2; y++)
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

	function project(u, v, p, div)
	{
		var h = -0.5 / Math.sqrt(width * height);
		for (var j = 1 ; j <= height; j++ ) {
			var row = j * rowSize;
			var previousRow = (j - 1) * rowSize;
			var prevValue = row - 1;
			var currentRow = row;
			var nextValue = row + 1;
			var nextRow = (j + 1) * rowSize;
			for (var i = 1; i <= width; i++ ) {
				div[++currentRow] = h * (u[++nextValue] - u[++prevValue] + v[++nextRow] - v[++previousRow]);
				p[currentRow] = 0;
			}
		}

		lin_solve(p, div, 1, 4 );
		var wScale = 0.5 * width;
		var hScale = 0.5 * height;
		for (var j = 1; j<= height; j++ ) {
			var prevPos = j * rowSize - 1;
			var currentPos = j * rowSize;
			var nextPos = j * rowSize + 1;
			var prevRow = (j - 1) * rowSize;
			var currentRow = j * rowSize;
			var nextRow = (j + 1) * rowSize;

			for (var i = 1; i<= width; i++) {
				u[++currentPos] -= wScale * (p[++nextPos] - p[++prevPos]);
				v[currentPos]   -= hScale * (p[++nextRow] - p[++prevRow]);
			}
		}
	}

	function dens_step(x, x0, u, v, dt)
	{
		//addFields(x, x0, dt);

		//diffuse(x0, x, dt );
		var xs = width  + 2
		var ys = height + 2
		for (var ix = 0; ix < xs; ix++)
		for (var iy = 0; iy < ys; iy++)
			x0[ix+xs*iy] = x[ix+xs*iy]

		advect(x, x0, u, v, dt );
	}

	function vel_step(u, v, u0, v0, dt)
	{
		//addFields(u, u0, dt );
		//addFields(v, v0, dt );

		diffusev(u0,v0, u,v, dt);
		project(u0,v0, u,v);

		advect(u, u0, u0,v0, dt);
		advect(v, v0, u0,v0, dt);

		project(u,v, u0,v0 );
	}
	var uiCallback = function(d,u,v) {};

	function Field(dens, u, v) {
		// Just exposing the fields here rather than using accessors is a measurable win during display (maybe 5%)
		// but makes the code ugly.
		this.setDensity = function(x, y, d) {
			dens[(x + 1) + (y + 1) * rowSize] = d;
		}
		this.getDensity = function(x, y) {
			return dens[(x + 1) + (y + 1) * rowSize];
		}
		this.setVelocity = function(x, y, xv, yv) {
			u[(x + 1) + (y + 1) * rowSize] = xv;
			v[(x + 1) + (y + 1) * rowSize] = yv;
		}
		this.getXVelocity = function(x, y) {
			return u[(x + 1) + (y + 1) * rowSize];
		}
		this.getYVelocity = function(x, y) {
			return v[(x + 1) + (y + 1) * rowSize];
		}
		this.width = function() { return width; }
		this.height = function() { return height; }
	}
	function queryUI(d, u, v)
	{
		for (var i = 0; i < size; i++)
			u[i] = v[i] = d[i] = 0.0;
		//uiCallback(new Field(d, u, v));
	}

	this.update = function () {
		dens_prev = new Array(size);
		u_prev    = new Array(size);
		v_prev    = new Array(size);
		queryUI(dens_prev, u_prev, v_prev);

		vel_step(u, v, u_prev, v_prev, dt);
		dens_step(dens, dens_prev, u, v, dt);
		displayFunc(new Field(dens, u, v));
	}
	this.setDisplayFunction = function(func) {
		displayFunc = func;
	}

	this.iterations = function() { return iterations; }
	this.setIterations = function(iters) {
		if (iters > 0 && iters <= 100)
			iterations = iters;
	}
	this.setUICallback = function(callback) {
		uiCallback = callback;
	}
	var iterations = 10;
	var visc = 0.5;
	var dt = 0.1;
	var dens;
	var dens_prev;
	var u;
	var u_prev;
	var v;
	var v_prev;
	var width;
	var height;
	var rowSize;
	var size;
	var displayFunc;
	function reset()
	{
		rowSize = width + 2;
		size = (width+2)*(height+2);
		dens = new Array(size);
		dens_prev = new Array(size);
		u = new Array(size);
		u_prev = new Array(size);
		v = new Array(size);
		v_prev = new Array(size);
		for (var i = 0; i < size; i++)
			dens_prev[i] = u_prev[i] = v_prev[i] = dens[i] = u[i] = v[i] = 0;

		var spot = 8
		var xs = Math.floor( width/2-spot/2)
		var ys = Math.floor(height/2-spot/2)/2
		for (var x = xs; x < xs+spot; x++)
			for (var y = ys; y < ys+spot; y++) {
				dens[x+y*rowSize] = 20;
				u   [x+y*rowSize] = 0;
				v   [x+y*rowSize] = 0.5;
			}
	}
	this.reset = reset;
	this.setResolution = function (hRes, wRes)
	{
		var res = wRes * hRes;
		if (res > 0 && res < 1000000 && (wRes != width || hRes != height)) {
			width = wRes;
			height = hRes;
			reset();
			return true;
		}
		return false;
	}
	this.setResolution(32, 32);
}

