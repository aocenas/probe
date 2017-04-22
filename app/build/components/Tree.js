const React = require('react');

const sortFunctions = {
    self: order => (a, b) => (b.perfNode.self - a.perfNode.self) * order,
    selfPerCall: order => (a, b) => (b.perfNode.self / b.perfNode.calls - a.perfNode.self / a.perfNode.calls) * order,
    total: order => (a, b) => (b.perfNode.total - a.perfNode.total) * order,
    totalPerCall: order => (a, b) => (b.perfNode.total / b.perfNode.calls - a.perfNode.total / a.perfNode.calls) * order,
    calls: order => (a, b) => b.perfNode.calls - a.perfNode.calls * order
};

class Tree extends React.Component {
    constructor(...args) {
        var _temp;

        return _temp = super(...args), this.state = {}, this._setSort = sort => () => {
            if (this.state.sort === sort) {
                this.setState({ desc: !this.state.desc });
            } else {
                this.setState({ desc: true, sort });
            }
        }, _temp;
    }

    render() {
        const { data, onClick } = this.props;
        const sort = this.props.sort || this.state.sort;
        const desc = this.props.desc === undefined ? this.state.desc : this.props.desc;
        const indexTree = this.props.index || [];
        let dataSorted = data;
        if (sort) {
            dataSorted = [...data].sort(sortFunctions[sort](desc ? 1 : -1));
        }

        return React.createElement(
            "ul",
            { className: "tree" },
            indexTree.length === 0 && React.createElement(
                "li",
                { className: "header" },
                React.createElement(
                    "div",
                    { className: "fixed", onClick: this._setSort('self') },
                    this._sortIcon('self'),
                    " Self"
                ),
                React.createElement(
                    "div",
                    {
                        className: "fixed",
                        onClick: this._setSort('selfPerCall')
                    },
                    this._sortIcon('selfPerCall'),
                    " Self/Calls"
                ),
                React.createElement(
                    "div",
                    { className: "fixed", onClick: this._setSort('total') },
                    this._sortIcon('total'),
                    " Total"
                ),
                React.createElement(
                    "div",
                    {
                        className: "fixed",
                        onClick: this._setSort('totalPerCall')
                    },
                    this._sortIcon('totalPerCall'),
                    " Total/Calls"
                ),
                React.createElement(
                    "div",
                    {
                        className: "fixed small",
                        onClick: this._setSort('calls')
                    },
                    this._sortIcon('calls'),
                    " Calls"
                ),
                React.createElement(
                    "div",
                    null,
                    "Function"
                )
            ),
            dataSorted.map((node, index) => React.createElement(TreeNode, {
                key: node.id,
                node: node,
                onClick: onClick,
                index: [...indexTree, index],
                sort: sort,
                desc: desc
            }))
        );
    }

    _sortIcon(sort) {
        return this.state.sort === sort ? this.state.desc ? React.createElement("span", { className: "pt-icon pt-icon-sort-desc" }) : React.createElement("span", { className: "pt-icon pt-icon-sort-asc" }) : React.createElement("span", { className: "pt-icon pt-icon-sort" });
    }

}

Tree.propTypes = {
    data: React.PropTypes.array.isRequired,
    onClick: React.PropTypes.func.isRequired,
    index: React.PropTypes.arrayOf(React.PropTypes.number),
    sort: React.PropTypes.string,
    desc: React.PropTypes.bool
};
class TreeNode extends React.Component {

    render() {
        const { node, onClick, index, sort, desc } = this.props;
        const { perfNode } = node;
        const indent = index.length - 1;
        let icon = React.createElement("span", {
            className: "pt-icon pt-icon-caret-down",
            style: { visibility: 'hidden' }
        });
        let children = null;
        if (node.childNodes) {
            if (node.isExpanded) {
                icon = React.createElement("span", { className: "pt-icon pt-icon-caret-down" });
                children = React.createElement(Tree, {
                    data: node.childNodes,
                    onClick: onClick,
                    index: index,
                    sort: sort,
                    desc: desc
                });
            } else {
                icon = React.createElement("span", { className: "pt-icon pt-icon-caret-right" });
            }
        }

        const percent = Math.round(perfNode.totalRelative * 100) / 100;
        const color = `rgba(0, 0, 0, ${percent * 0.6 + 0.1})`;

        return React.createElement(
            "li",
            { className: "tree-node" },
            React.createElement(
                "div",
                { onClick: () => onClick(node, index) },
                React.createElement(
                    "div",
                    { className: "column-fixed" },
                    React.createElement(
                        "div",
                        { className: "value" },
                        format(perfNode.self, 6)
                    ),
                    React.createElement(
                        "div",
                        { className: "percentage" },
                        formatRelative(perfNode.selfRelative)
                    )
                ),
                React.createElement(
                    "div",
                    { className: "column-fixed" },
                    React.createElement(
                        "div",
                        { className: "value" },
                        format(perfNode.selfPerCall, 6)
                    ),
                    React.createElement(
                        "div",
                        { className: "percentage" },
                        formatRelative(perfNode.selfPerCallRelative)
                    )
                ),
                React.createElement(
                    "div",
                    { className: "column-fixed" },
                    React.createElement(
                        "div",
                        { className: "value" },
                        format(perfNode.total, 6)
                    ),
                    React.createElement(
                        "div",
                        { className: "percentage" },
                        formatRelative(perfNode.totalRelative)
                    )
                ),
                React.createElement(
                    "div",
                    { className: "column-fixed" },
                    React.createElement(
                        "div",
                        { className: "value" },
                        format(perfNode.totalPerCall, 6)
                    ),
                    React.createElement(
                        "div",
                        { className: "percentage" },
                        formatRelative(perfNode.totalPerCallRelative)
                    )
                ),
                React.createElement(
                    "div",
                    { className: "column-fixed small" },
                    React.createElement(
                        "div",
                        { className: "value" },
                        perfNode.calls
                    )
                ),
                React.createElement(
                    "div",
                    {
                        style: { paddingLeft: indent * 20 },
                        className: 'func'
                    },
                    React.createElement(
                        "div",
                        {
                            style: {
                                borderLeft: `2px solid ${color}`,
                                paddingLeft: 5
                            }
                        },
                        icon,
                        perfNode.func
                    )
                ),
                React.createElement(
                    "div",
                    { className: "path" },
                    perfNode.file,
                    "#",
                    perfNode.line
                )
            ),
            children
        );
    }
}

TreeNode.propTypes = {
    node: React.PropTypes.object.isRequired,
    onClick: React.PropTypes.func.isRequired,
    index: React.PropTypes.arrayOf(React.PropTypes.number),
    sort: React.PropTypes.string,
    desc: React.PropTypes.bool
};
const format = number => {
    let ms;
    if (number > 1) {
        ms = Math.round(number * 1000);
    } else {
        ms = Math.round(number * 10000) / 10;
    }
    return `${ms.toLocaleString()}ms`;
};

const formatRelative = number => {
    let percent = Math.round(number * 1000) / 10;
    return `${percent}%`;
};

module.exports = Tree;