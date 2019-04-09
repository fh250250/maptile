const _ = require('lodash')
const request = require('request-promise-native')
const faker = require('faker')
const { SqliteError } = require('better-sqlite3')
const chalk = require('chalk')
const { db, delay } = require('./common')
const Progress = require('./progress')
const ProxyPool = require('./proxy_pool')
const UI = require('./crawl_ui')
const config = require('../config')




class App {
    constructor () {
        this.ui = new UI()
        this.proxy_pool = new ProxyPool(this.ui)
        this.progress = new Progress(this.remain_tile_count())

        this.progress.on('update', this.handle_progress_update.bind(this))
    }

    // 计算需要爬取的图块数量
    remain_tile_count () {
        const { count } = db.prepare(`
            SELECT COUNT(1) as count
            FROM tiles
            WHERE data = 0
        `).get()

        return count
    }

    /**
     * 爬取单个瓦块
     * @param {object} tile
     * @param {string} tile.layer 图层
     * @param {number} tile.level 层级
     * @param {number} tile.x
     * @param {number} tile.y
     */
    crawl_tile (tile) {
        const proxy = this.proxy_pool.get_random_proxy()

        // 没有代理就等 1s
        if (!proxy) { return delay(1000) }

        return request({
            uri: `http://t${_.random(0, 7)}.tianditu.gov.cn/${tile.layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${tile.layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${tile.level}&TILEROW=${tile.x}&TILECOL=${tile.y}&tk=${config.token}`,
            headers: { 'User-Agent': faker.internet.userAgent() },
            encoding: null,
            proxy,
            timeout: config.timeout
        }).then(data => {
            db.prepare(`
                UPDATE tiles
                SET data = $data
                WHERE layer = $layer AND level = $level AND x = $x AND y = $y
            `).run({ ...tile, data })

            this.progress.tick()
            this.proxy_pool.success(proxy)
            this.ui.log(`${chalk.green('[成功]')} ${JSON.stringify(tile)}`)
        }).catch(e => {
            if (e instanceof SqliteError) {
                // 数据库错误
                this.ui.log(`${chalk.red('[数据库错误]')} ${e.message}`)
            } else {
                // request 错误
                this.proxy_pool.fail(proxy)
                this.ui.log(`${chalk.red('[请求失败]')} ${e.name}`)
            }
        })
    }

    handle_progress_update ({ total, current, percent, elapsed, eta, rate }) {
        this.ui.set_status({ total, current, percent, elapsed, eta, rate })
        this.ui.set_speed(rate)
    }

    async run () {
        // 先获取一次代理
        await this.proxy_pool.fetch()

        // 主循环
        while (true) {
            const tiles = db.prepare(`
                SELECT layer, level, x, y
                FROM tiles
                WHERE data = 0
                ORDER BY RANDOM()
                LIMIT $limit
            `).all({ limit: config.concurrent })

            if (tiles.length <= 0) { break }

            await Promise.all(tiles.map(this.crawl_tile.bind(this)))
        }

        // 清理
        this.proxy_pool.destroy()
        process.exit(0)
    }
}




(new App()).run()
