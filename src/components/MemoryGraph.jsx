const React = require('react');
const PT = require('prop-types');
const d3 = require('d3');
const { LinePath } = require('@vx/shape');
const downsample = require('../utils/downsample');

class MemoryGraph extends React.Component {
    static propTypes = {
        memoryData: PT.array.isRequired,
        width: PT.number.isRequired,
        domain: PT.array,
    };

    render() {
        let { memoryData, width, domain } = this.props;
        if (!width) {
            return null;
        }
        const x = d => d.time;
        const y = d => d.val;

        domain = domain || d3.extent(memoryData, x);

        const scaleX = d3.scaleLinear().domain(domain).rangeRound([0, width]);

        const scaleY = d3
            .scaleLinear()
            .domain(d3.extent(memoryData, y))
            .rangeRound([50, 1]);

        let sampledData = memoryData.filter(
            d => d.time >= domain[0] && d.time < domain[1]
        );
        sampledData = downsample(
            sampledData.map(d => [x(d), y(d)]),
            Math.floor(width / 2)
        );
        sampledData = sampledData.map(d => ({ time: d[0], val: d[1] }));

        return (
            <div ref={el => (this._el = el)}>
                <svg
                    className="memory"
                    ref={el => (this._el = el)}
                    width={width}
                    height={50}
                    shapeRendering={'crispEdges'}
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
                </svg>
            </div>
        );
    }
}

module.exports = MemoryGraph;
