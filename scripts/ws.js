/**
 * websocket服务端
 *
 * 在预览器viewer.html中如下配置可调用该服务端数据：
 * ...
 * iotTransfer:'ws',
 * iotUrl: 'ws://localhost:9999',
 */

// 引入WebSocket模块
const WebSocket = require('ws');

// 创建WebSocket服务器，监听端口9999
const server = new WebSocket.Server({ port: 9999 });
/**
 * 关于心跳与预览器的通讯设计(以客户端为主要视角，服务端为被动视角，只检测服务器是否可用)
 * 1. 客户端需主动向服务器发送心跳
 * 2. 服务端需及时响应客户端发送的心跳包，服务端不向客户端发送心跳
 * 3. 心跳只在客户端未有与服务端数据交换，空闲一定时间后发送。当有任意其它数据向服务端传送并收到响应时，不发送心跳(即有其它方式证明自己存活时不发送心跳)
 * 4. 当客户端收到服务器任意消息时，会重置心跳定时器。
 * 5. 服务端收到客户端的心跳包后，需要及时返回任意数据进行响应，如果超过一定时间收不到任何数据返回，会认为服务端无法处理，客户端将断开重连
 *
 * 当前实现：当客户端空闲50s后，向服务器发送心跳数据。发送数据后，默认30s需要收到服务器返回的任意数据，如果收不到则会断开重连
 */
let connections = 0;
let sendTimer;
// 当有客户端连接时触发
server.on('connection', (socket) => {
    console.log('Client connected');

    //某一个连接进入时，发送全量数据
    socket.send(JSON.stringify({
        success: true,
        data: {
            iot001: (40 * Math.random() - 0).toFixed(1),
            iot002: (100 * Math.random()).toFixed(0),
            iot003: Math.random() > 0.5 ? 1 : 0,
            iot004: []
        }
    }));
    socket.__sendAll = true;
    let flush = () => {
        let omits = ['iot001', 'iot002', 'iot003', 'iot004'];
        let data = {
            success: true,
            data: {
                iot001: (40 * Math.random() - 0).toFixed(1),
                iot002: (100 * Math.random()).toFixed(0),
                iot003: Math.random() > 0.5 ? 1 : 0,
                iot004: [{ key: 'key1', value: Math.random() * 100 }, { key:'key2', value: Math.random() * 20 }, { key:'key3', value: Math.random() * 80 }]
            }
        };
        //以下模拟只发送部分数据
        //正常使用时，也是只有某个硬件数据变化才发送到可视化界面进行展示
        let omit = omits[Math.floor(Math.random() * omits.length)];
        delete data.data[omit];
        let json = JSON.stringify(data);
        for (let client of server.clients) {
            if (client.__sendAll && //只有发送过一次全量的数据才可以只发送部分数据
                client.readyState === WebSocket.OPEN) {
                console.log(json);
                client.send(json);
            }
        }
    };
    let start = () => {
        if (!connections) {//模拟向所有客户端推送数据
            sendTimer = setInterval(flush, 2000);
        }
        connections++;
    };
    let end = () => {
        if (connections) {
            connections--;
            if (connections === 0) {
                clearInterval(sendTimer);
            }
        }
    };
    start();
    // 处理收到的消息
    socket.on('message', (data) => {
        console.log(`Received: ${data}`);
        let json = JSON.parse(data);
        if (json.type == 'heartbeat') {//响应客户端的心跳机制
            socket.send(JSON.stringify({
                success: true,
                type: 'heartbeat'
            }));
            console.log('send hb');
        }
    });

    // 处理连接关闭
    socket.on('close', () => {
        end();
        console.log('Client disconnected');
    });
});