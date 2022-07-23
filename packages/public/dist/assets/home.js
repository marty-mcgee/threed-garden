import { a as _export_sfc, b as _sfc_main$1 } from "./index.js";
import { p as createElementBlock, k as createVNode, q as createBaseVNode, J as resolveComponent, o as openBlock } from "./vendor.js";
const _sfc_main = {};
const _hoisted_1 = { class: "text-center text-gray-700 dark:text-gray-200" };
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
