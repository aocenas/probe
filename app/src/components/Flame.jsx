const React = require('react');
const { Tooltip } = require('@blueprintjs/core');
const _ = require('lodash');

class Flame extends React.Component {
    render() {
        const { tree } = this.props;
        let levels = [];
        let queue = [tree];
        let diff = tree.end - tree.start;

        const normalize = num => (num - tree.start) / diff;

        while (queue.length) {
            levels.push([...queue]);
            queue = _.flatMap(queue, item => item.children);
        }

        levels = levels.slice(1);

        return (
            <div className="flame">
                {levels.map((level, index) => (
                    <div
                        key={index}
                        className="level"
                    >
                        {level.map((item, index) => {
                            return (
                                <div
                                    className="item"
                                    style={{
                                        left: normalize(item.start) * 100 + '%',
                                        width: (item.end - item.start) /
                                            diff *
                                            100 +
                                            '%',
                                    }}
                                >
                                    <Tooltip
                                        key={index}
                                        content={item.func}
                                    >
                                        <div className="item-content">
                                            {item.func}
                                        </div>
                                    </Tooltip>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    }
}

module.exports = Flame;
