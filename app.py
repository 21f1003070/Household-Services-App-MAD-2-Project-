from flask import Flask
import os
from flask_caching import Cache
from flask_security import Security
from models import db
import backend.controllers as con
import backend.resources as res
import initial_data as i

security = Security()

def create_app():
    static_folder = os.path.join(os.path.dirname(__file__), 'frontend', 'static')
    app = Flask(__name__,static_folder=static_folder, template_folder=os.path.join(os.path.dirname(__file__), 'frontend', 'templates'))

    app.config['SECRET_KEY'] = "should-not-be-exposed"
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///household_services_app_database.sqlite3"
    app.config['SECURITY_PASSWORD_SALT'] = 'salty-password'
    app.config['SQLALCHEMY_DATABASE_TRACK'] = False

    db.init_app(app)
    
    with app.app_context():
        from models import User, Role
        from flask_security import SQLAlchemyUserDatastore

        user_datastore = SQLAlchemyUserDatastore(db, User, Role)
        security.init_app(app, user_datastore)
        db.create_all()
        i.create_data(user_datastore)

    app.config['WTF_CSRF_CHECK_DEFAULT'] = False
    app.config['SECURITY_CSRF_PROTECT_MECHANISMS'] = []
    app.config['SECURITY_CSRF_IGNORE_UNAUTH_ENDPOINTS'] = True

    # Import and register controllers
    con.create_view(app, user_datastore, db)

    # Initialize API
    res.api.init_app(app)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
