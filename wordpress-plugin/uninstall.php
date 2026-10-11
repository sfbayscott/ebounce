<?php
/**
 * Cleanup on plugin uninstall: remove settings and cached verification transients.
 */
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'ebounce_settings' );

// Remove all cached verification transients (both the transient and its timeout row).
global $wpdb;
$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
		$wpdb->esc_like( '_transient_ebounce_' ) . '%',
		$wpdb->esc_like( '_transient_timeout_ebounce_' ) . '%'
	)
);
