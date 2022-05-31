<template>
  <div
    class="card card-background card-background-mask-info h-100 tilt"
    data-tilt=""
    v-tilt="{ speed: 300, perspective: 1000 }"
  >
    <div
      class="full-background"
      style="
        background-image: url('../../../assets/img/curved-images/white-curved.jpeg');
      "
    ></div>
    <div class="pt-4 text-center card-body">
      <h2 class="mt-2 mb-0 text-white up">Earnings</h2>
      <h1 class="mb-0 text-white up">$15,800</h1>
      <span class="mb-2 badge badge-lg d-block bg-gradient-dark up"
        >+15% since last week</span
      >
      <a href="javascript:;" class="px-5 mb-2 btn btn-outline-white up"
        >View more</a
      >
    </div>
  </div>
</template>

<script>
export default {
  name: "earnings-card",
};
</script>
