const _ = require('lodash');

const getClosestY = <X, Y, D>(
    pointX: X,
    scaleX: (X) => X,
    data: D[],
    x: (D) => X,
    y: (D) => Y
): Y => {
    const pairs = _.zip(
        data.slice(0, data.length - 1),
        data.slice(1, data.length),
    );

    // TODO binary search
    const index = _.findIndex(pairs, pair =>
        scaleX(x(pair[0])) <= pointX && scaleX(x(pair[1])) >= pointX
    );
    const points = pairs[index];

    const middle = (scaleX(x(points[1])) - scaleX(x(points[0]))) / 2;
    if (pointX - scaleX(x(points[0])) > middle) {
        return y(points[1]);
    } else {
        return y(points[0]);
    }
};

/**
 * Get slice of data that overlaps the domain. This means that if you plot the
 * data with such domain you would get line that does not have gaps.
 * @param domain Domain on which data will be plotted.
 * @param data
 * @param x Accessor for the proper data axis
 */
const getDataSlice = <D>(
    domain: [number, number],
    data: D[],
    x: (D) => number
): D[] => {
    const pairs = _.zip(
        data.slice(0, data.length - 1),
        data.slice(1, data.length),
    );

    const filtered = pairs.filter(pair =>
        x(pair[1]) > domain[0] && x(pair[0]) < domain[1]
    );
    return [...filtered.map(pair => pair[0]), filtered[filtered.length - 1][1]];
};

module.exports = {
    getClosestY,
    getDataSlice,
};
