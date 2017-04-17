const React = require('react');

const sortFunctions = {
    self: (order: number) => (a, b) =>
        Math.round((b.self - a.self) * 10000) * order,
    selfPerCall: (order: number) => (a, b) =>
        Math.round((b.self / b.calls - a.self / a.calls), 10000) * order,
    total: (order: number) => (a, b) =>
        Math.round((b.total - a.total) * 10000) * order,
    totalPerCall: (order: number) => (a, b) =>
        Math.round((b.total / b.calls - a.total / a.calls) * 10000) * order,
};

class Tree extends React.Component {
    static propTypes = {
        data: React.PropTypes.array.isRequired,
        onClick: React.PropTypes.func.isRequired,
        index: React.PropTypes.arrayOf(React.PropTypes.number),
        sort: React.PropTypes.string,
        desc: React.PropTypes.bool,
    };

    state: {
        sort: string,
        desc: boolean,
    } = {};

    render() {
        const { data, onClick } = this.props;
        const sort = this.props.sort || this.state.sort;
        const desc = this.props.desc === undefined
            ? this.state.desc
            : this.props.desc;
        const indexTree = this.props.index || [];
        let dataSorted = data;
        if (sort) {
            dataSorted = [...data].sort(sortFunctions[sort](desc ? 1 : -1));
        }

        return (
            <ul className="tree">
                {indexTree.length === 0 &&
                    <li className="header">
                        <div className="fixed" onClick={this._setSort('self')}>
                            {this._sortIcon('self')} Self
                        </div>
                        <div
                            className="fixed"
                            onClick={this._setSort('selfPerCall')}
                        >
                            {this._sortIcon('selfPerCall')} Self/calls
                        </div>
                        <div className="fixed" onClick={this._setSort('total')}>
                            {this._sortIcon('total')} Total
                        </div>
                        <div
                            className="fixed"
                            onClick={this._setSort('totalPerCall')}
                        >
                            {this._sortIcon('totalPerCall')} Total/calls
                        </div>
                        <div>Function</div>
                    </li>}
                {dataSorted.map((node, index) => (
                    <TreeNode
                        key={node.id}
                        node={node}
                        onClick={onClick}
                        index={[...indexTree, index]}
                        sort={sort}
                    />
                ))}
            </ul>
        );
    }

    _sortIcon(sort) {
        return this.state.sort === sort
            ? this.state.desc
                  ? <span className="pt-icon pt-icon-sort-desc" />
                  : <span className="pt-icon pt-icon-sort-asc" />
            : <span className="pt-icon pt-icon-sort" />;
    }

    _setSort = sort => () => {
        if (this.state.sort === sort) {
            this.setState({ desc: !this.state.desc });
        } else {
            this.setState({ desc: true, sort });
        }
    };
}

class TreeNode extends React.Component {
    static propTypes = {
        node: React.PropTypes.object.isRequired,
        onClick: React.PropTypes.func.isRequired,
        index: React.PropTypes.arrayOf(React.PropTypes.number),
    };

    render() {
        const { node, onClick, index } = this.props;
        const indent = index.length;
        let icon = null;
        let children = null;
        if (node.childNodes) {
            if (node.isExpanded) {
                icon = <span className="pt-icon pt-icon-caret-down" />;
                children = (
                    <Tree
                        data={node.childNodes}
                        onClick={onClick}
                        index={index}
                    />
                );
            } else {
                icon = <span className="pt-icon pt-icon-caret-right" />;
            }
        }

        return (
            <li className="tree-node">

                <div onClick={() => onClick(node, index)}>
                    <div className="column-fixed">{format(node.self, 6)}</div>
                    <div className="column-fixed">
                        {format(node.self / node.calls, 6)}
                    </div>
                    <div className="column-fixed">{format(node.total, 6)}</div>
                    <div className="column-fixed">
                        {format(node.total / node.calls, 6)}
                    </div>
                    <div
                        style={{ paddingLeft: indent * 20 + (!icon ? 12 : 0) }}
                        className={'func'}
                    >
                        {icon}{node.func}
                    </div>

                    <div className="path">
                        {node.file}#{node.line}
                    </div>
                </div>

                {children}

            </li>
        );
    }
}

const format = number => {
    let ms;
    if (number > 1) {
        ms = Math.round(number * 1000);
    } else {
        ms = Math.round(number * 10000) / 10;
    }
    return `${ms.toLocaleString()}ms`;
};

module.exports = Tree;
