<template>
  <h1>HEY HEY HEY</h1>
</template>

<script>
export default {
  name: "App",
  components: {
    
  },

  computed: {

  },
  watch: {

  },
  mounted: function () {
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount: function () {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      if (window.innerWidth > 1200) {
        // this.$store.dispatch('setIsLargeScreen', true)
      } else {
        // this.$store.dispatch('setIsLargeScreen', false)
      }
      // xs: 0,
      // sm: 576px,
      // md: 768px,
      // lg: 992px,
      // xl: 1200px,
      // xxl: 1400px
    }
  }
};
</script>
