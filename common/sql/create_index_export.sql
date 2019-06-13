-- 唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS tiles_unique_index ON tiles (
    layer,
    level,
    x,
    y
);
