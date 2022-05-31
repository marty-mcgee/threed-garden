<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-12 ms-auto">
        <div class="mb-4 d-flex">
          <div class="mt-1 pe-4 position-relative ms-auto">
            <p class="mb-2 text-xs text-secondary font-weight-bold">
              Team members:
            </p>
            <div class="d-flex align-items-center justify-content-center">
              <div class="avatar-group">
                <a
                  href="javascript:;"
                  class="avatar avatar-sm rounded-circle"
                  data-bs-toggle="tooltip"
                  title="Jessica Rowland"
                >
                  <img
                    alt="Image placeholder"
                    src="../../assets/img/team-1.jpg"
                    class=""
                  />
                </a>
                <a
                  href="javascript:;"
                  class="avatar avatar-sm rounded-circle"
                  data-bs-toggle="tooltip"
                  title="Audrey Love"
                >
                  <img
                    alt="Image placeholder"
                    src="../../assets/img/team-2.jpg"
                    class="rounded-circle"
                  />
                </a>
                <a
                  href="javascript:;"
                  class="avatar avatar-sm rounded-circle"
                  data-bs-toggle="tooltip"
                  title="Michael Lewis"
                >
                  <img
                    alt="Image placeholder"
                    src="../../assets/img/team-3.jpg"
                    class="rounded-circle"
                  />
                </a>
                <a
                  href="javascript:;"
                  class="avatar avatar-sm rounded-circle"
                  data-bs-toggle="tooltip"
                  title="Lucia Linda"
                >
                  <img
                    alt="Image placeholder"
                    src="../../assets/img/team-4.jpg"
                    class="rounded-circle"
                  />
                </a>
                <a
                  href="javascript:;"
                  class="avatar avatar-sm rounded-circle"
                  data-bs-toggle="tooltip"
                  title="Ronald Miller"
                >
                  <img
                    alt="Image placeholder"
                    src="../../assets/img/team-5.jpg"
                    class="rounded-circle"
                  />
                </a>
              </div>
            </div>
            <hr class="mt-0 vertical dark" />
          </div>
          <div class="ps-4">
            <button
              class="mt-3 mb-0 btn btn-outline-dark btn-icon-only"
              data-bs-toggle="modal"
              data-target="#new-board-modal"
            >
              <i class="fa fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="col-xl-9">
        <div class="card card-calendar">
          <div class="p-3 card-body"><Calendar /></div>
        </div>
      </div>
      <div class="col-xl-3">
        <div class="row">
          <div class="mt-4 col-xl-12 col-md-6 mt-xl-0">
            <events-card
              :events="[
                {
                  icon: 'money-coins',
                  color: 'danger',
                  event: 'Cyber Week',
                  date: '27 March 2021, at 12:30 PM',
                },
                {
                  icon: 'bell-55',
                  color: 'primary',
                  event: 'Meeting with Marry',
                  date: '24 March 2021, at 10:00 PM',
                },
                {
                  icon: 'books',
                  color: 'success',
                  event: 'Book Deposit Hall',
                  date: '25 March 2021, at 9:30 AM',
                },
                {
                  icon: 'delivery-fast',
                  color: 'warning',
                  event: 'Shipment Deal UK',
                  date: '25 March 2021, at 2:00 PM',
                },
                {
                  icon: 'palette',
                  color: 'info',
                  event: 'Verify Dashboard Color Palette',
                  date: '26 March 2021, at 9:00 AM',
                },
              ]"
            />
          </div>
          <div class="mt-4 col-xl-12 col-md-6">
            <div class="card bg-gradient-dark">
              <div class="p-3 pb-0 bg-transparent card-header">
                <div class="row">
                  <div class="col-7">
                    <h6 class="mb-0 text-white">Productivity</h6>
                    <p class="text-sm text-white">
                      <i
                        class="fa fa-arrow-up text-success"
                        aria-hidden="true"
                      ></i>
                      <span class="font-weight-bold">4% more</span> in 2021
                    </p>
                  </div>
                  <div class="col-5 text-end">
                    <div class="dropdown me-3">
                      <a
                        id="dropdownTable"
                        class="cursor-pointer"
                        href="javascript:;"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        role="button"
                      >
                        <i
                          class="text-white fa fa-ellipsis-h"
                          aria-hidden="true"
                        ></i>
                      </a>
                      <ul
                        class="px-2 py-3 dropdown-menu dropdown-menu-end ms-n5"
                        aria-labelledby="dropdownTable"
                        data-popper-placement="bottom-start"
                      >
                        <li>
                          <a
                            class="dropdown-item border-radius-md"
                            href="javascript:;"
                            >Action</a
                          >
                        </li>
                        <li>
                          <a
                            class="dropdown-item border-radius-md"
                            href="javascript:;"
                            >Another action</a
                          >
                        </li>
                        <li>
                          <a
                            class="dropdown-item border-radius-md"
                            href="javascript:;"
                            >Something else here</a
                          >
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div class="p-0 card-body">
                <mini-line-chart
                  :chart="{
                    labels: [
                      'Apr',
                      'May',
                      'Jun',
                      'Jul',
                      'Aug',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dec',
                    ],
                    datasets: [
                      {
                        label: 'Visitors',
                        data: [50, 45, 60, 60, 80, 65, 90, 80, 100],
                      },
                    ],
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EventsCard from "./components/EventsCard.vue";
import MiniLineChart from "./components/MiniLineChart.vue";
import Calendar from "../../examples/Calendar.vue";

export default {
  name: "CalendarApp",
  components: { Calendar, EventsCard, MiniLineChart },
};
</script>
