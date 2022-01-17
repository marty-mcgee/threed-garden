import resolve from '@rollup/plugin-node-resolve';

// import pkg from './package.json';
import { terser } from 'rollup-plugin-terser';

// const name = pkg.name
// 	.replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
// 	.replace(/^\w/, m => m.toUpperCase())
// 	.replace(/-\w/g, m => m[1].toUpperCase());

export default [ {
	input: 'public/js/main.js',
	output: [
		! process.env.PRODUCTION && { dir: 'public/dist', 'format': 'es', entryFileNames: '[name].min.js', chunkFileNames: '[name].min.js' },
		process.env.PRODUCTION && { dir: 'public/dist', 'format': 'es', entryFileNames: '[name].min.js', chunkFileNames: '[name].min.js', plugins: [ terser({ module: false }) ] },
		process.env.PRODUCTION && { dir: 'public/dist', 'format': 'es', entryFileNames: '[name].js', chunkFileNames: '[name].js' }
	].filter( Boolean ),
	plugins: [
		resolve({
			browser: true,
			preferBuiltins: false
		})
	]
} ];

