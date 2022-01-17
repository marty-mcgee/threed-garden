<?php
/**
 * Handles addresses.
 *
 * @since 0.1.0
 * @package ethpress
 */

namespace losnappas\Ethpress;

defined( 'ABSPATH' ) || die;

use losnappas\Ethpress\Plugin;

/**
 * Address object.
 *
 * @since 0.1.0
 */
class Address {

	/**
	 * User associated with this address.
	 *
	 * @since 0.1.0
	 *
	 * @var (WP_User|null) $user
	 */
	private $user;

	/**
	 * Address or public key.
	 *
	 * @since 0.1.0
	 *
	 * @var string $coinbase Address.
	 */
	private $coinbase;

	/**
	 * ID. Don't rely on this too much for now.
	 *
	 * @since 0.1.0
	 *
	 * @var int $ID Id.
	 */
	private $ID;

	/**
	 * Gets variable.
	 *
	 * @since 0.1.0
	 */
	public function get_user() {
		if ( ! $this->user ) {
			$this->attach_owner();
		}
		return $this->user;
	}

	/**
	 * Gets variable.
	 *
	 * @since 0.1.0
	 */
	public function get_coinbase() {
		return $this->coinbase;
	}

	/**
	 * Gets variable.
	 *
	 * @since 0.1.0
	 */
	public function get_address() {
		return $this->get_coinbase();
	}

	/**
	 * Gets variable.
	 *
	 * @since 0.1.0
	 */
	public function get_id() {
		return $this->ID;
	}

	/**
	 * Constructs.
	 *
	 * @since 0.1.0
	 *
	 * @param string $coinbase An address.
	 * @param array  $args {
	 *      Optional. Array with user, and address id.
	 *
	 *      @type WP_User $user The User to be associated with this address.
	 *      @type int $id ID for this address. NOT user ID!
	 * }
	 * @throws \WP_Error If coinbase is invalid.
	 */
	public function __construct( $coinbase, $args = [] ) {
		// Better safe than sorry.
		$this->coinbase = self::sanitize( $coinbase );

		if ( ! $this->coinbase ) {
			throw new \WP_Error( 'ethpress', __( 'Bad address.', 'ethpress' ) );
		}
		if ( empty( $args['user'] ) ) {
			$this->attach_owner();
		} else {
			$this->user = $args['user'];
		}

		if ( isset( $args['id'] ) ) {
			$this->ID = $args['id'];
		}
	}

	/**
	 * Sets owner of address.
	 *
	 * @since 0.1.0
	 */
	private function attach_owner() {
		global $wpdb;

		$table = $wpdb->base_prefix . Plugin::$tables['addresses'];

		// phpcs:ignore -- ok.
		$row = $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore -- table name.
				"SELECT id, user_id FROM {$table}
				WHERE name = %s
				LIMIT 1",
				$this->coinbase
			)
		);

		// When this function is called before user is created, row is null.
		if ( null !== $row ) {
			$user = get_user_by( 'ID', $row->user_id );
			if ( ! is_wp_error( $user ) ) {
				$this->user = $user;
			}
			$id = $row->id;
			if ( isset( $id ) ) {
				$this->ID = $id;
			}
		}
	}

	/**
	 * Creates an address row for this user.
	 *
	 * @since 0.1.0
	 * @since 0.7.0 Returns false or insert_id.
	 *
	 * @return (int|boolean) insert_id or false.
	 */
	public function create() {
		if ( ! $this->user ) {
			$this->attach_owner();
		}
		if ( ! $this->user ) {
			return new \WP_Error( 'ethpress', __( 'No user for this address exists.', 'ethpress' ) );
		}

		global $wpdb;

		$table = $wpdb->base_prefix . Plugin::$tables['addresses'];

		// Should I do something about these?
		// phpcs:ignore -- cache.
		$address_exists = $wpdb->get_var(
			$wpdb->prepare(
				// phpcs:ignore -- table name again.
				"SELECT COUNT(*) FROM $table WHERE name = %s",
				$this->coinbase
			)
		);
		if ( '0' !== $address_exists ) {
			return false;
		}

		$data   = [
			'name'     => $this->coinbase,
			'user_id'  => $this->user->ID,
			'date'     => current_time( 'mysql' ),
			'modified' => current_time( 'mysql' ),
		];
		$format = [
			'%s',
			'%d',
			'%s',
			'%s',
		];

		// phpcs:ignore -- ok.
		$success = $wpdb->insert(
			$table,
			$data,
			$format
		);

		$this->ID = $wpdb->insert_id;

		if ( false === $success ) {
			return $success;
		}

		return $this->ID;
	}

	/**
	 * Deletes this address from the database.
	 *
	 * @since 0.1.0
	 *
	 * @return (int|false) # of rows, false on error.
	 */
	public function delete() {
		$where  = [];
		$format = [];

		$user = $this->get_user();
		if ( ! empty( $user ) ) {
			$where['user_id'] = $user->ID;
			$format[]         = '%d';
		}

		$coinbase = $this->coinbase;
		if ( isset( $coinbase ) ) {
			$where['name'] = $coinbase;
			$format[]      = '%s';
		}

		$id = $this->ID;
		if ( isset( $id ) ) {
			$where['id'] = $id;
			$format[]    = '%d';
		}

		if ( empty( $where ) ) {
			return 0;
		}

		global $wpdb;

		// phpcs:ignore -- ok.
		return $wpdb->delete(
			$wpdb->base_prefix . Plugin::$tables['addresses'],
			$where,
			$format
		);
	}

	/**
	 * Finds user's address.
	 *
	 * @since 0.1.0
	 *
	 * @param int $user_id User id.
	 * @return (Address|\WP_Error) Address if found, \WP_Error otherwise.
	 */
	public static function find_by_user( $user_id ) {
		global $wpdb;

		$table = $wpdb->base_prefix . Plugin::$tables['addresses'];
		// phpcs:ignore -- cache.
		$row   = $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore -- table name.
				"SELECT id, name FROM {$table}
				WHERE user_id = %d
				LIMIT 1",
				$user_id
			)
		);
		if ( empty( $row ) ) {
			return new \WP_Error( 'ethpress', __( 'No matching address.', 'ethpress' ) );
		}

		$user = get_user_by( 'ID', $user_id );
		$id   = $row->id;
		$addr = $row->name;

		if ( empty( $addr ) ) {
			return new \WP_Error( 'ethpress', __( 'No matching address.', 'ethpress' ) );
		} else {
			try {
				$addr = new Address(
					$addr,
					compact( 'id', 'user' )
				);
			} catch ( \WP_Error $error ) {
				$addr = $error;
			}
			return $addr;
		}
	}

	/**
	 * Logs in user associated with the address.
	 *
	 * @since 0.1.0
	 *
	 * @return (WP_User|\WP_Error) WP_User on success, \WP_Error on failure.
	 */
	public function log_in() {
		if ( ! $this->user ) {
			return new \WP_Error( 'ethpress', __( 'You have not registered on this site; we cannot log you in', 'ethpress' ) );
		}

		clean_user_cache( $this->user->ID );
		wp_clear_auth_cookie();

		wp_set_current_user( $this->user->ID );
		wp_set_auth_cookie( $this->user->ID, false );
		update_user_caches( $this->user );

		// phpcs:ignore -- WordPress action.
		do_action( 'wp_login', $this->user->data->user_login, $this->user );
		return $this->user;
	}

	/**
	 * Registers address user.
	 *
	 * @since 0.1.0
	 *
	 * @return (WP_User|\WP_Error) WP_User on success, \WP_Error or false on failure.
	 */
	public function register() {
		$userlogin_max_length = 60;

		$user_login = substr( $this->coinbase, 0, $userlogin_max_length );
		$user_login = trim( $user_login );
		if ( empty( $user_login ) ) {
			return new \WP_Error( 'ethpress', __( 'Empty username.', 'ethpress' ) );
		}
		$existing_user_id = username_exists( $user_login );

		if ( false !== $existing_user_id ) {
			return new \WP_Error( 'ethpress', __( 'Username already exists.', 'ethpress' ) );
		}

		if ( is_multisite() ) {
			// Is this obsolete or not???
			// https://codex.wordpress.org/WPMU_Functions says it is?
			// But then, the new REST api uses it. What is going on?
			$user_id = wpmu_create_user( $user_login, wp_generate_password(), '' );
			if ( ! $user_id ) {
				return new \WP_Error( 'ethpress', __( 'Error during creation', 'ethpress' ) );
			}
		} else {
			$user_id = wp_create_user( $user_login, wp_generate_password() );
			if ( is_wp_error( $user_id ) ) {
				return $user_id;
			}
		}
		$this->user = get_user_by( 'ID', $user_id );

		$this->create();

		return $this->user;
	}

	/**
	 * Registers, if address doesn't exist, and logs in.
	 *
	 * @since 0.1.0
	 *
	 * @return (WP_User|WP_Error) WP_User on success, WP_Error on error.
	 */
	public function register_and_log_in() {
		if ( ! $this->user ) {
			$user = $this->register();
		}
		if ( ! is_wp_error( $user ) ) {
			$user = $this->log_in();
		}
		return $user;
	}

	/**
	 * Helps remain consistent in sanitizing addresses.
	 *
	 * TODO: need to make sure this doesn't go around changing the addresses. also need to make a validate() function that can take eth and bch and etc. addresses.
	 *
	 * @since 0.1.0
	 *
	 * @param string $coinbase Address.
	 * @return string Sanitized address.
	 */
	public static function sanitize( $coinbase ) {
		$coinbase = sanitize_text_field( (string) $coinbase );
		return $coinbase;
	}

}
