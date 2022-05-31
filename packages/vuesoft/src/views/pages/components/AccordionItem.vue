<template>
  <div class="mb-3 accordion-item">
    <h5 :id="accordionId" class="accordion-header">
      <button
        class="accordion-button border-bottom font-weight-bold"
        type="button"
        data-bs-toggle="collapse"
        :data-bs-target="`#${collapseId}`"
        :aria-expanded="active ? 'true' : 'false'"
        :aria-controls="collapseId"
      >
        {{ question }}
        <i
          class="pt-1 text-xs collapse-close fa fa-plus position-absolute end-0 me-3"
        ></i>
        <i
          class="pt-1 text-xs collapse-open fa fa-minus position-absolute end-0 me-3"
        ></i>
      </button>
    </h5>
    <div
      :id="collapseId"
      class="accordion-collapse collapse"
      :class="active ? 'show' : ''"
      :aria-labelledby="accordionId"
      data-bs-parent="#accordionRental"
    >
      <div class="text-sm accordion-body opacity-8">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AccordionItem",
  props: {
    question: {
      type: String,
      default: "",
    },
    accordionId: {
      type: String,
      default: "",
    },
    collapseId: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
