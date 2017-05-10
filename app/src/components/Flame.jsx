/* global document */
const React = require('react');
const PT = require('prop-types');
const d3 = require('d3');
const tip = require('d3-tip');
// const flameGraph = require('../vendor/d3.flameGraph');

d3.tip = tip;

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
        let scaleXPrev = scaleX;
        let scaleY = d3.scaleLinear().range([0, h]);
        let selected = null;
        const trans = d3.transition().duration(250).ease(d3.easeCubicInOut);

        let svg = d3.select('svg.flame').attr('width', w).attr('height', h);

        const colorSelected = d3.color(`#FF4136`);
        const colorDefault = d3.color(`#ffcea4`);
        // const colorFaded = d3.color(`#ffe3cb`);

        const update = () => {
            const filtered = descendants.filter(d => {
                // filter data too small to show or not visible
                return (
                    scaleX(d.x1) - scaleX(d.x0) > 1 &&
                    scaleX(d.x0) < w &&
                    scaleX(d.x1) > 0
                );
            });
            let updateG = svg.selectAll('g').data(filtered, d => d.data.start);

            updateG.exit().remove();

            let enterG = updateG.enter().append('svg:g');

            enterG
                .append('svg:rect')
                .attr('stroke', 'white')
                .attr('rx', 2)
                .attr('ry', 2);

            let updateEnterG = enterG.merge(updateG);

            updateEnterG
                .filter(d => {
                    return scaleX(d.x1) - scaleX(d.x0) < 20;
                })
                .select('foreignObject')
                .remove();

            updateEnterG
                .filter(d => {
                    return scaleX(d.x1) - scaleX(d.x0) >= 20;
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

            updateG.transition(trans).attr('transform', d => {
                if (selected && selected.ancestors().includes(d)) {
                    return 'translate(0, ' + scaleY(d.y0) + ')';
                } else {
                    return (
                        'translate(' + scaleX(d.x0) + ',' + scaleY(d.y0) + ')'
                    );
                }
            });

            updateG.select('rect').transition(trans).attr('width', function(d) {
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
                            scaleXPrev(d.x0) +
                            ',' +
                            scaleY(d.y0) +
                            ')'
                        );
                    }
                })
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

            enterG
                .select('rect')
                .attr('width', function(d) {
                    if (selected && selected.ancestors().includes(d)) {
                        return w;
                    } else {
                        return scaleXPrev(d.x1) - scaleXPrev(d.x0);
                    }
                })
                .transition(trans)
                .attr('width', function(d) {
                    if (selected && selected.ancestors().includes(d)) {
                        return w;
                    } else {
                        return scaleX(d.x1) - scaleX(d.x0);
                    }
                });

            updateEnterG
                .on('click', d => {
                    selected = d;
                    scaleXPrev = scaleX;
                    scaleX = d3
                        .scaleLinear()
                        .domain([d.x0, d.x1])
                        .range([0, w]);
                    update();
                })
                .on('mouseover', function(d) {
                    d3
                        .select(this)
                        .select('rect')
                        .attr('fill', colorDefault.darker(0.3));
                })
                .on('mouseout', function(d) {
                    d3.select(this).select('rect').attr('fill', d => {
                        if (d === selected) {
                            return colorSelected;
                        } else {
                            return colorDefault;
                        }
                    });
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

            updateEnterG
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

            updateEnterG
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
