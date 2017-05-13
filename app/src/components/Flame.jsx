/* global window */
const _ = require('lodash');
const React = require('react');
const cx = require('classnames');
const PT = require('prop-types');
const flame = require('./flame.d3');
const d3 = require('d3');
const { TransitionMotion, spring } = require('react-motion');

const frameHeight = 25;

class Flame extends React.PureComponent {
    static propTypes = {
        tree: PT.object.isRequired,
    };

    state = {
        showTooltip: false,
    };

    onResize = () => {
        this.timer && clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.setState({
                width: this._el.getBoundingClientRect().width,
            });
        }, 100);
    };

    componentDidMount() {
        this.setState({
            width: this._el.getBoundingClientRect().width,
        });
        window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    render() {
        const { showTooltip, tooltipText, tooltipPosition, width } = this.state;
        const { tree } = this.props;
        return (
            <div className="flame" ref={el => this._el = el}>
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
                                const { tooltipTarget, width } = this.state;
                                const tooltipRect = el.getBoundingClientRect();

                                const left = Math.max(
                                    Math.min(
                                        width - tooltipRect.width,
                                        tooltipTarget.left +
                                            tooltipTarget.width / 2 -
                                            tooltipRect.width / 2
                                    ),
                                    0
                                );

                                const offset = 10;

                                let top =
                                    tooltipTarget.top -
                                    (tooltipRect.height + offset);
                                if (top < 0) {
                                    top =
                                        tooltipTarget.top +
                                        tooltipTarget.height +
                                        offset;
                                }

                                this.setState({
                                    tooltipPosition: { left, top },
                                });
                            }
                        }}
                    >
                        {tooltipText}
                    </div>}
                <FlameInternal
                    tree={tree}
                    onMouseOver={this.showTooltip}
                    onMouseOut={this.hideTooltip}
                    width={width || 500}
                />
            </div>
        );
    }

    showTooltip = (position, text) => {
        this.setState({
            showTooltip: true,
            tooltipText: text,
            tooltipTarget: position,
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
        tree: PT.object.isRequired,
        width: PT.number.isRequired,
        onMouseOver: PT.func.isRequired,
        onMouseOut: PT.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = this.getSetup(props);
    }

    componentWillReceiveProps(newProps) {
        if (
            newProps.tree !== this.props.tree ||
            newProps.width !== this.props.width
        ) {
            this.setState(this.getSetup(newProps));
        }
    }

    getSetup(newProps) {
        const root = d3.hierarchy(newProps.tree);
        root.sum(d => {
            return d.self ? d.self : 0;
        });
        const partition = d3.partition();
        const descendants = partition(root).descendants();

        // number of levels
        const treeLevels = descendants[0].height;

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

    componentDidMount() {
        // const tree = this.props.tree;
        // flame(tree)();
    }

    componentDidUpdate() {}

    render() {
        const {
            scaleX,
            scaleY,
            scaleXPrev,
            descendants,
            height,
            selected,
        } = this.state;
        const { onMouseOut, onMouseOver, width } = this.props;
        const allItems = descendants.filter(d => {
            return (
                scaleX(d.x1) - scaleX(d.x0) > 2 &&
                scaleX(d.x0) < width &&
                scaleX(d.x1) > 0
            );
        });
        return (
            <TransitionMotion
                styles={allItems.map(item => {
                    let style = this.getItemStyle(scaleX)(item);
                    style = _.mapValues(style, val =>
                        spring(val, { stiffness: 300, damping: 30 })
                    );
                    return {
                        key: item.data.start.toString(),
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
                            ref={el => this._el = el}
                            width={width}
                            height={height}
                        >
                            {interpolatedStyles.map(style => {
                                const item = style.data;
                                style = style.style;
                                const itemHeight = scaleY(item.y1 - item.y0);
                                return (
                                    <g
                                        opacity={style.opacity}
                                        key={item.data.start}
                                        className={cx('flame-item', {
                                            selected: item === selected,
                                        })}
                                        transform={translate(
                                            style.left,
                                            scaleY(item.y0)
                                        )}
                                        onClick={e =>
                                            this.setState({
                                                selected: item,
                                                scaleXPrev: scaleX,
                                                scaleX: d3
                                                    .scaleLinear()
                                                    .domain([item.x0, item.x1])
                                                    .range([0, width]),
                                            })}
                                        onMouseOut={onMouseOut}
                                        onMouseOver={e =>
                                            onMouseOver(
                                                {
                                                    left: style.left,
                                                    width: style.width,
                                                    top: scaleY(item.y0),
                                                    height: itemHeight,
                                                },
                                                item.data.func || 'program'
                                            )}
                                    >
                                        <rect
                                            stroke="white"
                                            height={itemHeight}
                                            rx="2"
                                            ry="2"
                                            strokeWidth={3}
                                            width={style.width}
                                        />
                                        {this.bigEnoughForLabel(item)
                                            ? <foreignObject
                                                  height={itemHeight}
                                                  width={style.width}
                                              >
                                                  <div className="flame-label">
                                                      {item.data.func ||
                                                          'program'}
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

const translate = (x, y) => `translate(${x}, ${y})`;

module.exports = Flame;
