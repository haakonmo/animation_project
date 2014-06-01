			function dens(context, dens, x, y) {
				var r = Math.floor((1-dens)*256)
				var g = Math.floor((1-dens)*256)
				var b = Math.floor((1-dens)*256)

				context.fillStyle = 'rgb('+r+','+g+','+b+')'
				context.beginPath()
				context.rect(x-0.5, y-0.5, 1, 1);
				context.fill()
			}

			function vect(context, vel, x, y) {
				context.lineWidth   = 0.1
				context.fillStyle   = '#0000FF'
				context.strokeStyle = '#0000FF'

				// Draw base
				context.beginPath()
				context.arc(x, y, 0.1, 0, 2*Math.PI);
				context.fill()

				// Draw barb
				context.beginPath()
				context.moveTo(x,        y);
				context.lineTo(x+vel[0], y+vel[1]);
				context.stroke()
			}

			function draw(fluid) {
				var canvas  = document.getElementById('fluid')
				var context = canvas.getContext('2d')
				var width   = canvas.width
				var height  = canvas.height

				// Clear background
				context.setTransform(1, 0, 0, 1, 0, 0)
				context.strokeStyle = '#000000'
				context.fillStyle   = '#E0E0E0'
				context.rect(0, 0, width, height)
				context.fill()
				context.stroke()

				// Setup scaling
				var xs  = fluid.vel.length;
				var ys  = fluid.vel[0].length;
				var xsf = width  / (xs+1);
				var ysf = height / (ys+1);
				context.scale(xsf, ysf)
				context.translate(1, 1)

				// Draw density field
				for (var x = 0; x < xs; x++)
				for (var y = 0; y < ys; y++)
					dens(context, fluid.dens[x][y], x, y)

				// Draw velocity field
				for (var x = 0; x < xs; x++)
				for (var y = 0; y < ys; y++)
					vect(context, fluid.vel[x][y], x, y)
			}
