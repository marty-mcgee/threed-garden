<template>
	<div class="farmbot">
		<!-- <h1>{{ msg }}</h1> -->
		<!-- <h2>{{ subtitle }}</h2> -->
	</div>
</template>

<script>
/** 
 * ThreeDGarden - FarmBot JavaScript
 */
import { Farmbot } from "farmbot"

let SUPER_SECRET_TOKEN = "see .env file FARMBOT_JS_SUPER_SECRET_TOKEN"

let bot = new Farmbot({ token: SUPER_SECRET_TOKEN })

bot
	.connect()
	.then(function () {
		//alert("MARTY: HEY HEY HEY")
		bot.setConfig("MARTY", "HEY HEY HEY")
		console.log(bot.getConfig("MARTY"))
		return bot.getConfig("MARTY")
	})
	.then(function () {
		return bot.moveRelative(
			{ 
				x: 1, 
				y: 2, 
				z: 3, 
				speed: 100 
			}
		)
	})

console.log("bot", bot)

export default {
	name: "FarmBot",
	props: {
		msg: String,
		subtitle: String,
	},
    methods: {

    },
	mounted () {
		//init()
	}
}
</script>

<style scoped>
.farmbot {
	border: 2px solid green;
}
</style>