<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <div class="card mb-4">
          <div class="card-header p-3 pb-0">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6>Order Details</h6>
                <p class="text-sm mb-0">
                  Order no.
                  <b>241342</b> from
                  <b>23.02.2021</b>
                </p>
                <p class="text-sm">
                  Code:
                  <b>KF332</b>
                </p>
              </div>
              <vsud-button color="secondary" variant="gradient" class="ms-auto mb-0">Invoice</vsud-button>
            </div>
          </div>
          <div class="card-body p-3 pt-0">
            <hr class="horizontal dark mt-0 mb-4" />
            <div class="row">
              <div class="col-lg-6 col-md-6 col-12">
                <div class="d-flex">
                  <div>
                    <vsud-avatar
                      img="https://images.unsplash.com/photo-1511499767150-a48a237f0083?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;ixlib=rb-1.2.1&amp;auto=format&amp;fit=crop&amp;w=1400&amp;q=80"
                      class="me-3"
                      size="xxl"
                      border-radius="lg"
                      alt="product image"
                    />
                  </div>
                  <div>
                    <h6 class="text-lg mb-0 mt-2">Gold Glasses</h6>
                    <p class="text-sm mb-3">Order was delivered 2 days ago.</p>
                    <vsud-badge color="success" variant="gradient" size="sm">Delivered</vsud-badge>
                  </div>
                </div>
              </div>
              <div class="col-lg-6 col-md-6 col-12 my-auto text-end">
                <vsud-button color="info" variant="gradient" class="mb-0">Contact Us</vsud-button>
                <p class="text-sm mt-2 mb-0">
                  Do you like the product? Leave us a review
                  <a href="javascript:;">here</a>.
                </p>
              </div>
            </div>
            <hr class="horizontal dark mt-4 mb-4" />
            <div class="row">
              <div class="col-lg-3 col-md-6 col-12">
                <h6 class="mb-3">Track order</h6>
                <div class="timeline timeline-one-side">
                  <div class="timeline-block mb-3">
                    <span class="timeline-step">
                      <i class="ni ni-bell-55 text-secondary"></i>
                    </span>
                    <div class="timeline-content">
                      <h6 class="text-dark text-sm font-weight-bold mb-0">Order received</h6>
                      <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">22 DEC 7:20 AM</p>
                    </div>
                  </div>
                  <div class="timeline-block mb-3">
                    <span class="timeline-step">
                      <i class="ni ni-html5 text-secondary"></i>
                    </span>
                    <div class="timeline-content">
                      <h6 class="text-dark text-sm font-weight-bold mb-0">Generate order id #1832412</h6>
                      <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">22 DEC 7:21 AM</p>
                    </div>
                  </div>
                  <div class="timeline-block mb-3">
                    <span class="timeline-step">
                      <i class="ni ni-cart text-secondary"></i>
                    </span>
                    <div class="timeline-content">
                      <h6
                        class="text-dark text-sm font-weight-bold mb-0"
                      >Order transmited to courier</h6>
                      <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">22 DEC 8:10 AM</p>
                    </div>
                  </div>
                  <div class="timeline-block mb-3">
                    <span class="timeline-step">
                      <i class="ni ni-check-bold text-success text-gradient"></i>
                    </span>
                    <div class="timeline-content">
                      <h6 class="text-dark text-sm font-weight-bold mb-0">Order delivered</h6>
                      <p class="text-secondary font-weight-bold text-xs mt-1 mb-0">22 DEC 4:54 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-lg-5 col-md-6 col-12">
                <h6 class="mb-3">Payment details</h6>
                <div
                  class="card card-body border card-plain border-radius-lg d-flex align-items-center flex-row"
                >
                  <img
                    class="w-10 me-3 mb-0"
                    src="../../../assets/img/logos/mastercard.png"
                    alt="logo"
                  />
                  <h6
                    class="mb-0"
                  >****&nbsp;&nbsp;&nbsp;****&nbsp;&nbsp;&nbsp;****&nbsp;&nbsp;&nbsp;7852</h6>
                  <vsud-button
                    color="secondary"
                    variant="outline"
                    class="btn-icon-only btn-rounded mb-0 ms-2 btn-sm d-flex align-items-center justify-content-center ms-auto"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title
                    data-bs-original-title="We do not store card details"
                  >
                    <i class="fas fa-info" aria-hidden="true"></i>
                  </vsud-button>
                </div>
                <h6 class="mb-3 mt-4">Billing Information</h6>
                <ul class="list-group">
                  <li class="list-group-item border-0 d-flex p-4 mb-2 bg-gray-100 border-radius-lg">
                    <div class="d-flex flex-column">
                      <h6 class="mb-3 text-sm">Oliver Liam</h6>
                      <span class="mb-2 text-xs">
                        Company Name:
                        <span class="text-dark font-weight-bold ms-2">Viking Burrito</span>
                      </span>
                      <span class="mb-2 text-xs">
                        Email Address:
                        <span
                          class="text-dark ms-2 font-weight-bold"
                        >oliver@burrito.com</span>
                      </span>
                      <span class="text-xs">
                        VAT Number:
                        <span class="text-dark ms-2 font-weight-bold">FRB1235476</span>
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
              <div class="col-lg-3 col-12 ms-auto">
                <h6 class="mb-3">Order Summary</h6>
                <div class="d-flex justify-content-between">
                  <span class="mb-2 text-sm">Product Price:</span>
                  <span class="text-dark font-weight-bold ms-2">$90</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="mb-2 text-sm">Delivery:</span>
                  <span class="text-dark ms-2 font-weight-bold">$14</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-sm">Taxes:</span>
                  <span class="text-dark ms-2 font-weight-bold">$1.95</span>
                </div>
                <div class="d-flex justify-content-between mt-4">
                  <span class="mb-2 text-lg">Total:</span>
                  <span class="text-dark text-lg ms-2 font-weight-bold">$105.95</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VsudButton from "@/components/VsudButton.vue";
import VsudAvatar from "@/components/VsudAvatar.vue";
import VsudBadge from "@/components/VsudBadge.vue";

export default {
  name: "OrderDetails",
  components: {
    VsudButton,
    VsudAvatar,
    VsudBadge,
  },
  data() {
    return {};
  },
};
</script>
