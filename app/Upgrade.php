<?php
/**
 * Handles upgrade procedures.
 *
 * @package ethpress
 */

namespace losnappas\Ethpress;

defined( 'ABSPATH' ) || die;

/**
 * Upgrades.
 *
 * @since 0.2.1
 */
class Upgrade {

	/**
	 * Upgrades from version 0.1.0; db_version 1.0.
	 *
	 * The database had an incompatibility with multisite. Table needs base_prefix. Merge all existing, bad tables.
	 */
	private static function from_zero_one_zero() {
		if ( is_multisite() ) {
			global $wpdb;
			$ethpress_table = $wpdb->base_prefix . 'ethpress_addresses';

			// phpcs:ignore -- direct db call.
			$tables = $wpdb->get_col( 'SHOW TABLES', 0 );
			$now    = current_time( 'mysql' );
			foreach ( $tables as $table ) {
				// If ethpress table does not match here, it has non-base prefix. We need to merge it.
				if ( false !== strpos( $table, 'ethpress_addresses' )
					&& false === strpos( $ethpress_table, $table ) ) {
					$sql = "INSERT INTO $ethpress_table (name, user_id, date, modified) SELECT name, user_id, date, '$now' FROM $table";
					// phpcs:ignore -- table names are safe.
					$success = $wpdb->query( $sql );
					// Maybe best to leave the broken tables (wp_*_ethpress_addresses) hanging for a while.
				}
			}
		}
	}

	/**
	 * Handles setting up upgrades.
	 */
	public static function handle_upgrades() {
		$options = get_site_option( 'ethpress' );
		if ( '1.0' === $options['db_version'] ) {
			self::from_zero_one_zero();
			$options['db_version'] = '1.1';
			update_option( 'ethpress', $options );
		}
	}
}
