const _ = require('lodash');
const React = require('react');
const PT = require('prop-types');
const d3 = require('d3');
const { LinePath } = require('@vx/shape');
const { Marker } = require('@vx/marker');
const downsample = require('../utils/downsample');
const { getClosestY, getDataSlice } = require('../utils/graph');

const x = d => d.time;
const y = d => d.val;

class MemoryGraph extends React.Component {
    static propTypes = {
        memoryData: PT.array.isRequired,
        width: PT.number.isRequired,
        domain: PT.array,
    };

    state = {
        showMarker: false,
        markerX: null,
    };

    render() {
        let { memoryData, width, domain } = this.props;
        let { showMarker, markerX } = this.state;
        if (!width) {
            return null;
        }

        domain = domain || d3.extent(memoryData, x);

        const scaleX = d3.scaleLinear().domain(domain).rangeRound([0, width]);

        const scaleY = d3
            .scaleLinear()
            .domain(d3.extent(memoryData, y))
            .rangeRound([50, 1]);

        let sampledData = getDataSlice(domain, memoryData, x);
        sampledData = downsample(
            sampledData.map(d => [x(d), y(d)]),
            Math.floor(width / 2)
        );
        sampledData = sampledData.map(d => ({ time: d[0], val: d[1] }));

        let markerLabel;
        if (showMarker && markerX) {
            markerLabel = getClosestY(markerX, scaleX, sampledData, x, y);
        }
        return (
            <svg
                ref={el => (this._el = el)}
                className="memory-graph"
                width={width}
                height={50}
                shapeRendering={'crispEdges'}
                onMouseOver={e => {
                    this.setState({ showMarker: true });
                }}
                onMouseMove={e => {
                    if (showMarker) {
                        const pos =
                            e.clientX - this._el.getBoundingClientRect().left;
                        this.setState({ markerX: pos });
                    }
                }}
                onMouseOut={e => {
                    if (!(e.relatedTarget && isPartOfGraph(e.relatedTarget))) {
                        this.setState({
                            showMarker: false,
                            markerX: null,
                        });
                    }
                }}
            >
                <LinePath
                    data={sampledData}
                    xScale={scaleX}
                    yScale={scaleY}
                    x={x}
                    y={y}
                    curve={d3.curveStep}
                    strokeWidth="2"
                />
                {showMarker &&
                    markerLabel &&
                    <Marker
                        from={{ x: markerX, y: 50 }}
                        to={{ x: markerX, y: 0 }}
                        stroke={'black'}
                        label={markerLabel.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                        })}
                        labelStroke={'none'}
                        labelFill="black"
                        labelDx={width - markerX < 50 ? -40 : 10}
                        labelDy={-25}
                    />}
            </svg>
        );
    }
}

const isPartOfGraph = element =>
    element.classList.contains('vx-line') ||
    element.classList.contains('memory-graph');

module.exports = MemoryGraph;
