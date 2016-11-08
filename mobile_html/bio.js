/* Biorhythm calculator 
 * Copyright (c) 2010 Elvis Pfutzenreuter
 * All rights reserved.
 */

// From http://scotch.io/quick-tips/js/how-to-encode-and-decode-strings-with-base64-in-javascript
// Create Base64 Object
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};


var storage_list = ['#byear', '#bmonth', '#bday', '#bhour', '#bspan', '#bnotif'];
var colors = ["#008000", "#FF0000", "#0000ff", "#ff8000"];
var periods = [23, 28, 33, 0];
var labels = ["Physical", "Emotional", "Intellectual", "Total"];
var ulock = 0;
var s_basedate = null;
var basedate;

function mylog(txt)
{
	console.log(txt);
}

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

function generate_data(birth, span)
{
	var days = basedate.getTime() - birth.getTime();
	days /= 1000;
	days /= 86400;
	mylog("Birth: " + birth);
	mylog("Base date: " + basedate);
	mylog("Number of days: " + days);

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
	update();
}

basedate_now = function ()
{
	s_basedate = null;
	update();
}

/*
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
*/

read_storage = function(engine)
{
	var contents = localStorage.getItem("bio1");
	if (! contents) {
		contents = {"blist": []};
	} else {
		try {
			contents = JSON.parse(contents);
		} catch (e) {
			console.log(e);
			contents = {"blist": []};
		}
	}
	data = contents["blist"];

	if (data.length < storage_list.length) {
		mylog("data length " + data.length);
		update();
		return;
	}

	++ulock;

	for(var i = 0; i < storage_list.length; ++i) {
		$(storage_list[i]).val(data[i]);
	}

	--ulock;

	update();
};

write_storage = function()
{
	var data = [];

	for (var i = 0; i < storage_list.length; ++i) {
		var s = storage_list[i];
		data.push($(s).val());
	}

	localStorage.setItem("bio1", JSON.stringify({"blist": data}));
	if (typeof AndroidGateway !== "undefined") {
	    AndroidGateway.updateData(Base64.encode(JSON.stringify({"blist": data})));
	} else {
        document.location = "blist:" + Base64.encode(JSON.stringify({"blist": data}));
    }
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

	o = $("#bnotif").get(0);
	i = 0;
	o.options[i++] = new Option("Never", -1);
	for (j = 0; j <= 23; ++j) {
		o.options[i++] = new Option("" + j + ":00", j);
	}
}


$(document).ready(function() {
	++ulock;

	populate_controls();
	window_resized();

	--ulock;

	window.onresize = window_resized;

	$("#byear").change(changed_data);
	$("#bmonth").change(changed_data);
	$("#bday").change(changed_data);
	$("#bhour").change(changed_data);
	$("#bspan").change(changed_data);
	$("#bnotif").change(changed_data);

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

	//  update_urls();
	write_storage();

	return true;
};

/* Biorhythm calculator 
 * Copyright (c) 2010 Elvis Pfutzenreuter
 * All rights reserved.
 */
