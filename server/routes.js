const router = require('express').Router()
const PageController = require('./controllers/page_controller')
const TileController = require('./controllers/tile_controller')


router.get('/', PageController.home)
router.get('/settings', PageController.settings)
router.get('/tile/:layer/:level/:x/:y', TileController.show)


module.exports = router
