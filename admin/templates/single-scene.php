<?php
/*
Template Name: ThreeD Garden Scene
Template Post Type: scene
*/

get_header();

//$manifest = json_decode(file_get_contents('/wp-content/plugins/threed-garden/public/dist/manifest.json'), true);
?>
<!-- 
<script type="module" crossorigin src="/wp-content/plugins/threed-garden/public/dist/<?=$manifest['index.html']['file']?>"></script>
<link rel="stylesheet" href="/wp-content/plugins/threed-garden/public/dist/<?=$manifest['index.html']['css'][0]?>"> 
-->


<main id="site-content" role="main">

	<!-- scene title -->
	<h1><a href="<?php get_permalink(); ?>">ThreeD Garden: Scene -- <?php the_title(); ?></a></h1>

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

