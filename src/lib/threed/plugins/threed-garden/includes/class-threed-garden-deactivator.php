<?php

/**
 * Fired during plugin deactivation
 *
 * @link       https://garden.university
 * @since      0.0.1
 *
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/includes
 */

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      0.0.1
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/includes
 * @author     Marty McGee <support@companyjuice.com>
 */
class ThreeD_Garden_Deactivator {

	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    0.0.1
	 */
	public static function deactivate() {
		if ( ! current_user_can( 'activate_plugins' ) ) return;

		flush_rewrite_rules();
	}

}