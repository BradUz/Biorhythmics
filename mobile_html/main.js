// From http://scotch.io/quick-tips/js/how-to-encode-and-decode-strings-with-base64-in-javascript
// Create Base64 Object
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};

var periods = [23, 28, 33, 0];
var labels = ["Physical", "Emotional", "Intellectual", "Total"];
var last_notif = new Date();

function jstest()
{
    return ["okok"];
}

function mylog(txt)
{
    if (AndroidGateway) {
        AndroidGateway.JSlog(txt);
    } else if (console) {
        if (console.log) {
            console.log(txt);
        }
    }
}

function determine_bio(storage)
{
    if (storage.length <= 0) {
        return ["Empty storage", "", ""];
    }
    
    var s = Base64.decode(storage);
    var data = JSON.parse(s)["blist"];
    
    if (data[5] < 0 || data[5] > 23) {
        return ["bg: notifications turned off", "", ""];
    }

    var now = new Date();
    var notif_time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), data[5], 0, 0, 0);
    if (notif_time < last_notif) {
        notif_time.setTime(notif_time.getTime() + 86400 * 1000);
    }

    mylog("bg: next notif is at " + notif_time);

    if (notif_time > now) {
        return ["bg: not in time yet", "", ""];
    }
		
    last_notif = now;
	
    mylog("bg data: " + data);
    var birth = new Date(data[0], data[1] - 1, data[2], data[3], 0, 0, 0);

    var now = new Date();
    var tomorrow = new Date(now.getTime() + 24*60*60*1000);

    mylog("now: " + now);
    mylog("tomorrow: " + tomorrow);

    return determine_bio_in(birth, now);
}

function determine_bio_in(birth, now)
{
	var d0b = [0, 0, 0, 0];
	var d1b = [0, 0, 0, 0];
	var d2b = [0, 0, 0, 0];
	var dm1b = [0, 0, 0, 0];
	var dd0b = [0, 0, 0, 0];
	var dd1b = [0, 0, 0, 0];

	var days = now.getTime() - birth.getTime();
	days /= 1000;
	days /= 86400;

	mylog("Base: " + now);
	mylog("Birth: " + birth);
	mylog("Number of days: " + days);
		
	for (var i = 0; i < 3; ++i) {
		var h = Math.sin(2.0 * Math.PI * days / periods[i]);
		d0b[i] = h;
		d0b[3] += h;
		h = Math.sin(2.0 * Math.PI * (days + 1) / periods[i]);
		d1b[i] = h;
		d1b[3] += h;
		h = Math.sin(2.0 * Math.PI * (days + 2) / periods[i]);
		d2b[i] = h;
		d2b[3] += h;
		h = Math.sin(2.0 * Math.PI * (days - 1) / periods[i]);
		dm1b[i] = h;
		dm1b[3] += h;

		// derivatives
		h = Math.cos(2.0 * Math.PI * days / periods[i]);
		dd0b[i] = h;
		h = Math.cos(2.0 * Math.PI * (days + 1) / periods[i]);
		dd1b[i] = h;

		mylog("item " + i + " x-1: " + dm1b[i] + " x: " + d0b[i] + " x+1: " + d1b[i] + " derivatives " + dd0b[i] + " " + dd1b[i]);
	}

	var msgs = [];

	var critical = [];
	var critical_tomorrow = [];
	var cycle = [0, 0, 0];

	for (i = 0; i < 3; ++i) {
		if ((d0b[i] * d1b[i]) < 0) {
			// zero cross
			critical.push(labels[i]);
		}
		if ((d1b[i] * d2b[i]) < 0) {
			// zero cross tomorrow
			critical_tomorrow.push(labels[i]);
		}
		if ((d0b[i] * dm1b[i]) < 0) {
			// zero cross yesterday
			cycle[i] = d1b[i] > 0 ? +1 : -1;
		}
	}

	if (critical.length === 1) {
		msgs.push([0, "Watch out! You are in a Critical Day - the " + critical[0] +
				" biorhythm is zero-crossing."]);
	} else if (critical.length === 2) {
		msgs.push([0, "Be extra careful today! You are in a Double Critical Day - " +
				"the " + critical[0] + " and " + critical[1] +
				" biorhythms are zero-crossing."]);
	} else if (critical.length === 3) {
		msgs.push([0, "Be extra careful today, and consider taking a break! " +
				"You are in a Triple Critical Day - " +
				"all three biorhythms are zero-crossing."]);
	}

	if (critical_tomorrow.length === 1) {
		msgs.push([10, "Watch out! Tomorrow will be a Critical Day - the " + critical_tomorrow[0] +
				" biorhythm is going to zero-cross."]);
	} else if (critical_tomorrow.length === 2) {
		msgs.push([10, "Be extra careful! Tomorrow will be a Double Critical Day - " +
				"the " + critical_tomorrow[0] + " and " + critical_tomorrow[1] +
				" biorhythms are going to zero-cross."]);
	} else if (critical_tomorrow.length === 3) {
		msgs.push([10, "Be extra careful tomorrow, and consider taking a break! " +
				"It will be a Triple Critical Day - " +
				"all three biorhythms are going to zero-cross."]);
	}

	for (i = 0; i < 3; ++i) {
		var lname = labels[i];
		var duration = Math.round(periods[i] / 2) - 1;
		if (cycle[i] > 0) {
			msgs.push([20 + Math.random() / 2, "Your " + lname + 
					" biorhythm will be Positive in the next " + duration +
					" days. Enjoy, and make the most of it!"]);
		} else if (cycle[i] < 0) {
			msgs.push([20 + Math.random() / 2,
					"Your " + lname + " biorhythm will be Negative in the next " +
					duration + " days. Sit tight and save up your " + lname +
					" resources in this period."]);
		}

		if ((dd0b[i] * dd1b[i]) < 0) {
			// zero cross of derivative
			if (d0b[i] > 0) {
				msgs.push([30 + Math.random() / 2, "Your " + lname +
						" biorhythm is peaking today. Enjoy!"]);
			} else {
				msgs.push([30 + Math.random() / 2, "Your " + lname +
					" biorhythm is in the lowest level today. Watch out!"]);
			}
		}

		if ((d0b[i] * d1b[i]) > 0) {
			// trend
			if (d0b[i] > 0) {
				msgs.push([40 + Math.random() / 2, "Your " + lname +
					" biorhythm is currently Positive."]);
			} else {
				msgs.push([40 + Math.random() / 2, "Your " + lname +
					" biorhythm is currently Negative."]);
			}
		}
	}

	if (msgs.length <= 0) {
		mylog("No events in biorhythm");
		return ["No events in biorhythm"];
	}

	// call toString() because Rhino uses ConsString objects to express concatenations
	// and it could not be cast to String in Java layer

	if (msgs.length === 1) {
		return ["", msgs[0][1].toString()];
	}

	msgs.sort(function (a, b) { return a[0] - b[0] });

	return ["", msgs[0][1].toString(), msgs[1][1].toString()];
}
