# 图块爬虫

爬取地图瓦块，用于制作离线地图

使用 sqlite 存储数据

## 安装

1. `npm install`
2. `cp config.exmaple.json config.json`
3. 编辑 `config.json`
4. `npm run crawl:init` 初始化数据库
5. `npm run crawl:run` 开始爬取

## 可用命令

1. `npm run crawl:init` 初始化数据库
2. `npm run crawl:run` 开始爬取
3. `npm run crawl:info` 统计
