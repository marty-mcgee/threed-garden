<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-lg-6 col-12">
        <div class="row">
          <div class="col-lg-6 col-md-6 col-12">
            <complex-statistics-card
              :class-icon="reports.UsersActive.classIcon"
              :percentage="reports.UsersActive.percentage"
              :caption="reports.UsersActive.caption"
              :active-users="reports.UsersActive.activeUsers"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-12">
            <complex-statistics-card
              :class-icon="reports.ClickEvents.classIcon"
              :percentage="reports.ClickEvents.percentage"
              :caption="reports.ClickEvents.caption"
              :active-users="reports.ClickEvents.activeUsers"
            />
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-lg-6 col-md-6 col-12">
            <complex-statistics-card
              :class-icon="reports.purchases.classIcon"
              :percentage="reports.purchases.percentage"
              :caption="reports.purchases.caption"
              :active-users="reports.purchases.activeUsers"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-12">
            <complex-statistics-card
              :class-icon="reports.likes.classIcon"
              :percentage="reports.likes.percentage"
              :caption="reports.likes.caption"
              :active-users="reports.likes.activeUsers"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-6 col-12">
        <review-card />
      </div>
    </div>
    <div class="row mt-4">
      <div class="col-12">
        <Table />
      </div>
    </div>
  </div>
</template>

<script>
import ComplexStatisticsCard from "@/examples/Cards/ComplexStatisticsCard.vue";
import ReviewCard from "./components/ReviewCard.vue";
import Table from "./components/Table.vue";

export default {
  name: "Reports",
  components: {
    ComplexStatisticsCard,
    ReviewCard,
    Table,
  },
  data() {
    return {
      reports: {
        UsersActive: {
          percentage: "+3%",
          classIcon: "text-dark ni ni-circle-08",
          caption: "1600",
          activeUsers: "Active Users",
        },
        ClickEvents: {
          percentage: "+99%",
          classIcon: "text-dark ni ni-active-40",
          caption: "357",
          activeUsers: "Click Events",
        },
        purchases: {
          percentage: "+45%",
          classIcon: "text-dark ni ni-cart",
          caption: "2300",
          activeUsers: "Purchases",
        },
        likes: {
          percentage: "+90%",
          classIcon: "text-dark ni ni-like-2",
          caption: "940",
          activeUsers: "Likes",
        },
      },
    };
  },
};
</script>
