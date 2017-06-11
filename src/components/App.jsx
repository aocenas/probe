const path = require('path');
const React = require('react');
const moment = require('moment');
const { ipcRenderer } = require('electron');
const { NonIdealState, Button } = require('@blueprintjs/core');

const Tree = require('./Tree');
const Flame = require('./Flame');
const Settings = require('./Settings');
const { processCallTree } = require('../graphUtils');

type State = {
    type: 'top-down' | 'bottom-up' | 'flame',
    files: string[],
    currentFile?: string,
    topDown?: Object[],
    bottomUp?: Object[],
    settingsOpen: boolean,
    settings: Object,
    // in percent
    flameWidth: number,
    dataDirPath: ?string,
};

class App extends React.Component {
    state: State = {
        type: 'flame',
        files: [],
        settingsOpen: false,
        flameWidth: 100,
        dataDirPath: null,
    };

    componentDidMount() {
        ipcRenderer.on('initial-data', (event, message) => {
            if (message.tree) {
                const { items, roots } = processCallTree(message.tree);
                this.setState({
                    topDown: roots,
                    bottomUp: items,
                    tree: message.tree,
                    currentFile: message.files.slice(-1)[0],
                });
            }
            this.setState({
                settings: message.settings,
                dataDirPath: message.dataDirPath,
                files: message.files || [],
            });
        });
        ipcRenderer.on('new-data', (event, message) => {
            const isNew = !this.state.files.includes(message.name);
            if (isNew) {
                const { items, roots } = processCallTree(message.tree);
                this.setState({
                    topDown: roots,
                    bottomUp: items,
                    files: [...this.state.files, message.name],
                    currentFile: message.name,
                    tree: message.tree,
                });
            } else {
                if (message.name === this.state.currentFile) {
                    const { items, roots } = processCallTree(message.tree);
                    this.setState({
                        topDown: roots,
                        bottomUp: items,
                        tree: message.tree,
                    });
                }
                // else throw away, user probably changed file before it arrived
            }
        });
        ipcRenderer.send('app-ready');
    }

    render() {
        const { settingsOpen, settings } = this.state;

        return (
            <div className="app">
                {settings &&
                    <Settings
                        isOpen={settingsOpen}
                        onClose={() => this.setState({ settingsOpen: false })}
                        onSave={settings => {
                            ipcRenderer.send('settings-change', settings);
                            this.setState({
                                settingsOpen: false,
                                settings,
                            });
                        }}
                        settings={settings}
                        dataDirPath={this.state.dataDirPath}
                    />}
                <div className="header">
                    <div className="left-group">
                        {this.typeSelect()}
                        {this.dataSelect()}
                    </div>
                    {settings &&
                        <Button
                            iconName="cog"
                            className="pt-minimal"
                            onClick={() =>
                                this.setState({ settingsOpen: true })}
                        />}
                </div>

                {this.showContent()}

            </div>
        );
    }

    dataSelect() {
        const { currentFile, files } = this.state;
        if (!files.length) {
            return null;
        }
        return (
            <div className="pt-select pt-minimal">
                <select
                    onChange={event => {
                        this.setState({
                            currentFile: event.target.value,
                        });
                        ipcRenderer.send('request-data', event.target.value);
                    }}
                    value={currentFile}
                    disabled={!files}
                >
                    {files.map(file => {
                        return (
                            <option key={file} value={file}>
                                {parseFileName(file)}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }

    typeSelect() {
        const { type, topDown } = this.state;
        const noData = !topDown;
        return (
            <div className="pt-select pt-minimal">
                <select
                    onChange={event =>
                        this.setState({ type: event.target.value })}
                    value={type}
                    disabled={noData}
                >
                    <option value="top-down">
                        Tree (top down)
                    </option>
                    <option value="bottom-up">
                        Heavy (bottom up)
                    </option>
                    <option value="flame">
                        Flame graph
                    </option>
                </select>
            </div>
        );
    }

    showContent() {
        const {
            flameWidth,
            type,
            topDown,
            bottomUp,
            currentFile,
            tree,
        } = this.state;
        const noData = !topDown;

        if (noData) {
            return <NonIdealState title="No data yet" visual="flows" />;
        } else {
            let content;
            if (type === 'flame') {
                content = (
                    <div className="flame-wrapper">
                        <Flame
                            tree={tree}
                            style={{ width: `${flameWidth}%` }}
                        />
                    </div>
                );
            } else {
                const items = type === 'top-down' ? topDown : bottomUp;
                content = (
                    <div className="tree-wrapper">
                        <Tree
                            itemKeys={Object.keys(items)}
                            allItems={bottomUp}
                            type={type}
                            dataId={currentFile}
                        />
                    </div>
                );
            }

            return (
                <div className="content-wrapper">
                    {content}
                </div>
            );
        }
    }
}

const parseFileName = (fileName: string): string => {
    const parts = path.basename(fileName, '.json').split('_');
    const date = parts[1];
    const name = parts[2];
    const namePart = name ? ` [${name}]` : '';

    return `${moment(date).format('YYYY-MM-DD HH:mm:ss')}${namePart}`;
};

module.exports = App;
