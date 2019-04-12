const path = require('path')
const fs = require('fs')
const Progress = require('./progress')
const db = require('../common/db')
const config = require('../config')
const moment = require('moment')


moment.locale('zh-cn')





// 根据配置计算瓦块总数
function tile_total_count() {
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
function * tile_generator () {
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






// 创建表
console.log(`----------> 创建表`)
db.exec(fs.readFileSync(path.resolve(__dirname, 'sql', 'create_table.sql'), 'utf8'))




const progress = new Progress(tile_total_count())
const stream = process.stdout

if (stream.isTTY) {
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
}



console.log(`----------> 插入数据`)
for (const tile of tile_generator()) {
    db.prepare(`
        INSERT OR IGNORE INTO tiles (layer, level, x, y)
        VALUES ($layer, $level, $x, $y)
    `).run(tile)

    progress.tick()
}




// 创建索引
console.log(`----------> 创建索引`)
db.exec(fs.readFileSync(path.resolve(__dirname, 'sql', 'create_index.sql'), 'utf8'))
