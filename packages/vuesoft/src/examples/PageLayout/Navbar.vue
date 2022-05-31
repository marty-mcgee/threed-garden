<template>
  <!-- Navbar -->
  <nav
    class="top-0 navbar navbar-expand-lg position-absolute z-index-3"
    :class="isBlur ? isBlur : 'shadow-none my-2 navbar-transparent w-100'"
  >
    <div class="container">
      <a
        class="navbar-brand font-weight-bolder ms-lg-0 ms-3"
        :class="darkMode ? 'text-black' : 'text-white'"
        href="/"
        >Soft UI Dashboard PRO</a
      >
      <button
        class="shadow-none navbar-toggler ms-2"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navigation"
        aria-controls="navigation"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="mt-2 navbar-toggler-icon">
          <span class="navbar-toggler-bar bar1"></span>
          <span class="navbar-toggler-bar bar2"></span>
          <span class="navbar-toggler-bar bar3"></span>
        </span>
      </button>
      <div
        id="navigation"
        class="pt-3 pb-2 collapse navbar-collapse w-100 py-lg-0"
      >
        <ul class="mx-auto navbar-nav navbar-nav-hover">
          <li class="mx-2 nav-item dropdown dropdown-hover">
            <a
              id="dropdownMenuPages"
              role="button"
              class="cursor-pointer nav-link ps-2 d-flex justify-content-between align-items-center"
              :class="[darkModes]"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Pages
              <img
                :src="downArrWhite"
                alt="down-arrow"
                class="arrow ms-1"
                :class="darkMode ? 'd-none' : 'd-lg-block d-none'"
              />
              <img
                :src="downArrBlack"
                alt="down-arrow"
                class="arrow ms-1 d-block"
                :class="darkMode ? 'd-lg-block' : 'd-lg-none'"
              />
            </a>
            <div
              class="p-3 mt-0 dropdown-menu dropdown-menu-animation dropdown-xl border-radius-xl mt-lg-3"
              aria-labelledby="dropdownMenuPages"
            >
              <div class="row d-none d-lg-block">
                <div class="px-4 py-2 col-12">
                  <div class="row">
                    <div class="col-4 position-relative">
                      <div
                        class="px-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                      >
                        <div class="d-inline-block">
                          <div
                            class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center"
                          >
                            <spaceship />
                          </div>
                        </div>
                        Dashboards
                      </div>
                      <router-link
                        :to="{ name: 'Default' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Default</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Automotive' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Automotive</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Smart Home' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Smart Home</span>
                      </router-link>
                      <router-link
                        to="#"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Virtual Reality</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'CRM' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">CRM</span>
                      </router-link>
                      <div
                        class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                      >
                        <div class="d-inline-block">
                          <div
                            class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                          >
                            <office />
                          </div>
                        </div>
                        Users
                      </div>
                      <router-link
                        :to="{ name: 'Reports' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Reports</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'New User' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">New User</span>
                      </router-link>
                      <hr class="vertical dark" />
                    </div>
                    <div class="col-4 position-relative">
                      <div
                        class="px-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                      >
                        <div class="d-inline-block">
                          <div
                            class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center"
                          >
                            <shop />
                          </div>
                        </div>
                        Profile
                      </div>
                      <router-link
                        :to="{ name: 'Overview' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Overview</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Teams' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Teams</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'All Projects' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Projects</span>
                      </router-link>
                      <div
                        class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                      >
                        <div class="d-inline-block">
                          <div
                            class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                          >
                            <box3d />
                          </div>
                        </div>
                        Projects
                      </div>
                      <router-link
                        :to="{ name: 'General' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">General</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Timeline' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Timeline</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'New Project' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">New Project</span>
                      </router-link>
                      <hr class="vertical dark" />
                    </div>
                    <div class="col-4">
                      <div
                        class="px-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                      >
                        <div class="d-inline-block">
                          <div
                            class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                          >
                            <customer-support />
                          </div>
                        </div>
                        Account
                      </div>
                      <router-link
                        :to="{ name: 'Settings' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Settings</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Billing' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Billing</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Invoice' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Invoice</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Security' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Security</span>
                      </router-link>
                      <div
                        class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                      >
                        <div class="d-inline-block">
                          <div
                            class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                          >
                            <document />
                          </div>
                        </div>
                        Extra
                      </div>
                      <router-link
                        :to="{ name: 'Pricing Page' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Pricing Page</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'RTL' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">RTL Page</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Widgets' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Widgets</span>
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>
              <!-- responsive -->
              <div class="d-lg-none">
                <div
                  class="px-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                >
                  <div class="d-inline-block">
                    <div
                      class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center"
                    >
                      <document />
                    </div>
                  </div>
                  Dashboards
                </div>
                <router-link
                  :to="{ name: 'Default' }"
                  class="dropdown-item border-radius-md"
                  >Default</router-link
                >
                <router-link
                  :to="{ name: 'Automotive' }"
                  class="dropdown-item border-radius-md"
                  >Automotive</router-link
                >
                <router-link
                  :to="{ name: 'Smart Home' }"
                  class="dropdown-item border-radius-md"
                  >Smart Home</router-link
                >
                <router-link
                  :to="{ name: 'VR Default' }"
                  class="dropdown-item border-radius-md"
                  >Virtual Reality</router-link
                >
                <router-link
                  :to="{ name: 'CRM' }"
                  class="dropdown-item border-radius-md"
                  >CRM</router-link
                >
                <div
                  class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                >
                  <div class="d-inline-block">
                    <div
                      class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                    >
                      <office />
                    </div>
                  </div>
                  Users
                </div>
                <router-link
                  :to="{ name: 'Reports' }"
                  class="dropdown-item border-radius-md"
                  >Reports</router-link
                >
                <router-link to="#" class="dropdown-item border-radius-md"
                  >New user</router-link
                >
                <div
                  class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                >
                  <div class="d-inline-block">
                    <div
                      class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                    >
                      <shop />
                    </div>
                  </div>
                  Profile
                </div>
                <router-link
                  :to="{ name: 'Overview' }"
                  class="dropdown-item border-radius-md"
                  >Overview</router-link
                >
                <router-link
                  :to="{ name: 'Teams' }"
                  class="dropdown-item border-radius-md"
                  >Teams</router-link
                >
                <router-link to="#" class="dropdown-item border-radius-md"
                  >Projects</router-link
                >
                <div
                  class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                >
                  <div class="d-inline-block">
                    <div
                      class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                    >
                      <box3d />
                    </div>
                  </div>
                  Projects
                </div>
                <router-link
                  :to="{ name: 'General' }"
                  class="dropdown-item border-radius-md"
                  >General</router-link
                >
                <router-link
                  :to="{ name: 'Timeline' }"
                  class="dropdown-item border-radius-md"
                  >Timeline</router-link
                >
                <router-link
                  :to="{ name: 'New Project' }"
                  class="dropdown-item border-radius-md"
                  >New Project</router-link
                >
                <div
                  class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                >
                  <div class="d-inline-block">
                    <div
                      class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                    >
                      <document />
                    </div>
                  </div>
                  Account
                </div>
                <router-link
                  :to="{ name: 'Settings' }"
                  class="dropdown-item border-radius-md"
                  >Settings</router-link
                >
                <router-link
                  :to="{ name: 'Billing' }"
                  class="dropdown-item border-radius-md"
                  >Billing</router-link
                >
                <router-link
                  :to="{ name: 'Invoice' }"
                  class="dropdown-item border-radius-md"
                  >Invoice</router-link
                >
                <router-link
                  :to="{ name: 'Security' }"
                  class="dropdown-item border-radius-md"
                  >Security</router-link
                >
                <div
                  class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                >
                  <div class="d-inline-block">
                    <div
                      class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                    >
                      <spaceship />
                    </div>
                  </div>
                  Extra
                </div>
                <router-link
                  :to="{ name: 'Pricing Page' }"
                  class="dropdown-item border-radius-md"
                  >Pricing Page</router-link
                >
                <router-link
                  :to="{ name: 'RTL' }"
                  class="dropdown-item border-radius-md"
                  >RTL Page</router-link
                >
                <router-link
                  :to="{ name: 'Widgets' }"
                  class="dropdown-item border-radius-md"
                  >Widgets</router-link
                >
              </div>
            </div>
          </li>
          <li class="mx-2 nav-item dropdown dropdown-hover">
            <a
              id="dropdownMenuAccount"
              role="button"
              class="cursor-pointer nav-link ps-2 d-flex justify-content-between align-items-center"
              :class="[darkModes]"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Authentication
              <img
                :src="downArrWhite"
                alt="down-arrow"
                class="arrow ms-1"
                :class="darkMode ? 'd-none' : 'd-lg-block d-none'"
              />
              <img
                :src="downArrBlack"
                alt="down-arrow"
                class="arrow ms-1 d-block"
                :class="darkMode ? 'd-lg-block' : 'd-lg-none'"
              />
            </a>
            <div
              class="p-3 mt-0 dropdown-menu dropdown-menu-animation dropdown-lg border-radius-xl mt-lg-3"
              aria-labelledby="dropdownMenuAccount"
            >
              <div class="row d-none d-lg-flex">
                <div class="col-6">
                  <div
                    class="py-6 h-100 w-100 d-flex border-radius-lg position-relative dropdown-image"
                    style="
                      background-image: url('../../assets/img/curved-images/curved8.jpg');
                    "
                  >
                    <div
                      class="mask bg-gradient-success border-radius-lg"
                    ></div>
                    <div
                      class="d-flex justify-content-center align-items-center text-center text-white font-weight-bold w-100 z-index-1 flex-column"
                    >
                      <div
                        class="icon icon-shape rounded-circle bg-white shadow text-center"
                      >
                        <i
                          class="ni ni-diamond text-success text-gradient text-lg"
                          aria-hidden="true"
                        ></i>
                      </div>
                      <span class="text-lg mt-2"
                        >Explore our<br />utilities pages</span
                      >
                    </div>
                  </div>
                </div>
                <div
                  class="col-6 ps-0 d-flex justify-content-center flex-column"
                >
                  <ul class="list-group">
                    <li
                      class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                    >
                      <a
                        id="dropdownSignIn"
                        class="mb-1 dropdown-item border-radius-md ps-3 d-flex align-items-center justify-content-between"
                      >
                        <span>Sign In</span>
                        <img
                          src="@/assets/img/down-arrow.svg"
                          alt="down-arrow"
                          class="arrow"
                        />
                      </a>
                      <div
                        class="px-2 py-3 mt-0 dropdown-menu"
                        aria-labelledby="dropdownSignIn"
                      >
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Signin Basic' }"
                        >
                          <span>Basic</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Signin Cover' }"
                        >
                          <span>Cover</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Signin Illustration' }"
                        >
                          <span>Illustration</span>
                        </router-link>
                      </div>
                    </li>
                    <li
                      class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                    >
                      <a
                        id="dropdownSignUp"
                        class="mb-1 dropdown-item border-radius-md ps-3 d-flex align-items-center justify-content-between"
                      >
                        <span>Sign Up</span>
                        <img
                          src="@/assets/img/down-arrow.svg"
                          alt="down-arrow"
                          class="arrow"
                        />
                      </a>
                      <div
                        class="px-2 py-3 mt-0 dropdown-menu"
                        aria-labelledby="dropdownSignUp"
                      >
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Signup Basic' }"
                        >
                          <span>Basic</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Signup Cover' }"
                        >
                          <span>Cover</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Signup Illustration' }"
                        >
                          <span>Illustration</span>
                        </router-link>
                      </div>
                    </li>
                    <li
                      class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                    >
                      <a
                        id="dropdownPasswordReset"
                        class="mb-1 dropdown-item border-radius-md ps-3 d-flex align-items-center justify-content-between"
                      >
                        <span>Reset Password</span>
                        <img
                          src="@/assets/img/down-arrow.svg"
                          alt="down-arrow"
                          class="arrow"
                        />
                      </a>
                      <div
                        class="px-2 py-3 mt-0 dropdown-menu"
                        aria-labelledby="dropdownPasswordReset"
                      >
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Reset Basic' }"
                        >
                          <span>Basic</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Reset Cover' }"
                        >
                          <span>Cover</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Reset Illustration' }"
                        >
                          <span>Illustration</span>
                        </router-link>
                      </div>
                    </li>
                    <li
                      class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                    >
                      <a
                        id="dropdownLock"
                        class="mb-1 dropdown-item border-radius-md ps-3 d-flex align-items-center justify-content-between"
                      >
                        <span>Lock</span>
                        <img
                          src="../../assets/img/down-arrow.svg"
                          alt="down-arrow"
                          class="arrow"
                        />
                      </a>
                      <div
                        class="px-2 py-3 mt-0 dropdown-menu"
                        aria-labelledby="dropdownLock"
                      >
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Lock Basic' }"
                        >
                          <span>Basic</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Lock Cover' }"
                        >
                          <span>Cover</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Lock Illustration' }"
                        >
                          <span>Illustration</span>
                        </router-link>
                      </div>
                    </li>
                    <li
                      class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                    >
                      <a
                        id="dropdown2fa"
                        class="mb-1 dropdown-item border-radius-md ps-3 d-flex align-items-center justify-content-between"
                      >
                        <span>2-Step Verification</span>
                        <img
                          src="@/assets/img/down-arrow.svg"
                          alt="down-arrow"
                          class="arrow"
                        />
                      </a>
                      <div
                        class="px-2 py-3 mt-0 dropdown-menu"
                        aria-labelledby="dropdown2fa"
                      >
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Verification Basic' }"
                        >
                          <span>Basic</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Verification Cover' }"
                        >
                          <span>Cover</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Verification Illustration' }"
                        >
                          <span>Illustration</span>
                        </router-link>
                      </div>
                    </li>
                    <li
                      class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                    >
                      <a
                        id="dropdownError"
                        class="mb-1 dropdown-item border-radius-md ps-3 d-flex align-items-center justify-content-between"
                      >
                        <span>Error</span>
                        <img
                          src="@/assets/img/down-arrow.svg"
                          alt="down-arrow"
                          class="arrow"
                        />
                      </a>
                      <div
                        class="px-2 py-3 mt-0 dropdown-menu"
                        aria-labelledby="dropdownError"
                      >
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Error Error404' }"
                        >
                          <span>404</span>
                        </router-link>
                        <router-link
                          class="mb-1 dropdown-item ps-3 border-radius-md"
                          :to="{ name: 'Error Error500' }"
                        >
                          <span>500</span>
                        </router-link>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="d-lg-none">
                <div class="col-12 d-flex justify-content-center flex-column">
                  <h6
                    class="px-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                  >
                    Sign In
                  </h6>
                  <router-link
                    :to="{ name: 'Signin Basic' }"
                    class="dropdown-item border-radius-md"
                    >Basic</router-link
                  >
                  <router-link
                    :to="{ name: 'Signin Cover' }"
                    class="dropdown-item border-radius-md"
                    >Cover</router-link
                  >
                  <router-link
                    :to="{ name: 'Signin Illustration' }"
                    class="dropdown-item border-radius-md"
                    >Illustration</router-link
                  >
                  <h6
                    class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                  >
                    Sign Up
                  </h6>
                  <router-link
                    :to="{ name: 'Signup Basic' }"
                    class="dropdown-item border-radius-md"
                    >Basic</router-link
                  >
                  <router-link
                    :to="{ name: 'Signup Cover' }"
                    class="dropdown-item border-radius-md"
                    >Cover</router-link
                  >
                  <router-link
                    :to="{ name: 'Signup Illustration' }"
                    class="dropdown-item border-radius-md"
                    >Illustration</router-link
                  >
                  <h6
                    class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                  >
                    Reset Password
                  </h6>
                  <router-link
                    :to="{ name: 'Reset Basic' }"
                    class="dropdown-item border-radius-md"
                    >Basic</router-link
                  >
                  <router-link
                    :to="{ name: 'Reset Cover' }"
                    class="dropdown-item border-radius-md"
                    >Cover</router-link
                  >
                  <router-link
                    :to="{ name: 'Reset Illustration' }"
                    class="dropdown-item border-radius-md"
                    >Illustation</router-link
                  >
                  <h6
                    class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                  >
                    Lock
                  </h6>
                  <router-link
                    :to="{ name: 'Lock Basic' }"
                    class="dropdown-item border-radius-md"
                    >Basic</router-link
                  >
                  <router-link
                    :to="{ name: 'Lock Cover' }"
                    class="dropdown-item border-radius-md"
                    >Cover</router-link
                  >
                  <router-link
                    :to="{ name: 'Lock Illustration' }"
                    class="dropdown-item border-radius-md"
                    >Illustration</router-link
                  >
                  <h6
                    class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                  >
                    2-Step Verification
                  </h6>
                  <router-link
                    :to="{ name: 'Verification Basic' }"
                    class="dropdown-item border-radius-md"
                    >Basic</router-link
                  >
                  <router-link
                    :to="{ name: 'Verification Cover' }"
                    class="dropdown-item border-radius-md"
                    >Cover</router-link
                  >
                  <router-link
                    :to="{ name: 'Verification Illustration' }"
                    class="dropdown-item border-radius-md"
                    >Illustration</router-link
                  >
                  <h6
                    class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                  >
                    Error
                  </h6>

                  <router-link
                    :to="{ name: 'Error Error404' }"
                    class="dropdown-item border-radius-md"
                    >404</router-link
                  >
                  <router-link
                    :to="{ name: 'Error Error500' }"
                    class="dropdown-item border-radius-md"
                    >500</router-link
                  >
                </div>
              </div>
            </div>
          </li>
          <li class="mx-2 nav-item dropdown dropdown-hover">
            <a
              id="dropdownMenuBlocks"
              role="button"
              class="cursor-pointer nav-link ps-2 d-flex justify-content-between align-items-center"
              :class="[darkModes]"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Applications
              <img
                :src="downArrWhite"
                alt="down-arrow"
                class="arrow ms-1"
                :class="darkMode ? 'd-none' : 'd-lg-block d-none'"
              />
              <img
                :src="downArrBlack"
                alt="down-arrow"
                class="arrow ms-1 d-block"
                :class="darkMode ? 'd-lg-block' : 'd-lg-none'"
              />
            </a>
            <div
              class="p-3 mt-0 dropdown-menu dropdown-menu-animation dropdown-md dropdown-md-responsive border-radius-lg mt-lg-3"
              aria-labelledby="dropdownMenuBlocks"
            >
              <div class="d-none d-lg-block">
                <ul class="list-group">
                  <li
                    class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                  >
                    <router-link
                      class="py-2 dropdown-item ps-3 border-radius-md"
                      :to="{ name: 'Kanban' }"
                    >
                      <div class="d-flex">
                        <div class="h-10 mt-1 icon me-3 d-flex">
                          <i
                            class="ni ni-single-copy-04 text-gradient text-success"
                          ></i>
                        </div>
                        <div
                          class="w-100 d-flex align-items-center justify-content-between"
                        >
                          <div>
                            <p class="p-0 dropdown-header text-dark">Kanban</p>
                          </div>
                        </div>
                      </div>
                    </router-link>
                  </li>
                  <li
                    class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                  >
                    <router-link
                      class="py-2 dropdown-item ps-3 border-radius-md"
                      :to="{ name: 'Wizard' }"
                    >
                      <div class="d-flex">
                        <div class="h-10 mt-1 icon me-3 d-flex">
                          <i
                            class="ni ni-laptop text-gradient text-success"
                          ></i>
                        </div>
                        <div
                          class="w-100 d-flex align-items-center justify-content-between"
                        >
                          <div>
                            <p class="p-0 dropdown-header text-dark">Wizard</p>
                          </div>
                        </div>
                      </div>
                    </router-link>
                  </li>
                  <li
                    class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                  >
                    <router-link
                      class="py-2 dropdown-item ps-3 border-radius-md"
                      :to="{ name: 'Data Tables' }"
                    >
                      <div class="d-flex">
                        <div class="h-10 mt-1 icon me-3 d-flex">
                          <i class="ni ni-badge text-gradient text-success"></i>
                        </div>
                        <div
                          class="w-100 d-flex align-items-center justify-content-between"
                        >
                          <div>
                            <p class="p-0 dropdown-header text-dark">
                              DataTables
                            </p>
                          </div>
                        </div>
                      </div>
                    </router-link>
                  </li>
                  <li
                    class="p-0 border-0 nav-item dropdown dropdown-hover dropdown-subitem list-group-item"
                  >
                    <router-link
                      class="py-2 dropdown-item ps-3 border-radius-md"
                      :to="{ name: 'Calendar' }"
                    >
                      <div class="d-flex">
                        <div class="h-10 mt-1 icon me-3 d-flex">
                          <i
                            class="ni ni-notification-70 text-gradient text-success"
                          ></i>
                        </div>
                        <div
                          class="w-100 d-flex align-items-center justify-content-between"
                        >
                          <div>
                            <p class="p-0 dropdown-header text-dark">
                              Calendar
                            </p>
                          </div>
                        </div>
                      </div>
                    </router-link>
                  </li>
                </ul>
              </div>
              <!-- responsive -->
              <div class="row d-lg-none">
                <div class="col-md-12">
                  <router-link
                    class="py-2 ps-3 border-radius-md"
                    :to="{ name: 'Kanban' }"
                  >
                    <div class="d-flex">
                      <div class="h-10 mt-1 icon me-3 d-flex">
                        <i
                          class="ni ni-single-copy-04 text-gradient text-success"
                        ></i>
                      </div>
                      <div
                        class="w-100 d-flex align-items-center justify-content-between"
                      >
                        <div>
                          <p class="p-0 dropdown-header text-dark">Kanban</p>
                        </div>
                      </div>
                    </div>
                  </router-link>
                  <router-link
                    class="py-2 ps-3 border-radius-md"
                    :to="{ name: 'Wizard' }"
                  >
                    <div class="d-flex">
                      <div class="h-10 mt-1 icon me-3 d-flex">
                        <i class="ni ni-laptop text-gradient text-success"></i>
                      </div>
                      <div
                        class="w-100 d-flex align-items-center justify-content-between"
                      >
                        <div>
                          <p class="p-0 dropdown-header text-dark">Wizard</p>
                        </div>
                      </div>
                    </div>
                  </router-link>
                  <router-link
                    class="py-2 ps-3 border-radius-md"
                    :to="{ name: 'Data Tables' }"
                  >
                    <div class="d-flex">
                      <div class="h-10 mt-1 icon me-3 d-flex">
                        <i class="ni ni-badge text-gradient text-success"></i>
                      </div>
                      <div
                        class="w-100 d-flex align-items-center justify-content-between"
                      >
                        <div>
                          <p class="p-0 dropdown-header text-dark">
                            DataTables
                          </p>
                        </div>
                      </div>
                    </div>
                  </router-link>
                  <router-link
                    class="py-2 ps-3 border-radius-md"
                    :to="{ name: 'Calendar' }"
                  >
                    <div class="d-flex">
                      <div class="h-10 mt-1 icon me-3 d-flex">
                        <i
                          class="ni ni-notification-70 text-gradient text-success"
                        ></i>
                      </div>
                      <div
                        class="w-100 d-flex align-items-center justify-content-between"
                      >
                        <div>
                          <p class="p-0 dropdown-header text-dark">Calendar</p>
                        </div>
                      </div>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </li>
          <li class="mx-2 nav-item dropdown dropdown-hover">
            <a
              id="dropdownMenuEcommerce"
              role="button"
              class="cursor-pointer nav-link ps-2 d-flex justify-content-between align-items-center"
              :class="[darkModes]"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Ecommerce
              <img
                :src="downArrWhite"
                alt="down-arrow"
                class="arrow ms-1"
                :class="darkMode ? 'd-none' : 'd-lg-block d-none'"
              />
              <img
                :src="downArrBlack"
                alt="down-arrow"
                class="arrow ms-1 d-block"
                :class="darkMode ? 'd-lg-block' : ' d-lg-none'"
              />
            </a>
            <div
              class="p-3 mt-0 dropdown-menu dropdown-menu-animation dropdown-lg border-radius-xl mt-lg-3"
              aria-labelledby="dropdownMenuEcommerce"
            >
              <div class="row d-none d-lg-block">
                <div class="px-4 py-2 col-12">
                  <div class="row">
                    <div class="col-6 position-relative">
                      <div
                        class="px-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                      >
                        <div class="d-inline-block">
                          <div
                            class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center"
                          >
                            <svg
                              width="12px"
                              height="12px"
                              viewBox="0 0 40 44"
                              version="1.1"
                              xmlns="http://www.w3.org/2000/svg"
                              xmlns:xlink="http://www.w3.org/1999/xlink"
                            >
                              <title>document</title>
                              <g
                                stroke="none"
                                stroke-width="1"
                                fill="none"
                                fill-rule="evenodd"
                              >
                                <g
                                  transform="translate(-1870.000000, -591.000000)"
                                  fill="#FFFFFF"
                                  fill-rule="nonzero"
                                >
                                  <g
                                    transform="translate(1716.000000, 291.000000)"
                                  >
                                    <g
                                      transform="translate(154.000000, 300.000000)"
                                    >
                                      <path
                                        d="M40,40 L36.3636364,40 L36.3636364,3.63636364 L5.45454545,3.63636364 L5.45454545,0 L38.1818182,0 C39.1854545,0 40,0.814545455 40,1.81818182 L40,40 Z"
                                        opacity="0.603585379"
                                      />
                                      <path
                                        d="M30.9090909,7.27272727 L1.81818182,7.27272727 C0.814545455,7.27272727 0,8.08727273 0,9.09090909 L0,41.8181818 C0,42.8218182 0.814545455,43.6363636 1.81818182,43.6363636 L30.9090909,43.6363636 C31.9127273,43.6363636 32.7272727,42.8218182 32.7272727,41.8181818 L32.7272727,9.09090909 C32.7272727,8.08727273 31.9127273,7.27272727 30.9090909,7.27272727 Z M18.1818182,34.5454545 L7.27272727,34.5454545 L7.27272727,30.9090909 L18.1818182,30.9090909 L18.1818182,34.5454545 Z M25.4545455,27.2727273 L7.27272727,27.2727273 L7.27272727,23.6363636 L25.4545455,23.6363636 L25.4545455,27.2727273 Z M25.4545455,20 L7.27272727,20 L7.27272727,16.3636364 L25.4545455,16.3636364 L25.4545455,20 Z"
                                      />
                                    </g>
                                  </g>
                                </g>
                              </g>
                            </svg>
                          </div>
                        </div>
                        Orders
                      </div>
                      <router-link
                        :to="{ name: 'Order List' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Order List</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Order Details' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Order Details</span>
                      </router-link>
                      <div
                        class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                      >
                        <div class="d-inline-block">
                          <div
                            class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                          >
                            <box3d />
                          </div>
                        </div>
                        General
                      </div>
                      <router-link
                        :to="{ name: 'Overview' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Overview</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Referral' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Referral</span>
                      </router-link>
                      <hr class="vertical dark" />
                    </div>
                    <div class="col-6 position-relative">
                      <div
                        class="px-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                      >
                        <div class="d-inline-block">
                          <div
                            class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center"
                          >
                            <shop />
                          </div>
                        </div>
                        Products
                      </div>
                      <router-link
                        :to="{ name: 'New Product' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">New Product</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Edit Product' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Edit Product</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Product Page' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Product Page</span>
                      </router-link>
                      <router-link
                        :to="{ name: 'Products List' }"
                        class="dropdown-item border-radius-md"
                      >
                        <span class="ps-3">Products List</span>
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>
              <!-- responsive -->
              <div class="d-lg-none">
                <div
                  class="px-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                >
                  <div class="d-inline-block">
                    <div
                      class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center"
                    >
                      <shop />
                    </div>
                  </div>
                  Orders
                </div>
                <router-link
                  :to="{ name: 'Order List' }"
                  class="dropdown-item border-radius-md"
                  >Order List</router-link
                >
                <router-link
                  :to="{ name: 'Order Details' }"
                  class="dropdown-item border-radius-md"
                  >Order Details</router-link
                >
                <div
                  class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                >
                  <div class="d-inline-block">
                    <div
                      class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                    >
                      <box3d />
                    </div>
                  </div>
                  General
                </div>
                <router-link
                  :to="{ name: 'Overview' }"
                  class="dropdown-item border-radius-md"
                  >Overview</router-link
                >
                <router-link
                  :to="{ name: 'Referral' }"
                  class="dropdown-item border-radius-md"
                  >Referral</router-link
                >
                <div
                  class="px-0 mt-3 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                >
                  <div class="d-inline-block">
                    <div
                      class="text-center icon icon-shape icon-xs border-radius-md bg-gradient-success me-2 d-flex align-items-center justify-content-center ps-0"
                    >
                      <shop />
                    </div>
                  </div>
                  Products
                </div>
                <router-link
                  :to="{ name: 'New Product' }"
                  class="dropdown-item border-radius-md"
                  >New Product</router-link
                >
                <router-link
                  :to="{ name: 'Edit Product' }"
                  class="dropdown-item border-radius-md"
                  >Edit Product</router-link
                >
                <router-link
                  :to="{ name: 'Product Page' }"
                  class="dropdown-item border-radius-md"
                  >Product Page</router-link
                >
                <router-link
                  :to="{ name: 'Products List' }"
                  class="dropdown-item border-radius-md"
                  >Products List</router-link
                >
              </div>
            </div>
          </li>
          <li class="mx-2 nav-item dropdown dropdown-hover">
            <a
              id="dropdownMenuDocs"
              role="button"
              class="cursor-pointer nav-link ps-2 d-flex justify-content-between align-items-center"
              :class="[darkModes]"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Docs
              <img
                :src="downArrWhite"
                alt="down-arrow"
                class="arrow ms-1"
                :class="darkMode ? 'd-none' : 'd-lg-block d-none'"
              />
              <img
                :src="downArrBlack"
                alt="down-arrow"
                class="arrow ms-1 d-block"
                :class="darkMode ? 'd-lg-block' : 'd-lg-none'"
              />
            </a>
            <div
              class="p-3 mt-0 dropdown-menu dropdown-menu-animation dropdown-lg mt-lg-3 border-radius-lg"
              aria-labelledby="dropdownMenuDocs"
            >
              <div class="d-none d-lg-block">
                <ul class="list-group">
                  <li class="p-0 border-0 nav-item list-group-item">
                    <a
                      class="py-2 dropdown-item ps-3 border-radius-md"
                      href="https://www.creative-tim.com/learning-lab/vue/overview/soft-ui-dashboard/"
                    >
                      <div class="d-flex">
                        <div class="h-10 mt-1 icon me-3 d-flex">
                          <getting-started />
                        </div>
                        <div>
                          <h6
                            class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                          >
                            Getting Started
                          </h6>
                          <span class="text-sm">
                            All about overview, quick start, license and
                            contents
                          </span>
                        </div>
                      </div>
                    </a>
                  </li>
                  <li class="p-0 border-0 nav-item list-group-item">
                    <a
                      class="py-2 dropdown-item ps-3 border-radius-md"
                      href="https://www.creative-tim.com/learning-lab/vue/colors/soft-ui-dashboard/"
                    >
                      <div class="d-flex">
                        <div class="h-10 mt-1 icon me-3 d-flex">
                          <Document
                            height="16px"
                            width="16px"
                            class="text-secondary"
                          />
                        </div>
                        <div>
                          <h6
                            class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                          >
                            Foundation
                          </h6>
                          <span class="text-sm"
                            >See our colors, icons and typography</span
                          >
                        </div>
                      </div>
                    </a>
                  </li>
                  <li class="p-0 border-0 nav-item list-group-item">
                    <a
                      class="py-2 dropdown-item ps-3 border-radius-md"
                      href="https://www.creative-tim.com/learning-lab/vue/alerts/soft-ui-dashboard/"
                    >
                      <div class="d-flex">
                        <div class="h-10 mt-1 icon me-3 d-flex">
                          <box3d
                            height="16px"
                            width="16px"
                            class="text-secondary"
                          />
                        </div>
                        <div>
                          <h6
                            class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                          >
                            Components
                          </h6>
                          <span class="text-sm">
                            Explore our collection of fully designed components
                          </span>
                        </div>
                      </div>
                    </a>
                  </li>
                  <li class="p-0 border-0 nav-item list-group-item">
                    <a
                      class="py-2 dropdown-item ps-3 border-radius-md"
                      href="https://www.creative-tim.com/learning-lab/vue/datepicker/soft-ui-dashboard/"
                    >
                      <div class="d-flex">
                        <div class="h-10 mt-1 icon me-3 d-flex">
                          <switches />
                        </div>
                        <div>
                          <h6
                            class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                          >
                            Plugins
                          </h6>
                          <span class="text-sm"
                            >Check how you can integrate our plugins</span
                          >
                        </div>
                      </div>
                    </a>
                  </li>
                  <li class="p-0 border-0 nav-item list-group-item">
                    <a
                      class="py-2 dropdown-item ps-3 border-radius-md"
                      href="https://www.creative-tim.com/learning-lab/vue/utilities/soft-ui-dashboard/"
                    >
                      <div class="d-flex">
                        <div class="h-10 mt-1 icon me-3 d-flex">
                          <settings
                            height="16px"
                            width="16px"
                            class="text-secondary"
                          />
                        </div>
                        <div>
                          <h6
                            class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                          >
                            Utility Classes
                          </h6>
                          <span class="text-sm">
                            For those who want flexibility, use our utility
                            classes
                          </span>
                        </div>
                      </div>
                    </a>
                  </li>
                </ul>
              </div>
              <div class="row d-lg-none">
                <div class="col-md-12 g-0">
                  <a
                    class="py-2 dropdown-item ps-3 border-radius-md"
                    href="../../pages/about-us.html"
                  >
                    <div class="d-flex">
                      <div class="h-10 mt-1 icon me-3 d-flex">
                        <spaceship
                          height="16px"
                          width="16px"
                          class="text-secondary"
                        />
                      </div>
                      <div>
                        <h6
                          class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                        >
                          Getting Started
                        </h6>
                        <span class="text-sm">
                          All about overview, quick start, license and contents
                        </span>
                      </div>
                    </div>
                  </a>
                  <a
                    class="py-2 dropdown-item ps-3 border-radius-md"
                    href="../../pages/about-us.html"
                  >
                    <div class="d-flex">
                      <div class="h-10 mt-1 icon me-3 d-flex">
                        <Document
                          height="16px"
                          width="16px"
                          class="text-secondary"
                        />
                      </div>
                      <div>
                        <h6
                          class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                        >
                          Foundation
                        </h6>
                        <span class="text-sm"
                          >See our colors, icons and typography</span
                        >
                      </div>
                    </div>
                  </a>
                  <a
                    class="py-2 dropdown-item ps-3 border-radius-md"
                    href="../../pages/about-us.html"
                  >
                    <div class="d-flex">
                      <div class="h-10 mt-1 icon me-3 d-flex">
                        <box3d
                          height="16px"
                          width="16px"
                          class="text-secondary"
                        />
                      </div>
                      <div>
                        <h6
                          class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                        >
                          Components
                        </h6>
                        <span class="text-sm">
                          Explore our collection of fully designed components
                        </span>
                      </div>
                    </div>
                  </a>
                  <a
                    class="py-2 dropdown-item ps-3 border-radius-md"
                    href="../../pages/about-us.html"
                  >
                    <div class="d-flex">
                      <div class="h-10 mt-1 icon me-3 d-flex">
                        <switches />
                      </div>
                      <div>
                        <h6
                          class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                        >
                          Plugins
                        </h6>
                        <span class="text-sm"
                          >Check how you can integrate our plugins</span
                        >
                      </div>
                    </div>
                  </a>
                  <a
                    class="py-2 dropdown-item ps-3 border-radius-md"
                    href="../../pages/about-us.html"
                  >
                    <div class="d-flex">
                      <div class="h-10 mt-1 icon me-3 d-flex">
                        <settings
                          height="16px"
                          width="16px"
                          class="text-secondary"
                        />
                      </div>
                      <div>
                        <h6
                          class="p-0 dropdown-header text-dark font-weight-bolder d-flex align-items-center"
                        >
                          Utility Classes
                        </h6>
                        <span class="text-sm">
                          All about overview, quick start, license and contents
                        </span>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <ul class="navbar-nav d-lg-block d-none">
          <li class="nav-item">
            <a
              href="javascript:;"
              class="mb-0 btn btn-sm btn-round me-1"
              :class="btnBackground ? btnBackground : 'bg-white'"
              onclick="smoothToPricing('pricing-soft-ui')"
              >Buy Now</a
            >
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <!-- End Navbar -->
</template>

<script>
/*eslint-disable*/
import downArrWhite from "@/assets/img/down-arrow-white.svg";
import downArrBlack from "@/assets/img/down-arrow-dark.svg";
import Office from "../../components/Icon/Office.vue";
import Shop from "../../components/Icon/Shop.vue";
import CustomerSupport from "../../components/Icon/CustomerSupport.vue";
import Document from "../../components/Icon/Document.vue";
import Spaceship from "../../components/Icon/Spaceship.vue";
import GettingStarted from "../../components/Icon/GettingStarted.vue";
import Switches from "../../components/Icon/Switches.vue";
import Box3d from "../../components/Icon/Box3d.vue";
import Settings from "../../components/Icon/Settings.vue";

export default {
  name: "Navbar",
  components: {
    Office,
    Shop,
    CustomerSupport,
    Document,
    Spaceship,
    GettingStarted,
    Switches,
    Box3d,
    Settings
  },
  props: {
    btnBackground: String,
    isBlur: String,
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      downArrWhite,
      downArrBlack
    };
  },
  computed: {
    darkModes() {
      return {
        "text-dark": this.darkMode
      };
    }
  }
};
</script>
