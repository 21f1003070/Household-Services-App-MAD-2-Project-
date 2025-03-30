from celery import shared_task
from flask_excel import make_response_from_query_sets
from models import User, Role,Services,Service_Requests
from jinja2 import Template
from .mail_service import send_message
import time



@shared_task(ignore_result=False)
def finished_service_requests_csv():

    finished_requests = Service_Requests.query.filter_by(service_status="finished").with_entities(
        Service_Requests.id,
        Service_Requests.professional_id,
        Service_Requests.customer_id,
        Service_Requests.date_of_request,
        Service_Requests.preferred_date,
        Service_Requests.preferred_time,
        Service_Requests.service_status
    ).all()
    csv_output = make_response_from_query_sets(
        finished_requests,
        ["id","professional_id","customer_id", "date_of_request", "preferred_date", "preferred_time", "service_status"],
        "csv"
    )
    filename = "Finished_Service_Requests.csv"
    with open(filename, 'wb') as f:
        f.write(csv_output.data)
    return filename