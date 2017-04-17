const React = require('react');
const cx = require('classnames');

class Tree extends React.Component {
    static propTypes = {
        data: React.PropTypes.array.isRequired,
        onClick: React.PropTypes.func.isRequired,
        index: React.PropTypes.arrayOf(React.PropTypes.number),
    };

    render() {
        const { data, onClick } = this.props;
        const indexTree = this.props.index || [];

        return (
            <ul className="tree">
                {indexTree.length === 0 &&
                    <li className="header">
                        <div className="fixed">Self</div>
                        <div className="fixed">Self per call</div>
                        <div className="fixed">Total</div>
                        <div className="fixed">Total per call</div>
                        <div>Function</div>
                    </li>}
                {data.map((node, index) => (
                    <TreeNode
                        key={node.id}
                        node={node}
                        onClick={onClick}
                        index={[...indexTree, index]}
                    />
                ))}
            </ul>
        );
    }
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
                    <div className="column-fixed">{round(node.self, 6)}</div>
                    <div className="column-fixed">
                        {round(node.self / node.calls, 6)}
                    </div>
                    <div className="column-fixed">{round(node.total, 6)}</div>
                    <div className="column-fixed">
                        {round(node.total / node.calls, 6)}
                    </div>
                    <div
                        style={{ paddingLeft: indent * 10 }}
                        className={cx('func', {'no-icon': !icon})}
                    >
                        {icon} {node.func}
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

const round = (number, precision) => {
    const factor = Math.pow(10, precision);
    const tempNumber = number * factor;
    const roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
};

module.exports = Tree;
