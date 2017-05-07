const React = require('react');
const moment = require('moment');
const { ipcRenderer } = require('electron');
const { NonIdealState, Button } = require('@blueprintjs/core');

const Tree = require('./Tree');
const Flame = require('./Flame');
const Settings = require('./Settings');
const {
    toGraph,
    addStats,
    getRoots,
    processCallTree,
} = require('../graphUtils');

const parseData = (data: Object): [Object[], Object[]] => {
    toGraph(data);
    const roots = getRoots(data);
    const programTotal = roots
        .map(node => node.total)
        .reduce((acc, time) => acc + time, 0);

    addStats(data, programTotal);

    const topDown = roots;
    const bottomUp = Object.values(data);
    return [topDown, bottomUp];
};

type State = {
    type: 'top-down' | 'bottom-up',
    files: string[],
    currentFile?: string,
    topDown?: Object[],
    bottomUp?: Object[],
    settingsOpen: boolean,
    settings: Object,
};

class App extends React.Component {
    state: State = {
        type: 'top-down',
        files: [],
        settingsOpen: false,
        flameWidth: 100,
    };

    componentDidMount() {
        ipcRenderer.on('initial-data', (event, message) => {
            if (message.files.length) {
                const { items, roots } = processCallTree(message.tree);
                this.setState({
                    topDown: roots,
                    bottomUp: items,
                    files: message.files,
                    tree: message.tree,
                });
            }
            this.setState({
                settings: message.settings,
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
        const {
            type,
            currentFile,
            files,
            settingsOpen,
            settings,
            tree,
        } = this.state;
        const items = type === 'top-down'
            ? this.state.topDown
            : this.state.bottomUp;

        const noData = !this.state.topDown;

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
                    />}
                <div className="header">
                    <div className="left-group">
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
                            </select>
                        </div>
                        {!noData &&
                            <div className="pt-select pt-minimal">
                                <select
                                    onChange={event => {
                                        this.setState({
                                            currentFile: event.target.value,
                                        });
                                        ipcRenderer.send(
                                            'request-data',
                                            event.target.value
                                        );
                                    }}
                                    value={currentFile}
                                    disabled={noData}
                                >
                                    {files.map(file => {
                                        return (
                                            <option key={file} value={file}>
                                                {parseDateFromFileName(file)}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>}
                    </div>
                    {settings &&
                        <Button
                            iconName="cog"
                            className="pt-minimal"
                            onClick={() =>
                                this.setState({ settingsOpen: true })}
                        />}
                </div>

                {noData
                    ? <NonIdealState title="No data yet" visual="flows" />
                    : <div className="content-wrapper">
                          <div className="pt-button-group">
                              <button
                                  type="button"
                                  className="pt-button pt-icon-minus"
                                  onClick={() =>
                                      this.setState({
                                          flameWidth: this.state.flameWidth / 2,
                                      })}
                              />
                              <button
                                  type="button"
                                  className="pt-button pt-icon-plus"
                                  onClick={() =>
                                      this.setState({
                                          flameWidth: this.state.flameWidth * 2,
                                      })}
                              />
                          </div>
                          <div className="flame-wrapper">
                              <Flame
                                  tree={tree}
                                  style={{ width: `${this.state.flameWidth}%` }}
                              />
                          </div>
                          <div className="tree-wrapper">
                              <Tree
                                  itemKeys={Object.keys(items)}
                                  allItems={this.state.bottomUp}
                                  type={type}
                                  dataId={currentFile}
                              />
                          </div>
                      </div>}
            </div>
        );
    }
}

const parseDateFromFileName = (fileName: string): string => {
    const matched = fileName.match(/^data_(.*)\.json$/);
    if (matched) {
        return moment(matched[1]).format('YYYY-MM-DD HH:mm:ss');
    } else {
        return fileName;
    }
};

module.exports = App;
