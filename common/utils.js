const _ = require('lodash')


function delay (ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

function transform_size_from_bytes (bytes) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB']

    for (var i = 0; i < units.length; i++) {
        if (bytes / Math.pow(1024, i + 1) < 1) {
            return [bytes / Math.pow(1024, i), units[i]]
        }
    }

    return [bytes / Math.pow(1024, units.length - 1), _.last(units)]
}


module.exports = {
    delay,
    transform_size_from_bytes
}
