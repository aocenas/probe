const path = require('path');
const url = require('url');
const fs = require('fs');

const { app, BrowserWindow } = require('electron');

const {
    storeData,
    getDataDirPath,
    appendData,
} = require('./utils/dataFiles');
const { getSettings } = require('./utils/settings');
const createServer = require('./server');

let win;
let server;
let dataUUID;
let currentFilename;

function createWindow() {
    win = new BrowserWindow({ width: 800, height: 600 });
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
    installReactDevTools();
});

app.on('settings-change', (change) => {
    if (change.prev.serverPort !== change.next.serverPort) {
        server.close();
        setupServer(change.next.serverPort);
    }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

const setupServer = (port) => {
    if (server) {
        server.close();
    }
    server = createServer(port, data => {
        if (data.query.uuid === dataUUID) {
            appendData(data.data, currentFilename);
        } else {
            currentFilename = storeData(data.data, data.query.name);
            dataUUID = data.query.uuid;
        }
        if (win) {
            win.webContents.send('new-data', {
                data: data.data.split('\n'),
                fileName: currentFilename,
            });
        }
    });
};

const installReactDevTools = () => {
    const {
        default: installExtension,
        REACT_DEVELOPER_TOOLS,
    } = require('electron-devtools-installer');

    installExtension(REACT_DEVELOPER_TOOLS)
        .then(name => console.log(`Added Extension:  ${name}`))
        .catch(err => console.log('An error occurred: ', err));
};
