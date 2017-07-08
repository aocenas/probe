const _ = require('lodash');
const { getClosestY, getDataSlice } = require('./graph');

describe('getClosestY', () => {
    test('picks correct Y', () => {
        const data = [
            { x: 1, y: 'one' },
            { x: 2, y: 'two' },
            { x: 3, y: 'three' },
        ];
        const x = d => d.x;
        const y = d => d.y;
        expect(getClosestY(1.5, _.identity, data, x, y)).toBe('one');
        expect(getClosestY(1, _.identity, data, x, y)).toBe('one');
        expect(getClosestY(1.7, _.identity, data, x, y)).toBe('two');
        expect(getClosestY(2, _.identity, data, x, y)).toBe('two');
        expect(getClosestY(3, _.identity, data, x, y)).toBe('three');
    });
});

describe('getDataSlice', () => {
    test('picks correct Y', () => {
        const data = [
            { x: 1, y: 'one' },
            { x: 2, y: 'two' },
            { x: 3, y: 'three' },
        ];
        const x = d => d.x;
        expect(getDataSlice([1, 3], data, x)).toEqual(data);
        expect(getDataSlice([1.1, 2.9], data, x)).toEqual(data);
        expect(getDataSlice([1.1, 1.9], data, x)).toEqual(data.slice(0, 2));
    });
});
