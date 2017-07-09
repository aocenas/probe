const _ = require('lodash');
const React = require('react');
const PT = require('prop-types');
const { format, formatRelative } = require('../utils/format');

const sortFunctions = {
    self: (order: number) => (a, b) => (b.self - a.self) * order,
    selfPerCall: (order: number) => (a, b) =>
        (b.self / b.calls - a.self / a.calls) * order,
    total: (order: number) => (a, b) => (b.total - a.total) * order,
    totalPerCall: (order: number) => (a, b) =>
        (b.total / b.calls - a.total / a.calls) * order,
    calls: (order: number) => (a, b) => b.calls - a.calls * order,
};

class Tree extends React.Component {
    static propTypes = {
        roots: PT.arrayOf(PT.object).isRequired,
        sort: PT.string,
        desc: PT.bool,
        type: PT.oneOf(['top-down', 'bottom-up']),
        subtree: PT.bool,
        indent: PT.number,
        dataId: PT.string,
    };

    static defaultProps = {
        indent: 0,
    };

    state: {
        sort: string,
        desc: boolean,
    } = {};

    shouldComponentUpdate(nextProps, nextState) {
        const propsKeys = ['sort', 'desc', 'type', 'dataId'];
        const stateKeys = ['sort', 'desc'];
        return !(_.isEqual(
            _.pick(nextProps, propsKeys),
            _.pick(this.props, propsKeys)
        ) &&
            _.isEqual(
                _.pick(nextState, stateKeys),
                _.pick(this.state, stateKeys)
            ));
    }

    render() {
        const { roots, type, subtree, indent } = this.props;
        const sort = this.props.sort || this.state.sort;
        const desc = this.props.desc === undefined
            ? this.state.desc
            : this.props.desc;

        let dataSorted = roots;
        if (sort) {
            dataSorted = roots.sort(sortFunctions[sort](desc ? 1 : -1));
        }

        return (
            <ul className="tree">
                {!subtree &&
                    <li className="tree_header">
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
                {dataSorted.map(node => (
                    <TreeNode
                        key={node.key}
                        node={node}
                        indent={indent}
                        sort={sort}
                        desc={desc}
                        type={type}
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
        node: PT.object.isRequired,
        indent: PT.number,
        sort: PT.string,
        desc: PT.bool,
        type: PT.oneOf(['top-down', 'bottom-up']),
        dataId: PT.string,
    };

    state = {
        expanded: false,
    };

    shouldComponentUpdate(nextProps, nextState) {
        const propsKeys = ['sort', 'desc', 'type', 'dataId'];
        const stateKeys = ['expanded'];
        return !(_.isEqual(
            _.pick(nextProps, propsKeys),
            _.pick(this.props, propsKeys)
        ) &&
            _.isEqual(
                _.pick(nextState, stateKeys),
                _.pick(this.state, stateKeys)
            ));
    }

    render() {
        const { node, indent, sort, desc, type, dataId } = this.props;
        const { expanded } = this.state;
        const edgeType = type === 'top-down' ? 'children' : 'parents';

        let icon = (
            <span
                className="pt-icon pt-icon-caret-down"
                style={{ visibility: 'hidden' }}
            />
        );
        let children = null;
        if (node[edgeType] && node[edgeType].length) {
            if (expanded) {
                icon = <span className="pt-icon pt-icon-caret-down" />;
                children = (
                    <Tree
                        roots={node[edgeType]}
                        indent={indent + 1}
                        sort={sort}
                        desc={desc}
                        type={type}
                        subtree={true}
                        dataId={dataId}
                    />
                );
            } else {
                icon = <span className="pt-icon pt-icon-caret-right" />;
            }
        }

        const percent = Math.round(node.totalRelative * 100) / 100;
        const color = `rgba(0, 0, 0, ${percent * 0.6 + 0.1})`;

        return (
            <li className="tree-node">

                <div onClick={() => this.setState({ expanded: !expanded })}>
                    <div className="column-fixed">
                        <div className="value">{format(node.self, 6)}</div>
                        <div className="percentage">
                            {formatRelative(node.selfRelative)}
                        </div>
                    </div>
                    <div className="column-fixed">
                        <div className="value">
                            {format(node.selfPerCall, 6)}
                        </div>
                        <div className="percentage">
                            {formatRelative(node.selfPerCallRelative)}
                        </div>
                    </div>
                    <div className="column-fixed">
                        <div className="value">{format(node.total, 6)}</div>
                        <div className="percentage">
                            {formatRelative(node.totalRelative)}
                        </div>
                    </div>
                    <div className="column-fixed">
                        <div className="value">
                            {format(node.totalPerCall, 6)}
                        </div>
                        <div className="percentage">
                            {formatRelative(node.totalPerCallRelative)}
                        </div>
                    </div>
                    <div className="column-fixed small">
                        <div className="value">{node.calls}</div>
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
                            {node.nodes[0].func}
                        </div>
                    </div>

                    <div className="path">
                        {node.nodes[0].file}#{node.nodes[0].line}
                    </div>
                </div>

                {children}

            </li>
        );
    }
}

module.exports = Tree;
