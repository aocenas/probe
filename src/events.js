const { ipcMain, app } = require('electron');
const { readData, getFiles, getDataDirPath } = require('./utils/dataFiles');
const { getSettings, saveSettings } = require('./utils/settings');

ipcMain.on('app-ready', (event) => {
    const data = {
        files: getFiles(),
        settings: getSettings(),
        dataDirPath: getDataDirPath(),
    };
    if (data.files.length) {
        data.data = readData(data.files.slice(-1)[0]);
    }
    event.sender.send('initial-data', data);
});

ipcMain.on('request-file', (event, fileName: string) => {
    const newData = readData(fileName);
    const data = {
        data: newData,
        fileName: fileName,
    };
    event.sender.send('new-data', data);
});

ipcMain.on('settings-change', (event, settings) => {
    app.emit('settings-change', { prev: getSettings(), next: settings });
    saveSettings(settings);
});
