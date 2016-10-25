chrome.app.runtime.onLaunched.addListener(function() {
	open_window();
});

function open_window()
{
	chrome.app.window.create('window.html', {
		'outerBounds': {
			'width': 800,
			'height': 600,
		},
		'id': "bioui"
	});
}

function determine_bio()
{
	chrome.storage.local.get(null, function (contents) {
		if (! contents["bio1"]) {
			console.log("Birth date not configured");
			return;
		}
		var data = "" + contents["bio1"];
		if (data.length <= 0) {
			console.log("Birth date not configured 2");
			return;
		}
		console.log("data: " + data);
		data = JSON.parse(data)["blist"];
		var birth = new Date(data[0], data[1] - 1, data[2], data[3], 0, 0, 0);

		var now = new Date();
		var tomorrow = new Date(now.getTime() + 24*60*60*1000);
		/*
		if (contents["last_date"]) {
			now = new Date(contents["last_date"]);
			console.log("now upd: " + now);
		}
		*/
		console.log("now: " + now);
		console.log("tomorrow: " + tomorrow);
		/*
		chrome.storage.local.set({"last_date": tomorrow.getTime()});
		*/

		determine_bio_in(birth, now);
	});
}

var periods = [23, 28, 33, 0];
var labels = ["Physical", "Emotional", "Intellectual", "Total"];

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

	console.log("Base: " + now);
	console.log("Birth: " + birth);
	console.log("Number of days: " + days);
		

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

		console.log("item " + i + " x-1: " + dm1b[i] + " x: " + d0b[i] + " x+1: " + d1b[i] + " derivatives " + dd0b[i] + " " + dd1b[i]);
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
		console.log("No events in biorhythm");
		return;
	}

	if (msgs.length === 1) {
		notif(msgs[0][1], null);
		return;
	}

	msgs.sort(function (a, b) { return a[0] - b[0] });
	console.log(msgs);

	notif(msgs[0][1], msgs[1][1]);
}

var click_handler = false;

function notif(txt, txt2)
{
	if (txt2 === null) {
		txt2 = "";
	}

	var options = {
		type: "basic",
		iconUrl: "icon-128.png",
		title: "Biorhythmics",
		message: txt,
		contextMessage: txt2,
		requireInteraction: true,
		isClickable: true
	};
	chrome.notifications.create("bionot1", options, function () {});

	if (! click_handler) {
		click_handler = true;
		chrome.notifications.onClicked.addListener(function () {
			console.log("Clicked");
			open_window();
			clear_notif();
		});
	}
}

function clear_notif()
{
	chrome.notifications.clear("bionot1");
}

chrome.alarms.onAlarm.addListener(function () {
	console.log("Alarm called.");
	determine_bio();
});

chrome.runtime.onInstalled.addListener(function () {
	console.log("Installed.");
	chrome.alarms.create("bio1", {delayInMinutes: 60, periodInMinutes: 60*24});
	// chrome.alarms.create("bio1", {delayInMinutes: 1, periodInMinutes: 1});
	console.log("Alarm added.");
});
