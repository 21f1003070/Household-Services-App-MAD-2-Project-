from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from flask_security.models import fsqla_v3 as fsq

db=SQLAlchemy() #Instance of SQLAlchemy

fsq.FsModels.set_db_info(db)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key = True)
    email = db.Column(db.String, nullable = False, unique = True)
    password = db.Column(db.String, nullable = False)
    full_name = db.Column(db.String, nullable = False)
    pin = db.Column(db.Integer)
    phone = db.Column(db.Integer)
    address = db.Column(db.String)
    service_type = db.Column(db.String)
    experience = db.Column(db.Integer)
    description_of_service = db.Column(db.String)
    profile_doc = db.Column(db.String, default="None")
    active = db.Column(db.Boolean)
    fs_uniquifier = db.Column(db.String(), nullable = False)
    roles = db.relationship('Role', secondary = 'user_roles')


class Role(db.Model, RoleMixin):
    __tablename__= 'role'
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(80), unique = True, nullable = False)
    description = db.Column(db.String)


class UserRoles(db.Model):
    __tablename__= 'user_roles'
    id = db.Column(db.Integer, primary_key = True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)


class Services(db.Model):
    __tablename__= 'services'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    service_type=db.Column(db.String,nullable=False)
    service_description = db.Column(db.Text)
    service_charges = db.Column(db.Integer)
    time_permitted=db.Column(db.Integer,nullable=False)


class Service_Requests(db.Model):
    __tablename__= 'service_requests'
    id = db.Column(db.Integer, primary_key = True)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    professional_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    request_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completion_date = db.Column(db.DateTime)  
    request_status = db.Column(db.String(20), default="requested", nullable=False)
    
    service_remarks = db.Column(db.Text)

    # Relationships to services, customers, professionals
    service = db.relationship('Services', backref='service_requests')
    professional = db.relationship('User', foreign_keys = [professional_id])
    customer = db.relationship('User', foreign_keys= [customer_id])

    def __repr__(self):
        return f"<Service_Requests(id={self.id}, request_status={self.request_status})>"



class Feedbacks(db.Model):
    __tablename__= 'feedbacks'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # rating can be 1-5 for example
    service_feedback = db.Column(db.Text, nullable=True)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    service = db.relationship('Services', backref='feedbacks')
    customer = db.relationship('User', backref='feedbacks')

    def __repr__(self):
        return f"<Feedbacks(id={self.id}, rating={self.rating}, service_id={self.service_id})>"