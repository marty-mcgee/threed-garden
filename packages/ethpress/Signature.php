<?php
/**
 * Has extras for signatures (message is signed -> signature).
 *
 * @since 0.1.0
 * @package ethpress
 */

namespace losnappas\Ethpress;

use losnappas\Ethpress\Dependencies\Keccak\Keccak256;
use losnappas\Ethpress\Dependencies\Elliptic\EC;

defined( 'ABSPATH' ) || die;


/**
 * Contains utility functions for signed messages.
 *
 * @since 0.1.0
 */
class Signature {

	/**
	 * Extracts address with PHP. Requires one of php-gmp or php-bcmath extensions.
	 *
	 * From here: https://github.com/digitaldonkey/ecverify/blob/master/src/EcRecover.php .
	 * Only difference is '0x' not prepended to `$message_hash`.
	 * That might be a bug on that side..?
	 *
	 * @since 0.6.0
	 *
	 * @param string $message   Message that was signed.
	 * @param string $signature Matching signature.
	 * @return (string|false)   Address or false.
	 */
	public static function extract_address_with_php( $message, $signature ) {
		$message      = self::personal_sign_add_header( $message );
		$message_hash = Keccak256::hash( $message, 256 );
		$ec           = new EC( 'secp256k1' );
		$sign         = [
			'r' => substr( $signature, 2, 64 ),
			's' => substr( $signature, 66, 64 ),
		];
		$recid        = ord( hex2bin( substr( $signature, 130, 2 ) ) ) - 27;

		$pub_key = $ec->recoverPubKey( $message_hash, $sign, $recid );

		$recovered_address = '0x' . substr(
			Keccak256::hash(
				substr(
					hex2bin( $pub_key->encode( 'hex' ) ),
					1
				),
				256
			),
			24
		);
		return $recovered_address;
	}

	/**
	 * Gets public address from signature. TODO check for failure.
	 *
	 * @since 0.1.0
	 *
	 * @param string $message   Message that was signed.
	 * @param string $signature Matching signature.
	 * @return (string|false)   The response data or false.
	 */
	public static function extract_address_with_api( $message, $signature ) {
		$defopts = [
			'api_url' => 'https://verify-eth-signature.herokuapp.com/ethpress',
		];
		$options = \get_site_option( 'ethpress', $defopts );
		$api_url = \esc_url_raw( $options['api_url'] );
		$data    = [
			'message'   => $message,
			'signature' => $signature,
		];
		$args    = [
			'body'    => $data,
			'cookies' => [],
			'timeout' => 45,
		];

		$response = \wp_safe_remote_post(
			$api_url,
			$args
		);
		$body     = \wp_remote_retrieve_body( $response );
		if ( ! empty( $body ) ) {
			$body = json_decode( $body );
			return $body->data;
		} else {
			return false;
		}
	}

	/**
	 * Verifies a signature.
	 *
	 * @since 0.1.0
	 *
	 * @param string $message   Message that was signed.
	 * @param string $signature Matching signature.
	 * @param string $coinbase  Public address used to sign the signature.
	 * @return bool
	 */
	public static function verify( $message, $signature, $coinbase ) {
		$address = null;
		if ( empty( $signature ) || empty( $coinbase ) || ! is_string( $signature ) || ! is_string( $coinbase ) ) {
			return false;
		}
		if ( extension_loaded( 'gmp' ) || extension_loaded( 'bcmath' ) ) {
			$address = self::extract_address_with_php( $message, $signature );
		} else {
			$address = self::extract_address_with_api( $message, $signature );
		}
		if ( ! is_string( $address ) ) {
			return false;
		}
		return ( strtolower( $coinbase ) === strtolower( $address ) );
	}

	/**
	 * Ethereum personal_sign message header.
	 *
	 * @since 0.6.0
	 *
	 * @param string $message Message to be prefixed.
	 *
	 * @return string Prefixed message.
	 */
	public static function personal_sign_add_header( $message ) {
		return "\x19Ethereum Signed Message:\n" . strlen( $message ) . $message;
	}

}
