<template>
  <div class="py-4 container-fluid">
    <div class="mt-4 row">
      <div class="col-12">
        <card-detail />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-3 col-md-6 col-12">
        <card
          class="bg-gradient-secondary"
          title="Today's Trip"
          titleColor="opacity-7 text-white"
          value="145 Km"
          valueColor="text-white"
          iconClass="text-dark ni ni-money-coins"
          directionReverse
        />
      </div>
      <div class="mt-4 col-lg-3 col-md-6 col-12 mt-md-0">
        <card
          class="bg-gradient-secondary"
          title="Battery Health"
          value="99 %"
          iconClass="text-dark ni ni-controller"
          titleColor="opacity-7 text-white"
          valueColor="text-white"
          directionReverse
        />
      </div>
      <div class="mt-4 col-lg-3 col-md-6 col-12 mt-lg-0">
        <card
          class="bg-gradient-secondary"
          title="Average Speed"
          value="56 Km/h"
          iconClass="text-dark ni ni-delivery-fast"
          titleColor="opacity-7 text-white"
          valueColor="text-white"
          directionReverse
        />
      </div>
      <div class="mt-4 col-lg-3 col-md-6 col-12 mt-lg-0">
        <card
          class="bg-gradient-secondary"
          title="Music Volume"
          value="15/100"
          iconClass="text-dark ni ni-note-03"
          titleColor="opacity-7 text-white"
          valueColor="text-white"
          directionReverse
        />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-12">
        <card-player />
      </div>
    </div>
  </div>
</template>

<script>
import Card from "../../examples/Cards/Card.vue";
import CardPlayer from "./components/CardPlayer.vue";
import CardDetail from "./components/CardDetail.vue";
import setTooltip from "@/assets/js/tooltip.js";

export default {
  name: "automotive",
  components: {
    Card,
    CardPlayer,
    CardDetail,
  },
  data() {
    return {
      stats: {
        titleColor: "opacity-7 text-white",
        descColor: "text-white",
        trip: {
          title: "Today's Trip",
          desc: "145 KM",
          classIcon: "text-dark ni ni-money-coins",
        },
        health: {
          title: "Battery Health",
          desc: "99 %",
          classIcon: "text-dark ni ni-controller ",
        },
        speed: {
          title: "Average Speed",
          desc: "56 Km/h",
          classIcon: "text-dark ni ni-delivery-fast",
        },
        volume: {
          title: "Music Volume",
          desc: "15/100",
          classIcon: "text-dark ni ni-note-03",
        },
      },
    };
  },
  mounted() {
    setTooltip();
  },
};
</script>
