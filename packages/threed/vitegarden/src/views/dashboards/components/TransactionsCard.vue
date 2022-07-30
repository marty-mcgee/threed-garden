<template>
  <div class="card h-100">
    <div class="p-3 pb-0 card-header">
      <div class="row">
        <div class="col-md-6">
          <h6 class="mb-0">Transactions</h6>
        </div>
        <div class="col-md-6 d-flex justify-content-end align-items-center">
          <i class="far fa-calendar-alt me-2"></i>
          <small>23 - 30 March 2021</small>
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
                class="p-3 mb-0 btn btn-icon-only btn-rounded btn-outline-danger me-3 btn-sm d-flex align-items-center justify-content-center"
              >
                <i class="fas fa-arrow-down"></i>
              </button>
              <div class="d-flex flex-column">
                <h6 class="mb-1 text-sm text-dark">Netflix</h6>
                <span class="text-xs">27 March 2020, at 12:30 PM</span>
              </div>
            </div>
            <div
              class="text-sm d-flex align-items-center text-danger text-gradient font-weight-bold ms-auto"
            >
              - $ 2,500
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
                <h6 class="mb-1 text-sm text-dark">Apple</h6>
                <span class="text-xs">23 March 2020, at 04:30 AM</span>
              </div>
            </div>
            <div
              class="text-sm d-flex align-items-center text-success text-gradient font-weight-bold ms-auto"
            >
              + $ 2,000
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
                class="p-3 mb-0 btn btn-icon-only btn-rounded btn-outline-success me-3 btn-sm d-flex align-items-center justify-content-center"
              >
                <i class="fas fa-arrow-up"></i>
              </button>
              <div class="d-flex flex-column">
                <h6 class="mb-1 text-sm text-dark">Partner #22213</h6>
                <span class="text-xs">19 March 2020, at 02:50 AM</span>
              </div>
            </div>
            <div
              class="text-sm d-flex align-items-center text-success text-gradient font-weight-bold ms-auto"
            >
              + $ 1,400
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "transactions-card",
};
</script>
