<?php

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://garden.university
 * @since      1.0.0
 *
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/includes
 * @author     Marty McGee <support@companyjuice.com>
 */
class ThreeD_Garden {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      ThreeD_Garden_Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		if ( defined( 'THREED_GARDEN_VERSION' ) ) {
			$this->version = THREED_GARDEN_VERSION;
		} else {
			$this->version = '1.0.0';
		}
		$this->plugin_name = 'threed-garden';

		$this->load_dependencies();
		$this->set_locale();
		$this->define_admin_hooks();
		$this->define_public_hooks();

	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - ThreeD_Garden_Loader. Orchestrates the hooks of the plugin.
	 * - ThreeD_Garden_i18n. Defines internationalization functionality.
	 * - ThreeD_Garden_Admin. Defines all hooks for the admin area.
	 * - ThreeD_Garden_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies() {

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-threed-garden-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-threed-garden-i18n.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/class-threed-garden-admin.php';

		/**
		 * The class responsible for defining all actions that occur in the public-facing
		 * side of the site.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'public/class-threed-garden-public.php';

		$this->loader = new ThreeD_Garden_Loader();

	}

	/**
	 * Define the locale for this plugin for internationalization.
	 *
	 * Uses the ThreeD_Garden_i18n class in order to set the domain and to register the hook
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function set_locale() {

		$plugin_i18n = new ThreeD_Garden_i18n();

		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );

	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_admin_hooks() {

		$plugin_admin = new ThreeD_Garden_Admin( $this->get_plugin_name(), $this->get_version() );

		// css + js
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );

		// admin menu
		$this->loader->add_action( 'admin_menu', $plugin_admin, 'construct_plugin_menu' );
		$this->loader->add_filter( 'parent_file', $plugin_admin, 'set_current_menu' );

		// custom post types + taxonomies
		$this->loader->add_action( 'init', $plugin_admin, 'plants_init' );
		$this->loader->add_action( 'init', $plugin_admin, 'plant_taxonomies' );
		$this->loader->add_filter( 'post_updated_messages', $plugin_admin, 'plant_updated_messages' );
		$this->loader->add_action( 'init', $plugin_admin, 'allotments_init' );
		$this->loader->add_action( 'init', $plugin_admin, 'allotment_taxonomies' );
		$this->loader->add_filter( 'post_updated_messages', $plugin_admin, 'allotment_updated_messages' );
		$this->loader->add_action( 'init', $plugin_admin, 'beds_init' );
		$this->loader->add_action( 'init', $plugin_admin, 'bed_taxonomies' );
		$this->loader->add_filter( 'post_updated_messages', $plugin_admin, 'bed_updated_messages' );
		$this->loader->add_action( 'init', $plugin_admin, 'planting_plans_init' );
		$this->loader->add_action( 'init', $plugin_admin, 'planting_plan_taxonomies' );
		$this->loader->add_filter( 'post_updated_messages', $plugin_admin, 'planting_plan_updated_messages' );


	}

	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_public_hooks() {

		$plugin_public = new ThreeD_Garden_Public( $this->get_plugin_name(), $this->get_version() );

		// css + js
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_styles' );
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_scripts' );

		// custom fields testing
		$this->loader->add_filter( 'the_content', $plugin_public , 'display_all_custom_fields' );

	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    ThreeD_Garden_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}

}
