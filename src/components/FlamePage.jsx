/* global window */
const React = require('react');
const PT = require('prop-types');
const d3 = require('d3');

const Flame = require('./flame/Flame');
const MemoryGraph = require('./MemoryGraph');

const y = d => d.val;

class FlamePage extends React.PureComponent {
    static propTypes = {
        root: PT.object.isRequired,
        memoryData: PT.array.isRequired,
    };

    state = {
        width: 0,
        domain: null,
    };

    onResize = () => {
        this.timer && clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.setState({
                width: this._el.getBoundingClientRect().width,
            });
        }, 250);
    };

    componentDidMount() {
        const width = this._el.getBoundingClientRect().width;
        this.setState({ width });
        window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    render() {
        const { domain, width } = this.state;
        const { memoryData, root } = this.props;
        const memoryExtentText = d3
            .extent(memoryData, y)
            .map(y => y.toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'MB')
            .join(' TO ');
        return (
            <div className="flame-page" ref={el => (this._el = el)}>
                <p className="prb-label">
                    MEMORY ({memoryExtentText})
                </p>
                <MemoryGraph
                    memoryData={memoryData}
                    width={width}
                    domain={domain}
                />
                <Flame root={root} width={width} onClick={this._setDomain} />
            </div>
        );
    }

    _setDomain = domain => {
        this.setState({ domain });
    };
}

module.exports = FlamePage;
