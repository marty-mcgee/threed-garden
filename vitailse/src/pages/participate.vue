<template>
	<div class="participate">
		<!-- <h1>Participate in the real life <em>ThreeD Garden</em> game..</h1> -->
		<!-- <h2>Yes.. remotely.. from your fingers, on a WiFi-enabled device with a browser.</h2> -->
		<ThreeDGarden 
			msg=""
			subtitle=""
		/>
	</div>
</template>

<script>
// @ is an alias to /src
import ThreeDGarden from "@/components/ThreeDGarden.vue"
//import { defineAsyncComponent } from "vue"

export default {
	name: "Participate",
	components: {
		ThreeDGarden
		// ThreeDGarden: defineAsyncComponent(
		// 	() => import(
		// 		// /* webpackExports: ["default", "named"] */ 
		// 		// /* webpackMode: "lazy" */ 
		// 		// /* webpackPrefetch: true */
		// 		/* webpackChunkName: "threed-garden-vue" */
		// 		'../components/ThreeDGarden.vue'
		// 	)
		// )
	},
	data () {
		return {
			publicPath: process.env.BASE_URL + "/wp-content/plugins/threed-garden/public",
			//componentType: 'ThreeDGarden'
		}
	}
}
</script>