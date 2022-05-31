<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-lg-6 col-12">
        <div class="row">
          <div class="col-lg-6 col-md-6 col-12">
            <complex-statistics-card
              icon="text-dark ni ni-circle-08"
              percentage="+3%"
              :count="{ number: 1600, label: 'Active Users' }"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-12">
            <complex-statistics-card
              icon="text-dark ni ni-active-40"
              percentage="+99%"
              :count="{ number: 357, label: 'Click Events' }"
            />
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-lg-6 col-md-6 col-12">
            <complex-statistics-card
              icon="text-dark ni ni-cart"
              percentage="+45%"
              :count="{ number: 2300, label: 'Purchases' }"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-12">
            <complex-statistics-card
              icon="text-dark ni ni-like-2"
              percentage="+90%"
              :count="{ number: 940, label: 'Likes' }"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-6 col-12">
        <review-card
          title="Reviews"
          description="More than
          <b>1,500,000</b> developers used Creative Tim's products and over
          <b>700,000</b> projects were created."
          :reviews="[
            {
              title: 'Positive Reviews',
              value: 80,
              color: 'info',
            },
            {
              title: 'Neutral Reviews',
              value: 17,
              color: 'dark',
            },
            {
              title: 'Negative Reviews',
              value: 3,
              color: 'danger',
            },
          ]"
        />
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
};
</script>
