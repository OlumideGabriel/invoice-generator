from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy(
    engine_options={
        "pool_size": 5,          # Keep small, Supabase allows 200 max
        "max_overflow": 2,       # Allow a few extras
        "pool_timeout": 30,      # Wait before giving up on a connection
        "pool_recycle": 1800,    # Recycle connections every 30 mins
        "pool_pre_ping": True    # Ensures dead connections are detected
    }
)
