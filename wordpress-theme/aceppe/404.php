<?php
/**
 * The template for displaying 404 pages (not found).
 *
 * @package Aceppe
 */

get_header();
?>

<main id="primary" class="content-area">
	<section class="error-404 not-found">
		<header class="page-header">
			<h1 class="page-title"><?php esc_html_e( 'Oops! That page cannot be found.', 'aceppe' ); ?></h1>
		</header>

		<div class="page-content">
			<p><?php esc_html_e( 'It looks like nothing was found at this location. Maybe try a search or one of the links below?', 'aceppe' ); ?></p>

			<?php get_search_form(); ?>

			<h2><?php esc_html_e( 'Recent Posts', 'aceppe' ); ?></h2>
			<ul>
				<?php
				wp_get_archives(
					array(
						'type'  => 'postbypost',
						'limit' => 5,
					)
				);
				?>
			</ul>
		</div>
	</section>
</main><!-- #primary -->

<?php
get_footer();
