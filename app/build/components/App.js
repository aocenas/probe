const React = require('react');
const { ipcRenderer } = require('electron');
const { NonIdealState } = require('@blueprintjs/core');
const Tree = require('./Tree');

const mapper = (nodes, edge) => {
    return nodes.map(node => {
        const treeNode = {
            id: node.key,
            perfNode: node
        };
        if (node[edge]) {
            treeNode.childNodes = mapper(node[edge], edge);
        }
        return treeNode;
    });
};

const toGraph = nodes => {
    Object.keys(nodes).map(key => {
        const node = nodes[key];
        node.key = key;
        return node;
    }).filter(node => node.callers && Object.keys(node.callers).length).forEach(node => {
        Object.keys(node.callers).forEach(callerKey => {
            nodes[callerKey].children = nodes[callerKey].children || [];
            nodes[callerKey].children.push(node);
            node.parents = node.parents || [];
            node.parents.push(nodes[callerKey]);
        });
    });
};

const getRoots = graph => {
    return Object.values(graph).filter(node => !(node.callers && Object.keys(node.callers).length));
};

const addStats = (graph, programTotal) => {
    Object.values(graph).forEach(node => {
        node.selfPerCall = node.self / node.calls;
        node.totalPerCall = node.total / node.calls;
        node.selfRelative = node.self / programTotal;
        node.selfPerCallRelative = node.selfPerCall / programTotal;
        node.totalRelative = node.total / programTotal;
        node.totalPerCallRelative = node.totalPerCall / programTotal;
    });
};

const parseData = data => {
    toGraph(data);
    const roots = getRoots(data);
    const programTotal = roots.map(node => node.total).reduce((acc, time) => acc + time, 0);

    addStats(data, programTotal);

    const topDown = mapper(roots, 'children');
    const bottomUp = mapper(Object.values(data), 'parents', programTotal);
    return [topDown, bottomUp];
};

class App extends React.Component {
    constructor(...args) {
        var _temp;

        return _temp = super(...args), this.state = {
            type: 'top-down',
            files: []
        }, _temp;
    }

    componentDidMount() {
        ipcRenderer.on('initial-data', (event, message) => {
            if (message.files.length) {
                const [topDown, bottomUp] = parseData(message.tree);
                this.setState({
                    topDown,
                    bottomUp,
                    files: message.files
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
                    currentFile: message.name
                });
            } else {
                if (message.name === this.state.currentFile) {
                    const [topDown, bottomUp] = parseData(message.tree);
                    this.setState({
                        topDown,
                        bottomUp
                    });
                }
                // else throw away, user probably changed file before it arrived
            }
        });
        ipcRenderer.send('request-initial-data');
    }

    render() {
        const { type, currentFile, files } = this.state;
        const tree = type === 'top-down' ? this.state.topDown : this.state.bottomUp;

        const noData = !this.state.topDown;

        return React.createElement(
            'div',
            { className: 'app' },
            React.createElement(
                'div',
                { className: 'header' },
                React.createElement(
                    'div',
                    { className: 'pt-select pt-minimal' },
                    React.createElement(
                        'select',
                        {
                            onChange: event => this.setState({ type: event.target.value }),
                            value: type,
                            disabled: noData
                        },
                        React.createElement(
                            'option',
                            { value: 'top-down' },
                            'Tree (top down)'
                        ),
                        React.createElement(
                            'option',
                            { value: 'bottom-up' },
                            'Heavy (bottom up)'
                        )
                    )
                ),
                !noData && React.createElement(
                    'div',
                    { className: 'pt-select pt-minimal' },
                    React.createElement(
                        'select',
                        {
                            onChange: event => {
                                this.setState({
                                    currentFile: event.target.value
                                });
                                ipcRenderer.send('request-data', event.target.value);
                            },
                            value: currentFile,
                            disabled: noData
                        },
                        files.map(file => {
                            return React.createElement(
                                'option',
                                { key: file, value: file },
                                file
                            );
                        })
                    )
                )
            ),
            noData ? React.createElement(NonIdealState, { title: 'No data yet', visual: 'flows' }) : React.createElement(
                'div',
                { className: 'tree-wrapper' },
                React.createElement(Tree, {
                    data: tree,
                    onClick: (node, path) => {
                        node.isExpanded = !node.isExpanded;
                        this.setState(this.state);
                    }
                })
            )
        );
    }
}

module.exports = App;