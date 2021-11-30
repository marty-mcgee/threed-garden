<template>
	<div class="participate">
		<h1>Participate in the ThreeD Garden real life game.</h1>
		<!-- <h2>Yes.. remotely.. from your fingers, on a WiFi-enabled device with a browser.</h2> -->
		<ThreeDGarden 
			msg="Play"
			subtitle="Now"
		/>
	</div>
</template>

<script>
// @ is an alias to /src
import ThreeDGarden from "@/components/ThreeDGarden.vue"

export default {
	name: "Participate",
	components: {
		ThreeDGarden
	},
	data () {
		return {
			publicPath: process.env.BASE_URL + "/wp-content/plugins/threed-garden/public"
		}
	}
}
</script>