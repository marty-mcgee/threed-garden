<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://garden.university
 * @since      1.0.0
 *
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    ThreeD_Garden
 * @subpackage ThreeD_Garden/admin
 * @author     Marty McGee <support@companyjuice.com>
 */
class ThreeD_Garden_Admin {

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
	 * @param      string    $plugin_name       The name of this plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version = $version;

	}

	/**
	 * Register the stylesheets for the admin area.
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

		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/threed-garden-admin.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the admin area.
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

		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/threed-garden-admin.js', array( 'jquery' ), $this->version, false );

	}

	/**
	 * construct the left menu for the admin area.
	 */
	public function construct_plugin_menu() {
		add_menu_page(
			'3D Garden',
			'3D Garden', 
			'manage_options',
			'threedgarden', 
			array($this, 'RenderPage'), 
			plugins_url('/admin/media/threedgarden-icon.png',__DIR__), //'dashicons-media-code',
			31 //null
			);
		add_submenu_page(
			'threedgarden', 
			'Plants', 
			'Plants', 
			'manage_options', 
			'edit.php?post_type=plant',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Plant Types', 
			'Plant Types', 
			'manage_options', 
			'edit-tags.php?taxonomy=plant_type&post_type=plant',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Plant Seasons', 
			'Plant Seasons', 
			'manage_options', 
			'edit-tags.php?taxonomy=plant_season&post_type=plant',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Allotments', 
			'Allotments', 
			'manage_options', 
			'edit.php?post_type=allotment',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Allotment Types', 
			'Allotment Types', 
			'manage_options', 
			'edit-tags.php?taxonomy=allotment_type&post_type=allotment',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Allotment Seasons', 
			'Allotment Seasons', 
			'manage_options', 
			'edit-tags.php?taxonomy=allotment_season&post_type=allotment',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Beds', 
			'Beds', 
			'manage_options', 
			'edit.php?post_type=bed',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Bed Types', 
			'Bed Types', 
			'manage_options', 
			'edit-tags.php?taxonomy=bed_type&post_type=bed',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Bed Soils', 
			'Bed Soils', 
			'manage_options', 
			'edit-tags.php?taxonomy=bed_soil&post_type=bed',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Planting Plans', 
			'Planting Plans', 
			'manage_options', 
			'edit.php?post_type=planting_plan',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Planting Plan Types', 
			'Planting Plan Types', 
			'manage_options', 
			'edit-tags.php?taxonomy=planting_plan_type&post_type=planting_plan',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Planting Plan Soils', 
			'Planting Plan Soils', 
			'manage_options', 
			'edit-tags.php?taxonomy=planting_plan_soil&post_type=planting_plan',
            '',
            null
		);
		add_submenu_page(
			'threedgarden', 
			'Options', 
			'Options', 
			'manage_options', 
			__FILE__.'/custom', 
			array($this, 'RenderPageCustom'),
			'',
			null
		);
		add_submenu_page(
			'threedgarden', 
			'About', 
			'About', 
			'manage_options', 
			__FILE__.'/about', 
			array($this, 'RenderPageAbout'),
			'',
			null
		);
								  
	}

	/**
     * set current menu based on url
     */
    public function set_current_menu( $parent_file ) {
		global $submenu_file, $current_screen, $pagenow;
		
        if ( $pagenow == 'edit-tags.php' ) {
            if ( isset( $_GET['taxonomy'] ) ) {
				if ( $_GET['taxonomy'] == 'plant_type' || 
					 $_GET['taxonomy'] == 'plant_season' || 
					 $_GET['taxonomy'] == 'allotment_type' || 
					 $_GET['taxonomy'] == 'allotment_season' || 
					 $_GET['taxonomy'] == 'bed_type' || 
					 $_GET['taxonomy'] == 'bed_soil' || 
					 $_GET['taxonomy'] == 'planting_plan_type' || 
					 $_GET['taxonomy'] == 'planting_plan_soil') {
                    $submenu_file = 'edit-tags.php?taxonomy=' . $_GET['taxonomy'] . '&post_type=' . $current_screen->post_type;
                    $parent_file = 'threedgarden';
                }
            
            }
        }
        if ( $pagenow == 'post-new.php' ) {
            if ( isset( $_GET['post_type'] ) ) {
				if ( $_GET['post_type'] == 'plant' || 
					 $_GET['post_type'] == 'allotment' || 
					 $_GET['post_type'] == 'bed' || 
					 $_GET['post_type'] == 'planting_plan' ) {
                    $submenu_file = 'edit.php?post_type=' . $current_screen->post_type;
                    $parent_file = 'threedgarden';
                }
            
            }
        }
        return $parent_file;
    }

	/**
     * output welcome page
     */
	public function RenderPage(){
		// check if user is allowed access
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
	?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<h2>Welcome to your WP 3D Garden</h2>
		</div>
	<?php
	}
	
	/**
     * output custom page
     */
	public function RenderPageCustom(){
		// check if user is allowed access
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<h2>Custom Options</h2>
			<form action="options.php" method="post">
				<?php
				// output security fields
				settings_fields( 'threedgarden_options' );
				
				// output setting sections
				do_settings_sections( 'threedgarden' );
				
				// submit button
				submit_button();
				?>
			</form>
		</div>
		<?php
	}
	
	/**
     * output about page
     */
	public function RenderPageAbout(){
		// check if user is allowed access
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class='wrap'>
			<h2>ABOUT PAGE</h2>
		</div>
		<?php
	}


}
