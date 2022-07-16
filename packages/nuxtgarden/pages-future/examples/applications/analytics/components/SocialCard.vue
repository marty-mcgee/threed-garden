<template>
  <div class="card h-100">
    <div class="p-3 pb-0 card-header">
      <div class="d-flex align-items-center">
        <h6 class="mb-0">Social</h6>
        <button
          type="button"
          class="mb-0 btn btn-icon-only btn-rounded btn-outline-secondary ms-2 btn-sm d-flex align-items-center justify-content-center ms-auto"
          data-bs-toggle="tooltip"
          data-bs-placement="bottom"
          title="See how much traffic do you get from social media"
        >
          <i class="fas fa-info"></i>
        </button>
      </div>
    </div>
    <div class="p-3 card-body">
      <ul class="list-group">
        <li
          class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
        >
          <div class="w-100">
            <div class="mb-2 d-flex align-items-center">
              <a
                class="p-0 mb-0 btn btn-facebook btn-simple"
                href="javascript:;"
              >
                <i class="fab fa-facebook fa-lg"></i>
              </a>
              <span class="text-sm me-2 font-weight-bold text-capitalize ms-2"
                >Facebook</span
              >
              <span class="text-sm ms-auto font-weight-bold">80%</span>
            </div>
            <div>
              <div class="progress progress-md">
                <div
                  class="progress-bar bg-gradient-dark w-80"
                  role="progressbar"
                  aria-valuenow="60"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </li>
        <li
          class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
        >
          <div class="w-100">
            <div class="mb-2 d-flex align-items-center">
              <a
                class="p-0 mb-0 btn btn-twitter btn-simple"
                href="javascript:;"
              >
                <i class="fab fa-twitter fa-lg"></i>
              </a>
              <span class="text-sm me-2 font-weight-bold text-capitalize ms-2"
                >Twitter</span
              >
              <span class="text-sm ms-auto font-weight-bold">40%</span>
            </div>
            <div>
              <div class="progress progress-md">
                <div
                  class="w-40 progress-bar bg-gradient-dark"
                  role="progressbar"
                  aria-valuenow="40"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </li>
        <li
          class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
        >
          <div class="w-100">
            <div class="mb-2 d-flex align-items-center">
              <a class="p-0 mb-0 btn btn-reddit btn-simple" href="javascript:;">
                <i class="fab fa-reddit fa-lg"></i>
              </a>
              <span class="text-sm me-2 font-weight-bold text-capitalize ms-2"
                >Reddit</span
              >
              <span class="text-sm ms-auto font-weight-bold">30%</span>
            </div>
            <div>
              <div class="progress progress-md">
                <div
                  class="progress-bar bg-gradient-dark w-30"
                  role="progressbar"
                  aria-valuenow="30"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </li>
        <li
          class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
        >
          <div class="w-100">
            <div class="mb-2 d-flex align-items-center">
              <a
                class="p-0 mb-0 btn btn-youtube btn-simple"
                href="javascript:;"
              >
                <i class="fab fa-youtube fa-lg"></i>
              </a>
              <span class="text-sm me-2 font-weight-bold text-capitalize ms-2"
                >Youtube</span
              >
              <span class="text-sm ms-auto font-weight-bold">25%</span>
            </div>
            <div>
              <div class="progress progress-md">
                <div
                  class="progress-bar bg-gradient-dark w-25"
                  role="progressbar"
                  aria-valuenow="25"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </li>
        <li
          class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
        >
          <div class="w-100">
            <div class="mb-2 d-flex align-items-center">
              <a class="p-0 mb-0 btn btn-slack btn-simple" href="javascript:;">
                <i class="fab fa-slack fa-lg"></i>
              </a>
              <span class="text-sm me-2 font-weight-bold text-capitalize ms-2"
                >Slack</span
              >
              <span class="text-sm ms-auto font-weight-bold">15%</span>
            </div>
            <div>
              <div class="progress progress-md">
                <div
                  class="progress-bar bg-gradient-dark w-15"
                  role="progressbar"
                  aria-valuenow="15"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "SocialCard",
};
</script>
