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
        <mini-statistics-card
          title="Users"
          value="930"
          :percentage="{
            value: '+55%',
            color: 'text-success'
          }"
          :icon="{
            component: 'ni ni-circle-08',
            background: 'bg-gradient-dark'
          }"
          class="ms-1"
          direction-reverse
        />
      </div>
      <div class="mb-4 col-xl-3 col-sm-6 mb-xl-0">
        <mini-statistics-card
          title="New Users"
          value="744"
          :percentage="{
            value: '+3%',
            color: 'text-success'
          }"
          :icon="{
            component: 'ni ni-world',
            background: 'bg-gradient-dark'
          }"
          class="ms-1"
          direction-reverse
        />
      </div>
      <div class="mb-4 col-xl-3 col-sm-6 mb-xl-0">
        <mini-statistics-card
          title="Sessions"
          value="1,414"
          :percentage="{
            value: '-2%',
            color: 'text-danger'
          }"
          :icon="{
            component: 'ni ni-watch-time',
            background: 'bg-gradient-dark'
          }"
          class="ms-1"
          direction-reverse
        />
      </div>
      <div class="col-xl-3 col-sm-6">
        <mini-statistics-card
          title="Pages/Session"
          value="1.76"
          :percentage="{
            value: '+5%',
            color: 'text-success'
          }"
          :icon="{
            component: 'ni ni-image',
            background: 'bg-gradient-dark'
          }"
          class="ms-1"
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
              <default-line-chart
                title="Traffic channels"
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
                    'Dec'
                  ],
                  datasets: [
                    {
                      label: 'Organic Search',
                      data: [50, 40, 300, 220, 500, 250, 400, 230, 500]
                    },
                    {
                      label: 'Referral',
                      data: [30, 90, 40, 140, 290, 290, 340, 230, 400]
                    },
                    {
                      label: 'Direct',
                      data: [40, 80, 70, 90, 30, 90, 140, 130, 200]
                    }
                  ]
                }"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 col-lg-5 col-md-12 mt-lg-0">
        <default-doughnut-chart
          title="Refferals"
          :chart="{
            labels: ['Adobe', 'Atlassian', 'Slack', 'Spotify', 'Jira'],
            datasets: [{ label: 'Referrals', data: [25, 3, 12, 7, 10] }]
          }"
          :actions="{
            route: 'https://creative-tim.com',
            label: 'See all referrals',
            color: 'secondary'
          }"
        />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-sm-6">
        <social-card
          :items="[
            {
              label: 'Facebook',
              icon: 'facebook',
              progress: 80
            },
            {
              label: 'Twitter',
              icon: 'twitter',
              progress: 40
            },
            {
              label: 'Reddit',
              icon: 'reddit',
              progress: 30
            },
            {
              label: 'Youtube',
              icon: 'youtube',
              progress: 25
            },
            {
              label: 'Slack',
              icon: 'slack',
              progress: 15
            }
          ]"
        />
      </div>
      <div class="col-sm-6">
        <pages-card
          :pages="[
            {
              url: '/bits',
              views: 345,
              time: '00:17:07',
              rate: '40.91%'
            },
            {
              url: '/pages/argon-dashboard',
              views: 520,
              time: '00:23:13',
              rate: '30.14%'
            },
            {
              url: '/pages/soft-ui-dashboard',
              views: 122,
              time: '00:3:10',
              rate: '54.10%'
            },
            {
              url: '/bootstrap-themes',
              views: '1,900',
              time: '00:30:42',
              rate: '20.93%'
            },
            {
              url: '/react-themes',
              views: '1,442',
              time: '00:31:50',
              rate: '34.98%'
            },
            {
              url: '/product/argon-dashboard-angular',
              views: 201,
              time: '00:12:42',
              rate: '21.4%'
            },
            {
              url: '/product/material-dashboard-pro',
              views: '2,115',
              time: '00:50:11',
              rate: '34.98%'
            }
          ]"
        />
      </div>
    </div>
  </div>
</template>

<script>
import MiniStatisticsCard from "@/examples/Cards/MiniStatisticsCard.vue";
import DefaultLineChart from "../../../examples/Charts/DefaultLineChart.vue";
import DefaultDoughnutChart from "./components/DefaultDoughnutChart.vue";
import SocialCard from "./components/SocialCard.vue";
import PagesCard from "./components/PagesCard.vue";
import setTooltip from "@/assets/js/tooltip.js";

import logoXd from "@/assets/img/small-logos/logo-xd.svg";
import logoAtlassian from "@/assets/img/small-logos/logo-atlassian.svg";
import logoSlack from "@/assets/img/small-logos/logo-slack.svg";
import logoSpotify from "@/assets/img/small-logos/logo-spotify.svg";
import logoJira from "@/assets/img/small-logos/logo-jira.svg";
export default {
  name: "Analytics",
  components: {
    MiniStatisticsCard,
    DefaultLineChart,
    DefaultDoughnutChart,
    SocialCard,
    PagesCard
  },
  data() {
    return {
      logoXd,
      logoAtlassian,
      logoSlack,
      logoSpotify,
      logoJira
    };
  },
  mounted() {
    setTooltip(this.$store.state.bootstrap);
  }
};
</script>
