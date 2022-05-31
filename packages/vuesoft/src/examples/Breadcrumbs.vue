<template>
  <nav aria-label="breadcrumb">
    <ol
      class="px-0 pt-1 pb-0 mb-0 bg-transparent breadcrumb"
      :class="this.$store.state.isRTL ? '' : ' me-sm-6'"
    >
      <li class="text-sm breadcrumb-item">
        <a href="/" class="opacity-3 text-dark">
          <font-awesome-icon :icon="faHouse" :class="textWhite" />
        </a>
      </li>
      <li class="text-sm breadcrumb-item" :class="textWhite">
        <a
          v-if="this.$store.state.isRTL"
          :class="textWhite"
          class="opacity-5 ps-2"
          href="#"
          >لوحات القيادة</a
        >
        <a v-else :class="textWhite" class="opacity-4" href="#">{{
          currentDirectory
        }}</a>
      </li>
      <li
        class="text-sm breadcrumb-item active"
        :class="textWhite ? 'text-white' : 'text-dark'"
        aria-current="page"
      >
        {{ currentPage }}
      </li>
    </ol>
    <h6 class="mb-0 font-weight-bolder" :class="textWhite ? 'text-white' : ''">
      {{ currentPage }}
    </h6>
  </nav>
</template>

<script>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
export default {
  name: "Breadcrumbs",
  components: {
    FontAwesomeIcon,
  },
  props: {
    currentPage: {
      type: String,
      default: "",
    },
    currentDirectory: {
      type: String,
      default: "",
    },
    textWhite: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      faHouse,
    };
  },
};
</script>
