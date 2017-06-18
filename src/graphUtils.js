const _ = require('lodash');

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

const processCallTree = tree => {
    let queue = [...tree.children];
    const programTotal = queue.reduce((sum, item) => sum + item.total, 0);
    tree.total = programTotal;
    tree.self = 0;

    const items = {};
    const roots = {};
    const memory = [];

    while (queue.length) {
        const node = queue.pop();
        const key = node.func + node.file + node.line;
        if (items[key]) {
            items[key].calls += 1;
            items[key].self += node.self;
            items[key].total += node.total;
        } else {
            items[key] = {
                ..._.pick(node, ['func', 'file', 'line', 'total', 'self']),
                calls: 1,
                children: {},
                parents: {},
                key,
            };
        }

        if (node.parentItem) {
            items[node.parentItem].children[key] = true;
            items[key].parents[node.parentItem] = true;
            delete node.parentItem;
        } else {
            roots[key] = true;
        }

        if (node.mem) {
            memory.push({ time: node.end, size: node.mem });
        }

        node.children.forEach(child => (child.parentItem = key));
        queue = [...queue, ...node.children];
    }

    addStats(items, programTotal);
    return { items, roots, memory };
};

module.exports = {
    processCallTree,
};
