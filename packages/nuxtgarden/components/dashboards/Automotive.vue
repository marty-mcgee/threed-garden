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
          title-color="opacity-7 text-white"
          value="145 Km"
          value-color="text-white"
          icon-class="text-dark ni ni-money-coins"
          direction-reverse
        />
      </div>
      <div class="mt-4 col-lg-3 col-md-6 col-12 mt-md-0">
        <card
          class="bg-gradient-secondary"
          title="Battery Health"
          value="99 %"
          icon-class="text-dark ni ni-controller"
          title-color="opacity-7 text-white"
          value-color="text-white"
          direction-reverse
        />
      </div>
      <div class="mt-4 col-lg-3 col-md-6 col-12 mt-lg-0">
        <card
          class="bg-gradient-secondary"
          title="Average Speed"
          value="56 Km/h"
          icon-class="text-dark ni ni-delivery-fast"
          title-color="opacity-7 text-white"
          value-color="text-white"
          direction-reverse
        />
      </div>
      <div class="mt-4 col-lg-3 col-md-6 col-12 mt-lg-0">
        <card
          class="bg-gradient-secondary"
          title="Music Volume"
          value="15/100"
          icon-class="text-dark ni ni-note-03"
          title-color="opacity-7 text-white"
          value-color="text-white"
          direction-reverse
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
import Card from "@/components/cards/Card.vue";
import CardPlayer from "./components/CardPlayer.vue";
import CardDetail from "./components/CardDetail.vue";
import setTooltip from "@/assets/js/tooltip.js";

export default {
  name: "Automotive",
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
