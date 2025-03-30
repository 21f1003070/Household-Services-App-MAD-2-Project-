from flask_restful import Resource, Api, fields, reqparse, marshal_with, marshal
from flask_security import auth_required, roles_required, current_user
from models import User, Services, Service_Requests, Feedbacks, Role, db
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from datetime import datetime
from flask import request,Blueprint,jsonify,session
import uuid
from flask_login import current_user
from werkzeug.security import check_password_hash,  generate_password_hash
import traceback
import json 
from sqlalchemy import or_,cast,String
from sqlalchemy.orm import joinedload



api = Api(prefix='/api')

parser = reqparse.RequestParser() # convert data to dictionary

# API section for services 
parser.add_argument('name', type=str, required=True)
parser.add_argument('service_type', type=str)
parser.add_argument('service_charges', type=int)
parser.add_argument('service_description', type=str)
parser.add_argument('time_permitted', type=int)

service_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'service_type': fields.String,
    'service_charges': fields.Integer,
    'service_description': fields.String,    
    'time_permitted': fields.Integer
}

class ServiceResourceAPI(Resource):
    
    @marshal_with(service_fields)
    def get(self):
        services = Services.query.all()
        return services
    
    
    @marshal_with(service_fields)
    def post(self):
        args = parser.parse_args()
        service = Services(
            name=args.name,
            service_type=args.service_type,
            service_charges=args.service_charges,
            service_description=args.service_description,            
            time_permitted=args.time_permitted         
        )
        db.session.add(service)
        db.session.commit()
        return {'message': 'Service created successfully'}, 201

    
    def put(self, id):
        service = Services.query.get_or_404(id)
        args = parser.parse_args()
        service.name = args.name
        service.service_type=args.service_type
        service.service_charges = args.service_charges
        service.service_description = args.service_description      
        service.time_permitted=args.time_permitted
        db.session.commit()
        return {'message': 'Service updated successfully'}, 200

    
    def delete(self, id):
        # Finding all service requests related to this service
        related_requests = Service_Requests.query.filter_by(service_id=id).all()

        # Deleting all service requests related to this service
        for request in related_requests:
            db.session.delete(request)

        # Deleting the service too
        service = Services.query.get_or_404(id)
        db.session.delete(service)
        
        try:
            db.session.commit() 
            return {'message': 'Service and related service requests deleted'}, 200
        except IntegrityError as e:
            db.session.rollback()
            return {'message': f'Error deleting service: {str(e)}'}, 400


api.add_resource(ServiceResourceAPI, '/services', '/services/<int:id>')




# API section for Service Requests

parser.add_argument('professional_id', type=int)
parser.add_argument('service_id', type=int)
parser.add_argument('remarks', type=str)

service_req_fields = {
    'id': fields.Integer,
    'customer_id': fields.Integer,
    'customer_name': fields.String(attribute='customer.full_name'),  
    'customer_email': fields.String(attribute='customer.email'),
    'customer_phone': fields.String(attribute='customer.phone'),
    'customer_address': fields.String(attribute='customer.address'),
    'customer_pin': fields.String(attribute='customer.pin'),
    'professional_id': fields.Integer,
    'professional_name': fields.String(attribute='professional.full_name'),  
    'professional_email': fields.String(attribute='professional.email'),
    'professional_address': fields.String(attribute='professional.address'),
    'professional_phone': fields.String(attribute='professional.phone'),  
    'professional_pin': fields.String(attribute='professional.pin'),
    'service_id': fields.Integer,
    'service_name': fields.String(attribute='service.name'),  
    'service_type': fields.String(attribute='professional.service_type'),
    'date_of_request': fields.DateTime,
    'date_of_completion': fields.DateTime,
    'request_status': fields.String,
    'remarks': fields.String
}



class ServiceRequestResourceAPI(Resource):
    @auth_required('token')
    @marshal_with(service_req_fields)
    def get(self):
        user = current_user  

        if any(role.name in ['admin', 'professional'] for role in user.roles):
            service_requests = Service_Requests.query.all()
        else:
            service_requests = Service_Requests.query.filter_by(customer_id=user.id).all()

        return service_requests


    @auth_required('token')
    def post(self):
        data = request.get_json()
        customer = current_user

        service_id = data.get('service_id')
        if not service_id:
            return {'message': 'Service ID not found'}, 400

        # Check if the service_id is provided
        service = Services.query.get(service_id)
        if not service:
            return {'message': 'Service not found'}, 404

        # Optional: Check if a professional is provided
        professional_id = data.get('professional_id')
        professional = None
        if professional_id:
            professional = User.query.get(professional_id)
            if not professional:
                return {'message': 'Professional not found'}, 404

        # Createing new service request
        service_request = Service_Requests(
            customer_id=customer.id,  
            professional_id=professional.id if professional else None,  
            service_id=service.id,
            service_remarks=data.get('remarks', "No remarks"),
            request_status="requested"  
        )

        db.session.add(service_request)
        db.session.commit()

        return {'message': 'Successfully made Request', 'service_request_id': service_request.id, 'request_status': service_request.request_status}, 201


api.add_resource(ServiceRequestResourceAPI, '/service_requests')


class ServiceRequestResourcePatchAPI(Resource):

    @auth_required('token')
    @marshal_with(service_req_fields)
    def patch(self,service_request_id):
        data = request.get_json()
        service_request = Service_Requests.query.get_or_404(service_request_id)

        professional_id = data.get('professional_id')
        if professional_id:  # Only update if professional_id is provided
            professional = User.query.get(professional_id)
            if not professional:
                return {'message': 'Professional not found'}, 404
            service_request.professional_id = professional.id

        # Updating request status
        if 'request_status' in data:
            service_request.request_status = data['request_status']
            if data['request_status'] == 'closed':
                service_request.date_of_completion = datetime.utcnow()

        db.session.commit()
        return {'message': 'Service Request status updated successfully', 'request_status': service_request.request_status,'service_remarks':""}, 200


api.add_resource(ServiceRequestResourcePatchAPI, '/service_requests/<int:service_request_id>')




customer_fields = {
    'id': fields.Integer,
    'full_name': fields.String,  
    'email': fields.String,
    'phone': fields.String,
    'address': fields.String,
    'pin': fields.String,

}

professional_fields = {
    'id': fields.Integer,
    'full_name': fields.String,  
    'email': fields.String,
    'phone': fields.String,
    'address': fields.String,
    'pin': fields.String,
    'service_type': fields.String,
    'experience': fields.Integer,

}

# API section for Deleting Professionals

class ServiceProfessionalResourcesAPI(Resource):
    #@auth_required('token')
    def delete(self, user_id):
        professional = User.query.filter_by(id = user_id).first()
        if professional:
            db.session.delete(professional)
            db.session.commit()
            return{'message': f'Service professional with ID {user_id} deleted'}, 200
        else:
            return {'message': 'Service professional not found'}, 404


api.add_resource(ServiceProfessionalResourcesAPI, '/service_professional/<int:user_id>')




# API section for Searching for admin

class SearchAPI(Resource):
    @auth_required("token")
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('search', help="Search Key", required=True)
        args = parser.parse_args()
        search_value = args.get('search')
        search = "%{}%".format(search_value)
        search1 = f"%{search_value}%"
        
        user = current_user  

        if any(role.name == 'admin' for role in user.roles):
            services = Services.query.filter(Services.name.like(search)).all()
            professional = User.query.join(User.roles).filter(Role.name=='professional').filter(or_(User.full_name.ilike(search1),cast(User.pin,String).ilike(search1))).options(joinedload(User.roles)).all()
            customer = User.query.join(User.roles).filter(Role.name=='customer').filter(or_(User.full_name.ilike(search1),cast(User.pin,String).ilike(search1))).options(joinedload(User.roles)).all()
            print(professional)

            # service_requests = Service_Requests.query.filter(Service_Requests.remarks.like(search)).union(
            #     Service_Requests.query.filter(Service_Requests.service_id.in_(
            #         Services.query.filter(Services.name.like(search)).with_entities(Services.id)
            #     ))
            # ).all()
        elif any(role.name == 'professional' for role in user.roles):
            services = Services.query.filter(Services.name.like(search)).all()
            service_requests = Service_Requests.query.filter_by(professional_id=user.id).all()
        elif any(role.name == 'customer' for role in user.roles):
            services = Services.query.filter(Services.name.like(search)).all()
            service_requests = Service_Requests.query.filter_by(customer_id=user.id).all()
        else:
            return {'message': 'Unauthorized'}, 403

        return {
            "professionals1" : marshal(professional,professional_fields),
            "customers": marshal(customer,customer_fields),
            "services": marshal(services, service_fields),

        }

api.add_resource(SearchAPI, '/search_services')


# @app.route('/api/update_block_status', methods=['POST'])
# def update_block_status():
#     data = request.json
#     user_id = data.get('user_id')
#     isBlocked = data.get('isBlocked')

#     # Simulate updating in the database
#     if user_id in users:
#         users[user_id]['isBlocked'] = isBlocked
#         return jsonify({"message": "User status updated successfully"}), 200
#     else:
#         return jsonify({"error": "User not found"}), 404



# API section for Charts

class SummaryAPI(Resource):
    def get(self):
        try:
            total_services = Services.query.count()
            total_requests = Service_Requests.query.count()
            total_users = User.query.count()
            active_users = User.query.filter_by(active=1).count()  # Assuming 'active' is a Boolean field
            inactive_users = User.query.filter_by(active=False).count()

            accepted_requests = Service_Requests.query.filter_by(request_status='accepted').count()
            rejected_requests = Service_Requests.query.filter_by(request_status='rejected').count()
            closed_requests = Service_Requests.query.filter_by(request_status='closed').count()


            summary_admin = {
                "totalServices": total_services,
                "totalRequests": total_requests,
                "totalUsers": total_users,
                "activeUsers": active_users,
                "inactiveUsers": inactive_users,
                "AcceptedRequests": accepted_requests,
                "RejectedRequests": rejected_requests,
                "ClosedRequests": closed_requests,
            }
            user = current_user
            if any(role.name == 'customer' for role in user.roles):
                accepted_requests = Service_Requests.query.filter_by(request_status='accepted',customer_id=user.id).count()
                rejected_requests = Service_Requests.query.filter_by(request_status='rejected',customer_id=user.id).count()
                closed_requests = Service_Requests.query.filter_by(request_status='closed',customer_id=user.id).count()
                summary_customer = {
                    "AcceptedRequests": accepted_requests,
                    "RejectedRequests": rejected_requests,
                    "ClosedRequests": closed_requests,
                    }
                return summary_customer, 200
            return summary_admin, 200
        except Exception as e:
            return {"message": "Error creating summary", "error": str(e)}, 500


api.add_resource(SummaryAPI, '/summary')





# API section for Feedbacks

feedback_fields = {
    'id': fields.Integer,
    'service_id': fields.Integer,
    'service_name': fields.String,
    'customer_id': fields.Integer,
    'customer_name': fields.String,        
    'rating': fields.Integer,
    'service_feedback': fields.String,
    'date': fields.DateTime() 
}


feedback_parser = reqparse.RequestParser()
feedback_parser.add_argument('rating', type=int, required=True)
feedback_parser.add_argument('service_feedback', type=str, required=False)
feedback_parser.add_argument('service_id', type=int, required=False)

class FeedbackResourceAPI(Resource):
    @marshal_with(feedback_fields)
    def get(self):

        feedbacks = (
            db.session.query(Feedbacks)
            .join(User, Feedbacks.customer_id == User.id) 
            .join(Services, Feedbacks.service_id == Services.id)  
            .with_entities(Feedbacks.id,Feedbacks.service_id,Feedbacks.customer_id,Feedbacks.rating,Feedbacks.service_feedback,Feedbacks.date,User.full_name.label('customer_name'),Services.name.label('service_name') )
            .order_by(Feedbacks.service_id, Feedbacks.rating.desc())  
            .all()
        )

        return feedbacks, 200


    @auth_required('token')
    def post(self,service_id):
        #print(current_user)
        args = feedback_parser.parse_args()
        # print(args)
        sid= args.service_id

        service = Services.query.get(sid)
        print(service)

        customer = current_user
        print(customer)
        if not customer:
            return {'message': 'Not found'}, 401

        feedback = Feedbacks(
            service_id=service.id,
            customer_id=customer.id,
            rating=args['rating'],
            service_feedback=args.get('comments', None),
            date=datetime.utcnow()
        )

        db.session.add(feedback)
        db.session.commit()

        return {'message': 'Feedback submitted successfully', 'feedback': marshal(feedback, feedback_fields)}, 201


api.add_resource(FeedbackResourceAPI, '/services/<int:service_id>/feedback', '/feedbacks')
