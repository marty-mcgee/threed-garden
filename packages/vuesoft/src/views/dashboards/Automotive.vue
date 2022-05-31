<template>
  <div class="py-4 container-fluid">
    <div class="mt-4 row">
      <div class="col-12">
        <card-detail />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-3 col-md-6 col-12">
        <mini-statistics-card
          class="bg-gradient-secondary"
          :title="{
            text: 'Today\'s Trip',
            color: 'opacity-7 text-white'
          }"
          :value="{
            text: '145 Km',
            color: 'text-white'
          }"
          :icon="{
            component: 'text-dark ni ni-money-coins',
            background: 'bg-white'
          }"
          direction-reverse
        />
      </div>
      <div class="mt-4 col-lg-3 col-md-6 col-12 mt-md-0">
        <mini-statistics-card
          class="bg-gradient-secondary"
          :title="{
            text: 'Battery Health',
            color: 'opacity-7 text-white'
          }"
          :value="{
            text: '99 %',
            color: 'text-white'
          }"
          :icon="{
            component: 'text-dark ni ni-controller',
            background: 'bg-white'
          }"
          direction-reverse
        />
      </div>
      <div class="mt-4 col-lg-3 col-md-6 col-12 mt-lg-0">
        <mini-statistics-card
          class="bg-gradient-secondary"
          :title="{
            text: 'Average Speed',
            color: 'opacity-7 text-white'
          }"
          :value="{
            text: '56 Km/h',
            color: 'text-white'
          }"
          :icon="{
            component: 'text-dark ni ni-delivery-fast',
            background: 'bg-white'
          }"
          direction-reverse
        />
      </div>
      <div class="mt-4 col-lg-3 col-md-6 col-12 mt-lg-0">
        <mini-statistics-card
          class="bg-gradient-secondary"
          :title="{
            text: 'Music Volume',
            color: 'opacity-7 text-white'
          }"
          :value="{
            text: '15/100',
            color: 'text-white'
          }"
          :icon="{
            component: 'text-dark ni ni-note-03',
            background: 'bg-white'
          }"
          direction-reverse
        />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-12">
        <player-card />
      </div>
    </div>
  </div>
</template>

<script>
import MiniStatisticsCard from "../../examples/Cards/MiniStatisticsCard.vue";
import PlayerCard from "./components/PlayerCard.vue";
import CardDetail from "./components/CardDetail.vue";
import setTooltip from "@/assets/js/tooltip.js";

export default {
  name: "Automotive",
  components: {
    MiniStatisticsCard,
    PlayerCard,
    CardDetail
  },
  mounted() {
    setTooltip(this.$store.state.bootstrap);
  }
};
</script>
