// https://github.com/pingec/downsample-lttb

module.exports = function(series, threshold) {
    return largestTriangleThreeBuckets(series, threshold);
};

const floor = Math.floor;
const abs = Math.abs;

function largestTriangleThreeBuckets(data, threshold) {

    let data_length = data.length;
    if (threshold >= data_length || threshold === 0) {
        return data; // Nothing to do
    }

    let sampled = [],
        sampled_index = 0;

    // Bucket size. Leave room for start and end data points
    let every = (data_length - 2) / (threshold - 2);

    let a = 0,  // Initially a is the first point in the triangle
        max_area_point,
        max_area,
        area,
        next_a;

    sampled[ sampled_index++ ] = data[ a ]; // Always add the first point

    for (let i = 0; i < threshold - 2; i++) {

        // Calculate point average for next bucket (containing c)
        let avg_x = 0,
            avg_y = 0,
            avg_range_start  = floor( ( i + 1 ) * every ) + 1,
            avg_range_end    = floor( ( i + 2 ) * every ) + 1;
        avg_range_end = avg_range_end < data_length ? avg_range_end : data_length;

        let avg_range_length = avg_range_end - avg_range_start;

        for ( ; avg_range_start<avg_range_end; avg_range_start++ ) {
            avg_x += data[ avg_range_start ][ 0 ] * 1; // * 1 enforces Number (value may be Date)
            avg_y += data[ avg_range_start ][ 1 ] * 1;
        }
        avg_x /= avg_range_length;
        avg_y /= avg_range_length;

        // Get the range for this bucket
        let range_offs = floor(i * every) + 1,
            range_to   = floor((i + 1) * every) + 1;

        // Point a
        let point_a_x = data[ a ][ 0 ] * 1, // enforce Number (value may be Date)
            point_a_y = data[ a ][ 1 ] * 1;

        max_area = area = -1;

        for ( ; range_offs < range_to; range_offs++ ) {
            // Calculate triangle area over three buckets
            area = abs( ( point_a_x - avg_x ) * ( data[ range_offs ][ 1 ] - point_a_y ) -
                    ( point_a_x - data[ range_offs ][ 0 ] ) * ( avg_y - point_a_y )
                ) * 0.5;
            if ( area > max_area ) {
                max_area = area;
                max_area_point = data[ range_offs ];
                next_a = range_offs; // Next a is this b
            }
        }

        sampled[sampled_index++] = max_area_point; // Pick this point from the bucket
        a = next_a; // This a is the next a (chosen b)
    }

    sampled[sampled_index++] = data[ data_length - 1 ]; // Always add last

    return sampled;
}
