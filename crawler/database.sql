-- 瓦块图表
CREATE TABLE tiles (
    layer CHAR (8) NOT NULL,
    level INTEGER  NOT NULL,
    x     INTEGER  NOT NULL,
    y     INTEGER  NOT NULL,
    data  BLOB
);

CREATE UNIQUE INDEX tiles_unique_index ON tiles (
    layer,
    level,
    x,
    y
);
