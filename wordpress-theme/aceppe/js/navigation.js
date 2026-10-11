/**
 * Mobile menu toggle for the Aceppe theme.
 */
( function() {
	'use strict';

	var nav = document.getElementById( 'site-navigation' );
	if ( ! nav ) {
		return;
	}

	var button = nav.querySelector( '.menu-toggle' );
	if ( ! button ) {
		return;
	}

	button.addEventListener( 'click', function() {
		nav.classList.toggle( 'toggled' );
		var expanded = button.getAttribute( 'aria-expanded' ) === 'true';
		button.setAttribute( 'aria-expanded', expanded ? 'false' : 'true' );
	} );
} )();
