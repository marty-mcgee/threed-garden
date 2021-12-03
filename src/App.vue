<template>
	<div id="APP">
		<div id="nav">
			<!-- -->
			<router-link to="/">Home</router-link> |
			<router-link to="about">About</router-link> |
			<router-link to="participate">Participate</router-link>
			<!-- 
			<router-link :to="{ name: 'Home', params: { userId: 123 }}">Home</router-link> |
			<router-link :to="{ name: 'About', params: { userId: 123 }}">About</router-link> |
			<router-link :to="{ name: 'Participate', params: { userId: 123 }}">Participate</router-link>
			-->
		</div>
		<router-view />
	</div>
</template>

<style scoped>
#APP {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #333333;
	margin-bottom: 40px;
}
#nav {
	padding: 20px;
}
#nav a {
	font-weight: bold;
	color: #d3e273;
}
#nav a.router-link-exact-active {
	color: #96bc33;
}
</style>