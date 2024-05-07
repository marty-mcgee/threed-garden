/** 
 * ThreeDGarden - Custom Vue JavaScript
 */

/*
(function( $ ) {
	'use strict'

	console.log("createApp", createApp)

	console.log("SUPER_SECRET_TOKEN", SUPER_SECRET_TOKEN)

	$.ajax({
		url: "https://my.farm.bot/api/tokens",
		type: "POST",
		data: JSON.stringify({user: {email: 'mcgee.marty@gmail.com', password: 'XXXXXXXXX'}}),
		contentType: "application/json",
		success: function (data) {
			// You can now use your token:
			var MY_SHINY_TOKEN = data.token.encoded
			console.log("MY_SHINY_TOKEN", MY_SHINY_TOKEN)
		}
	})

	const hey_token = () => { return ("eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJ1bmtub3duIiwic3ViIjoxNTI2NywiaWF0IjoxNjM2NjU3ODUxLCJqdGkiOiIwNTBiMzIxNC02NzcxLTRlYzktODhmMS02NTVhYWVhNWQzN2QiLCJpc3MiOiIvL215LmZhcm0uYm90OjQ0MyIsImV4cCI6MTY0MTg0MTg1MSwibXF0dCI6ImNsZXZlci1vY3RvcHVzLnJtcS5jbG91ZGFtcXAuY29tIiwiYm90IjoiZGV2aWNlXzE1Mjk3Iiwidmhvc3QiOiJ4aWNvbmZ1bSIsIm1xdHRfd3MiOiJ3c3M6Ly9jbGV2ZXItb2N0b3B1cy5ybXEuY2xvdWRhbXFwLmNvbTo0NDMvd3MvbXF0dCJ9.K8jzw-l_KduohGUgS_rkmNx4700XQyZX3-JCigk-5gXf4y-aemDNemzABGpIvULVj9D02RXEiLAzPtSxRpGS_AWpwd0OSU35HNO_pCL7-KLmtmpanAOxutflPe9KN_stU1AgZC42TmMYLYeMZY1ornQOZTaIgT6dYJkqJex7HV6D1LS-1yjvEdPM2E1UTh6OWUFDndq-fdwyVNuQfYdbu0CLhTua3SaNaXCueZ7qew3-XVUx48PS2X8XFACkveZbRfb55qgabT-WpcQB4KyujdKFbAotZqJeZ1_aCxTa4WT_y_zFV7gVptgeK2FAXC1DE9cH4FJXipt0AMPksQGShA") }
	console.log(hey_token())

	let bot = new Farmbot({ token: hey_token() })
	console.log("bot", bot)

})( jQuery )
*/

//document.getElementById('rememberme').checked = true