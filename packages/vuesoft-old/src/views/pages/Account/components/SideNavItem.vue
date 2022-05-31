<template>
  <div class="card card-body mt-4" id="profile">
    <div class="row justify-content-center align-items-center">
      <div class="col-sm-auto col-4">
        <vsud-avatar :img="img" alt="bruce" size="xl" shadow="sm" border-radius="lg" />
      </div>
      <div class="col-sm-auto col-8 my-auto">
        <div class="h-100">
          <h5 class="mb-1 font-weight-bolder">Alec Thompson</h5>
          <p class="mb-0 font-weight-bold text-sm">CEO / Co-Founder</p>
        </div>
      </div>
      <div class="col-sm-auto ms-sm-auto mt-sm-0 mt-3 d-flex">
        <label class="form-check-label mb-0 me-2">
          <small id="profileVisibility">Switch to invisible</small>
        </label>
        <vsud-switch checked />
      </div>
    </div>
  </div>
  <div class="card mt-4" id="basic-info">
    <div class="card-header">
      <h5>Basic Info</h5>
    </div>
    <div class="card-body pt-0">
      <div class="row">
        <div class="col-6">
          <label class="form-label">First Name</label>
          <vsud-input type="text" placeholder="Alec" />
        </div>
        <div class="col-6">
          <label class="form-label">Last Name</label>
          <vsud-input type="text" placeholder="Thompson" />
        </div>
      </div>
      <div class="row">
        <div class="col-sm-4 col-6">
          <label class="form-label mt-2">I'm</label>
          <select class="form-control" name="choices-gender" id="choices-gender">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div class="col-sm-8">
          <div class="row">
            <div class="col-sm-5 col-5">
              <label class="form-label mt-2">Birth Date</label>
              <select class="form-control" name="choices-month" id="choices-month"></select>
            </div>
            <div class="col-sm-4 col-3">
              <label class="form-label mt-2">&nbsp;</label>
              <select class="form-control" name="choices-day" id="choices-day"></select>
            </div>
            <div class="col-sm-3 col-4">
              <label class="form-label mt-2">&nbsp;</label>
              <select class="form-control" name="choices-year" id="choices-year"></select>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-6">
          <label class="form-label mt-2">Email</label>
          <vsud-input type="password" placeholder="example@email.com" />
        </div>
        <div class="col-6">
          <label class="form-label mt-2">Confirmation Email</label>
          <vsud-input type="password" placeholder="example@email.com" />
        </div>
      </div>
      <div class="row">
        <div class="col-6">
          <label class="form-label mt-2">Your location</label>
          <vsud-input type="password" placeholder="Sydney, A" />
        </div>
        <div class="col-6">
          <label class="form-label mt-2">Phone Number</label>
          <vsud-input type="text" placeholder="+40 745 765 439" />
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 align-self-center">
          <label class="form-label mt-2">Language</label>
          <select class="form-control" name="choices-language" id="choices-language">
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="Spanish">Spanish</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label mt-2">Skills</label>
          <input
            class="form-control"
            id="choices-skills"
            type="text"
            value="vuejs, angular, react"
            placeholder="Enter something"
            onfocus="focused(this)"
            onfocusout="defocused(this)"
          />
        </div>
      </div>
    </div>
  </div>
  <div class="card mt-4" id="password">
    <div class="card-header">
      <h5>Change Password</h5>
    </div>
    <div class="card-body pt-0">
      <label class="form-label">Current password</label>
      <vsud-input type="password" placeholder="Current Password" />
      <label class="form-label">New password</label>
      <vsud-input type="password" placeholder="New Password" />
      <label class="form-label">Confirm new password</label>
      <vsud-input type="password" placeholder="Confirm password" />
      <h5 class="mt-5">Password requirements</h5>
      <p class="text-muted mb-2">Please follow this guide for a strong password:</p>
      <ul class="text-muted ps-4 mb-0 float-start">
        <li>
          <span class="text-sm">One special characters</span>
        </li>
        <li>
          <span class="text-sm">Min 6 characters</span>
        </li>
        <li>
          <span class="text-sm">One number (2 are recommended)</span>
        </li>
        <li>
          <span class="text-sm">Change it often</span>
        </li>
      </ul>
      <vsud-button
        class="float-end mt-6 mb-0"
        color="dark"
        variant="gradient"
        size="sm"
      >Update password</vsud-button>
    </div>
  </div>
  <div class="card mt-4" id="2fa">
    <div class="card-header d-flex">
      <h5 class="mb-0">Two-factor authentication</h5>
      <vsud-badge color="success" class="ms-auto">Enabled</vsud-badge>
    </div>
    <div class="card-body">
      <div class="d-flex">
        <p class="my-auto">Security keys</p>
        <p class="text-secondary text-sm ms-auto my-auto me-3">No Security Keys</p>
        <vsud-button color="dark" variant="outline" size="sm" class="mb-0" type="button">Add</vsud-button>
      </div>
      <hr class="horizontal dark" />
      <div class="d-flex">
        <p class="my-auto">SMS number</p>
        <p class="text-secondary text-sm ms-auto my-auto me-3">+4012374423</p>
        <vsud-button color="dark" variant="outline" size="sm" class="mb-0" type="button">Edit</vsud-button>
      </div>
      <hr class="horizontal dark" />
      <div class="d-flex">
        <p class="my-auto">Authenticator app</p>
        <p class="text-secondary text-sm ms-auto my-auto me-3">Not Configured</p>
        <vsud-button color="dark" variant="outline" size="sm" class="mb-0" type="button">Set up</vsud-button>
      </div>
    </div>
  </div>
  <div class="card mt-4" id="accounts">
    <div class="card-header">
      <h5>Accounts</h5>
      <p class="text-sm">Here you can setup and manage your integration settings.</p>
    </div>
    <div class="card-body pt-0">
      <div class="d-flex">
        <vsud-avatar class="width-48-px" :img="img1" alt="logo_slack" />
        <div class="my-auto ms-3">
          <div class="h-100">
            <h5 class="mb-0">Slack</h5>
            <a class="text-sm text-body" href="javascript:;">
              Show less
              <i class="fas fa-chevron-up text-xs ms-1" aria-hidden="true"></i>
            </a>
          </div>
        </div>
        <p class="text-sm text-secondary ms-auto me-3 my-auto">Enabled</p>
        <div class="my-auto">
          <vsud-switch checked />
        </div>
      </div>
      <div class="ps-5 pt-3 ms-3">
        <p class="mb-0 text-sm">
          You haven't added your Slack yet or you aren't authorized. Please add our Slack Bot to your account by clicking on
          <a
            href="javascript"
          >here</a>. When you've added the bot, send your verification code that you have received.
        </p>
        <div class="d-sm-flex align-items-center bg-gray-100 border-radius-lg p-2 my-4">
          <p class="text-sm font-weight-bold my-auto ps-sm-2">Verification Code</p>
          <vsud-input type="text" value="1172913" class="my-auto w-20 ms-sm-auto" />
        </div>
        <div class="d-sm-flex bg-gray-100 border-radius-lg p-2 my-4">
          <p class="text-sm font-weight-bold my-auto ps-sm-2">Connected account</p>
          <h6 class="text-sm ms-auto me-3 my-auto">hello@creative-tim.com</h6>
          <vsud-button
            color="danger"
            variant="gradient"
            size="sm"
            class="my-sm-auto mt-2 mb-0"
            type="button"
            name="button"
          >Delete</vsud-button>
        </div>
      </div>
      <hr class="horizontal dark" />
      <div class="d-flex">
        <vsud-avatar class="width-48-px" :img="img2" alt="logo_spotify" />
        <div class="my-auto ms-3">
          <div class="h-100">
            <h5 class="mb-0">Spotify</h5>
            <p class="mb-0 text-sm">Music</p>
          </div>
        </div>
        <p class="text-sm text-secondary ms-auto me-3 my-auto">Enabled</p>
        <div class="my-auto">
          <vsud-switch checked />
        </div>
      </div>
      <hr class="horizontal dark" />
      <div class="d-flex">
        <vsud-avatar class="width-48-px" :img="img3" alt="logo_atlassian" />
        <div class="my-auto ms-3">
          <div class="h-100">
            <h5 class="mb-0">Atlassian</h5>
            <p class="mb-0 text-sm">Payment vendor</p>
          </div>
        </div>
        <p class="text-sm text-secondary ms-auto me-3 my-auto">Enabled</p>
        <div class="my-auto">
          <vsud-switch checked />
        </div>
      </div>
      <hr class="horizontal dark" />
      <div class="d-flex">
        <vsud-avatar class="width-48-px" :img="img4" alt="logo_asana" />
        <div class="my-auto ms-3">
          <div class="h-100">
            <h5 class="mb-0">Asana</h5>
            <p class="mb-0 text-sm">Organize your team</p>
          </div>
        </div>
        <div class="my-auto ms-auto">
          <vsud-switch />
        </div>
      </div>
    </div>
  </div>
  <div class="card mt-4" id="notifications">
    <div class="card-header">
      <h5>Notifications</h5>
      <p
        class="text-sm"
      >Choose how you receive notifications. These notification settings apply to the things you’re watching.</p>
    </div>
    <div class="card-body pt-0">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th class="ps-1" colspan="4">
                <p class="mb-0">Activity</p>
              </th>
              <th class="text-center">
                <p class="mb-0">Email</p>
              </th>
              <th class="text-center">
                <p class="mb-0">Push</p>
              </th>
              <th class="text-center">
                <p class="mb-0">SMS</p>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="ps-1" colspan="4">
                <div class="my-auto">
                  <span class="text-dark d-block text-sm">Mentions</span>
                  <span
                    class="text-xs font-weight-normal"
                  >Notify when another user mentions you in a comment</span>
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch checked />
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch />
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch />
                </div>
              </td>
            </tr>
            <tr>
              <td class="ps-1" colspan="4">
                <div class="my-auto">
                  <span class="text-dark d-block text-sm">Comments</span>
                  <span
                    class="text-xs font-weight-normal"
                  >Notify when another user comments your item.</span>
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch checked />
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch checked />
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch />
                </div>
              </td>
            </tr>
            <tr>
              <td class="ps-1" colspan="4">
                <div class="my-auto">
                  <span class="text-dark d-block text-sm">Follows</span>
                  <span class="text-xs font-weight-normal">Notify when another user follows you.</span>
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch checked />
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch checked />
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch checked />
                </div>
              </td>
            </tr>
            <tr>
              <td class="ps-1" colspan="4">
                <div class="my-auto">
                  <p class="text-sm mb-0">Log in from a new device</p>
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch checked />
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch checked />
                </div>
              </td>
              <td>
                <div class="ms-auto">
                  <vsud-switch checked />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="card mt-4" id="sessions">
    <div class="card-header pb-3">
      <h5>Sessions</h5>
      <p
        class="text-sm"
      >This is a list of devices that have logged into your account. Remove those that you do not recognize.</p>
    </div>
    <div class="card-body pt-0">
      <div class="d-flex align-items-center">
        <div class="text-center w-5">
          <i class="fas fa-desktop text-lg opacity-6"></i>
        </div>
        <div class="my-auto ms-3">
          <div class="h-100">
            <p class="text-sm mb-1">Bucharest 68.133.163.201</p>
            <p class="mb-0 text-xs">Your current session</p>
          </div>
        </div>
        <vsud-badge color="success" size="sm" class="my-auto ms-auto me-3">Active</vsud-badge>
        <p class="text-secondary text-sm my-auto me-3">EU</p>
        <a href="javascript:;" class="text-primary text-sm icon-move-right my-auto">
          See more
          <i class="fas fa-arrow-right text-xs ms-1" aria-hidden="true"></i>
        </a>
      </div>
      <hr class="horizontal dark" />
      <div class="d-flex align-items-center">
        <div class="text-center w-5">
          <i class="fas fa-desktop text-lg opacity-6"></i>
        </div>
        <p class="my-auto ms-3">Chrome on macOS</p>
        <p class="text-secondary text-sm ms-auto my-auto me-3">US</p>
        <a href="javascript:;" class="text-primary text-sm icon-move-right my-auto">
          See more
          <i class="fas fa-arrow-right text-xs ms-1" aria-hidden="true"></i>
        </a>
      </div>
      <hr class="horizontal dark" />
      <div class="d-flex align-items-center">
        <div class="text-center w-5">
          <i class="fas fa-mobile text-lg opacity-6"></i>
        </div>
        <p class="my-auto ms-3">Safari on iPhone</p>
        <p class="text-secondary text-sm ms-auto my-auto me-3">US</p>
        <a href="javascript:;" class="text-primary text-sm icon-move-right my-auto">
          See more
          <i class="fas fa-arrow-right text-xs ms-1" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  </div>
  <div class="card mt-4" id="delete">
    <div class="card-header">
      <h5>Delete Account</h5>
      <p
        class="text-sm mb-0"
      >Once you delete your account, there is no going back. Please be certain.</p>
    </div>
    <div class="card-body d-sm-flex pt-0">
      <div class="d-flex align-items-center mb-sm-0 mb-4">
        <div>
          <vsud-switch />
        </div>
        <div class="ms-2">
          <span class="text-dark font-weight-bold d-block text-sm">Confirm</span>
          <span class="text-xs d-block">I want to delete my account.</span>
        </div>
      </div>
      <vsud-button
        color="secondary"
        variant="outline"
        class="mb-0 ms-auto"
        type="button"
        name="button"
      >Deactivate</vsud-button>
      <vsud-button
        color="danger"
        variant="gradient"
        class="mb-0 ms-2"
        type="button"
        name="button"
      >Delete Account</vsud-button>
    </div>
  </div>
</template>

<script>
import * as Choices from "choices.js";
import VsudButton from "@/components/VsudButton.vue";
import VsudSwitch from "@/components/VsudSwitch.vue";
import VsudBadge from "@/components/VsudBadge.vue";
import VsudAvatar from "@/components/VsudAvatar.vue";
import VsudInput from "@/components/VsudInput.vue";
import img from "../../../../assets/img/bruce-mars.jpg";
import img1 from "../../../../assets/img/small-logos/logo-slack.svg";
import img2 from "../../../../assets/img/small-logos/logo-spotify.svg";
import img3 from "../../../../assets/img/small-logos/logo-atlassian.svg";
import img4 from "../../../../assets/img/small-logos/logo-asana.svg";

export default {
  name: "side-nav-item",
  components: {
    VsudButton,
    VsudSwitch,
    VsudBadge,
    VsudAvatar,
    VsudInput,
  },
  data() {
    return {
      img,
      img1,
      img2,
      img3,
      img4,
    };
  },
  mounted() {
    if (document.getElementById("choices-gender")) {
      var gender = document.getElementById("choices-gender");
      new Choices(gender);
    }

    if (document.getElementById("choices-language")) {
      var language = document.getElementById("choices-language");
      new Choices(language);
    }

    if (document.getElementById("choices-month")) {
      var month = document.getElementById("choices-month");
      setTimeout(function () {
        new Choices(month);
      }, 1);

      // eslint-disable-next-line no-unused-vars
      var d = new Date();
      var monthArray = new Array();
      monthArray[0] = "January";
      monthArray[1] = "February";
      monthArray[2] = "March";
      monthArray[3] = "April";
      monthArray[4] = "May";
      monthArray[5] = "June";
      monthArray[6] = "July";
      monthArray[7] = "August";
      monthArray[8] = "September";
      monthArray[9] = "October";
      monthArray[10] = "November";
      monthArray[11] = "December";
      for (let m = 0; m <= 11; m++) {
        var optn = document.createElement("OPTION");
        optn.text = monthArray[m];
        // server side month start from one\
        optn.value = m + 1;
        // if june selected
        if (m == 1) {
          optn.selected = true;
        }
        month.options.add(optn);
      }
    }

    if (document.getElementById("choices-day")) {
      var day = document.getElementById("choices-day");
      setTimeout(function () {
        new Choices(day);
      }, 1);

      for (let y = 1; y <= 31; y++) {
        var optn1 = document.createElement("OPTION");
        optn1.text = y;
        optn1.value = y;

        if (y == 1) {
          optn1.selected = true;
        }

        day.options.add(optn1);
      }
    }

    if (document.getElementById("choices-year")) {
      var year = document.getElementById("choices-year");
      setTimeout(function () {
        new Choices(year);
      }, 1);

      for (let y = 1900; y <= 2020; y++) {
        var optn2 = document.createElement("OPTION");
        optn2.text = y;
        optn2.value = y;

        if (y == 2020) {
          optn.selected = true;
        }

        year.options.add(optn2);
      }
    }

    if (document.getElementById("choices-skills")) {
      var skills = document.getElementById("choices-skills");
      new Choices(skills, {
        delimiter: ",",
        editItems: true,
        maxItemCount: 5,
        removeItemButton: true,
        addItems: true,
      });
    }
  },
};
</script>
