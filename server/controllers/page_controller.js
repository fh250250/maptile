const config = require('../../config')

module.exports = {
    home (req, res) {
        res.render('home')
    },

    settings (req, res) {
        res.render('settings', { bounds: config.bounds })
    }
}
