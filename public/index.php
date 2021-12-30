<?php
// Silence is golden?

// This would be your framework default bootstrap file

// During dev, this file would be hit when accessing your local host, like:
// http://vite-php-setup.test

require_once __DIR__ . '/helpers.php';

?>

<?php /*
*/ ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vite App</title>

    <?= vite('main.js') ?>

</head>
<body>
    <?= '<p class="message">PHP output here, potentially large HTML chunks</p>' ?>

    <div class="vue-app">
        <hello-world msg="header"></hello-world>
    </div>

    <?= '<p class="message">PHP output here, potentially large HTML chunks</p>' ?>

    <div class="vue-app">
        <hello-world msg="component"></hello-world>
    </div>

    <?= '<p class="message">PHP output here, potentially large HTML chunks</p>' ?>

    <div id="app"></div>
</body>
</html>

<?php /*
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>
			Vitailse | Opinionated vite starter template with TailwindCSS
		</title>

		<meta
			name="description"
			content="Opinionated vite starter template with TailwindCSS"
		/>
		<link rel="icon" href="/favicon.ico" />
		<link rel="icon" href="/favicon.png" type="image/png" />
		<link
			rel="alternate icon"
			href="/favicon.ico"
			type="image/png"
			sizes="16x16"
		/>
		<link
			rel="apple-touch-icon"
			href="/apple-touch-icon.png"
			sizes="180x180"
		/>
		<link rel="mask-icon" href="/favicon.png" color="#076AE0" />
		<meta name="theme-color" content="#076AE0" />
	</head>
	<body>
		<div id="app"></div>
		<script type="module" src="/src/main.ts"></script>
	</body>
</html>
*/ ?>