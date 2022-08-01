<template>
  <a
    :data-bs-toggle="collapse ? 'collapse' : ''"
    :href="collapse ? `#${collapseRef}` : collapseRef"
    :aria-controls="collapseRef"
    :aria-expanded="isExpanded"
    class="nav-link"
    v-bind="$attrs"
    role="button"
    @click="isExpanded = !isExpanded"
  >
    <div
      class="d-flex align-items-center justify-content-center text-center bg-white shadow icon icon-shape icon-sm border-radius-md"
      :class="uiStore.isRTL ? ' ms-2' : 'me-2'"
    >
      <slot name="icon"></slot>
    </div>
    <span class="nav-link-text" :class="uiStore.isRTL ? 'me-1' : 'ms-1'">{{ navText }}</span>
  </a>
  <div :class="isExpanded ? 'collapse show' : 'collapse'">
    <slot name="list"></slot>
  </div>
</template>

<script>
// state store (singletons)
import { useUIStore } from "@/composables/stores/UIStore"

export default {
  name: "SidenavCollapse",
  props: {
    collapseRef: {
      type: String,
      required: true,
    },
    navText: {
      type: String,
      required: true,
    },
    collapse: {
      type: Boolean,
      default: true,
    },
  },
  setup() {
    const uiStore = useUIStore()
    return {
      uiStore
    }
  },
  data() {
    return {
      isExpanded: false,
    }
  },
}
</script>
