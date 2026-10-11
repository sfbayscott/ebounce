<?php
/**
 * The template for displaying comments.
 *
 * @package Aceppe
 */

if ( post_password_required() ) {
	return;
}
?>

<div id="comments" class="comments-area">
	<?php if ( have_comments() ) : ?>
		<h2 class="comments-title">
			<?php
			$aceppe_comment_count = get_comments_number();
			printf(
				/* translators: %s: comment count */
				esc_html( _nx( '%s thought on &ldquo;%s&rdquo;', '%s thoughts on &ldquo;%s&rdquo;', $aceppe_comment_count, 'comments title', 'aceppe' ) ),
				esc_html( number_format_i18n( $aceppe_comment_count ) ),
				esc_html( get_the_title() )
			);
			?>
		</h2>

		<ol class="comment-list">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'short_ping'  => true,
					'avatar_size' => 48,
				)
			);
			?>
		</ol>

		<?php
		the_comments_navigation(
			array(
				'prev_text' => esc_html__( 'Older comments', 'aceppe' ),
				'next_text' => esc_html__( 'Newer comments', 'aceppe' ),
			)
		);

		if ( ! comments_open() ) :
			?>
			<p class="no-comments"><?php esc_html_e( 'Comments are closed.', 'aceppe' ); ?></p>
			<?php
		endif;

	endif;

	comment_form();
	?>
</div><!-- #comments -->
