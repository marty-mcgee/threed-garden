<template>
  <div class="card">
    <div class="text-center card-body">
      <h1 class="text-gradient text-success">
        <span :id="id" :countTo="status">{{ status }}</span>
        <span class="text-lg ms-n2">{{ unit }}</span>
      </h1>
      <h6 class="mb-0 font-weight-bolder">{{ title }}</h6>
      <p class="mb-0 text-sm opacity-8">{{ desc }}</p>
    </div>
  </div>
</template>

<script>
import { CountUp } from "countup.js";

export default {
  name: "TemperatureCard",
  props: {
    status: { type: String, default: "" },
    unit: { type: String, default: "" },
    title: { type: String, default: "" },
    desc: { type: String, default: "" },
    id: { type: String, default: "" }
  },
  mounted() {
    // Count To
    if (document.getElementById("status1")) {
      const countUp = new CountUp(
        "status1",
        document.getElementById("status1").getAttribute("countTo")
      );
      if (!countUp.error) {
        countUp.start();
      } else {
        console.error(countUp.error);
      }
    }
    if (document.getElementById("status2")) {
      const countUp = new CountUp(
        "status2",
        document.getElementById("status2").getAttribute("countTo")
      );
      if (!countUp.error) {
        countUp.start();
      } else {
        console.error(countUp.error);
      }
    }
    if (document.getElementById("status3")) {
      const countUp = new CountUp(
        "status3",
        document.getElementById("status3").getAttribute("countTo")
      );
      if (!countUp.error) {
        countUp.start();
      } else {
        console.error(countUp.error);
      }
    }
    if (document.getElementById("status4")) {
      const countUp = new CountUp(
        "status4",
        document.getElementById("status4").getAttribute("countTo")
      );
      if (!countUp.error) {
        countUp.start();
      } else {
        console.error(countUp.error);
      }
    }
    if (document.getElementById("status5")) {
      const countUp = new CountUp(
        "status5",
        document.getElementById("status5").getAttribute("countTo")
      );
      if (!countUp.error) {
        countUp.start();
      } else {
        console.error(countUp.error);
      }
    }
    if (document.getElementById("status6")) {
      const countUp = new CountUp(
        "status6",
        document.getElementById("status6").getAttribute("countTo")
      );
      if (!countUp.error) {
        countUp.start();
      } else {
        console.error(countUp.error);
      }
    }
  },
};
</script>
