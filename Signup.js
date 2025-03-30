import router from "./router.js";

const Signup = {
  template: `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card shadow-lg">
                        <div class="card-header text-center bg-primary text-white">
                            <h3>Hello New User, Sign Up Now </h3>
                        </div>
                        <div class="card-body">
                            <form @submit.prevent="Register">
                                <!-- Email -->
                                <div class="mb-3">
                                    <label for="email" class="form-label">Email</label>
                                    <input v-model="email" type="email" id="email" class="form-control" placeholder="Enter your email" required />
                                </div>
                                <!-- Password -->
                                <div class="mb-3">
                                    <label for="password" class="form-label">Password</label>
                                    <input v-model="password" type="password" id="password" class="form-control" placeholder="Enter your password" required />
                                </div>
                                <!-- Full Name -->
                                <div class="mb-3">
                                    <label for="full_name" class="form-label">Full Name</label>
                                    <input v-model="full_name" type="text" id="full_name" class="form-control" placeholder="Enter your full name" required />
                                </div>
                                <!-- Phone -->
                                <div class="mb-3">
                                    <label for="phone" class="form-label">Contact No.</label>
                                    <input v-model="phone" type="text" id="phone" class="form-control" placeholder="Enter your phone number (optional)" />
                                </div>
                                <!-- Pin -->
                                <div class="mb-3">
                                    <label for="pin" class="form-label">Pin Code</label>
                                    <input v-model="pin" type="text" id="pin" class="form-control" placeholder="Enter your pincode" required />
                                </div>
                                <!-- Address -->
                                <div class="mb-3">
                                    <label for="address" class="form-label">Full Address</label>
                                    <input v-model="address" type="text" id="address" class="form-control" placeholder="Enter your full address" required />
                                </div>                                
                                <!-- Role -->
                                <div class="mb-3">
                                    <label for="role" class="form-label">Select Role</label>
                                    <select v-model="role" id="role" class="form-select">
                                        <option value="customer">Customer</option>
                                        <option value="professional">Professional</option>
                                    </select>
                                </div>

                                <!-- Additional Fields for Service Professionals -->
                                <div v-if="role === 'professional'">
                                    <div class="mb-3">
                                        <label for="experience" class="form-label">Experience (in years)</label>
                                        <input v-model="experience" type="number" id="experience" class="form-control" placeholder="Enter your years of experience" required />
                                    </div>
                                    <div class="mb-3">
                                        <label for="service_type" class="form-label">Service Type</label>
                                        <select v-model="service_type" id="service_type" class="form-select" required>
                                            <option value="">Select a service type</option>
                                            <option v-for="service in services" :key="service.id" :value="service.service_type">
                                                {{ service.service_type }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="description" class="form-label">Service Description</label>
                                        <textarea v-model="description" id="description" class="form-control" placeholder="Describe your services" required></textarea>
                                    </div>
                                    <!--<div class="mb-3">
                                        <label for="profile" class="form-label">Profile Doc</label>
                                        <input type = "file" v-model="profile" id="profile" class="form-control" placeholder="Upload your profile doc">
                                    </div>-->
                                </div>

                                <button type="submit" class="btn btn-primary w-100" @click="Register">Register</button>
                            </form>
                            <p class="text-center mt-3">
                            <small>Already have an account? 
                            <router-link to="/login" class="text-primary text-decoration-none">Login here</router-link>
                            </small>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

  data() {
    return {
      email: "",
      password: "",
      full_name: "",
      phone: "",
      pin: "",
      address: "",
      role: "",
      experience: "",
      service_type: "",
      description: "",
      profile:"",
      error: "",
      services: [],
    };
  },

  async mounted() {
    try {
        const response = await fetch("/api/services");
        const data = await response.json();
        if (response.ok) {
            this.services = data || [];
        } else {
            console.error("Error fetching services:", data.message || response.statusText);
        }
    } catch (error) {
        console.error("Error fetching services:", error);
    }
},

  methods: {

    async Register() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout after 10 seconds
      
        try {
          const origin = window.location.origin;
          const url = `${origin}/register`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: this.email,
              password: this.password,
              full_name: this.full_name,
              phone: this.phone,
              pin: this.pin,
              address: this.address,
              role: this.role,
              experience: this.role === 'professional' ? this.experience : null,
              service_type: this.role === 'professional' ? this.service_type : null,
              description: this.role === 'professional' ? this.description : null,
              profile: this.role === 'professional' ? this.profile : null,
            }),
            signal: controller.signal,
            credentials: "same-origin",
          });
      
          clearTimeout(timeoutId); // Clear the timeout if request is successful
      
          if (res.ok) {
            const data = await res.json();
            console.log(data);
            router.push("/login");
          } else {
            const errorData = await res.json();
            this.error = errorData.message || "Sign up failed. Please try again.";
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            this.error = 'Request timed out. Please try again.';
          } else {
            this.error = error.message || 'Something went wrong. Please try again.';
          }
        }
      }
      
 
  },
};

export default Signup;
