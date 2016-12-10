const {app, Menu, Tray, BrowserWindow} = require('electron');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const ipcMain = require('electron').ipcMain;

let app_folder = app.getPath("userData");
mkdirp.sync(app_folder);
let log_file = path.join(app_folder, 'console.log');
let log = fs.openSync(log_file, 'a');

var mainWindow = null;

/*
var first_instance_on_reload = function () {
	if (mainWindow) {
		mainWindow.show();
	}
}

if (app.makeSingleInstance(first_instance_on_reload)) {
	app.quit();
}
*/

var storage = require("electron-json-storage");
var notify;

let tray, ContextMenu;

function mylog(txt)
{
	fs.writeSync(log, "" + (new Date()) + " " + txt + "\n");
}

ipcMain.on('mylog', function(event, arg) {
	mylog("(R) " + arg);
});

function createWindow () {
	mainWindow = new BrowserWindow({
			width: 800,
			'min-width': 800,
			height: 620,
			'min-height': 620,
			'accept-first-mouse': true,
			title: "Biorhythmics",
			icon:'./icon-256.png'});

	mainWindow.on('minimize', function(event) {
		event.preventDefault();
		mainWindow.hide();
	});

	mainWindow.on('close', function (event) {
		if (!app.isQuiting) {
			event.preventDefault();
			mainWindow.hide();
		}
		return false;
	});

	mainWindow.loadURL(`file://${__dirname}/index.html`);

	// mainWindow.webContents.openDevTools()

	mainWindow.on('closed', function () {
		mainWindow = null
	});

	tray = new Tray(path.join(__dirname, './icon-16.png'));
	contextMenu = Menu.buildFromTemplate([
		{
			label: 'Show chart',	
			click: function() {
				mainWindow.show();
			}
		},
		{
			label: 'Hide chart',	
			click: function() {
				mainWindow.hide();
			}
		},
		{
			label: 'Quit',
			click: function() {
				app.isQuiting = true;
				app.quit();
			}
		}
	]);

	tray.setToolTip('Biorhythmics');
	tray.setContextMenu(contextMenu);
}

app.on('ready', function() {
	createWindow();
	scheduleNotifs();
});

app.on('window-all-closed', function () {
	app.quit();
});

app.on('activate', function () {
	if (mainWindow === null) {
		createWindow();
	}
});

var periods = [23, 28, 33, 0];
var labels = ["Physical", "Emotional", "Intellectual", "Total"];
var last_notif = new Date();

function determine_bio()
{
	storage.get("bio1", function (error, contents) {
		if (! contents) {
			contents = {"blist": []};
		}
		var data = contents["blist"];
		if (data.length < 6) {
			mylog("bg: data length " + data.length);
			return;
		}
		if (data[5] < 0 || data[5] > 23) {
			mylog("bg: notifications turned off");
			return;
		}

		var now = new Date();
		var notif_time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), data[5], 0, 0, 0);
		if (notif_time < last_notif) {
			notif_time.setTime(notif_time.getTime() + 86400 * 1000);
		}

		mylog("bg: next notif is at " + notif_time);

		if (notif_time > now) {
			return;
		}
		
		last_notif = now;
	
		mylog("bg data: " + data);
		var birth = new Date(data[0], data[1] - 1, data[2], data[3], 0, 0, 0);

		var now = new Date();
		var tomorrow = new Date(now.getTime() + 24*60*60*1000);

		mylog("now: " + now);
		mylog("tomorrow: " + tomorrow);

		determine_bio_in(birth, now);
	});
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
		return;
	}

	if (msgs.length === 1) {
		notif(msgs[0][1], null);
		return;
	}

	msgs.sort(function (a, b) { return a[0] - b[0] });
	mylog(msgs);

	notif(msgs[0][1], msgs[1][1]);
}

function notif(txt, txt2)
{
	if (txt2 === null) {
		txt2 = "";
	}

	var options;

	if (txt2) {
		options = {};

		options.title = "Biorhythmics";
		options.text = txt2;
		options.onClickFunc = function (event) {
			mainWindow.show();
			event.closeNotification();
		};
	
		notify.notify(options);
	}

	options = {};

	options.title = "Biorhythmics";
	options.text = txt;
	options.onClickFunc = function (event) {
		mainWindow.show();
		event.closeNotification();
	};

	notify.notify(options);
}

function scheduleNotifs() {
	notify = require('electron-notify');
	notify.setConfig({
		appIcon: path.join(__dirname, './icon-256.png'),
		displayTime: 86400*1000/2-10,
		maxVisibleNotifications: 2,
		width: 350,
		height: 80,
	});
	setInterval(determine_bio, 60000);
}
