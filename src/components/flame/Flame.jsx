const React = require('react');
const PT = require('prop-types');
const FlameTooltip = require('./FlameTooltip');
const FlameGraph = require('./FlameGraph');

class Flame extends React.PureComponent {
    static propTypes = {
        root: PT.object.isRequired,
        width: PT.number.isRequired,
        onClick: PT.func.isRequired,
    };

    state = {
        showTooltip: false,
    };

    render() {
        const { showTooltip, tooltipData, tooltipTarget } = this.state;
        const { root, width } = this.props;
        return (
            <div className="flame" ref={el => (this._el = el)}>
                {showTooltip &&
                    <FlameTooltip
                        data={tooltipData}
                        width={width}
                        targetKey={tooltipTarget}
                    />
                }
                <FlameGraph
                    root={root}
                    onMouseOver={this.showTooltip}
                    onMouseOut={this.hideTooltip}
                    width={width || 500}
                    onClick={this.props.onClick}
                />
            </div>
        );
    }

    showTooltip = (key, itemData) => {
        this.setState({
            showTooltip: true,
            tooltipData: itemData,
            tooltipTarget: key,
        });
    };

    hideTooltip = () => {
        this.setState({
            showTooltip: false,
        });
    };
}

module.exports = Flame;
