<?php
/**
 * Ethpress widget: a button
 *
 * @package ethpress
 */

namespace losnappas\Ethpress\Widgets;

defined( 'ABSPATH' ) || die;

use losnappas\Ethpress\Plugin;
use losnappas\Ethpress\Front;


/**
 * Ethpress widget.
 *
 * @since 0.7.0
 */
class Button extends \WP_Widget {

	/**
	 * Sets up the widgets name etc
	 *
	 * @since 0.7.0
	 */
	public function __construct() {
		$widget_ops = array(
			'classname'   => 'ethpress-widget',
			'description' => esc_html__( 'EthPress Widget', 'ethpress' ),
		);
		parent::__construct( 'ethpress', esc_html__( 'EthPress', 'ethpress' ), $widget_ops );
	}

	/**
	 * Outputs the content of the widget
	 *
	 * @since 0.7.0
	 *
	 * @param array $args Widget arguments.
	 * @param array $instance Saved values from database.
	 */
	public function widget( $args, $instance ) {
		$is_user_logged_in = is_user_logged_in();

		// This means it's going into admin dashboard.
		if ( ! is_array( $args ) ) {
			$args = [
				'before_widget' => '<div class="ethpress" id="ethpress-dashboard-widget">',
				'after_widget'  => '</div>',
				'before_title'  => '<h3>',
				'after_title'   => '</h3>',
			];
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- These are supposed to be unescaped.
		echo $args['before_widget'];
		if ( ! empty( $instance['title'] ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- These are supposed to be unescaped.
			echo $args['before_title'] . apply_filters( 'widget_title', $instance['title'] ) . $args['after_title'];
		}

		Plugin::login_enqueue_scripts();
		if ( ! $is_user_logged_in ) {
			Front::login_form();
		} else {
			?>
			<button class='ethpress-metamask-login-button ethpress-button ethpress-button-secondary ethpress-button-large ethpress-account-linker-button' type='button' name='metamask'>
				<?php esc_html_e( 'Link Your Crypto Wallets', 'ethpress' ); ?>
			</button>
			<?php
		}
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- These are supposed to be unescaped.
		echo $args['after_widget'];
	}

	/**
	 * Outputs the options form on admin
	 *
	 * @param array $instance The widget options.
	 */
	public function form( $instance ) {
		$title = ! empty( $instance['title'] ) ? $instance['title'] : '';
		?>
		<p>
		<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'ethpress' ); ?></label>
		<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name ="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>">
		</p>
		<?php
	}

	/**
	 * Processing widget options on save
	 *
	 * @since 0.7.0
	 *
	 * @param array $new_instance The new options.
	 * @param array $old_instance The previous options.
	 *
	 * @return array
	 */
	public function update( $new_instance, $old_instance ) {
		$instance          = array();
		$instance['title'] = ( ! empty( $new_instance['title'] ) ) ? sanitize_text_field( $new_instance['title'] ) : '';
		return $instance;
	}

	/**
	 * Registers login button/account linker button widget.
	 *
	 * @since 0.7.0
	 */
	public static function widgets_init() {
		register_widget( ETHPRESS_NS . '\Widgets\Button' );

		global $pagenow;
		$login_page    = wp_login_url();
		$is_login_page = false !== stripos( $login_page, $pagenow );
		if ( isset( $_SERVER['SCRIPT_NAME'] ) ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- we are simply comparing.
			$is_login_page = $is_login_page || false !== stripos( $login_page, wp_unslash( $_SERVER['SCRIPT_NAME'] ) );
		}
		$ajax = defined( 'DOING_AJAX' ) && DOING_AJAX;
		if ( function_exists( 'wp_doing_ajax' ) ) {
			$ajax = wp_doing_ajax();
		}
		if ( isset( $_SERVER['HTTP_REFERER'] ) && $ajax ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- we are simply comparing.
			$is_login_page = $is_login_page || false !== stripos( wp_unslash( $_SERVER['HTTP_REFERER'] ), $login_page );
		}
		if ( ! $is_login_page && is_user_logged_in() ) {
			add_action( 'wp_ajax_ethpress_link_account', [ ETHPRESS_NS . '\Linker', 'link_account' ] );
			add_filter( 'ethpress_login_message', [ ETHPRESS_NS . '\Linker', 'login_message' ] );
			add_filter(
				'ethpress_login_inline_script',
				[ ETHPRESS_NS . '\Linker', 'ethpress_login_inline_script' ]
			);
		}
	}

	/**
	 * Add EthPress widget to wp admin profile page.
	 *
	 * @since 0.7.0
	 */
	public static function show_user_profile() {
		?>
		<h3><?php esc_html_e( 'Crypto Wallet', 'ethpress' ); ?></h3>
		<p><?php esc_html_e( 'After linking a crypto wallet to your account, you can use it to log in.', 'ethpress' ); ?></p>
		<?php
		self::widgets_init();
		$widget = new Button();
		$widget->widget( null, null );
		Plugin::register_scripts();
		Plugin::login_enqueue_scripts_and_styles();
	}
}

