const store = new Vuex.Store({
    state: {
      loggedIn: false,
      role: "",
    },
  
    mutations: {
      setUserLogin(state) {
        state.loggedIn = true;
      },
      logout(state) {
        state.loggedIn = false;
      },
      setUserRole(state, role) {
        state.role = role;
      },
    },
  });
  
  export default store;