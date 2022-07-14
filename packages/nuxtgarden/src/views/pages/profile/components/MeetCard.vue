<template>
  <div class="mt-4 card">
    <div class="p-3 card-body">
      <div class="d-flex">
        <div class="avatar avatar-lg">
          <img alt="Image placeholder" :src="logo" />
        </div>
        <div class="my-auto ms-2">
          <h6 class="mb-0">{{ title }}</h6>
          <p class="mb-0 text-xs">{{ time }}</p>
        </div>
      </div>
      <slot name="description" />
      <p class="mb-0">
        <b>Meeting ID:</b>
        {{ meetId }}
      </p>
      <hr class="horizontal dark" />
      <div class="d-flex">
        <button type="button" class="mb-0 btn btn-sm bg-gradient-success">Join</button>
        <div class="avatar-group ms-auto">
          <a
            href="javascript:;"
            class="avatar avatar-lg avatar-xs rounded-circle"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            :title="img1Title"
          >
            <img alt="Image placeholder" :src="img1" />
          </a>
          <a
            href="javascript:;"
            class="avatar avatar-lg avatar-xs rounded-circle"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            :title="img2Title"
          >
            <img alt="Image placeholder" :src="img2" />
          </a>
          <a
            href="javascript:;"
            class="avatar avatar-lg avatar-xs rounded-circle"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            :title="img3Title"
          >
            <img alt="Image placeholder" :src="img3" />
          </a>
          <a
            href="javascript:;"
            class="avatar avatar-lg avatar-xs rounded-circle"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            :title="img4Title"
          >
            <img alt="Image placeholder" :src="img4" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MeetCard",
  props: {
    logo: { type: String, default: "" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    time: { type: String, default: "" },
    meetId: { type: String, default: "" },
    img1: { type: String, default: "" },
    img2: { type: String, default: "" },
    img3: { type: String, default: "" },
    img4: { type: String, default: "" },
    img1Title: { type: String, default: "" },
    img2Title: { type: String, default: "" },
    img3Title: { type: String, default: "" },
    img4Title: { type: String, default: "" },
  },
};
</script>
