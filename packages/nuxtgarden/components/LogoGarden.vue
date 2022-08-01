<template>
  <a :href="url" :title="title">
    <img :src="src" 
      alt="logo_threedgarden : {{logo}} : {{url}}"
    />
  </a>
</template>

<style scoped>
img, svg {
  width: 4vw;
  height: 4vw;
}
</style>

<script>
import Logo from "@/assets/img/logos/logo-threedgarden.png"
// console.log("Logo", Logo)

export default {
  name: "LogoGarden",

  setup() {
    const logo = Logo // "#LOGO"
    const src = Logo // Logo.toString()
    const title = "ThreeDGarden Dashboard"
    const url = "/" // "#HEYHEYHEY"
    // const foo = ref(1)
    // const bar = reactive({ name: "garden" })

    return {
      logo,
      src,
      title,
      url,
      // foo, 
      // bar 
    }
  },

  mounted() {
    console.log(this.logo)
  }

  // components: {
  //   Logo,
  // },
  // data() {
  //   return {
  //     logo: Logo, // "#Logo"
  //     src: Logo, // "", // Logo.toString()
  //     title: "ThreeDGarden Dashboard",
  //     url: "/#LOGO", // "#HEYHEYHEY",
  //     foo: 1,
  //     bar: { name: "bar" },
  //   }
  // }
}
</script>
