// Helper functions
Grid = function(xs, ys, fn)
{
	this.fn   = fn
	this.xs   = xs
	this.ys   = ys
	this.data = ys

	for (var x = 0; x < xs; x++) {
		this[x] = []
		for (var y = 0; y < ys; y++) {
			this[x][y] = fn()
		}
	}
	return this
}

Grid.prototype.clone = function() {
	var out = new Grid(this.xs, this.ys, this.fn);
	for (var x = 0; x < xs; x++)
	for (var y = 0; y < ys; y++)
		out[x][y] = this[x][y]
	return out
}
