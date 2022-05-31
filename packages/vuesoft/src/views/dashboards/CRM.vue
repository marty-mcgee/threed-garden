<template>
  <main
    class="main-content position-relative max-height-vh-100 h-100 border-radius-lg"
  >
    <div class="py-4 container-fluid">
      <div class="row">
        <div class="col-xl-8 col-lg-7">
          <div class="row">
            <div class="col-sm-4">
              <mini-gradient-line-chart
                id="second-chart"
                title="Visitors"
                description='5,927<span class="text-sm text-success font-weight-bolder">+55%</span>'
                :chart="{
                  labels: [
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ],
                  datasets: [
                    {
                      data: [50, 45, 60, 60, 80, 65, 90, 80, 100],
                      label: 'Visitors',
                    },
                  ],
                }"
              />
            </div>
            <div class="mt-4 col-sm-4 mt-sm-0">
              <mini-gradient-line-chart
                title="Income"
                description='$130,832 <span class="text-sm text-success font-weight-bolder">+90%</span>'
                :chart="{
                  labels: [
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ],
                  datasets: [
                    {
                      data: [60, 80, 75, 90, 67, 100, 90, 110, 120],
                      label: 'Income',
                    },
                  ],
                }"
              />
            </div>
            <div class="mt-4 col-sm-4 mt-sm-0">
              <place-holder-card :title="{ variant: 'h6', text: 'New tab' }" />
            </div>
          </div>
          <div class="mt-4 row">
            <div class="col-12">
              <calendar />
            </div>
          </div>
        </div>
        <div class="mt-4 col-xl-4 col-lg-5 mt-lg-0">
          <div class="row">
            <div class="col-lg-12">
              <background-blog-card
                :image="backgroundImage"
                title="Hey John!"
                description="Wealth creation is an evolutionarily recent positive-sum game. It is
          all about who take the opportunity first."
                :action="{
                  route: '/',
                  label: 'Read more',
                }"
              />
            </div>
            <div class="col-lg-12 col-sm-6">
              <categories-list
                :items="[
                  {
                    icon: { component: faRocket, background: 'dark' },
                    title: 'Devices',
                    description: '250 in stock <strong>346+ sold</strong>',
                  },
                  {
                    icon: {
                      component: faScrewdriverWrench,
                      background: 'dark',
                    },
                    title: 'Tickets',
                    description: '123 closed <strong>15 open</strong>',
                  },
                  {
                    icon: { component: faCube, background: 'dark' },
                    title: 'Error logs',
                    description: '1 is active <strong>40 closed</strong>',
                  },
                ]"
              />
            </div>
            <div class="col-lg-12 col-sm-6">
              <message-card
                message="Happy Birthday dearest wahtever."
                :image="{ url: image, alt: 'Kal' }"
                :action="{
                  route: '/',
                  label: 'Send me a message',
                  color: 'dark',
                }"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 row">
        <div class="col-sm-6">
          <ranking-list-card
            :card="{ title: 'Transactions', date: '23 - 30 March 2021' }"
            :item="[
              {
                title: 'Netflix',
                date: '27 March 2020, at 12:30 PM',
                amount: '- $ 2,500',
                icon: 'fa-arrow-down',
                color: 'danger',
              },
              {
                title: 'Apple',
                date: '23 March 2020, at 04:30 AM',
                amount: '+ $ 2,000',
                icon: 'fa-arrow-up',
                color: 'success',
              },
              {
                title: 'Partner #22213',
                date: '19 March 2020, at 02:50 AM',
                amount: '+ $ 1,400',
                icon: 'fa-arrow-up',
                color: 'success',
              },
            ]"
          />
        </div>
        <div class="mt-4 col-sm-6 mt-sm-0">
          <ranking-list-card
            :card="{ title: 'Revenue', date: '01 - 07 June 2021' }"
            :item="[
              {
                title: 'via PayPal',
                date: '07 June 2021, at 09:00 AM',
                amount: '+ $ 4,999',
                icon: 'fa-arrow-up',
                color: 'success',
              },
              {
                title: 'Partner #90211',
                date: '07 June 2021, at 05:50 AM',
                amount: '+ $ 700',
                icon: 'fa-arrow-up',
                color: 'success',
              },
              {
                title: 'Services',
                date: '07 June 2021, at 07:10 PM',
                amount: '- $ 1,800',
                icon: 'fa-arrow-down',
                color: 'danger',
              },
            ]"
          />
        </div>
      </div>
      <app-footer />
    </div>
  </main>
</template>

<script>
import MiniGradientLineChart from "@/views/dashboards/components/MiniGradientLineChart.vue";
import PlaceHolderCard from "@/examples/Cards/PlaceHolderCard.vue";
import BackgroundBlogCard from "./components/BackgroundBlogCard.vue";
import CategoriesList from "./components/CategoriesList.vue";
import MessageCard from "./components/MessageCard.vue";
import RankingListCard from "../../examples/Cards/RankingListCard.vue";
import Calendar from "../../examples/Calendar.vue";
import AppFooter from "../../examples/Footer.vue";

import image from "@/assets/img/kal-visuals-square.jpg";
import backgroundImage from "@/assets/img/ivancik.jpg";
import {
  faRocket,
  faScrewdriverWrench,
  faCube,
} from "@fortawesome/free-solid-svg-icons";
export default {
  name: "Crm",
  components: {
    MiniGradientLineChart,
    PlaceHolderCard,
    BackgroundBlogCard,
    CategoriesList,
    MessageCard,
    Calendar,
    RankingListCard,
    AppFooter,
  },
  data() {
    return {
      image,
      faRocket,
      faScrewdriverWrench,
      faCube,
      backgroundImage,
    };
  },
  beforeMount() {
    this.$store.state.showFooter = false;
  },
  beforeUnmount() {
    this.$store.state.showFooter = true;
  },
};
</script>
