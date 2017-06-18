const React = require('react');
const { ipcRenderer } = require('electron');
const { NonIdealState, Button } = require('@blueprintjs/core');

const Tree = require('./Tree');
const Flame = require('./Flame');
const Settings = require('./Settings');
const Header = require('./Header');
const MemoryGraph = require('./MemoryGraph');
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
                const { items, roots, memory } = processCallTree(message.tree);
                this.setState({
                    topDown: roots,
                    bottomUp: items,
                    tree: message.tree,
                    currentFile: message.files.slice(-1)[0],
                    memory,
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
            if (isNew || message.name === this.state.currentFile) {
                const { items, roots, memory } = processCallTree(message.tree);
                this.setState({
                    topDown: roots,
                    bottomUp: items,
                    tree: message.tree,
                    memory,
                });
                if (isNew) {
                    this.setState({
                        files: [...this.state.files, message.name],
                        currentFile: message.name,
                    });
                }
            }
            // else throw away, user probably changed file before it arrived
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
                <Header
                    onSettingsClick={() => this.setState({ settingsOpen: true }}
                    onFileChange={fileName => {
                        this.setState({ currentFile: fileName });
                        ipcRenderer.send('request-data', fileName);
                    }}
                    onTypeChange={type => this.setState({ type })}
                    currentFile={this.state.currentFile}
                    files={this.state.files}
                    type={this.state.type}
                />

                {this.showContent()}

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
                        <MemoryGraph memoryData={this.state.memory} />
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


module.exports = App;
