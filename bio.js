/* Biorhythm calculator 
 * Copyright (c) 2010 Elvis Pfutzenreuter
 * All rights reserved.
 */

var storage_list = ['#byear', '#bmonth', '#bday', '#bhour', '#bspan'];
var colors = ["#008000", "#FF0000", "#0000ff", "#ff8000"];
var periods = [23, 28, 33, 0];
var labels = ["Physical", "Emotional", "Intellectual", "Total"];
var storage = null;
var ulock = 0;
var s_basedate = null;
var basedate;

var storage = require("electron-json-storage");

// http://stackoverflow.com/questions/439463/how-to-get-get-and-post-variables-with-jquery
function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}

var GET = getQueryParams(document.location.search);

function generate_data(birth, span)
{
	var days = basedate.getTime() - birth.getTime();
	days /= 1000;
	days /= 86400;
	console.log("Birth: " + birth);
	console.log("Base date: " + basedate);
	console.log("Number of days: " + days);

	var graph_data = [];
	var lines = [];

	for(var ti = 0; ti < 4; ++ti) {
		var line = [];
		graph_data.push({"color": colors[ti],
				"data": line});
		lines.push(line);
		// We add data to "line" afterwards.
	}

	for(var i = -span; i <= span; i += 0.5) {
		var tot = 0;
		for (var j = 0; j < 3; ++j) {
			var x = i + days;
			h = Math.sin(2.0 * Math.PI * x / periods[j]);
			tot += h;
			lines[j].push([i, h]);
		}
		lines[3].push([i, tot / 3]);

		if (i === 0 || ((i % 7 === 0) && (span <= 22))) {
			line = [[i, -1.05], [i, +1.05]];
			graph_data.push({"color": "#303030",
					"label": "",
					"data": line});
		}
	}

	line = [[-span, 0], [+span, 0]];
	graph_data.push({"color": "#303030",
			"label": "",
			"data": line});

	return graph_data;
}

function format_x(val)
{
	if ((val % 7) !== 0) {
		return "";
	}
	var d = new Date(basedate);
	var s = "";
	d.setDate(d.getDate() + val);
	if (val == 0 && s_basedate === null) {
		s = "Now";
	} else {
		s = "" + (d.getMonth() + 1) + "/" + d.getDate();
	}
	return s;
}


function plot_graph(data, span)
{
	$('#graph').html("");

	if (data.length <= 0) {
		return;
	}

	if (span <= 22) {
		ts = 1;
	} else {
		ts = 7;
	}

	var cfg = {grid: { hoverable: true, autoHighlight: false },
		   yaxis: {min: -1.05, max: +1.05, tickFormatter: function(){return "";}},
		   xaxis: {tickSize: ts, tickFormatter: format_x, alignTicksWithAxis: 1}
			};

	var p = $.plot($("#graph"), data, cfg);
	p.getData()[0].lines.lineWidth = 4;
	p.getData()[1].lines.lineWidth = 4;
	p.getData()[2].lines.lineWidth = 4;
	p.getData()[3].lines.lineWidth = 4;
	// series: { lines: {show: true, lineWidth: 5}, shadowSize: 0 }
	p.draw();
}

function window_resized()
{
	$('#graph').html("");
	proportional_height('#graph', 16.0/10.0, 16.0/10.0, 27.0/9.0);
	update();
}

basedate_now = function ()
{
	s_basedate = null;
	update();
}

update_urls = function()
{
	var url = "https://epxx.co/ctb/bio.html?";
	url += "y=" + $('#byear').val();
	url += "&m=" + $('#bmonth').val();
	url += "&d=" + $('#bday').val();
	url += "&h=" + $('#bhour').val();
	url += "&s=" + $('#bspan').val();
	url += "&e=" + basedate.getTime();

	$('#shared').attr('href', url);
	$('#shared').html(url);
	$('#shared2').attr('href', url);

	if (s_basedate === null) {
		sdate = "Now";
		$('#basedatebutton').hide();
	} else {
		sdate = "" + basedate.getFullYear() + "/" +
				(basedate.getMonth() + 1) + "/" + 
				basedate.getDate() + " " + 
				basedate.getHours() + ":00";
		$('#basedatebutton').show();
	}

	$('#basedate').html(sdate);
}

read_storage = function(engine)
{
	storage.get("bio1", function (error, contents) {
		if (! contents) {
			contents = {"blist": []};
		}
		data = contents["blist"];

		if (data.length < storage_list.length) {
			console.log("data length " + data.length);
			update();
			return;
		}
	
		++ulock;
	
		for(var i = 0; i < storage_list.length; ++i) {
			$(storage_list[i]).val(data[i]);
		}
	
		--ulock;
	
		update();
	});
};

write_storage = function()
{
	var data = [];

	for (var i = 0; i < storage_list.length; ++i) {
		var s = storage_list[i];
		data.push($(s).val());
	}

	storage.set("bio1", {"blist": data}, function (error) {
		if (error) {
			console.log("Error setting data " + error);
		}
	});
};

read_get_data = function(in_year, in_month, in_day, in_hour, in_span, in_epoch)
{
	++ulock;

	var data = [in_year, in_month, in_day, in_hour, in_span];
	for(var i = 0; i < storage_list.length; ++i) {
		$(storage_list[i]).val(data[i]);
	}

	if (in_epoch > 0) {
		s_basedate = new Date();
		s_basedate.setTime(in_epoch);
	} else {
		s_basedate = null;
	}

	--ulock;

	update();
}

function populate_controls()
{
	var o = $("#byear").get(0);
	var i = 0;
	var d = new Date(); // ok
	var y = d.getFullYear();
	var j;
	for (j = y - 150; j <= y; ++j) {
            o.options[i++] = new Option(j, j);
        }
	$("#byear").val(1970);

	o = $("#bmonth").get(0);
	i = 0;
	for (j = 1; j <= 12; ++j) {
            o.options[i++] = new Option(j, j);
        }

	o = $("#bday").get(0);
	i = 0;
	for (j = 1; j <= 31; ++j) {
            o.options[i++] = new Option(j, j);
        }

	o = $("#bhour").get(0);
	i = 0;
	for (j = 0; j <= 23; ++j) {
            o.options[i++] = new Option(j, j);
        }

	o = $("#bspan").get(0);
	i = 0;
        o.options[i++] = new Option("Four weeks (two previous, two next)", 15);
        o.options[i++] = new Option("Six weeks (three previous, three next)", 22);
        o.options[i++] = new Option("Two months (one previous, one next)", 30);
}


$(document).ready(function() {
	++ulock;

	populate_controls();
	window_resized();

	--ulock;

	window.onresize = window_resized;

	var in_ok = 1;
	var in_year = 0;
	var in_month = 0;
	var in_day = 0;
	var in_hour = -1;
	var in_span = 0;
	var in_epoch = 0;

	if ("y" in GET && "m" in GET && "d" in GET && "h" in GET && "s" in GET && "e" in GET) {
		in_year = GET["y"];
		in_month = GET["m"];
		in_day = GET["d"];
		in_hour = GET["h"];
		in_span = GET["s"];
		in_epoch = GET["e"];
	} else {
		in_ok = 0;
	}

	if (in_ok) {
		// data via GET parameters
		read_get_data(in_year, in_month, in_day, in_hour, in_span, in_epoch);
		return;
	}

	$("#byear").change(changed_data);
	$("#bmonth").change(changed_data);
	$("#bday").change(changed_data);
	$("#bhour").change(changed_data);
	$("#bspan").change(changed_data);

	read_storage();
});

function changed_data()
{
	update();
}

/* Biorhythm calculator 
 * Copyright (c) 2010 Elvis Pfutzenreuter
 * All rights reserved.
 */

function fix_date()
{
	var y = $("#byear").val();
	var m = $("#bmonth").val();
	var d = $("#bday").val();
	var h = $("#bhour").val();

	var o = new Date(y, m - 1, d, h, 0, 0, 0); // ok

	if (y != o.getFullYear() || m != (o.getMonth() + 1) ||
	    d != o.getDate() || h != o.getHours()) {
		$("#byear").val(o.getFullYear());
		$("#bmonth").val(o.getMonth() + 1);
		$("#bday").val(o.getDate());
		$("#bhour").val(o.getHours());
	}

	return o;
}

update = function()
{
	if (ulock > 0) {
		return true;
	}

	++ulock;

	var span = $("#bspan").val();
	var birth = fix_date();

	if (s_basedate === null) {
		basedate = new Date();
	} else {
		basedate = new Date(s_basedate);
	}

	data = generate_data(birth, span);
	plot_graph(data, span);

	--ulock;

	update_urls();
	write_storage();

	return true;
};

/* Biorhythm calculator 
 * Copyright (c) 2010 Elvis Pfutzenreuter
 * All rights reserved.
 */

