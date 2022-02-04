<?php
/**
 * Contains uninstall procedures.
 *
 * @package ethpress
 */

namespace losnappas\Ethpress;

require_once 'vendor/autoload.php';

defined( 'WP_UNINSTALL_PLUGIN' ) || die;

use losnappas\Ethpress\Plugin;

Plugin::uninstall();
