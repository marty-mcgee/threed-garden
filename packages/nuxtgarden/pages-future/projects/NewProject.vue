<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="mx-auto col-lg-9 col-12">
        <div class="mt-4 card card-body">
          <h6 class="mb-0">New Project</h6>
          <p class="mb-0 text-sm">Create new project</p>
          <hr class="my-3 horizontal dark" />
          <label for="projectName" class="form-label">Project Name</label>
          <input id="projectName" type="text" class="form-control" />
          <div class="mt-4 row">
            <div class="col-12 col-md-6">
              <div class="form-group">
                <label> Private Project </label>
                <p class="text-xs form-text text-muted ms-1">
                  If you are available for hire outside of the current
                  situation, you can encourage others to hire you.
                </p>
                <div class="form-check form-switch ms-1">
                  <input
                    id="flexSwitchCheckDefault"
                    class="form-check-input"
                    type="checkbox"
                    onclick="notify(this)"
                    data-type="warning"
                    data-content="Once a project is made private, you cannot revert it to a public project."
                    data-title="Warning"
                    data-icon="ni ni-bell-55"
                  />
                  <label
                    class="form-check-label"
                    for="flexSwitchCheckDefault"
                  ></label>
                </div>
              </div>
            </div>
          </div>
          <label class="mt-4">Project Description</label>
          <p class="text-xs form-text text-muted ms-1">
            This is how others will learn about the project, so make it good!
          </p>
          <div id="editor">
            <p>Hello World!</p>
            <p>Some initial <strong>bold</strong> text</p>
            <p><br /></p>
          </div>
          <label class="mt-4 form-label">Project Tags</label>
          <select
            id="choices-multiple-remove-button"
            class="form-control"
            name="choices-multiple-remove-button"
            multiple
          >
            <option value="Choice 1" selected>Choice 1</option>
            <option value="Choice 2">Choice 2</option>
            <option value="Choice 3">Choice 3</option>
            <option value="Choice 4">Choice 4</option>
          </select>
          <div class="row">
            <div class="col-6">
              <label class="form-label">Start Date</label>
              <flat-pickr
                v-model="date"
                class="form-control datetimepicker"
                placeholder="Please select start date"
                :config="config"
              ></flat-pickr>
            </div>
            <div class="col-6">
              <label class="form-label">End Date</label>
              <flat-pickr
                v-model="endDate"
                class="form-control datetimepicker"
                placeholder="Please select end date"
                :config="config"
              ></flat-pickr>
            </div>
          </div>
          <label class="mt-4 form-label">Starting Files</label>
          <form
            id="dropzone"
            action="/file-upload"
            class="form-control dropzone"
          >
            <div class="fallback">
              <input name="file" type="file" multiple />
            </div>
          </form>
          <div class="mt-4 d-flex justify-content-end">
            <button type="button" name="button" class="m-0 btn btn-light">
              Cancel
            </button>
            <button
              type="button"
              name="button"
              class="m-0 btn bg-gradient-success ms-2"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import flatPickr from "vue-flatpickr-component";
import Dropzone from "dropzone";
import Choices from "choices.js";
import Quill from "quill";

export default {
  name: "NewProject",
  components: {
    flatPickr,
  },
  data() {
    return {
      date: "",
      endDate: "",
      config: {
        allowInput: true,
      },
    };
  },
  mounted() {
    if (document.getElementById("editor")) {
      new Quill("#editor", {
        theme: "snow", // Specify theme in configuration
      });
    }

    if (document.getElementById("choices-multiple-remove-button")) {
      var element = document.getElementById("choices-multiple-remove-button");
      const example = new Choices(element, {
        removeItemButton: true,
      });

      example.setChoices(
        [
          {
            value: "One",
            label: "Label One",
            disabled: true,
          },
          {
            value: "Two",
            label: "Label Two",
            selected: true,
          },
          {
            value: "Three",
            label: "Label Three",
          },
        ],
        "value",
        "label",
        false
      );
    }

    Dropzone.autoDiscover = false;
    var drop = document.getElementById("dropzone");
    new Dropzone(drop, {
      url: "/file/post",
      addRemoveLinks: true,
    });
  },
};
</script>
