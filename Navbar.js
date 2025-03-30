export default {
    template : `
    <div>
    <router-link to='/'>Home</router-link>
    <router-link v-if="!$store.state.loggedIn" to='/login'>Login</router-link>
    <router-link v-if="!$store.state.loggedIn" to='/register'>Register</router-link>
    <router-link v-if="$store.state.loggedIn && $store.state.role == 'admin'" to="/admin-dashboard">My Dashboard</router-link>
    <router-link v-if="$store.state.loggedIn && $store.state.role == 'professional'" to='/professional-dashboard'>My Dashboard</router-link>
    <router-link v-if="$store.state.loggedIn && $store.state.role == 'customer'" to='/customer-dashboard'>My Dashboard</router-link>
    <router-link v-if="$store.state.loggedIn && $store.state.role == 'admin'" to='/admin-search'>Search</router-link>
    <router-link v-if="$store.state.loggedIn && $store.state.role == 'customer'" to='/customer-search'>Search</router-link>
    <a :href="url"> Logout </a>
    
    </div>
    `,
    data() {
        return {
          role: localStorage.getItem('role'),
          is_login: localStorage.getItem('auth-token'),
          url : window.location.origin + "/logout",
        };
      },

    };
    