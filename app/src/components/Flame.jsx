const _ = require('lodash');
const React = require('react');
const PT = require('prop-types');
const flame = require('./flame.d3');
const d3 = require('d3');
const { TransitionMotion, spring } = require('react-motion');

const colorSelected = d3.color(`#FF4136`);
const colorDefault = d3.color(`#ffcea4`);

class Flame extends React.PureComponent {
    static propTypes = {
        tree: PT.object.isRequired,
    };

    state = {
        showTooltip: false,
    };

    render() {
        const { showTooltip, tooltipText, tooltipPosition } = this.state;
        const { tree } = this.props;
        return (
            <div className="flame" ref={el => this._el = el}>
                {showTooltip &&
                    <div
                        className="flame-tooltip"
                        style={{
                            top: tooltipPosition.top,
                            left: tooltipPosition.left,
                        }}
                    >
                        {tooltipText}
                    </div>}
                <FlameInternal
                    tree={tree}
                    onMouseOver={this.showTooltip}
                    onMouseOut={this.hideTooltip}
                />
            </div>
        );
    }

    showTooltip = (position, text) => {
        const left = position.left + position.width / 2;
        const top = position.top - 20;

        this.setState({
            showTooltip: true,
            tooltipText: text,
            tooltipPosition: { left, top },
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
        onMouseOver: PT.func.isRequired,
        onMouseOut: PT.func.isRequired,
    };

    constructor(props) {
        super(props);
        const root = d3.hierarchy(props.tree);
        root.sum(d => {
            return d.self ? d.self : 0;
        });
        const partition = d3.partition();
        this._descendants = partition(root).descendants();

        // number of levels
        const treeLevels = this._descendants[0].height;

        const levelHeight = 20;
        this._w = 700;
        this._h = treeLevels * levelHeight;

        this.state = {
            scaleX: d3.scaleLinear().range([0, this._w]),
            scaleY: d3.scaleLinear().range([0, this._h]),
            scaleXPrev: d3.scaleLinear().range([0, this._w]),
            selected: null,
        };

        // const trans = d3.transition().duration(250).ease(d3.easeCubicInOut);
        //
        // let svg = d3.select('svg.flame').attr('width', w).attr('height', h);
        // let tooltip = null;
    }

    componentDidMount() {
        // const tree = this.props.tree;
        // flame(tree)();
    }

    componentDidUpdate() {}

    // render() {
    //     return <svg className="flame" ref={el => this._el = el}/>;
    // }

    render() {
        const { scaleX, scaleY, scaleXPrev } = this.state;
        const { onMouseOut, onMouseOver } = this.props;
        const allItems = this._descendants.filter(d => {
            return (
                scaleX(d.x1) - scaleX(d.x0) > 2 &&
                scaleX(d.x0) < this._w &&
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
                    return this.getItemStyle(scaleXPrev)(style.data);
                }}
            >
                {interpolatedStyles => {
                    return (
                        <svg
                            className="flame-internal"
                            ref={el => this._el = el}
                            width={this._w}
                            height={this._h}
                        >
                            {interpolatedStyles.map(style => {
                                const item = style.data;
                                style = style.style;
                                return (
                                    <g
                                        opacity={style.opacity}
                                        key={item.data.start}
                                        className="flame-item"
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
                                                    .range([0, this._w]),
                                            })}
                                        onMouseOut={onMouseOut}
                                        onMouseOver={e =>
                                            onMouseOver(
                                                {
                                                    left: style.left,
                                                    width: style.width,
                                                    top: scaleY(item.y0),
                                                },
                                                item.data.func || 'program'
                                            )}
                                    >
                                        <rect
                                            stroke="white"
                                            height={scaleY(item.y1 - item.y0)}
                                            rx="2"
                                            ry="2"
                                            fill={this.getColor(item)}
                                            strokeWidth={2}
                                            width={style.width}
                                        />
                                        {this.bigEnoughForLabel(item)
                                            ? <foreignObject
                                                  height={scaleY(
                                                      item.y1 - item.y0
                                                  )}
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

    getColor = d => {
        if (d === this.state.selected) {
            return colorSelected;
        } else {
            return colorDefault;
        }
    };

    bigEnoughForLabel = d => {
        const { scaleX } = this.state;
        return scaleX(d.x1) - scaleX(d.x0) >= 20;
    };

    getItemWidth = scaleX => d => {
        const { selected, scaleX } = this.state;
        if (selected && selected.ancestors().includes(d)) {
            // if current group is ancestor of selected group it will be
            // 100% wide
            return this._w;
        } else {
            return scaleX(d.x1) - scaleX(d.x0);
        }
    };
}

const translate = (x, y) => `translate(${x}, ${y})`;

module.exports = Flame;
