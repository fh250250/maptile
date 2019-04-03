const path = require('path')
const EventEmitter = require('events')
const sqlite3 = require('better-sqlite3')
const _ = require('lodash')
const download = require('download')
const faker = require('faker')
const config = require('../config')




// --------------------------------- 注册全局变量与函数
global.db = sqlite3(path.resolve(__dirname, '..', `${config.name}.db`))
global.system_bus = new EventEmitter()






/**
 * 爬取单个瓦块
 * @param {object} tile
 * @param {string} tile.layer 图层
 * @param {number} tile.level 层级
 * @param {number} tile.x
 * @param {number} tile.y
 */
global.crawl_tile = async function crawl_tile (tile) {
    const url = `http://t${_.random(0, 7)}.tianditu.gov.cn/${tile.layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${tile.layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${tile.level}&TILEROW=${tile.x}&TILECOL=${tile.y}&tk=${config.token}`
    const opts = {
        headers: { 'User-Agent': faker.internet.userAgent() },
        proxy: 'http://116.255.189.171:16817'
    }

    try {
        const buffer = await download(url, opts)

        db.prepare(`
            UPDATE tiles
            SET data = $data
            WHERE layer = $layer AND level = $level AND x = $x AND y = $y
        `).run({ ...tile, data: buffer })
    } catch (e) {
        system_bus.emit('crawl_failure', e)
    }
}


// 根据配置计算瓦块总数
global.tile_total_count = function tile_total_count() {
    let count = 0

    for (const task of config.tasks) {
        let width = 0
        let height = 0

        if (task.range) {
            width = Math.abs(task.range[0] - task.range[2]) + 1
            height = Math.abs(task.range[1] - task.range[3]) + 1
        } else {
            width = height = Math.pow(2, task.level)
        }

        count += width * height
    }

    return count
}


// 根据配置生成瓦块
global.tile_generator = function * tile_generator () {
    for (const task of config.tasks) {
        let x = 0
        let y = 0
        let width = 0
        let height = 0

        if (task.range) {
            x = Math.min(task.range[0], task.range[2])
            y = Math.min(task.range[1], task.range[3])
            width = Math.abs(task.range[0] - task.range[2]) + 1
            height = Math.abs(task.range[1] - task.range[3]) + 1
        } else {
            x = 0
            y = 0
            width = height = Math.pow(2, task.level)
        }

        for (let w = 0; w < width; w++) {
            for (let h = 0; h < height; h++) {
                yield({
                    layer: task.layer,
                    level: task.level,
                    x: x + w,
                    y: y + h
                })
            }
        }
    }
}
