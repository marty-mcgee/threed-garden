/**
 * Configures web3login to work with EthPress and WordPress.
 */
import * as Web3Login from 'web3-login';

( function( ethpressLoginWP ) {
	window.Web3Login = Web3Login;
	window.ethpress = window.ethpress || {};
	window.ethpress.metamask = {
		connect: window.Web3Login && window.Web3Login.modal.open
	};

	Web3Login.configure( function( addresses ) {
		var data, _address;

		_address = addresses[0];
		data = new FormData();

		// Using web3.eth.coinbase is unreliable.
		// https://github.com/MetaMask/metamask-extension/issues/6674
		data.append( 'action', ethpressLoginWP.getMessageAction );
		data.append( '_ajax_nonce', ethpressLoginWP.getNonceNonce );
		data.append( 'coinbase', '' + _address );
		return fetch( ethpressLoginWP.ajaxUrl, {
			method: 'POST',
			body: data,
			credentials: 'same-origin'
		})
		.then( function( res ) {
			if ( res.ok ) {
				return res.json();
			}
			throw new Error( res.statusText );
		})
		.then( function( result ) {
			if ( ! result.success ) {
				throw new Error( result.data );
			}
			return [ result.data, _address ];
		});
	}, function( arg ) {
		var signedMessage = arg[0];
		var _address = arg[1];
		var provider = arg[2];
		var data = new FormData();
		var providerName = provider.isMetaMask ? 'metamask' : ( provider.isTrust ? 'trust' : 'walletconnect' );

		if ( 'string' !== typeof signedMessage ) {
			throw new Error( 'Missing signature' );
		}

		data.append( 'signature', signedMessage );
		data.append( '_ajax_nonce', ethpressLoginWP.loginNonce );
		data.append( 'action', ethpressLoginWP.loginAction );
		data.append( 'coinbase', _address );
		data.append( 'provider', providerName );
		data.append( 'redirect_to', new URLSearchParams( window.location.search ).get( 'redirect_to' ) || '' );

		return fetch( ethpressLoginWP.ajaxUrl, {
			method: 'POST',
			body: data,
			credentials: 'same-origin'
		})
		.then( function( res ) {
			if ( res.ok ) {
				return res.json();
			}
			throw new Error( res.statusText );
		})
		.then( function( result ) {
			var _err;

			if ( result.success ) {
				return result.data;
			}
			_err = 'Unknown error.';
			if ( result.data && result.data.message ) {
				_err = result.data.message;
			} else if ( 'string' === typeof result.data ) {
				_err = result.data;
			}
			throw new Error( _err );
		})
		.then( function( data ) {

			// Succesful login.
			if ( data.redirect ) {
				document.location.href = data.redirect;
			}
			if ( data ) {
				return data.message;
			}
		});
	}, ethpressLoginWP.l10n );

}( window.ethpressLoginWP ) );

