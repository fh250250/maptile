require('./runtime')

const path = require('path')
const fs = require('fs')
const blessed = require('blessed')
const contrib = require('blessed-contrib')


const screen = blessed.screen()
const layout = new contrib.grid({ rows: 6, cols: 6, screen })

const progress_widget = layout.set(1, 2, 1, 2, contrib.gauge, { label: 'Progress', stroke: 'green', fill: 'white' })
const log_widget = layout.set(2, 1, 3, 4, contrib.log, { label: 'Logs', fg: 'green' })

screen.render()


log_widget.log('create database -->')
db.exec(fs.readFileSync(path.resolve(__dirname, 'database.sql'), 'utf8'))
log_widget.log('create database <--')

db.pragma('journal_mode = WAL')

const total = tile_total_count()
let count = 1

for (const tile of tile_generator()) {
    db.prepare(`
        INSERT INTO tiles (layer, level, x, y)
        VALUES ($layer, $level, $x, $y)
    `).run(tile)

    log_widget.log(`layer: ${tile.layer}, level: ${tile.level}, x: ${tile.x}, y: ${tile.y}`)
    progress_widget.setData(count / total)
    count++
}

process.exit(0)
