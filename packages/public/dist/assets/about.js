import { _ as __unplugin_components_0 } from "./index.js";
import { g as useHead, p as openBlock, i as createElementBlock, j as createBaseVNode, m as createVNode, s as createStaticVNode } from "./vendor.js";
const _hoisted_1 = { class: "prose prose-sm m-auto text-left" };
const _hoisted_2 = { class: "text-center" };
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("h3", null, "About", -1);
const _hoisted_4 = /* @__PURE__ */ createStaticVNode('<p><a href="https://github.com/ctholho/vitespa" target="_blank" rel="noopener">Vitespa</a> is a fork of the opinionated <a href="https://github.com/vitejs/vite" target="_blank" rel="noopener">Vite</a> starter template <a href="https://github.com/antfu/vitesse" target="_blank" rel="noopener">Vitesse</a> by <a href="https://github.com/antfu" target="_blank" rel="noopener">@antfu</a> for mocking apps swiftly. With <strong>file-based routing</strong>, <strong>components auto importing</strong>, <strong>markdown support</strong>, I18n, PWA and uses <strong>WindiCSS</strong> for UI.</p><pre class="language-js"><code class="language-js"><span class="token comment">// syntax highlighting example</span>\n<span class="token keyword">function</span> <span class="token function">vitespa</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>\n  <span class="token keyword">const</span> foo <span class="token operator">=</span> <span class="token string">&#39;bar&#39;</span>\n  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>foo<span class="token punctuation">)</span>\n<span class="token punctuation">}</span>\n</code></pre><p>Check out the <a href="https://github.com/ctholho/vitespa" target="_blank" rel="noopener">GitHub repo</a> for more details.</p>', 3);
const title = "About";
const meta = [{ "property": "og:title", "content": "About" }];
const _sfc_main = {
  setup(__props, { expose }) {
    const frontmatter = { "title": "About", "meta": [{ "property": "og:title", "content": "About" }] };
    expose({ frontmatter });
    const head = { "title": "About", "meta": [{ "property": "og:title", "content": "About" }] };
    useHead(head);
    return (_ctx, _cache) => {
      const _component_carbon_dicom_overlay = __unplugin_components_0;
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          createVNode(_component_carbon_dicom_overlay, { class: "text-4xl -mb-6 m-auto" }),
          _hoisted_3
        ]),
        _hoisted_4
      ]);
    };
  }
};
export { _sfc_main as default, meta, title };
