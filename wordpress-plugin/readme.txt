=== eBounce Email Verifier ===
Contributors: ebounce
Tags: email verification, email validator, contact form 7, woocommerce, spam prevention
Requires at least: 5.8
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Validate email addresses in real time with the eBounce API. Blocks invalid, disposable and role-based emails on your forms. 10,000 free verifications per month.

== Description ==

eBounce Email Verifier checks every email address submitted through your WordPress forms against the eBounce verification API — syntax, MX records, disposable/temporary email detection and role-based address detection (info@, support@, sales@).

**Works with:**

* Contact Form 7 (`wpcf7_validate_email` / `wpcf7_validate_email*`)
* WooCommerce checkout (`woocommerce_after_checkout_validation`)
* WooCommerce registration (`woocommerce_registration_errors`)
* Core WordPress registration (`registration_errors`)

**Why verify emails?**

* Reduce hard bounces and protect your sender reputation
* Stop disposable/temporary email signups
* Keep your mailing list and CRM clean from day one

**Fail-open design:** if the eBounce API is unreachable or your quota is exceeded, submissions are allowed through (never block real users because of our outage) and the incident is logged to the PHP error log.

**Caching:** verification results are cached for 24 hours via WordPress transients, so repeat submissions of the same address cost you nothing.

Get your free API key (10,000 verifications/month, no credit card) at https://ebounce.custmax.com/

== Installation ==

1. Upload the `ebounce-email-verifier` folder to `/wp-content/plugins/`, or install it from the Plugins screen.
2. Activate the plugin through the "Plugins" screen in WordPress.
3. Go to **Settings → eBounce Verifier** and paste your API key (get one free at https://ebounce.custmax.com/).
4. Tick "Enable verification" and save. Use the "Test API connection" button to confirm everything works.

== Frequently Asked Questions ==

= Where do I get an API key? =

Sign up free at https://ebounce.custmax.com/ — the key is in your dashboard. The free plan includes 10,000 verifications per month.

= Which forms are protected? =

Contact Form 7 email fields, WooCommerce checkout billing email, WooCommerce registration, and the default WordPress registration form. The plugin auto-detects which of these are installed.

= What happens if the API is down? =

The plugin fails open: the submission is allowed and the incident is written to the PHP error log. Your visitors are never blocked by an eBounce outage.

= Does it slow down my forms? =

Results are cached for 24 hours, so each unique address is verified once. The API typically responds in under a second.

= What does it cost? =

The plugin is free and open source. eBounce's free plan covers 10,000 verifications per month; paid plans with higher limits are coming soon.

= Can I customize the error message? =

The message "Please enter a valid email address." is translatable via the `ebounce-email-verifier` text domain. Developers can also filter the validation hooks directly.

== Screenshots ==

1. Settings page with API key field, enable toggle and connection test.

== Changelog ==

= 1.0.0 =
* Initial release.
* Real-time verification via the eBounce API (syntax, MX, disposable, role-based).
* Contact Form 7, WooCommerce checkout/registration and WordPress registration support.
* 24-hour transient caching, fail-open on API errors, settings page with connection test.
