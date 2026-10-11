<?php
/**
 * The main template file.
 *
 * @package Aceppe
 */

get_header();
?>

<main id="primary" class="content-area">
	<?php
	if ( have_posts() ) :

		if ( is_home() && ! is_front_page() ) :
			?>
			<header class="page-header">
				<h1 class="page-title"><?php single_post_title(); ?></h1>
			</header>
			<?php
		endif;

		while ( have_posts() ) :
			the_post();
			?>
			<article id="post-<?php the_ID(); ?>" <?php post_class( 'post' ); ?>>
				<header class="entry-header">
					<?php the_title( '<h2 class="entry-title"><a href="' . esc_url( get_permalink() ) . '" rel="bookmark">', '</a></h2>' ); ?>
					<div class="entry-meta">
						<?php aceppe_posted_on(); ?>
					</div>
				</header>

				<?php aceppe_post_thumbnail(); ?>

				<div class="entry-content">
					<?php
					the_excerpt();
					?>
					<a class="more-link" href="<?php echo esc_url( get_permalink() ); ?>"><?php esc_html_e( 'Read more', 'aceppe' ); ?></a>
				</div>
			</article>
			<?php
		endwhile;

		the_posts_pagination(
			array(
				'prev_text' => esc_html__( 'Previous', 'aceppe' ),
				'next_text' => esc_html__( 'Next', 'aceppe' ),
			)
		);

	else :
		?>
		<section class="no-results">
			<header class="page-header">
				<h1 class="page-title"><?php esc_html_e( 'Nothing found', 'aceppe' ); ?></h1>
			</header>
			<div class="page-content">
				<p><?php esc_html_e( 'It seems we cannot find what you are looking for. Perhaps searching can help.', 'aceppe' ); ?></p>
				<?php get_search_form(); ?>
			</div>
		</section>
		<?php
	endif;
	?>
</main><!-- #primary -->

<?php
get_sidebar();
get_footer();
