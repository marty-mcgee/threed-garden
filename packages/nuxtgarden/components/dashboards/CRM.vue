<template>
  <main class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
    <div class="py-4 container-fluid">
      <div class="row">
        <div class="col-xl-8 col-lg-7">
          <div class="row">
            <div class="col-sm-4">
              <visitors-card />
            </div>
            <div class="mt-4 col-sm-4 mt-sm-0">
              <income-card />
            </div>
            <div class="mt-4 col-sm-4 mt-sm-0">
              <new-tab-card />
            </div>
          </div>
          <div class="mt-4 row">
            <div class="col-12">
              <calendar />
            </div>
          </div>
        </div>
        <div class="mt-4 col-xl-4 col-lg-5 mt-lg-0">
          <div class="row">
            <div class="col-lg-12">
              <wealth-creation-card />
            </div>
            <div class="col-lg-12 col-sm-6">
              <categories-card />
            </div>
            <div class="col-lg-12 col-sm-6">
              <birthday-message-card />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 row">
        <div class="col-sm-6">
          <transactions-card />
        </div>
        <div class="mt-4 col-sm-6 mt-sm-0">
          <revenue-card />
        </div>
      </div>
      <app-footer />
    </div>
  </main>
</template>

<script>
import VisitorsCard from "@/components/dashboards/components/VisitorsCard.vue";
import IncomeCard from "@/components/dashboards/components/IncomeCard.vue";
import NewTabCard from "@/components/dashboards/components/NewTabCard.vue";
import WealthCreationCard from "./components/WealthCreationCard.vue";
import CategoriesCard from "./components/CategoriesCard.vue";
import BirthdayMessageCard from "./components/BirthdayMessageCard.vue";
import TransactionsCard from "./components/TransactionsCard.vue";
import RevenueCard from "./components/RevenueCard.vue";
import Calendar from "@/components/sections/Calendar.vue";
import AppFooter from "@/components/sections/Footer.vue";

export default {
  name: "Crm",
  components: {
    VisitorsCard,
    IncomeCard,
    NewTabCard,
    WealthCreationCard,
    CategoriesCard,
    BirthdayMessageCard,
    Calendar,
    TransactionsCard,
    RevenueCard,
    AppFooter,
  },
  beforeMount() {
    this.$store.state.showFooter = false;
  },
  beforeUnmount() {
    this.$store.state.showFooter = true;
  },
};
</script>
