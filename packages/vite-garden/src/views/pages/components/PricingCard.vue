<template>
  <div class="card">
    <div class="pt-4 pb-3 text-center card-header">
      <span class="badge rounded-pill bg-light text-dark">{{ mPackage }}</span>
      <h1 class="mt-2 font-weight-bold"><small>$</small>{{ value }}</h1>
    </div>
    <div class="pt-0 text-center card-body text-lg-start">
      <div class="p-2 d-flex justify-content-lg-start justify-content-center">
        <div
          class="text-center shadow icon icon-shape icon-xs rounded-circle bg-gradient-success"
        >
          <i class="fas fa-check opacity-10"></i>
        </div>
        <div>
          <span class="ps-3">{{ numOfMembers }} team members</span>
        </div>
      </div>
      <div class="p-2 d-flex justify-content-lg-start justify-content-center">
        <div
          class="text-center shadow icon icon-shape icon-xs rounded-circle bg-gradient-success"
        >
          <i class="fas fa-check opacity-10"></i>
        </div>
        <div>
          <span class="ps-3">{{ storage }}GB Cloud storage </span>
        </div>
      </div>
      <div class="p-2 d-flex justify-content-lg-start justify-content-center">
        <div
          class="text-center shadow icon icon-shape icon-xs rounded-circle"
          :class="intHelp ? 'bg-gradient-success' : 'bg-gradient-secondary'"
        >
          <i
            class="fas"
            :class="intHelp ? 'fa-check opacity-10' : 'fa-minus'"
          ></i>
        </div>
        <div>
          <span class="ps-3">Integration help </span>
        </div>
      </div>
      <div class="p-2 d-flex justify-content-lg-start justify-content-center">
        <div
          class="text-center shadow icon icon-shape icon-xs rounded-circle"
          :class="skFiles ? 'bg-gradient-success' : 'bg-gradient-secondary'"
        >
          <i
            class="fas"
            :class="skFiles ? 'fa-check opacity-10' : 'fa-minus'"
          ></i>
        </div>
        <div>
          <span class="ps-3">Sketch Files </span>
        </div>
      </div>
      <div class="p-2 d-flex justify-content-lg-start justify-content-center">
        <div
          class="text-center shadow icon icon-shape icon-xs rounded-circle"
          :class="apiAccess ? 'bg-gradient-success' : 'bg-gradient-secondary'"
        >
          <i
            class="fas"
            :class="apiAccess ? 'fa-check opacity-10' : 'fa-minus'"
          ></i>
        </div>
        <div>
          <span class="ps-3">API Access </span>
        </div>
      </div>
      <div class="p-2 d-flex justify-content-lg-start justify-content-center">
        <div
          class="text-center shadow icon icon-shape icon-xs rounded-circle"
          :class="comDocument ? 'bg-gradient-success' : 'bg-gradient-secondary'"
        >
          <i
            class="fas"
            :class="comDocument ? 'fa-check opacity-10' : 'fa-minus'"
          ></i>
        </div>
        <div>
          <span class="ps-3">Complete documentation </span>
        </div>
      </div>
      <a
        href="javascript:;"
        class="mt-3 mb-0 btn btn-icon d-lg-block"
        :class="premium ? 'bg-gradient-success' : 'bg-gradient-dark'"
      >
        Join
        <i class="fas fa-arrow-right ms-1"></i>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: "pricing-card",
  props: {
    mPackage: {
      type: String,
      default: "Starter",
    },
    value: {
      type: String,
      default: "59",
    },
    numOfMembers:{
      type: String,
      default: "2",
    },
    storage:{
      type: String,
      default: "20",
    },
    intHelp: {
      type: Boolean,
      default: false,
    },
    skFiles: {
      type: Boolean,
      default: false,
    },
    apiAccess: {
      type: Boolean,
      default: false,
    },
    comDocument: {
      type: Boolean,
      default: false,
    },
    premium: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
