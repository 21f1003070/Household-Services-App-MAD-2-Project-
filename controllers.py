from flask import current_app as app, jsonify, request, render_template,render_template_string, send_file
from flask_security import auth_required, roles_required, roles_accepted,verify_password,hash_password, SQLAlchemyUserDatastore
from models import User, db, UserRoles, Role, Services
from flask_login import current_user, login_user, logout_user
from sqlalchemy import text,and_
from werkzeug.utils import secure_filename
from jinja2 import Environment, FileSystemLoader

import os

# # Debugging: Print the resolved template folder path
# template_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'templates')
# print("Template folder path:", template_folder)


def create_view(app, user_datastore : SQLAlchemyUserDatastore, db):

    #building route for homepage
    @app.route('/')
    def home():
        return render_template ('index.html')


    #building route for log in page
    @app.route('/user-login', methods=['POST'])
    def login():

        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        print(email)
        
        if not email or not password:
            return jsonify({'message' : 'not valid email or password'}), 404
        
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({'message' : 'invalid user'}), 404
        
        if verify_password(password, user.password):
            print (user.email)
            return jsonify({'token' : user.get_auth_token(),'role' : user.roles[0].name, 'id' : user.id, 'email' : user.email, 'pin' : user.pin }), 200
        else:
            return jsonify({'message' : 'wrong password'})


    #building route for sign up page
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()

        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        pin = data.get('pin')
        phone = data.get('phone')
        address = data.get('address')
        role = data.get('role')

        service_type = None
        experience = None
        description_of_service = None

        if role == 'professional':
            service_type = data.get('service_type')
            experience = data.get('experience')
            description_of_service = data.get('description_of_service')
 
            file = request.files.get("upload_profile")  # Corrected file access
            url = ""
            if file and file.filename:  # Check if file exists and has a valid filename
                file_name = secure_filename(file.filename)  # Secure the file name
                # Save the file with a unique filename
                url = './static/' + full_name + "_" + file_name
                if not os.path.exists('./static/'):
                    os.makedirs('./static/')  # Create directory if it doesn't exist
                file.save(url)  # Save the file to the server

        if not email or not password or role not in ['customer', 'professional']:
            return jsonify({"message" : "invalid input"})
        
        if user_datastore.find_user(email=email):
            return jsonify({"message" : "user already exists"})
        
        # if registering for service professional,then initially active = False
        if role == 'professional':
            active = False
        elif role == 'customer':
            active = True
        try:    
            user_datastore.create_user(email = email, password = hash_password(password), full_name=full_name, pin = pin, phone = phone, roles = [role], address = address, active = active, experience = experience, service_type = service_type, description_of_service=description_of_service, profile_doc=url )
            db.session.commit()
        except:
            print('error while creating')
            db.session.rollback()
            return jsonify({'message' : 'error while creating user'}), 408
        
        return jsonify({'message' : 'user created'}), 200    
 

    #building route for getting all Service Professionals
    #@roles_required('admin')
    @app.route('/all-service-professionals', methods=['GET','POST'])
    def get_all_service_professionals():

        users = user_datastore.user_model().query.all()        
       
        professionals = [
            user for user in users 
            if any(role.name == 'professional' for role in user.roles)
        ]        
       
        profs = [
            {
                'id': user.id,
                'name': user.full_name,
                'service' : user.service_type,
                'experience': user.experience,
            }
            for user in professionals
        ]
        print(profs)

        return jsonify(profs), 200

    #building route for activating Service Professionals by Admin
    #@auth_required('token')
    @roles_required('admin')
    @app.route('/activate-service-professional/<int:id>' )
    def activate_service_professionals(id):

        user = user_datastore.find_user(id=id)
        if not user:
            return jsonify({'message' : 'User not found'}), 404

        if (user.active == True):
            return jsonify({'message' : 'Professional already active'}), 400

        user.active = True
        db.session.commit()
        return jsonify({'message' : 'Activated Service Professional successfully'}), 200


    #building route for getting all Services available at a certain Customer's pincode
    @app.route('/services/<int:customer_id>', methods=['GET','POST'])
    def services(customer_id):
        customer=User.query.filter_by(id=customer_id).first()
        pincode=customer.pin 
        professionals = User.query.filter(
        User.roles.any(Role.name == 'professional'),
        User.active == True,
        User.pin == pincode
    ).all()
        print(professionals)

        services_set = set()
        #for professional in professionals:
            #professional_services = Service.query.filter_by(name=professional.service_type).all()
        services = []
        for professional in professionals:
            matching_services = Services.query.filter_by(service_type=professional.service_type).all()
            for service in matching_services:
                services.append({
                    'id': service.id,
                    'name': service.name,
                    'price': service.service_charges,
                    'description': service.service_description,
                    'professional_id': professional.id,
                    'professional_name': professional.full_name,
                    'professional_phone': professional.phone
                    })
        return jsonify(services), 200
       

