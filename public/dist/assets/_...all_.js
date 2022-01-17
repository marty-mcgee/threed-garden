import { f as defineComponent, h as useI18n, p as openBlock, i as createElementBlock, t as toDisplayString, k as unref } from "./vendor.js";
var block0 = {};
const _sfc_main = /* @__PURE__ */ defineComponent({
  setup(__props) {
    const { t } = useI18n();
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", null, toDisplayString(unref(t)("not-found")), 1);
    };
  }
});
if (typeof block0 === "function")
  block0(_sfc_main);
export { _sfc_main as default };
