<template>
  <div class="container-fluid mt-4">
    <div class="row align-items-center">
      <div class="col-lg-4 col-sm-8">
        <nav-pill />
      </div>
    </div>
    <div class="row">
      <div class="col-md-8 col-sm-10 mx-auto">
        <form class action="index.html" method="post">
          <div class="card my-sm-5">
            <div class="card-header text-center">
              <div class="row justify-content-between">
                <div class="col-md-4 text-start">
                  <img
                    class="mb-2 w-25 p-2"
                    src="../../../assets/img/logo-ct.png"
                    alt="Logo"
                  />
                  <h6>
                    St. Independence Embankment, 050105 Bucharest, Romania
                  </h6>
                  <p class="d-block text-secondary">tel: +4 (074) 1090873</p>
                </div>
                <div class="col-lg-3 col-md-7 text-md-end text-start mt-5">
                  <h6 class="d-block mt-2 mb-0">Billed to: John Doe</h6>
                  <p class="text-secondary">
                    4006 Locust View Drive
                    <br />San Francisco CA <br />California
                  </p>
                </div>
              </div>
              <br />
              <div class="row justify-content-md-between">
                <div class="col-md-4 mt-auto">
                  <h6 class="mb-0 text-start text-secondary">Invoice no</h6>
                  <h5 class="text-start mb-0">#0453119</h5>
                </div>
                <div class="col-lg-5 col-md-7 mt-auto">
                  <div class="row mt-md-5 mt-4 text-md-end text-start">
                    <div class="col-md-6">
                      <h6 class="text-secondary mb-0">Invoice date:</h6>
                    </div>
                    <div class="col-md-6">
                      <h6 class="text-dark mb-0">06/03/2019</h6>
                    </div>
                  </div>
                  <div class="row text-md-end text-start">
                    <div class="col-md-6">
                      <h6 class="text-secondary mb-0">Due date:</h6>
                    </div>
                    <div class="col-md-6">
                      <h6 class="text-dark mb-0">11/03/2019</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-12">
                  <div class="table-responsive">
                    <table class="table text-right">
                      <thead class="bg-default">
                        <tr>
                          <th scope="col" class="pe-2 text-start ps-2">Item</th>
                          <th scope="col" class="pe-2">Qty</th>
                          <th scope="col" class="pe-2" colspan="2">Rate</th>
                          <th scope="col" class="pe-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="text-start">Premium Support</td>
                          <td class="ps-4">1</td>
                          <td class="ps-4" colspan="2">$ 9.00</td>
                          <td class="ps-4">$ 9.00</td>
                        </tr>
                        <tr>
                          <td class="text-start">Soft UI Design System PRO</td>
                          <td class="ps-4">3</td>
                          <td class="ps-4" colspan="2">$ 100.00</td>
                          <td class="ps-4">$ 300.00</td>
                        </tr>
                        <tr>
                          <td class="text-start">Parts for service</td>
                          <td class="ps-4">1</td>
                          <td class="ps-4" colspan="2">$ 89.00</td>
                          <td class="ps-4">$ 89.00</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <th></th>
                          <th></th>
                          <th class="h5 ps-4" colspan="2">Total</th>
                          <th colspan="1" class="text-right h5 ps-4">$ 698</th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-footer mt-md-5 mt-4">
              <div class="row">
                <div class="col-lg-5 text-left">
                  <h5>Thank you!</h5>
                  <p class="text-secondary text-sm">
                    If you encounter any issues related to the invoice you can
                    contact us at:
                  </p>
                  <h6 class="text-secondary mb-0">
                    email:
                    <span class="text-dark">support@creative-tim.com</span>
                  </h6>
                </div>
                <div class="col-lg-7 text-md-end mt-md-0 mt-3">
                  <vsud-button
                    color="info"
                    variant="gradient"
                    class="mt-lg-7 mb-0"
                    onclick="window.print()"
                    type="button"
                    name="button"
                    >Print</vsud-button
                  >
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import NavPill from "./components/NavPill.vue";
import VsudButton from "@/components/VsudButton.vue";

export default {
  name: "Invoice",
  components: {
    NavPill,
    VsudButton,
  },
};
</script>
