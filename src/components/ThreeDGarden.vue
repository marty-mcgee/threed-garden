<template>
	<div class="threedgarden">
		<h1>{{ msg }}</h1>
		<h2>{{ subtitle }}</h2>
	</div>
</template>

<script>
/** 
 * ThreeDGarden - FarmBot JavaScript
 */
import { Farmbot } from "farmbot"

let SUPER_SECRET_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJ1bmtub3duIiwic3ViIjoxNTI2NywiaWF0IjoxNjM2NjU3ODUxLCJqdGkiOiIwNTBiMzIxNC02NzcxLTRlYzktODhmMS02NTVhYWVhNWQzN2QiLCJpc3MiOiIvL215LmZhcm0uYm90OjQ0MyIsImV4cCI6MTY0MTg0MTg1MSwibXF0dCI6ImNsZXZlci1vY3RvcHVzLnJtcS5jbG91ZGFtcXAuY29tIiwiYm90IjoiZGV2aWNlXzE1Mjk3Iiwidmhvc3QiOiJ4aWNvbmZ1bSIsIm1xdHRfd3MiOiJ3c3M6Ly9jbGV2ZXItb2N0b3B1cy5ybXEuY2xvdWRhbXFwLmNvbTo0NDMvd3MvbXF0dCJ9.K8jzw-l_KduohGUgS_rkmNx4700XQyZX3-JCigk-5gXf4y-aemDNemzABGpIvULVj9D02RXEiLAzPtSxRpGS_AWpwd0OSU35HNO_pCL7-KLmtmpanAOxutflPe9KN_stU1AgZC42TmMYLYeMZY1ornQOZTaIgT6dYJkqJex7HV6D1LS-1yjvEdPM2E1UTh6OWUFDndq-fdwyVNuQfYdbu0CLhTua3SaNaXCueZ7qew3-XVUx48PS2X8XFACkveZbRfb55qgabT-WpcQB4KyujdKFbAotZqJeZ1_aCxTa4WT_y_zFV7gVptgeK2FAXC1DE9cH4FJXipt0AMPksQGShA"

let bot = new Farmbot({ token: SUPER_SECRET_TOKEN })

bot
	.connect()
	.then(function () {
		//alert("HEY HEY HEY")
		bot.setConfig("hey", "HEY HEY HEY")
		console.log(bot.getConfig("hey"))
		return bot.getConfig("hey")
	})
	.then(function () {
		return bot.moveRelative({ x: 1, y: 2, z: 3, speed: 100 })
	})

console.log("bot", bot)



/** 
 * ThreeDGarden - Custom Admin JavaScript 
 * *************************************************************************************** */

console.log("-----------------------")
console.log("postdata---------------")
console.log(postdata)
console.log("-----------------------")

// const app = Vue.createApp({
// 	//data: function() {
// 	data() {
// 		return {
// 			plugin: 'ThreeD Garden'
// 		}
// 	}
// })
// console.log("app", app)

// const App = app.mount('#webgl')
// //const App = app.mount('#app')
// console.log("App", App)

// check for WebGL
//if ( ! Detector.webgl ) Detector.addGetWebGLMessage()

/** PARAMETERS FROM PHP */
// const pluginName = postdata.plugin_name
// const pluginVersion = postdata.plugin_version
// const pluginURL = postdata.plugin_url
// const themeURI = postdata.theme_uri
// const restURL = postdata.rest_url
// const worldID = postdata.world_id
// console.log("-----------------------")
// console.log("pluginName-------------")
// console.log(pluginName, pluginVersion)
// console.log("-----------------------")


/** 
 * END FILE
 * ************************************************************************************** 
 */

export default {
	name: "ThreeDGarden",
	props: {
		msg: String,
		subtitle: String,
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
.threedgarden {
	margin-bottom: 40px;
}
</style>
