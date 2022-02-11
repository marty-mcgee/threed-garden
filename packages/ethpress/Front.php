<?php
/**
 * Handles front-end.
 *
 * @since 0.1.0
 * @package ethpress
 */

namespace losnappas\Ethpress;

defined( 'ABSPATH' ) || die;

use \losnappas\Ethpress\Plugin;

/**
 * Handles functions for frontend.
 *
 * @since 0.1.0
 */
class Front {

	/**
	 * Displays login button. Hooked to login_form.
	 *
	 * @since 0.1.0
	 */
	public static function login_form() {
		$text     = esc_html__( 'Enable JavaScript to log in with a crypto wallet.', 'ethpress' );
		$noscript = '<noscript>' . $text . '</noscript>';

		// phpcs:disable -- Complains about not being escaped. They are.
		echo $noscript;
		?>
			<div class="ethpress">
				<?php echo self::get_login_button(); ?>
			</div>
		<?php
		// phpcs:enable
	}

	/**
	 * Gets the login form.
	 *
	 * @since 0.1.1
	 */
	public static function get_login_form() {
		\ob_start();
		self::login_form();
		return \ob_get_clean();
	}

	/**
	 * Creates necessary html for the login button.
	 *
	 * @since 0.1.0
	 *
	 * @return string Login button html.
	 */
	public static function get_login_button() {
		$label  = esc_html__( 'Log In With a Crypto Wallet', 'ethpress' );
		$button = "
<button class='ethpress-metamask-login-button ethpress-button ethpress-button-secondary ethpress-button-large' type='button' name='metamask'>
	$label
</button>";
		return $button;
	}
}
