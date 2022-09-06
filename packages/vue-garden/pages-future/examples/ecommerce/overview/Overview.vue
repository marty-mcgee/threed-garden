<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <overview-card
        v-for="(overview, index) in overviews"
        :key="index"
        :overviews="overview"
      />
    </div>
    <div class="mt-4 row">
      <div class="col-lg-4 col-sm-6">
        <channels-chart-card />
      </div>
      <div class="mt-4 col-lg-8 col-sm-6 mt-sm-0">
        <revenue-chart-card />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-8">
        <sales-chart-card />
      </div>
      <div class="mt-4 col-lg-4 mt-lg-0">
        <div class="card">
          <div class="p-3 pb-0 card-header">
            <div class="d-flex justify-content-between">
              <h6 class="mb-0">Sales by Country</h6>
            </div>
          </div>
          <div class="p-3 card-body">
            <ul class="list-group list-group-flush list my--3">
              <li
                v-for="(sale, index) in sales"
                :key="index"
                class="px-0 border-0 list-group-item"
              >
                <div class="row align-items-center">
                  <div class="col-auto">
                    <!-- Country flag -->
                    <img :src="sale.flag" alt="Country flag" />
                  </div>
                  <div class="col">
                    <p class="mb-0 text-xs font-weight-bold">Country:</p>
                    <h6 class="mb-0 text-sm">{{ sale.country }}</h6>
                  </div>
                  <div class="text-center col">
                    <p class="mb-0 text-xs font-weight-bold">Sales:</p>
                    <h6 class="mb-0 text-sm">{{ sale.sales }}</h6>
                  </div>
                  <div class="text-center col">
                    <p class="mb-0 text-xs font-weight-bold">Bounce:</p>
                    <h6 class="mb-0 text-sm">{{ sale.bounce }}</h6>
                  </div>
                </div>
                <hr class="mt-3 mb-1 horizontal dark" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-12">
        <products-card />
      </div>
    </div>
  </div>
</template>

<script>
import ChannelsChartCard from "./components/ChannelsChartCard.vue";
import RevenueChartCard from "./components/RevenueChartCard.vue";
import SalesChartCard from "./components/SalesChartCard.vue";
import ProductsCard from "./components/ProductsCard.vue";
import OverviewCard from "./components/OverviewCard.vue";
// images
import US from "@/assets/img/icons/flags/US.png";
import DE from "@/assets/img/icons/flags/DE.png";
import GB from "@/assets/img/icons/flags/GB.png";
import BR from "@/assets/img/icons/flags/BR.png";
import AU from "@/assets/img/icons/flags/AU.png";
import setTooltip from "@/assets/js/tooltip.js";


export default {
  name: "Overview",
  components: {
    ChannelsChartCard,
    RevenueChartCard,
    SalesChartCard,
    ProductsCard,
    OverviewCard,
  },
  data() {
    return {
      sales: {
        us: {
          country: "United States",
          sales: 2500,
          bounce: "29.9%",
          flag: US,
        },
        germany: {
          country: "Germany",
          sales: "3.900",
          bounce: "40.22%",
          flag: DE,
        },
        britain: {
          country: "Great Britain",
          sales: "1.400",
          bounce: "23.44%",
          flag: GB,
        },
        brasil: {
          country: "Brasil",
          sales: "562",
          bounce: "32.14%",
          flag: BR,
        },
        australia: {
          country: "Australia",
          sales: "400",
          bounce: "56.83%",
          flag: AU,
        },
      },
      overviews: [
        {
          title: "Sales",
          value: "$230,220",
          percent: "+55%",
        },
        {
          title: "Customers",
          value: "3.200",
          percent: "+12%",
        },
        {
          title: "Avg. Revenue",
          value: "$1.200",
          percent: "+$213",
          textColor: "text-secondary",
        },
      ],
    };
  },
  mounted() {
    setTooltip();
  },
};
</script>
