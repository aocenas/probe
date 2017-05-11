const React = require('react');
const PT = require('prop-types');
const flame = require('./flame.d3');


class Flame extends React.Component {
    static propTypes = {
        tree: PT.object.isRequired,
    };

    componentDidMount() {
        const tree = this.props.tree;
        flame(tree)();
    }

    componentDidUpdate() {}

    render() {
        return <svg className="flame" ref={el => this._el = el} />;
    }
}

module.exports = Flame;
