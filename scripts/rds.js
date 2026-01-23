/**
 * report designer 打印服务
 */
let http = require('http');
let puppeteer = require('puppeteer');
let si = require('systeminformation');
let { exec } = require('child_process');
let fs = require('fs');
//缓存服务
let cache = new Map();
let taskTail, expire = 30 * 60 * 1000;//30分钟过期
let runTask = () => {
    if (taskTail) {
        let current = taskTail,
            now = Date.now(),
            prev;
        while (current) {
            if (now > current.expireTime) {
                cache.delete(current.cacheId);
                if (prev) {
                    current = prev.taskPrev = current.taskPrev;
                } else {
                    current = taskTail = current.taskPrev;
                }
            } else {
                prev = current;
                current = current.prevTask;
            }
        }
        setTimeout(runTask, 1000);
    } else {
        console.log('task empty');
    }
};
let addTask = (cacheId, data) => {
    if (!taskTail) {
        setTimeout(runTask, 1000);
    }
    cache.set(cacheId, data);
    taskTail = {
        expireTime: Date.now() + expire,
        cacheId,
        prevTask: taskTail
    };
};
let removeTask = cacheId => {
    let current = taskTail,
        prev;
    while (current) {
        if (current.cacheId == cacheId) {
            cache.delete(cacheId);
            if (prev) {
                prev.taskPrev = current.taskPrev;
            } else {
                taskTail = current.taskPrev;
            }
            break;
        }
        prev = current;
        current = current.prevTask;
    }
};
//单位转换
let mmToPXFactor = 1,
    pxToMMFactor = 1,
    remToPXFactor = 1,
    rlhToPxFactor = 1;
let pxToMM = n => n * pxToMMFactor;
let mmToPX = n => n * mmToPXFactor;
let ptToMM = n => n * 0.3527777778;
let pcToMM = n => n * 4.23289;
let inToMM = n => n * 25.4;
let cmToMM = n => n * 10;
let qToMM = n => n * 0.25;
let mmToMM = n => n;
let remToMM = n => n * remToPXFactor * pxToMMFactor;
let rlhToMM = n => n * rlhToPxFactor * pxToMMFactor;
let updateFactor = async page => {
    if (mmToPXFactor == 1) {//未处理过
        [measureWidth, remToPXFactor, rlhToPxFactor] = await Promise.all([page.evaluate(() => {
            let d = document.createElement('div');
            d.style.cssText = 'width:1000mm';
            document.body.append(d);
            let w = d.offsetWidth;
            d.remove();
            return w;
        }), page.evaluate(() => {
            let style = getComputedStyle(document.documentElement);
            return parseInt(style.fontSize);
        }), page.evaluate(() => {
            let d = document.createElement('div');
            d.style.cssText = 'height:1rlh';
            document.body.append(d);
            let { height } = d.getBoundingClientRect();
            d.remove();
            return height;
        })]);
        mmToPXFactor = measureWidth / 1000;
        pxToMMFactor = 1 / mmToPXFactor;
    }
};
let unitsConverter = {
    px: pxToMM,
    pt: ptToMM,
    in: inToMM,
    cm: cmToMM,
    q: qToMM,
    pc: pcToMM,
    mm: mmToMM,
    rem: remToMM,
    rlh: rlhToMM
};

let getPayload = async (request) => {
    return new Promise((resolve, reject) => {
        let payload = '';
        request.on('data', (chunk) => {
            payload += chunk.toString();
        });
        request.on('end', () => {
            try {
                resolve(JSON.parse(payload));
            } catch (err) {
                reject(new Error(`解析 payload 失败：${err.message}`));
            }
        });
        request.on('error', (err) => {
            reject(new Error(`读取请求数据失败：${err.message}`));
        });
    });
};
let wrapResult = (success, message = '', data = null) => {
    return JSON.stringify({
        success,
        data,
        message
    });
};
let wrapPage = (basic, pages) => `<!DOCTYPE html><html><head><meta charset="utf-8" />${basic.styles.join('')}</head><body>${basic.symbols}${pages.join('')}</body></html>`;


let toPrinter = (printerName, file) => {
    let platform = process.platform;
    return new Promise((resolve, reject) => {
        if (platform === 'win32') {
            //window平台安装SumatraPDF.exe
            //https://www.sumatrapdfreader.org/free-pdf-reader
            //下面的路径需要修改为您安装的目录
            exec(`C:\\your path to\\SumatraPDF.exe -print-to "${printerName}" -silent "${file}"`, error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        } else if (platform === 'darwin') {
            exec(`lp -d ${printerName} ${file}`, error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        } else {
            reject(new Error(`Unsupported platform: ${platform}`));
        }
    });
};
let startId = Date.now();
let currentId = 0;

puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--kiosk-printing'],
    ignoreHTTPSErrors: true
}).then(browser => {
    http.createServer(async (request, response) => {
        let { headers, method } = request;
        let ref = headers.origin || headers.referer || 'https://demo.report-designer.cn';
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Access-Control-Allow-Origin', ref);
        response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        response.setHeader('Access-Control-Allow-Credentials', 'true');
        response.setHeader('Access-Control-Allow-Headers', 'X-Type, Auth, Content-Type, X-Requested-With');
        if (method == 'OPTIONS') {
            response.writeHead(204);
            response.end();
            return;
        }
        try {
            let data = await getPayload(request);
            if (data.flag == 1) {//获取打印机
                let printers = await si.printer();
                let printerNames = [];
                for (let p of printers) {
                    printerNames.push(p.name);
                }
                response.end(wrapResult(true, '', printerNames));
            } else if (data.flag == 2) {//基础数据
                addTask(data.taskId, {//需要考虑客户端发送数据异常，服务端不长久持有数据
                    symbols: data.symbols,
                    printer: data.printer,
                    styles: data.styles
                });
                response.end(wrapResult(true));
            } else if (data.flag == 4) {//取消
                removeTask(data.taskId);
                response.end(wrapResult(true));
            } else if (data.flag == 3) {//分批打印
                let basic = cache.get(data.taskId);
                if (basic) {
                    let convert = unitsConverter[data.unit];
                    if (!convert) {
                        response.end(wrapResult(false, 'can not process unit:' + data.unit));
                        return;
                    }
                    let page = await browser.newPage();
                    await updateFactor(page);
                    let mmWidth = convert(data.width),
                        mmHeight = convert(data.height);
                    let pxWidth = (mmToPX(mmWidth) + 1) | 0,
                        pxHeight = (mmToPX(mmHeight) + 2) | 0;
                    let basicInfo = basic.printer;
                    let nOptions = {
                        'page-bottom': 0,
                        'page-left': 0,
                        'page-right': 0,
                        'page-top': 0,
                        //n: basicInfo.nc,
                        media: `Custom.${mmWidth}x${mmHeight}mm`,
                    }, ts = basicInfo.ts,
                        pName = basicInfo.name;
                    if (ts) {
                        nOptions.sides = `two-sided-${mmHeight > mmWidth ? 'short' : 'long'}-edge`;
                    }
                    await page.setViewport({
                        //设置可视区域是单个页面区域+50,防止把滚动条截入图里
                        width: pxWidth + 50,
                        height: pxHeight + 50,
                        deviceScaleFactor: 3
                    });
                    await page.emulateMediaType('print');
                    await page.setContent(wrapPage(basic, data.pages), { waitUntil: 'networkidle0' });
                    if (cache.get(data.taskId)) {//需要考虑在chrome准备页面的过程中，客户端取消请求后，未进入打印队列的直接取消
                        let file = `./${startId}_${currentId++}.pdf`;
                        await page.pdf({
                            path: file,
                            printBackground: true,
                            width: pxWidth + 'px',
                            height: pxHeight + 'px'
                        });
                        //使用浏览器自身的打印
                        //await page.evaluate(() => window.print());
                        //指定打印机打印
                        //await toPrinter(pName, file);
                        //清理文件
                        //fs.unlinkSync(file);
                        if (data.complete) {
                            removeTask(data.taskId);
                        }
                    } else {
                        console.log('cancelled');
                    }
                    await page.close();
                    response.end(wrapResult(true));
                } else {//不存在的任务
                    response.end(wrapResult(false, 'can not find:' + data.taskId));
                }
            } else {//未能识别参数
                response.end(wrapResult(false, 'unknown parameters'));
            }
        } catch (ex) {
            response.end(wrapResult(false, ex.message));
        }
    }).listen(9898);
    console.log('report designer server ready~');
});