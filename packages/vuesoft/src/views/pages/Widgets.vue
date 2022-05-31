<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-lg-3 col-md-6">
        <mini-statistics-card
          class="bg-gradient-success p-0"
          :title="{
            text: 'Battery Health',
            color: 'opacity-7 text-white',
          }"
          :value="{
            text: '99 %',
            color: 'text-white',
          }"
          :icon="{
            component: 'text-dark ni ni-controller',
            background: 'bg-white',
          }"
          direction-reverse
        />
        <mini-statistics-card
          class="bg-gradient-success p-0"
          :title="{
            text: 'Music Volume',
            color: 'opacity-7 text-white',
          }"
          :value="{
            text: '15/100',
            color: 'text-white',
          }"
          :icon="{
            component: 'text-dark ni ni-note-03',
            background: 'bg-white',
          }"
          direction-reverse
        />
      </div>
      <div class="col-lg-3 col-md-6">
        <line-chart
          id="chart-widgets"
          title="Income"
          :value="{
            amount: '$130,832',
            percentage: { value: '+90%', color: 'success' },
          }"
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
            datasets: {
              label: 'Income',
              data: [50, 45, 60, 60, 80, 65, 90, 80, 100],
            },
          }"
        />
      </div>
      <div class="col-lg-6">
        <progress-line-chart
          title="Tasks"
          :count="480"
          :progress="60"
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
            data: [40, 45, 42, 41, 40, 43, 40, 42, 39],
          }"
        />
      </div>
    </div>
    <div class="row mt-4">
      <div class="col-lg-4 col-sm-6">
        <div class="card">
          <div class="card-header p-3 pb-0">
            <h6 class="mb-0">Upcoming Events</h6>
            <p class="text-sm mb-0 text-capitalize font-weight-bold">Joined</p>
          </div>
          <div class="card-body border-radius-lg p-3">
            <default-item
              :icon="{ component: 'money-coins', color: 'info' }"
              title="Cyber Week"
              description="27 March 2020, at 12:30 PM"
            />
            <default-item
              :icon="{ component: 'bell-55', color: 'success' }"
              title="Meeting with Marry"
              description="24 March 2020, at 10:00 PM"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-sm-6">
        <div class="row">
          <div class="col-md-6">
            <default-info-card
              icon="text-white fas fa-landmark"
              title="Salary"
              description="Belong Interactive"
              value="+$2000"
            />
          </div>
          <div class="col-md-6">
            <default-info-card
              icon="text-white fab fa-paypal"
              title="Paypal"
              description="Freelance Payment"
              value="$455.00"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <master-card />
      </div>
    </div>
    <div class="row mt-4">
      <div class="col-lg-3 col-md-6">
        <info-card
          title="Full Body"
          description="What matters is the people who are sparked by it. And the people who are liked."
          :badge="{ text: 'Moderate', color: 'success' }"
        />
      </div>
      <div class="col-lg-2 col-md-6">
        <controller-card />
      </div>
      <div class="col-lg-3">
        <line-chart
          id="chart-widgets-4"
          title="Calories"
          :value="{
            amount: '97',
            percentage: { value: '+5%', color: 'success' },
          }"
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
            datasets: {
              label: 'Income',
              data: [50, 45, 60, 60, 80, 65, 90, 80, 100],
            },
          }"
        />
      </div>
      <div class="col-lg-2 col-md-6">
        <mini-info-card />
      </div>
      <div class="col-lg-2 col-md-6">
        <steps-card
          title="Steps"
          count="11.4K"
          :badge="{ label: '+4.3%', color: 'success' }"
        />
      </div>
    </div>
    <div class="row mt-4">
      <div class="col-lg-5">
        <calendar />
      </div>
      <div class="col-lg-3 mt-0">
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
        <mini-player-card class="mt-4" color="success" />
      </div>
      <div class="col-lg-4">
        <timeline-list
          title="Orders overview"
          description="<i class='fa fa-arrow-up text-success' aria-hidden='true'></i>
        <span class='font-weight-bold'>24%</span> this month"
        >
          <timeline-item
            color="success"
            icon="bell-55"
            title="$2400 Design changes"
            date-time="22 DEC 7:20 PM"
          />
          <TimelineItem
            color="danger"
            icon="html5"
            title="New order #1832412"
            date-time="21 DEC 11 PM"
          />
          <TimelineItem
            color="info"
            icon="cart"
            title="Server payments for April"
            date-time="21 DEC 9:34 PM"
          />
          <TimelineItem
            color="warning"
            icon="credit-card"
            title="New card added for order #4395133"
            date-time="20 DEC 2:20 AM"
          />
          <TimelineItem
            color="primary"
            icon="key-25"
            title="Unlock packages for development"
            date-time="18 DEC 4:54 AM"
          />
          <TimelineItem
            color="success"
            icon="archive-2"
            title="New message unread"
            date-time="16 DEC"
          />
          <TimelineItem
            color="info"
            icon="check-bold"
            title="Notifications unread"
            date-time="15 DEC"
          />
        </timeline-list>
      </div>
    </div>
  </div>
</template>

<script>
import MiniStatisticsCard from "@/examples/Cards/MiniStatisticsCard.vue";
import ProgressLineChart from "./projects/components/ProgressLineChart.vue";
import DefaultInfoCard from "@/examples/Cards/DefaultInfoCard.vue";
import MasterCard from "@/examples/Cards/MasterCard.vue";
import LineChart from "./components/LineChart.vue";
import DefaultItem from "./components/DefaultItem.vue";
import InfoCard from "./components/InfoCard.vue";
import ControllerCard from "./components/ControllerCard.vue";
import MiniInfoCard from "./components/MiniInfoCard.vue";
import StepsCard from "./components/StepsCard.vue";
import Calendar from "@/examples/Calendar.vue";
import CategoriesList from "../dashboards/components/CategoriesList.vue";
import MiniPlayerCard from "@/examples/Cards/MiniPlayerCard.vue";

import TimelineList from "./projects/components/TimelineList.vue";
import TimelineItem from "./projects/components/TimelineItem.vue";

import {
  faRocket,
  faScrewdriverWrench,
  faCube,
} from "@fortawesome/free-solid-svg-icons";

export default {
  name: "Widgets",
  components: {
    MiniStatisticsCard,
    ProgressLineChart,
    DefaultInfoCard,
    MasterCard,
    LineChart,
    DefaultItem,
    InfoCard,
    ControllerCard,
    MiniInfoCard,
    StepsCard,
    Calendar,
    CategoriesList,
    MiniPlayerCard,
    TimelineList,
    TimelineItem,
  },
  data() {
    return {
      faRocket,
      faScrewdriverWrench,
      faCube,
    };
  },
};
</script>
