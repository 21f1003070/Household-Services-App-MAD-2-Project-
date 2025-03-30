const AdminSearch = {
    template: `
        <div class="px-3 mt-4 pb-5">
            <h3>Search for Services or Service Requests</h3>

            <!-- Search box -->
            <div class="input-group mb-3">
                <input type="text" v-model="searchQuery" class="form-control" placeholder="Search by user name or pincode" @keyup.enter="searchService">
                <button class="btn btn-primary" @click="searchService">Search</button>
            </div>



            <div class="professional-list">
                <h4>Available Professionals</h4>
                <table class="table table-striped">
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Experience</th>
                    <th>Service Name</th>
                    <th>Block/Unblock Status</th>
                    <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in searchResults.professionals1" :key="user.id">
                    <td>{{ user.id }}</td>
                    <td>{{ user.full_name }}</td>
                    <td>{{ user.experience }}</td>
                    <td>{{ user.service_type }}</td>
                    <td>{{ user.isBlocked ? 'Blocked' : 'Active' }}</td>
                    <td>
                    <button @click="toggleBlock(user)" :class="{ blocked: user.isBlocked }">{{ user.isBlocked ? 'Unblock' : 'Block' }}
                    </button>
                    </td>
                    </tr>
                </tbody>
                </table>
            </div>


            <div class="customer-list">
                <h4>Available Customers</h4>
                <table class="table table-striped">
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Pin</th>
                    <th>Block/Unblock Status</th>
                    <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in searchResults.customers" :key="user.id">
                    <td>{{ user.id }}</td>
                    <td>{{ user.full_name }}</td>
                    <td>{{ user.pin }}</td>
                    <td>{{ user.isBlocked ? 'Blocked' : 'Active' }}</td>
                    <td>
                    <button @click="toggleBlock(user)" :class="{ blocked: user.isBlocked }">{{ user.isBlocked ? 'Unblock' : 'Block' }}
                    </button>
                    </td>
                    </tr>
                </tbody>
                </table>
            </div>

          </div>
        </div>
    `,

    data() {
        return {
            searchQuery: '',
            searchResults:[],
            isBlocked: false
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
                const res = await fetch(window.location.origin + "/api/search_services", {
                    method:'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': sessionStorage.getItem("token")
                    },
                    body: JSON.stringify({
                        search: this.searchQuery
                    })
                });

                if (res.ok) {

                    this.searchResults = await res.json();
                    console.log(searchResults)
                } else {
                    alert("Search failed");
                }
            } catch (error) {
                console.error('Error during search:', error);
            }
        },

        toggleBlock(user) {
            this.$set(user, 'isBlocked', !user.isBlocked);
          },
        
        getParticipantName(request) {
            return request.professional_name || request.customer_name;
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

          async professionals() {
            try {
              const res = await fetch(window.location.origin + "/inactive_servicepro", {
                headers: {
                  "Authorization": "Bearer " + sessionStorage.getItem("token"),
                },
              });
          
              if (!res.ok) {
                console.error("Error fetching data:", res.status, await res.text());
                return;
              }
          
              this.inactiveServpro = await res.json();
              console.log(this.inactiveServpro);
            } catch (error) {
              console.error("Fetch failed:", error);
            }        
    },
}
};

export default AdminSearch;
