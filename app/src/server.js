const http = require('http');

const createServer = (port: number, onData: (string) => void) => {
    const server = http.createServer((req, res) => {
        req.on('data', data => {
            onData(data.toString());
        });

        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok');
        });
    });
    server.listen(port, 'localhost');
    return server;
};

module.exports = createServer;
