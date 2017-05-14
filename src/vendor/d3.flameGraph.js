/* global document */
const d3 = require('d3');
const _ = require('lodash');

function flameGraph() {
    let w = 960; // graph width
    let h = 540; // graph height
    let c = 18; // cell height
    let selection = null; // selection
    let tooltip = true; // enable tooltip
    let title = ''; // graph title
    let transitionDuration = 750;
    let transitionEase = 'cubic-in-out'; // tooltip offset
    let sort = true;
    let reversed = false; // reverse the graph direction
    let clickHandler = null;

    let tip = d3
        .tip()
        .direction('s')
        .offset([8, 0])
        .attr('class', 'd3-flame-graph-tip')
        .html(function(d) {
            return label(d);
        });

    let labelFormat = function(d) {
        return `${d.name}} (${d3.format('.2f')(100 * d.dx)}%, ${d.value} samples)`;
    };

    function setDetails(t) {
        const details = document.getElementById('details');
        if (details) details.innerHTML = t;
    }

    function label(d) {
        if (!d.dummy) {
            return labelFormat(d);
        } else {
            return '';
        }
    }

    function name(d) {
        return d.name;
    }

    let colorMapper = d => {
        return d.highlight ? '#E600E6' : colorHash(d.name);
    };

    function generateHash(name) {
        // Return a vector (0.0->1.0) that is a hash of the input string.
        // The hash is computed to favor early characters over later ones, so
        // that strings with similar starts have similar vectors. Only the first
        // 6 characters are considered.
        let hash = 0, weight = 1, max_hash = 0, mod = 10, max_char = 6;
        if (name) {
            for (let i = 0; i < name.length; i++) {
                if (i > max_char) {
                    break;
                }
                hash += weight * (name.charCodeAt(i) % mod);
                max_hash += weight * (mod - 1);
                weight *= 0.70;
            }
            if (max_hash > 0) {
                hash = hash / max_hash;
            }
        }
        return hash;
    }

    function colorHash(name) {
        // Return an rgb() color string that is a hash of the provided name,
        // and with a warm palette.
        let vector = 0;
        if (name) {
            name = name.replace(/.*`/, ''); // drop module name if present
            name = name.replace(/\(.*/, ''); // drop extra info
            vector = generateHash(name);
        }
        let r = 200 + Math.round(55 * vector);
        let g = 0 + Math.round(230 * (1 - vector));
        let b = 0 + Math.round(55 * (1 - vector));
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    function hide(d) {
        if (!d.original) {
            d.original = d.value;
        }
        d.value = 0;
        if (d.children) {
            d.children.forEach(hide);
        }
    }

    function show(d) {
        d.fade = false;
        if (d.original) {
            d.value = d.original;
        }
        if (d.children) {
            d.children.forEach(show);
        }
    }

    function getSiblings(d) {
        let siblings = [];
        if (d.parent) {
            const me = d.parent.children.indexOf(d);
            siblings = d.parent.children.slice(0);
            siblings.splice(me, 1);
        }
        return siblings;
    }

    function hideSiblings(d) {
        const siblings = getSiblings(d);
        siblings.forEach(function(s) {
            hide(s);
        });
        if (d.parent) {
            hideSiblings(d.parent);
        }
    }

    function fadeAncestors(d) {
        if (d.parent) {
            d.parent.fade = true;
            fadeAncestors(d.parent);
        }
    }

    function zoom(d) {
        tip.hide(d);
        hideSiblings(d);
        show(d);
        fadeAncestors(d);
        update();
        if (typeof clickHandler === 'function') {
            clickHandler(d);
        }
    }

    function searchTree(d, term) {
        const re = new RegExp(term), searchResults = [];

        function searchInner(d) {
            const label = d.name;

            if (d.children) {
                d.children.forEach(function(child) {
                    searchInner(child);
                });
            }

            if (label.match(re)) {
                d.highlight = true;
                searchResults.push(d);
            } else {
                d.highlight = false;
            }
        }

        searchInner(d);
        return searchResults;
    }

    function clear(d) {
        d.highlight = false;
        if (d.children) {
            d.children.forEach(function(child) {
                clear(child);
            });
        }
    }

    const partition = d3.partition();

    function update() {
        selection.each(function(data) {
            let x = d3.scaleLinear().range([0, w]);
            let y = d3.scaleLinear().range([0, c]);

            let nodes = partition(data);

            var kx = w / data.dx;

            var g = d3.select(this).select('svg').selectAll('g').data(nodes);

            g
                .transition()
                .duration(transitionDuration)
                .ease(transitionEase)
                .attr('transform', function(d) {
                    return (
                        'translate(' +
                        x(d.x) +
                        ',' +
                        (reversed ? y(d.depth) : h - y(d.depth) - c) +
                        ')'
                    );
                });

            g
                .select('rect')
                .transition()
                .duration(transitionDuration)
                .ease(transitionEase)
                .attr('width', function(d) {
                    return d.dx * kx;
                });

            var node = g.enter().append('svg:g').attr('transform', function(d) {
                return (
                    'translate(' +
                    x(d.x) +
                    ',' +
                    (reversed ? y(d.depth) : h - y(d.depth) - c) +
                    ')'
                );
            });

            node.append('svg:rect').attr('width', function(d) {
                return d.dx * kx;
            });

            if (!tooltip) node.append('svg:title');

            node.append('foreignObject').append('xhtml:div');

            g
                .attr('width', function(d) {
                    return d.dx * kx;
                })
                .attr('height', function(d) {
                    return c;
                })
                .attr('name', function(d) {
                    return d.name;
                })
                .attr('class', function(d) {
                    return d.fade ? 'frame fade' : 'frame';
                });

            g
                .select('rect')
                .attr('height', function(d) {
                    return c;
                })
                .attr('fill', function(d) {
                    return colorMapper(d);
                })
                .style('visibility', function(d) {
                    return d.dummy ? 'hidden' : 'visible';
                });

            if (!tooltip) g.select('title').text(label);

            g
                .select('foreignObject')
                .attr('width', function(d) {
                    return d.dx * kx;
                })
                .attr('height', function(d) {
                    return c;
                })
                .select('div')
                .attr('class', 'label')
                .style('display', function(d) {
                    return d.dx * kx < 35 || d.dummy ? 'none' : 'block';
                })
                .text(name);

            g.on('click', zoom);

            g.exit().remove();

            g
                .on('mouseover', function(d) {
                    if (!d.dummy) {
                        if (tooltip) tip.show(d);
                        setDetails(label(d));
                    }
                })
                .on('mouseout', function(d) {
                    if (!d.dummy) {
                        if (tooltip) tip.hide(d);
                        setDetails('');
                    }
                });
        });
    }

    function merge(data, samples) {
        samples.forEach(function(sample) {
            var node = _.find(data, function(element) {
                return element.name === sample.name;
            });

            if (node) {
                node.value += sample.value;
                if (sample.children) {
                    if (!node.children) {
                        node.children = [];
                    }
                    merge(node.children, sample.children);
                }
            } else {
                data.push(sample);
            }
        });
    }

    function chart(s) {
        selection = s;

        if (!arguments.length) return chart;

        selection.each(function(data) {
            var svg = d3
                .select(this)
                .append('svg:svg')
                .attr('width', w)
                .attr('height', h)
                .attr('class', 'partition d3-flame-graph')
                .call(tip);

            svg
                .append('svg:text')
                .attr('class', 'title')
                .attr('text-anchor', 'middle')
                .attr('y', '25')
                .attr('x', w / 2)
                .attr('fill', '#808080')
                .text(title);

            partition(data);
        });

        // first draw
        update();
    }

    chart.height = function(_) {
        if (!arguments.length) {
            return h;
        }
        h = _;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) {
            return w;
        }
        w = _;
        return chart;
    };

    chart.cellHeight = function(_) {
        if (!arguments.length) {
            return c;
        }
        c = _;
        return chart;
    };

    chart.tooltip = function(_) {
        if (!arguments.length) {
            return tooltip;
        }
        if (typeof _ === 'function') {
            tip = _;
        }
        tooltip = true;
        return chart;
    };

    chart.title = function(_) {
        if (!arguments.length) {
            return title;
        }
        title = _;
        return chart;
    };

    chart.transitionDuration = function(_) {
        if (!arguments.length) {
            return transitionDuration;
        }
        transitionDuration = _;
        return chart;
    };

    chart.transitionEase = function(_) {
        if (!arguments.length) {
            return transitionEase;
        }
        transitionEase = _;
        return chart;
    };

    chart.sort = function(_) {
        if (!arguments.length) {
            return sort;
        }
        sort = _;
        return chart;
    };

    chart.reversed = function(_) {
        if (!arguments.length) {
            return reversed;
        }
        reversed = _;
        return chart;
    };

    chart.label = function(_) {
        if (!arguments.length) {
            return labelFormat;
        }
        labelFormat = _;
        return chart;
    };

    chart.search = function(term) {
        var searchResults = [];
        selection.each(function(data) {
            searchResults = searchTree(data, term);
            update();
        });
        return searchResults;
    };

    chart.clear = function() {
        selection.each(function(data) {
            clear(data);
            update();
        });
    };

    chart.zoomTo = function(d) {
        zoom(d);
    };

    chart.resetZoom = function() {
        selection.each(function(data) {
            zoom(data); // zoom to root
        });
    };

    chart.onClick = function(_) {
        if (!arguments.length) {
            return clickHandler;
        }
        clickHandler = _;
        return chart;
    };

    chart.merge = function(samples) {
        selection.each(function(data) {
            merge([data], [samples]);
            augment(data);
        });
        update();
    };

    chart.color = function(_) {
        if (!arguments.length) {
            return colorMapper;
        }
        colorMapper = _;
        return chart;
    };

    return chart;
}

module.exports = flameGraph;
