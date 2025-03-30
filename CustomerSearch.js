const CustomerSearch = {
    template: `
        <div class="px-3 mt-4 pb-5">
            <h3>Search for Services or Service Requests</h3>

            <!-- Search box -->
            <div class="input-group mb-3">
                <input type="text" v-model="searchQuery" class="form-control" placeholder="Search by service names" @keyup.enter="searchService">
                <button class="btn btn-primary" @click="searchService">Search</button>
            </div>

                        <!-- Search results for services (visible to non-admin users) -->
            <h4 >Services</h4>
            <table class="table table-bordered table-striped" >
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Service Name</th>
                        <th>Service Type</th>
                        <th>Professional Name</th>
                        <th>Description</th>
                        <th>Service Charges</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="service in services" :key="service.id">
                        <td>{{ service.id }}</td>
                        <td>{{ service.name }}</td>
                        <td>{{ service.name }}</td>
                        <td>{{ service.professional_name }}</td>
                        <td>{{ service.description }}</td>
                        <td>{{ service.price }}</td>
                        <td>
                        <span v-if="bookedServices.includes(service.id)">Booked</span>
                        <button v-if= "bookedServices.status === 'accepted'" class="btn btn-sm btn-success" @click="complete(service.id)">Complete</button>
                        <button v-else class="btn btn-success" @click="bookService(service.id)">Book</button>

                        </td>
                    </tr>
                </tbody>
            </table>


        </div>
    `,

    data() {
        return {
            searchQuery: '',
            services:[],
            bookedServices: [],
            closed_services:[],
            searchResults: {
                // services: [],
                service_requests: []
            }
        };
    },

    computed: {
        userRole() {
            return sessionStorage.getItem('role'); // Get the user role from sessionStorage
        }
    },

    methods: {
        
      async searchService() {
        try {
            const customer_id = sessionStorage.getItem('id');
            const query = this.searchQuery ? `?query=${encodeURIComponent(this.searchQuery)}` : '';
    
            const res = await fetch(`${window.location.origin}/services_search/${customer_id}${query}`, {
                headers: {
                    "Authorization": "Bearer " + sessionStorage.getItem("token"),
                },
            });
    
            if (!res.ok) {
                console.error("Error fetching data:", res.status, await res.text());
                return;
            }
    
            this.services = await res.json();
        } catch (error) {
            console.error("Search failed:", error);
        }
    },
    
        

        
        async bookService(id) {
            try {
              const res = await fetch(`${window.location.origin}/api/service_requests`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',  
                  'Authentication-Token': sessionStorage.getItem("token"), 
                },
                body: JSON.stringify({
                  service_id: id,  
                  remarks: 'Customer requested service', 
                }),
              });
      
              if (res.ok) {
                const data = await res.json();
                alert("Service booked successfully!");
                
                // Add the booked service ID to the bookedServices array
                this.bookedServices.push(id);
              } else {
                const errorData = await res.json();
                alert(`Error booking service: ${errorData.message}`);
              }
            } catch (error) {
              console.error('Error during booking:', error);
              alert("An error occurred while booking the service.");
            }
          },


          async checkServiceStatus() {
            try {
              const res = await fetch(`${window.location.origin}/api/service_requests`, {
                headers: {
                  "Authentication-Token": sessionStorage.getItem("token"),
                },
              });
      
              if (res.ok) {
                const activeServices = await res.json();
      
                // Identify services booked by the user that are not closed
                this.bookedServices = activeServices
                  .filter(service => service.service_status !== 'closed')  
                  .map(service => service.service_id);  
                console.log(bookedServices)
              } else {
                console.error("Error fetching service status:", res.statusText);
              }
            } catch (error) {
              console.error("Error during status check:", error);
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
                  service_status: 'closed', 
                  date_of_completion: new Date().toISOString() 
                })
              });
          
              if (res.ok) {
                
                console.log('Service completed successfully!');
          
                // Update the service in the service_requests and move it to closed_services
                console.log(this.service_requests)
                this.service_requests = this.service_requests.filter(service => {
                  if (service.id === serviceId) {
                    // Move to closed_services
                    const updatedService = {
                      ...service,
                      service_status: 'closed',  
                      date_of_completion: new Date().toISOString() 
                    };
          
                    // Add the updated service to closed_services
                    this.closed_services.push(updatedService);
          
                    return false; 
                  }
                  return true; 
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
    }
};

export default CustomerSearch;
