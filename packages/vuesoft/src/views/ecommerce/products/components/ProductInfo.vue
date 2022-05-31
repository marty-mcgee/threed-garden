<template>
  <div
    class="p-3 bg-white card multisteps-form__panel border-radius-xl"
    data-animation="FadeIn"
  >
    <h5 class="font-weight-bolder">Product Information</h5>
    <div class="multisteps-form__content">
      <div class="mt-3 row">
        <div class="col-12 col-sm-6">
          <label>Name</label>
          <input
            class="multisteps-form__input form-control"
            type="text"
            placeholder="eg. Off-White"
          />
        </div>
        <div class="mt-3 col-12 col-sm-6 mt-sm-0">
          <label>Weight</label>
          <input
            class="multisteps-form__input form-control"
            type="text"
            placeholder="eg. 42"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-sm-6">
          <label class="mt-4">Description</label>
          <p class="text-xs form-text text-muted ms-1 d-inline">(optional)</p>
          <div id="edit-description" class="h-50">
            <p>Some initial <strong>bold</strong> text</p>
          </div>
        </div>
        <div class="mt-4 col-sm-6 mt-sm-0">
          <label class="mt-4">Category</label>
          <select
            id="choices-category"
            class="form-control"
            name="choices-category"
          >
            <option value="Choice 1" selected="">Clothing</option>
            <option value="Choice 2">Real Estate</option>
            <option value="Choice 3">Electronics</option>
            <option value="Choice 4">Furniture</option>
            <option value="Choice 5">Others</option>
          </select>
          <label>Sizes</label>
          <select id="choices-sizes" class="form-control" name="choices-sizes">
            <option value="Choice 1" selected="">Medium</option>
            <option value="Choice 2">Small</option>
            <option value="Choice 3">Large</option>
            <option value="Choice 4">Extra Large</option>
            <option value="Choice 5">Extra Small</option>
          </select>
        </div>
      </div>
      <div class="mt-4 button-row d-flex col-12">
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
import Quill from "quill";
import Choices from "choices.js";
import VsudButton from "@/components/VsudButton.vue";

export default {
  name: "ProductInfo",
  components: {
    VsudButton,
  },
  mounted() {
    if (document.getElementById("edit-description")) {
      // eslint-disable-next-line no-unused-vars
      var quill = new Quill("#edit-description", {
        theme: "snow", // Specify theme in configuration
      });
    }
    if (document.getElementById("choices-category")) {
      var element = document.getElementById("choices-category");
      new Choices(element, {
        searchEnabled: false,
      });
    }

    if (document.getElementById("choices-sizes")) {
      let element = document.getElementById("choices-sizes");
      new Choices(element, {
        searchEnabled: false,
      });
    }
  },
};
</script>
