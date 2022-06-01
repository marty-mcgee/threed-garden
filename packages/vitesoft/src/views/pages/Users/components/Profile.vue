<template>
  <div
    class="card multisteps-form__panel p-3 border-radius-xl bg-white"
    data-animation="FadeIn"
  >
    <h5 class="font-weight-bolder mb-0">Profile</h5>
    <div class="multisteps-form__content mt-3">
      <div class="row">
        <div class="col-12">
          <label>Public Email</label>
          <vsud-input
            class="multisteps-form__input"
            type="text"
            placeholder="Use an address you don't use frequently."
          />
        </div>
        <div class="col-12">
          <label>Bio</label>
          <vsud-textarea
            class="multisteps-form__textarea"
            rows="5"
            placeholder="Say a few words about who you are or what you're working on."
          ></vsud-textarea>
        </div>
      </div>
      <div class="button-row d-flex mt-4">
        <vsud-button
          type="button"
          color="light"
          variant="gradient"
          class="js-btn-prev"
          @click="$parent.prevStep"
          >Prev</vsud-button
        >
        <vsud-button
          type="button"
          color="dark"
          variant="gradient"
          class="ms-auto"
          >Send</vsud-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import VsudInput from "@/components/VsudInput.vue";
import VsudButton from "@/components/VsudButton.vue";
import VsudTextarea from "@/components/VsudTextarea.vue";

export default {
  name: "Profile",
  components: {
    VsudInput,
    VsudButton,
    VsudTextarea,
  },
};
</script>
