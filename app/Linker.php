<?php
/**
 * Links accounts
 *
 * @package ethpress
 * @since 0.7.0
 */

namespace losnappas\Ethpress;

defined( 'ABSPATH' ) || die;

use losnappas\Ethpress\Signature;
use losnappas\Ethpress\Address;
use losnappas\Ethpress\Login;

/**
 * Links account to ethereum address.
 *
 * @since 0.7.0
 */
class Linker {

	/**
	 * Links (associates) accounts to ethereum addresses.
	 *
	 * @since 0.7.0
	 */
	public static function link_account() {
		check_ajax_referer( 'ethpress_link_account' );
		if (
			! empty( $_POST['coinbase'] )
			&& ! empty( $_POST['signature'] )
			&& is_user_logged_in()
		) {
			// These two show up as linter errors, but that is a bug in the linter itself.
			$coinbase  = Address::sanitize( wp_unslash( $_POST['coinbase'] ) );
			$signature = Address::sanitize( wp_unslash( $_POST['signature'] ) );

			$message  = Login::get_login_message( $coinbase );
			$verified = Signature::verify( $message, $signature, $coinbase );

			if ( $verified ) {
				/*
				 * First make sure this address isn't already linked
				 * to another account, because that would make logging in a
				 * dice roll between accounts, as you could be logged in with
				 * any one of the accounts. Then we make sure that
				 * the address isn't in the ethpress_addresses table already.
				 */
				$current_user   = wp_get_current_user();
				$address        = new Address( $coinbase );
				$existing_user  = $address->get_user();
				$short_coinbase = substr( $coinbase, 0, 15 );
				$error_msg      = esc_html(
					sprintf(
						/* translators: wallet address */
						__( 'Address %1$s... is already linked to an account. Doing nothing.', 'ethpress' ),
						$short_coinbase
					)
				);

				if ( $existing_user ) {
					wp_send_json_error(
						$error_msg
					);
				} else {
					// No matching address, so we can create this link.
					$address = new Address(
						$coinbase,
						[
							'user' => $current_user,
						]
					);
					$success = $address->create();
					if ( false !== $success ) {
						$message = esc_html(
							sprintf(
								/* translators: wallet address */
								__( 'Success! Address %1$s... is now linked to your account. You may close this dialog, or link another address.', 'ethpress' ),
								$short_coinbase
							)
						);
						wp_send_json(
							[
								'data'    => [
									'message' => $message,
								],
								'success' => true,
							]
						);
					} else {
						wp_send_json_error(
							$error_msg
						);
					}
				}
			} else {
				wp_send_json_error( esc_html__( 'Signature mismatch. Try again.', 'ethpress' ) );
			}
		} else {
			wp_send_json_error( esc_html__( 'Invalid request.', 'ethpress' ) );
		}
	}

	/**
	 * Modifies javascript object so it does linking instead of logging in.
	 *
	 * @since 0.7.0
	 *
	 * @param array $content window.ethpressLoginWP javascript object.
	 * @return array New window.ethpressLoginWP javascript object.
	 */
	public static function ethpress_login_inline_script( $content ) {
		$translations           = array(
			'calltoaction' => esc_html__( 'Associate a wallet with your account', 'ethpress' ),
			// This one doesn't show, but better have it just in case.
			'loggedin'     => esc_html__( 'Account and address have been linked successfully. You may close this dialog.', 'ethpress' ),
			'aborted'      => esc_html__( 'Aborted', 'ethpress' ),
			'heading'      => esc_html__( 'Link a Wallet', 'ethpress' ),
			'fetching'     => esc_html__( 'Fetching verification phrase...', 'ethpress' ),
		);
		$content['l10n']        = array_merge( $content['l10n'], $translations );
		$content['loginAction'] = 'ethpress_link_account';
		$content['loginNonce']  = wp_create_nonce( 'ethpress_link_account' );

		wp_enqueue_script(
			'ethpress_clears_walletconnect',
			plugin_dir_url( ETHPRESS_FILE ) . 'public/dist/clears-walletconnect.min.js',
			[],
			'1',
			true
		);

		return $content;
	}

	/**
	 * Outputs message to be signed inside crypto wallet, for linking of account.
	 *
	 * Hooked to the ethpress_login_message filter.
	 *
	 * @since 0.7.0
	 *
	 * @param string $message The message.
	 * @return string New message.
	 */
	public static function login_message( $message ) {
		return esc_html__( 'Linking your account to your crypto wallet.', 'ethpress' );
	}
}
