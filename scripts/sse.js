
/**
 * Server Send Event服务端
 * 在预览器viewer.html中如下配置可调用该服务端数据：
 * ...
 * iotTransfer:'sse',
 * iotUrl: '//localhost:9999/iot',
 */

let http = require('http');
let url = require('url');

const SSE_SEND_CONTENT_TYPE = 'text/event-stream; charset=utf-8';
const SSE_SEND_DATA_PREFIX = 'data:';
// const SSE_SEND_EVENT_PREFIX = 'event:';

const headers = {
    'Content-Type': SSE_SEND_CONTENT_TYPE,
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
};


let server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/iot') {
        let refer = req.headers.referer;
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        if (refer) {
            let u = url.parse(refer);
            res.setHeader('Access-Control-Allow-Origin', u.protocol + '//' + u.hostname);
        }
        res.writeHead(200, headers);
        let flushTimer = setInterval(() => {
            let d = JSON.stringify({
                success: true,
                data: {
                    iot001: (40 * Math.random() - 0).toFixed(1),
                    iot002: (100 * Math.random()).toFixed(0),
                    iot003: Math.random() > 0.5 ? 1 : 0,
                    iot004: []
                }
            });
            res.write(`${SSE_SEND_DATA_PREFIX}${d}\n\n`);
            console.log(d);
        }, 2000);
        req.on('close', () => {
            clearInterval(flushTimer);
            res.end();
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});
server.listen(9999);