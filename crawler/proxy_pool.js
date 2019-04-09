const _ = require('lodash')
const request = require('request-promise-native')
const cheerio = require('cheerio')
const chalk = require('chalk')
const { delay } = require('./common')


class ProxyPool {
    constructor (ui) {
        this._pool = []
        this._timer = null
        this._ui = ui
    }

    async _fetch_free_proxy (url) {
        const html = await request(url)
        const $ = cheerio.load(html)

        return $('#list tbody tr').map((idx, ele) => {
            const host = $(ele).children().eq(0).text()
            const port = parseInt($(ele).children().eq(1).text())
            const protocol = $(ele).children().eq(3).text().toLowerCase()

            return `${protocol}://${host}:${port}`
        }).get()
    }

    _update_pool (proxy_list) {
        for (const new_proxy of proxy_list) {
            const proxy = _.find(this._pool, p => p.proxy === new_proxy)

            if (!proxy) {
                this._pool.push({ proxy: new_proxy, rank: 30 })
            }
        }

        this._ui.set_proxy_pool(this._pool)
    }

    _validate (idx) {
        if (this._pool[idx].rank < 0) {
            this._pool.splice(idx, 1)
        }

        this._ui.set_proxy_pool(this._pool)
    }

    get_random_proxy () {
        const proxy = this._pool[_.random(0, this._pool.length - 1)]
        return proxy ? proxy.proxy : null
    }

    async fetch () {
        const pages = [
            // 普通
            'https://www.kuaidaili.com/free/intr/',
            'https://www.kuaidaili.com/free/intr/2/',
            'https://www.kuaidaili.com/free/intr/3/',

            // 高匿
            'https://www.kuaidaili.com/free/inha/',
            'https://www.kuaidaili.com/free/inha/2/',
            'https://www.kuaidaili.com/free/inha/3/',
        ]


        this._ui.log(chalk.blue('抓取代理 -------------->'))

        let fetched_list = []
        for (const page of pages) {
            fetched_list.push(await this._fetch_free_proxy(page))
            await delay(2000)
        }
        fetched_list = _.flatten(fetched_list)

        this._ui.log(chalk.blue(`<-------------- 抓取代理 ${fetched_list.length}`))

        this._update_pool(fetched_list)

        // 启动定时器
        this._timer = setTimeout(this.fetch.bind(this), 90 * 1000)
    }

    destroy () {
        this._timer && clearTimeout(this._timer)
    }

    success (proxy) {
        const idx = _.findIndex(this._pool, p => p.proxy === proxy)

        if (idx >= 0) {
            // 限制最大为 500
            this._pool[idx].rank = Math.min(this._pool[idx].rank + 1, 500)
            this._validate(idx)
        }
    }

    fail (proxy) {
        const idx = _.findIndex(this._pool, p => p.proxy === proxy)

        if (idx >= 0) {
            this._pool[idx].rank -= 5
            this._validate(idx)
        }
    }
}

module.exports = ProxyPool
