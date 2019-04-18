const blessed = require('blessed')
const contrib = require('blessed-contrib')
const moment = require('moment')
const config = require('../config')


moment.locale('zh-cn')


class UI {
    constructor () {
        this._screen = blessed.screen({ smartCSR: true, fullUnicode: true })
        this._grid = new contrib.grid({ rows: 3, cols: 3, screen: this._screen })
        this._log = this._grid.set(0, 0, 2, 2, contrib.log, { label: '日志' })
        this._proxy_pool = this._grid.set(0, 2, 2, 1, blessed.list, {
            label: '代理池',
            tags: true,
            items: []
        })
        this._status = this._grid.set(2, 1, 1, 1, blessed.list, {
            label: '运行状态',
            tags: true,
            items: []
        })
        this._settings = this._grid.set(2, 0, 1, 1, blessed.list, {
            label: '系统配置',
            tags: true,
            items: [
                `数据库{|}${config.db_name}`,
                `并发量{|}${config.concurrent}`,
                `请求超时{|}${config.timeout / 1000}s`,
                `代理类型{|}${config.proxy.api ? '快代理' : '免费'}`,
                `代理池刷新周期{|}${config.proxy.interval / 1000}s`,
            ]
        })
        this._speed = this._grid.set(2, 2, 1, 1, contrib.line, {
            label: '速率',
            minY: 0
        })
        this._speed_list = []

        this._screen.key('C-c', () => process.exit(0))
        this._screen.render()
    }

    log (message) {
        this._log.log(message)
    }

    set_proxy_pool (pool) {
        const items = pool.map(p => `${p.proxy}{|}${p.rank}`)

        this._proxy_pool.setItems([
            `总数{|}${pool.length}`,
            ...items
        ])
    }

    set_status ({ total, current, percent, elapsed, eta, rate }) {
        const format_elapsed = moment.duration(elapsed, 's').humanize()
        const format_eta = moment.duration(eta, 's').humanize()
        const format_percent = `${percent.toFixed(2)}%`
        const format_rate = rate.toFixed(2)

        this._status.setItems([
            `进度{|}${current}/${total}`,
            `百分比{|}${format_percent}`,
            `速率{|}${format_rate} req/s`,
            `运行时长{|}${format_elapsed}`,
            `剩余时间{|}${format_eta}`
        ])
    }

    set_speed (speed) {
        if (this._speed_list.length >= 50) { this._speed_list.shift() }
        this._speed_list.push({ time: moment().format('ss'), speed })

        this._speed.setData([{
            x: this._speed_list.map(s => s.time),
            y: this._speed_list.map(s => s.speed)
        }])
    }
}


module.exports = UI
