
var map_opts = {
    center: L.latLng(30.65984, 104.10194),      // 成都
    zoom: 2,
    minZoom: 1,
    maxZoom: 14,
    attributionControl: false,
    zoomControl: false
}

var map_our = L.map('map_our', map_opts)
var map_std = L.map('map_std', map_opts)

L.tileLayer('/tile/img/{z}/{x}/{y}').addTo(map_our)
L.tileLayer('/tile/cia/{z}/{x}/{y}').addTo(map_our)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map_std)

map_our.addLayer(L.gridLayer.debugCoords())
map_std.addLayer(L.gridLayer.debugCoords())

map_our.sync(map_std)
map_std.sync(map_our)
