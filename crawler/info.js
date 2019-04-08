const moment = require('moment')
const config = require('../config')
const { db, transform_size_from_bytes } = require('./common')

moment.locale('zh-cn')




let config_total = 0
for (const task of config.tasks) {
    let width = 0
    let height = 0

    if (task.range) {
        width = Math.abs(task.range[0] - task.range[2]) + 1
        height = Math.abs(task.range[1] - task.range[3]) + 1
    } else {
        width = height = Math.pow(2, task.level)
    }

    config_total += width * height
}

const { db_total } = db.prepare(`
    SELECT COUNT(1) as db_total
    FROM tiles
`).get()

const { db_remain } = db.prepare(`
    SELECT COUNT(1) as db_remain
    FROM tiles
    WHERE data = 0
`).get()

const db_exist = db_total - db_remain
const db_percents = (db_exist / db_total * 100).toFixed(2)

// 估算大小
const estimated_tile_size = 1024 + 512      // 1.5KB
const config_size = transform_size_from_bytes(config_total * estimated_tile_size)
const db_remain_size = transform_size_from_bytes(db_remain * estimated_tile_size)

// 估算时间
const request_per_minute = 1000
const config_time = moment.duration(config_total / request_per_minute, 'm').humanize()
const db_remain_time = moment.duration(db_remain / request_per_minute, 'm').humanize()


console.log(`\n------------------------ 配置 ------------------------`)
console.log(`总个数: ${config_total}`)
console.log(`预估大小: ${config_size[0].toFixed(2)}${config_size[1]}`)
console.log(`预估时间: ${config_time}`)

console.log(`\n----------------------- 数据库 ------------------------`)
console.log(`数量: ${db_exist}/${db_total}`)
console.log(`百分比: ${db_percents}%`)
console.log(`预估剩余大小: ${db_remain_size[0].toFixed(2)}${db_remain_size[1]}`)
console.log(`预估剩余时间: ${db_remain_time}`)

console.log(`\n----------------------- 估算值 ------------------------`)
console.log(`瓦块大小: ${transform_size_from_bytes(estimated_tile_size).join('')}`)
console.log(`每分钟请求数: ${request_per_minute}`)
