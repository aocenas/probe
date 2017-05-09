/* global document */
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
        let selected = null;
        const trans = d3.transition().duration(250).ease(d3.easeCubicInOut);

        let svg = d3.select('svg.flame').attr('width', w).attr('height', h);

        const colorSelected = d3.color(`hsl(100,100%,55.3%)`);
        const colorDefault = d3.color(`hsl(40,100%,55.3%)`);

        const update = () => {
            const filtered = descendants.filter(d => {
                // filter data too small to show or not visible
                return (
                    scaleX(d.x1) - scaleX(d.x0) > 0.3 &&
                    scaleX(d.x0) < w && scaleX(d.x1) > 0
                );
            });
            let g = svg.selectAll('g').data(filtered, d => d.data.start);

            g.exit().remove();

            let enterG = g.enter().append('svg:g');

            enterG.append('svg:rect').attr('stroke', 'white');

            let updateEnter = enterG.merge(g);

            updateEnter
                .filter(d => {
                    return scaleX(d.x1) - scaleX(d.x0) < 15;
                })
                .select('foreignObject')
                .remove();

            updateEnter
                .filter(d => {
                    return scaleX(d.x1) - scaleX(d.x0) >= 15;
                })
                .select(function() {
                    if (this.childNodes.length === 1) {
                        let foreignObject = document.createElementNS(
                            'http://www.w3.org/2000/svg',
                            'foreignObject'
                        );
                        foreignObject.appendChild(
                            document.createElement('div')
                        );
                        return this.appendChild(foreignObject);
                    }
                    return null;
                });

            g
                .transition(trans)
                .attr('transform', d => {
                    if (selected && selected.ancestors().includes(d)) {
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

            g
                .select('rect')
                .transition(trans)
                .attr('width', function(d) {
                    if (selected && selected.ancestors().includes(d)) {
                        return w;
                    } else {
                        return scaleX(d.x1) - scaleX(d.x0);
                    }
                });

            enterG
                .attr('transform', d => {
                    if (selected && selected.ancestors().includes(d)) {
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

            enterG
                .select('rect')
                .attr('width', function(d) {
                    if (selected && selected.ancestors().includes(d)) {
                        return w;
                    } else {
                        return scaleX(d.x1) - scaleX(d.x0);
                    }
                });

            updateEnter
                .on('click', d => {
                    selected = d;
                    scaleX = d3
                        .scaleLinear()
                        .domain([d.x0, d.x1])
                        .range([0, w]);
                    update();
                })
                .select('rect')
                .attr('height', function(d) {
                    return scaleY(d.y1 - d.y0);
                })
                .attr('fill', function(d) {
                    if (d === selected) {
                        return colorSelected;
                    } else {
                        return colorDefault;
                    }
                })
                .attr('stroke-width', d => {
                    return scaleX(d.x1) - scaleX(d.x0) > 2 ? 2 : 1;
                });

            updateEnter
                .select('foreignObject')
                // .transition(trans)
                .attr('width', function(d) {
                    if (selected && selected.ancestors().includes(d)) {
                        return w;
                    } else {
                        return scaleX(d.x1) - scaleX(d.x0);
                    }
                })
                .attr('height', function(d) {
                    return scaleY(d.y1 - d.y0);
                });

            updateEnter
                .select('foreignObject')
                .select('div')
                .attr('class', 'flame-label')
                .text(function(d) {
                    return d.data.func || 'program';
                });
        };
        update();
    }

    componentDidUpdate() {}

    render() {
        return <svg className="flame" ref={el => this._el = el} />;
    }
}

module.exports = Flame;
