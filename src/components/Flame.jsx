const _ = require('lodash');
const React = require('react');
const cx = require('classnames');
const PT = require('prop-types');
const d3 = require('d3');
const { TransitionMotion, spring } = require('react-motion');
const { format } = require('../utils/format');

const frameHeight = 25;

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
        const { showTooltip, tooltipData, tooltipPosition } = this.state;
        const { root, width } = this.props;
        return (
            <div className="flame" ref={el => (this._el = el)}>
                {showTooltip &&
                    <div
                        className="flame-tooltip"
                        style={{
                            top: tooltipPosition.top,
                            left: tooltipPosition.left,
                            maxWidth: this.state.width,
                        }}
                        ref={el => {
                            if (
                                el &&
                                this.state.tooltipPosition.top === undefined
                            ) {
                                const { tooltipTarget } = this.state;
                                const { width } = this.props;
                                const tooltipRect = el.getBoundingClientRect();
                                const tooltipTargetRect = d3
                                    .select(`g#${tooltipTarget}`)
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
                            <span className="tooltip-main">
                                {tooltipData.func || 'program'}
                            </span>
                            <br />
                            <span className="tooltip-secondary">
                                {tooltipData.file}#{tooltipData.line}
                            </span>
                        </p>
                        <div className="tooltip-label-wrapper">
                            <div className="tooltip-label">self:</div>
                            <div className="tooltip-value">
                                {format(tooltipData.self)}
                            </div>
                        </div>
                        <div className="tooltip-label-wrapper">
                            <div className="tooltip-label">total:</div>
                            <div className="tooltip-value">
                                {format(tooltipData.total)}
                            </div>
                        </div>
                    </div>}
                <FlameInternal
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
            tooltipPosition: {},
        });
    };

    hideTooltip = () => {
        this.setState({
            showTooltip: false,
        });
    };
}

class FlameInternal extends React.PureComponent {
    static propTypes = {
        root: PT.object.isRequired,
        width: PT.number.isRequired,
        onMouseOver: PT.func.isRequired,
        onMouseOut: PT.func.isRequired,
        onClick: PT.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = this.getSetup(props);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.root !== this.props.root) {
            this.setState({
                ...this.getSetup(newProps),
                animate: false,
            });
        } else if (newProps.width !== this.props.width) {
            this.setState({
                scaleX: this.state.scaleX.range([0, newProps.width]),
                animate: false,
            });
        }
    }

    getSetup(newProps) {
        const root = d3.hierarchy(newProps.root);
        root.sum(d => {
            return d.self ? d.self : 0;
        });
        const partition = d3.partition();
        const descendants = partition(root).descendants();

        // number of levels
        const treeLevels = descendants[0].height + 1;

        const height = treeLevels * frameHeight;

        return {
            scaleX: d3.scaleLinear().range([0, newProps.width]),
            scaleY: d3.scaleLinear().range([0, height]),
            scaleXPrev: d3.scaleLinear().range([0, newProps.width]),
            selected: null,
            height: height,
            descendants,
        };
    }

    render() {
        const {
            scaleX,
            scaleY,
            scaleXPrev,
            descendants,
            height,
            selected,
            animate,
        } = this.state;
        const { onMouseOut, onMouseOver, width } = this.props;
        const allItems = descendants.filter(d => {
            return (
                // filter smaller rects
                scaleX(d.x1) - scaleX(d.x0) > 5 &&
                // filter rects outside of the view
                scaleX(d.x0) < width &&
                scaleX(d.x1) > 0
            );
        });
        return (
            <TransitionMotion
                styles={allItems.map(item => {
                    let style = this.getItemStyle(scaleX)(item);
                    if (animate) {
                        style = _.mapValues(style, val =>
                            spring(val, { stiffness: 300, damping: 30 })
                        );
                    }
                    return {
                        key: itemKey(item.data),
                        data: item,
                        style,
                    };
                })}
                willLeave={style => {
                    return null;
                }}
                willEnter={style => {
                    const prevStyle = this.getItemStyle(scaleXPrev)(style.data);
                    const newStyle = this.getItemStyle(scaleX)(style.data);
                    const comesFromLeft = prevStyle.left < 0;
                    const comesFromRight = prevStyle.left > width;
                    if (!(comesFromLeft || comesFromRight)) {
                        // if it should have been on screen but was too small
                        // interpolate properly
                        return prevStyle;
                    } else {
                        // otherwise move it just from outside of the flame
                        // graph with final width
                        return {
                            left: comesFromLeft
                                ? newStyle.left - width
                                : width + newStyle.left,
                            width: newStyle.width,
                        };
                    }
                }}
            >
                {interpolatedStyles => {
                    return (
                        <svg
                            className="flame-internal"
                            ref={el => (this._el = el)}
                            width={width}
                            height={height}
                        >
                            {interpolatedStyles.map(style => {
                                const { data: item } = style;
                                style = style.style;
                                const itemHeight = scaleY(item.y1 - item.y0);
                                const key = itemKey(item.data);

                                return (
                                    <g
                                        opacity={style.opacity}
                                        key={key}
                                        id={key}
                                        className={cx('flame-item', {
                                            selected: item === selected,
                                        })}
                                        transform={translate(
                                            style.left,
                                            scaleY(item.y0)
                                        )}
                                        onClick={e => {
                                            this.setState({
                                                selected: item,
                                                scaleXPrev: scaleX,
                                                scaleX: d3
                                                    .scaleLinear()
                                                    .domain([item.x0, item.x1])
                                                    .range([0, width]),
                                                animate: true,
                                            });
                                            this.props.onClick([
                                                item.data.timeStart,
                                                item.data.timeEnd,
                                            ]);
                                        }}
                                        onMouseOut={onMouseOut}
                                        onMouseOver={e =>
                                            onMouseOver(key, item.data)}
                                    >
                                        <rect
                                            stroke="white"
                                            height={itemHeight}
                                            rx="4"
                                            ry="4"
                                            strokeWidth={3}
                                            width={style.width}
                                        />
                                        {this.bigEnoughForLabel(item)
                                            ? <foreignObject
                                                  height={itemHeight}
                                                  width={style.width}
                                              >
                                                  <div className="flame-label">
                                                      {itemLabel(item.data)}
                                                  </div>
                                              </foreignObject>
                                            : null}
                                    </g>
                                );
                            })}
                        </svg>
                    );
                }}
            </TransitionMotion>
        );
    }

    getItemStyle = scaleX => d => {
        const { selected } = this.state;
        return {
            left: selected && selected.ancestors().includes(d)
                ? 0
                : scaleX(d.x0),
            width: this.getItemWidth(scaleX)(d),
        };
    };

    bigEnoughForLabel = d => {
        const { scaleX } = this.state;
        return scaleX(d.x1) - scaleX(d.x0) >= 20;
    };

    getItemWidth = scaleX => d => {
        const { selected, scaleX } = this.state;
        const { width } = this.props;
        if (selected && selected.ancestors().includes(d)) {
            // if current group is ancestor of selected group it will be
            // 100% wide
            return width;
        } else {
            return scaleX(d.x1) - scaleX(d.x0);
        }
    };
}

const itemLabel = item => item.func || 'program';
const itemKey = item =>
    `${itemLabel(item)}${item.timeStart}`
        .split('.')
        .join('')
        .split('<')
        .join('')
        .split('>')
        .join('')
        .split(':')
        .join('');

const translate = (x, y) => `translate(${x}, ${y})`;

module.exports = Flame;
