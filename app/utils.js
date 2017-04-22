const fs = require('fs');
const { join } = require('path');
const { app } = require('electron');
// const moment = require('moment');

const getFilePath = (): string => {
    const userDataPath = app.getPath('userData');
    // const fileName = `data_${moment().format('YYYYMMDDTHHmmss')}.json`:
    const fileName = `data.json`;
    return join(userDataPath, fileName);
};

const storeData = (data: Object) => {
    fs.writeFileSync(getFilePath(), JSON.stringify(data));
};

const readData = (): Object => {
    try {
        const contents = fs.readFileSync(getFilePath());
        return JSON.parse(contents);
    } catch (error) {
        return null;
    }
};

module.exports = {
    storeData,
    readData,
};
