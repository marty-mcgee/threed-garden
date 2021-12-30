<template>
	<div class="about">
		<img :src="`${publicPath}/assets/ThreeD-Garden-Logo-Circle-Carrot.png`" alt="ThreeD Garden => Carrot Logo" width="70" />
		<h1>About ThreeD Garden</h1>
		<Documentation 
			msg=""
			subtitle=""
		/>
	</div>
</template>

<script>
// @ is an alias to /src
import Documentation from "@/components/Documentation.vue"

export default {
	name: "About",
	components: {
		Documentation
	},
	data () {
		return {
			publicPath: process.env.BASE_URL + "/wp-content/plugins/threed-garden/public"
		}
	}
}
</script>