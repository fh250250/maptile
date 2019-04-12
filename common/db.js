const path = require('path')
const sqlite3 = require('better-sqlite3')
const config = require('../config')


const db = sqlite3(path.resolve(__dirname, '..', 'db', `${config.db_name}.db`))

db.pragma('journal_mode = WAL')

module.exports = db
