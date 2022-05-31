<template>
  <div class="py-4 container-fluid">
    <div class="row gx-4">
      <div class="mt-4 col-lg-6 mt-lg-0">
        <timeline-list title="Timeline">
          <timeline-item
            color="success"
            icon="bell-55"
            title="$2400 Design changes"
            date-time="22 DEC 7:20 PM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['design']"
          />
          <TimelineItem
            color="danger"
            icon="html5"
            title="New order #1832412"
            date-time="21 DEC 11 PM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['order', '#1832412']"
          />
          <TimelineItem
            color="info"
            icon="cart"
            title="Server payments for April"
            date-time="21 DEC 9:34 PM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['server', 'payments']"
          />
          <TimelineItem
            color="warning"
            icon="credit-card"
            title="New card added for order #4395133"
            date-time="20 DEC 2:20 AM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Card', '#4395133', 'Priority']"
          />
          <TimelineItem
            color="primary"
            icon="key-25"
            title="Unlock packages for development"
            date-time="18 DEC 4:54 AM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Development']"
          />
          <TimelineItem
            color="success"
            icon="archive-2"
            title="New message unread"
            date-time="16 DEC"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Message']"
          />
          <TimelineItem
            color="info"
            icon="check-bold"
            title="Notifications unread"
            date-time="15 DEC"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
          />
          <TimelineItem
            color="warning"
            icon="box-2"
            title="New request"
            date-time="14 DEC"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Request', 'Priority']"
          />
          <TimelineItem
            color="dark"
            icon="box-2"
            title="Controller issues"
            date-time="13 DEC"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Controller']"
          />
        </timeline-list>
      </div>
      <div class="mt-4 col-lg-6 mt-lg-0">
        <timeline-list title="Timeline" dark-mode>
          <timeline-item
            color="success"
            icon="bell-55"
            title="$2400 Design changes"
            date-time="22 DEC 7:20 PM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['design']"
            dark-mode
          />
          <TimelineItem
            color="danger"
            icon="html5"
            title="New order #1832412"
            date-time="21 DEC 11 PM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['order', '#1832412']"
            dark-mode
          />
          <TimelineItem
            color="info"
            icon="cart"
            title="Server payments for April"
            date-time="21 DEC 9:34 PM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['server', 'payments']"
            dark-mode
          />
          <TimelineItem
            color="warning"
            icon="credit-card"
            title="New card added for order #4395133"
            date-time="20 DEC 2:20 AM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Card', '#4395133', 'Priority']"
            dark-mode
          />
          <TimelineItem
            color="primary"
            icon="key-25"
            title="Unlock packages for development"
            date-time="18 DEC 4:54 AM"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Development']"
            dark-mode
          />
          <TimelineItem
            color="success"
            icon="archive-2"
            title="New message unread"
            date-time="16 DEC"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Message']"
            dark-mode
          />
          <TimelineItem
            color="info"
            icon="check-bold"
            title="Notifications unread"
            date-time="15 DEC"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            dark-mode
          />
          <TimelineItem
            color="warning"
            icon="box-2"
            title="New request"
            date-time="14 DEC"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Request', 'Priority']"
            dark-mode
          />
          <TimelineItem
            color="dark"
            icon="controller"
            title="Controller issues"
            date-time="13 DEC"
            description="People care about how you see the world, how you think, what motivates you, what you’re struggling with or afraid of."
            :badges="['Controller']"
            dark-mode
          />
        </timeline-list>
      </div>
    </div>
  </div>
</template>

<script>
import TimelineList from "./components/TimelineList.vue";
import TimelineItem from "./components/TimelineItem.vue";
export default {
  name: "Timeline",
  components: { TimelineList, TimelineItem },
};
</script>
