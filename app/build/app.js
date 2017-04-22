/* global document */
const React = require('react');
const ReactDOM = require('react-dom');

const App = require('./components/App');

ReactDOM.render(React.createElement(App, null), document.getElementById('app-root'));