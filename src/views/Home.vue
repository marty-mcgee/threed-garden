<template>
	<div class="home">
		<img :src="`${publicPath}/assets/ThreeD-Garden-Logo-Circle-Carrot.png`" alt="ThreeD Garden => Carrot Logo" width="70" />
		<!-- <img src="~images/ThreeD-Garden-Logo-Circle-Carrot.png" alt="ThreeD Garden => Carrot Logo" width="70" /> -->
	</div>
</template>

<script>
// @ is an alias to /src
// import ThreeDGarden from "@/components/ThreeDGarden.vue"

export default {
	name: "Home",
	// components: {
	// 	ThreeDGarden
	// },
	data () {
		return {
			publicPath: process.env.BASE_URL + "/wp-content/plugins/threed-garden/public"
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
	margin: 40px 0 0;
}
ul {
	list-style-type: none;
	padding: 0;
}
li {
	display: inline-block;
	margin: 0 10px;
}
a {
	color: #96bc33;
}
.home {
	margin-bottom: 40px;
}
</style>