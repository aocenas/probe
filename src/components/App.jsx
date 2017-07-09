const React = require('react');
const { ipcRenderer } = require('electron');
const { NonIdealState } = require('@blueprintjs/core');

const Tree = require('./Tree');
const Settings = require('./Settings');
const Header = require('./Header');
const FlamePage = require('./FlamePage');
const { processEvents, parseEvents } = require('../graphUtils');

type State = {
    type: 'top-down' | 'bottom-up' | 'flame',
    files: string[],
    currentFile?: string,
    settingsOpen: boolean,
    settings: Object,
    // in percent
    dataDirPath: ?string,

    root?: Object,
    bottomUpRoots?: Object[],
    topDownRoots?: Object[],
    memory?: Object[],
};

class App extends React.Component {
    state: State = {
        type: 'flame',
        files: [],
        settingsOpen: false,
        dataDirPath: null,
    };

    componentDidMount() {
        ipcRenderer.on('initial-data', (event, message) => {
            if (message.data) {
                this.setState({
                    ...processEvents(parseEvents(message.data)),
                    currentFile: message.files.slice(-1)[0],
                });
            }
            this.setState({
                settings: message.settings,
                dataDirPath: message.dataDirPath,
                files: message.files || [],
            });

            if (message.files && message.files.length) {
                const currentFile = message.files.slice(-1)[0];
                this.setState({ currentFile });
                ipcRenderer.send('request-data', currentFile);
            }
        });

        ipcRenderer.on('new-data', (event, message) => {
            const isNew = !this.state.files.includes(message.name);

            if (isNew || message.name === this.state.currentFile) {
                this.setState(processEvents(parseEvents(message.data)));

                if (isNew) {
                    this.setState({
                        files: [...this.state.files, message.name],
                        currentFile: message.name,
                    });
                }
            }

            // else throw away, user probably changed file before data arrived
        });

        ipcRenderer.send('app-ready');
    }

    render() {
        const { settingsOpen, settings, files } = this.state;

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
                    onSettingsClick={() =>
                        this.setState({ settingsOpen: true })}
                    onFileChange={fileName => {
                        this.setState({ currentFile: fileName });
                        ipcRenderer.send('request-data', fileName);
                    }}
                    onTypeChange={type => this.setState({ type })}
                    currentFile={this.state.currentFile}
                    files={this.state.files}
                    type={this.state.type}
                    disabled={!files.length}
                />

                <div className="app_content-wrapper">
                    {this.showContent()}
                </div>

            </div>
        );
    }

    showContent() {
        const {
            type,
            currentFile,
            root,
            bottomUpRoots,
            topDownRoots,
        } = this.state;
        const noData = !root;

        if (noData) {
            return <NonIdealState title="No data yet" visual="flows" />;
        } else {
            if (type === 'flame') {
                return (
                    <FlamePage
                        memoryData={this.state.memory}
                        root={root}
                    />
                );
            } else {
                const roots = type === 'top-down'
                    ? topDownRoots
                    : bottomUpRoots;
                return (
                    <div className="app_tree-wrapper">
                        <Tree roots={roots} type={type} dataId={currentFile} />
                    </div>
                );
            }
        }
    }
}

module.exports = App;
