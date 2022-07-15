<template>
  <div
    class="p-3 bg-white card multisteps-form__panel border-radius-xl"
    data-animation="FadeIn"
  >
    <h5 class="font-weight-bolder">Pricing</h5>
    <div class="mt-3 multisteps-form__content">
      <div class="row">
        <div class="col-3">
          <label>Price</label>
          <input
            class="multisteps-form__input form-control"
            type="text"
            placeholder="99.00"
          />
        </div>
        <div class="col-4">
          <label>Currency</label>
          <select
            id="choices-currency"
            class="form-control"
            name="choices-sizes"
          >
            <option value="Choice 1" selected="">USD</option>
            <option value="Choice 2">EUR</option>
            <option value="Choice 3">GBP</option>
            <option value="Choice 4">CNY</option>
            <option value="Choice 5">INR</option>
            <option value="Choice 6">BTC</option>
          </select>
        </div>
        <div class="col-5">
          <label>SKU</label>
          <input
            class="multisteps-form__input form-control"
            type="text"
            placeholder="71283476591"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <label class="mt-4 form-label">Tags</label>
          <select
            id="choices-tags"
            class="form-control"
            name="choices-tags"
            multiple
          >
            <option value="Choice 1" selected>In Stock</option>
            <option value="Choice 2">Out of Stock</option>
            <option value="Choice 3">Sale</option>
            <option value="Choice 4">Black Friday</option>
          </select>
        </div>
      </div>
      <div class="mt-4 button-row d-flex col-12">
        <vsud-button
          type="button"
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
          >Next</vsud-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import Choices from "choices.js";
import VsudButton from "@/components/vitesoft/VsudButton.vue";

export default {
  name: "Pricing",
  components: {
    VsudButton,
  },
  mounted() {
    if (document.getElementById("choices-currency")) {
      let element = document.getElementById("choices-currency");
      new Choices(element, {
        searchEnabled: false,
      });
    }

    if (document.getElementById("choices-tags")) {
      var tags = document.getElementById("choices-tags");
      const examples = new Choices(tags, {
        removeItemButton: true,
      });

      examples.setChoices(
        [
          {
            value: "One",
            label: "Expired",
            disabled: true,
          },
          {
            value: "Two",
            label: "Out of Stock",
            selected: true,
          },
        ],
        "value",
        "label",
        false,
      );
    }
  },
};
</script>
