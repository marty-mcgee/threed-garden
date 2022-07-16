<template>
  <a :href="url" title="ThreeDGarden Dashboard">
    <img 
      :src="src" 
      alt="logo_threedgarden : {{logo}} : {{url}}"
    />
  </a>
</template>

<style>
img, svg {
  width: 4vw;
  height: 4vw;
}
</style>

<script>
// setup() {
//   const foo = ref(1);
//   const bar = reactive({ name: "hi" });
// 
//   return { foo, bar }
// }
import Logo from "@/assets/img/logos/logo-threedgarden.png"
console.log("Logo", Logo)

export default {
  name: "LogoGarden",
  // components: {
  //   Logo,
  // },
  data() {
    return {
      logo: Logo, // "#Logo"
      src: Logo, // "", // Logo.toString()
      url: "/#HEYHEYHEY", // "#HEYHEYHEY",
      foo: 1,
      bar: { name: "bar" },
    }
  }
}
</script>
