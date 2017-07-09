const d3 = require('d3');
const React = require('react');
const PT = require('prop-types');
const { format } = require('../../utils/format');

class FlameTooltip extends React.PureComponent {
    static propTypes = {
        width: PT.number.isRequired,
        data: PT.object.isRequired,
        targetKey: PT.string.isRequired,
    };

    state = {
        tooltipPosition: {},
    };

    render() {
        const { tooltipPosition } = this.state;
        const { width, data, targetKey } = this.props;
        return (
            <div
                className="flame-tooltip"
                style={{
                    top: tooltipPosition.top || 0,
                    left: tooltipPosition.left || 0,
                    maxWidth: width,
                }}
                ref={el => {
                    if (el && tooltipPosition.top === undefined) {
                        const { width } = this.props;
                        const tooltipRect = el.getBoundingClientRect();
                        const tooltipTargetRect = d3
                            .select(`g#${targetKey}`)
                            .node()
                            .getBoundingClientRect();
                        const pos = computeTooltipPosition(
                            tooltipTargetRect,
                            tooltipRect,
                            width
                        );
                        this.setState({
                            tooltipPosition: pos,
                        });
                    }
                }}
            >
                <p>
                    <span className="flame-tooltip_main">
                        {data.func || 'program'}
                    </span>
                    <br />
                    <span className="flame-tooltip_secondary">
                        {data.file}#{data.line}
                    </span>
                </p>
                <div className="flame-tooltip_label-wrapper">
                    <div className="flame-tooltip_label">self:</div>
                    <div className="flame-tooltip_value">
                        {format(data.self)}
                    </div>
                </div>
                <div className="flame-tooltip_label-wrapper">
                    <div className="flame-tooltip_label">total:</div>
                    <div className="flame-tooltip_value">
                        {format(data.total)}
                    </div>
                </div>
            </div>
        );
    }
}

const computeTooltipPosition = (target, tooltip, width) => {
    const left = Math.max(
        Math.min(
            width - tooltip.width,
            target.left + target.width / 2 - tooltip.width / 2
        ),
        0
    );

    const offset = 10;

    let top = target.top - (tooltip.height + offset);
    if (top < 0) {
        top = target.top + target.height + offset;
    }

    return { top, left };
};

module.exports = FlameTooltip;
