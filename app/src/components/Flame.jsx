const React = require('react');
const PT = require('prop-types');
const d3 = require('d3');
const tip = require('d3-tip');
// const flameGraph = require('../vendor/d3.flameGraph');

d3.tip = tip;
const color = d3.scaleOrdinal(d3.schemeCategory20);

class Flame extends React.Component {
    static propTypes = {
        tree: PT.object.isRequired,
    };

    componentDidMount() {
        const tree = this.props.tree;
        let root = d3.hierarchy(tree);

        root.sum(d => {
            return d.self ? d.self : 0;
        });
        const partition = d3.partition();
        const descendants = partition(root).descendants();

        // number of levels
        const height = descendants[0].height;

        const w = 700;
        const h = height * 20;
        let scaleX = d3.scaleLinear().range([0, w]);
        let scaleY = d3.scaleLinear().range([0, h]);
        const scaleColor = d3.scaleLinear().range([35, 15]);
        let selected = null;

        let svg = d3.select('svg.flame').attr('width', w).attr('height', h);

        svg = svg.selectAll('g').data(descendants);
        svg.exit().remove();

        let g = svg
            .enter()
            .filter(d => {
                return scaleX(d.x1) - scaleX(d.x0) > 0.3;
            })
            .append('svg:g')
            .attr('transform', d => {
                return 'translate(' + scaleX(d.x0) + ',' + scaleY(d.y0) + ')';
            })
            .on('click', d => {
                selected = d;
                scaleX = d3.scaleLinear().domain([d.x0, d.x1]).range([0, w]);
                rescale();
            });

        g
            .filter(d => {
                return scaleX(d.x0) >= 0 && scaleX(d.x1) <= w;
            })
            .append('svg:rect')
            .attr('stroke', 'white')
            .attr('width', function(d) {
                return Math.min(scaleX(d.x1) - scaleX(d.x0), w);
            })
            .attr('height', function(d) {
                return scaleY(d.y1 - d.y0);
            })
            .attr('fill', function(d) {
                if (d === selected) {
                    return d3.color(`hsl(100,100%,55.3%)`);
                } else {
                    return d3.color(
                        `hsl(${scaleColor(d.data.self / d.data.total)},100%,55.3%)`
                    );
                }
            });

        g
            .filter(d => {
                return scaleX(d.x1) - scaleX(d.x0) > 2;
            })
            .attr('stroke-width', 2);

        g
            .filter(d => {
                return scaleX(d.x1) - scaleX(d.x0) < 2;
            })
            .attr('stroke-width', 1);

        g
            .filter(d => {
                return scaleX(d.x1) - scaleX(d.x0) > 15;
            })
            .append('foreignObject')
            .attr('width', function(d) {
                return scaleX(d.x1) - scaleX(d.x0);
            })
            .attr('height', function(d) {
                return scaleY(d.y1 - d.y0);
            })
            .append('xhtml:div')
            .attr('class', 'flame-label')
            .text(function(d) {
                return d.data.func || 'program';
            });

        const rescale = () => {
            let transitionDuration = 250;

            const g = d3
                .select('svg.flame')
                .selectAll('g')
                .transition()
                .duration(transitionDuration)
                .ease(d3.easeCubicInOut)
                .attr('transform', d => {
                    if (selected.ancestors().includes(d)) {
                        return 'translate(0, ' + scaleY(d.y0) + ')';
                    } else {
                        return (
                            'translate(' +
                            scaleX(d.x0) +
                            ',' +
                            scaleY(d.y0) +
                            ')'
                        );
                    }
                });

            g.select('rect').attr('width', function(d) {
                if (selected.ancestors().includes(d)) {
                    return w;
                } else {
                    return scaleX(d.x1) - scaleX(d.x0);
                }
            });

            g.select('foreignObject').attr('width', function(d) {
                if (selected.ancestors().includes(d)) {
                    return w;
                } else {
                    return scaleX(d.x1) - scaleX(d.x0);
                }
            });
        };
    }

    componentDidUpdate() {}

    render() {
        return <svg className="flame" ref={el => this._el = el} />;
    }
}

module.exports = Flame;
