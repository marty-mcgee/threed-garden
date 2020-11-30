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
	 * **********************************************************************************************
	 */

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

		// THREE JS -- DAT GUI CSS
		wp_enqueue_style( 'datgui', plugin_dir_url( __FILE__ ) . 'css/dat.gui.css', array(), $this->version, 'all' );
		
		// THREED GARDEN ADMIN CSS
		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/threed-garden-admin.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {

		/**
		 * An instance of this class should be passed to the run() function
		 * defined in ThreeD_Garden_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The ThreeD_Garden_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this class.
		 */

		// THREE JS
		wp_enqueue_script( 'threejs', plugin_dir_url( __FILE__ ) . 'js/three.min.js', array(), $this->version, false );
		wp_enqueue_script( 'datgui', plugin_dir_url( __FILE__ ) . 'js/dat.gui.min.js', array(), $this->version, false );
		wp_enqueue_script( 'orbitcontrols', plugin_dir_url( __FILE__ ) . 'js/OrbitControls.js', array(), $this->version, false );
		//wp_enqueue_script( 'panolens', plugin_dir_url( __FILE__ ) . 'js/panolens.min.js', array(), $this->version, false );

		// TWEEN JS
		wp_enqueue_script( 'tweenjs', plugin_dir_url( __FILE__ ) . 'js/tween.umd.js', array(), $this->version, false );

		// THREED GARDEN ADMIN JS
		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/threed-garden-admin.js', array( 'jquery' ), $this->version, false );
		//wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/threed-garden-admin-2.js', array( 'jquery' ), $this->version, false );

		wp_localize_script( $this->plugin_name, 'postdata',
			array(
				'plugin_name' => $this->plugin_name,
				'plugin_version' => $this->version,
				'plugin_url' => plugin_dir_url(__FILE__),
				'theme_uri' => get_stylesheet_directory_uri(),
				'rest_url' => rest_url('wp/v2/'),
			)
		);
	}

	/**
	 * **********************************************************************************************
	 */

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
	 * **********************************************************************************************
	 */

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
			<div id="webgl"></div>

			<div style="display: none;">
				<canvas id="infospot" width="64" height="64"></canvas>
				<div class="annotation">
					<p><strong>Cube</strong></p>
					<p>In geometry, a cube is a three-dimensional solid object bounded by six square faces, facets or sides, with three meeting at each vertex.</p>
				</div>
			</div>
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
			<?php settings_errors(); ?>
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
			<div class="annotation">
				<p><strong>Cube</strong></p>
				<p>In geometry, a cube is a three-dimensional solid object bounded by six square faces, facets or sides, with three meeting at each vertex.</p>
			</div>
			<canvas id="number" width="64" height="64"></canvas>
		</div>
		<?php
	}

	/**
	 * **********************************************************************************************
	 */

	/**
	 * Register a post type for "plants"
	 *
	 * @link http://codex.wordpress.org/Function_Reference/register_post_type
	 */
	public function plants_init() {
		$labels = array(
			'name'               => _x( 'Plants', 'post type general name', 'threedgarden' ),
			'singular_name'      => _x( 'Plant', 'post type singular name', 'threedgarden' ),
			'menu_name'          => _x( 'Plants', 'admin menu', 'threedgarden' ),
			'name_admin_bar'     => _x( 'Plant', 'add new on admin bar', 'threedgarden' ),
			'add_new'            => _x( 'Add New', 'plant', 'threedgarden' ),
			'add_new_item'       => __( 'Add New Plant', 'threedgarden' ),
			'new_item'           => __( 'New Plant', 'threedgarden' ),
			'edit_item'          => __( 'Edit Plant', 'threedgarden' ),
			'view_item'          => __( 'View Plant', 'threedgarden' ),
			'all_items'          => __( 'All Plants', 'threedgarden' ),
			'search_items'       => __( 'Search Plants', 'threedgarden' ),
			'parent_item_colon'  => __( 'Parent Plants:', 'threedgarden' ),
			'not_found'          => __( 'No plants found.', 'threedgarden' ),
			'not_found_in_trash' => __( 'No plants found in Trash.', 'threedgarden' )
		);

		$args = array(
			'labels'             => $labels,
			'description'        => __( 'Post type for plant notes and information.', 'threedgarden' ),
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => false,
			'query_var'          => true,
			'rewrite'            => array( 'slug' => 'plant' ),
			'capability_type'    => 'post',
			'show_in_rest'       => true,
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => null,
			'supports'           => array( 'title', 'editor', 'author', 'thumbnail', 'excerpt', 'comments' ),
			//'taxonomies'         => array('category', 'post_tag' )
		);

		register_post_type( 'plant', $args );
	}

	/**
	 * Create two taxonomies, Type and Season, for the post type "Plant"
	 */
	public function plant_taxonomies() {
		
		// Add Plant Type taxonomy, make it hierarchical (like categories)
		$labels = array(
			'name'              => _x( 'Plant Types', 'taxonomy general name' ),
			'singular_name'     => _x( 'Plant Type', 'taxonomy singular name' ),
			'search_items'      => __( 'Search Plant Types' ),
			'all_items'         => __( 'All Plant Types' ),
			'parent_item'       => __( 'Parent Plant Type' ),
			'parent_item_colon' => __( 'Parent Plant Type:' ),
			'edit_item'         => __( 'Edit Plant Type' ),
			'update_item'       => __( 'Update Plant Type' ),
			'add_new_item'      => __( 'Add New Plant Type' ),
			'new_item_name'     => __( 'New Plant Type Name' ),
			'menu_name'         => __( 'Plant Types' ),
		);
		$args = array(
			'hierarchical'      => true,
			'labels'            => $labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'show_in_rest'      => true,
			'rewrite'           => array( 'slug' => 'plant_type' ),
		);
		register_taxonomy( 'plant_type', array( 'plant' ), $args );

		// Add Plant Season taxonomy, make it non-hierarchical (like tags)
		$labels = array(
			'name'                       => _x( 'Plant Seasons', 'taxonomy general name' ),
			'singular_name'              => _x( 'Plant Season', 'taxonomy singular name' ),
			'search_items'               => __( 'Search Plant Seasons' ),
			'popular_items'              => __( 'Popular Plant Seasons' ),
			'all_items'                  => __( 'All Plant Seasons' ),
			'parent_item'                => null,
			'parent_item_colon'          => null,
			'edit_item'                  => __( 'Edit Plant Season' ),
			'update_item'                => __( 'Update Plant Season' ),
			'add_new_item'               => __( 'Add New Plant Season' ),
			'new_item_name'              => __( 'New Plant Season Name' ),
			'separate_items_with_commas' => __( 'Separate plant seasons with commas' ),
			'add_or_remove_items'        => __( 'Add or remove plant seasons' ),
			'choose_from_most_used'      => __( 'Choose from the most used plant seasons' ),
			'not_found'                  => __( 'No plant seasons found.' ),
			'menu_name'                  => __( 'Plant Seasons' ),
		);
		$args = array(
			'hierarchical'          => true,
			'labels'                => $labels,
			'show_ui'               => true,
			'show_admin_column'     => true,
			'update_count_callback' => '_update_post_term_count',
			'query_var'             => true,
			'show_in_rest'          => true,
			'rewrite'               => array( 'slug' => 'plant_season' ),
		);
		register_taxonomy( 'plant_season', 'plant', $args );
	}

	/**
	 * Update messages for "plants"
	 *
	 * See /wp-admin/edit-form-advanced.php
	 *
	 * @param array $messages Existing post update messages.
	 *
	 * @return array Amended post update messages with new CPT update messages.
	 */
	public function plant_updated_messages( $messages ) {
		$post             = get_post();
		$post_type        = get_post_type( $post );
		$post_type_object = get_post_type_object( $post_type );

		$messages['plant'] = array(
			0  => '', // Unused. Messages start at index 1.
			1  => __( 'Plant updated.', 'threedgarden' ),
			2  => __( 'Custom field updated.', 'threedgarden' ),
			3  => __( 'Custom field deleted.', 'threedgarden' ),
			4  => __( 'Plant updated.', 'threedgarden' ),
			/* translators: %s: date and time of the revision */
			5  => isset( $_GET['revision'] ) ? sprintf( __( 'Plant restored to revision from %s', 'threedgarden' ), wp_post_revision_title( (int) $_GET['revision'], false ) ) : false,
			6  => __( 'Plant published.', 'threedgarden' ),
			7  => __( 'Plant saved.', 'threedgarden' ),
			8  => __( 'Plant submitted.', 'threedgarden' ),
			9  => sprintf(
				__( 'Plant scheduled for: <strong>%1$s</strong>.', 'threedgarden' ),
				// translators: Publish box date format, see http://php.net/date
				date_i18n( __( 'M j, Y @ G:i', 'threedgarden' ), strtotime( $post->post_date ) )
			),
			10 => __( 'Plant draft updated.', 'threedgarden' )
		);

		if ( $post_type_object->publicly_queryable ) {
			$permalink = get_permalink( $post->ID );

			$view_link = sprintf( ' <a href="%s">%s</a>', esc_url( $permalink ), __( 'View plant', 'threedgarden' ) );
			$messages[ $post_type ][1] .= $view_link;
			$messages[ $post_type ][6] .= $view_link;
			$messages[ $post_type ][9] .= $view_link;

			$preview_permalink = add_query_arg( 'preview', 'true', $permalink );
			$preview_link = sprintf( ' <a target="_blank" href="%s">%s</a>', esc_url( $preview_permalink ), __( 'Preview plant', 'threedgarden' ) );
			$messages[ $post_type ][8]  .= $preview_link;
			$messages[ $post_type ][10] .= $preview_link;
		}

		return $messages;
	}

	/**
	 * Register a post type for "allotments"
	 *
	 * @link http://codex.wordpress.org/Function_Reference/register_post_type
	 */
	public function allotments_init() {
		$labels = array(
			'name'               => _x( 'Allotments', 'post type general name', 'threedgarden' ),
			'singular_name'      => _x( 'Allotment', 'post type singular name', 'threedgarden' ),
			'menu_name'          => _x( 'Allotments', 'admin menu', 'threedgarden' ),
			'name_admin_bar'     => _x( 'Allotment', 'add new on admin bar', 'threedgarden' ),
			'add_new'            => _x( 'Add New', 'allotment', 'threedgarden' ),
			'add_new_item'       => __( 'Add New Allotment', 'threedgarden' ),
			'new_item'           => __( 'New Allotment', 'threedgarden' ),
			'edit_item'          => __( 'Edit Allotment', 'threedgarden' ),
			'view_item'          => __( 'View Allotment', 'threedgarden' ),
			'all_items'          => __( 'All Allotments', 'threedgarden' ),
			'search_items'       => __( 'Search Allotments', 'threedgarden' ),
			'parent_item_colon'  => __( 'Parent Allotments:', 'threedgarden' ),
			'not_found'          => __( 'No allotments found.', 'threedgarden' ),
			'not_found_in_trash' => __( 'No allotments found in Trash.', 'threedgarden' )
		);

		$args = array(
			'labels'             => $labels,
			'description'        => __( 'Post type for allotment notes and information.', 'threedgarden' ),
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => false,
			'query_var'          => true,
			'rewrite'            => array( 'slug' => 'allotment' ),
			'capability_type'    => 'post',
			'show_in_rest'       => true,
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => null,
			'supports'           => array( 'title', 'editor', 'author', 'thumbnail', 'excerpt', 'comments' ),
			//'taxonomies'         => array('category', 'post_tag' )
		);

		register_post_type( 'allotment', $args );
	}

	/**
	 * Create two taxonomies, Type and Season, for the post type "Allotment"
	 */
	public function allotment_taxonomies() {
		
		// Add Allotment Type taxonomy, make it hierarchical (like categories)
		$labels = array(
			'name'              => _x( 'Allotment Types', 'taxonomy general name' ),
			'singular_name'     => _x( 'Allotment Type', 'taxonomy singular name' ),
			'search_items'      => __( 'Search Allotment Types' ),
			'all_items'         => __( 'All Allotment Types' ),
			'parent_item'       => __( 'Parent Allotment Type' ),
			'parent_item_colon' => __( 'Parent Allotment Type:' ),
			'edit_item'         => __( 'Edit Allotment Type' ),
			'update_item'       => __( 'Update Allotment Type' ),
			'add_new_item'      => __( 'Add New Allotment Type' ),
			'new_item_name'     => __( 'New Allotment Type Name' ),
			'menu_name'         => __( 'Allotment Types' ),
		);
		$args = array(
			'hierarchical'      => true,
			'labels'            => $labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'show_in_rest'      => true,
			'rewrite'           => array( 'slug' => 'allotment_type' ),
		);
		register_taxonomy( 'allotment_type', array( 'allotment' ), $args );

		// Add Allotment Season taxonomy, make it non-hierarchical (like tags)
		$labels = array(
			'name'                       => _x( 'Allotment Seasons', 'taxonomy general name' ),
			'singular_name'              => _x( 'Allotment Season', 'taxonomy singular name' ),
			'search_items'               => __( 'Search Allotment Seasons' ),
			'popular_items'              => __( 'Popular Allotment Seasons' ),
			'all_items'                  => __( 'All Allotment Seasons' ),
			'parent_item'                => null,
			'parent_item_colon'          => null,
			'edit_item'                  => __( 'Edit Allotment Season' ),
			'update_item'                => __( 'Update Allotment Season' ),
			'add_new_item'               => __( 'Add New Allotment Season' ),
			'new_item_name'              => __( 'New Allotment Season Name' ),
			'separate_items_with_commas' => __( 'Separate allotment seasons with commas' ),
			'add_or_remove_items'        => __( 'Add or remove allotment seasons' ),
			'choose_from_most_used'      => __( 'Choose from the most used allotment seasons' ),
			'not_found'                  => __( 'No allotment seasons found.' ),
			'menu_name'                  => __( 'Allotment Seasons' ),
		);
		$args = array(
			'hierarchical'          => true,
			'labels'                => $labels,
			'show_ui'               => true,
			'show_admin_column'     => true,
			'update_count_callback' => '_update_post_term_count',
			'query_var'             => true,
			'show_in_rest'          => true,
			'rewrite'               => array( 'slug' => 'allotment_season' ),
		);
		register_taxonomy( 'allotment_season', 'allotment', $args );
	}

	/**
	 * Update messages for "allotments"
	 *
	 * See /wp-admin/edit-form-advanced.php
	 *
	 * @param array $messages Existing post update messages.
	 *
	 * @return array Amended post update messages with new CPT update messages.
	 */
	public function allotment_updated_messages( $messages ) {
		$post             = get_post();
		$post_type        = get_post_type( $post );
		$post_type_object = get_post_type_object( $post_type );

		$messages['allotment'] = array(
			0  => '', // Unused. Messages start at index 1.
			1  => __( 'Allotment updated.', 'threedgarden' ),
			2  => __( 'Custom field updated.', 'threedgarden' ),
			3  => __( 'Custom field deleted.', 'threedgarden' ),
			4  => __( 'Allotment updated.', 'threedgarden' ),
			/* translators: %s: date and time of the revision */
			5  => isset( $_GET['revision'] ) ? sprintf( __( 'Allotment restored to revision from %s', 'threedgarden' ), wp_post_revision_title( (int) $_GET['revision'], false ) ) : false,
			6  => __( 'Allotment published.', 'threedgarden' ),
			7  => __( 'Allotment saved.', 'threedgarden' ),
			8  => __( 'Allotment submitted.', 'threedgarden' ),
			9  => sprintf(
				__( 'Allotment scheduled for: <strong>%1$s</strong>.', 'threedgarden' ),
				// translators: Publish box date format, see http://php.net/date
				date_i18n( __( 'M j, Y @ G:i', 'threedgarden' ), strtotime( $post->post_date ) )
			),
			10 => __( 'Allotment draft updated.', 'threedgarden' )
		);

		if ( $post_type_object->publicly_queryable ) {
			$permalink = get_permalink( $post->ID );

			$view_link = sprintf( ' <a href="%s">%s</a>', esc_url( $permalink ), __( 'View allotment', 'threedgarden' ) );
			$messages[ $post_type ][1] .= $view_link;
			$messages[ $post_type ][6] .= $view_link;
			$messages[ $post_type ][9] .= $view_link;

			$preview_permalink = add_query_arg( 'preview', 'true', $permalink );
			$preview_link = sprintf( ' <a target="_blank" href="%s">%s</a>', esc_url( $preview_permalink ), __( 'Preview allotment', 'threedgarden' ) );
			$messages[ $post_type ][8]  .= $preview_link;
			$messages[ $post_type ][10] .= $preview_link;
		}

		return $messages;
	}

	/**
	 * Register a post type for "beds"
	 *
	 * @link http://codex.wordpress.org/Function_Reference/register_post_type
	 */
	public function beds_init() {
		$labels = array(
			'name'               => _x( 'Beds', 'post type general name', 'threedgarden' ),
			'singular_name'      => _x( 'Bed', 'post type singular name', 'threedgarden' ),
			'menu_name'          => _x( 'Beds', 'admin menu', 'threedgarden' ),
			'name_admin_bar'     => _x( 'Bed', 'add new on admin bar', 'threedgarden' ),
			'add_new'            => _x( 'Add New', 'bed', 'threedgarden' ),
			'add_new_item'       => __( 'Add New Bed', 'threedgarden' ),
			'new_item'           => __( 'New Bed', 'threedgarden' ),
			'edit_item'          => __( 'Edit Bed', 'threedgarden' ),
			'view_item'          => __( 'View Bed', 'threedgarden' ),
			'all_items'          => __( 'All Beds', 'threedgarden' ),
			'search_items'       => __( 'Search Beds', 'threedgarden' ),
			'parent_item_colon'  => __( 'Parent Beds:', 'threedgarden' ),
			'not_found'          => __( 'No beds found.', 'threedgarden' ),
			'not_found_in_trash' => __( 'No beds found in Trash.', 'threedgarden' )
		);

		$args = array(
			'labels'             => $labels,
			'description'        => __( 'Post type for bed notes and information.', 'threedgarden' ),
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => false,
			'query_var'          => true,
			'rewrite'            => array( 'slug' => 'bed' ),
			'capability_type'    => 'post',
			'show_in_rest'       => true,
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => null,
			'supports'           => array( 'title', 'editor', 'author', 'thumbnail', 'excerpt', 'comments' ),
			//'taxonomies'         => array('category', 'post_tag' )
		);

		register_post_type( 'bed', $args );
	}

	/**
	 * Create two taxonomies, Type and Soil, for the post type "Bed"
	 */
	public function bed_taxonomies() {
		
		// Add Bed Type taxonomy, make it hierarchical (like categories)
		$labels = array(
			'name'              => _x( 'Bed Types', 'taxonomy general name' ),
			'singular_name'     => _x( 'Bed Type', 'taxonomy singular name' ),
			'search_items'      => __( 'Search Bed Types' ),
			'all_items'         => __( 'All Bed Types' ),
			'parent_item'       => __( 'Parent Bed Type' ),
			'parent_item_colon' => __( 'Parent Bed Type:' ),
			'edit_item'         => __( 'Edit Bed Type' ),
			'update_item'       => __( 'Update Bed Type' ),
			'add_new_item'      => __( 'Add New Bed Type' ),
			'new_item_name'     => __( 'New Bed Type Name' ),
			'menu_name'         => __( 'Bed Types' ),
		);
		$args = array(
			'hierarchical'      => true,
			'labels'            => $labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'show_in_rest'      => true,
			'rewrite'           => array( 'slug' => 'bed_type' ),
		);
		register_taxonomy( 'bed_type', array( 'bed' ), $args );

		// Add Bed Soil taxonomy, make it non-hierarchical (like tags)
		$labels = array(
			'name'                       => _x( 'Bed Soils', 'taxonomy general name' ),
			'singular_name'              => _x( 'Bed Soil', 'taxonomy singular name' ),
			'search_items'               => __( 'Search Bed Soils' ),
			'popular_items'              => __( 'Popular Bed Soils' ),
			'all_items'                  => __( 'All Bed Soils' ),
			'parent_item'                => null,
			'parent_item_colon'          => null,
			'edit_item'                  => __( 'Edit Bed Soil' ),
			'update_item'                => __( 'Update Bed Soil' ),
			'add_new_item'               => __( 'Add New Bed Soil' ),
			'new_item_name'              => __( 'New Bed Soil Name' ),
			'separate_items_with_commas' => __( 'Separate bed soils with commas' ),
			'add_or_remove_items'        => __( 'Add or remove bed soils' ),
			'choose_from_most_used'      => __( 'Choose from the most used bed soils' ),
			'not_found'                  => __( 'No bed soils found.' ),
			'menu_name'                  => __( 'Bed Soils' ),
		);
		$args = array(
			'hierarchical'          => true,
			'labels'                => $labels,
			'show_ui'               => true,
			'show_admin_column'     => true,
			'update_count_callback' => '_update_post_term_count',
			'query_var'             => true,
			'show_in_rest'          => true,
			'rewrite'               => array( 'slug' => 'bed_soil' ),
		);
		register_taxonomy( 'bed_soil', 'bed', $args );
	}

	/**
	 * Update messages for "beds"
	 *
	 * See /wp-admin/edit-form-advanced.php
	 *
	 * @param array $messages Existing post update messages.
	 *
	 * @return array Amended post update messages with new CPT update messages.
	 */
	public function bed_updated_messages( $messages ) {
		$post             = get_post();
		$post_type        = get_post_type( $post );
		$post_type_object = get_post_type_object( $post_type );

		$messages['bed'] = array(
			0  => '', // Unused. Messages start at index 1.
			1  => __( 'Bed updated.', 'threedgarden' ),
			2  => __( 'Custom field updated.', 'threedgarden' ),
			3  => __( 'Custom field deleted.', 'threedgarden' ),
			4  => __( 'Bed updated.', 'threedgarden' ),
			/* translators: %s: date and time of the revision */
			5  => isset( $_GET['revision'] ) ? sprintf( __( 'Bed restored to revision from %s', 'threedgarden' ), wp_post_revision_title( (int) $_GET['revision'], false ) ) : false,
			6  => __( 'Bed published.', 'threedgarden' ),
			7  => __( 'Bed saved.', 'threedgarden' ),
			8  => __( 'Bed submitted.', 'threedgarden' ),
			9  => sprintf(
				__( 'Bed scheduled for: <strong>%1$s</strong>.', 'threedgarden' ),
				// translators: Publish box date format, see http://php.net/date
				date_i18n( __( 'M j, Y @ G:i', 'threedgarden' ), strtotime( $post->post_date ) )
			),
			10 => __( 'Bed draft updated.', 'threedgarden' )
		);

		if ( $post_type_object->publicly_queryable ) {
			$permalink = get_permalink( $post->ID );

			$view_link = sprintf( ' <a href="%s">%s</a>', esc_url( $permalink ), __( 'View bed', 'threedgarden' ) );
			$messages[ $post_type ][1] .= $view_link;
			$messages[ $post_type ][6] .= $view_link;
			$messages[ $post_type ][9] .= $view_link;

			$preview_permalink = add_query_arg( 'preview', 'true', $permalink );
			$preview_link = sprintf( ' <a target="_blank" href="%s">%s</a>', esc_url( $preview_permalink ), __( 'Preview bed', 'threedgarden' ) );
			$messages[ $post_type ][8]  .= $preview_link;
			$messages[ $post_type ][10] .= $preview_link;
		}

		return $messages;
	}

	/**
	 * Register a post type for "planting plans"
	 *
	 * @link http://codex.wordpress.org/Function_Reference/register_post_type
	 */
	public function planting_plans_init() {
		$labels = array(
			'name'               => _x( 'Planting Plans', 'post type general name', 'threedgarden' ),
			'singular_name'      => _x( 'Planting Plan', 'post type singular name', 'threedgarden' ),
			'menu_name'          => _x( 'Planting Plans', 'admin menu', 'threedgarden' ),
			'name_admin_bar'     => _x( 'Planting Plan', 'add new on admin bar', 'threedgarden' ),
			'add_new'            => _x( 'Add New', 'planting_plan', 'threedgarden' ),
			'add_new_item'       => __( 'Add New Planting Plan', 'threedgarden' ),
			'new_item'           => __( 'New Planting Plan', 'threedgarden' ),
			'edit_item'          => __( 'Edit Planting Plan', 'threedgarden' ),
			'view_item'          => __( 'View Planting Plan', 'threedgarden' ),
			'all_items'          => __( 'All Planting Plans', 'threedgarden' ),
			'search_items'       => __( 'Search Planting Plans', 'threedgarden' ),
			'parent_item_colon'  => __( 'Parent Planting Plans:', 'threedgarden' ),
			'not_found'          => __( 'No planting plans found.', 'threedgarden' ),
			'not_found_in_trash' => __( 'No planting plans found in Trash.', 'threedgarden' )
		);

		$args = array(
			'labels'             => $labels,
			'description'        => __( 'Post type for planting plan notes and information.', 'threedgarden' ),
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => false,
			'query_var'          => true,
			'rewrite'            => array( 'slug' => 'planting_plan' ),
			'capability_type'    => 'post',
			'show_in_rest'       => true,
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => null,
			'supports'           => array( 'title', 'editor', 'author', 'thumbnail', 'excerpt', 'comments' ),
			//'taxonomies'         => array('category', 'post_tag' )
		);

		register_post_type( 'planting_plan', $args );
	}

	/**
	 * Create two taxonomies, Type and Soil, for the post type "Planting Plan"
	 */
	public function planting_plan_taxonomies() {
		
		// Add Planting Plan Type taxonomy, make it hierarchical (like categories)
		$labels = array(
			'name'              => _x( 'Planting Plan Types', 'taxonomy general name' ),
			'singular_name'     => _x( 'Planting Plan Type', 'taxonomy singular name' ),
			'search_items'      => __( 'Search Planting Plan Types' ),
			'all_items'         => __( 'All Planting Plan Types' ),
			'parent_item'       => __( 'Parent Planting Plan Type' ),
			'parent_item_colon' => __( 'Parent Planting Plan Type:' ),
			'edit_item'         => __( 'Edit Planting Plan Type' ),
			'update_item'       => __( 'Update Planting Plan Type' ),
			'add_new_item'      => __( 'Add New Planting Plan Type' ),
			'new_item_name'     => __( 'New Planting Plan Type Name' ),
			'menu_name'         => __( 'Planting Plan Types' ),
		);
		$args = array(
			'hierarchical'      => true,
			'labels'            => $labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'show_in_rest'      => true,
			'rewrite'           => array( 'slug' => 'planting_plan_type' ),
		);
		register_taxonomy( 'planting_plan_type', array( 'planting_plan' ), $args );

		// Add Planting Plan Soil taxonomy, make it non-hierarchical (like tags)
		$labels = array(
			'name'                       => _x( 'Planting Plan Soils', 'taxonomy general name' ),
			'singular_name'              => _x( 'Planting Plan Soil', 'taxonomy singular name' ),
			'search_items'               => __( 'Search Planting Plan Soils' ),
			'popular_items'              => __( 'Popular Planting Plan Soils' ),
			'all_items'                  => __( 'All Planting Plan Soils' ),
			'parent_item'                => null,
			'parent_item_colon'          => null,
			'edit_item'                  => __( 'Edit Planting Plan Soil' ),
			'update_item'                => __( 'Update Planting Plan Soil' ),
			'add_new_item'               => __( 'Add New Planting Plan Soil' ),
			'new_item_name'              => __( 'New Planting Plan Soil Name' ),
			'separate_items_with_commas' => __( 'Separate planting plan soils with commas' ),
			'add_or_remove_items'        => __( 'Add or remove planting plan soils' ),
			'choose_from_most_used'      => __( 'Choose from the most used planting plan soils' ),
			'not_found'                  => __( 'No planting plan soils found.' ),
			'menu_name'                  => __( 'Planting Plan Soils' ),
		);
		$args = array(
			'hierarchical'          => true,
			'labels'                => $labels,
			'show_ui'               => true,
			'show_admin_column'     => true,
			'update_count_callback' => '_update_post_term_count',
			'query_var'             => true,
			'show_in_rest'          => true,
			'rewrite'               => array( 'slug' => 'planting_plan_soil' ),
		);
		register_taxonomy( 'planting_plan_soil', 'planting_plan', $args );
	}

	/**
	 * Update messages for "planting plans"
	 *
	 * See /wp-admin/edit-form-advanced.php
	 *
	 * @param array $messages Existing post update messages.
	 *
	 * @return array Amended post update messages with new CPT update messages.
	 */
	public function planting_plan_updated_messages( $messages ) {
		$post             = get_post();
		$post_type        = get_post_type( $post );
		$post_type_object = get_post_type_object( $post_type );

		$messages['planting_plan'] = array(
			0  => '', // Unused. Messages start at index 1.
			1  => __( 'Planting Plan updated.', 'threedgarden' ),
			2  => __( 'Custom field updated.', 'threedgarden' ),
			3  => __( 'Custom field deleted.', 'threedgarden' ),
			4  => __( 'Planting Plan updated.', 'threedgarden' ),
			/* translators: %s: date and time of the revision */
			5  => isset( $_GET['revision'] ) ? sprintf( __( 'Planting Plan restored to revision from %s', 'threedgarden' ), wp_post_revision_title( (int) $_GET['revision'], false ) ) : false,
			6  => __( 'Planting Plan published.', 'threedgarden' ),
			7  => __( 'Planting Plan saved.', 'threedgarden' ),
			8  => __( 'Planting Plan submitted.', 'threedgarden' ),
			9  => sprintf(
				__( 'Planting Plan scheduled for: <strong>%1$s</strong>.', 'threedgarden' ),
				// translators: Publish box date format, see http://php.net/date
				date_i18n( __( 'M j, Y @ G:i', 'threedgarden' ), strtotime( $post->post_date ) )
			),
			10 => __( 'Planting Plan draft updated.', 'threedgarden' )
		);

		if ( $post_type_object->publicly_queryable ) {
			$permalink = get_permalink( $post->ID );

			$view_link = sprintf( ' <a href="%s">%s</a>', esc_url( $permalink ), __( 'View planting plan', 'threedgarden' ) );
			$messages[ $post_type ][1] .= $view_link;
			$messages[ $post_type ][6] .= $view_link;
			$messages[ $post_type ][9] .= $view_link;

			$preview_permalink = add_query_arg( 'preview', 'true', $permalink );
			$preview_link = sprintf( ' <a target="_blank" href="%s">%s</a>', esc_url( $preview_permalink ), __( 'Preview planting plan', 'threedgarden' ) );
			$messages[ $post_type ][8]  .= $preview_link;
			$messages[ $post_type ][10] .= $preview_link;
		}

		return $messages;
	}
	
	/**
	 * TESTING
	 * **********************************************************************************************
	 */

	/** 
	 * register acf fields to Wordpress API
	 * https://support.advancedcustomfields.com/forums/topic/json-rest-api-and-acf/
	 */
	public function acf_to_rest_api($response, $post, $request) {
		if (!function_exists('get_fields')) return $response;

		if (isset($post)) {
			$acf = get_fields($post->id);
			$response->data['acf'] = $acf;
		}
		return $response;
	}

	/**
	 * TESTING
	 * **********************************************************************************************
	 */

	public function create_ACF_meta_in_REST() {
		$postypes_to_exclude = [];//['acf-field-group','acf-field'];
		$extra_postypes_to_include = ["page"];
		$post_types = array_diff(get_post_types(["_builtin" => false], 'names'), $postypes_to_exclude);
	
		array_push($post_types, $extra_postypes_to_include);
	
		foreach ($post_types as $post_type) {
			register_rest_field( 
				$post_type, 
				'ACF', 
				[
					'get_callback'    => 'expose_ACF_fields',
					'schema'          => null,
		   		]
		 );
		}
	
	}
	
	public function expose_ACF_fields( $object ) {
		$ID = $object['id'];
		return get_fields($ID);
	}

	/**
	 * TESTING
	 * **********************************************************************************************
	 */

	public function slug_add_post_data() {
		register_rest_field(
			'bed',
			'bed_width',
			array(
				'get_callback' => 'slug_get_field',
				'update_callback' => 'slug_update_field',
				'schema' => array(
									'description' => 'My special field',
									'type' => 'string',
									'context' => array('view', 'edit')
								)
			)
		);
	}
	 
	public function slug_get_field($post, $field_name, $request) {
		//return get_post_meta($post->id, $field_name);
		$all_custom_fields = get_post_custom();
		$append_output = '<h3>Custom Fields</h3>';
		foreach ( $all_custom_fields as $key => $array ) {
			foreach ( $array as $value ) {
				if ( '_' !== substr( $key, 0, 1 ) ) {
					$append_output .= '<div>' . $key . ' => ' . $value . '</div>';
				}
			}
		}
		return $append_output;
	}
	 
	public function slug_update_field($value, $post, $field_name) {
		if (!$value || !is_string($value)) {
			return;
		}

		return update_post_meta($post->ID, $field_name, strip_tags($value));
	}

	/**
	 * TESTING
	 * **********************************************************************************************
	 */

} // end class
