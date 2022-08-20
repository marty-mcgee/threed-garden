<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-6">
        <h4>Make the changes below</h4>
        <p>
          We’re constantly trying to express ourselves and actualize our dreams.
          If you have the opportunity to play.
        </p>
      </div>
      <div
        class="text-right col-lg-6 d-flex flex-column justify-content-center"
      >
        <button
          type="button"
          class="mt-2 mb-0  btn bg-gradient-success ms-lg-auto me-lg-0 me-auto mt-lg-0"
        >
          Save
        </button>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="font-weight-bolder">Product Image</h5>
            <div class="row">
              <div class="col-12">
                <img
                  class="mt-3 shadow-lg w-100 border-radius-lg"
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                  alt="product_image"
                />
              </div>
              <div class="mt-4 col-12">
                <div class="d-flex">
                  <button
                    class="mb-0 btn bg-gradient-success btn-sm me-2"
                    type="button"
                    name="button"
                  >
                    Edit
                  </button>
                  <button
                    class="mb-0 btn btn-outline-dark btn-sm"
                    type="button"
                    name="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 col-lg-8 mt-lg-0">
        <div class="card">
          <div class="card-body">
            <h5 class="font-weight-bolder">Product Information</h5>
            <div class="row">
              <div class="col-12 col-sm-6">
                <label>Name</label>
                <input
                  class="form-control"
                  type="text"
                  value="Minimal Bar Stool"
                />
              </div>
              <div class="mt-3 col-12 col-sm-6 mt-sm-0">
                <label>Weight</label>
                <input class="form-control" type="number" value="2" />
              </div>
            </div>
            <div class="row">
              <div class="col-3">
                <label class="mt-4">Collection</label>
                <input class="form-control" type="text" value="Summer" />
              </div>
              <div class="col-3">
                <label class="mt-4">Price</label>
                <input class="form-control" type="text" value="$90" />
              </div>
              <div class="col-3">
                <label class="mt-4">Quantity</label>
                <input class="form-control" type="number" value="50" />
              </div>
            </div>
            <div class="row">
              <div class="col-sm-6">
                <label class="mt-4">Description</label>
                <p class="text-xs form-text text-muted ms-1 d-inline">
                  (optional)
                </p>
                <div id="edit-description-edit" class="h-50">
                  Long sleeves black denim jacket with a twisted design.
                  Contrast stitching. Button up closure. White arrow prints on
                  the back.
                </div>
              </div>
              <div class="col-sm-6">
                <label class="mt-4">Category</label>
                <select
                  class="form-control"
                  name="choices-category"
                  id="choices-category-edit"
                >
                  <option value="Choice 1" selected="">Furniture</option>
                  <option value="Choice 2">Real Estate</option>
                  <option value="Choice 3">Electronics</option>
                  <option value="Choice 4">Clothing</option>
                  <option value="Choice 5">Others</option>
                </select>
                <label>Color</label>
                <select
                  class="form-control"
                  name="choices-color"
                  id="choices-color-edit"
                >
                  <option value="Choice 1" selected="">Black</option>
                  <option value="Choice 2">White</option>
                  <option value="Choice 3">Blue</option>
                  <option value="Choice 4">Orange</option>
                  <option value="Choice 5">Green</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-sm-4">
        <div class="card">
          <div class="card-body">
            <h5 class="font-weight-bolder">Socials</h5>
            <label>Shoppify Handle</label>
            <input class="form-control" type="text" value="@soft" />
            <label class="mt-4">Facebook Account</label>
            <input class="form-control" type="text" value="https://" />
            <label class="mt-4">Instagram Account</label>
            <input class="form-control" type="text" value="https://" />
          </div>
        </div>
      </div>
      <div class="mt-4 col-sm-8 mt-sm-0">
        <div class="card">
          <div class="card-body">
            <div class="row">
              <h5 class="font-weight-bolder">Pricing</h5>
              <div class="col-3">
                <label>Price</label>
                <input class="form-control" type="number" value="99.00" />
              </div>
              <div class="col-4">
                <label>Currency</label>
                <select
                  class="form-control"
                  name="choices-sizes"
                  id="choices-currency-edit"
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
                <input class="form-control" type="text" value="71283476591" />
              </div>
            </div>
            <div class="row">
              <div class="col-12">
                <label class="mt-4">Tags</label>
                <select
                  class="form-control"
                  name="choices-tags"
                  id="choices-tags-edit"
                  multiple
                >
                  <option value="Choice 1" selected>In Stock</option>
                  <option value="Choice 2">Out of Stock</option>
                  <option value="Choice 3">Sale</option>
                  <option value="Choice 4">Black Friday</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Quill from "quill";
import Choices from "choices.js";

export default {
  name: "edit-product",

  mounted() {
    if (document.getElementById("edit-description-edit")) {
      new Quill("#edit-description-edit", {
        theme: "snow", // Specify theme in configuration
      });
    }
    this.getChoices("choices-category-edit");
    this.getChoices("choices-color-edit");
    this.getChoices("choices-currency-edit");

    if (document.getElementById("choices-tags-edit")) {
      var tags = document.getElementById("choices-tags-edit");
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
        false
      );
    }
  },
  methods: {
    getChoices(id) {
      if (document.getElementById(id)) {
        var element = document.getElementById(id);
        return new Choices(element, {
          searchEnabled: false,
        });
      }
    },
  },
};
</script>
