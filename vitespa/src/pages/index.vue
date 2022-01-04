<script setup lang="ts">
import { useStore } from '~/stores/index'
import { useUserStore } from '~/stores/user'
import ThreeDGardenLogo from '~/assets/ThreeD-Garden-Logo-Circle-Carrot.png'

const store = useStore()
const user = useUserStore()
const name = ref(user.savedName)

const router = useRouter()
const go = () => {
  if (name.value)
    router.push(`/hi/${encodeURIComponent(name.value)}`)
}

useHead({
  title: 'ThreeD Garden | 3D WordPress Plugin'
})

const { t } = useI18n()
</script>

<template>
  <div>
    <p class="text-4xl">
      <carbon-scooter class="inline-block" />
    </p>
    <p>
      <a rel="noreferrer" href="https://github.com/companyjuice/threedgarden" target="_blank">
        ThreeD Garden
      </a>
    </p>
    <img :src="ThreeDGardenLogo" width="300" class="mx-auto" />
    <p>
      <em class="text-sm opacity-75">{{ t('intro.desc') }}</em>
    </p>

    <div class="py-4" />

    <input
      id="input"
      v-model="name"
      :placeholder="t('intro.whats-your-name')"
      :aria-label="t('intro.whats-your-name')"
      type="text"
      autocomplete="false"
      p="x-4 y-2"
      w="250px"
      text="center"
      bg="transparent"
      border="~ rounded gray-200 dark:gray-700"
      outline="none active:none"
      @keydown.enter="go"
    >
    <label class="hidden" for="input">{{ t('intro.whats-your-name') }}</label>

    <div>
      <button
        class="m-3 text-sm btn"
        :disabled="!name"
        @click="go"
      >
        {{ t('button.go') }}
      </button>
    </div>

    <div class="mt-5 text-center">
      <button
        @click="store.$state.count++"
        class="
          px-4
          py-2
          dark:bg-blue-800
          bg-blue-500
          text-white
          rounded
        "
      >
        Count : {{ store.$state.count }}
      </button>
    </div>

    <router-link
      :to="{ name: 'other-page' }"
      class="
        mt-5
        text-center
        hover:text-gray-200
        dark:hover:text-gray-500
        hover:underline
      "
      >{{ t('pages.other.menu') }}</router-link
    >

  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
