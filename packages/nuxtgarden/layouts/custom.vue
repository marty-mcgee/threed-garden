<template>
  <div id="MMCUSTOM">
    <header>
      <slot name="header">
        <LogoGarden />
        <!-- *dashboard* layout: header -->
        |<NuxtLink to="/about">
          About
        </NuxtLink>
        |<NuxtLink to="/participate">
          Participate
        </NuxtLink>
        |<NuxtLink to="/pinia">
          Pinia
        </NuxtLink>
      </slot>
    </header>
    <main>
      Some *custom* layout: main
      <slot />
    </main>
    <footer>
      <slot name="footer">
        Some *custom* layout: footer
      </slot>
    </footer>
  </div>
</template>
