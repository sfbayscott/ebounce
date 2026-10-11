<?php
/**
 * Aceppe Theme Customizer.
 *
 * @package Aceppe
 */

/**
 * Add customizer settings and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer manager instance.
 */
function aceppe_customize_register( $wp_customize ) {

	$wp_customize->add_section(
		'aceppe_hero',
		array(
			'title'       => esc_html__( 'Front Page Hero', 'aceppe' ),
			'description' => esc_html__( 'Customize the hero section shown on the front page.', 'aceppe' ),
			'priority'    => 30,
		)
	);

	$aceppe_hero_settings = array(
		'aceppe_hero_title'        => array(
			'label'   => esc_html__( 'Hero Title', 'aceppe' ),
			'default' => esc_html__( 'Industrial PPE, Built for Professionals', 'aceppe' ),
			'type'    => 'text',
		),
		'aceppe_hero_text'         => array(
			'label'   => esc_html__( 'Hero Text', 'aceppe' ),
			'default' => esc_html__( 'Safety gloves, respiratory protection and workwear engineered for the toughest job sites.', 'aceppe' ),
			'type'    => 'textarea',
		),
		'aceppe_hero_button_text'  => array(
			'label'   => esc_html__( 'Primary Button Text', 'aceppe' ),
			'default' => esc_html__( 'Our Products', 'aceppe' ),
			'type'    => 'text',
		),
		'aceppe_hero_button_url'   => array(
			'label'   => esc_html__( 'Primary Button URL', 'aceppe' ),
			'default' => home_url( '/' ),
			'type'    => 'url',
		),
		'aceppe_hero_button2_text' => array(
			'label'   => esc_html__( 'Secondary Button Text', 'aceppe' ),
			'default' => esc_html__( 'Contact Us', 'aceppe' ),
			'type'    => 'text',
		),
		'aceppe_hero_button2_url'  => array(
			'label'   => esc_html__( 'Secondary Button URL', 'aceppe' ),
			'default' => home_url( '/' ),
			'type'    => 'url',
		),
	);

	foreach ( $aceppe_hero_settings as $aceppe_id => $aceppe_args ) {
		$wp_customize->add_setting(
			$aceppe_id,
			array(
				'default'           => $aceppe_args['default'],
				'sanitize_callback' => 'url' === $aceppe_args['type'] ? 'esc_url_raw' : 'sanitize_text_field',
				'transport'         => 'refresh',
			)
		);
		$wp_customize->add_control(
			$aceppe_id,
			array(
				'label'   => $aceppe_args['label'],
				'section' => 'aceppe_hero',
				'type'    => $aceppe_args['type'],
			)
		);
	}

	$wp_customize->add_section(
		'aceppe_colors',
		array(
			'title'       => esc_html__( 'Theme Colors', 'aceppe' ),
			'description' => esc_html__( 'Customize the theme accent color.', 'aceppe' ),
			'priority'    => 40,
		)
	);

	$wp_customize->add_setting(
		'aceppe_primary_color',
		array(
			'default'           => '#c0392b',
			'sanitize_callback' => 'sanitize_hex_color',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'aceppe_primary_color',
			array(
				'label'   => esc_html__( 'Primary Color', 'aceppe' ),
				'section' => 'aceppe_colors',
			)
		)
	);
}
add_action( 'customize_register', 'aceppe_customize_register' );

/**
 * Output customizer CSS in the head.
 */
function aceppe_customizer_css() {
	$aceppe_color = get_theme_mod( 'aceppe_primary_color', '#c0392b' );
	if ( '#c0392b' === strtolower( $aceppe_color ) ) {
		return;
	}
	$aceppe_color = sanitize_hex_color( $aceppe_color );
	if ( ! $aceppe_color ) {
		return;
	}
	?>
	<style id="aceppe-customizer-css">
		a,.main-navigation a:hover{color:<?php echo esc_html( $aceppe_color ); ?>}
		.main-navigation a:hover,.hero .btn,.more-link,.comment-form input[type=submit],.search-form input[type=submit],.pagination .page-numbers.current,.pagination .page-numbers:hover{background-color:<?php echo esc_html( $aceppe_color ); ?>}
		.widget-title,.feature{border-color:<?php echo esc_html( $aceppe_color ); ?>}
		blockquote{border-left-color:<?php echo esc_html( $aceppe_color ); ?>}
	</style>
	<?php
}
add_action( 'wp_head', 'aceppe_customizer_css' );
