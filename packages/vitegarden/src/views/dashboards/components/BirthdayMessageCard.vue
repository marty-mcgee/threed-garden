<template>
  <div class="mt-4 card">
    <div class="p-3 card-body">
      <div class="row">
        <div class="col-4">
          <img
            src="@/assets/img/kal-visuals-square.jpg"
            alt="kal"
            class="shadow border-radius-lg w-100"
          />
        </div>
        <div class="my-auto col-8">
          <p class="text-sm text-muted font-weight-bold">
            Today is Martina's birthday. Wish her the best of luck!
          </p>
          <a href="javascript:;" class="mb-0 btn btn-sm bg-gradient-dark"
            >Send message</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BirthdayMessageCard",
};
</script>
