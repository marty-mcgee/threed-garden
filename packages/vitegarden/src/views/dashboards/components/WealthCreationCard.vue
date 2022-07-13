<template>
  <div class="p-3 card">
    <div
      class="overflow-hidden bg-cover position-relative border-radius-lg h-100"
      :style="{
        backgroundImage: `url(${bgImg})`,
      }"
    >
      <span class="mask bg-gradient-dark"></span>
      <div class="p-3 card-body position-relative z-index-1 h-100">
        <h6 class="mb-3 text-white font-weight-bolder">Hey John!</h6>
        <p class="mb-3 text-white">
          Wealth creation is an evolutionarily recent positive-sum game. It is
          all about who take the opportunity first.
        </p>
        <a class="mb-0 btn btn-round btn-outline-white" href="javascript:;">
          Read More
          <i class="text-sm fas fa-arrow-right ms-1" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import bgImg from '@/assets/img/ivancik.jpg'
export default {
  name: "WealthCreationCard",
  data() {
    return { bgImg }
  }
};
</script>
