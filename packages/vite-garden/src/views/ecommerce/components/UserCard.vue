<template>
  <div class="card mb-4">
    <div class="card-header pb-0 p-3">
      <h6>Top Referred Users</h6>
    </div>
    <div class="card-body px-0 pt-0 pb-2">
      <div class="table-responsive p-0">
        <table class="table align-items-center mb-0">
          <thead>
            <tr>
              <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">User</th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >Value</th>
              <th
                class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >Profit</th>
              <th
                class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >Refunds</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in users" :key="index">
              <td>
                <div class="d-flex px-3 py-1">
                  <div>
                    <vsud-avatar
                      :img="user.img"
                      class="me-3"
                      border-radius="lg"
                      alt="avatar image"
                    />
                  </div>
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">{{ user.title }}</h6>
                    <p class="text-sm font-weight-bold text-secondary mb-0">
                      <span class="text-success">{{ user.orders }}</span> orders
                    </p>
                  </div>
                </div>
              </td>
              <td>
                <p class="text-sm font-weight-bold mb-0">{{ user.value }}</p>
              </td>
              <td class="align-middle text-center text-sm">
                <p class="text-sm font-weight-bold mb-0">{{ user.profit }}</p>
              </td>
              <td class="align-middle text-end">
                <div class="d-flex px-3 py-1 justify-content-center align-items-center">
                  <p class="text-sm font-weight-bold mb-0">{{ user.refunds }}</p>
                  <i class="text-sm ms-1 mt-1" :class="user.icon"></i>
                  <vsud-button
                    size="sm"
                    color="secondary"
                    variant="outline"
                    v-if="user.info"
                    class="btn-icon-only btn-rounded mb-0 ms-2 btn-sm d-flex align-items-center justify-content-center ms-3"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title
                    :data-bs-original-title="user.info"
                  >
                    <i class="fas fa-info" aria-hidden="true"></i>
                  </vsud-button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import VsudAvatar from "@/components/VsudAvatar.vue";
import VsudButton from "@/components/VsudButton.vue";

export default {
  name: "user-card",
  components: {
    VsudAvatar,
    VsudButton,
  },
  data() {
    return {
      users: [
        {
          title: "Alice Vinget",
          value: "$130.992",
          profit: "$9.500",
          refunds: "13",
          orders: "8.232",
          info: "Refund rate is lower with 97% than other products",
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-1.jpg",
          icon: "ni ni-bold-down text-success",
        },
        {
          title: "John Alura",
          value: "$80.250",
          profit: "$4.200",
          refunds: "40",
          orders: "12.821",
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-2.jpg",
          icon: "ni ni-bold-down text-success",
        },
        {
          title: "Andrew Sian",
          value: "$40.600",
          profit: "$9.430",
          refunds: "54",
          orders: "2.421 ",
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-3.jpg",
          icon: "ni ni-bold-up text-danger",
        },
        {
          title: "Luca Willaim",
          value: "$91.300",
          profit: "$7.364",
          refunds: "5",
          orders: "5.921",
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-4.jpg",
          icon: "ni ni-bold-down text-success",
        },
        {
          title: "Richel Manuel",
          value: "$140.925",
          profit: "$20.531",
          refunds: "121",
          orders: "921",
          info: "Refund rate is higher with 70% than other products",
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-5.jpg",
          icon: "ni ni-bold-up text-danger",
        },
      ],
    };
  },
};
</script>
