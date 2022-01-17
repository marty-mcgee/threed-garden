<?php
/**
 * Adds [ethpress_login_button] shortcode.
 *
 * Since version 0.7.0 you should use the EthPress widget instead.
 *
 * @since 0.5.0
 * @package ethpress
 */

namespace losnappas\Ethpress\Shortcodes;

defined( 'ABSPATH' ) || die;

use losnappas\Ethpress\Front;
use losnappas\Ethpress\Plugin;

/**
 * Contains LoginButton's internals.
 *
 * @since 0.5.0
 */
class LoginButton {
	/**
	 * Name of the shortcode.
	 *
	 * @var String shortcode name
	 *
	 * @since 0.5.0
	 */
	public static $shortcode_name = 'ethpress_login_button';

	/**
	 * Creates shortcode content. Runs on `\add_shortcode`.
	 *
	 * Outputs nothing when user is logged in. Button otherwise.
	 *
	 * @since 0.5.0
	 */
	public static function add_shortcode() {
		if ( \is_user_logged_in() ) {
			return '';
		}
		Plugin::login_enqueue_scripts();
		$button = Front::get_login_button();
		return $button;
	}
}
