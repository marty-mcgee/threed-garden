<template>
  <div>
    Garden id - {{gardenId}}
  </div>
</template>

<script>
// imports

// compositional/composable setup
setup: () => {

  definePageMeta({
    layout: "default",
    // layout: "custom",
    // layout: "dashboard",
    title: "Gardens: _id",
  })

  return {
    // id is name of the url param we created
    // gardenId: this.$route.params.id
  }
}

export default{
  name: "Gardens _id",
  data: function() {
    return {
      // id is name of the url param we created
      gardenId: this.$route.params.id
    }
  }
}
</script>