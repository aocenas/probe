const React = require('react');
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

class App extends React.Component {
    constructor(props) {
        super(props);
        toGraph(props.data);
        const roots = getRoots(props.data);
        const programTotal = roots
            .map(node => node.total)
            .reduce((acc, time) => acc + time, 0);

        addStats(props.data, programTotal);

        const topDown = mapper(roots, 'children');
        const bottomUp = mapper(
            Object.values(props.data),
            'parents',
            programTotal
        );

        this.state = {
            topDown,
            bottomUp,
            type: 'top-down',
        };
    }

    render() {
        const { type } = this.state;
        const tree = type === 'top-down'
            ? this.state.topDown
            : this.state.bottomUp;
        return (
            <div className="app">
                <div className="header">
                    <div className="pt-select pt-minimal">
                        <select
                            onChange={event =>
                                this.setState({ type: event.target.value })}
                            value={type}
                        >
                            <option value="top-down">
                                Tree (top down)
                            </option>
                            <option value="bottom-up">
                                Heavy (bottom up)
                            </option>
                        </select>
                    </div>
                </div>
                <div className="tree-wrapper">
                    <Tree
                        data={tree}
                        onClick={(node, path) => {
                            node.isExpanded = !node.isExpanded;
                            this.setState(this.state);
                        }}
                    />
                </div>
            </div>
        );
    }
}

module.exports = App;
