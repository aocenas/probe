/* global window */
const React = require('react');
const PT = require('prop-types');

const Flame = require('./Flame');
const MemoryGraph = require('./MemoryGraph');

class FlamePage extends React.PureComponent {
    static propTypes = {
        root: PT.object.isRequired,
        memoryData: PT.array.isRequired,
    };

    state = {
        width: 0,
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
        this.setState({
            width: this._el.getBoundingClientRect().width,
        });
        window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    render() {
        return (
            <div className="flame-wrapper" ref={el => this._el = el}>
                <MemoryGraph
                    memoryData={this.props.memoryData}
                    width={this.state.width}
                />
                <Flame
                    root={this.props.root}
                    width={this.state.width}
                />
            </div>
        );
    }
}

module.exports = FlamePage;
