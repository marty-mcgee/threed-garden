<template>
	<div class="home">
		<img src="../assets/ThreeD-Garden-Carrot-Logo-001.png" alt="ThreeD Garden => Carrot Logo" width="60" />
		<ThreeDGarden 
			msg="Vue.js App using Three.js 3D Library"
			subtitle="as a WordPress Plugin"
		/>
	</div>
</template>

<script>
// @ is an alias to /src
import ThreeDGarden from "@/components/ThreeDGarden.vue"

export default {
	name: "Home",
	components: {
		ThreeDGarden
	}
}
</script>