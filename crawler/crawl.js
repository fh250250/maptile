const _ = require('lodash')
const request = require('request-promise-native')
const cheerio = require('cheerio')
const faker = require('faker')
const { SqliteError } = require('better-sqlite3')
const { db, delay } = require('./common')
const config = require('../config')



// 执行上下文
const ctx = {
    proxy_list: [],
    swap_timer: null
}



/**
 * 刷新代理列表
 */
async function swap_proxy_list () {
    const html = await request('https://www.kuaidaili.com/free/inha/')
    const $ = cheerio.load(html)

    const fetched_list = $('#list tbody tr').map((idx, ele) => {
        const host = $(ele).children().eq(0).text()
        const port = parseInt($(ele).children().eq(1).text())
        const protocol = $(ele).children().eq(3).text().toLowerCase()

        return `${protocol}://${host}:${port}`
    }).get()

    ctx.proxy_list = [
        ...fetched_list,
        'http://127.0.0.1:1087'
    ]

    console.log(`[更新代理池] ${ctx.proxy_list}`)
}


/**
 * 获取代理
 */
function get_proxy () {
    return ctx.proxy_list[ _.random(0, ctx.proxy_list.length - 1)]
}




/**
 * 爬取单个瓦块
 * @param {object} tile
 * @param {string} tile.layer 图层
 * @param {number} tile.level 层级
 * @param {number} tile.x
 * @param {number} tile.y
 */
function crawl_tile (tile) {
    const proxy = get_proxy()

    // 没有代理就等 1s
    if (!proxy) { return delay(1000) }

    return request({
        uri: `http://t${_.random(0, 7)}.tianditu.gov.cn/${tile.layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${tile.layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${tile.level}&TILEROW=${tile.x}&TILECOL=${tile.y}&tk=${config.token}`,
        headers: { 'User-Agent': faker.internet.userAgent() },
        encoding: null,
        proxy,
        timeout: 10 * 1000
    }).then(data => {
        db.prepare(`
            UPDATE tiles
            SET data = $data
            WHERE layer = $layer AND level = $level AND x = $x AND y = $y
        `).run({ ...tile, data })

        console.log(`[成功] ${JSON.stringify(tile)}  代理: ${proxy}`)
    }).catch(e => {
        if (e instanceof SqliteError) {
            // 数据库错误
            console.error(`[数据库错误] ${e.message}`)
        } else {
            // request 错误
            console.error(`[请求失败] ${e.message}  代理: ${proxy}`)
        }
    })
}








async function before_run () {
    // 先获取一次代理
    await swap_proxy_list()

    // 设置定时器， 每分钟刷新一次代理列表
    ctx.swap_timer = setInterval(swap_proxy_list, 60 * 1000)
}


async function run () {
    while (true) {
        const tiles = db.prepare(`
            SELECT layer, level, x, y
            FROM tiles
            WHERE data IS NULL
            ORDER BY RANDOM()
            LIMIT $limit
        `).all({ limit: config.concurrent })

        if (tiles.length <= 0) { return }

        await Promise.all(tiles.map(crawl_tile))
    }
}


async function after_run () {
    // 结束时清除定时器
    clearInterval(ctx.swap_timer)
}







// ---------------------------------------- 启动脚本


before_run()
.then(() => run())
.then(() => after_run())
