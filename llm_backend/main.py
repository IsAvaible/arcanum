
from app import app
from routes import routes

def init_flask():
    """
    start flask and make it available to the local network
    """
    app.register_blueprint(routes)
    app.run(host="0.0.0.0", port=5001, debug=True)


if __name__ == "__main__":
    init_flask()
