const d3 = require('d3');

const colorSelected = d3.color(`#FF4136`);
const colorDefault = d3.color(`#ffcea4`);
// const colorFaded = d3.color(`#ffe3cb`);

const flame = tree => {
    let root = d3.hierarchy(tree);

    root.sum(d => {
        return d.self ? d.self : 0;
    });
    const partition = d3.partition();
    const descendants = partition(root).descendants();

    // number of levels
    const treeLevels = descendants[0].height;

    const levelHeight = 20;
    const w = 700;
    const h = treeLevels * levelHeight;
    let scaleX = d3.scaleLinear().range([0, w]);
    let scaleY = d3.scaleLinear().range([0, h]);

    let scaleXPrev = scaleX;
    let selected = null;
    const trans = d3.transition().duration(250).ease(d3.easeCubicInOut);

    let svg = d3.select('svg.flame').attr('width', w).attr('height', h);
    let tooltip = null;

    const getItemWidth = d => {
        if (selected && selected.ancestors().includes(d)) {
            // if current group is ancestor of selected group it will be
            // 100% wide
            return w;
        } else {
            return scaleX(d.x1) - scaleX(d.x0);
        }
    };

    const getColor = d => {
        if (d === selected) {
            return colorSelected;
        } else {
            return colorDefault;
        }
    };

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

        let enterG = updateG.enter().append('svg:g').attr('class', 'flame-item');

        enterG
            .append('svg:rect')
            .attr('stroke', 'white')
            .attr('height', function(d) {
                return scaleY(d.y1 - d.y0);
            })
            .attr('rx', 2)
            .attr('ry', 2);

        let updateEnterG = enterG.merge(updateG);

        // Remove labels for groups which have become too small
        updateEnterG
            .filter(d => {
                return !bigEnoughForLabel(scaleX)(d);
            })
            .select('foreignObject')
            .remove();

        // Add labels for groups which have become big enough
        updateEnterG
            .filter(function(d) {
                // there is only rect element, which means it does not have
                // label yet
                return (
                    bigEnoughForLabel(scaleX)(d) && this.childNodes.length === 1
                );
            })
            .each(function() {
                appendLabel(scaleY)(this);
            });

        // Move updated groups to right place with animation
        updateG.transition(trans).attr('transform', d => {
            if (selected && selected.ancestors().includes(d)) {
                // if current group is ancestor of selected group it will be
                // 100% wide so start at left border
                return translate(0, scaleY(d.y0));
            } else {
                return translate(scaleX(d.x0), scaleY(d.y0));
            }
        });

        // Resize updated rects with animation
        updateG.select('rect').transition(trans).attr('width', getItemWidth);

        // New groups which are added when they come to view after new groups
        // is selected. They are added first in place where they would be
        // in old view and then animated to current place
        enterG
            .attr('transform', d => {
                return translate(scaleXPrev(d.x0), scaleY(d.y0));
            })
            .transition(trans)
            .attr('transform', d => {
                return translate(scaleX(d.x0), scaleY(d.y0));
            });

        enterG
            .select('rect')
            .attr('width', function(d) {
                return scaleXPrev(d.x1) - scaleXPrev(d.x0);
            })
            .transition(trans)
            .attr('width', function(d) {
                return scaleX(d.x1) - scaleX(d.x0);
            });

        // Add event handlers to groups
        enterG
            .on('click', d => {
                selected = d;
                scaleXPrev = scaleX;
                scaleX = d3.scaleLinear().domain([d.x0, d.x1]).range([0, w]);
                update();
            })
            .on('mouseover', function(d) {
                d3
                    .select(this)
                    .select('rect')
                    .attr('fill', colorDefault.darker(0.3));

                tooltip = makeTooltip(this, d);

            })
            .on('mouseout', function(d) {
                // restore normal colors
                d3.select(this).select('rect').attr('fill', getColor);
                tooltip.remove();
            });

        updateEnterG
            .select('rect')
            .attr('fill', getColor)
            .attr('stroke-width', d => {
                return scaleX(d.x1) - scaleX(d.x0) > 2 ? 2 : 1;
            });

        updateEnterG
            .select('foreignObject')
            .transition(trans)
            .attr('width', getItemWidth);
    };

    return update;
};

const bigEnoughForLabel = scaleX => d => {
    return scaleX(d.x1) - scaleX(d.x0) >= 20;
};

const translate = (x, y) => `translate(${x}, ${y})`;

const appendLabel = scaleY => el => {
    d3
        .select(el)
        .append('foreignObject')
        .attr('height', d => {
            return scaleY(d.y1 - d.y0);
        })
        .append('xhtml:div')
        .attr('class', 'flame-label')
        .text(function(d) {
            return d.data.func || 'program';
        });
};

const makeTooltip = (forEl, d) => {
    const groupPosition = d3
        .select(forEl)
        .node()
        .getBoundingClientRect();

    const tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'flame-tooltip')
        .text(d.data.func);

    const tooltipPositionData = tooltip
        .node()
        .getBoundingClientRect();

    const tooltipLeft =
        groupPosition.left +
        groupPosition.width / 2 -
        tooltipPositionData.width / 2;
    const tooltipTop =
        groupPosition.top - (tooltipPositionData.height + 10);

    tooltip
        .style('top', tooltipTop + 'px')
        .style('left', tooltipLeft + 'px');

    return tooltip;
};

module.exports = flame;
