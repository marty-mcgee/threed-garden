<template>
  <div class="card">
    <div class="table-responsive">
      <table class="table align-items-center mb-0">
        <thead>
          <tr>
            <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Name</th>
            <th
              class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
            >Function</th>
            <th
              class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
            >Review</th>
            <th
              class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
            >Email</th>
            <th
              class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
            >Employed</th>
            <th
              class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
            >Id</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="d-flex px-2 py-1">
                <vsud-avatar :img="img1" class="me-3" alt="avatar image" border-radius="lg" />
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">John Michael</h6>
                </div>
              </div>
            </td>
            <td>
              <p class="text-sm text-secondary mb-0">Manager</p>
            </td>
            <td>
              <span class="badge badge-dot me-4">
                <i class="bg-info"></i>
                <span class="text-dark text-xs">positive</span>
              </span>
            </td>
            <td class="align-middle text-center text-sm">
              <p class="text-secondary mb-0 text-sm">john@user.com</p>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-sm">23/04/18</span>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-sm">43431</span>
            </td>
          </tr>
          <tr>
            <td>
              <div class="d-flex px-2 py-1">
                <vsud-avatar :img="img2" class="me-3" alt="avatar image" border-radius="lg" />
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">Alexa Liras</h6>
                </div>
              </div>
            </td>
            <td>
              <p class="text-sm text-secondary mb-0">Programator</p>
            </td>
            <td>
              <span class="badge badge-dot me-4">
                <i class="bg-info"></i>
                <span class="text-dark text-xs">positive</span>
              </span>
            </td>
            <td class="align-middle text-center text-sm">
              <p class="text-secondary mb-0 text-sm">alexa@user.com</p>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-xs font-weight-bold">11/01/19</span>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-sm">93021</span>
            </td>
          </tr>
          <tr>
            <td>
              <div class="d-flex px-2 py-1">
                <vsud-avatar :img="img3" class="me-3" alt="avatar image" border-radius="lg" />
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">Laurent Perrier</h6>
                </div>
              </div>
            </td>
            <td>
              <p class="text-sm text-secondary mb-0">Executive</p>
            </td>
            <td>
              <span class="badge badge-dot me-4">
                <i class="bg-dark"></i>
                <span class="text-dark text-xs">neutral</span>
              </span>
            </td>
            <td class="align-middle text-center text-sm">
              <p class="text-secondary mb-0 text-sm">laurent@user.com</p>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-xs font-weight-bold">19/09/17</span>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-sm">10392</span>
            </td>
          </tr>
          <tr>
            <td>
              <div class="d-flex px-2 py-1">
                <vsud-avatar :img="img4" class="me-3" alt="avatar image" border-radius="lg" />
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">Michael Levi</h6>
                </div>
              </div>
            </td>
            <td>
              <p class="text-sm text-secondary mb-0">Backend developer</p>
            </td>
            <td>
              <span class="badge badge-dot me-4">
                <i class="bg-info"></i>
                <span class="text-dark text-xs">positive</span>
              </span>
            </td>
            <td class="align-middle text-center text-sm">
              <p class="text-secondary mb-0 text-sm">michael@user.com</p>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-xs font-weight-bold">24/12/08</span>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-sm">34002</span>
            </td>
          </tr>
          <tr>
            <td>
              <div class="d-flex px-2 py-1">
                <vsud-avatar :img="img5" class="me-3" alt="avatar image" border-radius="lg" />
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">Richard Gran</h6>
                </div>
              </div>
            </td>
            <td>
              <p class="text-sm text-secondary mb-0">Manager</p>
            </td>
            <td>
              <span class="badge badge-dot me-4">
                <i class="bg-danger"></i>
                <span class="text-dark text-xs">negative</span>
              </span>
            </td>
            <td class="align-middle text-center text-sm">
              <p class="text-secondary mb-0 text-sm">richard@user.com</p>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-xs font-weight-bold">04/10/21</span>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-sm">91879</span>
            </td>
          </tr>
          <tr>
            <td>
              <div class="d-flex px-2 py-1">
                <vsud-avatar :img="img1" class="me-3" alt="avatar image" border-radius="lg" />
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">Miriam Eric</h6>
                </div>
              </div>
            </td>
            <td>
              <p class="text-sm text-secondary mb-0">Programtor</p>
            </td>
            <td>
              <span class="badge badge-dot me-4">
                <i class="bg-info"></i>
                <span class="text-dark text-xs">positive</span>
              </span>
            </td>
            <td class="align-middle text-center text-sm">
              <p class="text-secondary mb-0 text-sm">miriam@user.com</p>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-xs font-weight-bold">14/09/20</span>
            </td>
            <td class="align-middle text-center">
              <span class="text-secondary text-sm">23042</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import VsudAvatar from "@/components/VsudAvatar.vue";
import img1 from "../../../../assets/img/team-1.jpg";
import img2 from "../../../../assets/img/team-2.jpg";
import img3 from "../../../../assets/img/team-3.jpg";
import img4 from "../../../../assets/img/team-4.jpg";
import img5 from "../../../../assets/img/team-5.jpg";

export default {
  name: "Table",
  components: {
    VsudAvatar,
  },
  data() {
    return {
      img1,
      img2,
      img3,
      img4,
      img5,
    };
  },
};
</script>
