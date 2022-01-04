<?php
/*
Template Name: ThreeD Garden Scene
Template Post Type: scene
*/

get_header();
?>

<main id="site-content" role="main">

	<!-- scene title -->
	<h1><a href="<?php get_permalink(); ?>">ThreeD Garden: Scene -- <?php the_title(); ?></a></h1>

	<!-- vite -->
	<script>
		(function() {
			const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
			const setting = localStorage.getItem('vueuse-color-scheme') || 'auto'
			if (setting === 'dark' || (prefersDark && setting !== 'light')) {
				console.log("document.documentElement", document.documentElement)
				document.documentElement.classList.toggle('dark', true)
				// document.querySelector("#app").classList.toggle('dark', true)
			}
		})()
	</script>
	<link rel="modulepreload" href="/wp-content/plugins/threed-garden/public/dist/assets/vendor.js">

	<!-- vue app -->
	<div id="app"></div>
	
	<?php

	if ( have_posts() ) {

		while ( have_posts() ) {
			the_post();

			get_template_part( 'template-parts/content', get_post_type() );
		}
	}

	?>

</main><!-- #site-content -->

<?php get_template_part( 'template-parts/footer-menus-widgets' ); ?>

<?php get_footer(); ?>
