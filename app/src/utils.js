const fs = require('fs');
const { join, basename } = require('path');
const { app } = require('electron');
const moment = require('moment');

const getDataDirPath = () => {
    return join(app.getPath('userData'), 'perf_data');
};

const getFilePath = (fileName?: string): string => {
    fileName = fileName || `data_${moment().format('YYYYMMDDTHHmmss')}.json`;
    return join(getDataDirPath(), fileName);
};

const storeData = (data: Object): string => {
    const filePath = getFilePath();
    fs.writeFileSync(getFilePath(), JSON.stringify(data));
    return basename(filePath);
};

const readData = (fileName): Object => {
    try {
        const contents = fs.readFileSync(getFilePath(fileName), 'utf8');
        return JSON.parse(contents);
    } catch (error) {
        return null;
    }
};

const getFiles = (): string[] => {
    const files = fs.readdirSync(getDataDirPath());
    return files.filter(file => file.match(/^data_\d{8}T\d{6}\.json$/));
};

module.exports = {
    storeData,
    readData,
    getFiles,
    getDataDirPath,
};
