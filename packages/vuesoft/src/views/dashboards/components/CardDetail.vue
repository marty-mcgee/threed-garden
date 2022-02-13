<template>
  <div class="card bg-gradient-secondary">
    <img
      src="@/assets/img/shapes/waves-white.svg"
      alt="pattern-lines"
      class="top-0 position-absolute opacity-4 start-0 w-100"
    />
    <div class="px-5 bg-cover card-body z-index-1">
      <div class="row">
        <div class="my-auto col-lg-3 col-12">
          <h4 class="text-white opacity-9">Since Last Charge</h4>
          <hr class="mt-1 mb-3 horizontal light" />
          <div class="d-flex">
            <div>
              <h6 class="mb-0 text-white opacity-7">Distance</h6>
              <h3 class="text-white">
                145 <small class="text-sm align-top">Km</small>
              </h3>
            </div>
            <div class="ms-lg-6 ms-4">
              <h6 class="mb-0 text-white opacity-7">Average Energy</h6>
              <h3 class="text-white">
                300 <small class="text-sm align-top">Kw</small>
              </h3>
            </div>
          </div>
        </div>
        <div class="text-center col-lg-6 col-12">
          <img
            class="w-75 w-lg-auto mt-n7 mt-lg-n8 d-none d-md-block"
            src="@/assets/img/mercedes-eqc.png"
            alt="car image"
          />
          <div class="d-flex align-items-center">
            <h4 class="text-white opacity-7 ms-0 ms-md-auto">
              Available Range
            </h4>
            <h2 class="text-white ms-2 me-auto">
              70<small class="text-sm align-top"> %</small>
            </h2>
          </div>
        </div>
        <div class="my-auto col-lg-3 col-12">
          <h4 class="text-white opacity-9">Nearest Charger</h4>
          <hr class="mt-1 mb-3 horizontal light" />
          <div class="d-flex">
            <div>
              <h6 class="mb-0 text-white">Miclan, DW</h6>
              <h6 class="mb-0 text-white">891 Limarenda road</h6>
            </div>
            <div class="ms-lg-6 ms-4">
              <button
                class="mb-0 btn btn-icon-only btn-rounded btn-outline-white"
              >
                <i class="ni ni-map-big" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "card-detail",
};
</script>
