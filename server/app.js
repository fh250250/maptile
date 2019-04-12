const path = require('path')
const http = require('http')
const express = require('express')
const morgan = require('morgan')
const cookie_parser = require('cookie-parser')
const stylus = require('stylus')
const routes = require('./routes')

const app = express()

// 模版引擎
app.set('views', path.resolve(__dirname, 'views'))
app.set('view engine', 'pug')

// 中间件
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookie_parser())
app.use(stylus.middleware(path.resolve(__dirname, 'public')))
app.use(express.static(path.resolve(__dirname, 'public')))

// 路由
app.use(routes)

// 启动
const http_server = http.createServer(app)

http_server.listen(process.env.PORT || 1024, process.env.HOST || '0.0.0.0', () => {
    const address = http_server.address()

    console.log(`[服务已启动] http://${address.address}:${address.port}`)
})
