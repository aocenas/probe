const fs = require('fs');
const { join, basename } = require('path');
const { app } = require('electron');
const moment = require('moment');

const getDataDirPath = () => {
    return join(app.getPath('userData'), 'perf_data');
};

const fileName = (name: ?string): string => {
    const suffix = name ? `_${name}` : '';
    return `data_${moment().format('YYYYMMDDTHHmmss')}${suffix}`;
};

const getFilePath = (fileName: string): string => {
    return join(getDataDirPath(), fileName);
};

const storeData = (data: string, name: ?string): string => {
    const filePath = getFilePath(fileName(name));
    fs.writeFileSync(filePath, data);
    return basename(filePath);
};

const appendData = (data: string, fileName: string) => {
    const filePath = getFilePath(fileName);
    fs.appendFileSync(filePath, '\n' + data);
    return basename(filePath);
};

const readData = (fileName): Object => {
    return fs.readFileSync(getFilePath(fileName), 'utf8');
};

const getFiles = (): string[] => {
    const files = fs.readdirSync(getDataDirPath());
    return files.filter(file => file.match(/^data_\d{8}T\d{6}.*$/));
};

module.exports = {
    storeData,
    readData,
    getFiles,
    getDataDirPath,
    appendData,
};
