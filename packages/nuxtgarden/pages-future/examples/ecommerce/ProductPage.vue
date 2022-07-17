<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5 class="mb-4">Product Details</h5>
            <div class="row">
              <div class="text-center col-xl-5 col-lg-6">
                <img
                  class="mx-auto shadow-lg w-100 border-radius-lg"
                  src="https://images.unsplash.com/photo-1616627781431-23b776aad6b2?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1884&q=80"
                  alt="chair"
                />
                <div
                  class="pt-2 mt-4 my-gallery d-flex"
                  itemscope
                  itemtype="http://schema.org/ImageGallery"
                >
                  <figure
                    itemprop="associatedMedia"
                    itemscope
                    itemtype="http://schema.org/ImageObject"
                  >
                    <a
                      href="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/chair-pink.jpg"
                      itemprop="contentUrl"
                      data-size="500x600"
                    >
                      <img
                        class="shadow w-75 min-height-100 max-height-100 border-radius-lg"
                        src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/chair-pink.jpg"
                        alt="Image description"
                      />
                    </a>
                  </figure>
                  <figure
                    itemprop="associatedMedia"
                    itemscope
                    itemtype="http://schema.org/ImageObject"
                  >
                    <a
                      href="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/black-chair.jpg"
                      itemprop="contentUrl"
                      data-size="500x600"
                    >
                      <img
                        class="shadow w-75 min-height-100 max-height-100 border-radius-lg"
                        src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/black-chair.jpg"
                        itemprop="thumbnail"
                        alt="Image description"
                      />
                    </a>
                  </figure>
                  <figure
                    itemprop="associatedMedia"
                    itemscope
                    itemtype="http://schema.org/ImageObject"
                  >
                    <a
                      href="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/chair-steel.jpg"
                      itemprop="contentUrl"
                      data-size="500x600"
                    >
                      <img
                        class="shadow w-75 min-height-100 max-height-100 border-radius-lg"
                        src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/chair-steel.jpg"
                        itemprop="thumbnail"
                        alt="Image description"
                      />
                    </a>
                  </figure>
                  <figure
                    itemprop="associatedMedia"
                    itemscope
                    itemtype="http://schema.org/ImageObject"
                  >
                    <a
                      href="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/chair-wood.jpg"
                      itemprop="contentUrl"
                      data-size="500x600"
                    >
                      <img
                        class="shadow w-75 min-height-100 max-height-100 border-radius-lg"
                        src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/soft-ui-design-system/assets/img/ecommerce/chair-wood.jpg"
                        itemprop="thumbnail"
                        alt="Image description"
                      />
                    </a>
                  </figure>
                </div>
                <!-- Root element of PhotoSwipe. Must have class pswp. -->
                <div
                  class="pswp"
                  tabindex="-1"
                  role="dialog"
                  aria-hidden="true"
                >
                  <!-- Background of PhotoSwipe.
It's a separate element, as animating opacity is faster than rgba(). -->
                  <div class="pswp__bg"></div>
                  <!-- Slides wrapper with overflow:hidden. -->
                  <div class="pswp__scroll-wrap">
                    <!-- Container that holds slides. PhotoSwipe keeps only 3 slides in DOM to save memory. -->
                    <!-- don't modify these 3 pswp__item elements, data is added later on. -->
                    <div class="pswp__container">
                      <div class="pswp__item"></div>
                      <div class="pswp__item"></div>
                      <div class="pswp__item"></div>
                    </div>
                    <!-- Default (PhotoSwipeUI_Default) interface on top of sliding area. Can be changed. -->
                    <div class="pswp__ui pswp__ui--hidden">
                      <div class="pswp__top-bar">
                        <!--  Controls are self-explanatory. Order can be changed. -->
                        <div class="pswp__counter"></div>
                        <button
                          class="me-2 btn btn-white btn-sm pswp__button pswp__button--close"
                        >
                          Close (Esc)
                        </button>
                        <button
                          class="me-2 btn btn-white btn-sm pswp__button pswp__button--fs"
                        >
                          Fullscreen
                        </button>
                        <button
                          class="me-2 btn btn-white btn-sm pswp__button pswp__button--arrow--left"
                        >
                          Prev
                        </button>
                        <button
                          class=" btn btn-white btn-sm pswp__button pswp__button--arrow--right"
                        >
                          Next
                        </button>
                        <!-- Preloader demo https://codepen.io/dimsemenov/pen/yyBWoR -->
                        <!-- element will get class pswp__preloader--active when preloader is running -->
                        <div class="pswp__preloader">
                          <div class="pswp__preloader__icn">
                            <div class="pswp__preloader__cut">
                              <div class="pswp__preloader__donut"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap"
                      >
                        <div class="pswp__share-tooltip"></div>
                      </div>
                      <div class="pswp__caption">
                        <div class="pswp__caption__center"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mx-auto col-lg-5">
                <h3 class="mt-4 mt-lg-0">Minimal Bar Stool</h3>
                <div class="rating">
                  <i class="fas fa-star" aria-hidden="true"></i>
                  <i class="fas fa-star" aria-hidden="true"></i>
                  <i class="fas fa-star" aria-hidden="true"></i>
                  <i class="fas fa-star" aria-hidden="true"></i>
                  <i class="fas fa-star-half-alt" aria-hidden="true"></i>
                </div>
                <br />
                <h6 class="mt-3 mb-0">Price</h6>
                <h5>$1,419</h5>
                <span class="badge badge-success">In Stock</span>
                <br />
                <label class="mt-4">Description</label>
                <ul>
                  <li>
                    The most beautiful curves of this swivel stool adds an
                    elegant touch to any environment
                  </li>
                  <li>Memory swivel seat returns to original seat position</li>
                  <li>
                    Comfortable integrated layered chair seat cushion design
                  </li>
                  <li>Fully assembled! No assembly required</li>
                </ul>
                <div class="mt-4 row">
                  <div class="mt-2 col-lg-5 mt-lg-0">
                    <label>Frame Material</label>
                    <select
                      id="choices-material"
                      class="form-control"
                      name="choices-material"
                    >
                      <option value="Choice 1" selected="">Wood</option>
                      <option value="Choice 2">Steel</option>
                      <option value="Choice 3">Aluminium</option>
                      <option value="Choice 4">Carbon</option>
                    </select>
                  </div>
                  <div class="mt-2 col-lg-5 mt-lg-0">
                    <label>Color</label>
                    <select
                      id="choices-colors"
                      class="form-control"
                      name="choices-colors"
                    >
                      <option value="Choice 1" selected="">White</option>
                      <option value="Choice 2">Gray</option>
                      <option value="Choice 3">Black</option>
                      <option value="Choice 4">Blue</option>
                      <option value="Choice 5">Red</option>
                      <option value="Choice 6">Pink</option>
                    </select>
                  </div>
                  <div class="col-lg-2">
                    <label>Quantity</label>
                    <select
                      id="choices-quantity"
                      class="form-control"
                      name="choices-quantity"
                    >
                      <option value="Choice 1" selected="">1</option>
                      <option value="Choice 2">2</option>
                      <option value="Choice 3">3</option>
                      <option value="Choice 4">4</option>
                      <option value="Choice 5">5</option>
                      <option value="Choice 6">6</option>
                      <option value="Choice 7">7</option>
                      <option value="Choice 8">8</option>
                      <option value="Choice 9">9</option>
                      <option value="Choice 10">10</option>
                    </select>
                  </div>
                </div>
                <div class="mt-4 row">
                  <div class="col-lg-5">
                    <button
                      class="mb-0 btn bg-gradient-success mt-lg-auto w-100"
                      type="button"
                      name="button"
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-5 row">
              <other-products />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Choices from "choices.js"
import PhotoSwipe from "photoswipe";
// [MM] import bootstrap from "bootstrap/dist/js/bootstrap";
import PhotoSwipeUI_Default from "photoswipe/dist/photoswipe-ui-default";

import OtherProducts from "./components/OtherProducts.vue";

export default {
  name: "ProductPage",
  components: { OtherProducts },

  mounted() {
    this.getChoices("choices-quantity");
    this.getChoices("choices-material");
    this.getChoices("choices-colors");

    // Gallery Carousel
    if (document.getElementById("products-carousel")) {
      var myCarousel = document.querySelector("#products-carousel");
      // eslint-disable-next-line no-unused-vars
      var carousel = null // [MM] new bootstrap.Carousel(myCarousel);
    }

    // Products gallery

    var initPhotoSwipeFromDOM = function (gallerySelector) {
      // parse slide data (url, title, size ...) from DOM elements
      // (children of gallerySelector)
      var parseThumbnailElements = function (el) {
        var thumbElements = el.childNodes,
          numNodes = thumbElements.length,
          items = [],
          figureEl,
          linkEl,
          size,
          item;

        for (var i = 0; i < numNodes; i++) {
          figureEl = thumbElements[i]; // <figure> element
          // include only element nodes
          if (figureEl.nodeType !== 1) {
            continue;
          }

          linkEl = figureEl.children[0]; // <a> element

          size = linkEl.getAttribute("data-size").split("x");

          // create slide object
          item = {
            src: linkEl.getAttribute("href"),
            w: parseInt(size[0], 10),
            h: parseInt(size[1], 10),
          };

          if (figureEl.children.length > 1) {
            // <figcaption> content
            item.title = figureEl.children[1].innerHTML;
          }

          if (linkEl.children.length > 0) {
            // <img> thumbnail element, retrieving thumbnail url
            item.msrc = linkEl.children[0].getAttribute("src");
          }

          item.el = figureEl; // save link to element for getThumbBoundsFn
          items.push(item);
        }

        return items;
      };

      // find nearest parent element
      var closest = function closest(el, fn) {
        return el && (fn(el) ? el : closest(el.parentNode, fn));
      };

      // triggers when user clicks on thumbnail
      var onThumbnailsClick = function (e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : (e.returnValue = false);

        var eTarget = e.target || e.srcElement;

        // find root element of slide
        var clickedListItem = closest(eTarget, function (el) {
          return el.tagName && el.tagName.toUpperCase() === "FIGURE";
        });

        if (!clickedListItem) {
          return;
        }

        // find index of clicked item by looping through all child nodes
        // alternatively, you may define index via data- attribute
        var clickedGallery = clickedListItem.parentNode,
          childNodes = clickedListItem.parentNode.childNodes,
          numChildNodes = childNodes.length,
          nodeIndex = 0,
          index;

        for (var i = 0; i < numChildNodes; i++) {
          if (childNodes[i].nodeType !== 1) {
            continue;
          }

          if (childNodes[i] === clickedListItem) {
            index = nodeIndex;
            break;
          }
          nodeIndex++;
        }

        if (index >= 0) {
          // open PhotoSwipe if valid index found
          openPhotoSwipe(index, clickedGallery);
        }
        return false;
      };

      // parse picture index and gallery index from URL (#&pid=1&gid=2)
      var photoswipeParseHash = function () {
        var hash = window.location.hash.substring(1),
          params = {};

        if (hash.length < 5) {
          return params;
        }

        var vars = hash.split("&");
        for (var i = 0; i < vars.length; i++) {
          if (!vars[i]) {
            continue;
          }
          var pair = vars[i].split("=");
          if (pair.length < 2) {
            continue;
          }
          params[pair[0]] = pair[1];
        }

        if (params.gid) {
          params.gid = parseInt(params.gid, 10);
        }

        return params;
      };

      var openPhotoSwipe = function (
        index,
        galleryElement,
        disableAnimation,
        fromURL
      ) {
        var pswpElement = document.querySelectorAll(".pswp")[0],
          gallery,
          options,
          items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {
          // define gallery index (for URL)
          galleryUID: galleryElement.getAttribute("data-pswp-uid"),

          getThumbBoundsFn: function (index) {
            // See Options -> getThumbBoundsFn section of documentation for more info
            var thumbnail = items[index].el.getElementsByTagName("img")[0], // find thumbnail
              pageYScroll =
                window.pageYOffset || document.documentElement.scrollTop,
              rect = thumbnail.getBoundingClientRect();

            return {
              x: rect.left,
              y: rect.top + pageYScroll,
              w: rect.width,
            };
          },
        };

        // PhotoSwipe opened from URL
        if (fromURL) {
          if (options.galleryPIDs) {
            // parse real index when custom PIDs are used
            // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
            for (var j = 0; j < items.length; j++) {
              if (items[j].pid == index) {
                options.index = j;
                break;
              }
            }
          } else {
            // in URL indexes start from 1
            options.index = parseInt(index, 10) - 1;
          }
        } else {
          options.index = parseInt(index, 10);
        }

        // exit if index not found
        if (isNaN(options.index)) {
          return;
        }

        if (disableAnimation) {
          options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe(
          pswpElement,
          PhotoSwipeUI_Default,
          items,
          options
        );
        gallery.init();
      };

      // loop through all gallery elements and bind events
      var galleryElements = document.querySelectorAll(gallerySelector);

      for (var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute("data-pswp-uid", i + 1);
        galleryElements[i].onclick = onThumbnailsClick;
      }

      // Parse URL and open gallery if it contains #&pid=3&gid=1
      var hashData = photoswipeParseHash();
      if (hashData.pid && hashData.gid) {
        openPhotoSwipe(
          hashData.pid,
          galleryElements[hashData.gid - 1],
          true,
          true
        );
      }
    };

    // execute above function
    initPhotoSwipeFromDOM(".my-gallery");
  },
  methods: {
    getChoices(id) {
      if (document.getElementById(id)) {
        var element = document.getElementById(id);
        return new Choices(element, {
          searchEnabled: false,
          itemSelectText: "",
        });
      }
    },
  },
};
</script>
