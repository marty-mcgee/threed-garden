<template>
  <navbar />
  <div
    class="m-3 page-header bg-gradient-success position-relative border-radius-xl"
  >
    <img
      src="../../assets/img/shapes/waves-white.svg"
      alt="pattern-lines"
      class="top-0 position-absolute opacity-6 start-0 w-100"
    />
    <div class="container pb-10 pb-lg-9 pt-7 postion-relative z-index-2">
      <div class="row">
        <div class="mx-auto text-center col-md-6">
          <h3 class="text-white">See our pricing</h3>
          <p class="text-white">
            You have Free Unlimited Updates and Premium Support on each package.
          </p>
        </div>
      </div>
      <div class="row">
        <div class="mx-auto text-center col-lg-4 col-md-6 col-7">
          <div class="mt-5 nav-wrapper position-relative z-index-2">
            <ul
              id="tabs-pricing"
              class="flex-row p-1 nav nav-pills nav-fill"
              role="tablist"
            >
              <li class="nav-item">
                <a
                  id="tabs-iconpricing-tab-1"
                  class="mb-0 nav-link active"
                  data-bs-toggle="tab"
                  href="#monthly"
                  role="tab"
                  aria-controls="monthly"
                  aria-selected="true"
                >
                  Monthly
                </a>
              </li>
              <li class="nav-item">
                <a
                  id="tabs-iconpricing-tab-2"
                  class="mb-0 nav-link"
                  data-bs-toggle="tab"
                  href="#annual"
                  role="tab"
                  aria-controls="annual"
                  aria-selected="false"
                >
                  Annual
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="mt-n8">
    <div class="container">
      <div class="tab-content tab-space">
        <div id="monthly" class="tab-pane active">
          <div class="row">
            <pricing-card
              :badge="{ color: 'secondary', label: 'Starter' }"
              :price="{ currency: '$', value: '59' }"
              :specifications="[
                { label: '2 team members', includes: true },
                { label: '20GB Cloud storage', includes: true },
                { label: 'Integration help', includes: false },
                { label: 'Sketch Files', includes: false },
                { label: 'API Access', includes: false },
                { label: 'Complete documentation', includes: false },
              ]"
              :action="{
                color: 'dark',
                route: 'javascript:;',
                label: 'Join',
              }"
            />
            <pricing-card
              :badge="{ color: 'secondary', label: 'premium' }"
              :price="{ currency: '$', value: '89' }"
              :specifications="[
                { label: '10 team members', includes: true },
                { label: '40GB Cloud storage', includes: true },
                { label: 'Integration help', includes: true },
                { label: 'Sketch Files', includes: true },
                { label: 'API Access', includes: false },
                { label: 'Complete documentation', includes: false },
              ]"
              :action="{
                color: 'success',
                route: 'javascript:;',
                label: 'Join',
              }"
            />

            <pricing-card
              :badge="{ color: 'secondary', label: 'Enterprise' }"
              :price="{ currency: '$', value: '99' }"
              :specifications="[
                { label: 'Unlimited team members', includes: true },
                { label: '100GB Cloud storage', includes: true },
                { label: 'Integration help', includes: true },
                { label: 'Sketch Files', includes: true },
                { label: 'API Access', includes: true },
                { label: 'Complete documentation', includes: true },
              ]"
              :action="{
                color: 'dark',
                route: 'javascript:;',
                label: 'Join',
              }"
            />
          </div>
        </div>
        <div id="annual" class="tab-pane">
          <div class="row">
            <pricing-card
              :badge="{ color: 'secondary', label: 'Starter' }"
              :price="{ currency: '$', value: '119' }"
              :specifications="[
                { label: '2 team members', includes: true },
                { label: '20GB Cloud storage', includes: true },
                { label: 'Integration help', includes: false },
                { label: 'Sketch Files', includes: false },
                { label: 'API Access', includes: false },
                { label: 'Complete documentation', includes: false },
              ]"
              :action="{
                color: 'dark',
                route: 'javascript:;',
                label: 'Join',
              }"
            />
            <pricing-card
              :badge="{ color: 'secondary', label: 'premium' }"
              :price="{ currency: '$', value: '159' }"
              :specifications="[
                { label: '10 team members', includes: true },
                { label: '40GB Cloud storage', includes: true },
                { label: 'Integration help', includes: true },
                { label: 'Sketch Files', includes: true },
                { label: 'API Access', includes: false },
                { label: 'Complete documentation', includes: false },
              ]"
              :action="{
                color: 'success',
                route: 'javascript:;',
                label: 'Join',
              }"
            />

            <pricing-card
              :badge="{ color: 'secondary', label: 'Enterprise' }"
              :price="{ currency: '$', value: '399' }"
              :specifications="[
                { label: 'Unlimited team members', includes: true },
                { label: '100GB Cloud storage', includes: true },
                { label: 'Integration help', includes: true },
                { label: 'Sketch Files', includes: true },
                { label: 'API Access', includes: true },
                { label: 'Complete documentation', includes: true },
              ]"
              :action="{
                color: 'dark',
                route: 'javascript:;',
                label: 'Join',
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="container my-6">
    <div class="row">
      <div class="mx-auto text-center col-8">
        <h6 class="opacity-5">More than 50+ brands trust Soft</h6>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="mb-4 col-lg-2 col-md-4 col-6">
        <img
          class="w-100 opacity-9"
          src="../../assets/img/logos/gray-logos/logo-coinbase.svg"
          alt="logo_coinbase"
        />
      </div>
      <div class="mb-4 col-lg-2 col-md-4 col-6">
        <img
          class="w-100 opacity-9"
          src="../../assets/img/logos/gray-logos/logo-nasa.svg"
          alt="logo_nasa"
        />
      </div>
      <div class="mb-4 col-lg-2 col-md-4 col-6">
        <img
          class="w-100 opacity-9"
          src="../../assets/img/logos/gray-logos/logo-netflix.svg"
          alt="logo_netflix"
        />
      </div>
      <div class="mb-4 col-lg-2 col-md-4 col-6">
        <img
          class="w-100 opacity-9"
          src="../../assets/img/logos/gray-logos/logo-pinterest.svg"
          alt="logo_pinterest"
        />
      </div>
      <div class="mb-4 col-lg-2 col-md-4 col-6">
        <img
          class="w-100 opacity-9"
          src="../../assets/img/logos/gray-logos/logo-spotify.svg"
          alt="logo_spotify"
        />
      </div>
      <div class="mb-4 col-lg-2 col-md-4 col-6">
        <img
          class="w-100 opacity-9"
          src="../../assets/img/logos/gray-logos/logo-vodafone.svg"
          alt="logo_vodafone"
        />
      </div>
    </div>
    <accordion
      title="Frequently Asked Questions"
      description="A lot of people don&#39;t appreciate the moment until it’s passed.
        I&#39;m not trying my hardest, and I&#39;m not trying to do"
    >
      <accordion-item
        accordion-id="headingTwo"
        collapse-id="collapseTwo"
        question="How can i make the payment?"
      >
        It really matters and then like it really doesn’t matter. What matters
        is the people who are sparked by it. And the people who are like
        offended by it, it doesn’t matter. Because it&#39;s motivating the
        doers. Because I’m here to follow my dreams and and inspire other people
        to follow their dreams, too.
        <br />
        We’re not always in the position that we want to be at. We’re constantly
        growing. We’re constantly making mistakes. We’re constantly trying to
        express ourselves and actualize our dreams. If you have the opportunity
        to play this game of life you need to appreciate every moment. A lot of
        people don’t appreciate the moment until it’s passed.
      </accordion-item>

      <accordion-item
        accordion-id="headingThree"
        collapse-id="collapseThree"
        question="How much time does it take to receive the order?"
      >
        The time is now for it to be okay to be great. People in this world shun
        people for being great. For being a bright color. For standing out. But
        the time is now to be okay to be the greatest you. Would you believe in
        what you believe in, if you were the only one who believed it? If
        everything I did failed - which it doesn&#39;t, it actually succeeds -
        just the fact that I&#39;m willing to fail is an inspiration. People are
        so scared to lose that they don&#39;t even try. Like, one thing people
        can&#39;t say is that I&#39;m not trying, and I&#39;m not trying my
        hardest, and I&#39;m not trying to do the best way I know how.
      </accordion-item>

      <accordion-item
        accordion-id="headingFour"
        collapse-id="collapseFour"
        question="Can I resell the products?"
      >
        I always felt like I could do anything. That’s the main thing people are
        controlled by! Thoughts- their perception of themselves! They&#39;re
        slowed down by their perception of themselves. If you&#39;re taught you
        can’t do anything, you won’t do anything. I was taught I could do
        everything.
        <br /><br />
        If everything I did failed - which it doesn&#39;t, it actually succeeds
        - just the fact that I&#39;m willing to fail is an inspiration. People
        are so scared to lose that they don&#39;t even even try. Like, one thing
        people can&#39;t say is that I&#39;m not trying, and I&#39;m not trying
        my hardest, and I&#39;m not trying trying to do the best way I know how.
      </accordion-item>

      <accordion-item
        accordion-id="headingFifth"
        collapse-id="collapseFifth"
        question="Where do I find the shipping details?"
      >
        There’s nothing I really wanted to do in life that I wasn’t able to get
        good at. That’s my skill. I’m not really specifically talented at
        anything except for the ability to learn. That’s what I do. That’s what
        I’m here for. Don’t be afraid to be wrong because you can’t learn
        anything from a compliment. I always felt like I could do anything.
        That’s the main thing people are controlled by! Thoughts- their
        perception of themselves! They&#39;re slowed down by their perception of
        themselves. If you&#39;re taught you can’t do anything, you won’t do
        anything. I was taught I could do everything.
      </accordion-item>
    </accordion>
  </div>
  <app-footer />
</template>
<script>
import Navbar from "@/examples/PageLayout/Navbar.vue";
import PricingCard from "./components/PricingCard.vue";
import AppFooter from "@/examples/PageLayout/Footer.vue";
import AccordionItem from "./components/AccordionItem.vue";
import setNavPills from "@/assets/js/nav-pills.js";
import Accordion from "./components/Accordion.vue";

export default {
  name: "Pricing",
  components: {
    Navbar,
    PricingCard,
    AppFooter,
    AccordionItem,
    Accordion,
  },
  data() {
    return {};
  },
  mounted() {
    this.$store.state.showSidenav = false;
    this.$store.state.showNavbar = false;
    this.$store.state.showFooter = false;
    setNavPills();
  },
  beforeUnmount() {
    this.$store.state.showSidenav = true;
    this.$store.state.showNavbar = true;
    this.$store.state.showFooter = true;
    if (this.$store.state.isPinned === false) {
      const sidenav_show = document.querySelector(".g-sidenav-show");
      sidenav_show.classList.remove("g-sidenav-hidden");
      sidenav_show.classList.add("g-sidenav-pinned");
      this.$store.state.isPinned = true;
    }
  },
};
</script>
