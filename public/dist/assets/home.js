import { a as _export_sfc, b as _sfc_main$1 } from "./index.js";
import { i as resolveComponent, o as openBlock, j as createElementBlock, n as createVNode, k as createBaseVNode } from "./vendor.js";
const _sfc_main = {};
const _hoisted_1 = { class: "px-4 py-10 text-center text-gray-700 dark:text-gray-200" };
const _hoisted_2 = /* @__PURE__ */ createBaseVNode("div", { class: "mt-5 mx-auto text-center opacity-25 text-sm" }, " [Home Layout] ", -1);
function _sfc_render(_ctx, _cache) {
  const _component_router_view = resolveComponent("router-view");
  const _component_Footer = _sfc_main$1;
  return openBlock(), createElementBlock("main", _hoisted_1, [
    createVNode(_component_router_view),
    createVNode(_component_Footer),
    _hoisted_2
  ]);
}
var home = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export { home as default };
