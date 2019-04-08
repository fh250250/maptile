-- 瓦块图表
CREATE TABLE IF NOT EXISTS tiles (
    layer CHAR (8) NOT NULL,
    level INTEGER  NOT NULL,
    x     INTEGER  NOT NULL,
    y     INTEGER  NOT NULL,
    data  BLOB     NOT NULL
                   DEFAULT (0),
    PRIMARY KEY (
        layer,
        level,
        x,
        y
    )
)
WITHOUT ROWID;
