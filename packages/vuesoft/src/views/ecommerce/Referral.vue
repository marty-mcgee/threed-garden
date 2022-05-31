<template>
  <div class="container py-4">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header p-3">
            <h5 class="mb-2">Referral Program</h5>
            <p class="mb-0">
              Track and find all the details about our referral program, your
              stats and revenues.
            </p>
          </div>
          <div class="card-body p-3">
            <div class="row">
              <outlined-counter-card
                :duration="2500"
                prefix="$"
                :count="23980"
                title="Earning"
              />
              <outlined-counter-card
                prefix="$"
                :count="2400"
                title="Customers"
              />
              <outlined-counter-card
                class="mt-4 mt-lg-0"
                prefix="$"
                :count="48"
                title="Avg. Value"
              />
              <outlined-counter-card
                :duration="3000"
                class="mt-4 mt-lg-0"
                suffix="%"
                :count="4"
                title="Refund Rate"
              />
            </div>
            <div class="row mt-5">
              <div class="col-lg-5 col-12">
                <h6 class="mb-0">Referral Code</h6>
                <p class="text-sm">
                  Copy the code bellow to your registered provider.
                </p>
                <div
                  class="border-dashed border-1 border-secondary border-radius-md p-3"
                >
                  <p class="text-xs mb-2">
                    Generated 23 days ago by
                    <span class="font-weight-bolder">softuidash23</span>
                  </p>
                  <p class="text-xs mb-3">
                    <span class="font-weight-bolder">(Used one time)</span>
                  </p>
                  <div class="d-flex align-items-center">
                    <div class="form-group w-70">
                      <div class="input-group bg-gray-200">
                        <input
                          class="form-control form-control-sm"
                          value="soft-ui-dashboard-vmsk392"
                          type="text"
                          disabled
                          onfocus="focused(this)"
                          onfocusout="defocused(this)"
                        />
                        <span
                          class="input-group-text bg-transparent"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title
                          data-bs-original-title="Referral code expires in 24 hours"
                          aria-label="Referral code expires in 24 hours"
                        >
                          <i class="ni ni-key-25"></i>
                        </span>
                      </div>
                    </div>
                    <a
                      href="javascript:;"
                      class="btn btn-sm btn-outline-secondary ms-2 px-3"
                      >Copy</a
                    >
                  </div>
                  <p class="text-xs mb-1">You cannot generate codes.</p>
                  <p class="text-xs mb-0">
                    <a href="javascript:;">Contact us</a> to generate more
                    referrals link.
                  </p>
                </div>
              </div>
              <div class="col-lg-7 col-12 mt-4 mt-lg-0">
                <h6 class="mb-0">How to use</h6>
                <p class="text-sm">
                  Integrate your referral code in 3 easy steps.
                </p>
                <div class="row">
                  <transparent-info-card
                    icon="money-coins"
                    description="1. Create & validate your referral link and get"
                    value="<span class='small'>$</span>100"
                  />
                  <transparent-info-card
                    icon="send"
                    description="2. For every order you make you get"
                    value="10 <span class='small'>%</span>"
                  />
                  <transparent-info-card
                    icon="spaceship"
                    description="3. Get other friends to generate link and get"
                    value="<span class='small'>$</span>500"
                  />
                </div>
              </div>
            </div>
            <hr class="horizontal dark" />
            <div class="row mt-4">
              <h6 class="mb-2">Other programs</h6>
              <complex-background-card
                image="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/window-desk.jpg"
                description="User #hashtag in a photo on social media and get $10 for each purchase you make."
                :action="{ route: 'javascript:;', label: 'Read more' }"
              />
              <complex-background-card
                class="mt-4 mt-lg-0"
                image="https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/office-dark.jpg"
                description="Send the invitation link to 10 friends and get a 50%
                        coupon to use on any purchase."
                :action="{ route: 'javascript:;', label: 'Read more' }"
              />
              <div class="col-lg-4 col-12 mt-4 mt-lg-0">
                <div class="card border-dashed border-1 text-center h-100">
                  <div
                    class="card-body position-relative z-index-1 d-flex flex-column"
                  >
                    <div
                      class="position-relative d-flex align-items-center justify-content-center h-100"
                    >
                      <img
                        class="w-50 position-relative z-index-2"
                        src="../../assets/img/illustrations/rocket-white.png"
                        alt="illustration"
                      />
                    </div>
                    <a
                      class="text-sm text-secondary font-weight-bold mb-0 icon-move-right mt-2"
                      href="javascript:;"
                    >
                      Join rocketship program
                      <i
                        class="fas fa-arrow-right text-sm ms-1"
                        aria-hidden="true"
                      ></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-12 mt-4">
      <orders-list-card
        title="Top Referred Users"
        :headers="['User', 'Value', 'Profit', 'Refunds']"
        :lists="users"
      />
    </div>
  </div>
</template>

<script>
import OrdersListCard from "../../examples/Cards/OrdersListCard.vue";
import ComplexBackgroundCard from "./components/ComplexBackgroundCard.vue";
import TransparentInfoCard from "./components/TransparentInfoCard.vue";
import OutlinedCounterCard from "./components/OutlinedCounterCard.vue";

export default {
  name: "Referral",
  components: {
    OrdersListCard,
    ComplexBackgroundCard,
    TransparentInfoCard,
    OutlinedCounterCard,
  },
  data() {
    return {
      users: [
        {
          title: "Alice Vinget",
          order: "8.232",
          values: ["$130.992", "$9.500", "13"],
          info: "Refund rate is lower with 97% than other products",
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-1.jpg",
          icon: "bold-down text-success",
        },
        {
          title: "John Alura",
          order: "12.821",
          values: ["$80.250", "$4.200", "40"],
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-2.jpg",
          icon: "bold-down text-success",
        },
        {
          title: "Andrew Sian",
          order: "2.421",
          values: ["$40.600", "$9.430", "54"],
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-3.jpg",
          icon: "bold-up text-danger",
        },
        {
          title: "Luca Willaim",
          order: "5.921",
          values: ["$91.300", "$7.364", "5"],
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-4.jpg",
          icon: "bold-down text-success",
        },

        {
          title: "Richel Manuel",
          order: "921",
          values: ["$140.925", "$20.531", "121"],
          info: "Refund rate is higher with 70% than other products",
          img:
            "https://demos.creative-tim.com/soft-ui-dashboard-pro/assets/img/team-5.jpg",
          icon: "bold-up text-danger",
        },
      ],
    };
  },
};
</script>
