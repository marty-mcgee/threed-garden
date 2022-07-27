<template>
  <div>
    <p>Garden id - {{gardenId}}</p>  </div>
</template>

<script>
setup: () => {
  return {
        // id is name of the url param we created
      gardenId: this.$route.params.id
    }
}
export default{
   data: function() {
    return {
        // id is name of the url param we created
      gardenId: this.$route.params.id
    };
  }
}
</script>