const { ipcMain, app } = require('electron');
const { readData, getFiles, getDataDirPath } = require('./utils/dataFiles');
const { getSettings, saveSettings } = require('./utils/settings');

ipcMain.on('app-ready', (event, arg) => {
    const data = {
        files: getFiles(),
        settings: getSettings(),
        dataDirPath: getDataDirPath(),
    };
    if (data.files.length) {
        data.tree = readData(data.files.slice(-1)[0]);
    }
    event.sender.send('initial-data', data);
});

ipcMain.on('request-data', (event, arg) => {
    const newData = readData(arg);
    const data = {
        tree: newData,
        name: arg,
    };
    event.sender.send('new-data', data);
});

ipcMain.on('settings-change', (event, arg) => {
    app.emit('settings-change', { prev: getSettings(), next: arg });
    saveSettings(arg);
});
