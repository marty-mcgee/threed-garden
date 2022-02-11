<p align='center'>
  <img src='https://user-images.githubusercontent.com/28910105/119210350-fc4cd600-baab-11eb-93b0-ce81184fc556.png' alt='Vitespa - the slower sibling of Vitesse, without SSG' width='600'/>

</p>

<p align='center'>
Mocking up web apps with <b>Vitespa</b> 🛵 – the slower sibling of Vitesse, without SSG.
</p>

<br>

<p align='center'>
<a href="https://vitespa.netlify.app/">Live Demo</a>
</p>

<br>

## Features

🏋️‍♀️ All the great stuff of [Vitesse](https://github.com/antfu/vitesse#readme)

⚡️ 🗂 📦 📑 📲 🎨 😃 🌍 🗒 🔥 🦾 ☁️

Vitespa aims for feature parity with Vitesse.

## Variations

As this template is strongly opinionated, the following provides a curated list for community maintained variations with different preferences and feature sets. Check them out as well. PR to add yours are also welcome!

- [vitesse](https://github.com/antfu/vitesse) by [@antfu](https://github.com/antfu) - the original
- [vitesse-addons](https://github.com/JohnCampionJr/vitesse-addons) by [@johncampionjr](https://github.com/johncampionjr) - additional options for integrations, including [Prettier](https://prettier.io) and [Storybook](https://storybook.js.org)
- [vitesse-ssr-template](https://github.com/frandiox/vitesse-ssr-template) by [@frandiox](https://github.com/frandiox) - Vitesse with SSR
- [vitesse-nuxt](https://github.com/antfu/vitesse-nuxt) - Vitesse for Nuxt 2 (expiremental)

## Try it now!

### GitHub Template

[Create a repo from this template on GitHub](https://github.com/ctholho/vitespa/generate).

### Clone to local

If you prefer to do it manually with the cleaner git history

```bash
npx degit ctholho/vitespa my-vitespa-app
cd my-vitespa-app
pnpm i # If you don't have pnpm installed, run: npm install -g pnpm
```

## Checklist

When you use this template, follow the checklist to update your info properly

- [ ] Rename `name` field in `package.json`
- [ ] Change the author name in `LICENSE`
- [ ] Change the title in `App.vue`
- [ ] Change the favicon in `public`
- [ ] Remove the `.github` folder which contains the funding info
- [ ] Clean up the READMEs and remove routes

And, enjoy :)

## Usage

### Development

Just run and visit http://localhost:3333

```bash
pnpm dev
```

### Build

To build the App, run

```bash
pnpm build
```

to preview the PWA service worker use (you can also use `pnpm preview`):

```bash
pnpm preview-https
```


### Deploy on Netlify

Go to [Netlify](https://app.netlify.com/start) and select your clone, `OK` along the way, and your App will be live in a minute.

## Why

Vitesse is a great place to start with a vite app because it let's you start immediately. But sometimes you need a simple PWA without SSG/SSR.

This template is strongly opinionated, but feel free to tweak it or even maintains your own forks. [(see community maintained variation forks)](#variations)
