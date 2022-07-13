<template>
  <div class="card" :class="darkMode ? 'bg-gradient-dark' : ''">
    <div class="pb-0 card-header" :class="darkMode ? 'bg-transparent' : ''">
      <h6 :class="darkMode ? 'text-white' : ''">{{ title }}</h6>
    </div>
    <div class="p-3 card-body">
      <div
        class="timeline timeline-one-side"
        :data-timeline-axis-style="darkMode ? 'dashed' : 'dotted'"
      >
        <div class="mb-3 timeline-block">
          <span class="timeline-step" :class="darkMode ? 'bg-dark' : ''">
            <i class="ni ni-bell-55 text-success text-gradient"></i>
          </span>
          <div class="timeline-content">
            <h6 class="mb-0 text-sm text-dark font-weight-bold">$2400, Design changes</h6>
            <p class="mt-1 mb-0 text-xs text-secondary font-weight-bold">22 DEC 7:20 PM</p>
            <p class="mt-3 mb-2 text-sm">
              People care about how you see the world, how you think, what
              motivates you, what you’re struggling with or afraid of.
            </p>
            <span class="badge badge-sm bg-gradient-success">Design</span>
          </div>
        </div>
        <div class="mb-3 timeline-block">
          <span class="timeline-step" :class="darkMode ? 'bg-dark' : ''">
            <i class="ni ni-html5 text-danger text-gradient"></i>
          </span>
          <div class="timeline-content">
            <h6 class="mb-0 text-sm text-dark font-weight-bold">New order #1832412</h6>
            <p class="mt-1 mb-0 text-xs text-secondary font-weight-bold">21 DEC 11 PM</p>
            <p class="mt-3 mb-2 text-sm">
              People care about how you see the world, how you think, what
              motivates you, what you’re struggling with or afraid of.
            </p>
            <span class="badge badge-sm bg-gradient-danger">Order</span>
            <span class="mx-1 badge badge-sm bg-gradient-danger">#1832412</span>
          </div>
        </div>
        <div class="mb-3 timeline-block">
          <span class="timeline-step" :class="darkMode ? 'bg-dark' : ''">
            <i class="ni ni-cart text-info text-gradient"></i>
          </span>
          <div class="timeline-content">
            <h6 class="mb-0 text-sm text-dark font-weight-bold">Server payments for April</h6>
            <p class="mt-1 mb-0 text-xs text-secondary font-weight-bold">21 DEC 9:34 PM</p>
            <p class="mt-3 mb-2 text-sm">
              People care about how you see the world, how you think, what
              motivates you, what you’re struggling with or afraid of.
            </p>
            <div class="d-inline-flex">
              <span class="badge badge-sm bg-gradient-info">Server</span>
              <span class="mx-1 badge badge-sm bg-gradient-info">Payments</span>
            </div>
          </div>
        </div>
        <div class="mb-3 timeline-block">
          <span class="timeline-step" :class="darkMode ? 'bg-dark' : ''">
            <i class="ni ni-credit-card text-warning text-gradient"></i>
          </span>
          <div class="timeline-content">
            <h6 class="mb-0 text-sm text-dark font-weight-bold">New card added for order #4395133</h6>
            <p class="mt-1 mb-0 text-xs text-secondary font-weight-bold">20 DEC 2:20 AM</p>
            <p class="mt-3 mb-2 text-sm">
              People care about how you see the world, how you think, what
              motivates you, what you’re struggling with or afraid of.
            </p>
            <span class="badge badge-sm bg-gradient-warning">Card</span>
            <span class="mx-1 badge badge-sm bg-gradient-warning">#4395133</span>
            <span class="badge badge-sm bg-gradient-warning">Priority</span>
          </div>
        </div>
        <div class="mb-3 timeline-block">
          <span class="timeline-step" :class="darkMode ? 'bg-dark' : ''">
            <i class="ni ni-key-25 text-primary text-gradient"></i>
          </span>
          <div class="timeline-content">
            <h6 class="mb-0 text-sm text-dark font-weight-bold">Unlock packages for development</h6>
            <p class="mt-1 mb-0 text-xs text-secondary font-weight-bold">18 DEC 4:54 AM</p>
            <p class="mt-3 mb-2 text-sm">
              People care about how you see the world, how you think, what
              motivates you, what you’re struggling with or afraid of.
            </p>
            <span class="badge badge-sm bg-gradient-primary">Development</span>
          </div>
        </div>
        <div class="timeline-block">
          <span class="timeline-step" :class="darkMode ? 'bg-dark' : ''">
            <i class="ni ni-archive-2 text-success text-gradient"></i>
          </span>
          <div class="timeline-content">
            <h6 class="mb-0 text-sm text-dark font-weight-bold">New message unread</h6>
            <p class="mt-1 mb-0 text-xs text-secondary font-weight-bold">16 DEC</p>
            <p class="mt-3 mb-2 text-sm">
              People care about how you see the world, how you think, what
              motivates you, what you’re struggling with or afraid of.
            </p>
            <span class="badge badge-sm bg-gradient-success">Message</span>
          </div>
        </div>
        <div class="timeline-block">
          <span class="timeline-step" :class="darkMode ? 'bg-dark' : ''">
            <i class="ni ni-check-bold text-info text-gradient"></i>
          </span>
          <div class="timeline-content">
            <h6 class="mb-0 text-sm text-dark font-weight-bold">Notifications unread</h6>
            <p class="mt-1 mb-0 text-xs text-secondary font-weight-bold">15 DEC</p>
            <p class="mt-3 mb-2 text-sm">
              People care about how you see the world, how you think, what
              motivates you, what you’re struggling with or afraid of.
            </p>
          </div>
        </div>
        <div class="timeline-block">
          <span class="timeline-step" :class="darkMode ? 'bg-dark' : ''">
            <i class="ni ni-box-2 text-warning text-gradient"></i>
          </span>
          <div class="timeline-content">
            <h6 class="mb-0 text-sm text-dark font-weight-bold">New request</h6>
            <p class="mt-1 mb-0 text-xs text-secondary font-weight-bold">14 DEC</p>
            <p class="mt-3 mb-2 text-sm">
              People care about how you see the world, how you think, what
              motivates you, what you’re struggling with or afraid of.
            </p>
            <span class="badge badge-sm bg-gradient-warning">Request</span>
            <span class="mx-1 badge badge-sm bg-gradient-warning">Priority</span>
          </div>
        </div>
        <div class="timeline-block">
          <span class="timeline-step" :class="darkMode ? 'bg-dark' : ''">
            <i class="ni ni-controller text-dark text-gradient"></i>
          </span>
          <div class="timeline-content">
            <h6 class="mb-0 text-sm text-dark font-weight-bold">Controller issues</h6>
            <p class="mt-1 mb-0 text-xs text-secondary font-weight-bold">13 DEC</p>
            <p class="mt-3 mb-2 text-sm">
              People care about how you see the world, how you think, what
              motivates you, what you’re struggling with or afraid of.
            </p>
            <span class="badge badge-sm bg-gradient-dark">Controller</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TimelineCard",
  props: {
    darkMode: Boolean,
    title: { type: String, default: "" },
  },
};
</script>
