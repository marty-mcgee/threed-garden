<template>
  <div class="card h-100">
    <div class="p-3 pb-0 card-header">
      <div class="row">
        <div class="col-md-6">
          <h6 class="mb-0">Revenue</h6>
        </div>
        <div class="col-md-6 d-flex justify-content-end align-items-center">
          <i class="far fa-calendar-alt me-2"></i>
          <small>01 - 07 June 2021</small>
        </div>
      </div>
    </div>
    <div class="p-3 card-body">
      <ul class="list-group">
        <li
          class="pb-0 border-0 list-group-item justify-content-between ps-0 border-radius-lg"
        >
          <div class="d-flex">
            <div class="d-flex align-items-center">
              <button
                class="p-3 mb-0 btn btn-icon-only btn-rounded btn-outline-success me-3 btn-sm d-flex align-items-center justify-content-center"
              >
                <i class="fas fa-arrow-up"></i>
              </button>
              <div class="d-flex flex-column">
                <h6 class="mb-1 text-sm text-dark">via PayPal</h6>
                <span class="text-xs">07 June 2021, at 09:00 AM</span>
              </div>
            </div>
            <div
              class="text-sm d-flex align-items-center text-success text-gradient font-weight-bold ms-auto"
            >
              + $ 4,999
            </div>
          </div>
          <hr class="mt-3 mb-2 horizontal dark" />
        </li>
        <li
          class="pb-0 border-0 list-group-item justify-content-between ps-0 border-radius-lg"
        >
          <div class="d-flex">
            <div class="d-flex align-items-center">
              <button
                class="p-3 mb-0 btn btn-icon-only btn-rounded btn-outline-success me-3 btn-sm d-flex align-items-center justify-content-center"
              >
                <i class="fas fa-arrow-up"></i>
              </button>
              <div class="d-flex flex-column">
                <h6 class="mb-1 text-sm text-dark">Partner #90211</h6>
                <span class="text-xs">07 June 2021, at 05:50 AM</span>
              </div>
            </div>
            <div
              class="text-sm d-flex align-items-center text-success text-gradient font-weight-bold ms-auto"
            >
              + $ 700
            </div>
          </div>
          <hr class="mt-3 mb-2 horizontal dark" />
        </li>
        <li
          class="mb-2 border-0 list-group-item justify-content-between ps-0 border-radius-lg"
        >
          <div class="d-flex">
            <div class="d-flex align-items-center">
              <button
                class="p-3 mb-0 btn btn-icon-only btn-rounded btn-outline-danger me-3 btn-sm d-flex align-items-center justify-content-center"
              >
                <i class="fas fa-arrow-down"></i>
              </button>
              <div class="d-flex flex-column">
                <h6 class="mb-1 text-sm text-dark">Services</h6>
                <span class="text-xs">07 June 2021, at 07:10 PM</span>
              </div>
            </div>
            <div
              class="text-sm d-flex align-items-center text-danger text-gradient font-weight-bold ms-auto"
            >
              - $ 1,800
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "RevenueCard",
};
</script>
