<?php
/**
 * The theme footer.
 *
 * @package Aceppe
 */

?>
	</div><!-- #content -->

	<footer id="colophon" class="site-footer">
		<?php if ( is_active_sidebar( 'footer-1' ) || is_active_sidebar( 'footer-2' ) || is_active_sidebar( 'footer-3' ) ) : ?>
		<div class="wrap">
			<div class="footer-widgets">
				<?php
				for ( $i = 1; $i <= 3; $i++ ) {
					if ( is_active_sidebar( 'footer-' . $i ) ) {
						echo '<div class="footer-widget-area">';
						dynamic_sidebar( 'footer-' . $i );
						echo '</div>';
					}
				}
				?>
			</div>
		</div>
		<?php endif; ?>
		<div class="site-info">
			<div class="wrap">
				<?php
				printf(
					/* translators: 1: year, 2: site name with link */
					esc_html__( 'Copyright © %1$s %2$s. All rights reserved.', 'aceppe' ),
					esc_html( gmdate( 'Y' ) ),
					'<a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html( get_bloginfo( 'name' ) ) . '</a>'
				);
				?>
				<span class="sep"> | </span>
				<?php
				printf(
					/* translators: %s: theme name */
					esc_html__( 'Powered by the %s theme.', 'aceppe' ),
					'<a href="https://www.aceppe.com/">' . esc_html__( 'Aceppe', 'aceppe' ) . '</a>'
				);
				?>
			</div>
		</div><!-- .site-info -->
	</footer><!-- #colophon -->
</div><!-- #page -->

<?php wp_footer(); ?>
</body>
</html>
