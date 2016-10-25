window.$ = window.jQuery = require('./jquery');

/* calculates a suitable height for CSS-calculated width element */
function proportional_height(id, def, tallest, flattest)
{
	def = def || (16.0 / 8.0);
	tallest = tallest || (16.0 / 8.0);
	flattest = flattest || (27.0 / 9.0);

	var gw = $(id).width();
	var proportion = def;

	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	if (w > 0 && h > 0) {
		proportion = w /  h;
		// do not let it go taller than a certain point
		proportion = Math.max(tallest, proportion);
		// do not let it go flatter than a certain point
		proportion = Math.min(flattest, proportion);
	}

	$(id).height(gw / proportion);
}
