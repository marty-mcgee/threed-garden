<script setup lang="ts">
import { useBoard, useEthers, displayEther, shortenAddress } from 'vue-dapp'

const { open } = useBoard()
const { address, balance, isActivated } = useEthers()

// const navigation: { name: string; href: string }[] = [
//   {
//     name: 'Home',
//     href: '/',
//   },
//   {
//     name: 'About',
//     href: '/about',
//   },
//   {
//     name: 'Participate',
//     href: '/participate',
//   },
//   // {
//   //   path: '/',
//   //   name: 'Home',
//   //   component: Home,
//   // },
//   // {
//   //   path: '/about',
//   //   name: 'About',
//   //   component: About,
//   // },
//   // // Fallback route for handling 404s
//   // {
//   //   path: '/:pathMatch(.*)*',
//   //   name: '404',
//   //   component: () => import('./views/Error404.vue'),
//   // },
// ]
</script>

<template>
  <header class="w-full px-4">
    <div class="flex justify-between p-4 px-3">
      <nav id="nav" class="w-full">
        <div class="flex items-center justify-between">
          <router-link to="/" active-class="text-gray-900" class="text-xl text-gray-600">
            <div class="flex space-x-4 items-center">
              <!-- logo -->
              <img class="h-10 min-w-10" src="../assets/logo-threedgarden.png" alt="logo" />
              <p class="hover:text-gray-900">ThreeD Garden</p>
            </div>
          </router-link>

          <div class="flex items-center space-x-10">
            <!-- router -->
            <!-- <router-link
              v-for="link in navigation"
              :key="link.name"
              :to="link.href"
              active-class="text-gray-900"
              exact
              class="text-gray-600 hover:text-gray-900"
            >
              {{ link.name }}
            </router-link> -->
            
            <!-- 
            <router-link to="/">Home</router-link> |
            <router-link to="about">About</router-link> |
            <router-link to="participate">Participate</router-link>
            -->
            <!-- -->
            <router-link :to="{ name: 'index', params: { userId: 123 }}">Home</router-link>
            <router-link :to="{ name: 'about', params: { userId: 123 }}">About</router-link>
            <router-link :to="{ name: 'participate', params: { userId: 123 }}">Participate</router-link>

            <div v-if="isActivated" class="flex items-center">
              <!-- Account -->
              <!-- sm:hidden -->
              <div class="sm:hidden py-2 px-3 rounded-2xl inline-block bg-gray-100">
                {{ shortenAddress(address) }}
              </div>
              <!-- hidden -->
              <div class="hidden sm:flex py-1 px-2 flex items-center rounded-3xl border border-solid">
                <div class="px-1 mr-1">{{ displayEther(balance) }} ETH</div>
                <div class="py-2 px-3 rounded-2xl inline-block bg-gray-100">
                  {{ shortenAddress(address) }}
                </div>
              </div>
            </div>

            <button v-else @click="open" class="btn">Connect Wallet</button>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
#nav {
	text-align: center;
}
#nav a {
	color: #72931f;
	text-decoration: none;
	cursor: pointer;
}
#nav a:hover, 
#nav a:active {
	color: #96bc33;
	text-decoration: underline;
	cursor: pointer;
} 
</style>
