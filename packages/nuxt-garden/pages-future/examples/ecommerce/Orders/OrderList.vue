<template>
  <div class="container-fluid py-4">
    <div class="d-sm-flex justify-content-between">
      <div>
        <vsud-button color="success" variant="gradient">New order</vsud-button>
      </div>
      <div class="d-flex">
        <div class="dropdown d-inline">
          <vsud-button
            id="navbarDropdownMenuLink2"
            color="dark"
            variant="outline"
            class="dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >Filters</vsud-button>
          <ul
            class="dropdown-menu dropdown-menu-lg-start px-2 py-3"
            aria-labelledby="navbarDropdownMenuLink2"
            style
          >
            <li>
              <a class="dropdown-item border-radius-md" href="javascript:;">Status: Paid</a>
            </li>
            <li>
              <a class="dropdown-item border-radius-md" href="javascript:;">Status: Refunded</a>
            </li>
            <li>
              <a class="dropdown-item border-radius-md" href="javascript:;">Status: Canceled</a>
            </li>
            <li>
              <hr class="horizontal dark my-2" />
            </li>
            <li>
              <a
                class="dropdown-item border-radius-md text-danger"
                href="javascript:;"
              >Remove Filter</a>
            </li>
          </ul>
        </div>
        <vsud-button
          class="btn-icon ms-2 export"
          size
          color="dark"
          variant="outline"
          data-type="csv"
        >
          <span class="btn-inner--icon">
            <i class="ni ni-archive-2"></i>
          </span>
          <span class="btn-inner--text">Export CSV</span>
        </vsud-button>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <div class="card mt-4">
          <div class="table-responsive">
            <table id="order-list" class="table table-flush">
              <thead class="thead-light">
                <tr>
                  <th>Id</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10421</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">1 Nov, 10:20 AM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="success"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Paid</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-avatar
                        :img="img1"
                        class="me-2"
                        size="xs"
                        circular="rounded-circle"
                        alt="user image"
                      />
                      <span>Orlando Imieto</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">Nike Sport V2</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$140,20</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10422</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">1 Nov, 10:53 AM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="success"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Paid</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-avatar
                        :img="img2"
                        size="xs"
                        circular="rounded-circle"
                        class="me-2"
                        alt="user image"
                      />
                      <span>Alice Murinho</span>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">Valvet T-shirt</span>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">$42,00</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10423</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">1 Nov, 11:13 AM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="dark"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-undo" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Refunded</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="avatar avatar-xs me-2 bg-gradient-dark">
                        <span>M</span>
                      </div>
                      <span>Michael Mirra</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">
                      Leather Wallet
                      <span class="text-secondary ms-2">+1 more</span>
                    </span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$25,50</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10424</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">1 Nov, 12:20 PM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="success"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Paid</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="d-flex align-items-center">
                        <vsud-avatar
                          :img="img3"
                          size="xs"
                          class="me-2"
                          circular="rounded-circle"
                          alt="user image"
                        />
                        <span>Andrew Nichel</span>
                      </div>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">Bracelet Onu-Lino</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$19,40</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10425</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">1 Nov, 1:40 PM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="danger"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-times" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Canceled</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="d-flex align-items-center">
                        <vsud-avatar
                          :img="img4"
                          size="xs"
                          circular="rounded-circle"
                          class="me-2"
                          alt="user image"
                        />
                        <span>Sebastian Koga</span>
                      </div>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">
                      Phone Case Pink
                      <span class="text-secondary ms-2">x 2</span>
                    </span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$44,90</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10426</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">1 Nov, 2:19 AM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="success"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Paid</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="avatar avatar-xs me-2 bg-gradient-success">
                        <span>L</span>
                      </div>
                      <span>Laur Gilbert</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">Backpack Niver</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$112,50</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10427</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">1 Nov, 3:42 AM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="success"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Paid</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="avatar avatar-xs me-2 bg-gradient-dark">
                        <span>I</span>
                      </div>
                      <span>Iryna Innda</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">Adidas Vio</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$200,00</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10428</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">2 Nov, 9:32 AM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="success"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Paid</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="avatar avatar-xs me-2 bg-gradient-dark">
                        <span>A</span>
                      </div>
                      <span>Arrias Liunda</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">Airpods 2 Gen</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$350,00</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10429</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">2 Nov, 10:14 AM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="success"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Paid</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="d-flex align-items-center">
                        <vsud-avatar
                          :img="img5"
                          size="xs"
                          circular="rounded-circle"
                          class="me-2"
                          alt="user image"
                        />
                        <span>Rugna Ilpio</span>
                      </div>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">Bracelet Warret</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$15,00</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10430</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">2 Nov, 12:56 PM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="dark"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-undo" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Refunded</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="d-flex align-items-center">
                        <vsud-avatar
                          :img="img6"
                          size="xs"
                          class="me-2"
                          circular="rounded"
                          alt="user image"
                        />
                        <span>Anna Landa</span>
                      </div>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">
                      Watter Bottle India
                      <span class="text-secondary ms-2">x 3</span>
                    </span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$25,00</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10431</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">2 Nov, 3:12 PM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="success"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Paid</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="avatar avatar-xs me-2 bg-gradient-dark">
                        <span>K</span>
                      </div>
                      <span>Karl Innas</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">Kitchen Gadgets</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$164,90</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <vsud-checkbox />
                      <p class="text-xs font-weight-bold ms-2 mb-0">#10432</p>
                    </div>
                  </td>
                  <td class="font-weight-bold">
                    <span class="my-2 text-xs">2 Nov, 5:12 PM</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <vsud-button
                        color="success"
                        variant="outline"
                        class="btn-icon-only btn-rounded mb-0 me-2 btn-sm d-flex align-items-center justify-content-center"
                      >
                        <i class="fas fa-check" aria-hidden="true"></i>
                      </vsud-button>
                      <span>Paid</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <div class="d-flex align-items-center">
                      <div class="avatar avatar-xs me-2 bg-gradient-info">
                        <span>O</span>
                      </div>
                      <span>Oana Kilas</span>
                    </div>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">Office Papers</span>
                  </td>
                  <td class="text-xs font-weight-bold">
                    <span class="my-2 text-xs">$23,90</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DataTable } from "simple-datatables";
import VsudButton from "@/components/vitesoft/VsudButton.vue";
import VsudAvatar from "@/components/vitesoft/VsudAvatar.vue";
import VsudCheckbox from "@/components/vitesoft/VsudCheckbox.vue";
import img1 from "@/assets/img/team-2.jpg";
import img2 from "@/assets/img/team-1.jpg";
import img3 from "@/assets/img/team-3.jpg";
import img4 from "@/assets/img/team-4.jpg";
import img5 from "@/assets/img/team-5.jpg";
import img6 from "@/assets/img/ivana-squares.jpg";

export default {
  name: "OrderList",
  components: {
    VsudButton,
    VsudAvatar,
    VsudCheckbox,
  },
  data() {
    return {
      img1,
      img2,
      img3,
      img4,
      img5,
      img6,
    };
  },
  mounted() {
    if (document.getElementById("order-list")) {
      const dataTableSearch = new DataTable("#order-list", {
        searchable: true,
        fixedHeight: false,
        perPageSelect: false,
      });

      document.querySelectorAll(".export").forEach(function (el) {
        el.addEventListener("click", function (el) {
          var type = el.dataset.type;

          var data = {
            type: type,
            filename: "soft-ui-" + type,
          };

          if (type === "csv") {
            data.columnDelimiter = "|";
          }

          dataTableSearch.export(data);
        });
      });
    }
  },
};
</script>