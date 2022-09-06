<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-xl-7">
        <div class="card">
          <div class="p-3 pb-0 card-header d-flex">
            <h6 class="my-auto">Cameras</h6>
            <div class="nav-wrapper position-relative ms-auto w-50">
              <ul class="p-1 nav nav-pills nav-fill" role="tablist">
                <li class="nav-item">
                  <a
                    class="px-0 py-1 mb-0 nav-link active"
                    data-bs-toggle="tab"
                    href="#cam1"
                    role="tab"
                    aria-controls="cam1"
                    aria-selected="true"
                  >Garden 1</a>
                </li>
                <li class="nav-item">
                  <a
                    class="px-0 py-1 mb-0 nav-link"
                    data-bs-toggle="tab"
                    href="#cam2"
                    role="tab"
                    aria-controls="cam2"
                    aria-selected="false"
                  >Garden 2</a>
                </li>
                <li class="nav-item">
                  <a
                    class="px-0 py-1 mb-0 nav-link"
                    data-bs-toggle="tab"
                    href="#cam3"
                    role="tab"
                    aria-controls="cam3"
                    aria-selected="false"
                  >Garden 3</a>
                </li>
              </ul>
            </div>
            <div class="pt-2 dropdown">
              <a
                id="dropdownCam"
                href="#"
                class="text-secondary ps-4"
                :class="{ show: showMenu }"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                @click="showMenu = !showMenu"
              >
                <i class="fas fa-ellipsis-v"></i>
              </a>
              <ul
                class="px-2 py-3 dropdown-menu dropdown-menu-end me-sm-n4"
                :class="{ show: showMenu }"
                aria-labelledby="dropdownCam"
              >
                <li>
                  <a class="dropdown-item border-radius-md" href="#">Pause</a>
                </li>
                <li>
                  <a class="dropdown-item border-radius-md" href="#">Stop</a>
                </li>
                <li>
                  <a class="dropdown-item border-radius-md" href="#">Schedule</a>
                </li>
                <li>
                  <hr class="dropdown-divider" />
                </li>
                <li>
                  <a class="dropdown-item border-radius-md text-danger" href="#">Remove</a>
                </li>
              </ul>
            </div>
          </div>
          <div class="p-3 mt-2 card-body">
            <div id="v-pills-tabContent" class="tab-content">
              <div
                id="cam1"
                class="tab-pane fade show position-relative active height-400 border-radius-lg"
                role="tabpanel"
                aria-labelledby="cam1"
                :style="{
                  backgroundImage:
                    `url(${bgImg1})`,
                  backgroundSize: 'cover',
                
                }"
              >
                <div class="top-0 position-absolute d-flex w-100">
                  <p class="p-3 mb-0 text-white">{{ dateCurrent }}</p>
                  <div class="p-3 ms-auto">
                    <span class="badge badge-secondary">
                      <i class="fas fa-dot-circle text-danger"></i>
                      Recording
                    </span>
                  </div>
                </div>
              </div>
              <div
                id="cam2"
                class="tab-pane fade position-relative height-400 border-radius-lg"
                role="tabpanel"
                aria-labelledby="cam2"
                :style="{
                  backgroundImage: `url(${bgImg2})`,
                  backgroundSize: 'cover',
                }"
              >
                <div class="top-0 position-absolute d-flex w-100">
                  <p class="p-3 mb-0 text-white">17.05.2021 4:35PM</p>
                  <div class="p-3 ms-auto">
                    <span class="badge badge-secondary">
                      <i class="fas fa-dot-circle text-danger"></i>
                      Recording
                    </span>
                  </div>
                </div>
              </div>
              <div
                id="cam3"
                class="tab-pane fade position-relative height-400 border-radius-lg"
                role="tabpanel"
                aria-labelledby="cam3"
                :style="{
                  backgroundImage:
                    `url(${bgImg3})`,
                  backgroundSize: 'cover',
                }"
              >
                <div class="top-0 position-absolute d-flex w-100">
                  <p class="p-3 mb-0 text-white">17.05.2021 4:57PM</p>
                  <div class="p-3 ms-auto">
                    <span class="badge badge-secondary">
                      <i class="fas fa-dot-circle text-danger"></i>
                      Recording
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 col-xl-5 ms-auto mt-xl-0">
        <div class="row">
          <div class="col-12">
            <div class="card bg-gradient-success">
              <div class="p-3 card-body">
                <div class="row">
                  <div class="my-auto col-8">
                    <div class="numbers">
                      <p
                        class="mb-0 text-sm text-white text-capitalize font-weight-bold opacity-7"
                      >Weather Now</p>
                      <h5 class="mb-0 text-white font-weight-bolder">Fort Bragg: 72°F</h5>
                    </div>
                  </div>
                  <div class="col-4 text-end">
                    <img
                      class="w-50"
                      src="@/assets/img/small-logos/icon-sun-cloud.png"
                      alt="image sun"
                    />
                    <h5 class="mb-0 text-white text-end me-1">Cloudy</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 row">
          <div class="col-md-6">
            <temperature-card
              id="status1"
              status="77 "
              unit=" °F"
              title="Garden"
              desc="Temperature"
            />
          </div>
          <div class="mt-4 col-md-6 mt-md-0">
            <temperature-card id="status2" status="44 " unit=" %" title="Outside" desc="Humidity" />
          </div>
        </div>
        <div class="mt-4 row">
          <div class="col-md-6">
            <temperature-card
              id="status3"
              status="16 "
              unit=" m³"
              title="Water"
              desc="Consumption"
            />
          </div>
          <div class="mt-4 col-md-6 mt-md-0">
            <temperature-card
              id="status4"
              status="121 "
              unit=" MB"
              title="Internet"
              desc="All Devices"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-6 ms-auto">
        <consumption-room-chart />
      </div>
      <div class="mt-4 col-lg-6 mt-lg-0">
        <div class="row">
          <div class="col-sm-6">
            <consumption-day-chart />
          </div>
          <div class="mt-4 col-sm-6 mt-sm-0">
            <div class="card h-100">
              <div class="p-3 text-center card-body">
                <h6 class="text-start">Device Limit</h6>

                <h4 class="font-weight-bold mt-n7">
                  <span id="value" class="text-dark">21</span>
                  <span class="text-body">°F</span>
                </h4>
                <p class="mt-5 mb-0 ps-1">
                  <span class="text-xs">56 °F</span>
                  <span class="px-3">&lt; Temperature &gt;</span>
                  <span class="text-xs">88 °F</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <hr class="my-5 horizontal dark" />
    <div class="row">
      <div class="col-lg-2 col-sm-6">
        <switch-card
          state="Off"
          state-text="Humidity"
          state-description="Inactive since: 2 days"
          class-custom="mt-4"
        >
          <template #icon>
            <icon name="humidity" />
          </template>
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-lg-0">
        <switch-card
          state="On"
          state-text="Temperature"
          state-description="Active"
          is-checked="true"
          class="text-white bg-gradient-success"
          class-custom="mt-2"
        >
          <template #icon>
            <icon name="temperature" />
          </template>
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-lg-0">
        <switch-card
          state="Off"
          state-text="Airflow Fan"
          state-description="Inactive since: 1 hour"
          class-custom="mt-4"
        >
          <template #icon>
            <icon name="air" />
          </template>
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-lg-0">
        <switch-card
          state="Off"
          state-text="Lights"
          state-description="Inactive since: 27 min"
          class-custom="mt-4"
        >
          <template #icon>
            <icon name="lights" />
          </template>
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-lg-0">
        <switch-card
          state="On"
          state-text="Wi-fi"
          state-description="Active"
          is-checked="true"
          class="text-white bg-gradient-success"
          class-custom="mt-4"
        >
          <template #icon>
            <icon name="wifi" />
          </template>
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-sm-0">
        <div class="card h-100">
          <div class="text-center card-body d-flex flex-column justify-content-center">
            <a href="javascript:">
              <i class="mb-3 fa fa-plus text-secondary" aria-hidden="true"></i>
              <h5 class="text-secondary">New device</h5>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ConsumptionRoomChart from "@/components/sections/Charts/ConsumptionRoomChart.vue"
import ConsumptionDayChart from "@/components/sections/Charts/ConsumptionDayChart.vue"
import TemperatureCard from "@/components/sections/Cards/TempCard.vue"
import SwitchCard from "@/components/sections/Cards/SwitchCard.vue"
import Icon from "@/components/vitesoft/Icon.vue"
import bgImg1 from '@/assets/img/bg-smart-home-1.jpg'
import bgImg2 from '@/assets/img/bg-smart-home-2.jpg'
import bgImg3 from '@/assets/img/home-decor-3.jpg'

import setNavPills from "@/assets/js/nav-pills.js"
import setTooltip from "@/assets/js/tooltip.js"

export default {
  name: "SmartHome",
  components: {
    TemperatureCard,
    ConsumptionRoomChart,
    ConsumptionDayChart,
    SwitchCard,
    Icon,
  },
  data() {
    const dateCurrent = Date().toLocaleString()
    return {
      showMenu: false,
      bgImg1,
      bgImg2,
      bgImg3,
      dateCurrent
    }
  },
  mounted() {
    setNavPills()
    setTooltip()
    // Rounded slider
    const setValue = function (value, active) {
      document.querySelectorAll("round-slider").forEach(function (el) {
        if (el.value === undefined) return
        el.value = value
      })
      const span = document.querySelector("#value")
      span.innerHTML = value
      if (active) span.style.color = "red"
      else span.style.color = "black"
    }

    document.querySelectorAll("round-slider").forEach(function (el) {
      el.addEventListener("value-changed", function (ev) {
        if (ev.detail.value !== undefined) setValue(ev.detail.value, false)
        // eslint-disable-next-line no-undef
        else if (ev.detail.low !== undefined) setLow(ev.detail.low, false)
        // eslint-disable-next-line no-undef
        else if (ev.detail.high !== undefined) setHigh(ev.detail.high, false)
      })

      el.addEventListener("value-changing", function (ev) {
        if (ev.detail.value !== undefined) setValue(ev.detail.value, true)
        // eslint-disable-next-line no-undef
        else if (ev.detail.low !== undefined) setLow(ev.detail.low, true)
        // eslint-disable-next-line no-undef
        else if (ev.detail.high !== undefined) setHigh(ev.detail.high, true)
      })
    })
  },
}
</script>
