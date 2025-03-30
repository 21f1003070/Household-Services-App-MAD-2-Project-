import router from "./router.js";

const Login = {
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div class="card shadow-lg p-4" style="width: 350px; border-radius: 10px;">
        <h4 class="text-center mb-4 text-primary">Log in to get the most of it!</h4>
        <div v-if="error" class="alert alert-danger p-2 text-center">{{ error }}</div>
        <form>
          <div class="mb-3">
            <label for="email" class="form-label">Email Address</label>
            <input type="email" class="form-control" id="email" placeholder="Enter your email id" v-model="email" required>
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" id="password" placeholder="Enter your password" v-model="password" required>
          </div>
          <button type="submit" class="btn btn-primary w-100" @click='login'>Login</button>
        </form>
        <p class="text-center mt-3">
          <small>Don't have an account yet? 
            <router-link to="/register" class="text-primary text-decoration-none">Register here</router-link>
          </small>
        </p>
      </div>
    </div>
  `,

  data() {
    return {
      email: "",
      password: "",
      error: "",
    };
  },
  methods: {
    async login() {
      const url = window.location.origin+"/user-login";
      
      const res = await fetch(url,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },


        body: JSON.stringify({ email: this.email, password: this.password }),
      });

      if (res.ok) {
        const data = await res.json();

        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("role", data.role);
        sessionStorage.setItem("email", data.email);
        sessionStorage.setItem("id", data.id);     

        console.log(sessionStorage.getItem("email"));
        console.log(sessionStorage.getItem("role"));
       
        this.$store.commit("setUserLogin", true);
        this.$store.commit("setUserRole", data.role);       
        

        switch (data.role) {
          case "admin":
            router.push("/admin-dashboard");
            break;
          case "professional":
            router.push("/professional-dashboard");
            break;
          case "customer":
            router.push("/customer-dashboard");
            break;
        }

      } else {
        console.error("Login Error");
      }
    },
  },
};

export default Login;
