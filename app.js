import Navbar from "./Navbar.js"
import router from "./router.js"
import store from "./store.js"

const app = new Vue({
    el : '#app',
    template : `
        <div> 
            <Navbar />
            <router-view> </router-view>
        </div>
    `,
    components : {
        Navbar,
    },
    router,
    store,
})

export default app;