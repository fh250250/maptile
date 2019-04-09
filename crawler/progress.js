const EventEmitter = require('events')
const _ = require('lodash')

class Progress extends EventEmitter {
    constructor (total = 0) {
        super()

        this._total = total
        this._current = 0
        this._last_tick_at = 0
        this._start_at = 0
        this._update_throttle = 1000
        this._count_buffer = 0
    }

    tick (count = 1) {
        if (this._current === 0) { this._start_at = new Date() }

        this._current += count
        this._count_buffer += count

        const now = new Date()
        const delta = now - this._last_tick_at

        if (delta < this._update_throttle) { return }

        const rate = this._count_buffer / delta * 1000

        this.emit('update', {
            total: this._total,
            current: this._current,
            percent: _.clamp(this._current / this._total, 0, 1) * 100,
            elapsed: (now - this._start_at) / 1000,
            eta: (this._total - this._current) / rate,
            rate
        })

        this._last_tick_at = now
        this._count_buffer = 0
    }
}

module.exports = Progress
