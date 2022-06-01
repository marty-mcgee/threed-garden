<template>
  <div class="py-4 container-fluid">
    <div class="row min-vh-75">
      <div class="mx-auto col-lg-8 col-md-12">
        <div class="mt-5 places-sweet-alerts">
          <h2 class="text-center">Sweet Alert</h2>
          <p class="text-center category">
            A beautiful plugin, that replace the classic alert, Handcrafted by
            our friend
            <a target="_blank" href="https://twitter.com/t4t5"
              >Tristan Edwards</a
            >. Please check out the
            <a href="https://sweetalert2.github.io/" target="_blank"
              >full documentation.</a
            >
          </p>
        </div>
        <div class="mt-5 row">
          <div class="col-md-4">
            <div class="card">
              <div class="text-center card-body">
                <p class="card-text">Basic example</p>
                <button
                  class="mb-0 btn bg-gradient-success"
                  @click="showSwal('basic')"
                >
                  Try me!
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 col-md-4 mt-md-0">
            <div class="card">
              <div class="text-center card-body">
                <p class="card-text">A success message</p>
                <button
                  class="mb-0 btn bg-gradient-success"
                  @click="showSwal('success-message')"
                >
                  Try me!
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 col-md-4 mt-md-0">
            <div class="card">
              <div class="text-center card-body">
                <p class="card-text">Custom HTML description</p>
                <button
                  class="mb-0 btn bg-gradient-success"
                  @click="showSwal('custom-html')"
                >
                  Try me!
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 row">
          <div class="col-md-4">
            <div class="card">
              <div class="text-center card-body">
                <p class="card-text">Gitgub avatar request</p>
                <button
                  class="mb-0 btn bg-gradient-success"
                  @click="showSwal('input-field')"
                >
                  Try me!
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 col-md-4 mt-md-0">
            <div class="card">
              <div class="text-center card-body">
                <p class="card-text">A title with a text under</p>
                <button
                  class="mb-0 btn bg-gradient-success"
                  @click="showSwal('title-and-text')"
                >
                  Try me!
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 col-md-4 mt-md-0">
            <div class="card">
              <div class="text-center card-body">
                <p class="card-text">A message with auto close</p>
                <button
                  class="mb-0 btn bg-gradient-success"
                  @click="showSwal('auto-close')"
                >
                  Try me!
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 mb-5 row">
          <div class="col-md-4">
            <div class="card">
              <div class="text-center card-body">
                <p class="card-text">
                  A warning message, with a function attached to the "Confirm"
                  Button...
                </p>
                <button
                  class="mb-0 btn bg-gradient-success"
                  @click="showSwal('warning-message-and-confirmation')"
                >
                  Try me!
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 col-md-4 mt-md-0">
            <div class="card">
              <div class="text-center card-body">
                <p class="card-text">
                  ...and by passing a parameter, you can execute something else
                  for "Cancel"
                </p>
                <button
                  class="mb-0 btn bg-gradient-success"
                  @click="showSwal('warning-message-and-cancel')"
                >
                  Try me!
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 col-md-4 mt-md-0">
            <div class="card">
              <div class="text-center card-body">
                <p class="card-text">
                  Right-to-left support for Arabic, Persian, Hebrew, and other
                  RTL languages
                </p>
                <button
                  class="mb-0 btn bg-gradient-success"
                  @click="showSwal('rtl-language')"
                >
                  Try me!
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SweetAlerts",

  methods: {
    showSwal(type) {
      if (type === "basic") {
        this.$swal({
          title: "Any fool can use a computer",
          type: type,
        });
      } else if (type === "success-message") {
        this.$swal({
          icon: "success",
          title: "Good Job!",
          text: "You clicked the button!",
          type: type,
        });
      } else if (type === "custom-html") {
        this.$swal({
          icon: "info",
          title: "<strong>HTML <u>example</u></strong>",
          html:
            "You can use <b>bold text</b>, " +
            '<a href="//sweetalert2.github.io">links</a> ' +
            "and other HTML tags",
          type: type,
          showCloseButton: true,
          showCancelButton: true,
          focusConfirm: false,
          confirmButtonText: '<i class="fa fa-thumbs-up"></i> Great!',
          confirmButtonAriaLabel: "Thumbs up, great!",
          cancelButtonText: '<i class="fa fa-thumbs-down"></i>',
          cancelButtonAriaLabel: "Thumbs down",
          customClass: {
            confirmButton: "btn bg-gradient-success",
            cancelButton: "btn bg-gradient-danger",
          },
          buttonsStyling: false,
        });
      } else if (type === "input-field") {
        this.$swal({
          title: "Submit your Github username",
          input: "text",
          inputAttributes: {
            autocapitalize: "off",
          },
          showCancelButton: true,
          confirmButtonText: "Look up",
          showLoaderOnConfirm: true,
          customClass: {
            confirmButton: "btn bg-gradient-success",
            cancelButton: "btn bg-gradient-danger",
          },
          buttonsStyling: false,
          preConfirm: (login) => {
            return fetch(`//api.github.com/users/${login}`)
              .then((response) => {
                if (!response.ok) {
                  throw new Error(response.statusText);
                }
                return response.json();
              })
              .catch((error) => {
                this.$swal.showValidationMessage(`Request failed: ${error}`);
              });
          },
          allowOutsideClick: () => !this.$swal.isLoading(),
        }).then((result) => {
          if (result.isConfirmed) {
            this.$swal({
              title: `${result.value.login}'s avatar`,
              imageUrl: result.value.avatar_url,
            });
          }
        });
      } else if (type === "title-and-text") {
        this.$swal({
          title: "Sweet!",
          text: "Modal with a custom image.",
          imageUrl: "https://unsplash.it/400/200",
          imageWidth: 400,
          imageHeight: 200,
          imageAlt: "Custom image",
        });
      } else if (type === "auto-close") {
        let timerInterval;
        this.$swal({
          title: "Auto close alert!",
          html: "I will close in <b></b> milliseconds.",
          timer: 2000,
          timerProgressBar: true,
          didOpen: () => {
            this.$swal.showLoading();
            const b = this.$swal.getHtmlContainer().querySelector("b");
            timerInterval = setInterval(() => {
              b.textContent = this.$swal.getTimerLeft();
            }, 100);
          },
          willClose: () => {
            clearInterval(timerInterval);
          },
        });
      } else if (type === "warning-message-and-confirmation") {
        this.$swal({
          title: "Are you sure?",
          text: "You won't be able to revert this!",
          showCancelButton: true,
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "No, cancel!",
          reverseButtons: true,
          customClass: {
            confirmButton: "btn bg-gradient-success",
            cancelButton: "btn bg-gradient-danger",
          },
          buttonsStyling: false,
        }).then((result) => {
          if (result.isConfirmed) {
            this.$swal({
              title: "Deleted!",
              text: "Your file has been deleted.",
              icon: "success",
              customClass: {
                confirmButton: "btn bg-gradient-success",
              },
              buttonsStyling: false,
            });
          } else if (
            /* Read more about handling dismissals below */
            result.dismiss === this.$swal.DismissReason.cancel
          ) {
            this.$swal({
              title: "Cancelled!",
              text: "Your imaginary file is safe :)",
              icon: "error",
              customClass: {
                confirmButton: "btn bg-gradient-success",
              },
              buttonsStyling: false,
            });
          }
        });
      } else if (type === "warning-message-and-cancel") {
        this.$swal({
          title: "Are you sure?",
          text: "You won't be able to revert this!",
          icon: "warning",
          showCancelButton: true,
          cancelButtonText: "Cancel",
          confirmButtonText: "Yes, delete it!",
          customClass: {
            confirmButton: "btn bg-gradient-success",
            cancelButton: "btn bg-gradient-danger",
          },
          buttonsStyling: false,
        }).then((result) => {
          if (result.isConfirmed) {
            this.$swal({
              title: "Deleted!",
              text: "Your file has been deleted.",
              icon: "success",
              customClass: {
                confirmButton: "btn bg-gradient-success",
              },
              buttonsStyling: false,
            });
          } else if (
            /* Read more about handling dismissals below */
            result.dismiss === this.$swal.DismissReason.cancel
          ) {
            this.$swal.dismiss;
          }
        });
      } else if (type === "rtl-language") {
        this.$swal({
          title: "هل تريد الاستمرار؟",
          icon: "question",
          iconHtml: "؟",
          confirmButtonText: "نعم",
          cancelButtonText: "لا",
          showCancelButton: true,
          showCloseButton: true,
          customClass: {
            confirmButton: "btn bg-gradient-success",
            cancelButton: "btn bg-gradient-danger",
          },
          buttonsStyling: false,
        });
      }
    },
  },
};
</script>
