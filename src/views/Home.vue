<template>
	<div class="home">
		<img src="../assets/ThreeD-Garden-Carrot-Logo-001.png" alt="ThreeD Garden == Carrot Logo" width="50" />
		<ThreeDGarden 
			msg="ThreeD Garden"
			subtitle="Vue.js app using 3D Three.js as a WordPress plugin"
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