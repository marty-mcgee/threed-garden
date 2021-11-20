<?php
/*
Plugin Name: Quotes Manager
Plugin URI: 
Description: Quotes Manager
Author: Quotes Manager
Version: 1.0
Author URI: 
*/

add_action( 'admin_menu', function () {
	add_menu_page(
		'Quotes Manager',
		'QManager',
		'manage_options',
		'qmanager',
		function () {
			echo '<div id="qmanager">hello</div>';
		}
	);
} );

add_action( 'admin_enqueue_scripts', function ($hook) {
  
	if ( $hook !== 'toplevel_page_qmanager' ) {
		return;
	}

	// load css & js with bundler
	wp_enqueue_style(
		'vue-cli-css-vendors',
		plugins_url( '/frontend/dist/css/chunk-vendors.css', __FILE__ ),
		[],
		'0.1.0'
	);

	wp_enqueue_style(
		'vue-cli-css',
		plugins_url( '/frontend/dist/css/app.css', __FILE__ ),
		[],
		'0.1.0'
	);

	wp_enqueue_script(
		'vue-cli-vendors',
		plugins_url( '/frontend/dist/js/chunk-vendors.js', __FILE__ ),
		[],
		'0.1.0',
		true
	);

	wp_enqueue_script(
		'vue-cli-app',
		plugins_url( '/frontend/dist/js/app.js', __FILE__ ),
		[],
		'0.1.0',
		true
	);
} );
