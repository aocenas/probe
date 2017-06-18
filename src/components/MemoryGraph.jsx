/* global window */
const React = require('react');
const PT = require('prop-types');
const d3 = require('d3');
const { AreaClosed } = require('@vx/shape');
const { LinearGradient } = require('@vx/gradient');

class MemoryGraph extends React.Component {
    static propTypes = {
        memoryData: PT.array.isRequired,
    };

    state = {
        width: 0,
    };

    componentDidMount() {
        this.setState({
            width: this._el.getBoundingClientRect().width,
        });
        window.addEventListener('resize', this.onResize);
    }

    render() {
        const { memoryData } = this.props;
        const x = d => d.time;
        const y = d => d.size;
        const xScale = d3
            .scaleLinear()
            .domain(d3.extent(memoryData, x))
            .rangeRound([0, this.state.width]);
        const yScale = d3
            .scaleLinear()
            .domain(d3.extent(memoryData, y))
            .rangeRound([200, 0]);

        return (
            <div ref={el => (this._el = el)}>
                <svg
                    className="memory"
                    ref={el => (this._el = el)}
                    width={this.state.width}
                    height={200}
                >
                    <LinearGradient from="#fbc2eb" to="#a6c1ee" id="gradient" />
                    <AreaClosed
                        data={memoryData}
                        xScale={xScale}
                        yScale={yScale}
                        x={x}
                        y={y}
                        fill={'url(#gradient)'}
                        curve={d3.curveStep}
                        stroke={''}
                    />
                </svg>
            </div>
        );
    }
}

module.exports = MemoryGraph;
