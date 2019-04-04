-- 瓦块图表
CREATE TABLE IF NOT EXISTS tiles (
    layer CHAR (8) NOT NULL,
    level INTEGER  NOT NULL,
    x     INTEGER  NOT NULL,
    y     INTEGER  NOT NULL,
    data  BLOB
);

CREATE UNIQUE INDEX IF NOT EXISTS tiles_unique_index ON tiles (
    layer,
    level,
    x,
    y
);
