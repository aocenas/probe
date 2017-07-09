const React = require('react');
const cx = require('classnames');
const PT = require('prop-types');

class FlameItem extends React.PureComponent {
    static propTypes = {
        opacity: PT.number,
        id: PT.string.isRequired,
        selected: PT.bool.isRequired,
        translateX: PT.number.isRequired,
        translateY: PT.number.isRequired,
        onClick: PT.func.isRequired,
        onMouseOver: PT.func.isRequired,
        onMouseOut: PT.func.isRequired,
        height: PT.number.isRequired,
        width: PT.number.isRequired,
        showLabel: PT.bool.isRequired,
        label: PT.string.isRequired,
        fill: PT.string.isRequired,
    };

    render() {
        const {
            opacity,
            id,
            selected,
            translateX,
            translateY,
            onClick,
            onMouseOver,
            onMouseOut,
            height,
            width,
            showLabel,
            label,
            fill,
        } = this.props;
        return (
            <g
                opacity={opacity}
                id={id}
                className={cx('flame-item', { selected })}
                transform={translate(translateX, translateY)}
                onClick={onClick}
                onMouseOut={onMouseOut}
                onMouseOver={onMouseOver}
            >
                <rect
                    height={height}
                    rx="4"
                    ry="4"
                    width={width}
                    fill={fill}
                />
                {showLabel
                    ? <foreignObject
                        height={height}
                        width={width}
                    >
                        <div className="flame-item_flame-label">
                            {label}
                        </div>
                    </foreignObject>
                    : null}
            </g>
        );
    }
}

const translate = (x, y) => `translate(${x}, ${y})`;

module.exports = FlameItem;
