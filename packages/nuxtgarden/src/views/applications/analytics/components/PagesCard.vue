<template>
  <div class="mt-4 card h-100 mt-md-0">
    <div class="p-3 pb-0 card-header">
      <div class="d-flex align-items-center">
        <h6>Pages</h6>
        <button
          type="button"
          class="mb-0 btn btn-icon-only btn-rounded btn-outline-success ms-2 btn-sm d-flex align-items-center justify-content-center ms-auto"
          data-bs-toggle="tooltip"
          data-bs-placement="bottom"
          title="Data is based from sessions and is 100% accurate"
        >
          <i class="fas fa-check"></i>
        </button>
      </div>
    </div>
    <div class="px-3 pt-0 pb-2 card-body">
      <div class="p-0 table-responsive">
        <table class="table mb-0 align-items-center justify-content-center">
          <thead>
            <tr>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Page
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Page Views
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Avg. Time
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Bounce Rate
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <p class="mb-0 text-sm font-weight-bold">1. /bits</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">345</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">00:17:07</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">40.91%</p>
              </td>
            </tr>
            <tr>
              <td>
                <p class="mb-0 text-sm font-weight-bold">
                  2. /pages/argon-dashboard
                </p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">520</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">00:23:13</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">30.14%</p>
              </td>
            </tr>
            <tr>
              <td>
                <p class="mb-0 text-sm font-weight-bold">
                  3. /pages/soft-ui-dashboard
                </p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">122</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">00:3:10</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">54.10%</p>
              </td>
            </tr>
            <tr>
              <td>
                <p class="mb-0 text-sm font-weight-bold">
                  4. /bootstrap-themes
                </p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">1,900</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">00:30:42</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">20.93%</p>
              </td>
            </tr>
            <tr>
              <td>
                <p class="mb-0 text-sm font-weight-bold">5. /react-themes</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">1,442</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">00:31:50</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">34.98%</p>
              </td>
            </tr>
            <tr>
              <td>
                <p class="mb-0 text-sm font-weight-bold">
                  6. /product/argon-dashboard-angular
                </p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">201</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">00:12:42</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">21.4%</p>
              </td>
            </tr>
            <tr>
              <td>
                <p class="mb-0 text-sm font-weight-bold">
                  7. /product/material-dashboard-pro
                </p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">2,115</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">00:50:11</p>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">34.98%</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PagesCard",
};
</script>
