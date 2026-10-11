<?php
/**
 * The template for displaying all single posts.
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
				<div class="entry-meta">
					<?php aceppe_posted_on(); ?>
				</div>
			</header>

			<?php aceppe_post_thumbnail(); ?>

			<div class="entry-content">
				<?php
				the_content(
					sprintf(
						/* translators: %s: post title */
						esc_html__( 'Continue reading %s', 'aceppe' ),
						the_title( '<span class="screen-reader-text">"', '"</span>', false )
					)
				);

				wp_link_pages(
					array(
						'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'aceppe' ),
						'after'  => '</div>',
					)
				);
				?>
			</div>

			<footer class="entry-footer">
				<?php
				$aceppe_cats = get_the_category_list( ', ' );
				if ( $aceppe_cats ) {
					printf(
						/* translators: %s: category list */
						'<span class="cat-links">' . esc_html__( 'Posted in %s', 'aceppe' ) . '</span>',
						$aceppe_cats // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					);
				}
				$aceppe_tags = get_the_tag_list( '', ', ' );
				if ( $aceppe_tags ) {
					printf(
						/* translators: %s: tag list */
						'<span class="tags-links">' . esc_html__( 'Tagged %s', 'aceppe' ) . '</span>',
						$aceppe_tags // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					);
				}
				?>
			</footer>
		</article>
		<?php

		the_post_navigation(
			array(
				'prev_text' => '<span class="nav-subtitle">' . esc_html__( 'Previous:', 'aceppe' ) . '</span> <span class="nav-title">%title</span>',
				'next_text' => '<span class="nav-subtitle">' . esc_html__( 'Next:', 'aceppe' ) . '</span> <span class="nav-title">%title</span>',
			)
		);

		if ( comments_open() || get_comments_number() ) {
			comments_template();
		}

	endwhile;
	?>
</main><!-- #primary -->

<?php
get_sidebar();
get_footer();
