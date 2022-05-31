import { o as openBlock, p as createElementBlock, q as createBaseVNode, i as defineComponent, A as useRouter, C as useI18n, k as createVNode, D as unref, E as toDisplayString, J as resolveComponent } from "./vendor.js";
const _hoisted_1$1 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$1 = /* @__PURE__ */ createBaseVNode("path", {
  fill: "currentColor",
  d: "M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2Zm0 26a12 12 0 1 1 12-12a12 12 0 0 1-12 12Z"
}, null, -1);
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("path", {
  fill: "currentColor",
  d: "M15 8h2v11h-2zm1 14a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 22z"
}, null, -1);
const _hoisted_4 = [
  _hoisted_2$1,
  _hoisted_3
];
function render(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$1, _hoisted_4);
}
var __unplugin_components_0 = { name: "carbon-warning", render };
const _hoisted_1 = { class: "text-center text-teal-700 dark:text-gray-200" };
const _hoisted_2 = { class: "text-4xl" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  setup(__props) {
    const router = useRouter();
    const { t } = useI18n();
    return (_ctx, _cache) => {
      const _component_carbon_warning = __unplugin_components_0;
      const _component_router_view = resolveComponent("router-view");
      return openBlock(), createElementBlock("main", _hoisted_1, [
        createBaseVNode("div", null, [
          createBaseVNode("p", _hoisted_2, [
            createVNode(_component_carbon_warning, { class: "inline-block" })
          ])
        ]),
        createVNode(_component_router_view),
        createBaseVNode("div", null, [
          createBaseVNode("button", {
            class: "btn m-3 text-sm mt-8",
            onClick: _cache[0] || (_cache[0] = ($event) => unref(router).back())
          }, toDisplayString(unref(t)("button.back")), 1),
          createBaseVNode("button", {
            onClick: _cache[1] || (_cache[1] = ($event) => unref(router).go(-1)),
            class: "btn btn-primary my-5"
          }, "Go(-1)"),
          createBaseVNode("button", {
            onClick: _cache[2] || (_cache[2] = ($event) => unref(router).push("/")),
            class: "btn btn-secondary my-5"
          }, "Home")
        ])
      ]);
    };
  }
});
export { _sfc_main as default };
