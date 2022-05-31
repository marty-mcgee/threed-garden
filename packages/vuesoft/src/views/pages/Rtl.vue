<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-3 col-md-6">
        <mini-statistics-card
          class="bg-gradient-success p-0"
          :title="{
            text: 'صحة البطارية',
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
            text: 'طبقة صوت الموسيقا',
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
          title="دخل"
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
          title="مهام"
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
    <div class="row">
      <div class="col-lg-4 col-sm-6">
        <div class="card">
          <div class="card-header p-3 pb-0">
            <h6 class="mb-0">الأحداث القادمة</h6>
            <p class="text-sm mb-0 text-capitalize font-weight-bold">انضم</p>
          </div>
          <div class="card-body border-radius-lg p-3">
            <default-item
              :icon="{ component: 'money-coins', color: 'info' }"
              title="أسبوع الإنترنت"
              description="01 يونيو 2021, ي 12:30 PM"
            />
            <default-item
              :icon="{ component: 'bell-55', color: 'success' }"
              title="لقاء مع ماري"
              description="24 مايو 2021, ي 10:00 PM"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-4 col-sm-6">
        <div class="row">
          <div class="col-md-6">
            <default-info-card
              icon="text-white fas fa-landmark"
              title="مرتب"
              description="تنتمي التفاعلية"
              value="+$2000"
            />
          </div>
          <div class="col-md-6">
            <default-info-card
              icon="text-white fab fa-paypal"
              title="باي بال"
              description="دفع لحسابهم الخاص"
              value="$455.00"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <master-card
          :card="{
            number: '7852 4594 1122 4562',
            holderName: 'جاك بيترسون',
            expiryDate: '11/22',
            holderText: 'حامل البطاقة',
            expiryText: 'نتهي',
            background: 'dark',
          }"
        />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-3 col-md-6">
        <info-card
          title="جسم كامل"
          description="ما يهم هو الأشخاص الذين أوقدوه. والناس الذين يشبهونهم مستاءون منه."
          :badge="{ text: 'معتدل', color: 'success' }"
        />
      </div>
      <div class="col-lg-2 col-md-6">
        <controller-card id="lights" controller-is="على" text="درجة حرارة" />
      </div>
      <div class="col-lg-3">
        <line-chart
          id="line-chart"
          title="سعرات حراريه"
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
        <mini-info-card
          icon="curved-next"
          color="success"
          title="754
        <span class='text-sm text-secondary'>م</span>"
          description="مدينة نيويورك"
        />
      </div>
      <div class="col-lg-2 col-md-6">
        <steps-card
          title="خطوات"
          count="۱۱.۴ک"
          :badge="{ label: '+4.3%', color: 'success' }"
        />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-5">
        <calendar title="تقویم" />
      </div>
      <div class="mt-0 col-lg-3">
        <categories-list
          title="فئات"
          :items="[
            {
              icon: { component: faRocket, background: 'dark' },
              title: 'الأجهزة',
              description: '250 في المخزن, <strong>346+ تم البيع</strong>',
            },

            {
              icon: {
                component: faScrewdriverWrench,
                background: 'dark',
              },
              title: 'تذاكر',
              description: '123 مغلق, <strong>15 افتح</strong>',
            },
            {
              icon: { component: faCube, background: 'dark' },
              title: 'سجلات الخطأ',
              description: '1 is نشيط, <strong>40 مغلق</strong>',
            },
          ]"
        />
        <mini-player-card
          class="mt-4"
          color="dark"
          :song="{ title: 'نوع من البلوز', singer: 'ديفتونز' }"
        />
      </div>
      <div class="col-lg-4">
        <timeline-list
          title="نظرة عامة على الطلبات"
          description="<i class='fa fa-arrow-up text-success' aria-hidden='true'></i>
        <span class='font-weight-bold'>24%</span>هذا الشهر"
        >
          <timeline-item
            color="success"
            icon="bell-55"
            title="$2400, تغييرات في التصميم"
            date-time="22 ديسمبر 7:20 مساءً"
          />
          <TimelineItem
            color="danger"
            icon="html5"
            title="طلب جديد # 1832412"
            date-time="21 ديسمبر 11 م"
          />
          <TimelineItem
            color="info"
            icon="cart"
            title="مدفوعات الخادم لشهر أبريل"
            date-time="21 ديسمبر 9:34 مساءً"
          />
          <TimelineItem
            color="warning"
            icon="credit-card"
            title="تمت إضافة بطاقة جديدة للأمر رقم 4395133"
            date-time="20 ديسمبر 2:20 صباحًا"
          />
          <TimelineItem
            color="primary"
            icon="key-25"
            title="فتح الحزم من أجل التطوير"
            date-time="18 ديسمبر ، 4:54 صباحًا"
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
  name: "RtlPage",
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
    TimelineItem,
    TimelineList,
  },
  data() {
    return {
      faRocket,
      faScrewdriverWrench,
      faCube,
    };
  },
  beforeMount() {
    this.$store.state.isRTL = true;
    document.querySelector("html").setAttribute("lang", "ar");
    document.querySelector("html").setAttribute("dir", "rtl");
    document.querySelector("#app").classList.add("rtl");
  },
  beforeUnmount() {
    this.$store.state.isRTL = false;
    document.querySelector("html").removeAttribute("lang");
    document.querySelector("html").removeAttribute("dir");
    document.querySelector("#app").classList.remove("rtl");
  },
};
</script>
