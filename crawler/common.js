const path = require('path')
const sqlite3 = require('better-sqlite3')
const config = require('../config')




const db = sqlite3(path.resolve(__dirname, '..', `${config.name}.db`))
db.pragma('journal_mode = WAL')



function delay (ms) { return new Promise(resolve => setTimeout(resolve, ms)) }



module.exports = {
    db,
    delay
}
