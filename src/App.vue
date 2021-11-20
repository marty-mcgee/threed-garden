<template>
	<div id="app">
		<div id="nav">
			<router-link to="/">Home ThreeD Garden</router-link> |
			<router-link to="/about">About ThreeD Garden</router-link>
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
	color: #d3e273; /* #f7941d; */
}

#nav a.router-link-exact-active {
	color: #96bc33;
}
</style>
