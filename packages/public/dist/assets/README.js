import { B as useHead, o as openBlock, p as createElementBlock, v as createStaticVNode } from "./vendor.js";
const _hoisted_1 = { class: "prose prose-sm m-auto text-left" };
const _hoisted_2 = /* @__PURE__ */ createStaticVNode('<h2>File-based Routing</h2><p>Routes will be auto-generated for Vue files in this dir with the same file structure. Check out <a href="https://github.com/hannoeru/vite-plugin-pages" target="_blank" rel="noopener"><code>vite-plugin-pages</code></a> for more details.</p><h3>Path Aliasing</h3><p><code>~/</code> is aliased to <code>./src/</code> folder.</p><p>For example, instead of having</p><pre class="language-ts"><code class="language-ts"><span class="token keyword">import</span> <span class="token punctuation">{</span> isDark <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">&#39;../../../../logic&#39;</span>\n</code></pre><p>now, you can use</p><pre class="language-ts"><code class="language-ts"><span class="token keyword">import</span> <span class="token punctuation">{</span> isDark <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">&#39;~/logic&#39;</span>\n</code></pre>', 8);
const _hoisted_10 = [
  _hoisted_2
];
const meta = [];
const _sfc_main = {
  setup(__props, { expose }) {
    const frontmatter = { "meta": [] };
    expose({ frontmatter });
    const head = { "meta": [] };
    useHead(head);
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, _hoisted_10);
    };
  }
};
export { _sfc_main as default, meta };
