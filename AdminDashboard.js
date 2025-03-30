const AdminDashboard = {
    template: `
      <div class="container mt-5">
        <h1 class="text-center mb-4">Admin Dashboard</h1>
  
        <!-- Summary -->
        <div class="row mb-4">
          <div class="col-md-4" v-for="(stat, key) in statsDisplay" :key="key">
            <div :class="'card text-white mb-3 ' + stat.bgClass">
              <div class="card-body">
                <h5 class="card-title">{{ stat.title }}</h5>
                <p class="card-text">{{ stat.count }}</p>
              </div>
            </div>
          </div>
        </div>
  
        <!-- User Distribution Graph -->
        <div class="row mb-5">
          <div class="col-md-6">
            <h3 class="text-center">User Distribution</h3>
            <canvas id="UserDistribution" style="max-width: 500px; max-height: 300px;"></canvas>
          </div>
          
        </div>
  
        <!--Section for Creating or Updating Service -->
        <div class="service-management">
          <h3 class="mb-3">Manage Services</h3>
          <form @submit.prevent="execute('createOrUpdate')" class="mb-4">
            <div class="form-group">
              <label for="serviceName">Service Name:</label>
              <input type="text" id="serviceName" class="form-control" v-model="serviceForm.name" required />
            </div>
            <div class="form-group">
              <label for="serviceCategory">Service Type:</label>
              <input type="text" id="serviceCategory" class="form-control" v-model="serviceForm.service_type" required />
            </div>
            <div class="form-group">
              <label for="serviceDescription">Description:</label>
              <textarea id="serviceDescription" class="form-control" v-model="serviceForm.service_description"></textarea>
            </div>                        
            <div class="form-group">
              <label for="servicePrice">Charges:</label>
              <input type="number" id="servicePrice" class="form-control" v-model="serviceForm.service_charges" />
            </div>
            <div class="form-group">
              <label for="serviceTime">Max Time Permitted (in hours):</label>
              <input type="number" id="serviceTime" class="form-control" v-model="serviceForm.time_permitted" required />
            </div>
            <div>
            <button type="submit" class="btn btn-primary">
              {{ isUpdate ? 'Update' : 'Create' }} Service           
            </button>
            </div>
          </form>
  
          <!-- List of all Services -->
          <div class="service-list">
            <h4>Available Services</h4>
            <table class="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Service Charges</th>
                  <th>Description</th>
                  <th>Max Time Permitted (hours)</th>    
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="service in services" :key="service.id">
                  <td>{{ service.name }}</td>
                  <td>{{ service.service_type }}</td>
                  <td>₹{{ service.service_charges }}</td>
                  <td>{{ service.service_description || 'No description available' }}</td>
                  <td>{{ service.time_permitted }}</td>           
                  <td>
                    <button @click="editService(service)" class="btn btn-warning">Edit</button>
                    <button @click="execute('delete', service.id)" class="btn btn-danger">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
                    <!-- List of all Service Professionals -->
          <div class="professional-list">
            <h4>Available Professionals</h4>
            <table class="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Experience</th>
                  <th>Service Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in inactiveServpro" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.name }}</td>
                  <td>{{ user.experience }}</td>
                  <td>{{ user.service }}</td>
                  <td>
                    <button class="btn btn-sm btn-secondary" @click="activate(user.id)">Accept</button>
                    <button class="btn btn-sm btn-danger" @click="reject(user.id)">Reject</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
                    <!-- List of all Service Requests -->
          <div class="Request-list">
            <h4>Service Requests</h4>
            <table class="table table-bordered table-striped">
              <thead>
              <tr>
              <th>Service Name</th>
              <th>Assigned Professional</th>
              <th>Requested Date</th>
              <th>Status</th>
              </tr>
              </thead>
              <tbody>
                <tr v-for="request in service_requests" :key="request.id">
                  <td>{{ request.service_name }}</td>
                  <td>{{ request.professional_name || 'Not Assigned' }}</td>
                  <td>{{ request.date_of_request }}</td>
                  <td>{{ request.request_status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `,
    data() {
      return {
        services: [],
        service_requests: [],
        inactiveServpro:[],
        serviceForm: {
          name: '',
          service_type: '',
          service_charges: null,
          time_required: null,
          service_description: '',
        },
        isUpdate: false,
        serviceIdToUpdate: null,
        summary: {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          professionalUsers: 0,
          customerUsers: 0,
          serviceStatusSummary: {
            requested: 0,
            accepted: 0,
            rejected: 0,
            finished: 0,
          },
        },
        UserDistribution: null,        
      };
    },
    computed: {
      statsDisplay() {
        return {
          totalUsers: { title: 'Total Users', count: this.summary.totalUsers, bgClass: 'bg-primary' },
          activeUsers: { title: 'Active Users', count: this.summary.activeUsers, bgClass: 'bg-success' },
          inactiveUsers: { title: 'Inactive Users', count: this.summary.inactiveUsers, bgClass: 'bg-danger' },
        };
      },
    },

    created() {
      this.fetchAdminSummary();
      this.fetchServices();
    },

    methods: {
      async fetchAdminSummary() {
        try {
          const response = await fetch('/api/summary');
          if (!response.ok) throw new Error(await response.text());
          const summary = await response.json();
          this.summary = summary;
          this.renderSummary();
        } catch (error) {
          console.error('Error fetching Summary:', error);
        }
      },

      renderSummary() {
        this.renderUserDistribution();        
      },

      renderUserDistribution() {
        const userpie = document.getElementById('UserDistribution').getContext('2d');
        if (this.UserDistribution) this.UserDistribution.destroy();
        this.UserDistribution = new Chart(userpie, {
          type: 'doughnut',
          data: {
            labels: ['Active Users', 'Inactive Users'],
            datasets: [
              {
                label: 'User Distribution',
                data: [this.summary.activeUsers, this.summary.inactiveUsers],
                backgroundColor: ['#28a745', '#dc3545'],
              },
            ],
          },
          options: {
            responsive: true,
          },
        });
      },

      async fetchServices() {
        try {
          const response = await fetch('/api/services');
          if (!response.ok) throw new Error(await response.text());
          this.services = await response.json();
        } catch (error) {
          console.error('Error fetching services:', error);
        }
      },
      async execute(action, serviceId = null) {
        if (action === 'createOrUpdate') {
          this.isUpdate ? this.updateService() : this.createService();
        } else if (action === 'delete') {
          this.deleteService(serviceId);
        }
      },
      async createService() {
        try {
          const response = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.serviceForm),
          });
          if (!response.ok) throw new Error(await response.text());
          const { service_id } = await response.json();
          this.fetchServices();
          this.resetForm();
          alert(`New Service created successfully.`);
        } catch (error) {
          console.error('Error creating New Service:', error);
        }
      },
      async updateService() {
        try {
          const response = await fetch(`/api/services/${this.serviceIdToUpdate}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.serviceForm),
          });
          if (!response.ok) throw new Error(await response.text());
          this.fetchServices();
          this.resetForm();
          alert('Service updated successfully.');
        } catch (error) {
          console.error('Error updating service:', error);
        }
      },
      async deleteService(serviceId) {
        try {
          const response = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' });
          if (!response.ok) throw new Error(await response.text());
          this.fetchServices();
          alert('Service deleted successfully.');
        } catch (error) {
          console.error('Error deleting service:', error);
        }
      },




      async activate(id) {
        const res = await fetch(window.location.origin + "/activate-service-professional/" + id, {
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },        
        });
  
        if (res.ok) {
          alert("Service professional activated");
        }
      },
  
      async reject(id) {
        const res = await fetch(window.location.origin + "/api/service_professional/" + id, {
          method: 'DELETE',
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });
  
        if (res.ok) {
          alert("Service professional rejected");
          this.inactiveServpro = this.inactiveServpro.filter(user => user.id !== id);
        } else {
          const text = await res.text();
          console.error("Error rejecting user:", res.statusText, text);
        }
      },



      editService(service) {
        this.serviceForm = { ...service };
        this.isUpdate = true;
        this.serviceIdToUpdate = service.id;
      },
      resetForm() {
        this.serviceForm = { name: '',service_type: '', service_charges: null, time_required: null, service_description: '' };
        this.isUpdate = false;
        this.serviceIdToUpdate = null;
      },
    },
    async mounted() {
      try {
        const res = await fetch(window.location.origin + "/all-service-professionals", {
          headers: {
            "Authorization": "Bearer " + sessionStorage.getItem("token"),
          },
        });
    
        if (!res.ok) {
          console.error("Error fetching professionals:", res.status, await res.text());
          return;
        }
    
        this.inactiveServpro = await res.json();
        console.log(this.inactiveServpro);
      } catch (error) {
        console.error("Fetch failed:", error);
      };

          
    const serviceReqRes = await fetch(window.location.origin + "/api/service_requests", {
      headers: {
        "Authentication-Token": sessionStorage.getItem("token"),
      },
    });

    if (serviceReqRes.ok) {
      this.service_requests = await serviceReqRes.json();
    } else {
      console.error("Error fetching service requests:", serviceReqRes.statusText);
    };
    },
  };


export default AdminDashboard;
  