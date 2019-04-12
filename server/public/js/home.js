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

var map_opts = {
    center: L.latLng(30.65984, 104.10194),
    zoom: 2,
    minZoom: 1,
    maxZoom: 14,
    attributionControl: false,
    zoomControl: false
}

var map_our = L.map('map_our', map_opts)
var map_std = L.map('map_std', map_opts)

L.tileLayer('/tile/img/{z}/{x}/{y}').addTo(map_our)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map_std)

map_our.addLayer(L.gridLayer.debugCoords())
map_std.addLayer(L.gridLayer.debugCoords())

map_our.sync(map_std)
map_std.sync(map_our)
