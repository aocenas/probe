const http = require('http');
const url = require('url');

type Data = { name: ?string, data: string };

// prettier-ignore
const createServer = (port: number, onData: (Data) => void) => {
    const server = http.createServer((req, res) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            const { query } = url.parse(req.url, true);
            onData({ name: query.name, data });
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok');
        });
    });
    server.listen(port, 'localhost');
    return server;
};

module.exports = createServer;
