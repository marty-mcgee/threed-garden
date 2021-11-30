<?php
/*
Template Name: 3D Garden Scene
Template Post Type: scene
*/

get_header();
?>

<main id="site-content" role="main">

	<!-- scene title -->
	<h1><a href="<?php get_permalink(); ?>">ThreeD Garden: Scene</a></h1>

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

