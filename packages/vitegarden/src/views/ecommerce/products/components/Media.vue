<template>
  <div
    class="p-3 bg-white card multisteps-form__panel border-radius-xl"
    data-animation="FadeIn"
  >
    <h5 class="font-weight-bolder">Media</h5>
    <div class="multisteps-form__content">
      <div class="mt-3 row">
        <div class="col-12">
          <label>Product images</label>
          <div
            action="/file-upload"
            class="form-control dropzone"
            id="productImg"
          ></div>
        </div>
      </div>
      <div class="mt-4 button-row d-flex col-12">
        <vsud-button
          color="secondary"
          variant="gradient"
          class="mb-0 js-btn-prev"
          title="Prev"
          @click="this.$parent.prevStep"
          >Prev</vsud-button
        >
        <vsud-button
          type="button"
          color="dark"
          variant="gradient"
          class="mb-0 ms-auto js-btn-next"
          title="Next"
          @click="this.$parent.nextStep"
          >Next</vsud-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import VsudButton from "@/components/VsudButton.vue";

export default {
  name: "media",
  components: {
    VsudButton,
  },
};
</script>
