const http = require('http');

const createServer = (port: number, onData: (string) => void) => {
    const server = http.createServer((req, res) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            onData(data);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok');
        });
    });
    server.listen(port, 'localhost');
    return server;
};

module.exports = createServer;
