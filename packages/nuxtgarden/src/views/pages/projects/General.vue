<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-8 col-12">
        <div class="row">
          <div class="col-lg-4 col-12">
            <earnings-card />
          </div>
          <div class="mt-4 col-lg-4 col-md-6 col-12 mt-lg-0">
            <card
              content-class="ms-3"
              title="Today's Money"
              value="$53,000"
              icon-class="ni ni-money-coins"
              icon-background="bg-gradient-dark"
            />
            <card
              content-class="ms-3"
              title="Sessions"
              value="9,600"
              percentage="+15%"
              icon-class="ni ni-planet"
              icon-background="bg-gradient-dark"
            />
          </div>
          <div class="mt-4 col-lg-4 col-md-6 col-12 mt-lg-0">
            <card
              content-class="ms-3"
              title="Today's Users"
              value="2,300"
              percentage="+3%"
              icon-class="ni ni-world"
              icon-background="bg-gradient-dark"
            />
            <card
              content-class="ms-3"
              title="Sign-ups"
              value="348"
              percentage="+12%"
              icon-class="ni ni-shop"
              icon-background="bg-gradient-dark"
            />
          </div>
        </div>
      </div>
      <div class="mt-4 col-lg-4 col-12 mt-lg-0">
        <job-card />
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
              />

              <todo-item
                title="Management discussion"
                checkbox-id="flexCheckDefault1"
                dropdown-table-id="dropdownTable3"
                date="24 March 2019"
                project-id="4411_8sIsdd23"
                company="Apple"
                checked
              />

              <todo-item
                title="New channel distribution"
                checkbox-id="flexCheckDefault2"
                dropdown-table-id="dropdownTable"
                date="25 March 2019"
                project-id="827d_kdl33D1s"
                company="Slack"
                checked
              />

              <todo-item
                title="IOS App development"
                checkbox-id="flexCheckDefault3"
                dropdown-table-id="dropdownTable1"
                date="26 March 2019"
                project-id="88s1_349DA2sa"
                company="Facebook"
              />
            </ul>
          </div>
        </div>
      </div>
      <div class="mt-4 col-lg-4 col-12 mt-lg-0">
        <tasks-card />

        <projects-card />
      </div>
    </div>
  </div>
</template>

<script>
import EarningsCard from "./components/EarningsCard.vue";
import Card from "@/examples/Cards/Card.vue";
import JobCard from "./components/JobCard.vue";
import TasksCard from "./components/TasksCard.vue";
import ProjectsCard from "./components/ProjectsCard.vue";
import TodoItem from "./components/TodoItem.vue";

export default {
  name: "General",
  components: {
    EarningsCard,
    Card,
    JobCard,
    TasksCard,
    ProjectsCard,
    TodoItem,
  },
};
</script>
