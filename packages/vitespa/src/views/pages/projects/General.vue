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
              contentClass="ms-3"
              title="Today's Money"
              value="$53,000"
              iconClass="ni ni-money-coins"
              iconBackground="bg-gradient-dark"
            />
            <card
              contentClass="ms-3"
              title="Sessions"
              value="9,600"
              percentage="+15%"
              iconClass="ni ni-planet"
              iconBackground="bg-gradient-dark"
            />
          </div>
          <div class="mt-4 col-lg-4 col-md-6 col-12 mt-lg-0">
            <card
              contentClass="ms-3"
              title="Today's Users"
              value="2,300"
              percentage="+3%"
              iconClass="ni ni-world"
              iconBackground="bg-gradient-dark"
            />
            <card
              contentClass="ms-3"
              title="Sign-ups"
              value="348"
              percentage="+12%"
              iconClass="ni ni-shop"
              iconBackground="bg-gradient-dark"
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
                checkboxId="flexCheckDefault"
                dropdownTableId="dropdownTable2"
                date="24 March 2019"
                projectId="2414_VR4sf3#"
                company="Creative Tim"
              />

              <todo-item
                title="Management discussion"
                checkboxId="flexCheckDefault1"
                dropdownTableId="dropdownTable3"
                date="24 March 2019"
                projectId="4411_8sIsdd23"
                company="Apple"
                checked
              />

              <todo-item
                title="New channel distribution"
                checkboxId="flexCheckDefault2"
                dropdownTableId="dropdownTable"
                date="25 March 2019"
                projectId="827d_kdl33D1s"
                company="Slack"
                checked
              />

              <todo-item
                title="IOS App development"
                checkboxId="flexCheckDefault3"
                dropdownTableId="dropdownTable1"
                date="26 March 2019"
                projectId="88s1_349DA2sa"
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
  name: "general",
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
