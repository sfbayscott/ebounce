<?php
/**
 * WooCommerce compatibility for the Aceppe theme.
 *
 * Declares WooCommerce support and adds a product search form.
 * Loaded only when WooCommerce is active (see functions.php).
 *
 * @package Aceppe
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Declare WooCommerce support with gallery features.
 */
function aceppe_woocommerce_setup() {
	add_theme_support(
		'woocommerce',
		array(
			'thumbnail_image_width' => 300,
			'single_image_width'    => 600,
			'product_grid'          => array(
				'default_rows'    => 3,
				'min_rows'        => 1,
				'max_rows'        => 8,
				'default_columns' => 3,
				'min_columns'     => 2,
				'max_columns'     => 4,
			),
		)
	);
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );
}
add_action( 'after_setup_theme', 'aceppe_woocommerce_setup' );

/**
 * Wrap WooCommerce content with the theme layout.
 */
function aceppe_woocommerce_wrapper_start() {
	echo '<main id="primary" class="content-area"><div class="post">';
}
add_action( 'woocommerce_before_main_content', 'aceppe_woocommerce_wrapper_start', 5 );

function aceppe_woocommerce_wrapper_end() {
	echo '</div></main>';
}
add_action( 'woocommerce_after_main_content', 'aceppe_woocommerce_wrapper_end', 5 );

/**
 * Remove default WooCommerce sidebar; use the theme sidebar instead.
 */
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );
