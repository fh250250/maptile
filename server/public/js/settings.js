
var map = L.map('map', {
    center: L.latLng(30.65984, 104.10194),
    zoom: 4,
    minZoom: 1,
    maxZoom: 14,
    attributionControl: false
})

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
map.addLayer(L.gridLayer.debugCoords())

var editable_layer = L.featureGroup().addTo(map)

var draw_control = new L.Control.Draw({
    draw: {
        polyline: false,
        polygon: false,
        circle: false,
        marker: false,
        circlemarker: false
    },
    edit: {
        featureGroup: editable_layer,
        remove: false
    }
})

map.addControl(draw_control)

map.on(L.Draw.Event.CREATED, function (ev) {
    if (editable_layer.getLayers().length < 1) {
        editable_layer.addLayer(ev.layer)
    }
})

var settings_bounds_raw = JSON.parse(document.querySelector('#bounds').value)
var settings_bounds = L.latLngBounds(
    L.latLng(settings_bounds_raw[0], settings_bounds_raw[1]),
    L.latLng(settings_bounds_raw[2], settings_bounds_raw[3])
)

L.rectangle(settings_bounds).addTo(editable_layer)
map.fitBounds(settings_bounds)


function get_settings () {
    var layer = editable_layer.getLayers()[0]

    if (!layer) { return }

    var bounds = layer.getBounds()
    var bounds_latlng = [
        bounds._southWest.lat, bounds._southWest.lng,
        bounds._northEast.lat, bounds._northEast.lng
    ]
    var tasks = []

    for (var zoom = 1; zoom <= 14; zoom++) {
        var point1 = map.project(bounds._southWest, zoom).divideBy(256).floor()
        var point2 = map.project(bounds._northEast, zoom).divideBy(256).floor()

        tasks.push({
            layer: 'img',
            level: zoom,
            range: [point1.x, point1.y, point2.x, point2.y]
        })
    }

    console.log(bounds_latlng)

    tasks.forEach(t => console.log(JSON.stringify(t)))
}
