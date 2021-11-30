<template>
	<div id="app">
		<div id="nav">
			<!-- 
			<router-link :to="{ name: 'Home', params: { userId: 123 }}">Home</router-link> |
			<router-link :to="{ name: 'About', params: { userId: 123 }}">About</router-link> |
			<router-link :to="{ name: 'Participate', params: { userId: 123 }}">Participate</router-link>
			-->
			<!-- -->
			<router-link to="home">Home</router-link> |
			<router-link to="about">About</router-link> |
			<router-link to="participate">Participate</router-link>
		</div>
		<router-view />
	</div>
</template>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #333333;
}

#nav {
	padding: 30px;
}

#nav a {
	font-weight: bold;
	color: #d3e273;
}

#nav a.router-link-exact-active {
	color: #96bc33;
}
</style>