<?php
/**
 * The front page template.
 *
 * @package Aceppe
 */

get_header();

$aceppe_hero_title    = get_theme_mod( 'aceppe_hero_title', __( 'Industrial PPE, Built for Professionals', 'aceppe' ) );
$aceppe_hero_text     = get_theme_mod( 'aceppe_hero_text', __( 'Safety gloves, respiratory protection and workwear engineered for the toughest job sites.', 'aceppe' ) );
$aceppe_hero_btn_txt  = get_theme_mod( 'aceppe_hero_button_text', __( 'Our Products', 'aceppe' ) );
$aceppe_hero_btn_url  = get_theme_mod( 'aceppe_hero_button_url', home_url( '/' ) );
$aceppe_hero_btn2_txt = get_theme_mod( 'aceppe_hero_button2_text', __( 'Contact Us', 'aceppe' ) );
$aceppe_hero_btn2_url = get_theme_mod( 'aceppe_hero_button2_url', home_url( '/' ) );
?>

<section class="hero">
	<div class="wrap">
		<h1><?php echo esc_html( $aceppe_hero_title ); ?></h1>
		<p><?php echo esc_html( $aceppe_hero_text ); ?></p>
		<p>
			<a class="btn" href="<?php echo esc_url( $aceppe_hero_btn_url ); ?>"><?php echo esc_html( $aceppe_hero_btn_txt ); ?></a>
			<a class="btn alt" href="<?php echo esc_url( $aceppe_hero_btn2_url ); ?>"><?php echo esc_html( $aceppe_hero_btn2_txt ); ?></a>
		</p>
	</div>
</section>

<section class="section">
	<div class="wrap">
		<div class="section-title">
			<h2><?php esc_html_e( 'What We Do', 'aceppe' ); ?></h2>
			<p><?php esc_html_e( 'Full-range personal protective equipment for industrial, construction and energy job sites.', 'aceppe' ); ?></p>
		</div>
		<div class="features">
			<div class="feature">
				<span class="icon" aria-hidden="true">🧤</span>
				<h3><?php esc_html_e( 'Safety Gloves', 'aceppe' ); ?></h3>
				<p><?php esc_html_e( 'Cut-resistant, chemical, welding and winter gloves meeting EN 388 and ANSI standards.', 'aceppe' ); ?></p>
			</div>
			<div class="feature">
				<span class="icon" aria-hidden="true">😷</span>
				<h3><?php esc_html_e( 'Respiratory Protection', 'aceppe' ); ?></h3>
				<p><?php esc_html_e( 'Dust masks, half masks and full-face respirators for industrial environments.', 'aceppe' ); ?></p>
			</div>
			<div class="feature">
				<span class="icon" aria-hidden="true">👷</span>
				<h3><?php esc_html_e( 'Safety Apparel', 'aceppe' ); ?></h3>
				<p><?php esc_html_e( 'Hi-vis clothing, workwear and protective garments built to last.', 'aceppe' ); ?></p>
			</div>
			<div class="feature">
				<span class="icon" aria-hidden="true">🏭</span>
				<h3><?php esc_html_e( 'OEM / ODM', 'aceppe' ); ?></h3>
				<p><?php esc_html_e( 'Custom product development and private-label manufacturing for global brands.', 'aceppe' ); ?></p>
			</div>
		</div>
	</div>
</section>

<section class="section alt">
	<div class="wrap">
		<div class="section-title">
			<h2><?php esc_html_e( 'Latest News', 'aceppe' ); ?></h2>
		</div>
		<main id="primary" class="content-area" style="flex:1 1 100%">
			<?php
			$aceppe_latest = new WP_Query(
				array(
					'posts_per_page' => 3,
					'post_status'    => 'publish',
				)
			);
			if ( $aceppe_latest->have_posts() ) :
				while ( $aceppe_latest->have_posts() ) :
					$aceppe_latest->the_post();
					?>
					<article id="post-<?php the_ID(); ?>" <?php post_class( 'post' ); ?>>
						<header class="entry-header">
							<?php the_title( '<h3 class="entry-title"><a href="' . esc_url( get_permalink() ) . '" rel="bookmark">', '</a></h3>' ); ?>
							<div class="entry-meta"><?php aceppe_posted_on(); ?></div>
						</header>
						<div class="entry-content">
							<?php the_excerpt(); ?>
						</div>
					</article>
					<?php
				endwhile;
				wp_reset_postdata();
			else :
				?>
				<p><?php esc_html_e( 'No posts yet. Check back soon!', 'aceppe' ); ?></p>
			<?php endif; ?>
		</main>
	</div>
</section>

<?php
get_footer();
