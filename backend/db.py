from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy(
    engine_options={
        "pool_size": 5,
        "max_overflow": 2,
        "pool_timeout": 30,
        "pool_recycle": 300,     # recycle connections every 5 min
        "pool_pre_ping": True    # ensures dead connections are detected
    }
)
