<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-8 col-12">
        <div class="row">
          <div class="col-lg-4 col-12">
            <animated-statistics-card
              title="Earnings"
              count="$15,800"
              :percentage="{ color: 'dark', label: '+15% since last week' }"
              :action="{
                route: 'https://creative-tim.com',
                label: 'View more',
              }"
            />
          </div>
          <div class="mt-4 col-lg-4 col-md-6 col-12 mt-lg-0">
            <mini-statistics-card
              title="Today's Money"
              value="$53,000"
              :icon="{
                component: 'ni ni-money-coins',
                background: 'bg-gradient-dark',
              }"
              class-content="ms-3"
            />
            <mini-statistics-card
              title="Sessions"
              value="9,600"
              :percentage="{
                value: '+15%',
                color: 'text-success',
              }"
              :icon="{
                component: 'ni ni-planet',
                background: 'bg-gradient-dark',
              }"
              class-content="ms-3"
            />
          </div>
          <div class="mt-4 col-lg-4 col-md-6 col-12 mt-lg-0">
            <mini-statistics-card
              title="Today's Users"
              value="2,300"
              :percentage="{
                value: '+3%',
                color: 'text-success',
              }"
              :icon="{
                component: 'ni ni-world',
                background: 'bg-gradient-dark',
              }"
              class-content="ms-3"
            />
            <mini-statistics-card
              title="Sign-ups"
              value="348"
              :percentage="{
                value: '+12%',
                color: 'text-success',
              }"
              :icon="{
                component: 'ni ni-shop',
                background: 'bg-gradient-dark',
              }"
              class-content="ms-3"
            />
          </div>
        </div>
      </div>
      <div class="mt-4 col-lg-4 col-12 mt-lg-0">
        <announcement-card
          title="I need a Ruby developer for my new website."
          description="The website was initially built in PHP, I need a professional ruby programmer to shift it."
          :by="{
            image: image,
            name: 'lucas prila',
            date: '2h ago',
          }"
          :badge="{ color: 'success', label: 'Recommendation' }"
          :value="{ currency: '$', amount: '3,000', method: 'month' }"
          :action="{ route: 'javascript:;', label: 'Apply' }"
        />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-8 col-12">
        <div class="card">
          <div class="p-3 card-header">
            <div class="row">
              <div class="col-md-6">
                <h6 class="mb-0">To do list</h6>
              </div>
              <div
                class="col-md-6 d-flex justify-content-end align-items-center"
              >
                <small>23 - 30 March 2020</small>
              </div>
            </div>
            <hr class="mb-0 horizontal dark" />
          </div>
          <div class="p-3 pt-0 card-body">
            <ul class="list-group list-group-flush" data-toggle="checklist">
              <todo-item
                title="Check status"
                checkbox-id="flexCheckDefault"
                dropdown-table-id="dropdownTable2"
                date="24 March 2019"
                project-id="2414_VR4sf3#"
                company="Creative Tim"
                :action="[
                  {
                    label: 'Action',
                    route: '/',
                  },
                  {
                    label: 'Another action',
                    route: 'javascript:;',
                  },
                  {
                    label: 'Something else here',
                    route: 'javascript:;',
                  },
                ]"
              />

              <todo-item
                title="Management discussion"
                checkbox-id="flexCheckDefault1"
                dropdown-table-id="dropdownTable3"
                date="24 March 2019"
                project-id="4411_8sIsdd23"
                company="Apple"
                :action="[
                  {
                    label: 'Action',
                    route: '/',
                  },
                  {
                    label: 'Another action',
                    route: 'javascript:;',
                  },
                  {
                    label: 'Something else here',
                    route: 'javascript:;',
                  },
                ]"
                checked
              />

              <todo-item
                title="New channel distribution"
                checkbox-id="flexCheckDefault2"
                dropdown-table-id="dropdownTable"
                date="25 March 2019"
                project-id="827d_kdl33D1s"
                company="Slack"
                :action="[
                  {
                    label: 'Action',
                    route: '/',
                  },
                  {
                    label: 'Another action',
                    route: 'javascript:;',
                  },
                  {
                    label: 'Something else here',
                    route: 'javascript:;',
                  },
                ]"
                checked
              />

              <todo-item
                title="IOS App development"
                checkbox-id="flexCheckDefault3"
                dropdown-table-id="dropdownTable1"
                date="26 March 2019"
                project-id="88s1_349DA2sa"
                :action="[
                  {
                    label: 'Action',
                    route: '/',
                  },
                  {
                    label: 'Another action',
                    route: 'javascript:;',
                  },
                  {
                    label: 'Something else here',
                    route: 'javascript:;',
                  },
                ]"
                company="Facebook"
              />
            </ul>
          </div>
        </div>
      </div>
      <div class="mt-4 col-lg-4 col-12 mt-lg-0">
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

        <progress-doughnut-chart
          title="Projects"
          :count="115"
          :chart="{
            labels: [
              {
                label: 'Done',
                isCompleted: true,
              },
              {
                label: 'In progress',
                isCompleted: false,
              },
            ],
            datasets: {
              label: 'Projects',
              data: [75, 25],
            },
          }"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AnimatedStatisticsCard from "./components/AnimatedStatisticsCard.vue";
import MiniStatisticsCard from "@/examples/Cards/MiniStatisticsCard.vue";
import AnnouncementCard from "./components/AnnouncementCard.vue";
import ProgressLineChart from "./components/ProgressLineChart.vue";
import ProgressDoughnutChart from "./components/ProgressDoughnutChart.vue";
import TodoItem from "./components/TodoItem.vue";
import image from "@/assets/img/team-3.jpg";
export default {
  name: "General",
  components: {
    AnimatedStatisticsCard,
    MiniStatisticsCard,
    AnnouncementCard,
    ProgressLineChart,
    ProgressDoughnutChart,
    TodoItem,
  },
  data() {
    return {
      image,
    };
  },
};
</script>
