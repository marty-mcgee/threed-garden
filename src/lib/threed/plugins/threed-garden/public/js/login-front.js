'use strict';

/**
 * Has the logic for handling dom events in login screen.
 */
window.addEventListener( 'DOMContentLoaded', function() {
	var loginButtons = document.querySelectorAll( '.ethpress-metamask-login-button' );
	if ( 0 < loginButtons.length ) {
		loginButtons.forEach( function( btn ) {
			btn.addEventListener( 'click', function( e ) {
				e.preventDefault();
				window.ethpress.metamask.connect();
			});
		});
	}
});
