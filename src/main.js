const path = require('path');
const url = require('url');
const fs = require('fs');

const { app, BrowserWindow } = require('electron');

const {
    storeData,
    getDataDirPath,
} = require('./utils/dataFiles');
const { getSettings } = require('./utils/settings');
const createServer = require('./server');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let server;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ width: 800, height: 600 });

    // and load the index.html of the app.
    win.loadURL(
        url.format({
            pathname: path.join(__dirname, '..', 'index.html'),
            protocol: 'file:',
            slashes: true,
        })
    );

    // Open the DevTools.
    // win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });

    require('./events');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    const dataPath = getDataDirPath();
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }

    createWindow();
    setupServer(getSettings().serverPort);

    const {
        default: installExtension,
        REACT_DEVELOPER_TOOLS,
    } = require('electron-devtools-installer');

    installExtension(REACT_DEVELOPER_TOOLS)
        .then(name => console.log(`Added Extension:  ${name}`))
        .catch(err => console.log('An error occurred: ', err));
});

app.on('settings-change', (change) => {
    if (change.prev.serverPort !== change.next.serverPort) {
        server.close();
        setupServer(change.next.serverPort);
    }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

const setupServer = (port) => {
    if (server) {
        server.close();
    }
    server = createServer(port, newData => {
        const dataParsed = JSON.parse(newData);
        const fileName = storeData(dataParsed);
        if (win) {
            win.webContents.send('new-data', {
                tree: dataParsed,
                name: fileName,
            });
        }
    });
};