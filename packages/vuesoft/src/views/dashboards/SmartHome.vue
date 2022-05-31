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
                  >
                    Kitchen
                  </a>
                </li>
                <li class="nav-item">
                  <a
                    class="px-0 py-1 mb-0 nav-link"
                    data-bs-toggle="tab"
                    href="#cam2"
                    role="tab"
                    aria-controls="cam2"
                    aria-selected="false"
                  >
                    Living
                  </a>
                </li>
                <li class="nav-item">
                  <a
                    class="px-0 py-1 mb-0 nav-link"
                    data-bs-toggle="tab"
                    href="#cam3"
                    role="tab"
                    aria-controls="cam3"
                    aria-selected="false"
                  >
                    Attic
                  </a>
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
                  <a class="dropdown-item border-radius-md" href="#"
                    >Schedule</a
                  >
                </li>
                <li>
                  <hr class="dropdown-divider" />
                </li>
                <li>
                  <a class="dropdown-item border-radius-md text-danger" href="#"
                    >Remove</a
                  >
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
                    'url(' + require('@/assets/img/bg-smart-home-1.jpg') + ')',
                  backgroundSize: 'cover'
                }"
              >
                <div class="top-0 position-absolute d-flex w-100">
                  <p class="p-3 mb-0 text-white">17.05.2021 4:34PM</p>
                  <div class="p-3 ms-auto">
                    <span class="badge badge-secondary">
                      <i class="fas fa-dot-circle text-danger"> </i>
                      Recording</span
                    >
                  </div>
                </div>
              </div>
              <div
                id="cam2"
                class="tab-pane fade position-relative height-400 border-radius-lg"
                role="tabpanel"
                aria-labelledby="cam2"
                :style="{
                  backgroundImage:
                    'url(' + require('@/assets/img/bg-smart-home-2.jpg') + ')',
                  backgroundSize: 'cover'
                }"
              >
                <div class="top-0 position-absolute d-flex w-100">
                  <p class="p-3 mb-0 text-white">17.05.2021 4:35PM</p>
                  <div class="p-3 ms-auto">
                    <span class="badge badge-secondary">
                      <i class="fas fa-dot-circle text-danger"> </i>
                      Recording</span
                    >
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
                    'url(' + require('@/assets/img/home-decor-3.jpg') + ')',
                  backgroundSize: 'cover'
                }"
              >
                <div class="top-0 position-absolute d-flex w-100">
                  <p class="p-3 mb-0 text-white">17.05.2021 4:57PM</p>
                  <div class="p-3 ms-auto">
                    <span class="badge badge-secondary">
                      <i class="fas fa-dot-circle text-danger"> </i>
                      Recording</span
                    >
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
                      >
                        Weather today
                      </p>
                      <h5 class="mb-0 text-white font-weight-bolder">
                        San Francisco - 29 °C
                      </h5>
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
            <default-counter-card
              :count="21"
              suffix=" °C"
              title="Living Room"
              description="Temperature"
            />
          </div>
          <div class="mt-4 col-md-6 mt-md-0">
            <default-counter-card
              :count="44"
              suffix=" %"
              title="Outside"
              description="Humidity"
            />
          </div>
        </div>
        <div class="mt-4 row">
          <div class="col-md-6">
            <default-counter-card
              :count="87"
              suffix=" m³"
              title="Water"
              description="Consumption"
            />
          </div>
          <div class="mt-4 col-md-6 mt-md-0">
            <default-counter-card
              :count="417"
              suffix=" GB"
              title="Internet"
              description="All devices"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-6 ms-auto">
        <reports-doughnut-chart />
      </div>
      <div class="mt-4 col-lg-6 mt-lg-0">
        <div class="row">
          <div class="col-sm-6">
            <thin-bar-chart
              title="Consumption per day"
              :chart="{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: {
                  label: 'Watts',
                  data: [150, 230, 380, 220, 420, 200, 70, 500]
                }
              }"
            />
          </div>
          <div class="mt-4 col-sm-6 mt-sm-0">
            <div class="card h-100">
              <div
                class="p-3 text-center card-body d-flex flex-column align-items-center"
              >
                <h6 class="text-start">Device limit</h6>
                <div id="slider"></div>
                <h4 class="font-weight-bold mt-n7">
                  <span id="value" class="text-dark">21</span
                  ><span class="text-body">°C</span>
                </h4>
                <p class="mt-n2 mb-0 ps-1">
                  <span class="text-xs">16°C</span
                  ><span class="px-3">Temperature</span
                  ><span class="text-xs">38°C</span>
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
          :item="{
            state: 'Off',
            label: 'Humidity',
            description: 'Inactive since: 2 days',
            classCustom: 'mt-4'
          }"
        >
          <humidity />
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-lg-0">
        <switch-card
          :item="{
            state: 'On',
            label: 'Temperature',
            description: 'Active',
            classCustom: 'mt-2',
            isChecked: 'true'
          }"
          class="text-white bg-gradient-success"
        >
          <temperature />
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-lg-0">
        <switch-card
          :item="{
            state: 'Off',
            label: 'Air Conditioner',
            description: 'Inactive since: 1 hour',
            classCustom: 'mt-4',
            isChecked: true
          }"
        >
          <air />
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-lg-0">
        <switch-card
          :item="{
            state: 'Off',
            label: 'Lights',
            description: 'Inactive since: 27 min',
            classCustom: 'mt-4'
          }"
        >
          <lights />
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-lg-0">
        <switch-card
          :item="{
            state: 'On',
            label: 'Wi-fi',
            description: 'Active',
            classCustom: 'mt-4',
            isChecked: true
          }"
          class="text-white bg-gradient-success"
        >
          <wifi />
        </switch-card>
      </div>
      <div class="mt-4 col-lg-2 col-sm-6 mt-sm-0">
        <div class="card h-100">
          <div
            class="text-center card-body d-flex flex-column justify-content-center"
          >
            <a href="javascript:;">
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
import ReportsDoughnutChart from "@/examples/Charts/ReportsDoughnutChart.vue";
import ThinBarChart from "@/examples/Charts/ThinBarChart.vue";
import DefaultCounterCard from "@/examples/Cards/DefaultCounterCard.vue";
import SwitchCard from "@/examples/Cards/SwitchCard.vue";

import setNavPills from "@/assets/js/nav-pills.js";
import setTooltip from "@/assets/js/tooltip.js";
import Temperature from "../../components/Icon/Temperature.vue";
import Air from "../../components/Icon/Air.vue";
import Lights from "../../components/Icon/Lights.vue";
import Wifi from "../../components/Icon/Wifi.vue";
import Humidity from "../../components/Icon/Humidity.vue";
import roundSlider from "round-slider";

import $ from "jquery";
export default {
  name: "SmartHome",
  components: {
    // eslint-disable-next-line vue/no-unused-components
    roundSlider,
    DefaultCounterCard,
    ReportsDoughnutChart,
    ThinBarChart,
    SwitchCard,
    Temperature,
    Air,
    Lights,
    Wifi,
    Humidity
  },
  data() {
    return {
      showMenu: false
    };
  },
  mounted() {
    setNavPills();
    setTooltip(this.$store.state.bootstrap);

    let jq = document.createElement("script");
    jq.setAttribute("src", "https://code.jquery.com/jquery-3.2.1.js");
    document.head.appendChild(jq);

    let recaptchaScript = document.createElement("script");
    recaptchaScript.setAttribute(
      "src",
      "https://cdn.jsdelivr.net/npm/round-slider@1.6.1/dist/roundslider.min.js"
    );
    document.head.appendChild(recaptchaScript);

    $("#slider").roundSlider({
      width: 22,
      radius: 100,
      value: 45,
      readOnly: true,
      circleShape: "half-top",
      sliderType: "min-range",
      lineCap: "round",
      min: 16,
      max: 38
    });
    // Rounded slider
    const setValue = function (value, active) {
      document.querySelectorAll("round-slider").forEach(function (el) {
        if (el.value === undefined) return;
        el.value = value;
      });
      const span = document.querySelector("#value");
      span.innerHTML = value;
      if (active) span.style.color = "red";
      else span.style.color = "black";
    };

    document.querySelectorAll("round-slider").forEach(function (el) {
      el.addEventListener("value-changed", function (ev) {
        if (ev.detail.value !== undefined) setValue(ev.detail.value, false);
        // eslint-disable-next-line no-undef
        else if (ev.detail.low !== undefined) setLow(ev.detail.low, false);
        // eslint-disable-next-line no-undef
        else if (ev.detail.high !== undefined) setHigh(ev.detail.high, false);
      });

      el.addEventListener("value-changing", function (ev) {
        if (ev.detail.value !== undefined) setValue(ev.detail.value, true);
        // eslint-disable-next-line no-undef
        else if (ev.detail.low !== undefined) setLow(ev.detail.low, true);
        // eslint-disable-next-line no-undef
        else if (ev.detail.high !== undefined) setHigh(ev.detail.high, true);
      });
    });
  }
};
</script>
