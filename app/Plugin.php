<?php
/**
 * Sets up the plugin's hooks.
 *
 * @since 0.1.0
 * @package ethpress
 */

namespace losnappas\Ethpress;

defined( 'ABSPATH' ) || die;

use losnappas\Ethpress\Upgrade;
use losnappas\Ethpress\Shortcodes\LoginButton;

/**
 * Static functions only.
 *
 * @since 0.1.0
 */
class Plugin {

	/**
	 * Table names. Don't forget to base_prefix. Base_ because it's user related and does not have separate tables for every site.
	 *
	 * @since 0.1.0
	 *
	 * @var array
	 */
	public static $tables = [
		'addresses' => 'ethpress_addresses',
	];

	/**
	 * This contains hook and filter assignments, etc.
	 *
	 * @since 0.1.0
	 */
	public static function attach_hooks() {
		add_action( 'plugins_loaded', [ __CLASS__, 'load_plugin_textdomain' ] );

		// When bbPress does `do_action('login_form')`, scripts aren't loaded without these 2.
		// If bbPress does that, then others will too.
		// Not sure what's going on, but this is an easy fix.
		add_action( 'login_form', [ __CLASS__, 'register_scripts' ], 9 );
		add_action( 'login_form', [ __CLASS__, 'login_enqueue_scripts' ] );
		add_action( 'login_form', [ ETHPRESS_NS . '\Front', 'login_form' ] );
		/**
		 * Adding register_scripts to wp_enqueue_scripts for shortcode support.
		 * I think the performance impact of this is next to nothing.
		 *
		 * @since 0.5.0
		 */
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'register_scripts' ], 9 );
		add_action( 'login_enqueue_scripts', [ __CLASS__, 'register_scripts' ], 9 );
		// By default we only enqueue for login screen.
		add_action( 'login_enqueue_scripts', [ __CLASS__, 'login_enqueue_scripts_and_styles' ] );

		add_action( 'wp_ajax_nopriv_ethpress_log_in', [ ETHPRESS_NS . '\Login', 'verify_login' ] );
		add_action( 'wp_ajax_nopriv_ethpress_get_message', [ ETHPRESS_NS . '\Login', 'get_message' ] );
		add_action( 'wp_ajax_ethpress_log_in', [ ETHPRESS_NS . '\Login', 'verify_login' ] );
		add_action( 'wp_ajax_ethpress_get_message', [ ETHPRESS_NS . '\Login', 'get_message' ] );
		add_action( 'deleted_user', [ ETHPRESS_NS . '\Login', 'destroy' ] );

		add_action( 'ethpress_login', [ ETHPRESS_NS . '\Login', 'attach_user_to_blog' ] );

		add_shortcode( LoginButton::$shortcode_name, [ ETHPRESS_NS . '\Shortcodes\LoginButton', 'add_shortcode' ] );
		add_action(
			'widgets_init',
			[ ETHPRESS_NS . '\Widgets\Button', 'widgets_init' ]
		);

		add_action( 'show_user_profile', [ ETHPRESS_NS . '\Widgets\Button', 'show_user_profile' ] );
		if ( is_admin() || is_network_admin() ) {
			self::attach_admin_hooks();
		}
	}

	/**
	 * Attaches admin hooks for options page.
	 *
	 * @since 0.3.0
	 */
	public static function attach_admin_hooks() {
		$plugin = plugin_basename( ETHPRESS_FILE );
		add_filter( "plugin_action_links_$plugin", [ ETHPRESS_NS . '\Admin\Options', 'plugin_action_links' ] );

		if ( is_multisite() ) {
			add_action( 'network_admin_menu', [ ETHPRESS_NS . '\Admin\Options', 'admin_menu' ] );
		} else {
			add_action( 'admin_menu', [ ETHPRESS_NS . '\Admin\Options', 'admin_menu' ] );
		}
		add_action( 'admin_init', [ ETHPRESS_NS . '\Admin\Options', 'admin_init' ] );
	}

	/**
	 * Registers the scripts so they're available in login_enqueue_scripts and wp_enqueue_scripts.
	 *
	 * @since 0.1.1
	 */
	public static function register_scripts() {
		if ( wp_script_is( 'ethpress-login-modal', 'registered' ) ) {
			return;
		}
		// Styles for just the button. Only shown in login screen since 0.7.0.
		wp_register_style(
			'ethpress-login',
			plugin_dir_url( ETHPRESS_FILE ) . 'public/css/login.css',
			[],
			'1.0.0'
		);
		/**
		 * Version 0.5.0 removed the info popup and thus modified html. This fixes css while keeping 'ethpress-login-front' script functional.
		 */
		wp_register_style(
			'ethpress-login-front',
			plugin_dir_url( ETHPRESS_FILE ) . 'public/css/login-fix.css',
			[ 'ethpress-login' ],
			'1.0.0'
		);
		// Configures Web3Login to work. Provides ethpress.metamask.connect.
		wp_register_script(
			'ethpress-login-modal',
			plugin_dir_url( ETHPRESS_FILE ) . 'public/dist/main.min.js',
			[],
			'3',
			false
		);
		// Adds event listener to buttons.
		wp_register_script(
			'ethpress-login-front',
			plugin_dir_url( ETHPRESS_FILE ) . 'public/dist/login-front.min.js',
			[ 'ethpress-login-modal' ],
			'1.4.0',
			true
		);

		$ajax_url        = admin_url( 'admin-ajax.php' );
		$login_nonce     = wp_create_nonce( 'ethpress_log_in' );
		$get_nonce_nonce = wp_create_nonce( 'ethpress_get_message' );
		$inline_script   = [
			'ajaxUrl'          => $ajax_url,
			'loginNonce'       => $login_nonce,
			'getNonceNonce'    => $get_nonce_nonce,
			'loginAction'      => 'ethpress_log_in',
			'getMessageAction' => 'ethpress_get_message',
			'l10n'             => [
				'calltoaction'             => esc_html__( 'Choose your login method', 'ethpress' ),
				'nodetect'                 => esc_html__( 'Error: cannot detect crypto wallet', 'ethpress' ),
				'permission'               => esc_html__( 'Waiting for your permission', 'ethpress' ),
				'fetching'                 => esc_html__( 'Fetching login phrase...', 'ethpress' ),
				'awaiting'                 => esc_html__( 'Waiting for your signature', 'ethpress' ),
				'verifying'                => esc_html__( 'Verifying signature...', 'ethpress' ),
				'loggedin'                 => esc_html__( 'Logged in', 'ethpress' ),
				'aborted'                  => esc_html__( 'Login aborted', 'ethpress' ),
				'heading'                  => esc_html__( 'Log In', 'ethpress' ),
				'walletconnectButtonTitle' => esc_html__( 'Scan a QR code with your wallet, https://walletconnect.org', 'ethpress' ),
				'metamaskButtonTitle'      => esc_html__( 'Browser add-on and mobile app, https://metamask.io', 'ethpress' ),
			],
		];
		/**
		 * Filters variables passed to Web3Login component.
		 *
		 * @since 0.7.0
		 *
		 * @param array $inline_script An associated array, to be json encoded.
		 */
		$inline_script = apply_filters( 'ethpress_login_inline_script', $inline_script );

		// wp_localize_script is for l10n, but, I mean, same thing.
		wp_add_inline_script(
			'ethpress-login-modal',
			'var ethpressLoginWP = ' . wp_json_encode( $inline_script ) . ';',
			'before'
		);
	}

	/**
	 * Attached to hook.
	 *
	 * @since 0.1.0
	 */
	public static function login_enqueue_scripts() {
		// Only enqueue the -front ones. They'll pull the other ones. This way it's easier to remove them.
		wp_enqueue_script( 'ethpress-login-front' );
	}

	/**
	 * Attached to hook.
	 *
	 * Used in separating styles and scripts, because widget style gets real messy with the css,
	 * since it is mixed with page styles.
	 *
	 * @since 0.7.0
	 */
	public static function login_enqueue_scripts_and_styles() {
		self::login_enqueue_scripts();
		wp_enqueue_style( 'ethpress-login-front' );
	}

	/**
	 * Sends an error message if trying to log in with MetaMask while logged in.
	 *
	 * @since 0.1.0
	 * @deprecated
	 */
	public static function logged_in_user_error() {
		wp_send_json_error( esc_html__( 'Log out first', 'ethpress' ) );
	}

	/**
	 * Load translation files.
	 *
	 * @since 0.1.0
	 */
	public static function load_plugin_textdomain() {
		$path  = dirname( plugin_basename( ETHPRESS_FILE ) );
		$path .= '/languages';
		load_plugin_textdomain( 'ethpress', false, $path );
	}

	/**
	 * Is called from uninstall.php
	 *
	 * @since 0.1.0
	 * @since 1.1.0 No longer deleting the ethpress table.
	 */
	public static function uninstall() {
		defined( 'WP_UNINSTALL_PLUGIN' ) || die;

		delete_option( 'ethpress' );
	}

	/**
	 * Creates database tables on plugin activation.
	 *
	 * @since 0.1.0
	 */
	public static function activate() {
		global $wpdb;

		$table      = $wpdb->base_prefix . self::$tables['addresses'];
		$db_version = '1.1';
		$api_url    = 'https://verify-eth-signature.herokuapp.com/ethpress';
		$opts       = [
			'db_version' => $db_version,
			'api_url'    => $api_url,
		];
		/**
		 * Ethpress' settings.
		 *
		 * @since 0.1.0
		 *
		 * Settings: db_version (internal), api_url: see Signature.php.
		 */
		add_site_option( 'ethpress', $opts );

		require_once trailingslashit( ABSPATH ) . 'wp-admin/includes/upgrade.php';

		// No multisite stuff here because user table only exists once.
		$charset_collate = '';
		if ( $wpdb->has_cap( 'collation' ) ) {
			$charset_collate = $wpdb->get_charset_collate();
		}
		$sql = "
CREATE TABLE {$table} (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name varchar(191) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  coin varchar(15) DEFAULT NULL,
  date datetime DEFAULT '2000-01-01 00:00:00',
  modified datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY  (id),
  UNIQUE KEY name (name),
  KEY user_id (user_id)
) $charset_collate;";
		\dbDelta( $sql );

		Upgrade::handle_upgrades();
	}
}
