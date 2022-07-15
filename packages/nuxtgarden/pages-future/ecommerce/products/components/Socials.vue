<template>
  <div
    class="p-3 bg-white card multisteps-form__panel border-radius-xl"
    data-animation="FadeIn"
  >
    <h5 class="font-weight-bolder">Socials</h5>
    <div class="multisteps-form__content">
      <div class="mt-3 row">
        <div class="col-12">
          <label>Shoppify Handle</label>
          <vsud-input
            class="multisteps-form__input"
            type="text"
            placeholder="@soft"
          />
        </div>
        <div class="mt-3 col-12">
          <label>Facebook Account</label>
          <vsud-input
            class="multisteps-form__input"
            type="text"
            placeholder="https://..."
          />
        </div>
        <div class="mt-3 col-12">
          <label>Instagram Account</label>
          <vsud-input
            class="multisteps-form__input"
            type="text"
            placeholder="https://..."
          />
        </div>
      </div>
      <div class="row">
        <div class="mt-4 button-row d-flex col-12">
          <vsud-button
            color="secondary"
            variant="gradient"
            class="mb-0 js-btn-prev"
            title="Prev"
            @click="$parent.prevStep"
            >Prev</vsud-button
          >
          <vsud-button
            type="button"
            color="dark"
            variant="gradient"
            class="mb-0 ms-auto js-btn-next"
            title="Next"
            @click="$parent.nextStep"
            >Next</vsud-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VsudInput from "@/components/vitesoft/VsudInput.vue";
import VsudButton from "@/components/vitesoft/VsudButton.vue";

export default {
  name: "Socials",
  components: {
    VsudInput,
    VsudButton,
  },
};
</script>
