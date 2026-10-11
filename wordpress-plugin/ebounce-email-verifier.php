<?php
/**
 * Plugin Name:       eBounce Email Verifier
 * Plugin URI:        https://ebounce.custmax.com/
 * Description:       Validate email addresses in real time using the eBounce API. Blocks invalid, disposable and role-based addresses on Contact Form 7, WooCommerce and WordPress registration forms. 10,000 free verifications per month.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            eBounce
 * Author URI:        https://www.aceppe.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ebounce-email-verifier
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'EBOUNCE_API_BASE', 'https://ebounce.custmax.com' );
define( 'EBOUNCE_OPTION_KEY', 'ebounce_settings' );
define( 'EBOUNCE_CACHE_TTL', DAY_IN_SECONDS );

/**
 * Get plugin settings with defaults.
 *
 * @return array
 */
function ebounce_get_settings() {
	$defaults = array(
		'api_key' => '',
		'enabled' => '1',
	);
	$settings = get_option( EBOUNCE_OPTION_KEY, array() );
	return wp_parse_args( is_array( $settings ) ? $settings : array(), $defaults );
}

/**
 * Is the plugin enabled and configured?
 *
 * @return bool
 */
function ebounce_is_active() {
	$settings = ebounce_get_settings();
	return '1' === $settings['enabled'] && '' !== trim( $settings['api_key'] );
}

/**
 * Verify a single email address via the eBounce API.
 *
 * Returns array: [ 'valid' => bool, 'reason' => string, 'cached' => bool ].
 * Fail-open: any API/network failure returns valid=true and logs the incident.
 *
 * @param string $email Email address to verify.
 * @return array
 */
function ebounce_verify_email( $email ) {
	$email = strtolower( trim( $email ) );

	if ( ! is_email( $email ) ) {
		return array( 'valid' => false, 'reason' => 'bad-syntax', 'cached' => false );
	}

	$cache_key = 'ebounce_' . md5( $email );
	$cached    = get_transient( $cache_key );
	if ( false !== $cached && is_array( $cached ) && isset( $cached['valid'] ) ) {
		$cached['cached'] = true;
		return $cached;
	}

	$settings = ebounce_get_settings();
	$url      = add_query_arg( 'email', rawurlencode( $email ), EBOUNCE_API_BASE . '/api/check' );

	$response = wp_remote_get(
		$url,
		array(
			'timeout' => 8,
			'headers' => array(
				'X-API-Key'  => trim( $settings['api_key'] ),
				'User-Agent' => 'eBounce-WP-Plugin/1.0.0',
			),
		)
	);

	// Fail open: network error -> allow, log it.
	if ( is_wp_error( $response ) ) {
		error_log( '[eBounce] API unreachable for ' . $email . ': ' . $response->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return array( 'valid' => true, 'reason' => 'api-unreachable', 'cached' => false );
	}

	$code = (int) wp_remote_retrieve_response_code( $response );

	// Fail open: quota exceeded (402) or server errors -> allow, log it.
	if ( 402 === $code ) {
		error_log( '[eBounce] Quota exceeded while verifying ' . $email ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return array( 'valid' => true, 'reason' => 'quota-exceeded', 'cached' => false );
	}
	if ( $code < 200 || $code >= 300 ) {
		error_log( '[eBounce] API error ' . $code . ' for ' . $email ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return array( 'valid' => true, 'reason' => 'api-error-' . $code, 'cached' => false );
	}

	$body = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( ! is_array( $body ) || empty( $body['ok'] ) || ! isset( $body['result']['verdict'] ) ) {
		error_log( '[eBounce] Malformed API response for ' . $email ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return array( 'valid' => true, 'reason' => 'bad-response', 'cached' => false );
	}

	$verdict = $body['result']['verdict'];
	$reason  = isset( $body['result']['reason'] ) ? $body['result']['reason'] : $verdict;
	$result  = array(
		'valid'  => 'pass' === $verdict,
		'reason' => $reason,
		'cached' => false,
	);

	// Cache only definitive results; transient failures stay fail-open and uncached.
	set_transient( $cache_key, $result, EBOUNCE_CACHE_TTL );

	return $result;
}

/* --------------------------------------------------------------------------
 * Contact Form 7
 * -------------------------------------------------------------------------- */

/**
 * Validate email fields in Contact Form 7.
 *
 * @param WPCF7_Validation $result Validation result object.
 * @param WPCF7_FormTag   $tag    Form tag being validated.
 * @return WPCF7_Validation
 */
function ebounce_validate_cf7_email( $result, $tag ) {
	if ( ! ebounce_is_active() ) {
		return $result;
	}
	if ( ! class_exists( 'WPCF7_Validation' ) ) {
		return $result;
	}

	$name = $tag->name;
	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- CF7 handles its own nonce.
	$value = isset( $_POST[ $name ] ) ? trim( wp_unslash( $_POST[ $name ] ) ) : '';

	if ( '' === $value ) {
		return $result; // Let CF7 handle required-field errors.
	}

	$check = ebounce_verify_email( $value );
	if ( ! $check['valid'] ) {
		$result->invalidate( $tag, __( 'Please enter a valid email address.', 'ebounce-email-verifier' ) );
	}

	return $result;
}
add_filter( 'wpcf7_validate_email', 'ebounce_validate_cf7_email', 20, 2 );
add_filter( 'wpcf7_validate_email*', 'ebounce_validate_cf7_email', 20, 2 );

/* --------------------------------------------------------------------------
 * WooCommerce checkout
 * -------------------------------------------------------------------------- */

/**
 * Validate billing email during WooCommerce checkout.
 */
function ebounce_validate_woo_checkout() {
	if ( ! ebounce_is_active() || ! function_exists( 'wc_add_notice' ) ) {
		return;
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- WooCommerce handles its own nonce.
	$email = isset( $_POST['billing_email'] ) ? trim( wp_unslash( $_POST['billing_email'] ) ) : '';
	if ( '' === $email ) {
		return; // Let WooCommerce handle required-field errors.
	}
	$check = ebounce_verify_email( $email );
	if ( ! $check['valid'] ) {
		wc_add_notice( __( 'Please enter a valid email address.', 'ebounce-email-verifier' ), 'error' );
	}
}
add_action( 'woocommerce_after_checkout_validation', 'ebounce_validate_woo_checkout', 20 );

/**
 * Validate email during WooCommerce registration.
 *
 * @param WP_Error $errors Registration errors object.
 * @return WP_Error
 */
function ebounce_validate_woo_registration( $errors ) {
	if ( ! ebounce_is_active() || ! is_wp_error( $errors ) ) {
		return $errors;
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- WooCommerce handles its own nonce.
	$email = isset( $_POST['email'] ) ? trim( wp_unslash( $_POST['email'] ) ) : '';
	if ( '' === $email || $errors->get_error_code() ) {
		return $errors;
	}
	$check = ebounce_verify_email( $email );
	if ( ! $check['valid'] ) {
		$errors->add( 'ebounce_invalid_email', __( 'Please enter a valid email address.', 'ebounce-email-verifier' ) );
	}
	return $errors;
}
add_filter( 'woocommerce_registration_errors', 'ebounce_validate_woo_registration', 20 );

/* --------------------------------------------------------------------------
 * Generic WordPress registration
 * -------------------------------------------------------------------------- */

/**
 * Validate email during core WordPress registration.
 *
 * @param WP_Error $errors Registration errors object.
 * @return WP_Error
 */
function ebounce_validate_wp_registration( $errors ) {
	if ( ! ebounce_is_active() || ! is_wp_error( $errors ) ) {
		return $errors;
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- core registration handles its own checks.
	$email = isset( $_POST['user_email'] ) ? trim( wp_unslash( $_POST['user_email'] ) ) : '';
	if ( '' === $email || $errors->get_error_code() ) {
		return $errors;
	}
	$check = ebounce_verify_email( $email );
	if ( ! $check['valid'] ) {
		$errors->add( 'ebounce_invalid_email', __( '<strong>Error</strong>: Please enter a valid email address.', 'ebounce-email-verifier' ) );
	}
	return $errors;
}
add_filter( 'registration_errors', 'ebounce_validate_wp_registration', 20 );

/* --------------------------------------------------------------------------
 * Settings page
 * -------------------------------------------------------------------------- */

/**
 * Register settings.
 */
function ebounce_register_settings() {
	register_setting(
		'ebounce_settings_group',
		EBOUNCE_OPTION_KEY,
		array(
			'type'              => 'array',
			'sanitize_callback' => 'ebounce_sanitize_settings',
			'default'           => array(
				'api_key' => '',
				'enabled' => '1',
			),
		)
	);
}
add_action( 'admin_init', 'ebounce_register_settings' );

/**
 * Sanitize settings input.
 *
 * @param array $input Raw input.
 * @return array
 */
function ebounce_sanitize_settings( $input ) {
	$output = array();
	$output['api_key'] = isset( $input['api_key'] ) ? sanitize_text_field( $input['api_key'] ) : '';
	$output['enabled'] = isset( $input['enabled'] ) && '1' === $input['enabled'] ? '1' : '0';
	return $output;
}

/**
 * Add settings page under Settings menu.
 */
function ebounce_add_settings_page() {
	add_options_page(
		__( 'eBounce Email Verifier', 'ebounce-email-verifier' ),
		__( 'eBounce Verifier', 'ebounce-email-verifier' ),
		'manage_options',
		'ebounce-email-verifier',
		'ebounce_render_settings_page'
	);
}
add_action( 'admin_menu', 'ebounce_add_settings_page' );

/**
 * Render the settings page.
 */
function ebounce_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$settings = ebounce_get_settings();
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'eBounce Email Verifier', 'ebounce-email-verifier' ); ?></h1>
		<p><?php esc_html_e( 'Validate email addresses in real time on your forms. Get a free API key (10,000 verifications/month) at ebounce.custmax.com.', 'ebounce-email-verifier' ); ?></p>
		<form method="post" action="options.php">
			<?php settings_fields( 'ebounce_settings_group' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="ebounce_api_key"><?php esc_html_e( 'API Key', 'ebounce-email-verifier' ); ?></label></th>
					<td>
						<input type="password" id="ebounce_api_key" name="<?php echo esc_attr( EBOUNCE_OPTION_KEY ); ?>[api_key]" value="<?php echo esc_attr( $settings['api_key'] ); ?>" class="regular-text" autocomplete="off" />
						<p class="description"><?php esc_html_e( 'Find your key in the eBounce dashboard after signing up.', 'ebounce-email-verifier' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Enable verification', 'ebounce-email-verifier' ); ?></th>
					<td>
						<label>
							<input type="checkbox" name="<?php echo esc_attr( EBOUNCE_OPTION_KEY ); ?>[enabled]" value="1" <?php checked( '1', $settings['enabled'] ); ?> />
							<?php esc_html_e( 'Verify email addresses on forms', 'ebounce-email-verifier' ); ?>
						</label>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		<hr />
		<h2><?php esc_html_e( 'Connection test', 'ebounce-email-verifier' ); ?></h2>
		<p>
			<a class="button" href="<?php echo esc_url( wp_nonce_url( admin_url( 'options-general.php?page=ebounce-email-verifier&ebounce_test=1' ), 'ebounce_test' ) ); ?>">
				<?php esc_html_e( 'Test API connection', 'ebounce-email-verifier' ); ?>
			</a>
		</p>
		<?php
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce verified below.
		if ( isset( $_GET['ebounce_test'] ) && check_admin_referer( 'ebounce_test' ) ) {
			$test_email = 'test@example.com';
			$start      = microtime( true );
			$check      = ebounce_verify_email( $test_email );
			$elapsed    = round( ( microtime( true ) - $start ) * 1000 );
			$ok         = $check['valid'] || 'quota-exceeded' === $check['reason'] || 'api-unreachable' === $check['reason'];
			// test@example.com has no MX, so a healthy API returns valid=false/reason=no-mx.
			if ( 'no-mx' === $check['reason'] || 'bad-syntax' === $check['reason'] ) {
				echo '<div class="notice notice-success"><p>' . esc_html__( 'Connection OK — API responded correctly.', 'ebounce-email-verifier' ) . ' (' . (int) $elapsed . ' ms)</p></div>';
			} elseif ( $ok ) {
				echo '<div class="notice notice-warning"><p>' . esc_html__( 'API reachable but returned an unexpected result. Check the error log.', 'ebounce-email-verifier' ) . '</p></div>';
			} else {
				echo '<div class="notice notice-error"><p>' . esc_html__( 'Connection failed. Check your API key and the error log.', 'ebounce-email-verifier' ) . '</p></div>';
			}
		}
		?>
	</div>
	<?php
}

/**
 * Plugin action links (Settings shortcut on plugins page).
 *
 * @param array $links Existing links.
 * @return array
 */
function ebounce_plugin_action_links( $links ) {
	$url           = admin_url( 'options-general.php?page=ebounce-email-verifier' );
	$settings_link = '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'ebounce-email-verifier' ) . '</a>';
	array_unshift( $links, $settings_link );
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'ebounce_plugin_action_links' );
