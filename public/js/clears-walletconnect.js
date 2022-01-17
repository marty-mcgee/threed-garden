window.addEventListener( 'load', function() {
	var btn = document.querySelector( '.ethpress-account-linker-button' );
	if ( btn ) {
		btn.addEventListener( 'click', function() {
			var btn2 = document.querySelector( 'button.web3login-walletconnect' );
			if ( btn2 ) {
				btn2.addEventListener( 'click', function ls() {
					localStorage.removeItem( 'walletconnect' );
				});
			}
		});
	}
});

