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
            delete node.callers;
        });
};

const getRoots = (graph: Object): Object[] => {
    return Object.values(graph).filter(
        node => !(node.parents && node.parents.length)
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

module.exports = {
    toGraph,
    getRoots,
    addStats,
};
