<template>
  <div
    class="card multisteps-form__panel p-3 border-radius-xl bg-white"
    data-animation="FadeIn"
  >
    <h5 class="font-weight-bolder">Address</h5>
    <div class="multisteps-form__content">
      <div class="row mt-3">
        <div class="col">
          <label>Address 1</label>
          <vsud-input
            class="multisteps-form__input"
            type="text"
            placeholder="eg. Street 111"
          />
        </div>
      </div>
      <div class="row mt-3">
        <div class="col">
          <label>Address 2</label>
          <vsud-input
            class="multisteps-form__input"
            type="text"
            placeholder="eg. Street 221"
          />
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-12 col-sm-6">
          <label>City</label>
          <vsud-input
            class="multisteps-form__input"
            type="text"
            placeholder="eg. Tokyo"
          />
        </div>
        <div class="col-6 col-sm-3 mt-3 mt-sm-0">
          <label>State</label>
          <select
            id="choices-state"
            class="multisteps-form__select form-control"
            name="choices-state"
          >
            <option selected="selected">...</option>
            <option value="1">State 1</option>
            <option value="2">State 2</option>
          </select>
        </div>
        <div class="col-6 col-sm-3 mt-3 mt-sm-0">
          <label>Zip</label>
          <vsud-input
            class="multisteps-form__input"
            type="text"
            placeholder="7 letters"
          />
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
          class="ms-auto js-btn-next"
          @click="$parent.nextStep"
          >Next</vsud-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import VsudInput from "@/components/VsudInput.vue";
import VsudButton from "@/components/VsudButton.vue";
import Choices from "choices.js";

export default {
  name: "Address",
  components: {
    VsudInput,
    VsudButton,
  },
  mounted() {
    if (document.getElementById("choices-state")) {
      var element = document.getElementById("choices-state");
      new Choices(element, {
        searchEnabled: false,
      });
    }
  },
};
</script>

<style></style>
