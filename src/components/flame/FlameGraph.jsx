const _ = require('lodash');
const React = require('react');
const cx = require('classnames');
const PT = require('prop-types');
const d3 = require('d3');
const { TransitionMotion, spring } = require('react-motion');
const FlameItem = require('./FlameItem');

const frameHeight = 25;

const colors = [
    '#FFC940',
    '#FBC03D',
    '#F6B93B',
    '#F2B038',
    '#EDA835',
    '#E8A033',
    '#E39830',
    '#DF8F2D',
    '#DA872B',
    '#D47F28',
    '#CF7725',
    '#CA6E23',
    // '#C56620',
    // '#BF5E1D',
    // '#BA571B',
    // '#B54E18',
    // '#AF4515',
    // '#A93E13',
    // '#A43410',
    // '#9E2B0E',
];

class FlameGraph extends React.PureComponent {
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
        const colorScale = d3.scaleQuantize()
            .domain([0, treeLevels])
            .range(colors);

        return {
            scaleX: d3.scaleLinear().range([0, newProps.width]),
            scaleY: d3.scaleLinear().range([0, height]),
            scaleXPrev: d3.scaleLinear().range([0, newProps.width]),
            selected: null,
            height: height,
            descendants,
            colorScale,
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
            colorScale,
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
                willLeave={() => {
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
                            className="flame-graph"
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
                                    <FlameItem
                                        opacity={style.opacity}
                                        key={key}
                                        id={key}
                                        selected={item === selected}
                                        translateX={style.left}
                                        translateY={scaleY(item.y0)}
                                        onClick={() => {
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
                                        onMouseOver={() =>
                                            onMouseOver(key, item.data)}
                                        height={itemHeight}
                                        width={style.width}
                                        showLabel={this.bigEnoughForLabel(item)}
                                        label={itemLabel(item.data)}
                                        fill={colorScale(item.depth)}
                                    />
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

module.exports = FlameGraph;
