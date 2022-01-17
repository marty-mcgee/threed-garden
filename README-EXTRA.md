# README-EXTRA

It'll likely be easier to do these with the shortcode `[ethpress_login_button]`.

### How to add the button to a custom screen with login_form() ###

Enqueue script 'ethpress-login' and call `ethpress.metamask.connect` somewhere, preferrably from a HTML `button` click event. You can use `login_form_bottom` filter to display a button, for example. Below is a code snippet you can use.

```php
add_action('wp_enqueue_scripts', function(){
	wp_enqueue_script('ethpress-login-front');
});
add_filter('login_form_bottom', function($content){
	return $content . \losnappas\Ethpress\Front::get_login_button();

	// return $content . '<a onclick="window.ethpress.metamask.connect();">Connect</a>';
});
```

### And WooCommerce's [woocommerce_my_account]? ###

Same deal as wp_login_form, except use the actions `woocommerce_login_form_start`, `woocommerce_login_form`, or `woocommerce_login_form_end` instead of `login_form_bottom` for displaying the button. Like so:

```php
add_action('woocommerce_login_form_end', function(){
	echo \losnappas\Ethpress\Front::get_login_button();
});
```

### And register and signup forms? ###

Again, as above. Actions you want are `register_form`, `before_signup_form`, `after_signup_form`, `woocommerce_register_form`, `woocommerce_register_form_end`, `woocommerce_register_form_start`.

### So how does it verify a user? ###

After a user signs a message with their private key, their public address can be extracted from the signature that was created. Comparing the public key and the key extracted, we can be certain that the user owns the address, if they match.

### How is the signature extracted? ###

It's a crypto thing. Since PHP does not have the capability of extracting the address without certain mathematical PHP extensions, I opted to create a simple backend API and use that instead. [Source code for backend](https://gitlab.com/losnappas/verify-eth-signature). The pre-configured service is running on a free Heroku dynamo, which means sometimes it goes to sleep and takes up to 30 seconds to wake up.

You're encouraged to host and run the verification service by yourself, just for yourself. There are some instructions on the gitlab page linked above.

Since version 0.6.0, there is also a PHP way implemented, which requires php-gmp or php-bcmath.

### Why JavaScript for the Signature Verification? ###

I don't know if people usually have the mathematical PHP extensions installed, but I doubt that is the case, and so, if I was wrong on that, then we could do this with just PHP. Let me know if you can find some statistics about that. I will also accept a pull request with the feature so that it doesn't break the JS versions.

Since version 0.6.0, there is also a PHP way implemented, which requires php-gmp or php-bcmath.

## Misc ##

Check https://gitlab.com/losnappas/web3-login , improve it, and send PR! Thanks.
