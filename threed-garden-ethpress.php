<?php
/**
 * XPlugin Name: ThreeD Garden EthPress
 * XPlugin URI: https://gitlab.com/losnappas/ethpress
 * XDescription: Ethereum Web3 login. Enable crypto wallet logins to WordPress.
 * XAuthor: Lynn (lynn.mvp at tutanota dot com)
 * XVersion: 1.1.1
 * XAuthor URI: https://ethpress.imlynn.xyz/
 * XText Domain: ethpress
 * XDomain Path: /languages
 *
 * @package ethpress
 */

namespace losnappas\Ethpress;

defined( 'ABSPATH' ) || die;
require_once 'vendor/autoload.php';
use losnappas\Ethpress\Plugin;

define( 'ETHPRESS_FILE', __FILE__ );
define( 'ETHPRESS_NS', __NAMESPACE__ );
define( 'ETHPRESS_PHP_MIN_VER', '5.4.0' );
define( 'ETHPRESS_WP_MIN_VER', '4.6.0' );

if ( version_compare( get_bloginfo( 'version' ), ETHPRESS_WP_MIN_VER, '<' ) || version_compare( PHP_VERSION, ETHPRESS_PHP_MIN_VER, '<' ) ) {
	/**
	 * Displays notification.
	 */
	function ethpress_compatability_warning() {
		echo '<div class="error"><p>' . esc_html(
			sprintf(
				/* translators: version numbers. */
				__( '“%1$s” requires PHP %2$s (or newer) and WordPress %3$s (or newer) to function properly. Your site is using PHP %4$s and WordPress %5$s. Please upgrade. The plugin has been automatically deactivated.', 'ethpress' ),
				'EthPress',
				ETHPRESS_PHP_MIN_VER,
				ETHPRESS_WP_MIN_VER,
				PHP_VERSION,
				$GLOBALS['wp_version']
			)
		) . '</p></div>';
		// phpcs:ignore -- no nonces here.
		if ( isset( $_GET['activate'] ) ) {
			// phpcs:ignore -- no nonces here.
			unset( $_GET['activate'] );
		}
	}
	add_action( 'admin_notices', __NAMESPACE__ . '\ethpress_compatability_warning' );

	/**
	 * Deactivates.
	 */
	function ethpress_deactivate_self() {
		deactivate_plugins( plugin_basename( ETHPRESS_FILE ) );
	}
	add_action( 'admin_init', __NAMESPACE__ . '\ethpress_deactivate_self' );

	return;
} else {
	register_activation_hook( __FILE__, [ ETHPRESS_NS . '\Plugin', 'activate' ] );
	Plugin::attach_hooks();
}
