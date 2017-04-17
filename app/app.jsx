const fs = require('fs');
const React = require('react');
const ReactDOM = require('react-dom');

const App = require('./components/App');

let data = fs.readFileSync('./dump.json');
data = JSON.parse(data);

ReactDOM.render(<App data={data} />, document.getElementById('app-root'));
