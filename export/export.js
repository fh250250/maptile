const path = require('path')
const fs = require('fs')
const moment = require('moment')
const sqlite3 = require('better-sqlite3')
const Progress = require('../common/progress')
const from_db = require('../common/db')
const export_config = require('./config')


moment.locale('zh-cn')


const to_db = sqlite3(path.resolve(__dirname, '..', 'db', `export_${moment().format('YYYYMMDDHHmmss')}.db`))

to_db.pragma('journal_mode = WAL')




// 根据配置计算瓦块总数
function tile_total_count() {
    let count = 0

    for (const task of export_config) {
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
function * tile_generator () {
    for (const task of export_config) {
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



const progress = new Progress(tile_total_count())
const stream = process.stdout

progress.on('update', ({ total, current, percent, elapsed, eta, rate }) => {
    const format_elapsed = moment.duration(elapsed, 's').humanize()
    const format_eta = moment.duration(eta, 's').humanize()
    const format_rate = rate.toFixed(2)
    const format_percent = `${percent.toFixed(2)}%`

    const message = `[${current}/${total}] ${format_percent}  速率:${format_rate}  已运行:${format_elapsed}  剩余:${format_eta}`

    stream.cursorTo(0)
    stream.write(message)
    stream.clearLine(1)
})


// 创建表
console.log('----------> 创建数据表')
to_db.exec(fs.readFileSync(path.resolve(__dirname, '../common/sql/create_table.sql'), 'utf8'))

console.log(`----------> 导入数据`)
for (const tile of tile_generator()) {
    const source = from_db.prepare(`
        SELECT * FROM tiles
        WHERE layer = $layer AND level = $level AND x = $x AND y = $y
    `).get(tile)

    if (source && source.data) {
        to_db.prepare(`
            INSERT INTO tiles (layer, level, x, y, data)
            VALUES ($layer, $level, $x, $y, $data)
        `).run(source)
    }

    progress.tick()
}

// 创建索引
console.log('\n----------> 创建索引')
to_db.exec(fs.readFileSync(path.resolve(__dirname, '../common/sql/create_index_export.sql'), 'utf8'))
