<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-lg-3 col-md-6">
        <card
          class="p-0 bg-gradient-success"
          title="صحة البطارية"
          value="99 %"
          icon-class="text-dark ni ni-controller"
          title-color="opacity-7 text-white"
          value-color="text-white"
          direction-reverse
        />
        <card
          class="p-0 bg-gradient-success"
          title="طبقة صوت الموسيقا"
          value="15/100"
          icon-class="text-dark ni ni-note-03"
          title-color="opacity-7 text-white"
          value-color="text-white"
          direction-reverse
        />
      </div>
      <div class="col-lg-3 col-md-6">
        <income-chart title="دخل" />
      </div>
      <div class="col-lg-6">
        <tasks-card title="مهام" />
      </div>
    </div>
    <div class="row">
      <div class="col-lg-4 col-sm-6">
        <events-card
          title="الأحداث القادمة"
          sub-title="انضم"
          event-title="أسبوع الإنترنت"
          event-date="01 يونيو 2021, ي 12:30 PM"
          event-title2="لقاء مع ماري"
          event-date2="24 مايو 2021, ي 10:00 PM"
        />
      </div>
      <div class="col-lg-4 col-sm-6">
        <div class="row">
          <div class="col-md-6">
            <default-info-card
              class-icon="text-white fas fa-landmark"
              title="مرتب"
              desc="تنتمي التفاعلية"
              price="+$2000"
            />
          </div>
          <div class="col-md-6">
            <default-info-card
              class-icon="text-white fab fa-paypal"
              title="باي بال"
              desc="دفع لحسابهم الخاص"
              price="$455.00"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <master-card
          card-holder-text="حامل البطاقة"
          name="جاك بيترسون"
          card-expiration-text="نتهي"
        />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-3 col-md-6">
        <full-body-card
          title="جسم كامل"
          badge-text="معتدل"
          description="ما يهم هو الأشخاص الذين أوقدوه. والناس الذين يشبهونهم مستاءون منه."
        />
      </div>
      <div class="col-lg-2 col-md-6">
        <controller-card controller-is="على" text="درجة حرارة" />
      </div>
      <div class="col-lg-3">
        <calories-chart title="سعرات حراريه" />
      </div>
      <div class="col-lg-2 col-md-6">
        <mini-info-card unit="م" location="مدينة نيويورك" />
      </div>
      <div class="col-lg-2 col-md-6">
        <steps-card title="خطوات" steps="11.4ک" />
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-lg-5">
        <calendar title="تقویم" />
      </div>
      <div class="mt-0 col-lg-3">
        <categories-card
          card-title="فئات"
          title="الأجهزة"
          title-desc="250 في المخزن"
          title-desc2="346+ تم البيع"
          title2="تذاكر"
          title2-desc="123 مغلق"
          title2-desc2="15 افتح"
          title3="سجلات الخطأ"
          title3-desc="1 is نشيط"
          title3-desc2="40 مغلق"
        />
        <music-player title="نوع من البلوز" desc="ديفتونز" />
      </div>
      <div class="col-lg-4">
        <Orders-card
          title="نظرة عامة على الطلبات"
          text="هذا الشهر"
          order="$2400, تغييرات في التصميم"
          date="22 ديسمبر 7:20 مساءً"
          new-order="طلب جديد # 1832412"
          order-date="21 ديسمبر 11 م"
          payment="مدفوعات الخادم لشهر أبريل"
          payment-date="21 ديسمبر 9:34 مساءً"
          new-card="تمت إضافة بطاقة جديدة للأمر رقم 4395133"
          new-card-date="20 ديسمبر 2:20 صباحًا"
          unlock-packages="فتح الحزم من أجل التطوير"
          unlock-packages-date="18 ديسمبر ، 4:54 صباحًا"
          new-order2="طلب جديد # 9583120"
          new-order2-date="17 ديسمبر"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Card from "@/components/sections/Cards/Card.vue";
import TasksCard from "./projects/components/TasksCard.vue";
import DefaultInfoCard from "@/components/sections/Cards/DefaultInfoCard.vue";
import MasterCard from "@/components/sections/Cards/MasterCard.vue";
import IncomeChart from "./components/IncomeChart.vue";
import CaloriesChart from "./components/CaloriesChart.vue";
import EventsCard from "./components/EventsCard.vue";
import FullBodyCard from "./components/FullBodyCard.vue";
import ControllerCard from "./components/ControllerCard.vue";
import MiniInfoCard from "./components/MiniInfoCard.vue";
import StepsCard from "./components/StepsCard.vue";
import Calendar from "@/components/sections/Calendar.vue";
import CategoriesCard from "@/components/dashboards/components/CategoriesCard.vue";
import MusicPlayer from "./components/MusicPlayer.vue";
import OrdersCard from "./components/OrdersCard.vue";

export default {
  name: "RtlPage",
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
  beforeMount() {
    this.$store.dispatch('enableRTL')
  },
  beforeUnmount() {
    this.$store.dispatch('disableRTL')
  },
};
</script>
