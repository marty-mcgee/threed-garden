/**
 * Key scripts:
 * - readme -- To generate readme.md.
 * - i18n -- To make pot files.
 * - dist -- To build minified file from main.js.
 */
const path = require( 'path' );

module.exports = function( grunt ) {

	'use strict';

	// Project configuration
	grunt.initConfig({

		pkg: grunt.file.readJSON( 'package.json' ),

		addtextdomain: {
			options: {
				textdomain: 'ethpress'
			},
			update_all_domains: {
				options: {
					updateDomains: true
				},
				src: [ '*.php', '**/*.php', '!\.git/**/*', '!bin/**/*', '!node_modules/**/*', '!tests/**/*', '!vendor/**/*' ]
			}
		},

		wp_readme_to_markdown: {
			your_target: {
				files: {
					'README.md': 'readme.txt'
				}
			}
		},

		makepot: {
			target: {
				options: {
					domainPath: '/languages',
					exclude: [ '\.git/*', 'bin/*', 'node_modules/*', 'tests/*', 'vendor/*', 'zipz' ],
					mainFile: 'ethpress.php',
					potFilename: 'ethpress.pot',
					potHeaders: {
						poedit: true,
						'x-poedit-keywordslist': true
					},
					type: 'wp-plugin',
					updateTimestamp: true
				}
			}
		},

		uglify: {
			minify: {
				files: {
					'public/dist/login-front.min.js': 'public/js/login-front.js',
					'public/dist/clears-walletconnect.min.js': 'public/js/clears-walletconnect.js'
				},
				mangle: {
					reserved: [ 'ethpress', 'Web3Login' ]
				}
			}
		},

		compress: {
			main: {
				options: {
					archive: 'zipz/trunk.zip'
				},
				files: [
					{
						src: [
							'vendor/**', 'public/**', 'languages/**', 'app/**', 'uninstall.php', 'readme.txt', 'index.php', 'ethpress.php'
						],
						expand: true,
						dest: 'trunk'
					}
				]
			}
		}
	});

	grunt.loadNpmTasks( 'grunt-wp-i18n' );
	grunt.loadNpmTasks( 'grunt-wp-readme-to-markdown' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-compress' );
	grunt.registerTask( 'default', [ 'i18n', 'readme' ]);
	grunt.registerTask( 'i18n', [ 'addtextdomain', 'makepot' ]);
	grunt.registerTask( 'readme', [ 'wp_readme_to_markdown' ]);

	grunt.util.linefeed = '\n';

};
