<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://garden.university
 * @since      0.0.1
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
	 * @since    0.0.1
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    0.0.1
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    0.0.1
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
	 * @since    0.0.1
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

		// load css & js with bundler
		// wp_enqueue_style(
		// 	'vue-cli-css-vendors',
		// 	plugins_url( '/dist/css/chunk-vendors.css', __FILE__ ),
		// 	[],
		// 	$this->version
		// );
		// wp_enqueue_style(
		// 	'vue-cli-css-app',
		// 	plugins_url( '/dist/css/app.css', __FILE__ ),
		// 	[],
		// 	$this->version
		// );

		wp_enqueue_style(
			'threedgarden-vite',
			plugins_url( '/dist/assets/style.css', __FILE__ ),
			[],
			$this->version,
			'all'
		);

	}

	/**
	 * Register the JavaScript for the public-facing side of the site.
	 *
	 * @since    0.0.1
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
		// global $pagenow;
		global $template;

		//echo "MARTY MARTY MARTY: ";
		// echo $pagenow;
		// echo get_page_template();
    	//echo basename($template);

		$templatenow = basename($template);
		
        // if ( $pagenow == 'single-scene.php' || $pagenow == 'single-allotment.php' 
		//   || $pagenow == 'single-bed.php' || $pagenow == 'single-plant.php'
		//   || $pagenow == 'single-planting_plan.php' )
        // {
		// if ( is_page_template( 'templates/single-scene.php' ) ) {
		if ( $templatenow == 'single-scene.php' || $templatenow == 'single-allotment.php' 
		  || $templatenow == 'single-bed.php' || $templatenow == 'single-plant.php'
		  || $templatenow == 'single-planting_plan.php' )
        {
				
			// THREED GARDEN WORDPRESS API REST CONNECTIONS :)
			// wp_localize_script( 
			// 	$this->plugin_name, 
			// 	'postdata',
			// 	array(
			// 		'plugin_name' => $this->plugin_name,
			// 		'plugin_version' => $this->version,
			// 		'plugin_url' => plugin_dir_url(__DIR__), //__FILE__
			// 		'theme_uri' => get_stylesheet_directory_uri(),
			// 		'rest_url' => rest_url('wp/v2/'),
			// 		'world_id' => 1
			// 	)
			// );
			$plugin_vars = array(
				'plugin_name' => $this->plugin_name,
				'plugin_version' => $this->version,
				'plugin_url' => plugin_dir_url(__DIR__), //__FILE__
				'theme_uri' => get_stylesheet_directory_uri(),
				'rest_url' => rest_url('wp/v2/'),
				'world_id' => 1
			);
			wp_register_script( $this->plugin_name . '-dummy', '' );
			wp_enqueue_script( $this->plugin_name . '-dummy' );
			wp_add_inline_script( $this->plugin_name . '-dummy', 'postdata = '. json_encode($plugin_vars) . ';' );

			// WEBGL
			// wp_enqueue_script( 'detector', plugin_dir_url( __FILE__ ) . 'js/Detector.js', array(), $this->version, true );

			// DAT.GUI
			// wp_enqueue_script( 'datgui', plugin_dir_url( __FILE__ ) . 'js/dat.gui.min.js', array(), $this->version, true );
			
			// THREE JS
			// wp_enqueue_script( 'threejs', plugin_dir_url( __FILE__ ) . 'js/three.js', array(), $this->version, true );
			// wp_enqueue_script( 'fbxloader', plugin_dir_url( __FILE__ ) . 'js/FBXLoader.js', array(), $this->version, true );
			// wp_enqueue_script( 'gltfloader', plugin_dir_url( __FILE__ ) . 'js/GLTFLoader.js', array(), $this->version, true );
			// wp_enqueue_script( 'objloader', plugin_dir_url( __FILE__ ) . 'js/OBJLoader.js', array(), $this->version, true );
			// wp_enqueue_script( 'orbitcontrols', plugin_dir_url( __FILE__ ) . 'js/OrbitControls.js', array(), $this->version, true );
			// wp_enqueue_script( 'css3drenderer', plugin_dir_url( __FILE__ ) . 'js/CSS3DRenderer.js', array(), $this->version, true );
			// wp_enqueue_script( 'panolens', plugin_dir_url( __FILE__ ) . 'js/panolens.min.js', array(), $this->version, true );

			// wp_enqueue_script( 'inflate', plugin_dir_url( __FILE__ ) . 'js/inflate.min.js', array(), $this->version, true );

			wp_enqueue_script( 'toon3d', plugin_dir_url( __FILE__ ) . 'js/toon3d.js', array(), $this->version, true );


			// THREE.TREE JS
			// wp_enqueue_script( 'tree', plugin_dir_url( __FILE__ ) . 'js/Tree.js', array(), $this->version, true );
			// wp_enqueue_script( 'treegeometry', plugin_dir_url( __FILE__ ) . 'js/TreeGeometry.js', array(), $this->version, true );
			// wp_enqueue_script( 'treehelper', plugin_dir_url( __FILE__ ) . 'js/TreeHelper.js', array(), $this->version, true );

			// TWEEN JS
			//wp_enqueue_script( 'tweenjs', plugin_dir_url( __FILE__ ) . 'js/tween.umd.js', array(), $this->version, true );

			// THREED GARDEN PUBLIC JS
			//wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/threed-garden-public.js', array( 'jquery' ), $this->version, true );

			// VUE 3
			wp_enqueue_script( 'vue', 'https://unpkg.com/vue@3.2.26/dist/vue.global.prod.js', array(), null, true );
			// OR wp_enqueue_script( 'vue', 'https://unpkg.com/vue@next', array(), null, true );

			// load css & js with bundler
			// wp_enqueue_script(
			// 	'vue-cli-js-vendors',
			// 	plugins_url( '/dist/js/chunk-vendors.js', __FILE__ ),
			// 	[],
			// 	$this->version,
			// 	true
			// );

			// wp_enqueue_script(
			// 	'vue-cli-js-app',
			// 	plugins_url( '/dist/js/app.js', __FILE__ ),
			// 	[],
			// 	$this->version,
			// 	true
			// );

			wp_enqueue_script(
				'threedgarden-vite',
				plugins_url( '/dist/assets/index.js', __FILE__ ),
				[],
				$this->version,
				true
			);
			
			// Enqueue javascript with type="module" - Stack Overflow: 
			// https://stackoverflow.com/questions/58931144/enqueue-javascript-with-type-module
			add_filter('script_loader_tag', 'add_type_attribute', 10, 3);

		}
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
