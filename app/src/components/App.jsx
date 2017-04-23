const React = require('react');
const moment = require('moment');
const { ipcRenderer } = require('electron');
const { NonIdealState } = require('@blueprintjs/core');
const Tree = require('./Tree');

const mapper = (nodes: Object[], edge: 'parents' | 'children'): Object[] => {
    return nodes.map(node => {
        const treeNode = {
            id: node.key,
            perfNode: node,
        };
        if (node[edge]) {
            treeNode.childNodes = mapper(node[edge], edge);
        }
        return treeNode;
    });
};

const toGraph = (nodes: Object) => {
    Object.keys(nodes)
        .map(key => {
            const node = nodes[key];
            node.key = key;
            return node;
        })
        .filter(node => node.callers && Object.keys(node.callers).length)
        .forEach(node => {
            Object.keys(node.callers).forEach(callerKey => {
                nodes[callerKey].children = nodes[callerKey].children || [];
                nodes[callerKey].children.push(node);
                node.parents = node.parents || [];
                node.parents.push(nodes[callerKey]);
            });
        });
};

const getRoots = (graph: Object): Object[] => {
    return Object.values(graph).filter(
        node => !(node.callers && Object.keys(node.callers).length)
    );
};

const addStats = (graph: Object, programTotal) => {
    Object.values(graph).forEach(node => {
        node.selfPerCall = node.self / node.calls;
        node.totalPerCall = node.total / node.calls;
        node.selfRelative = node.self / programTotal;
        node.selfPerCallRelative = node.selfPerCall / programTotal;
        node.totalRelative = node.total / programTotal;
        node.totalPerCallRelative = node.totalPerCall / programTotal;
    });
};

const parseData = (data: Object): [Object[], Object[]] => {
    toGraph(data);
    const roots = getRoots(data);
    const programTotal = roots
        .map(node => node.total)
        .reduce((acc, time) => acc + time, 0);

    addStats(data, programTotal);

    const topDown = mapper(roots, 'children');
    const bottomUp = mapper(Object.values(data), 'parents', programTotal);
    return [topDown, bottomUp];
};

type State = {
    type: 'top-down' | 'bottom-up',
    files: string[],
    currentFile?: string,
    topDown?: Object[],
    bottomUp?: Object[],
};

class App extends React.Component {
    state: State = {
        type: 'top-down',
        files: [],
    };

    componentDidMount() {
        ipcRenderer.on('initial-data', (event, message) => {
            if (message.files.length) {
                const [topDown, bottomUp] = parseData(message.tree);
                this.setState({
                    topDown,
                    bottomUp,
                    files: message.files,
                });
            }
        });
        ipcRenderer.on('new-data', (event, message) => {
            const isNew = !this.state.files.includes(message.name);
            if (isNew) {
                const [topDown, bottomUp] = parseData(message.tree);
                this.setState({
                    topDown,
                    bottomUp,
                    files: [...this.state.files, message.name],
                    currentFile: message.name,
                });
            } else {
                if (message.name === this.state.currentFile) {
                    const [topDown, bottomUp] = parseData(message.tree);
                    this.setState({
                        topDown,
                        bottomUp,
                    });
                }
                // else throw away, user probably changed file before it arrived
            }
        });
        ipcRenderer.send('request-initial-data');
    }

    render() {
        const { type, currentFile, files } = this.state;
        const tree = type === 'top-down'
            ? this.state.topDown
            : this.state.bottomUp;

        const noData = !this.state.topDown;

        return (
            <div className="app">
                <div className="header">
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

                {noData
                    ? <NonIdealState title="No data yet" visual="flows" />
                    : <div className="tree-wrapper">
                          <Tree
                              data={tree}
                              onClick={(node, path) => {
                                  node.isExpanded = !node.isExpanded;
                                  this.setState(this.state);
                              }}
                          />
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
