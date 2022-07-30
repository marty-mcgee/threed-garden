<template>
  <div class="card">
    <div class="p-3 pb-0 card-header">
      <div class="row">
        <div class="col-8 d-flex">
          <div>
            <img
              src="../../../../assets/img/team-3.jpg"
              class="avatar avatar-sm me-2"
              alt="avatar image"
            />
          </div>
          <div class="d-flex flex-column justify-content-center">
            <h6 class="mb-0 text-sm">Lucas Prila</h6>
            <p class="text-xs">2h ago</p>
          </div>
        </div>
        <div class="col-4">
          <span class="badge bg-gradient-info ms-auto float-end"
            >Recommendation</span
          >
        </div>
      </div>
    </div>
    <div class="p-3 pt-1 card-body">
      <h6>I need a Ruby developer for my new website.</h6>
      <p class="text-sm">
        The website was initially built in PHP, I need a professional ruby
        programmer to shift it.
      </p>
      <div class="p-3 bg-gray-100 d-flex border-radius-lg">
        <h4 class="my-auto">
          <span class="text-sm text-secondary me-1">$</span>3,000<span
            class="text-sm text-secondary ms-1"
            >/ month
          </span>
        </h4>
        <a href="javascript:;" class="mb-0 btn btn-outline-dark ms-auto"
          >Apply</a
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "job-card",
};
</script>
