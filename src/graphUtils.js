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

type Event = {
    type: 'call' | 'c_call' | 'return' | 'c_return' | 'c_exception' | 'end',
    func: string,
    line: number,
    file: string,
    time: number,
    mem: number,
};

type Node = {
    func: string,
    line: number,
    file: string,
    timeStart: number,
    timeEnd: number,
    memStart: number,
    memEnd: number,
    children: Node[],
    total: number,
    self: number,
};

type StatsNode = {
    nodes: Node[],
    parents: StatsNode[],
    children: StatsNode[],
    self: number,
    total: number,
    selfPerCall: number,
    totalPerCall: number,
    selfRelative: number,
    selfPerCallRelative: number,
    totalRelative: number,
    totalPerCallRelative: number,
    key: string,
};

type ProcessingResult = {
    root: Node,
    bottomUpMap: { [id: string]: StatsNode },
    memory: { val: number, time: number }[],
}

const processEvents = (events: Event[]): ProcessingResult => {
    const stack = [];
    const statsMap = {};
    const memory = [];
    let topDownRoots = [];
    let root = {
        root: true,
        children: [],
    };
    stack.push(root);

    events.forEach(event => {
        memory.push({
            val: event.mem,
            time: event.time,
        });
        if (['call', 'c_call'].includes(event.type)) {
            let node = {
                ..._.pick(event, ['func', 'file', 'line']),
                timeStart: event.time,
                children: [],
                memStart: event.mem,
            };
            let parent = stack.pop();
            parent.children.push(node);
            stack.push(parent);
            stack.push(node);

            let key = getNodeKey(node);

            let statsNode = statsMap[key];
            if (!statsNode) {
                statsNode = statsMap[key] = {
                    nodes: [],
                    parents: [],
                    children: [],
                    key,
                };
            }

            statsNode.nodes.push(node);
            if (!parent.root) {
                const statsParent = statsMap[getNodeKey(parent)];
                statsNode.parents.push(statsParent);
                statsParent.children.push(statsNode);
            } else {
                topDownRoots.push(statsNode);
            }
        }

        if (['return', 'c_return', 'c_exception'].includes(event.type)) {
            let current = stack.pop();
            if (current.root) {
                // usually we have 'return' as first event because we start
                // profiling in middle of a function and 'call' event is not
                // captured
                stack.push(current);
            } else {
                current.timeEnd = event.time;
                current.total = current.timeEnd - current.timeStart;
                current.self = current.total - _.sum(current.children.map(c => c.total));
                current.memEnd = event.mem;
            }
        }
    });

    root.timeStart = events[0].time;
    root.timeEnd = events[events.length - 1].time;
    root.total = root.timeEnd - root.timeStart;
    root.self = 0;

    topDownRoots = cleanupLooseEnds(root, statsMap, topDownRoots);

    return {
        topDownRoots,
        bottomUpRoots: Object.values(statsMap),
        root,
        memory,
    };
};

/**
 * profiling and functions do not have to be aligned so we have to clean up
 * @param root
 * @param statsMap
 * @param topDownRoots
 */
const cleanupLooseEnds = (root, statsMap, topDownRoots) => {
    const last = root.children.pop();
    if (last.timeEnd) {
        root.children.push(last);
    }

    Object.keys(statsMap).forEach(key => {
        statsMap[key].nodes = statsMap[key].nodes.filter(n => n.timeEnd);
        if (!statsMap[key].nodes.length) {
            delete statsMap[key];
        } else {
            addNodeStats(root.total)(statsMap[key]);
        }
    });
    return topDownRoots.filter(r => r.nodes.length);
};


const addNodeStats = (programTotal: number) => (node: StatsNode) => {
    node.self = _.sum(node.nodes.map(n => n.self));
    node.calls = node.nodes.length;
    node.total = _.sum(node.nodes.map(n => n.total));
    node.selfPerCall = node.self / node.calls;
    node.totalPerCall = node.total / node.calls;
    node.selfRelative = node.self / programTotal;
    node.selfPerCallRelative = node.selfPerCall / programTotal;
    node.totalRelative = node.total / programTotal;
    node.totalPerCallRelative = node.totalPerCall / programTotal;
};


const getNodeKey = node => {
    return node.file + node.func + node.line;
};

const parseEvents = (events: string) => {
    return events.split('\n').map(e => JSON.parse(e));
};

module.exports = {
    processCallTree,
    processEvents,
    parseEvents,
};
