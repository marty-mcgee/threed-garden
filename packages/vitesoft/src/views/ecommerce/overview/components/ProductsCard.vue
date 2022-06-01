<template>
  <div class="mb-4 card">
    <div class="pb-0 card-header">
      <h6>Top Selling Products</h6>
    </div>
    <div class="px-0 pt-0 pb-2 card-body">
      <div class="p-0 table-responsive">
        <table class="table mb-0 align-items-center">
          <thead>
            <tr>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                Product
              </th>
              <th
                class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
              >
                Value
              </th>
              <th
                class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                Ads Spent
              </th>
              <th
                class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
              >
                Refunds
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(product, index) in products" :key="index">
              <td>
                <div class="px-3 py-1 d-flex">
                  <div>
                    <img :src="product.img" class="avatar me-3" alt="image" />
                  </div>
                  <div class="d-flex flex-column justify-content-center">
                    <h6 class="mb-0 text-sm">{{ product.title }}</h6>
                    <p class="mb-0 text-sm font-weight-bold text-secondary">
                      <span class="text-success">{{ product.orders }}</span>
                      orders
                    </p>
                  </div>
                </div>
              </td>
              <td>
                <p class="mb-0 text-sm font-weight-bold">
                  {{ product.value }}
                </p>
              </td>
              <td class="text-sm text-center align-middle">
                <p class="mb-0 text-sm font-weight-bold">
                  {{ product.adSpent }}
                </p>
              </td>
              <td class="align-middle text-end">
                <div
                  class="px-3 py-1 d-flex justify-content-center align-items-center"
                >
                  <p class="mb-0 text-sm font-weight-bold">
                    {{ product.refunds }}
                  </p>
                  <i class="mt-1 text-sm ms-1" :class="product.icon"></i>
                  <button
                    v-if="product.info"
                    type="button"
                    class="mb-0 btn btn-sm btn-icon-only btn-rounded btn-outline-secondary ms-2 d-flex align-items-center justify-content-center ms-3"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title=""
                    :data-bs-original-title="product.info"
                  >
                    <i class="fas fa-info" aria-hidden="true"></i>
                  </button>
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
export default {
  name: "ProductsCard",
  data() {
    return {
      products: [
        {
          title: "Nike v22 Running",
          value: "$130.992",
          adSpent: "$9.500",
          refunds: "13",
          orders: "12.821",
          info: "Refund rate is lower with 97% than other products",
          img: "https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/blue-shoe.jpg",
          icon: "ni ni-bold-down text-success",
        },
        {
          title: "Business Kit (Mug + Notebook)",
          value: "$80.250",
          adSpent: "$4.200",
          refunds: "40",
          orders: "8.232",
          img: "https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/black-mug.jpg",
          icon: "ni ni-bold-down text-success",
        },
        {
          title: "Black Chair",
          value: "$40.600",
          adSpent: "$9.430",
          refunds: "54",
          orders: "2.421",
          img: "https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/black-chair.jpg",
          icon: "ni ni-bold-up text-danger",
        },
        {
          title: "Wireless Charger",
          value: "$91.300",
          adSpent: "$7.364",
          refunds: "5",
          orders: "5.921",
          img: "https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/bang-sound.jpg",
          icon: "ni ni-bold-down text-success",
        },
        {
          title: "Mountain Trip Kit (Camera + Backpack)",
          value: "$140.925",
          adSpent: "$20.531",
          refunds: "121",
          orders: "921",
          info: "Refund rate is higher with 70% than other products",
          img: "https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/photo-tools.jpg",
          icon: "ni ni-bold-up text-danger",
        },
      ],
    };
  },
};
</script>
