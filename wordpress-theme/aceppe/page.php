<?php
/**
 * The template for displaying all pages.
 *
 * @package Aceppe
 */

get_header();
?>

<main id="primary" class="content-area">
	<?php
	while ( have_posts() ) :
		the_post();
		?>
		<article id="post-<?php the_ID(); ?>" <?php post_class( 'post' ); ?>>
			<header class="entry-header">
				<?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>
			</header>

			<?php aceppe_post_thumbnail(); ?>

			<div class="entry-content">
				<?php
				the_content();

				wp_link_pages(
					array(
						'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'aceppe' ),
						'after'  => '</div>',
					)
				);
				?>
			</div>
		</article>
		<?php

		if ( comments_open() || get_comments_number() ) {
			comments_template();
		}

	endwhile;
	?>
</main><!-- #primary -->

<?php
get_sidebar();
get_footer();
