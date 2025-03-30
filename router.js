import Home from './home.js';
import Login from './Login.js';
import Register from './Signup.js';
import AdminDashboard from "./AdminDashboard.js";
import ProfessionalDashboard from "./ProfessionalDashboard.js";
import CustomerDashboard from "./CustomerDashboard.js";


import store from "./store.js";

const routes = [
    { path: '/', component: Home, name: 'Home' },
   
    { path: '/register', component: Register, name: 'Register' },
    { path: "/login", component: Login, name: 'Login' },
    { path: "/admin-dashboard", component: AdminDashboard, meta: { requiresLogin: true, role: "admin" } },
    { path: "/professional-dashboard", component: ProfessionalDashboard, meta: { requiresLogin: true, role: "professional" } },
    { path: "/customer-dashboard", component: CustomerDashboard, meta: { requiresLogin: true, role: "customer" } },
    


];
  
const router=new VueRouter({
    routes,
  });


// frontend router protection
router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresLogin)) {
      if (!store.state.loggedIn) {
        next({ path: "/user-login" });
      } else if (to.meta.role && to.meta.role !== store.state.role) {
        alert('role not authorized')
        next({ path: "/" });
      } else {
        next();
      }
    } else {
      next();
    }
  });
  
  export default router;