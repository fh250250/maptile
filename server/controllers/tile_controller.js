const db = require('../../common/db')

module.exports = {
    show (req, res) {
        const { layer, level, x, y } = req.params

        const ret = db.prepare(`
            SELECT data
            FROM tiles
            WHERE layer = ? AND level = ? AND x = ? AND y = ?
        `).get(layer, level, x, y)

        if (ret && ret.data) {
            res.send(ret.data)
        } else {
            // 没有图块
            res.status(404).end()
        }
    }
}
