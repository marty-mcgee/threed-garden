<template>
  <div class="card bg-gradient-dark">
    <div class="bg-transparent card-header">
      <div class="row">
        <div class="col-lg-4 col-md-6 col-12">
          <div class="input-group input-group-lg">
            <span class="text-white bg-transparent border-0 input-group-text">
              <i class="text-lg ni ni-zoom-split-in" aria-hidden="true"></i>
            </span>
            <input
              type="text"
              class="bg-transparent border-0 form-control"
              placeholder="Search anything..."
              onfocus="focused(this)"
              onfocusout="defocused(this)"
            />
          </div>
        </div>
        <div class="my-auto col-lg-6 col-md-6 col-12 ms-auto">
          <div class="d-flex align-items-center">
            <i
              class="text-lg text-white ni ni-headphones ms-auto"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Headphones connected"
            ></i>
            <i
              class="text-lg text-white ni ni-button-play ms-3"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Music is playing"
            ></i>
            <i
              class="text-lg text-white ni ni-button-power ms-3"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Start radio"
            ></i>
            <i
              class="text-lg text-white ni ni-watch-time ms-3"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Time tracker"
            ></i>
            <h4 class="mb-1 text-white ms-4">10:45</h4>
          </div>
        </div>
      </div>
      <hr class="horizontal light" />
      <div class="row">
        <div class="col-lg-4 col-md-6 col-12">
          <div class="d-flex align-items-center position-relative">
            <h3 class="mb-1 text-white">11:13</h3>
            <p class="mb-1 text-white opacity-8 ms-3">Estimated arrival time</p>
            <hr class="mt-0 vertical light" />
          </div>
        </div>
        <div class="col-lg-4 col-md-6 col-12">
          <div class="d-flex align-items-center position-relative">
            <h3 class="mb-1 text-white ms-auto">
              2.4<small class="text-sm align-top">Km</small>
            </h3>
            <p class="mb-1 text-white opacity-8 ms-3 me-auto">
              Turn right in 2.4 miles
            </p>
            <hr class="mt-0 vertical light" />
          </div>
        </div>
        <div class="col-lg-4 col-md-6 col-12 ms-lg-auto">
          <div class="d-flex align-items-center">
            <h3 class="mb-1 text-white ms-lg-auto">
              6.3<small class="text-sm align-top">Km</small>
            </h3>
            <p class="mb-1 text-white opacity-8 ms-3">
              Distance to Creative Tim
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="px-0 py-0 card-body">
      <div id="mapid" class="leaflet"></div>
    </div>
    <div class="card-footer">
      <div class="row">
        <div class="col-lg-4 col-md-6 col-12">
          <div class="d-flex align-items-center">
            <div class="position-relative">
              <div class="avatar avatar-lg">
                <img
                  src="@\assets\img\curved-images\curved10.jpg"
                  alt="kal"
                  class="shadow border-radius-xl rounded-circle"
                />
              </div>
              <img
                class="bottom-0 mb-0 position-absolute w-60 end-0 me-n3"
                src="@/assets/img/small-logos/logo-spotify.svg"
                alt="spotify logo"
              />
            </div>
            <div class="px-3">
              <p class="mb-0 text-sm text-white font-weight-bold">
                You're Mines Still (feat Drake)
              </p>
              <p class="mb-2 text-xs text-white opacity-8">
                Yung Bleu - Hip-Hop
              </p>
            </div>
          </div>
        </div>
        <div class="my-auto mt-3 text-center col-lg-4 col-md-6 col-12 mt-lg-0">
          <div class="d-flex align-items-center">
            <button
              class="mb-0 btn btn-lg btn-icon-only btn-rounded btn-outline-white ms-auto"
            >
              <i
                class="top-0 rotate-180 ni ni-button-play"
                aria-hidden="true"
              ></i>
            </button>
            <button
              class="mb-0 btn btn-lg btn-icon-only btn-rounded btn-outline-white ms-4"
            >
              <i class="top-0 ni ni-button-pause" aria-hidden="true"></i>
            </button>
            <button
              class="mb-0 btn btn-lg btn-icon-only btn-rounded btn-outline-white ms-4 me-auto"
            >
              <i class="top-0 ni ni-button-play" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="my-auto col-lg-2 col-md-6 col-8">
          <p class="mb-2 text-white">Volume</p>
          <div id="sliderRegular"></div>
        </div>
        <div class="my-auto col-lg-1 col-md-6 col-4 ms-auto">
          <i
            class="mt-3 text-white ni ni-bullet-list-67 ms-auto"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Hide menu"
          ></i>
          <i
            class="mt-3 text-white ni ni-chat-round ms-3"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Track messages"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default {
  name: "CardPlayer",
  data() {
    return {
      map: null,
      tiles: [],
    };
  },
  mounted() {
    // Initialize the map and assign it to a variable for later use
    // there's a few ways to declare a VARIABLE in javascript.
    // you might also see people declaring variables using `const` and `let`
    this.map = L.map("mapid", {
      // Set latitude and longitude of the map center (required)
      center: [38.89, -77.03],
      // Set the initial zoom level, values 0-18, where 0 is most zoomed-out (required)
      zoom: 11,
    });

    // Create a Tile Layer and add it to the map
    this.tiles = new L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: "19",
      }
    ).addTo(this.map);
  },
};
</script>
