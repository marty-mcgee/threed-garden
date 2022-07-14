<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-6 col-12 d-flex ms-auto">
        <a
          href="javascript:;"
          class="btn btn-icon btn-outline-secondary ms-auto"
        >
          <span class="btn-inner--text">Export</span>
          <span class="btn-inner--icon ms-2"
            ><i class="ni ni-folder-17"></i
          ></span>
        </a>
        <div class="dropleft ms-3">
          <button
            id="dropdownImport"
            class="btn bg-gradient-dark dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Today
          </button>
          <ul class="dropdown-menu" aria-labelledby="dropdownImport">
            <li><a class="dropdown-item" href="javascript:;">Yesterday</a></li>
            <li>
              <a class="dropdown-item" href="javascript:;">Last 7 days</a>
            </li>
            <li>
              <a class="dropdown-item" href="javascript:;">Last 30 days</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="mb-4 col-xl-3 col-sm-6 mb-xl-0">
        <card
          title="Users"
          value="930"
          percentage="+55%"
          icon-class="ni ni-circle-08"
          icon-background="bg-gradient-dark"
          content-class="ms-1"
          direction-reverse
        />
      </div>
      <div class="mb-4 col-xl-3 col-sm-6 mb-xl-0">
        <card
          title="New Users"
          value="744"
          percentage="+3%"
          icon-class="ni ni-world"
          icon-background="bg-gradient-dark"
          content-class="ms-1"
          direction-reverse
        />
      </div>
      <div class="mb-4 col-xl-3 col-sm-6 mb-xl-0">
        <card
          title="Sessions"
          value="1,414"
          percentage="-2%"
          icon-class="ni ni-watch-time"
          icon-background="bg-gradient-dark"
          content-class="ms-1"
          percentage-color="text-danger"
          direction-reverse
        />
      </div>
      <div class="col-xl-3 col-sm-6">
        <card
          title="Pages/Session"
          value="1.76"
          percentage="+5%"
          icon-class="ni ni-image"
          icon-background="bg-gradient-dark"
          content-class="ms-1"
          direction-reverse
        />
      </div>
    </div>
    <div class="row">
      <div class="col-lg-7 col-md-12">
        <div class="card">
          <div class="p-3 pb-0 card-header">
            <h6 class="mb-0">Traffic channels</h6>
            <div class="d-flex align-items-center">
              <span class="badge badge-md badge-dot me-4">
                <i class="bg-primary"></i>
                <span class="text-xs text-dark">Organic search</span>
              </span>
              <span class="badge badge-md badge-dot me-4">
                <i class="bg-dark"></i>
                <span class="text-xs text-dark">Referral</span>
              </span>
              <span class="badge badge-md badge-dot me-4">
                <i class="bg-info"></i>
                <span class="text-xs text-dark">Social media</span>
              </span>
            </div>
          </div>
          <div class="p-3 card-body">
            <div class="chart">
              <traffic-chart />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 col-lg-5 col-md-12 mt-lg-0">
        <referrals-card />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-sm-6">
        <social-card />
      </div>
      <div class="col-sm-6">
        <pages-card />
      </div>
    </div>
  </div>
</template>

<script>
import Card from "@/examples/Cards/Card.vue";
import TrafficChart from "./components/TrafficChart.vue";
import ReferralsCard from "./components/ReferralsCard.vue";
import SocialCard from "./components/SocialCard.vue";
import PagesCard from "./components/PagesCard.vue";
import setTooltip from "@/assets/js/tooltip.js";

export default {
  name: "Analytics",
  components: { Card, TrafficChart, ReferralsCard, SocialCard, PagesCard },
  mounted() {
    setTooltip();
  },
};
</script>
