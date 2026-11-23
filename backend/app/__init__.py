import os

from flask import Flask, send_from_directory

from .config import Config
from .extensions import db, migrate
from .routes import blueprints


def create_app(config_object=Config):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)

    for bp in blueprints:
        app.register_blueprint(bp)

    frontend_dir = os.environ.get(
        "FRONTEND_DIR",
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend"),
    )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/")
    def index():
        return send_from_directory(frontend_dir, "index.html")

    @app.get("/<path:path>")
    def static_proxy(path):
        return send_from_directory(frontend_dir, path)

    return app
