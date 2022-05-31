<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-7 position-relative z-index-2">
        <div class="mb-4 card card-plain">
          <div class="p-3 card-body">
            <div class="row">
              <div class="col-lg-6">
                <div class="d-flex flex-column h-100">
                  <h2 class="mb-0 font-weight-bolder">General Statistics</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-lg-5 col-sm-5">
            <mini-statistics-card
              title="Today's Money"
              value="$53,000"
              :percentage="{
                value: '+55%',
                color: 'text-success',
              }"
              :icon="{
                component: 'ni ni-money-coins',
                background: iconBackground,
              }"
              direction-reverse
            />
            <mini-statistics-card
              title="Today's Users"
              value="2,300"
              :percentage="{
                value: '+3%',
                color: 'text-success',
              }"
              :icon="{
                component: 'ni ni-world',
                background: iconBackground,
              }"
              direction-reverse
            />
          </div>
          <div class="mt-4 col-lg-5 col-sm-5 mt-sm-0">
            <mini-statistics-card
              title="New Clients"
              value="+3,462"
              :percentage="{
                value: '-2%',
                color: 'text-danger',
              }"
              :icon="{
                component: 'ni ni-paper-diploma',
                background: iconBackground,
              }"
              direction-reverse
            />

            <mini-statistics-card
              title="Sales"
              value="$103,430"
              :percentage="{
                value: '+5%',
                color: 'text-success',
              }"
              :icon="{
                component: 'ni ni-cart',
                background: iconBackground,
              }"
              direction-reverse
            />
          </div>
        </div>
        <div class="row">
          <sales-table
            title="Sales by Country"
            :rows="[
              {
                country: [US, 'United States'],
                sales: 2500,
                value: '$230,900',
                bounce: '29.9%',
              },
              {
                country: [DE, 'Germany'],
                sales: '3.900',
                value: '$440,000',
                bounce: '40.22%',
              },
              {
                country: [GB, 'Great Britain'],
                sales: '1.400',
                value: '$190,700',
                bounce: '23.44%',
              },
              {
                country: [BR, 'Brasil'],
                sales: 562,
                value: '$143,960',
                bounce: '32.14%',
              },
            ]"
          />
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="mb-4 col-lg-5 mb-lg-0">
        <div class="card z-index-2">
          <div class="p-3 card-body">
            <reports-bar-chart
              id="chart-bar"
              title="active Users"
              description="(<strong>+23%</strong>) than last week"
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
                datasets: {
                  label: 'Sales',
                  data: [450, 200, 100, 220, 500, 100, 400, 230, 500],
                },
              }"
              :items="[
                {
                  icon: {
                    color: 'primary',
                    component: faUsers,
                  },
                  label: 'users',
                  progress: { content: '37K', percentage: 60 },
                },
                {
                  icon: { color: 'info', component: faHandPointer },
                  label: 'clicks',
                  progress: { content: '2m', percentage: 90 },
                },
                {
                  icon: { color: 'warning', component: faCreditCard },
                  label: 'Sales',
                  progress: { content: '435$', percentage: 30 },
                },
                {
                  icon: { color: 'danger', component: faScrewdriverWrench },
                  label: 'Items',
                  progress: { content: '43', percentage: 50 },
                },
              ]"
            >
            </reports-bar-chart>
          </div>
        </div>
      </div>
      <div class="col-lg-7">
        <!-- line chart -->
        <div class="card z-index-2">
          <gradient-line-chart
            id="chart-line"
            title="Gradient Line Chart"
            description="<i class='fa fa-arrow-up text-success'></i>
      <span class='font-weight-bold'>4% more</span> in 2021"
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
                  label: 'Mobile Apps',
                  data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
                },
                {
                  label: 'Websites',
                  data: [30, 90, 40, 140, 290, 290, 340, 230, 400],
                },
              ],
            }"
          />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <!-- globe -->
        <globe width="700" height="600" />
      </div>
    </div>
  </div>
</template>
<script>
import MiniStatisticsCard from "../../examples/Cards/MiniStatisticsCard.vue";
import ReportsBarChart from "../../examples/Charts/ReportsBarChart.vue";
import GradientLineChart from "../../examples/Charts/GradientLineChart.vue";
import SalesTable from "./components/SalesTable.vue";
import US from "@/assets/img/icons/flags/US.png";
import DE from "@/assets/img/icons/flags/DE.png";
import GB from "@/assets/img/icons/flags/GB.png";
import BR from "@/assets/img/icons/flags/BR.png";

import Globe from "../../examples/Globe.vue";
import {
  faHandPointer,
  faUsers,
  faCreditCard,
  faScrewdriverWrench,
} from "@fortawesome/free-solid-svg-icons";

export default {
  name: "DashboardDefault",
  components: {
    MiniStatisticsCard,
    ReportsBarChart,
    GradientLineChart,
    SalesTable,
    Globe,
  },
  data() {
    return {
      faHandPointer,
      faUsers,
      faCreditCard,
      faScrewdriverWrench,
      iconBackground: "bg-gradient-success",
      US,
      DE,
      BR,
      GB,
    };
  },
};
</script>
