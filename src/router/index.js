//import { defineAsyncComponent } from 'vue'
import { 
	createRouter, 
	//createWebHistory,
	createWebHashHistory,
} from "vue-router"
import Home from "../views/Home.vue"
import About from "../views/About.vue"
//import Participate from "../views/Participate.vue"

const routes = [
	{
		path: "/",
		name: "home",
		component: Home
	},
	{
		path: "/about",
		name: "about",
		// route level code-splitting
		// this generates a separate chunk (about.[hash].js) for this route
		// which is lazy-loaded when the route is visited.
		// component: () => import(/* webpackChunkName: "about" */ "../views/About.vue")
		component: About
	},
	{
		path: "/participate",
		name: "participate",
		// route level code-splitting
		// this generates a separate chunk (participate.[hash].js) for this route
		// which is lazy-loaded when the route is visited.
		component: () => import(/* webpackChunkName: "participate" */ "@/views/Participate.vue")
		//component: Participate
		//component: defineAsyncComponent(() => import("@/views/Participate.vue"))
	}
]

const router = createRouter({
	//history: createWebHistory(process.env.BASE_URL),
	//history: createWebHistory('./'),
	history: createWebHashHistory(),
	//base: process.env.NODE_ENV === "production" ? "/my-path/" : "../../", // does nothing in this version
	routes
})

export default router