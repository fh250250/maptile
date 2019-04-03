const _ = require('lodash')
const { crawl_tile } = require('./core')
const config = require('../config')






async function main () {
    let events = []

    for (const ev of event_generator()) {
        if (events.length < config.concurrent) {
            events.push(ev)
        } else {
            await Promise.all(events.map(ev => crawl_tile(ev)))
            events = []
        }
    }

    if (events.length) {
        await Promise.all(events.map(ev => crawl_tile(ev)))
    }
}


main()
