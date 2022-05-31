<template>
  <div
    class="p-3 bg-white card multisteps-form__panel border-radius-xl js-active position-relative"
    data-animation="FadeIn"
  >
    <div class="text-center row">
      <div class="mx-auto col-10">
        <h5 class="font-weight-normal">
          Let's start with the basic information
        </h5>
        <p>
          Let us know your name and email address. Use an address you don't mind
          other users contacting you at
        </p>
      </div>
    </div>
    <div class="multisteps-form__content">
      <div class="mt-3 row">
        <div class="col-12 col-sm-4">
          <div class="avatar avatar-xxl position-relative">
            <img
              src="@/assets/img/team-2.jpg"
              class="border-radius-md"
              alt="team-2"
            />
            <a
              href="#"
              class="bottom-0 btn btn-sm btn-icon-only bg-gradient-light position-absolute end-0 mb-n2 me-n2"
            >
              <i
                class="top-0 fa fa-pen"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title=""
                aria-hidden="true"
                data-bs-original-title="Edit Image"
                aria-label="Edit Image"
              ></i
              ><span class="sr-only">Edit Image</span>
            </a>
          </div>
        </div>
        <div class="mt-4 col-12 col-sm-8 mt-sm-0 text-start">
          <label>First Name</label>
          <input
            class="mb-3 multisteps-form__input form-control"
            type="text"
            placeholder="Eg. Michael"
          />
          <label>Last Name</label>
          <input
            class="mb-3 multisteps-form__input form-control"
            type="text"
            placeholder="Eg. Tomson"
          />
          <label>Email Address</label>
          <input
            class="multisteps-form__input form-control"
            type="email"
            placeholder="Eg. soft@dashboard.com"
          />
        </div>
      </div>
      <div class="mt-4 button-row d-flex">
        <button
          class="mb-0 btn bg-gradient-dark ms-auto js-btn-next"
          type="button"
          title="Next"
          @click="this.$parent.nextStep"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "About",
};
</script>
