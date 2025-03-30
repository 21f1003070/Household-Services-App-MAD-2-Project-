from flask_security import SQLAlchemyUserDatastore
from flask_security.utils import hash_password
from models import db


from flask_sqlalchemy import SQLAlchemy
from flask_security import Security
from flask_caching import Cache

from flask import current_app as app

security = Security()
cache = Cache()

def create_data(user_datastore : SQLAlchemyUserDatastore):

    print('App started')

    # create roles
    user_datastore.find_or_create_role(name= 'admin', description = "Administrator")
    user_datastore.find_or_create_role(name= 'professional', description = "Service Professional")
    user_datastore.find_or_create_role(name= 'customer', description = "Customer")

    # create user data

    if not user_datastore.find_user(email = "admin@gmail.com"):
        user_datastore.create_user(email = "admin@gmail.com", password = hash_password('pass'),full_name = 'Application Admin', roles=['admin'])


    db.session.commit()