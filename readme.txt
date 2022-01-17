=== EthPress - Web3 Login ===
Contributors: lynn999
Donate link: https://etherscan.io/address/0x106417f7265e15c1aae52f76809f171578e982a9
Tags: login, metamask, ethereum, web3, trust wallet, bitcoin, cryptocurrency, crypto wallet, walletconnect
Requires at least: 4.6
Tested up to: 5.8
Stable tag: 1.1.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Requires PHP: 5.4

Enable Ethereum Web3 login with crypto wallets such as MetaMask.

== Description ==

Add the capability to log in with cryptocurrency wallets such as [MetaMask](https://metamask.io) for Ethereum, and wallets that support WalletConnect QR code. Adds a button to WordPress login screen that will let users securely log in with their crypto wallet.

In the background, a regular WordPress user account is created, so existing plugins and customizations will have no problem working along.

== Installation ==

Use WordPress' Add New Plugin feature, search "EthPress",

or

1. Upload this folder (on WordPress.org, not GitLab) to the `/wp-content/plugins/` directory
1. Activate the plugin through the 'Plugins' menu in WordPress

or from GitLab source code

1. Git clone the repository to `/wp-content/plugins/`.
2. Run `composer install --ignore-platform-reqs && composer run-script build`.
3. Optional: for development, check out INSTALLATION.md on EthPress GitLab page.

== Frequently Asked Questions ==

= "Cannot log you in; you have not registered" =

EthPress 0.7.1+ respects the "Anyone can register" WordPress setting, so you have to enable that in Settings->General.

= The modal classes keep changing =

Use selectors like `#web3-login-root button.web3login-metamask`, instead of the `svelte-12345`.

= How does it work? =

The outline is described in [this TopTal post by Amaury Martiny](https://www.toptal.com/ethereum/one-click-login-flows-a-metamask-tutorial).

Instead of using databased nonces, we use WordPress nonces with a lifetime of 5 minutes, and append the user IP to the login message to prevent replays from elsewhere.

Fore more details, check out [the extra readme](https://gitlab.com/losnappas/ethpress/-/blob/master/README-EXTRA.md#so-how-does-it-verify-a-user).

= Signature verification =

When user submits a signature, it needs to be verified on server-side.

Read the "How does it work?" question.

Firstly, if you have php-gmp or php-bcmath extension installed, we'll do it with PHP, and you can ignore the rest of this. To check, go to the EthPress settings page.

Otherwise, we do it with JavaScript. EthPress comes configured with a free service. To verify signatures locally with JavaScript, and you should, see details: [https://gitlab.com/losnappas/verify-eth-signature](https://gitlab.com/losnappas/verify-eth-signature).

= Are my coins safe? =

Yes. A wallet (e.g. MetaMask) does/should not leak your private keys out into the wild, that would be madness.

= What about mobile? =

Mobile integration is in good condition, with WalletConnect QR code reading from wallets such as MetaMask Mobile, there is very little friction!

= GDPR? =

Ethpress does not store anything other than the wallet address, on your server. It will be deleted if you delete the associated user account or remove the plugin entirely.

If you're using the default, pre-set signature verification service: [it](https://gitlab.com/losnappas/verify-eth-signature) is hosted on [Heroku](https://heroku.com) EU, find their privacy policy [here](https://www.salesforce.com/company/privacy/).

Check EthPress Settings page for more information.

= Source code and contributing =

Contributions on GitLab only, thank you.

Plugin's source code: [https://gitlab.com/losnappas/ethpress](https://gitlab.com/losnappas/ethpress).

WordPress plugin page: [https://wordpress.org/plugins/ethpress/](https://wordpress.org/plugins/ethpress/).

Signature verifier's, which is used if no *php-gmp* or *php-bcmath*, source code: [https://gitlab.com/losnappas/verify-eth-signature](https://gitlab.com/losnappas/verify-eth-signature).

The modal is a Svelte component. Source code: [https://gitlab.com/losnappas/web3-login](https://gitlab.com/losnappas/web3-login).

= Further support =

On the wordpress.org support page, e-mail "lynn.mvp AT tutanota DOT com".

== Screenshots ==

1. Login flow.
2. Widget included.

== Changelog ==

= 1.1.1 =

Released 8/2021.

No longer taking the minimum of nonce lifetimes for the login nonce, instead the lifetime is static 5min.

= 1.1.0 =

Released 8/2021.

Updated WalletConnect libraries.

No longer removing database table on plugin uninstall.

Added Spanish translations (made by a contributor, forgot who).

= 1.0.3 =

Released 10/2020.

Another css fix on the z-index.

= 1.0.2 =

Released 9/2020.

Updated z-index and font color on modal.

= 1.0.1 =

Released 9/2020.

Little bug fix with address deletion.

The dialog now holds a span element instead of h2.

= 1.0.0 =

Released 8/2020.

Removed trust wallet deep link.

Changed walletconnect to show QR in the Account Linker, every time.

Releasing premium plugins, to fund development! Visit [ethpress.imlynn.xyz](https://ethpress.imlynn.xyz).

= 0.7.0 =

Released 8/2020.

Added a Widget.

The widget has an extra feature compared to the shortcode. The widget allows users to link more addresses to their account. You should prefer the widget over the shortcode now.

The new EthPress widget was added to the profile.php landing page.

If you've disabled registration by unchecking Settings->General->"Anyone can register", then EthPress will no longer register new users automatically. This was not the case before.

= 0.6.0 =

Released 4/2020.

Added PHP versions for signature recovery. It requires one of php-gmp or php-bcmath extensions. The JavaScript way still exists, but the PHP way is now preferred.

Added method for telling which login method user used.

= 0.5.0 =

Released 2/2020.

Added WalletConnect support.

Added shortcode `[ethpress_login_button]`.

Changed the login flow. Login button now opens a modal.

Removed events from javascript. Since the modal, events are quite useless.

= 0.4.0 =

Released 11/2019.

Added Trust Wallet support and a deep link. Deeplinks can be printed with `echo \losnappas\Ethpress\TrustWallet::get_deeplink();`.

= 0.3.0 =

Released 9/2019.

Added events to javascript. You can now use `ethpress.on('status', console.log)`.

Added options page and changed from wp_options to wp_site_meta for multisite, so all sites use same options.

= 0.2.4 =

Released 7/2019.

Added multisite support.

Added better instructions for wp_login_form.

Modified database table from `{$wpdb->prefix}` to `{$wpdb->base_prefix}` for multisite support. Single site should see no difference here.

= 0.1.0 =

Initial release 6/2019.

== Upgrade Notice ==

= 0.7.0 =

Breaking: style changes to dialog, disabled registration now prevents EthPress registrations.

= 0.6.0 =

There is now a PHP version of signature verifications, which is preferred over the JavaScript version, where possible. If you modified and had relied on JavaScript to do something *besides* the verification, you might need to take action. Otherwise, as you were.

= 0.5.0 =

The login button now pops open a modal, causing changes to UX, be sure to check.

JavaScript events `ethpress.on` have been REMOVED.

= 0.4.0 =

* Added Trust Wallet support and a deep link to login screen.
* Multisite: EthPress options are now shared between all sites. Make sure you re-check them before/after if you've changed them.

== Details ==

A web3 login button is added to your login screen automatically.

= Premium plugins! =

Premium plugins will be worked on by new maintainer soon~ish (before 2022, hoping), check back then.

Plugins include:

* EthPress Tokens: Checks users' token balance, block them if they don't own it.
* ...More to come. Taking ideas. Good idea = get the plugin for free.

= Widgets =

Use the EthPress widget for maximum ease. Alternatively, a shortcode is "\[ethpress_login_button\]".

= Example =

Eth (ERC-20) and BSC donations: [0x106417f7265e15c1aae52f76809f171578e982a9](https://etherscan.io/address/0x106417f7265e15c1aae52f76809f171578e982a9)

[More Q&A](https://gitlab.com/losnappas/ethpress/-/blob/master/README-EXTRA.md).

Subscribe to this plugin's support forum, I post feedback requests on the regular!
