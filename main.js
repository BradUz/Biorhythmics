const {app, Menu, Tray} = require('electron')
electron = require('electron')
// Module to control application life.
const path = require('path');
app.setPath("userData", path.join(app.getPath('home'), '.Biorhytmics'));
if (app.makeSingleInstance(function () {})) {
    app.quit();
}
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 620,
			'min-width': 800, 'min-height': 620,
			'accept-first-mouse': true,
			title: "Biorhythmics", icon:'./icon-256.png'})

  mainWindow.on('minimize',function(event){
	event.preventDefault()
	mainWindow.hide();
  });

  mainWindow.on('close', function (event) {
	if(!app.isQuiting) {
		event.preventDefault()
		mainWindow.hide();
	}
        return false;
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });

    var appIcon = null;
    appIcon = new Tray('./icon-16.png');
    var contextMenu = Menu.buildFromTemplate([

        { label: 'Show App', click:  function(){
            mainWindow.show();
        } },
        { label: 'Quit', click:  function(){
            app.isQuiting = true;
            app.quit();

        } }
    ]);
    appIcon.setToolTip('Electron.js App');
    appIcon.setContextMenu(contextMenu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
    app.quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

