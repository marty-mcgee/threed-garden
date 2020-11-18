<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://garden.university
 * @since      1.0.0
 *
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the public-facing stylesheet and JavaScript.
 *
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/public
 * @author     Marty McGee <support@companyjuice.com>
 */
class ThreeD_Garden_Public {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string    $plugin_name       The name of the plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version = $version;

	}

	/**
	 * Register the stylesheets for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in ThreeD_Garden_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The ThreeD_Garden_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/threed-garden-public.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in ThreeD_Garden_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The ThreeD_Garden_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/threed-garden-public.js', array( 'jquery' ), $this->version, false );

	}

	/**
	 * display all custom field for each post
	 */
	public function display_all_custom_fields( $content ) {

		/*
			get_post_meta(
				int $post_id,
				string $key = '',
				bool $single = false
			)
		*/
		
		$append_output = '<h3>Custom Fields</h3>';

		$all_custom_fields = get_post_custom();

		foreach ( $all_custom_fields as $key => $array ) {
			foreach ( $array as $value ) {
				if ( '_' !== substr( $key, 0, 1 ) ) {
					$append_output .= '<div>' . $key . ' => ' . $value . '</div>';
				}
			}
		}

		// $current_mood = get_post_meta( get_the_ID(), 'mood', true );

		// $append_output  = '<div>';
		// $append_output .= esc_html__( 'Feeling ' );
		// $append_output .= sanitize_text_field( $current_mood );
		// $append_output .= '</div>';

		return $content . $append_output;

	}

}
