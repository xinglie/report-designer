/**
 * report designer 打印、转换等服务
 */
let puppeteer = require('puppeteer');
let http = require('http');
let NPrinter = require('node-printer');
//window 系统安装打印机：https://github.com/tojocky/node-printer/issues/176
//打印机自定义纸张使用mm单位，这里把其它单位转换为mm单位
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

let PAGE_BASIC_READY = 2,
    PAGE_FULL_RENDER = 4,
    PAGE_RECEIVE_SERVER_DATA = 8;

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
let delay = timespan => new Promise(resolve => setTimeout(resolve, timespan));
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
//以下是简易缓存，请替换为更专业的缓存处理
let cache = new Map();
let maxExistPages = 10;
let newPageCount = 0;
let setCachePage = (page, destURL) => {
    if (newPageCount < maxExistPages) {
        let promise = page.goto(destURL, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });
        let c = {
            promise,
            page
        };
        if (cache.has(destURL)) {
            let set = cache.get(destURL);
            set.push(c);
        } else {
            cache.set(destURL, [c]);
        }
    } else {
        page.close();
        newPageCount--;
    }
};
let getCachePage = async (browser, destURL) => {
    if (cache.has(destURL)) {
        let set = cache.get(destURL);
        if (set.length) {
            let c = set.pop();
            console.log('use cache page');
            return [c.page, c.promise];
        }
    }
    console.log('create new page');
    newPageCount++;
    let page = await browser.newPage();
    await updateFactor(page);
    let p = page.goto(destURL, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
    });
    return [page, p];
};
(async () => {
    let browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreHTTPSErrors: true
    });
    let rId = 0;
    http.createServer((request, response) => {
        let data = [];
        request.on('data', chunk => {
            data.push(chunk);
        });
        request.on('end', async () => {
            try {
                let { headers, url, method } = request;
                let baseURL = 'http://' + headers.host;
                let enter = new URL(url, baseURL);
                let ref = headers.origin || headers.referer;
                response.setHeader('Access-Control-Allow-Origin', ref);
                response.setHeader('Access-Control-Allow-Credentials', 'true');
                response.setHeader('Access-Control-Allow-Headers', 'X-Type,Auth');
                if (method == 'OPTIONS') {
                    response.end();
                    return;
                }
                let srcData = data.join('');
                if (!srcData.startsWith('data=')) {
                    console.info('unexpect params or invoked ', srcData);
                    response.write(JSON.stringify({
                        success: false,
                        message: `unexpect params or invoked`
                    }));
                    response.end();
                    return;
                }
                let urlParams = new URLSearchParams(srcData);
                let json = JSON.parse(urlParams.get('data'));
                let u = new URL(json.location);
                u.searchParams.set(json.key, PAGE_BASIC_READY);
                let returned = {
                    success: true,
                    data: []
                };
                //获取打印机列表
                if (enter.pathname == '/printers') {
                    let list = NPrinter.list();
                    returned.data.push(...list);
                } else {
                    let requestId = 'request-' + rId++;
                    let destURL = u.toString();
                    let [page, gotoPromise] = await getCachePage(browser, destURL);
                    console.info(`[info]${requestId} render page:`, destURL);
                    let { stage } = json;
                    let { page: rdPage, unit } = stage;
                    console.info(`[info]${requestId} page unit:`, unit);
                    let convert = unitsConverter[unit];
                    if (!convert) {
                        throw new Error('can not process unit:' + unit);
                    }
                    //一些像派卡尺寸，在生成pdf时不支持，这里统一转为毫米尺寸
                    let mmWidth = convert(rdPage.width),
                        mmHeight = convert(rdPage.height);
                    //视图需要px单位，这里转换为px
                    let pxWidth = (mmToPX(mmWidth) + 1) | 0,
                        pxHeight = (mmToPX(mmHeight) + 2) | 0;
                    console.info(`[info]${requestId} action:`, enter.pathname);
                    console.info(`[info]${requestId} size`, pxWidth, pxHeight);
                    await Promise.all([
                        page.setViewport({
                            //设置可视区域是单个页面区域+50,防止把滚动条截入图里
                            width: pxWidth + 50,
                            height: pxHeight + 50,
                            deviceScaleFactor: 3
                        }),
                        gotoPromise,
                        page.emulateMediaType('print')
                    ]);
                    let start = Date.now(),
                        isTimeout = false,
                        currentState,
                        timeout = 3 * 60 * 1000;//3分钟超时
                    while (true) {
                        let state = await page.evaluate(() => document.rdState);
                        console.info(`[info]${requestId} receive page state`, state);
                        if (state & PAGE_FULL_RENDER) {//页面渲染完成
                            break;
                        } else if ((state & PAGE_BASIC_READY) &&//页面基础完成
                            !(state & PAGE_RECEIVE_SERVER_DATA)) {//尚未收到数据
                            await page.evaluate(s => {
                                let e = new Event('render');
                                e.json = JSON.stringify(s);
                                window.dispatchEvent(e);
                            }, stage);
                        } else if (Date.now() - start > timeout) {
                            currentState = state;
                            isTimeout = true;
                            break;
                        }
                        await delay(150);
                    }
                    if (isTimeout) {
                        throw new Error('timeout,state is:' + currentState);
                    } else {
                        console.info(`[info]${requestId} page ready`);
                    }
                    //生成pdf
                    if (enter.pathname == '/pdf') {
                        //如果要设置pdf meta需要再引入其它库：https://stackoverflow.com/questions/51153026/puppeteer-pdf-title-and-author-metadata
                        let pdf = await page.pdf({
                            printBackground: true,
                            width: pxWidth + 'px',
                            height: pxHeight + 'px'
                        });
                        returned.data.push(pdf.toString('base64'));
                        //生成图片
                    } else if (enter.pathname == '/image') {
                        let pages = await page.$$('[role="page-content"]');
                        console.info(`[info]${requestId} find pages`, pages.length);
                        let index = 0;
                        for (let page of pages) {
                            let img = await page.screenshot({
                                encoding: "base64"
                            });
                            console.info(`[info]${requestId} convert image`, index++);
                            returned.data.push('data:image/png;base64,' + img);
                        }
                    } else if (enter.pathname == '/print') {
                        //执行打印
                        let {
                            nc, name: pName, l: landscape, ts
                        } = json.printer;
                        let nOptions = {
                            'page-bottom': 0,
                            'page-left': 0,
                            'page-right': 0,
                            'page-top': 0,
                            n: nc,
                            media: `Custom.${mmWidth}x${mmHeight}mm`,
                            fitplot: true
                        };
                        if (!pName) {
                            let list = NPrinter.list();
                            pName = list[0];
                        }
                        let l = 0;
                        if (landscape == 'landscape') {
                            nOptions.landscape = 'landscape';
                            l = 1;
                        }
                        if (ts) {
                            nOptions.sides = `two-sided-${l ? 'short' : 'long'}-edge`;
                        }
                        let printer = new NPrinter(pName);
                        let pages = await page.$$('[role="page-content"]');
                        for (let page of pages) {
                            let img = await page.screenshot();
                            printer.printBuffer(img, nOptions);
                        }
                    } else {//失败返回提示信息
                        returned.success = false;
                        returned.message = 'unsupport ' + request.url;
                    }
                    setCachePage(page, destURL);
                    console.info(`[info]${requestId} returned`);
                }
                response.write(JSON.stringify(returned));
                response.end();
            } catch (ex) {
                console.error('exception:', ex);
                response.write(JSON.stringify({
                    success: false,
                    message: ex.message
                }));
                response.end();
            }
        });
    }).listen(9898);
    console.log('report designer server ready~');
})();
