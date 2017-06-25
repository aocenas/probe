const React = require('react');
const PT = require('prop-types');
const d3 = require('d3');
const { LinePath } = require('@vx/shape');

class MemoryGraph extends React.Component {
    static propTypes = {
        memoryData: PT.array.isRequired,
        root: PT.object.isRequired,
        width: PT.number.isRequired,
    };

    render() {
        let { memoryData, width, root } = this.props;
        const x = d => d.time;
        const y = d => d.val;
        const scaleX = d3
            .scaleLinear()
            .domain(d3.extent(memoryData, x))
            .rangeRound([0, width]);

        root = d3.hierarchy(root);
        root.sum(d => {
            return d.self ? d.self : 0;
        });
        const partition = d3.partition();
        const descendants = partition(root).descendants();

        let allItems = descendants.filter(d => {
            return (
                // filter smaller rects
                scaleX(d.x1) - scaleX(d.x0) > 5
            );
        });

        allItems = allItems.reduce((acc, item) => {
            const { data } = item;
            if (Number.isFinite(data.memStart)) {
                acc.push({val: data.memStart, time: data.timeStart});
            }

            if (Number.isFinite(data.memEnd)) {
                acc.push({val: data.memEnd, time: data.timeEnd});
            }
            return acc;
        }, []);

        allItems.sort((d1, d2) => d1.time - d2.time);
        const scaleY = d3
            .scaleLinear()
            .domain(d3.extent(allItems, y))
            .rangeRound([50, 1]);

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
                        data={allItems}
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
