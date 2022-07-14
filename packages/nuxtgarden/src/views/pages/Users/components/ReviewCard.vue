<template>
  <div class="card h-100">
    <div class="card-header pb-0 p-3">
      <h6 class="mb-0">Reviews</h6>
    </div>
    <div class="card-body pb-0 p-3">
      <ul class="list-group">
        <li class="list-group-item border-0 d-flex align-items-center px-0 mb-0">
          <div class="w-100">
            <div class="d-flex mb-2">
              <span class="me-2 text-sm font-weight-bold text-capitalize">Positive reviews</span>
              <span class="ms-auto text-sm font-weight-bold">80%</span>
            </div>
            <div>
              <vsud-progress color="info" variant="gradient" percentage="80" />
            </div>
          </div>
        </li>
        <li class="list-group-item border-0 d-flex align-items-center px-0 mb-2">
          <div class="w-100">
            <div class="d-flex mb-2">
              <span class="me-2 text-sm font-weight-bold text-capitalize">Neutral reviews</span>
              <span class="ms-auto text-sm font-weight-bold">17%</span>
            </div>
            <div>
              <vsud-progress color="dark" variant="gradient" percentage="17" />
            </div>
          </div>
        </li>
        <li class="list-group-item border-0 d-flex align-items-center px-0 mb-2">
          <div class="w-100">
            <div class="d-flex mb-2">
              <span class="me-2 text-sm font-weight-bold text-capitalize">Negative reviews</span>
              <span class="ms-auto text-sm font-weight-bold">3%</span>
            </div>
            <div>
              <vsud-progress color="danger" variant="gradient" percentage="3" />
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div class="card-footer pt-0 p-3 d-flex align-items-center">
      <div class="w-60">
        <p class="text-sm">
          More than
          <b>1,500,000</b> developers used Creative Tim's products and over
          <b>700,000</b> projects were created.
        </p>
      </div>
      <div class="w-40 text-end">
        <a class="btn bg-gradient-dark mb-0 text-end" href="javascript:;">View all reviews</a>
      </div>
    </div>
  </div>
</template>

<script>
import VsudProgress from "@/components/VsudProgress.vue";

export default {
  name: "ReviewCard",
  components: {
    VsudProgress,
  },
};
</script>
