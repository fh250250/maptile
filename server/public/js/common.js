
L.GridLayer.DebugCoords = L.GridLayer.extend({
    createTile: function (coords) {
        var tile = L.DomUtil.create('div', 'debug_coords_tile')

        tile.innerHTML = `(${coords.z}, ${coords.x}, ${coords.y})`

        return tile
    }
})

L.gridLayer.debugCoords = function (opts) {
    return new L.GridLayer.DebugCoords(opts)
}
