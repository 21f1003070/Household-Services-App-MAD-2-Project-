const ProfessionalDashboard = {
    template: `
      <div>
        <div class="px-3 mt-4 pb-5">
          <h3>Received Requests</h3>
          <table class="table table-bordered table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer Name</th>
                <th>Contact Number</th>
                <th>Customer Email</th>
                <th>Address</th>
                <th>Service Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
            
              <tr v-for="request in service_requests" :key="request.id">
                <td>{{ request.id }}</td>
                <td>{{ request.customer_name }}</td>
                <td>{{ request.customer_phone }}</td>
                <td>{{ request.customer_email }}</td>
                <td>{{ request.customer_address }}</td>
                <td>{{ request.service_name }}</td>
                <td>
                  <div v-if="request.request_status !== 'accepted'">
                    <button class="btn btn-sm btn-secondary" @click="accept(request.id)">Accept Request</button>
                    <button class="btn btn-sm btn-danger" @click="reject(request.id)">Reject Request</button>
                  </div>
                  <div v-else>
                    <button class="btn btn-sm btn-success" @click="complete(request.id)">Complete Job</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>    
        </div>
  
        <div class="px-3 mt-4 pb-5">
          <h3>Closed Services</h3>
          <table class="table table-bordered table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Service Name</th>
                <th>Customer Name</th>
                <th>Pin Code</th>
                <th>Customer Email</th>
                <th>Date of completion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="clreq in closed_requests" :key="clreq.id">
                <td>{{ clreq.id }}</td>
                <td>{{ clreq.service_name }}</td>
                <td>{{ clreq.customer_name }}</td>
                <td>{{ clreq.customer_pin }}</td>
                <td>{{ clreq.customer_email }}</td>
                <td>{{ clreq.date_of_completion }}</td>
              </tr>
            </tbody>
          </table>    
        </div>  
      </div>
    `,
  
    data() {
      return {
        service_requests: [],          // Requests received that are to be accepted or rejected
        closed_requests: []       // Requests of Services that have been completed
      };
    },
  
    methods: {
      async fetchservice_req() {
        // const professionalPin = sessionStorage.getItem('pin');
        const professional_id = sessionStorage.getItem('id');
  
        try {
          const res = await fetch('/api/service_requests', {
            method: 'GET',
            headers: {
              "Authentication-Token": sessionStorage.getItem("token"),
            },
          });
  
          if (res.ok) {
            const allrequests = await res.json();
  
            // Filter today's services where professional_id is 0 (available for professional) and matches the pin
            this.service_requests = allrequests.filter(request =>  
              request.request_status !== 'closed'
            );
  
            // Closed services where the professional_id matches and the service is completed
            this.closed_requests = allrequests.filter(request => 
              request.professional_id == professional_id && request.request_status === 'closed'
            );
          } else {
            console.error('Failed to fetch Service Requests');
          }
        } catch (error) {
          console.error('Error fetching Service Requests:', error);
        }
      },
  
      async accept(serviceId) {
        const professional_id = sessionStorage.getItem('id');
  
        try {
          const res = await fetch(`/api/service_requests/${serviceId}`, {
            method: 'PATCH',
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": sessionStorage.getItem("token"),
            },
            body: JSON.stringify({
              professional_id: professional_id,
              request_status: 'accepted'
            })
          });
  
          if (res.ok) {
            // Update the service status to 'accepted'
            this.service_requests = this.service_requests.map(request => {
              if (request.id === serviceId) {
                return { ...request, request_status: 'accepted' };  // Mark the service as accepted
              }
              return request;
            });
          } else {
            console.error('Failed to accept the service request');
          }
        } catch (error) {
          console.error('Error accepting service:', error);
        }
      },
  
      async reject(serviceId) {
        try {
          const res = await fetch(`/api/service_requests/${serviceId}`, {
            method: 'PATCH',
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": sessionStorage.getItem("token"),
            },
            body: JSON.stringify({
              request_status: 'rejected'
            })
          });
  
          if (res.ok) {
            // Remove the rejected service from the list
            this.service_requests = this.service_requests.filter(request => request.id !== serviceId);
          } else {
            console.error('Failed to reject the service request');
          }
        } catch (error) {
          console.error('Error rejecting service:', error);
        }
      },
  
      async complete(serviceId) {
        console.log('Completing service with ID:', serviceId); 
        try {
          const res = await fetch(`/api/service_requests/${serviceId}`, {
            method: 'PATCH',
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": sessionStorage.getItem("token"), 
            },
            body: JSON.stringify({
              request_status: 'closed', 
              date_of_completion: new Date().toISOString() 
            })
          });
      
          if (res.ok) {
            // Success, update the service in the list
            console.log('Service completed successfully!');
      
            // Update the service in the service_requests and move it to closed_requests
            this.service_requests = this.service_requests.filter(request => {
              if (request.id === serviceId) {
                // Move to closed_requests
                const updatedRequest = {
                  ...service,
                  request_status: 'closed',  // Update the status in the frontend state
                  date_of_completion: new Date().toISOString() // Update the completion date
                };
      
                // Add to closed_requests
                this.closed_requests.push(updatedRequest);
      
                return false; // Remove this service from service_requests
              }
              return true; // Keep other services in service_requests
            });
      
            alert('Service completed and updated in the system.');
          } else {
            // If the API request failed
            console.error('Failed to complete the service.');
            alert('Error: Failed to complete the service.');
          }
        } catch (error) {
          console.error('Error completing service:', error);
          alert('Error: Something went wrong.');
        }
      }
      
      
    },
  
    mounted() {
      this.fetchservice_req(); // Fetch today's and closed services when component mounts
    },
  };
  
  export default ProfessionalDashboard;
  