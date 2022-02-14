<template>
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-lg-3 col-md-6">
        <card
          class="bg-gradient-success p-0"
          title="Battery Health"
          value="99 %"
          iconClass="text-dark ni ni-controller"
          titleColor="opacity-7 text-white"
          valueColor="text-white"
          directionReverse
        />
        <card
          class="bg-gradient-success p-0"
          title="Music Volume"
          value="15/100"
          iconClass="text-dark ni ni-note-03"
          titleColor="opacity-7 text-white"
          valueColor="text-white"
          directionReverse
        />
      </div>
      <div class="col-lg-3 col-md-6">
        <income-chart />
      </div>
      <div class="col-lg-6">
        <tasks-card />
      </div>
    </div>
    <div class="row mt-4">
      <div class="col-lg-4 col-sm-6">
        <events-card />
      </div>
      <div class="col-lg-4 col-sm-6">
        <div class="row">
          <div class="col-md-6">
            <default-info-card
              :classIcon="salary.classIcon"
              :title="salary.title"
              :desc="salary.desc"
              :price="salary.price"
            />
          </div>
          <div class="col-md-6">
            <default-info-card
              :classIcon="paypal.classIcon"
              :title="paypal.title"
              :desc="paypal.desc"
              :price="paypal.price"
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
        <full-body-card />
      </div>
      <div class="col-lg-2 col-md-6">
        <controller-card />
      </div>
      <div class="col-lg-3">
        <calories-chart />
      </div>
      <div class="col-lg-2 col-md-6">
        <mini-info-card />
      </div>
      <div class="col-lg-2 col-md-6">
        <steps-card />
      </div>
    </div>
    <div class="row mt-4">
      <div class="col-lg-5">
        <calendar />
      </div>
      <div class="col-lg-3 mt-0">
        <categories-card />
        <music-player />
      </div>
      <div class="col-lg-4">
        <Orders-card />
      </div>
    </div>
  </div>
</template>

<script>
import Card from "@/examples/Cards/Card.vue";
import TasksCard from "./projects/components/TasksCard.vue";
import DefaultInfoCard from "@/examples/Cards/DefaultInfoCard.vue";
import MasterCard from "@/examples/Cards/MasterCard.vue";
import IncomeChart from "./components/IncomeChart.vue";
import CaloriesChart from "./components/CaloriesChart.vue";
import EventsCard from "./components/EventsCard.vue";
import FullBodyCard from "./components/FullBodyCard.vue";
import ControllerCard from "./components/ControllerCard.vue";
import MiniInfoCard from "./components/MiniInfoCard.vue";
import StepsCard from "./components/StepsCard.vue";
import Calendar from "@/examples/Calendar.vue";
import CategoriesCard from "../dashboards/components/CategoriesCard.vue";
import MusicPlayer from "./components/MusicPlayer.vue";
import OrdersCard from "./components/OrdersCard.vue";

export default {
  name: "Widgets",
  components: {
    Card,
    TasksCard,
    DefaultInfoCard,
    MasterCard,
    IncomeChart,
    CaloriesChart,
    EventsCard,
    FullBodyCard,
    ControllerCard,
    MiniInfoCard,
    StepsCard,
    Calendar,
    CategoriesCard,
    OrdersCard,
    MusicPlayer,
  },
  data() {
    return {
      stats: {
        titleColor: "opacity-7 text-white",
        descColor: "text-white",
        health: {
          title: "Battery Health",
          desc: "99 %",
          classIcon: "text-dark ni ni-controller ",
        },
        volume: {
          title: "Music Volume",
          desc: "15/100",
          classIcon: "text-dark ni ni-note-03",
        },
      },
      salary: {
        classIcon: "text-white fas fa-landmark",
        title: "Salary",
        desc: "Belong Interactive",
        price: "+$2000",
      },
      paypal: {
        classIcon: "text-white fab fa-paypal",
        title: "Paypal",
        desc: "Freelance Payment",
        price: "$455.00",
      },
    };
  },
};
</script>
