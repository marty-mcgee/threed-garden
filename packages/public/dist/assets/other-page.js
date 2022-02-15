import { i as defineComponent, B as useHead, J as resolveComponent, o as openBlock, p as createElementBlock, q as createBaseVNode, E as toDisplayString, k as createVNode, l as withCtx, K as createTextVNode } from "./vendor.js";
var block0 = {};
const _sfc_main = /* @__PURE__ */ defineComponent({
  setup(__props) {
    useHead({
      title: "Other Page"
    });
    return (_ctx, _cache) => {
      const _component_router_link = resolveComponent("router-link");
      return openBlock(), createElementBlock("div", null, [
        createBaseVNode("p", null, toDisplayString(_ctx.$t("pages.other.desc")), 1),
        createVNode(_component_router_link, {
          to: { name: "home" },
          class: "mt-5 hover:text-gray-200 dark:hover:text-gray-500 hover:underline"
        }, {
          default: withCtx(() => [
            createTextVNode(toDisplayString(_ctx.$t("pages.home")), 1)
          ]),
          _: 1
        })
      ]);
    };
  }
});
if (typeof block0 === "function")
  block0(_sfc_main);
export { _sfc_main as default };
