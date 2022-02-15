<script setup lang="ts">
const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <main class="text-center text-teal-700 dark:text-gray-200">
    <div>
      <p class="text-4xl">
        <carbon-warning class="inline-block" />
      </p>
    </div>
    <router-view />
    <div>
      <button
        class="btn m-3 text-sm mt-8"
        @click="router.back()"
      >
        {{ t('button.back') }}
      </button>
      <button @click="router.go(-1)" class="btn btn-primary my-5">Go(-1)</button>
      <button @click="router.push('/')" class="btn btn-secondary my-5">Home</button>
    </div>
  </main>
</template>
