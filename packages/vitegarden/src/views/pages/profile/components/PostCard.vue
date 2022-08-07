<template>
  <div class="card">
    <div class="py-3 card-header d-flex align-items-center border-bottom">
      <div class="d-flex align-items-center">
        <a href="javascript:;">
          <img :src="team4" class="avatar" alt="profile-image" />
        </a>
        <div class="mx-3">
          <a href="javascript:;" class="text-sm text-dark font-weight-600"
            >John Snow</a
          >
          <small class="d-block text-muted">3 days ago</small>
        </div>
      </div>
      <div class="text-end ms-auto">
        <button type="button" class="mb-0 btn btn-sm bg-gradient-success">
          <i class="fas fa-plus pe-2"></i> Follow
        </button>
      </div>
    </div>
    <div class="card-body">
      <p class="mb-4">
        Personal profiles are the perfect way for you to grab their attention
        and persuade recruiters to continue reading your CV because you’re
        telling them from the off exactly why they should hire you.
      </p>
      <img
        alt="Image placeholder"
        src="https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2100&q=80"
        class="shadow-lg img-fluid border-radius-lg"
      />
      <div class="px-2 mt-4 mb-2 row align-items-center">
        <div class="col-sm-6">
          <div class="d-flex">
            <div class="d-flex align-items-center">
              <i class="cursor-pointer ni ni-like-2 me-1"></i>
              <span class="text-sm me-3">150</span>
            </div>
            <div class="d-flex align-items-center">
              <i class="cursor-pointer ni ni-chat-round me-1"></i>
              <span class="text-sm me-3">36</span>
            </div>
            <div class="d-flex align-items-center">
              <i class="cursor-pointer ni ni-curved-next me-1"></i>
              <span class="text-sm me-2">12</span>
            </div>
          </div>
        </div>
        <div class="col-sm-6 d-none d-sm-block">
          <div class="d-flex align-items-center justify-content-sm-end">
            <div class="d-flex align-items-center">
              <a
                href="javascript:;"
                class="avatar avatar-xs rounded-circle"
                data-toggle="tooltip"
                data-original-title="Jessica Rowland"
              >
                <img
                  alt="Image placeholder"
                  :src="team5"
                  class="rounded-circle"
                />
              </a>
              <a
                href="javascript:;"
                class="avatar avatar-xs rounded-circle"
                data-toggle="tooltip"
                data-original-title="Audrey Love"
              >
                <img
                  alt="Image placeholder"
                  :src="team2"
                  class="rounded-circle"
                />
              </a>
              <a
                href="javascript:;"
                class="avatar avatar-xs rounded-circle"
                data-toggle="tooltip"
                data-original-title="Michael Lewis"
              >
                <img
                  alt="Image placeholder"
                  :src="team1"
                  class="rounded-circle"
                />
              </a>
            </div>
            <small class="ps-2 font-weight-bold">and 30+ more</small>
          </div>
        </div>
        <hr class="my-3 horizontal dark" />
      </div>
      <!-- Comments -->
      <div class="mb-1">
        <div class="d-flex">
          <div class="flex-shrink-0">
            <img
              alt="Image placeholder"
              class="avatar rounded-circle"
              :src="bruce"
            />
          </div>
          <div class="flex-grow-1 ms-3">
            <h6 class="mt-0 h5">Michael Lewis</h6>
            <p class="text-sm">
              I always felt like I could do anything. That’s the main thing
              people are controlled by! Thoughts- their perception of
              themselves!
            </p>
            <div class="d-flex">
              <div>
                <i class="cursor-pointer ni ni-like-2 me-1"></i>
              </div>
              <span class="text-sm me-2">3 likes</span>
              <div>
                <i class="cursor-pointer ni ni-curved-next me-1"></i>
              </div>
              <span class="text-sm me-2">2 shares</span>
            </div>
          </div>
        </div>
        <div class="mt-3 d-flex">
          <div class="flex-shrink-0">
            <img
              alt="Image placeholder"
              class="avatar rounded-circle"
              :src="team5"
            />
          </div>
          <div class="flex-grow-1 ms-3">
            <h6 class="mt-0 h5">Jessica Stones</h6>
            <p class="text-sm">
              Society has put up so many boundaries, so many limitations on
              what’s right and wrong that it’s almost impossible to get a pure
              thought out. It’s like a little kid, a little boy.
            </p>
            <div class="d-flex">
              <div>
                <i class="cursor-pointer ni ni-like-2 me-1"></i>
              </div>
              <span class="text-sm me-2">10 likes</span>
              <div>
                <i class="cursor-pointer ni ni-curved-next me-1"></i>
              </div>
              <span class="text-sm me-2">1 share</span>
            </div>
          </div>
        </div>
        <div class="mt-4 d-flex">
          <div class="flex-shrink-0">
            <img
              alt="Image placeholder"
              class="avatar rounded-circle me-3"
              :src="team4"
            />
          </div>
          <div class="my-auto flex-grow-1">
            <form>
              <textarea
                class="form-control"
                placeholder="Write your comment"
                rows="1"
              ></textarea>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import bruce from "@/assets/img/bruce-mars.jpg";
import team1 from "@/assets/img/team-1.jpg";
import team2 from "@/assets/img/team-2.jpg";
import team4 from "@/assets/img/team-4.jpg";
import team5 from "@/assets/img/team-5.jpg";

export default {
  name: "post-card",
  data() {
    return {
      bruce,
      team1,
      team2,
      team4,
      team5,
    };
  },
};
</script>
