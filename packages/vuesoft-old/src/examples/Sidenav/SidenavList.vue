<template>
  <div
    class="w-auto h-auto collapse navbar-collapse max-height-vh-100 h-100"
    id="sidenav-collapse-main"
  >
    <ul class="navbar-nav">
      <li class="nav-item">
        <sidenav-collapse
          collapseRef="dashboardsExamples"
          navText="Dashboards"
          :class="getRoute() === 'dashboards' ? 'active' : ''"
        >
          <template v-slot:icon>
            <icon name="dashboard" />
          </template>
          <template v-slot:list>
            <ul class="nav ms-4 ps-3">
              <!-- nav links -->
              <sidenav-item
                :to="{ name: 'Default' }"
                miniIcon="D"
                text="Default"
              />
              <sidenav-item
                :to="{ name: 'Automotive' }"
                miniIcon="A"
                text="Automotive"
              />
              <sidenav-item
                :to="{ name: 'Smart Home' }"
                miniIcon="S"
                text="Smart Home"
              />
              <sidenav-collapse-item
                refer="vrExamples"
                miniIcon="V"
                text="Virtual Reality"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'VR Default' }"
                    miniIcon="V"
                    text="VR Default"
                  />
                  <sidenav-item
                    :to="{ name: 'VR Info' }"
                    miniIcon="V"
                    text="VR Info"
                  />
                </template>
              </sidenav-collapse-item>
              <sidenav-item :to="{ name: 'CRM' }" miniIcon="C" text="CRM" />
            </ul>
          </template>
        </sidenav-collapse>
      </li>
      <li class="mt-3 nav-item">
        <h6
          class="text-xs ps-4 text-uppercase font-weight-bolder opacity-6"
          :class="this.$store.state.isRTL ? 'me-4' : 'ms-2'"
        >
          PAGES
        </h6>
      </li>
      <li class="nav-item">
        <sidenav-collapse
          collapseRef="pagesExamples"
          navText="Pages"
          :class="getRoute() === 'pages' ? 'active' : ''"
        >
          <template v-slot:icon>
            <icon name="pages" />
          </template>
          <template v-slot:list>
            <ul class="nav ms-4 ps-3">
              <!-- nav links -->
              <sidenav-collapse-item
                refer="profileExample"
                miniIcon="P"
                text="Profile"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Profile Overview' }"
                    miniIcon="P"
                    text="Profile Overview"
                  />
                  <sidenav-item
                    :to="{ name: 'Teams' }"
                    miniIcon="T"
                    text="Teams"
                  />
                  <sidenav-item
                    :to="{ name: 'All Projects' }"
                    miniIcon="A"
                    text="All Projects"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="usersExample"
                miniIcon="U"
                text="Users"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Reports' }"
                    miniIcon="R"
                    text="Reports"
                  />
                  <sidenav-item
                    :to="{ name: 'New User' }"
                    miniIcon="N"
                    text="New User"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="accountExample"
                miniIcon="A"
                text="Account"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Settings' }"
                    miniIcon="S"
                    text="Settings"
                  />
                  <sidenav-item
                    :to="{ name: 'Billing' }"
                    miniIcon="B"
                    text="Billing"
                  />
                  <sidenav-item
                    :to="{ name: 'Invoice' }"
                    miniIcon="I"
                    text="Invoice"
                  />
                  <sidenav-item
                    :to="{ name: 'Security' }"
                    miniIcon="S"
                    text="Security"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="projectsExample"
                miniIcon="P"
                text="Projects"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'General' }"
                    miniIcon="G"
                    text="General"
                  />
                  <sidenav-item
                    :to="{ name: 'Timeline' }"
                    miniIcon="T"
                    text="Timeline"
                  />
                  <sidenav-item
                    :to="{ name: 'New Project' }"
                    miniIcon="N"
                    text="New Project"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-item
                :to="{ name: 'Pricing Page' }"
                miniIcon="P"
                text="Pricing Page"
              />
              <sidenav-item :to="{ name: 'RTL' }" miniIcon="R" text="RTL" />
              <sidenav-item
                :to="{ name: 'Widgets' }"
                miniIcon="W"
                text="Widgets"
              />
              <sidenav-item
                :to="{ name: 'Charts' }"
                miniIcon="C"
                text="Charts"
              />
              <sidenav-item
                :to="{ name: 'Sweet Alerts' }"
                miniIcon="S"
                text="Sweet Alerts"
              />
              <sidenav-item
                :to="{ name: 'Notifications' }"
                miniIcon="N"
                text="Notifications"
              />
            </ul>
          </template>
        </sidenav-collapse>
      </li>

      <li class="nav-item">
        <sidenav-collapse
          collapseRef="applicationsExamples"
          navText="Applications"
          :class="getRoute() === 'applications' ? 'active' : ''"
        >
          <template v-slot:icon>
            <icon name="applications" />
          </template>
          <template v-slot:list>
            <ul class="nav ms-4 ps-3">
              <!-- nav links -->

              <sidenav-item
                :to="{ name: 'Kanban' }"
                miniIcon="K"
                text="Kanban"
              />
              <sidenav-item
                :to="{ name: 'Wizard' }"
                miniIcon="W"
                text="Wizard"
              />
              <sidenav-item
                :to="{ name: 'Data Tables' }"
                miniIcon="D"
                text="Data Tables"
              />
              <sidenav-item
                :to="{ name: 'Calendar' }"
                miniIcon="C"
                text="Calendar"
              />
              <sidenav-item
                :to="{ name: 'Analytics' }"
                miniIcon="A"
                text="Analytics"
              />
            </ul>
          </template>
        </sidenav-collapse>
      </li>

      <li class="nav-item">
        <sidenav-collapse
          collapseRef="ecommerceExamples"
          navText="Ecommerce"
          :class="getRoute() === 'ecommerce' ? 'active' : ''"
        >
          <template v-slot:icon>
            <icon name="ecommerce" />
          </template>
          <template v-slot:list>
            <ul class="nav ms-4 ps-3">
              <!-- nav links -->
              <sidenav-item
                :to="{ name: 'Overview' }"
                miniIcon="O"
                text="Overview"
              />

              <sidenav-collapse-item
                refer="productsExample"
                miniIcon="P"
                text="Products"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'New Product' }"
                    miniIcon="N"
                    text="New Product"
                  />
                  <sidenav-item
                    :to="{ name: 'Edit Product' }"
                    miniIcon="E"
                    text="Edit Product"
                  />
                  <sidenav-item
                    :to="{ name: 'Product Page' }"
                    miniIcon="P"
                    text="Product page"
                  />
                  <sidenav-item
                    :to="{ name: 'Products List' }"
                    miniIcon="P"
                    text="Products List"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="ordersExample"
                miniIcon="O"
                text="Orders"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Order List' }"
                    miniIcon="O"
                    text="Order List"
                  />
                  <sidenav-item
                    :to="{ name: 'Order Details' }"
                    miniIcon="O"
                    text="Order Details"
                  />
                </template>
              </sidenav-collapse-item>
              <sidenav-item
                :to="{ name: 'Referral' }"
                miniIcon="R"
                text="Referral"
              />
            </ul>
          </template>
        </sidenav-collapse>
      </li>

      <li class="nav-item">
        <sidenav-collapse
          collapseRef="authExamples"
          navText="Authentication"
          :class="getRoute() === 'authentication' ? 'active' : ''"
        >
          <template v-slot:icon>
            <icon name="authentication" />
          </template>
          <template v-slot:list>
            <ul class="nav ms-4 ps-3">
              <!-- nav links -->
              <sidenav-collapse-item
                refer="signinExample"
                miniIcon="S"
                text="Sign In"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Signin Basic' }"
                    miniIcon="B"
                    text="Basic"
                  />
                  <sidenav-item
                    :to="{ name: 'Signin Cover' }"
                    miniIcon="C"
                    text="Cover"
                  />
                  <sidenav-item
                    :to="{ name: 'Signin Illustration' }"
                    miniIcon="I"
                    text="Illustration"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="signupExample"
                miniIcon="S"
                text="Sign Up"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Signup Basic' }"
                    miniIcon="B"
                    text="Basic"
                  />
                  <sidenav-item
                    :to="{ name: 'Signup Cover' }"
                    miniIcon="C"
                    text="Cover"
                  />
                  <sidenav-item
                    :to="{ name: 'Signup Illustration' }"
                    miniIcon="I"
                    text="Illustration"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="resetExample"
                miniIcon="R"
                text="Reset Password"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Reset Basic' }"
                    miniIcon="B"
                    text="Basic"
                  />
                  <sidenav-item
                    :to="{ name: 'Reset Cover' }"
                    miniIcon="C"
                    text="Cover"
                  />
                  <sidenav-item
                    :to="{ name: 'Reset Illustration' }"
                    miniIcon="I"
                    text="Illustration"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="lockExample"
                miniIcon="L"
                text="Lock"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Lock Basic' }"
                    miniIcon="B"
                    text="Basic"
                  />
                  <sidenav-item
                    :to="{ name: 'Lock Cover' }"
                    miniIcon="C"
                    text="Cover"
                  />
                  <sidenav-item
                    :to="{ name: 'Lock Illustration' }"
                    miniIcon="I"
                    text="Illustration"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="StepExample"
                miniIcon="2"
                text="2-Step Verification"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Verification Basic' }"
                    miniIcon="B"
                    text="Basic"
                  />
                  <sidenav-item
                    :to="{ name: 'Verification Cover' }"
                    miniIcon="C"
                    text="Cover"
                  />
                  <sidenav-item
                    :to="{ name: 'Verification Illustration' }"
                    miniIcon="I"
                    text="Illustration"
                  />
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="errorExample"
                miniIcon="E"
                text="Error"
              >
                <template v-slot:nav-child-item>
                  <sidenav-item
                    :to="{ name: 'Error Error404' }"
                    miniIcon="E"
                    text="Error 404"
                  />
                  <sidenav-item
                    :to="{ name: 'Error Error500' }"
                    miniIcon="E"
                    text="Error 500"
                  />
                </template>
              </sidenav-collapse-item>
            </ul>
          </template>
        </sidenav-collapse>
      </li>
      <li class="mt-3 nav-item">
        <hr class="mt-0 horizontal dark" />
        <h6
          class="text-xs ps-4 ms-2 text-uppercase font-weight-bolder opacity-6"
          :class="this.$store.state.isRTL ? 'me-4' : 'ms-2'"
        >
          DOCS
        </h6>
      </li>
      <li class="nav-item">
        <sidenav-collapse
          collapseRef="basicExamples"
          navText="Basic"
          :class="getRoute() === 'basic' ? 'active' : ''"
        >
          <template v-slot:icon>
            <icon name="basic" />
          </template>
          <template v-slot:list>
            <ul class="nav ms-4 ps-3">
              <!-- nav links -->
              <sidenav-collapse-item
                refer="gettingStartedExample"
                miniIcon="G"
                text="Getting Started"
              >
                <template v-slot:nav-child-item>
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      href="https://www.creative-tim.com/learning-lab/bootstrap/quick-start/soft-ui-dashboard"
                      target="_blank"
                    >
                      <span class="text-xs sidenav-mini-icon">Q</span>
                      <span class="sidenav-normal">Quick Start</span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      href="https://www.creative-tim.com/learning-lab/bootstrap/license/soft-ui-dashboard"
                      target="_blank"
                    >
                      <span class="text-xs sidenav-mini-icon">L</span>
                      <span class="sidenav-normal">License</span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      href="https://www.creative-tim.com/learning-lab/bootstrap/overview/soft-ui-dashboard"
                      target="_blank"
                    >
                      <span class="text-xs sidenav-mini-icon">C</span>
                      <span class="sidenav-normal">Contents</span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      href="https://www.creative-tim.com/learning-lab/bootstrap/build-tools/soft-ui-dashboard"
                      target="_blank"
                    >
                      <span class="text-xs sidenav-mini-icon">B</span>
                      <span class="sidenav-normal">Build Tools</span>
                    </a>
                  </li>
                </template>
              </sidenav-collapse-item>

              <sidenav-collapse-item
                refer="foundationExample"
                miniIcon="F"
                text="Foundation"
              >
                <template v-slot:nav-child-item>
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      href="https://www.creative-tim.com/learning-lab/bootstrap/colors/soft-ui-dashboard"
                      target="_blank"
                    >
                      <span class="text-xs sidenav-mini-icon">C</span>
                      <span class="sidenav-normal">Colors</span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      href="https://www.creative-tim.com/learning-lab/bootstrap/grid/soft-ui-dashboard"
                      target="_blank"
                    >
                      <span class="text-xs sidenav-mini-icon">G</span>
                      <span class="sidenav-normal">Grid</span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      href="https://www.creative-tim.com/learning-lab/bootstrap/typography/soft-ui-dashboard"
                      target="_blank"
                    >
                      <span class="text-xs sidenav-mini-icon">T</span>
                      <span class="sidenav-normal">Typography</span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a
                      class="nav-link"
                      href="https://www.creative-tim.com/learning-lab/bootstrap/icons/soft-ui-dashboard"
                      target="_blank"
                    >
                      <span class="text-xs sidenav-mini-icon">I</span>
                      <span class="sidenav-normal">Icons</span>
                    </a>
                  </li>
                </template>
              </sidenav-collapse-item>
            </ul>
          </template>
        </sidenav-collapse>
      </li>
      <li class="nav-item">
        <sidenav-collapse
          collapseRef="componentsExamples"
          navText="Components"
          :class="getRoute() === 'components' ? 'active' : ''"
        >
          <template v-slot:icon>
            <icon name="components" />
          </template>
          <template v-slot:list>
            <ul class="nav ms-4 ps-3">
              <!-- nav links -->
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/alerts/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">A</span>
                  <span class="sidenav-normal">Alerts</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/badge/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">B</span>
                  <span class="sidenav-normal">Badge</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/buttons/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">B</span>
                  <span class="sidenav-normal">Buttons</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/cards/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">C</span>
                  <span class="sidenav-normal">Card</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/carousel/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">C</span>
                  <span class="sidenav-normal">Carousel</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/collapse/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">C</span>
                  <span class="sidenav-normal">Collapse</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/dropdowns/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">D</span>
                  <span class="sidenav-normal">Dropdowns</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/forms/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">F</span>
                  <span class="sidenav-normal">Forms</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/modal/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">M</span>
                  <span class="sidenav-normal">Modal</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/navs/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">N</span>
                  <span class="sidenav-normal">Navs</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/navbar/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">N</span>
                  <span class="sidenav-normal">Navbar</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/pagination/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">P</span>
                  <span class="sidenav-normal">Pagination</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/popovers/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">P</span>
                  <span class="sidenav-normal">Popovers</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/progress/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">P</span>
                  <span class="sidenav-normal">Progress</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/spinners/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">S</span>
                  <span class="sidenav-normal">Spinners</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/tables/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">T</span>
                  <span class="sidenav-normal">Tables</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  href="https://www.creative-tim.com/learning-lab/bootstrap/tooltips/soft-ui-dashboard"
                  target="_blank"
                >
                  <span class="sidenav-mini-icon">T</span>
                  <span class="sidenav-normal">Tooltips</span>
                </a>
              </li>
            </ul>
          </template>
        </sidenav-collapse>
      </li>
      <li class="nav-item">
        <sidenav-collapse
          navText="Changelog"
          v-bind:collapse="false"
          url="#"
          :aria-controls="''"
          collapseRef="https://github.com/creativetimofficial/ct-soft-ui-dashboard-pro/blob/main/CHANGELOG.md"
        >
          <template v-slot:icon>
            <icon name="changelog" />
          </template>
        </sidenav-collapse>
      </li>
    </ul>
  </div>
  <div class="pt-3 mx-3 mt-3 sidenav-footer">
    <sidenav-card
      :class="cardBg"
      textPrimary="Need Help?"
      textSecondary="Please check our docs"
      href="https://www.creative-tim.com/learning-lab/bootstrap/overview/soft-ui-dashboard"
      linkText="Documentation"
      iconClass="ni ni-diamond"
    />
  </div>
</template>
<script>
import Icon from "@/components/Icon.vue";
import SidenavItem from "./SidenavItem.vue";
import SidenavCollapse from "./SidenavCollapse.vue";
import SidenavCard from "./SidenavCard.vue";
import SidenavCollapseItem from "./SidenavCollapseItem.vue";

export default {
  name: "SidenavList",
  props: {
    cardBg: String,
  },
  data() {
    return {
      title: "Soft UI Dashboard PRO",
      controls: "dashboardsExamples",
      isActive: "active",
    };
  },
  components: {
    Icon,
    SidenavItem,
    SidenavCollapse,
    SidenavCard,
    SidenavCollapseItem,
  },
  methods: {
    getRoute() {
      const routeArr = this.$route.path.split("/");
      return routeArr[1];
    },
  },
};
</script>
