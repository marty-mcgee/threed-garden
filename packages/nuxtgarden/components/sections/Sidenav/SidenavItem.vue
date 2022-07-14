<template>
  <li class="nav-item">
    <router-link class="nav-link" :to="to">
      <span class="sidenav-mini-icon"> {{ miniIcon }} </span>
      <span class="sidenav-normal"> {{ text }} </span>
    </router-link>
  </li>
</template>
<script>
export default {
  name: "SidenavItem",
  props: {
    to: {
      type: [Object, String],
      required: true,
    },
    miniIcon: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
};
</script>
