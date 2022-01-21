import { f as defineComponent, u as useRouter, h as useI18n, T as watchEffect, o as resolveComponent, p as openBlock, i as createElementBlock, j as createBaseVNode, t as toDisplayString, k as unref, U as Fragment, X as renderList, Y as createCommentVNode, m as createVNode, n as withCtx, q as createTextVNode } from "./vendor.js";
import { u as useUserStore } from "./index.js";
const _hoisted_1 = ["src"];
const _hoisted_2 = { class: "text-sm opacity-50" };
const _hoisted_3 = {
  key: 0,
  class: "text-sm mt-4"
};
const _hoisted_4 = { class: "opacity-75" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  props: {
    name: null
  },
  setup(__props) {
    const props = __props;
    const router = useRouter();
    const user = useUserStore();
    const { t } = useI18n();
    watchEffect(() => {
      user.setNewName(props.name);
    });
    return (_ctx, _cache) => {
      const _component_router_link = resolveComponent("router-link");
      return openBlock(), createElementBlock("div", null, [
        createBaseVNode("img", {
          src: _ctx.ThreeDGardenLogo,
          width: "77",
          class: "mx-auto"
        }, null, 8, _hoisted_1),
        createBaseVNode("p", null, toDisplayString(unref(t)("intro.hi", { name: props.name })), 1),
        createBaseVNode("p", _hoisted_2, [
          createBaseVNode("em", null, toDisplayString(unref(t)("intro.dynamic-route")), 1)
        ]),
        unref(user).otherNames.length ? (openBlock(), createElementBlock("p", _hoisted_3, [
          createBaseVNode("span", _hoisted_4, toDisplayString(unref(t)("intro.aka")) + ":", 1),
          createBaseVNode("ul", null, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(unref(user).otherNames, (otherName) => {
              return openBlock(), createElementBlock("li", { key: otherName }, [
                createVNode(_component_router_link, {
                  to: `/hi/${otherName}`,
                  replace: ""
                }, {
                  default: withCtx(() => [
                    createTextVNode(toDisplayString(otherName), 1)
                  ]),
                  _: 2
                }, 1032, ["to"])
              ]);
            }), 128))
          ])
        ])) : createCommentVNode("", true),
        createBaseVNode("div", null, [
          createBaseVNode("button", {
            class: "btn m-3 text-sm mt-6",
            onClick: _cache[0] || (_cache[0] = ($event) => unref(router).back())
          }, toDisplayString(unref(t)("button.back")), 1)
        ])
      ]);
    };
  }
});
export { _sfc_main as default };
