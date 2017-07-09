/* global window */
const React = require('react');
const PT = require('prop-types');

const Flame = require('./flame/Flame');
const MemoryGraph = require('./MemoryGraph');

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
        return (
            <div className="flame-page" ref={el => (this._el = el)}>
                <MemoryGraph
                    memoryData={this.props.memoryData}
                    width={this.state.width}
                    domain={this.state.domain}
                />
                <Flame
                    root={this.props.root}
                    width={this.state.width}
                    onClick={this._setDomain}
                />
            </div>
        );
    }

    _setDomain = domain => {
        this.setState({ domain });
    };
}

module.exports = FlamePage;
