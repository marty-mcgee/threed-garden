<?php

/**
 * Fired during plugin activation
 *
 * @link       https://garden.university
 * @since      0.0.1
 *
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      0.0.1
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/includes
 * @author     Marty McGee <support@companyjuice.com>
 */
class ThreeD_Garden_Activator {

	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    0.0.1
	 */
	public static function activate() {
		if ( ! current_user_can( 'activate_plugins' ) ) return;

		add_option( 'threedgarden_posts_per_page', 10 );
		add_option( 'threedgarden_show_welcome_page', true );

		flush_rewrite_rules();
	}

}