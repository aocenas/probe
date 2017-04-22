const React = require('react');

const sortFunctions = {
    self: (order: number) => (a, b) =>
        (b.perfNode.self - a.perfNode.self) * order,
    selfPerCall: (order: number) => (a, b) =>
        (b.perfNode.self / b.perfNode.calls -
            a.perfNode.self / a.perfNode.calls) *
        order,
    total: (order: number) => (a, b) =>
        (b.perfNode.total - a.perfNode.total) * order,
    totalPerCall: (order: number) => (a, b) =>
        (b.perfNode.total / b.perfNode.calls -
            a.perfNode.total / a.perfNode.calls) *
        order,
    calls: (order: number) => (a, b) =>
        b.perfNode.calls - a.perfNode.calls * order,
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
                            {this._sortIcon('selfPerCall')} Self/Calls
                        </div>
                        <div className="fixed" onClick={this._setSort('total')}>
                            {this._sortIcon('total')} Total
                        </div>
                        <div
                            className="fixed"
                            onClick={this._setSort('totalPerCall')}
                        >
                            {this._sortIcon('totalPerCall')} Total/Calls
                        </div>
                        <div
                            className="fixed small"
                            onClick={this._setSort('calls')}
                        >
                            {this._sortIcon('calls')} Calls
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
                        desc={desc}
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
        sort: React.PropTypes.string,
        desc: React.PropTypes.bool,
    };

    render() {
        const { node, onClick, index, sort, desc } = this.props;
        const { perfNode } = node;
        const indent = index.length - 1;
        let icon = (
            <span
                className="pt-icon pt-icon-caret-down"
                style={{ visibility: 'hidden' }}
            />
        );
        let children = null;
        if (node.childNodes) {
            if (node.isExpanded) {
                icon = <span className="pt-icon pt-icon-caret-down" />;
                children = (
                    <Tree
                        data={node.childNodes}
                        onClick={onClick}
                        index={index}
                        sort={sort}
                        desc={desc}
                    />
                );
            } else {
                icon = <span className="pt-icon pt-icon-caret-right" />;
            }
        }

        const percent = Math.round(perfNode.totalRelative * 100) / 100;
        const color = `rgba(0, 0, 0, ${percent * 0.6 + 0.1})`;

        return (
            <li className="tree-node">

                <div onClick={() => onClick(node, index)}>
                    <div className="column-fixed">
                        <div className="value">{format(perfNode.self, 6)}</div>
                        <div className="percentage">
                            {formatRelative(perfNode.selfRelative)}
                        </div>
                    </div>
                    <div className="column-fixed">
                        <div className="value">
                            {format(perfNode.selfPerCall, 6)}
                        </div>
                        <div className="percentage">
                            {formatRelative(perfNode.selfPerCallRelative)}
                        </div>
                    </div>
                    <div className="column-fixed">
                        <div className="value">{format(perfNode.total, 6)}</div>
                        <div className="percentage">
                            {formatRelative(perfNode.totalRelative)}
                        </div>
                    </div>
                    <div className="column-fixed">
                        <div className="value">
                            {format(perfNode.totalPerCall, 6)}
                        </div>
                        <div className="percentage">
                            {formatRelative(perfNode.totalPerCallRelative)}
                        </div>
                    </div>
                    <div className="column-fixed small">
                        <div className="value">{perfNode.calls}</div>
                    </div>
                    <div
                        style={{ paddingLeft: indent * 20 }}
                        className={'func'}
                    >
                        <div
                            style={{
                                borderLeft: `2px solid ${color}`,
                                paddingLeft: 5,
                            }}
                        >
                            {icon}
                            {perfNode.func}
                        </div>
                    </div>

                    <div className="path">
                        {perfNode.file}#{perfNode.line}
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

const formatRelative = number => {
    let percent = Math.round(number * 1000) / 10;
    return `${percent}%`;
};

module.exports = Tree;
