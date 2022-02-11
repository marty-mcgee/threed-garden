<?php
/**
 * Has functions related to the login nonce.
 *
 * @package ethpress
 */

namespace losnappas\Ethpress;

defined( 'ABSPATH' ) || die;

/**
 * Generates nonces for user verification.
 *
 * @since 0.1.0
 *
 * I wonder about this. Logging in with a nonce opens up mitm replays?
 * But then again, there's no difference to username/password login? You could re-submit those just as well as the signed message.
 * This is what HTTPS was made to combat, I guess.
 */
class Nonce {

	/**
	 * Gets login nonce for address.
	 *
	 * @since 0.1.0
	 *
	 * @param string $coinbase Address.
	 * @return string Nonce.
	 */
	public static function get( $coinbase ) {
		$ip = '';
		// Use client IP to make it harder to log in from elsewhere with same message.
		if ( isset( $_SERVER['REMOTE_ADDR'] ) ) {
			// phpcs:ignore -- No further sanitization here.
			$ip = wp_unslash( $_SERVER['REMOTE_ADDR'] );
			$ip = rest_is_ip_address( $ip );
			if ( false === $ip ) {
				$ip = '';
			}
		}

		// We want to be last.
		$priority = 9999;

		add_filter( 'nonce_life', [ __CLASS__, 'nonce_life' ], $priority );
		$nonce = wp_create_nonce( 'ethpress_signin' . $coinbase );
		remove_filter( 'nonce_life', [ __CLASS__, 'nonce_life' ], $priority );

		return wp_hash( $nonce . $ip, 'nonce' );
	}

	/**
	 * Verifies nonce created by Nonce::get().
	 *
	 * @since 0.1.0
	 *
	 * @param string $coinbase Address used in creating this nonce.
	 * @param string $nonce    The nonce to verify.
	 * @return false|int See wp_verify_nonce.
	 */
	public static function verify( $coinbase, $nonce ) {
		$nonce    = sanitize_key( $nonce );
		$coinbase = Address::sanitize( $coinbase );

		// We want to be last.
		$priority = 9999;

		add_filter( 'nonce_life', [ __CLASS__, 'nonce_life' ], $priority );
		$valid = wp_verify_nonce( $nonce, 'ethpress_signin' . $coinbase );
		remove_filter( 'nonce_life', [ __CLASS__, 'nonce_life' ], $priority );

		return $valid;
	}

	/**
	 * Filters the nonce life to 5 minutes. Used for the login nonces.
	 *
	 * @since 0.1.0
	 * @since 1.1.1 No longer taking the `min` of nonce lifetimes, since that may result in too short nonces.
	 *
	 * @param int $lifetime The original lifetime.
	 */
	public static function nonce_life( $lifetime ) {
		$my_lifetime = 5 * MINUTE_IN_SECONDS;
		return $my_lifetime;
	}

}
