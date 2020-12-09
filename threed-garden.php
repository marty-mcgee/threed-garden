<?php

/**
 * @link              https://garden.university
 * @since             1.0.0
 * @package           ThreeD_Garden
 *
 * @wordpress-plugin
 * Plugin Name:       WP 3D Garden
 * Plugin URI:        https://garden.university
 * Description:       Design + manage your garden plants, beds + allotments in 3D
 * Version:           1.15.0
 * Author:            Marty McGee
 * Author URI:        https://companyjuice.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       threedgarden
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'THREED_GARDEN_VERSION', '1.15.0' );

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-threed-garden-activator.php
 */
function activate_threed_garden() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-threed-garden-activator.php';
	ThreeD_Garden_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-threed-garden-deactivator.php
 */
function deactivate_threed_garden() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-threed-garden-deactivator.php';
	ThreeD_Garden_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_threed_garden' );
register_deactivation_hook( __FILE__, 'deactivate_threed_garden' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-threed-garden.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_threed_garden() {

	$plugin = new ThreeD_Garden();
	$plugin->run();

}
run_threed_garden();




/**
 * TESTING
 * **********************************************************************************************
 */

class ThreeDGardenPlugin{
  
	private static $instance;
	 /*......*/

	static function threedgarden_get_instance()
	{
		if (!isset(self::$instance))
		{
			self::$instance = new self();
		}
		return self::$instance;
	}
	
	

	// register plugin settings
	public function threedgarden_register_settings() {
		/*
		register_setting( 
			string   $option_group, 
			string   $option_name, 
			callable $sanitize_callback
		);
		*/
		register_setting( 
			'threedgarden_options', 
			'threedgarden_options', 
			array($this, 'threedgarden_callback_validate_options')
		);
		/*
		add_settings_section( 
			string   $id, 
			string   $title, 
			callable $callback, 
			string   $page
		);
		*/
		add_settings_section( 
			'threedgarden_section_login', 
			'Customize Login Page', 
			array($this, 'threedgarden_callback_section_login'), 
			'threedgarden'
		);
		add_settings_section( 
			'threedgarden_section_admin', 
			'Customize Admin Area', 
			array($this, 'threedgarden_callback_section_admin'), 
			'threedgarden'
		);

		/*
		add_settings_field(
			string   $id,
			string   $title,
			callable $callback,
			string   $page,
			string   $section = 'default',
			array    $args = []
		);
		*/
		add_settings_field(
			'custom_url',
			'Custom URL',
			array($this, 'threedgarden_callback_field_text'),
			'threedgarden',
			'threedgarden_section_login',
			[ 'id' => 'custom_url', 'label' => 'Custom URL for the login logo link' ]
		);
		add_settings_field(
			'custom_title',
			'Custom Title',
			array($this, 'threedgarden_callback_field_text'),
			'threedgarden',
			'threedgarden_section_login',
			[ 'id' => 'custom_title', 'label' => 'Custom title attribute for the logo link' ]
		);
		add_settings_field(
			'custom_style',
			'Custom Style',
			array($this, 'threedgarden_callback_field_radio'),
			'threedgarden',
			'threedgarden_section_login',
			[ 'id' => 'custom_style', 'label' => 'Custom CSS for the Login screen' ]
		);
		add_settings_field(
			'custom_message',
			'Custom Message',
			array($this, 'threedgarden_callback_field_textarea'),
			'threedgarden',
			'threedgarden_section_login',
			[ 'id' => 'custom_message', 'label' => 'Custom text and/or markup' ]
		);
		add_settings_field(
			'custom_footer',
			'Custom Footer',
			array($this, 'threedgarden_callback_field_text'),
			'threedgarden',
			'threedgarden_section_admin',
			[ 'id' => 'custom_footer', 'label' => 'Custom footer text' ]
		);
		add_settings_field(
			'custom_toolbar',
			'Custom Toolbar',
			array($this, 'threedgarden_callback_field_checkbox'),
			'threedgarden',
			'threedgarden_section_admin',
			[ 'id' => 'custom_toolbar', 'label' => 'Remove new post and comment links from the Toolbar' ]
		);
		add_settings_field(
			'custom_scheme',
			'Custom Scheme',
			array($this, 'threedgarden_callback_field_select'),
			'threedgarden',
			'threedgarden_section_admin',
			[ 'id' => 'custom_scheme', 'label' => 'Default color scheme for new users' ]
		);

	}

	// default plugin options
	public function threedgarden_options_default() {

		return array(
			'custom_url'     => 'https://garden.university/',
			'custom_title'   => 'Powered by Company Juice',
			'custom_style'   => 'disable',
			'custom_message' => '<p class="custom-message">My custom message</p>',
			'custom_footer'  => 'Special message for users',
			'custom_toolbar' => false,
			'custom_scheme'  => 'default',
		);

	}

	// validate plugin settings
	public function threedgarden_callback_validate_options($input) {
		// todo: add validation functionality..
		//return $input;
		// custom url
		if ( isset( $input['custom_url'] ) ) {
			$input['custom_url'] = esc_url( $input['custom_url'] );
		}
		
		// custom title
		if ( isset( $input['custom_title'] ) ) {
			$input['custom_title'] = sanitize_text_field( $input['custom_title'] );
		}
		
		// custom style
		$radio_options = array(
			'enable'  => 'Enable custom styles',
			'disable' => 'Disable custom styles'
		);
		
		if ( ! isset( $input['custom_style'] ) ) {
			$input['custom_style'] = null;
		}
		if ( ! array_key_exists( $input['custom_style'], $radio_options ) ) {
			$input['custom_style'] = null;
		}
		
		// custom message
		if ( isset( $input['custom_message'] ) ) {
			$input['custom_message'] = wp_kses_post( $input['custom_message'] );
		}
		
		// custom footer
		if ( isset( $input['custom_footer'] ) ) {
			$input['custom_footer'] = sanitize_text_field( $input['custom_footer'] );
		}
		
		// custom toolbar
		if ( ! isset( $input['custom_toolbar'] ) ) {
			$input['custom_toolbar'] = null;
		}
		
		$input['custom_toolbar'] = ($input['custom_toolbar'] == 1 ? 1 : 0);
		
		// custom scheme
		$select_options = array(
			'default'   => 'Default',
			'light'     => 'Light',
			'dark'      => 'Dark',
		);
		
		if ( ! isset( $input['custom_scheme'] ) ) {
			$input['custom_scheme'] = null;
		}
		
		if ( ! array_key_exists( $input['custom_scheme'], $select_options ) ) {
			$input['custom_scheme'] = null;
		}
		
		return $input;
	}
	// callback: login section
	public function threedgarden_callback_section_login() {
		echo '<p>These settings enable you to customize the WP Login screen.</p>';
	}
	// callback: admin section
	public function threedgarden_callback_section_admin() {
		echo '<p>These settings enable you to customize the WP Admin Area.</p>';
	}
	// callback: text field
	public function threedgarden_callback_field_text( $args ) {
		// todo: add callback functionality..
		//echo 'This will be a text field.';
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
	
		$id    = isset( $args['id'] )    ? $args['id']    : '';
		$label = isset( $args['label'] ) ? $args['label'] : '';
		
		$value = isset( $options[$id] ) ? sanitize_text_field( $options[$id] ) : '';
		
		echo '<input id="threedgarden_options_'. $id .'" name="threedgarden_options['. $id .']" type="text" size="40" value="'. $value .'"><br />';
		echo '<label for="threedgarden_options_'. $id .'">'. $label .'</label>';
		
	}
	// callback: radio field
	public function threedgarden_callback_field_radio( $args ) {
		// todo: add callback functionality..
		//echo 'This will be a radio field.';
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
	
		$id    = isset( $args['id'] )    ? $args['id']    : '';
		$label = isset( $args['label'] ) ? $args['label'] : '';
		
		$selected_option = isset( $options[$id] ) ? sanitize_text_field( $options[$id] ) : '';
		
		$radio_options = array(
			
			'enable'  => 'Enable custom styles',
			'disable' => 'Disable custom styles'
			
		);
		
		foreach ( $radio_options as $value => $label ) {
			
			$checked = checked( $selected_option === $value, true, false );
			
			echo '<label><input name="threedgarden_options['. $id .']" type="radio" value="'. $value .'"'. $checked .'> ';
			echo '<span>'. $label .'</span></label><br />';
			
		}
	}
	// callback: textarea field
	public function threedgarden_callback_field_textarea( $args ) {
		// todo: add callback functionality..
		//echo 'This will be a textarea.';
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
	
		$id    = isset( $args['id'] )    ? $args['id']    : '';
		$label = isset( $args['label'] ) ? $args['label'] : '';
		
		$allowed_tags = wp_kses_allowed_html( 'post' );
		
		$value = isset( $options[$id] ) ? wp_kses( stripslashes_deep( $options[$id] ), $allowed_tags ) : '';
		
		echo '<textarea id="threedgarden_options_'. $id .'" name="threedgarden_options['. $id .']" rows="5" cols="50">'. $value .'</textarea><br />';
		echo '<label for="threedgarden_options_'. $id .'">'. $label .'</label>';
	}
	// callback: checkbox field
	public function threedgarden_callback_field_checkbox( $args ) {
		// todo: add callback functionality..
		//echo 'This will be a checkbox.';
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
	
		$id    = isset( $args['id'] )    ? $args['id']    : '';
		$label = isset( $args['label'] ) ? $args['label'] : '';
		
		$checked = isset( $options[$id] ) ? checked( $options[$id], 1, false ) : '';
		
		echo '<input id="threedgarden_options_'. $id .'" name="threedgarden_options['. $id .']" type="checkbox" value="1"'. $checked .'> ';
		echo '<label for="threedgarden_options_'. $id .'">'. $label .'</label>';
	}
	// callback: select field
	public function threedgarden_callback_field_select( $args ) {
		// todo: add callback functionality..
		//echo 'This will be a select menu.';
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
	
		$id    = isset( $args['id'] )    ? $args['id']    : '';
		$label = isset( $args['label'] ) ? $args['label'] : '';
		
		$selected_option = isset( $options[$id] ) ? sanitize_text_field( $options[$id] ) : '';
		
		$select_options = array(
			'default'   => 'Default',
			'light'     => 'Light',
			'dark'      => 'Dark',
		);
		
		echo '<select id="threedgarden_options_'. $id .'" name="threedgarden_options['. $id .']">';
		
		foreach ( $select_options as $value => $option ) {
			$selected = selected( $selected_option === $value, true, false );
			echo '<option value="'. $value .'"'. $selected .'>'. $option .'</option>';
		}
		
		echo '</select> <label for="threedgarden_options_'. $id .'">'. $label .'</label>';
	}



	



	// custom login logo url
	public function threedgarden_custom_login_url( $url ) {
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
		
		if ( isset( $options['custom_url'] ) && ! empty( $options['custom_url'] ) ) {
			$url = esc_url( $options['custom_url'] );
		}
		
		return $url;
	}
	// custom login logo title
	public function threedgarden_custom_login_title( $title ) {
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
		
		if ( isset( $options['custom_title'] ) && ! empty( $options['custom_title'] ) ) {
			$title = esc_attr( $options['custom_title'] );
		}
		
		return $title;
	}
	// custom login styles
	public function threedgarden_custom_login_styles() {

		$styles = false;
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
		
		if ( isset( $options['custom_style'] ) && ! empty( $options['custom_style'] ) ) {
			$styles = sanitize_text_field( $options['custom_style'] );
		}
		
		if ( 'enable' === $styles ) {
			/*
			wp_enqueue_style( 
				string           $handle, 
				string           $src = '', 
				array            $deps = array(), 
				string|bool|null $ver = false, 
				string           $media = 'all' 
			)
			wp_enqueue_script( 
				string           $handle, 
				string           $src = '', 
				array            $deps = array(), 
				string|bool|null $ver = false, 
				bool             $in_footer = false 
			)
			*/
			wp_enqueue_style( 
				'threedgarden', 
				plugin_dir_url( dirname( __FILE__ ) ) . 'threed-garden/public/css/threed-garden-public-custom.css', 
				array(), 
				null, 
				'screen' 
			);
			wp_enqueue_script( 
				'threedgarden', 
				plugin_dir_url( dirname( __FILE__ ) ) . 'threed-garden/public/js/threed-garden-public-custom.js', 
				array(), 
				null, 
				true 
			);
		}
	}
	// custom login message
	public function threedgarden_custom_login_message( $message ) {
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
		
		if ( isset( $options['custom_message'] ) && ! empty( $options['custom_message'] ) ) {
			$message = wp_kses_post( $options['custom_message'] ) . $message;
		}
		
		return $message;
	}
	// custom admin footer
	public function threedgarden_custom_admin_footer( $message ) {
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
		
		if ( isset( $options['custom_footer'] ) && ! empty( $options['custom_footer'] ) ) {
			$message = sanitize_text_field( $options['custom_footer'] );
		}
		
		return $message;
	}
	// custom toolbar items
	public function threedgarden_custom_admin_toolbar() {
		
		$toolbar = false;
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
		
		if ( isset( $options['custom_toolbar'] ) && ! empty( $options['custom_toolbar'] ) ) {
			$toolbar = (bool) $options['custom_toolbar'];
		}
		
		if ( $toolbar ) {
			global $wp_admin_bar;
			
			$wp_admin_bar->remove_menu( 'comments' );
			$wp_admin_bar->remove_menu( 'new-content' );
		}
	}
	// custom admin color scheme
	public function threedgarden_custom_admin_scheme( $user_id ) {
		
		$scheme = 'default';
		$options = get_option( 'threedgarden_options', $this->threedgarden_options_default() );
		
		if ( isset( $options['custom_scheme'] ) && ! empty( $options['custom_scheme'] ) ) {
			$scheme = sanitize_text_field( $options['custom_scheme'] );
		}
		
		$args = array( 'ID' => $user_id, 'admin_color' => $scheme );
		
		wp_update_user( $args );
	}




	// do stuff on uninstall
	public function threedgarden_on_uninstall() {
		if ( ! current_user_can( 'activate_plugins' ) ) return;

		delete_option( 'threedgarden_posts_per_page', 10 );
		delete_option( 'threedgarden_show_welcome_page', true );
	}

	/**
	 * run plugin init
	 */
	public function threedgarden_plugin_init()
	{	
		// if ( is_admin() ) {
		register_uninstall_hook( __FILE__, array($this, 'threedgarden_on_uninstall') );
		
		add_action( 'admin_init', array($this, 'threedgarden_register_settings') );
		// }
		
		add_filter( 'login_headerurl', array($this, 'threedgarden_custom_login_url') );
		add_filter( 'login_headertitle', array($this, 'threedgarden_custom_login_title') );
		add_filter( 'login_message', array($this, 'threedgarden_custom_login_message') );
		add_filter( 'admin_footer_text', array($this, 'threedgarden_custom_admin_footer') );
		add_action( 'wp_before_admin_bar_render', array($this, 'threedgarden_custom_admin_toolbar'), 999 );
		add_action( 'user_register', array($this, 'threedgarden_custom_admin_scheme') );
	}

}

/**
 * engage wp plugin
 */
//$ThreeDGardenPlugin = ThreeDGardenPlugin::threedgarden_get_instance();
//$ThreeDGardenPlugin->threedgarden_plugin_init();

/**
 * END FILE
 * **********************************************************************************************
 */