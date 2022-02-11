<?php
/**
 * Displays and acts on the plugin's options page.
 *
 * @since 0.3.0
 * @package ethpress
 */

namespace losnappas\Ethpress\Admin;

defined( 'ABSPATH' ) || die;

/**
 * Static.
 *
 * @since 0.3.0
 */
class Options {
	/**
	 * Adds options page.
	 *
	 * @since 0.3.0
	 */
	public static function admin_menu() {
		$page = esc_html__( 'EthPress', 'ethpress' );
		if ( is_multisite() ) {
			add_submenu_page(
				'settings.php',
				$page,
				$page,
				'manage_network_options',
				'ethpress',
				[ __CLASS__, 'create_page' ]
			);
		} else {
			add_options_page(
				$page,
				$page,
				'manage_options',
				'ethpress',
				[ __CLASS__, 'create_page' ]
			);
		}
	}

	/**
	 * Creates options page.
	 *
	 * @since 0.3.0
	 */
	public static function create_page() {
		// Man that html looks bad!
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'EthPress Options Page', 'ethpress' ); ?></h1>
			<p><?php esc_html_e( 'The MetaMask login plugin.', 'ethpress' ); ?></p>
			<h2><a aria-label="<?php esc_attr_e( 'Opens in new tab', 'ethpress' ); ?>" href="https://ethpress.imlynn.xyz/" target="_blank">Check out EthPress PREMIUM plugins! <span style="text-decoration: none;" aria-hidden="true" class="dashicons dashicons-external"></span></a></h2>
			<p><a aria-label="<?php esc_attr_e( 'Opens in new tab', 'ethpress' ); ?>" href="https://etherscan.io/address/0x106417f7265e15c1aae52f76809f171578e982a9" target="_blank" title="<?php esc_attr_e( 'Developer\'s wallet, etherscan.io', 'ethpress' ); ?>" rel="noopener noreferer"><?php esc_html_e( 'Donate to support development!', 'ethpress' ); ?> <span style="text-decoration: none;" aria-hidden="true" class="dashicons dashicons-external"></span></a> <?php esc_html_e( 'For fiat, find the charity link on wp plugin directory.', 'ethpress' ); ?> <a href="https://wordpress.org/plugins/ethpress/" target="_blank" rel="noopener noreferer"><?php esc_html_e( 'Rate EthPress on wp plugin directory!', 'ethpress' ); ?> <span style="text-decoration: none;" aria-hidden="true" class="dashicons dashicons-external"></span></a></p>

			<?php if ( is_multisite() ) { ?>
				<form action="../options.php" method="POST">
			<?php } else { ?>
				<form action="options.php" method="POST">
				<?php
			}
			settings_fields( 'ethpress' );
			do_settings_sections( 'ethpress' );
			$ecrecovers_with_php = extension_loaded( 'gmp' ) || extension_loaded( 'bcmath' );
			if ( ! $ecrecovers_with_php ) {
				submit_button();
			}
			?>
			</form>
			</div>
		<?php
	}

	/**
	 * Adds settings for api_url to options page. admin_init hooked.
	 *
	 * @since 0.3.0
	 */
	public static function admin_init() {
		register_setting(
			'ethpress',
			'ethpress',
			[ __CLASS__, 'options_validate' ]
		);
		add_settings_section(
			'ethpress_main',
			esc_html__( 'Main Settings', 'ethpress' ),
			[ __CLASS__, 'section_api_url' ],
			'ethpress'
		);
		add_settings_field(
			'ethpress_api_url',
			esc_html__( 'Verification service', 'ethpress' ),
			[ __CLASS__, 'input_api_url' ],
			'ethpress',
			'ethpress_main'
		);
	}

	/**
	 * Outputs section title.
	 *
	 * @since 0.3.0
	 */
	public static function section_api_url() {
	}

	/**
	 * Outputs input for api url option.
	 *
	 * @since 0.3.0
	 */
	public static function input_api_url() {
		$ecrecovers_with_php = extension_loaded( 'gmp' ) || extension_loaded( 'bcmath' );
		if ( $ecrecovers_with_php ) {
			echo '<p>' . esc_html__( 'Your PHP installation has the necessary PHP extension to do verifications on your server, so there is nothing to configure.', 'ethpress' ) . '</p>';
			return;
		}
		$options = get_site_option( 'ethpress' );
		echo '<input class="regular-text" id="ethpress_api_url" name="ethpress[api_url]" type="text" value="' . esc_attr( esc_url( $options['api_url'] ) ) . '" />';
		echo '<p class="description">' . esc_html__( 'Use an API or install php-gmp or php-bcmath to verify Ethereum signatures.', 'ethpress' ) . '</p>';
		echo '<p class="description"><a href="https://www.php.net/manual/en/book.gmp.php">PHP-GMP</a> / <a href="https://www.php.net/manual/en/book.bc.php">PHP-BCMath</a></p>';
		echo '<p class="description">' . esc_html__( 'Default API url:', 'ethpress' ) . ' https://verify-eth-signature.herokuapp.com/ethpress</p>';
		echo '<p class="description">' . wp_kses(
			sprintf(
				/* translators: a link. */
				__( 'For more information, see %1$s.', 'ethpress' ),
				'<a href="https://gitlab.com/losnappas/verify-eth-signature" target="_blank" rel="noopener noreferrer">https://gitlab.com/losnappas/verify-eth-signature</a>'
			),
			[
				'a' => [
					'href'   => [],
					'target' => [],
					'rel'    => [],
				],
			]
		) . '</p>';
	}

	/**
	 * Validates input for api url option.
	 *
	 * @param array $input New options input.
	 *
	 * @since 0.3.0
	 */
	public static function options_validate( $input ) {
		$options = get_site_option( 'ethpress' );
		$newurl  = esc_url_raw( trim( $input['api_url'] ) );
		if ( empty( $input['recursive'] ) && is_multisite() ) {
			$options['api_url'] = $newurl;
			// Mark next call as recursed.
			$options['recursive'] = true;
			// This calls this validation function recursively.
			// Nothing happens on "return" because this is multisite.
			update_site_option( 'ethpress', $options );
		}
		$options['api_url'] = $newurl;
		return $options;
	}

	/**
	 * Adds settings link. Hooked to filter.
	 *
	 * @since 0.7.0
	 *
	 * @param array $links Existing links.
	 */
	public static function plugin_action_links( $links ) {
		$label = esc_html__( 'Settings', 'ethpress' );
		if ( is_multisite() ) {
			if ( current_user_can( 'manage_network_options' ) ) {
				$url = esc_attr(
					esc_url(
						add_query_arg(
							'page',
							'ethpress',
							network_admin_url() . 'settings.php'
						)
					)
				);
			} else {
				return $links;
			}
		} else {
			$url = esc_attr(
				esc_url(
					add_query_arg(
						'page',
						'ethpress',
						get_admin_url() . 'options-general.php'
					)
				)
			);
		}
		$settings_link = "<a href='$url'>$label</a>";

		array_unshift( $links, $settings_link );
		return $links;
	}
}
