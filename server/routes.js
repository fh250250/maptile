const router = require('express').Router()
const PageController = require('./controllers/page_controller')
const TileController = require('./controllers/tile_controller')


router.get('/', PageController.index)
router.get('/tile/:layer/:level/:x/:y', TileController.show)


module.exports = router
