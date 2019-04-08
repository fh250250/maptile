-- 唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS tiles_unique_index ON tiles (
    layer,
    level,
    x,
    y
);

-- 无瓦块数据的偏索引
CREATE INDEX IF NOT EXISTS tiles_data_empty_index ON tiles (
    data
)
WHERE data = 0;
