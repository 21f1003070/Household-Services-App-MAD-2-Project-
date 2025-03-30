// import Service_requests from "./ExportCsv";

const CustomerDashboard = {
    template: `
      <div class="container mt-5">
        <h1 class="text-center mb-4">My Dashboard</h1>
  
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
  
        <!-- Service Request Distribution Graph -->
        <div class="row mb-5">
          <div class="col-md-6">
            <h3 class="text-center">User Distribution</h3>
            <canvas id="ServiceRequestDistribution" style="max-width: 500px; max-height: 300px;"></canvas>
          </div>
          
        </div>
  
        <!-- Feedback Section -->
        <div v-if="FeedbackPage" class="Feedback">
          <h3 class="mb-3">Submit Feedback</h3>
          <form @submit.prevent="submitFeedback" class="mb-4">
            <div class="form-group">
            <label for="rating">Rating</label>
            <select v-model="feedbackRating" class="form-select" required>
              <option value="1">1 - Very Poor</option>
              <option value="2">2 - Poor</option>
              <option value="3">3 - Decent</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
            </div>
            <div class="form-group mt-2">
              <textarea v-model="feedbackText" placeholder="Enter your remarks here" class="form-control" rows="4"></textarea>
            </div>
            <button type="submit" class="btn btn-sm btn-primary mt-3">Submit Feedback</button>
            <button @click="closeFeedback" class="btn btn-sm btn-secondary mt-3">Cancel</button>            
          </form>
        </div>
  
          <!-- My Requests -->
          <div>
            <h4>Your Service Requests</h4>
            <table class="table table-bordered table-striped" >
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Professional Name</th>
                  <th>Professional Contact</th>
                  <th>Professional Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in service_requests" :key="request.id">
                  <td>{{ request.service_name }}</td>
                  <td>{{ request.professional_name || "Not Assigned" }}</td>
                  <td>{{ request.professional_phone || "Not Available" }}</td>
                  <td>{{ request.professional_email }}</td>
                  <td>{{ request.request_status }}</td>
                  <td>
                    <div v-if="request.request_status === 'closed'">
                    <button @click="openFeedbackForm(request.id,request.service_id)" class="btn btn-warning btn-sm">Feedback</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class = "services" >
          <h4>Available Services at My Place</h4>
          <table class="table table-bordered table-striped">
          <thead>
          <tr>
            <th>ID</th>
            <th>Professional Name</th>
            <th>Professional Contact</th>
            <th>Professional Email</th>
            <th>Service Type</th>
            <th>Charges</th>
            <th>Action</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="service in services" :key="service.id">
            <td>{{ service.id }}</td>
            <td>{{ service.professional_name }}</td>
            <td>{{ service.professional_phone || "Not Available" }}</td>
            <td>{{ service.professional_email }}</td>
            <td>{{ service.name }}</td>
            <td>{{ service.price }}</td>
            <td>
              <!-- Show 'Booked' if the service is already booked -->
              <!--<span v-if="bookedServices.includes(service.id)">Booked</span>-->
              
              <!-- Otherwise, show the Book button -->
              <!--<button 
                v-else 
                class="btn btn-success" 
                @click="book(service.id,service.professional_id)">
                Book
              </button>-->

            <!-- If service is booked, show "Edit Booking", else show "Book" -->
            <button v-if="bookedServices[service.id]" class="btn btn-warning" @click="openForm(service, true)">Edit Booking</button>
            <button v-else class="btn btn-success" @click="openForm(service, false)">Book</button>
              
            </td>
          </tr>
          </tbody>
          </table>
        </div>

        <!-- Booking Form (Visible only when isFormOpen is true) -->
        <div v-if="isFormOpen" class="form-container">
          <h3>{{ isEditable ? 'Edit Booking' : 'Book Service' }}</h3>
          <form @submit.prevent="saveBooking">
            <label> Remarks
              <input v-model="bookingDetails.remarks" type="text" required />
            </label>
            <br />
            <label> Date:
              <input v-model="bookingDetails.date" type="date" />
            </label>
            <br />

            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-secondary" @click="isFormOpen = false">Cancel</button>
          </form>



          <!--<form @submit.prevent="editBooking">
            <label> Remarks
              <input v-model="bookingDetails.remarks" type="text" required />
            </label>
            <br />
            <label> Date:
              <input v-model="bookingDetails.date" type="date" />
            </label>
            <br />

            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-secondary" @click="isFormOpen = false">Cancel</button>
          </form>-->         
        </div>
      </div>
    `,

  data() {
    return {
      summary: {
        AcceptedRequests: 0,
        RejectedRequests: 0,
        ClosedRequests: 0,
        professionalUsers: 0,
        customerUsers: 0,
        serviceStatusSummary: {
          requested: 0,
          accepted: 0,
          rejected: 0,
          finished: 0,
        },
      },
      categories: [],
      service_requests: [],
      services: [],
      service_pro:[],
      bookedServices: [],
      professional:"",
      professional_id:"",
      isFormOpen: false, 
      isEditable: false,
      bookingDetails: { id: null, remarks: "", date: "" },
      pin:null,  // List of booked services' IDs
      FeedbackPage: false, // Default visibility for feedback page
      feedbackText: '', // Feedback input
      feedbackRating: 1,
      currentServiceId: null // Stores the service ID for feedback submission
    };
  },


  computed: {
    statsDisplay() {
      return {
        AcceptedRequests: { title: 'Accepted Requests', count: this.summary.AcceptedRequests, bgClass: 'bg-primary' },
        ClosedRequests: { title: 'Closed Requests', count: this.summary.ClosedRequests, bgClass: 'bg-success' },
        RejectedRequests: { title: 'Rejected Requests', count: this.summary.RejectedRequests, bgClass: 'bg-danger' },
        
      };
    },
  },

  created() {
    this.fetchCustomerSummary();
  },



  async mounted() {
    const customer_id = sessionStorage.getItem('id')
    console.log(customer_id)
    try {
      const res = await fetch(window.location.origin + "/services/"+customer_id, {
        headers: {
          "Authorization": "Bearer " + sessionStorage.getItem("token"),
        },
      });
  
      if (!res.ok) {
        console.error("Error fetching data:", res.status, await res.text());
        console.log("xxx")
        return;
      }
  
      this.services = await res.json();
      this.professional_id =this.services.professional_id;
      console.log(this.services);
    } catch (error) {
      console.error("Fetch failed:", error);
    };

        // Fetch service requests
        const serviceReqRes = await fetch(window.location.origin + "/api/service_requests", {
          headers: {
            "Authentication-Token": sessionStorage.getItem("token"),
          },
        });
    
        if (serviceReqRes.ok) {
          this.service_requests = await serviceReqRes.json();
        } else {
          console.error("Error fetching Service Requests:", serviceReqRes.statusText);
        };
  },


  methods: {
    openForm(service, editMode) {
      this.isEditable = editMode;
      this.isFormOpen = true;

      if (editMode && this.bookedServices[service.id]) {
        // If editing, prefill form with existing details
        this.bookingDetails = { ...this.bookedServices[service.id] };
      } else {
        // If booking new, clear form and set service ID
        this.bookingDetails = { id: service.id, remarks: service.remarks, date: "" };
      }
    },


    // saveBooking() {
    //   this.bookedServices[this.bookingDetails.id] = { ...this.bookingDetails };
    //   this.isFormOpen = false;
    // },

    async saveBooking() {
      try {
          const method = this.isEditable ? "PATCH" : "POST"; // Use PATCH for updates
          const response = await fetch(window.location.origin + "/api/service_requests", {
              method: method,
              headers: {
                  "Content-Type": "application/json",
                  "Authentication-Token": sessionStorage.getItem("token")
              },
              body: JSON.stringify({
                  service_id: this.bookingDetails.id,
    
                
                  ...(this.bookingDetails.date && { date: this.bookingDetails.date }),
                  ...(this.bookingDetails.remarks && { remarks: this.bookingDetails.remarks })
              })
          });
  
          if (response.ok) {
              const data = await response.json();
              this.bookedServices[this.bookingDetails.id] = { ...this.bookingDetails };
              this.isFormOpen = false;
          } else {
              alert("Booking update failed!");
          }
      } catch (error) {
          console.error("Error updating booking:", error);
      }
  },

  async editBooking() {
    try {
        const method = this.isEditable ? "PATCH" : "POST"; // Use PATCH for updates
        const response = await fetch(`${window.location.origin}/api/service_requests/${this.service_request_id}`, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authentication-Token": sessionStorage.getItem("token")
            },
            body: JSON.stringify({
                service_id: this.bookingDetails.id,
  
              
                ...(this.bookingDetails.date && { date: this.bookingDetails.date }),
                ...(this.bookingDetails.remarks && { remarks: this.bookingDetails.remarks })
            })
        });

        if (response.ok) {
            const data = await response.json();
            this.bookedServices[this.bookingDetails.id] = { ...this.bookingDetails };
            this.isFormOpen = false;
        } else {
            alert("Booking update failed!");
        }
    } catch (error) {
        console.error("Error updating booking:", error);
    }
},
  

    async fetchCustomerSummary() {
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
      this.renderServiceRequestDistribution();
      
    },
    renderServiceRequestDistribution() {
      const requestpie = document.getElementById('ServiceRequestDistribution').getContext('2d');
      if (this.ServiceRequestDistribution) this.ServiceRequestDistribution.destroy();
      this.ServiceRequestDistribution = new Chart(requestpie, {
        type: 'doughnut',
        data: {
          labels: ['Accepted Requests','Closed Requests','Rejected Requests'],
          datasets: [
            {
              label: 'Total Count',
              data: [this.summary.AcceptedRequests,this.summary.ClosedRequests, this.summary.RejectedRequests],
              backgroundColor: ['#4b0082', '#dc3545','#28a745' ],
            },
          ],
        },
        options: {
          responsive: true,
        },
      });
    },

    async book(id,pid) {
      try {
        const res = await fetch(`${window.location.origin}/api/service_requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',  
            'Authentication-Token': sessionStorage.getItem("token"), 
          },
          body: JSON.stringify({
            service_id: id, 
            professional_id: pid, 
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

    // Method to check if a service is already booked and still open
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
            .filter(request => request.request_status !== 'closed')  // Exclude closed services
            .map(request => request.service_id);  // Collect booked service IDs
          
        } else {
          console.error("Error fetching service status:", res.statusText);
        }
      } catch (error) {
        console.error("Error during status check:", error);
      }
    },

    openFeedbackForm(reqId,sid) {
      console.log("Button clicked! Service ID:",reqId);
      this.FeedbackPage = true;
      this.currentServiceId = sid;
    },
    

    closeFeedback() {
      this.FeedbackPage = false;
      this.feedbackText = ''; // Clear feedback input
      this.feedbackRating = 1;
      this.currentServiceId = null;
    },

    async submitFeedback() {
      const myfeedback = {
        rating: this.feedbackRating,  // Rating for the feedback
        comments: this.feedbackText,  // Comments from the textarea
        service_id: this.currentServiceId
      };

      try {
        const res = await fetch(`${window.location.origin}/api/services/${this.currentServiceId}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': sessionStorage.getItem("token"),
            'Customer-ID': sessionStorage.getItem("customer_id")
          },
          body: JSON.stringify(myfeedback),
        });

        if (res.ok) {
          alert('Feedback submitted successfully!');
          this.closeFeedback();
        } else {
          console.error("Error submitting feedback:", res.statusText);
          alert("Failed to submit feedback.");
        }
      } catch (error) {
        console.error("Error during feedback submission:", error);
      }
    },
  },


};

export default CustomerDashboard;