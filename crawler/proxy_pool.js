const _ = require('lodash')
const request = require('request-promise-native')
const cheerio = require('cheerio')
const chalk = require('chalk')
const { delay } = require('../common/utils')
const config = require('../config')


class ProxyPool {
    constructor (ui) {
        this._pool = []
        this._timer = null
        this._ui = ui
    }

    async _fetch_free_page (url) {
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
                this._pool.push({ proxy: new_proxy, rank: 20 })
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

    /**
     * 抓取免费代理
     */
    async _fetch_free () {
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

        this._ui.log(chalk.blue('抓取免费代理 -------------->'))

        let results = []
        for (const page of pages) {
            let proxy_list = []
            try {
                proxy_list = await this._fetch_free_page(page)
            } catch (e) {
                this._ui.log(`${chalk.red('[抓取免费代理失败]')} ${page}`)
            }
            results.push(proxy_list)
            await delay(2000)
        }
        results = _.flatten(results)

        this._ui.log(chalk.blue(`<-------------- 抓取免费代理 ${results.length}`))
        return results
    }

    /**
     * 获取快代理的收费代理
     */
    async _fetch_unfree () {
        let results = []

        this._ui.log(chalk.blue('获取代理 -------------->'))

        try {
            const body = await request(config.proxy.api)

            if (/ERROR/.test(body)) { throw new Error(body) }

            results = body.split('\n').map(p => `http://${p}`)
        } catch (e) {
            this._ui.log(`${chalk.red('[获取代理失败]')} ${e.message}`)
        }

        this._ui.log(chalk.blue(`<-------------- 获取代理 ${results.length}`))
        return results
    }


    /**
     * 获取代理
     */
    async fetch () {
        if (this._pool.length < 500) {

            // 如果配置了获取代理的 api 接口，那么就使用收费的代理
            const list = config.proxy.api
                        ? await this._fetch_unfree()
                        : await this._fetch_free()

            this._update_pool(list)
        }

        // 启动定时器
        this._timer = setTimeout(this.fetch.bind(this), config.proxy.interval)
    }

    get_random_proxy () {
        const proxy = this._pool[_.random(0, this._pool.length - 1)]
        return proxy ? proxy.proxy : null
    }

    destroy () {
        this._timer && clearTimeout(this._timer)
    }

    success (proxy) {
        const idx = _.findIndex(this._pool, p => p.proxy === proxy)

        if (idx >= 0) {
            // 限制最大为 500
            this._pool[idx].rank = Math.min(this._pool[idx].rank + 1, 200)
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
