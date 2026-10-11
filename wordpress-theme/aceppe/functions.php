<?php
/**
 * Aceppe functions and definitions.
 *
 * @package Aceppe
 */

if ( ! defined( 'ACEPPE_VERSION' ) ) {
	define( 'ACEPPE_VERSION', '1.0.0' );
}

/**
 * Theme setup.
 */
function aceppe_setup() {
	load_theme_textdomain( 'aceppe', get_template_directory() . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 80,
			'width'       => 240,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);
	add_theme_support( 'customize-selective-refresh-widgets' );
	add_theme_support( 'responsive-embeds' );

	register_nav_menus(
		array(
			'primary' => esc_html__( 'Primary Menu', 'aceppe' ),
		)
	);
}
add_action( 'after_setup_theme', 'aceppe_setup' );

/**
 * Set the content width.
 */
function aceppe_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'aceppe_content_width', 720 );
}
add_action( 'after_setup_theme', 'aceppe_content_width', 0 );

/**
 * Register widget areas.
 */
function aceppe_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Sidebar', 'aceppe' ),
			'id'            => 'sidebar-1',
			'description'   => esc_html__( 'Add widgets here.', 'aceppe' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
	for ( $i = 1; $i <= 3; $i++ ) {
		register_sidebar(
			array(
				'name'          => sprintf( esc_html__( 'Footer %d', 'aceppe' ), $i ),
				'id'            => 'footer-' . $i,
				'description'   => esc_html__( 'Add footer widgets here.', 'aceppe' ),
				'before_widget' => '<section id="%1$s" class="widget %2$s">',
				'after_widget'  => '</section>',
				'before_title'  => '<h2 class="widget-title">',
				'after_title'   => '</h2>',
			)
		);
	}
}
add_action( 'widgets_init', 'aceppe_widgets_init' );

/**
 * Enqueue scripts and styles.
 */
function aceppe_scripts() {
	wp_enqueue_style( 'aceppe-style', get_stylesheet_uri(), array(), ACEPPE_VERSION );
	wp_style_add_data( 'aceppe-style', 'rtl', 'replace' );

	wp_enqueue_script(
		'aceppe-navigation',
		get_template_directory_uri() . '/js/navigation.js',
		array(),
		ACEPPE_VERSION,
		true
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'aceppe_scripts' );

/**
 * Fallback menu when no menu is assigned.
 */
function aceppe_fallback_menu() {
	echo '<ul id="primary-menu">';
	echo '<li><a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Home', 'aceppe' ) . '</a></li>';
	wp_list_pages(
		array(
			'title_li' => '',
			'depth'    => 1,
			'number'   => 5,
		)
	);
	echo '</ul>';
}

/**
 * Prints HTML with meta information for the current post-date/time.
 */
function aceppe_posted_on() {
	$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
	$time_string = sprintf(
		$time_string,
		esc_attr( get_the_date( DATE_W3C ) ),
		esc_html( get_the_date() )
	);

	$posted_on = sprintf(
		/* translators: %s: post date */
		esc_html_x( 'Posted on %s', 'post date', 'aceppe' ),
		'<a href="' . esc_url( get_permalink() ) . '" rel="bookmark">' . $time_string . '</a>'
	);

	$byline = sprintf(
		/* translators: %s: post author */
		esc_html_x( 'by %s', 'post author', 'aceppe' ),
		'<span class="author vcard"><a class="url fn n" href="' . esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) . '">' . esc_html( get_the_author() ) . '</a></span>'
	);

	echo '<span class="posted-on">' . $posted_on . '</span><span class="byline"> ' . $byline . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * Displays the post thumbnail.
 */
function aceppe_post_thumbnail() {
	if ( post_password_required() || is_attachment() || ! has_post_thumbnail() ) {
		return;
	}

	if ( is_singular() ) :
		?>
		<div class="post-thumbnail">
			<?php the_post_thumbnail(); ?>
		</div>
		<?php
	else :
		?>
		<a class="post-thumbnail" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
			<?php
			the_post_thumbnail(
				'post-thumbnail',
				array(
					'alt' => the_title_attribute(
						array(
							'echo' => false,
						)
					),
				)
			);
			?>
		</a>
		<?php
	endif;
}

/**
 * Load the customizer.
 */
require get_template_directory() . '/inc/customizer.php';

/**
 * Load WooCommerce compatibility (only if WooCommerce is active).
 */
if ( class_exists( 'WooCommerce' ) ) {
	require get_template_directory() . '/inc/woocommerce.php';
}
