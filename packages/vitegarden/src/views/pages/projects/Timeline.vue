<template>
  <div class="py-4 container-fluid">
    <div class="row gx-4">
      <div class="col-lg-6">
        <timeline-card title="Timeline with dotted line" />
      </div>
      <div class="mt-4 col-lg-6 mt-lg-0">
        <timeline-card title="Timeline dark with dashed line" dark-mode />
      </div>
    </div>
  </div>
</template>

<script>
import TimelineCard from "./components/TimelineCard.vue";
export default {
  name: "Timeline",
  components: { TimelineCard },
};
</script>
