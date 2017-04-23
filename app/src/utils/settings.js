const fs = require('fs');
const { join } = require('path');
const { app } = require('electron');

type Settings = {
    serverPort: number,
};

const defaultSettings: Settings = {
    serverPort: 19876,
};

const getSettingsPath = () => {
    return join(app.getPath('userData'), 'user_settings.json');
};

const readUserSettings = () => {
    try {
        const contents = fs.readFileSync(getSettingsPath(), 'utf8');
        return JSON.parse(contents);
    } catch (error) {
        return null;
    }
};

const getSettings = (): Settings => {
    return {
        ...defaultSettings,
        ...readUserSettings(),
    };
};

const saveSettings = (newSettings: Object) => {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(newSettings));
};

module.exports = {
    getSettings,
    saveSettings,
};

