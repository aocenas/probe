const format = number => {
    let ms;
    if (number > 1) {
        ms = Math.round(number * 1000);
    } else {
        ms = Math.round(number * 10000) / 10;
    }
    return `${ms.toLocaleString()}ms`;
};

const formatRelative = number => {
    let percent = Math.round(number * 1000) / 10;
    return `${percent}%`;
};

module.exports = {
    format,
    formatRelative,
};
