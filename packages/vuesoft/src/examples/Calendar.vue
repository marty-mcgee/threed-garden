<template>
  <div class="card widget-calendar h-100">
    <!-- Card header -->
    <div class="p-3 pb-0 card-header">
      <h6 class="mb-0">{{ title }}</h6>
      <div class="d-flex">
        <div class="mb-0 text-sm p font-weight-bold widget-calendar-day">
          {{ day }}
        </div>
        <span>,&nbsp;</span>
        <div class="mb-1 text-sm p font-weight-bold widget-calendar-year">
          {{ year }}
        </div>
      </div>
    </div>
    <div class="p-3 card-body">
      <div :id="id" data-toggle="widget-calendar"></div>
    </div>
  </div>
</template>

<script>
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
let calendar;
export default {
  name: "Calendar",
  props: {
    id: {
      type: String,
      default: "widget-calendar",
    },
    title: {
      type: String,
      default: "Calendar",
    },
    day: {
      type: String,
      default: "Tuesday",
    },
    year: {
      type: String,
      default: "2022",
    },
    initialView: {
      type: String,
      default: "dayGridMonth",
    },
    initialDate: {
      type: String,
      default: "2022-02-24",
    },
    events: {
      type: Array,
      default: () => {
        [
          {
            title: "Call with Dave",
            start: "2020-11-18",
            end: "2020-11-18",
            class: "bg-gradient-danger",
          },

          {
            title: "Lunch meeting",
            start: "2020-11-21",
            end: "2020-11-22",
            class: "bg-gradient-warning",
          },

          {
            title: "All day conference",
            start: "2020-11-29",
            end: "2020-11-29",
            class: "bg-gradient-success",
          },

          {
            title: "Meeting with Mary",
            start: "2020-12-01",
            end: "2020-12-01",
            class: "bg-gradient-info",
          },

          {
            title: "Winter Hackaton",
            start: "2020-12-03",
            end: "2020-12-03",
            class: "bg-gradient-danger",
          },

          {
            title: "Digital event",
            start: "2020-12-07",
            end: "2020-12-09",
            class: "bg-gradient-warning",
          },

          {
            title: "Marketing event",
            start: "2020-12-10",
            end: "2020-12-10",
            class: "bg-gradient-primary",
          },

          {
            title: "Dinner with Family",
            start: "2020-12-19",
            end: "2020-12-19",
            class: "bg-gradient-danger",
          },

          {
            title: "Black Friday",
            start: "2020-12-23",
            end: "2020-12-23",
            class: "bg-gradient-info",
          },

          {
            title: "Cyber Week",
            start: "2020-12-02",
            end: "2020-12-02",
            class: "bg-gradient-warning",
          },
        ];
      },
    },
    selectable: {
      type: Boolean,
      default: true,
    },
    editable: {
      type: Boolean,
      default: true,
    },
  },
  mounted() {
    calendar = new Calendar(document.getElementById(this.id), {
      contentHeight: "auto",
      plugins: [dayGridPlugin],
      initialView: this.initialView,
      selectable: this.selectable,
      editable: this.editable,
      initialDate: this.initialDate,
      events: this.events,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth",
      },
      views: {
        month: {
          titleFormat: {
            month: "long",
            year: "numeric",
          },
        },
        agendaWeek: {
          titleFormat: {
            month: "long",
            year: "numeric",
            day: "numeric",
          },
        },
        agendaDay: {
          titleFormat: {
            month: "short",
            year: "numeric",
            day: "numeric",
          },
        },
      },
    });

    calendar.render();
  },
  beforeUnmount() {
    if (calendar) {
      calendar.destroy();
    }
  },
};
</script>
