var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import { c as createHead, a as createI18n, N as NProgress, b as createPinia, I as Interface, u as useDark, d as useToggle, r as ref, e as dist, W as WalletConnectProvider, f as WalletLink, g as Web3Provider, m as markRaw, h as computed, i as defineComponent, w as watch, j as createBlock, k as createVNode, l as withCtx, T as Transition, n as Teleport, o as openBlock, p as createElementBlock, q as createBaseVNode, s as renderSlot, t as createCommentVNode, v as createStaticVNode, x as inject, y as onMounted, z as defineStore, A as useRouter, B as useHead, C as useI18n, D as unref, E as toDisplayString, F as withDirectives, G as vModelText, H as withKeys, J as resolveComponent, K as createTextVNode, L as gql, M as getDefaultProvider, O as Contract, P as pushScopeId, Q as popScopeId, R as process, S as buffer, U as util, V as useEthers$1, X as displayEther, Y as shortenAddress, Z as useBoard$1, _ as createApp, $ as createRouter, a0 as createWebHashHistory, a1 as VueDapp } from "./vendor.js";
const p = function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(script) {
    const fetchOpts = {};
    if (script.integrity)
      fetchOpts.integrity = script.integrity;
    if (script.referrerpolicy)
      fetchOpts.referrerPolicy = script.referrerpolicy;
    if (script.crossorigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (script.crossorigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
};
p();
const install$3 = ({ app: app2 }) => {
  const head = createHead();
  app2.use(head);
};
var __glob_16_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  install: install$3
}, Symbol.toStringTag, { value: "Module" }));
var de = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\xDCber"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Zur\xFCck"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Los"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Startseite"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Dunkelmodus umschalten"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Sprachen \xE4ndern"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Vite Startvorlage mit Vorlieben"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Demo einer dynamischen Route"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Hi, ", _interpolate(_named("name")), "!"]);
    },
    "aka": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Auch bekannt als"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Wie hei\xDFt du?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["Nicht gefunden"]);
  }
};
var __glob_1_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": de
}, Symbol.toStringTag, { value: "Module" }));
var en = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["About"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Back"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["GO"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Home"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Toggle dark mode"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Change languages"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["3D WordPress Plugin"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Demo of dynamic route"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Hi, ", _interpolate(_named("name")), "!"]);
    },
    "aka": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Also known as"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["What's your name?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["Not found"]);
  }
};
var __glob_1_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": en
}, Symbol.toStringTag, { value: "Module" }));
var es = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Acerca de"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Atr\xE1s"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Ir"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Inicio"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Alternar modo oscuro"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Cambiar idiomas"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Plantilla de Inicio de Vite Dogm\xE1tica"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Demo de ruta din\xE1mica"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["\xA1Hola, ", _interpolate(_named("name")), "!"]);
    },
    "aka": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Tambi\xE9n conocido como"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\xBFC\xF3mo te llamas?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["No se ha encontrado"]);
  }
};
var __glob_1_2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": es
}, Symbol.toStringTag, { value: "Module" }));
var fr = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\xC0 propos de"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Retour"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Essayer"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Accueil"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Basculer en mode sombre"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Changer de langue"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Exemple d'application Vite"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["D\xE9mo de route dynamique"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Salut, ", _interpolate(_named("name")), "!"]);
    },
    "aka": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Aussi connu sous le nom de"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Comment t'appelles-tu ?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["Page non trouv\xE9e"]);
  }
};
var __glob_1_3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": fr
}, Symbol.toStringTag, { value: "Module" }));
var it = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Su di me"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Indietro"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Vai"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Home"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Attiva/disattiva modalit\xE0 scura"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Cambia lingua"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Modello per una Applicazione Vite"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Demo di rotta dinamica"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Ciao, ", _interpolate(_named("name")), "!"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Come ti chiami?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["Non trovato"]);
  }
};
var __glob_1_4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": it
}, Symbol.toStringTag, { value: "Module" }));
var ja = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u3053\u308C\u306F\uFF1F"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u623B\u308B"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u9032\u3080"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u30DB\u30FC\u30E0"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u30C0\u30FC\u30AF\u30E2\u30FC\u30C9\u5207\u308A\u66FF\u3048"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u8A00\u8A9E\u5207\u308A\u66FF\u3048"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u56FA\u57F7\u3055\u308C\u305F Vite \u30B9\u30BF\u30FC\u30BF\u30FC\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u52D5\u7684\u30EB\u30FC\u30C8\u306E\u30C7\u30E2"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["\u3053\u3093\u306B\u3061\u306F\u3001", _interpolate(_named("name")), "!"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u541B\u306E\u540D\u306F\u3002"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F"]);
  }
};
var __glob_1_5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": ja
}, Symbol.toStringTag, { value: "Module" }));
var ko = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\uC18C\uAC1C"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\uB4A4\uB85C\uAC00\uAE30"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\uC774\uB3D9"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\uD648"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\uB2E4\uD06C\uBAA8\uB4DC \uD1A0\uAE00"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\uC5B8\uC5B4 \uBCC0\uACBD"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Vite \uC560\uD50C\uB9AC\uCF00\uC774\uC158 \uD15C\uD50C\uB9BF"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\uB2E4\uC774\uB098\uBBF9 \uB77C\uC6B0\uD2B8 \uB370\uBAA8"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["\uC548\uB155, ", _interpolate(_named("name")), "!"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\uC774\uB984\uC774 \uBB50\uC608\uC694?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["\uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4"]);
  }
};
var __glob_1_6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": ko
}, Symbol.toStringTag, { value: "Module" }));
var pl = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["O nas"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Wr\xF3\u0107"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["WEJD\u0179"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Strona g\u0142\xF3wna"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Ustaw tryb nocny"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Zmie\u0144 j\u0119zyk"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Opiniowany szablon startowy Vite"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Demonstracja dynamicznego route"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Cze\u015B\u0107, ", _interpolate(_named("name")), "!"]);
    },
    "aka": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Znany te\u017C jako"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Jak masz na imi\u0119?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["Nie znaleziono"]);
  }
};
var __glob_1_7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": pl
}, Symbol.toStringTag, { value: "Module" }));
var ptBR = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Sobre"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Voltar"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Ir"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["In\xEDcio"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Alternar modo escuro"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Mudar de idioma"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Modelo Opinativo de Partida de Vite"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Demonstra\xE7\xE3o de rota din\xE2mica"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Ol\xE1, ", _interpolate(_named("name")), "!"]);
    },
    "aka": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Tamb\xE9m conhecido como"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Qual \xE9 o seu nome?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["N\xE3o encontrado"]);
  }
};
var __glob_1_8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": ptBR
}, Symbol.toStringTag, { value: "Module" }));
var ru = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u041E \u0448\u0430\u0431\u043B\u043E\u043D\u0435"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u041D\u0430\u0437\u0430\u0434"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u041F\u0435\u0440\u0435\u0439\u0442\u0438"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u0413\u043B\u0430\u0432\u043D\u0430\u044F"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0442\u0435\u043C\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u044F\u0437\u044B\u043A"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u0421\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u044B\u0439 \u0448\u0430\u0431\u043B\u043E\u043D Vite"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u0414\u0435\u043C\u043E \u0434\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["\u041F\u0440\u0438\u0432\u0435\u0442, ", _interpolate(_named("name")), "!"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u041A\u0430\u043A \u0442\u0435\u0431\u044F \u0437\u043E\u0432\u0443\u0442?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"]);
  }
};
var __glob_1_9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": ru
}, Symbol.toStringTag, { value: "Module" }));
var tr = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Hakk\u0131mda"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Geri"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u0130LER\u0130"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Anasayfa"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Karanl\u0131k modu de\u011Fi\u015Ftir"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Dilleri de\u011Fi\u015Ftir"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["G\xF6r\xFC\u015Fl\xFC Vite Ba\u015Flang\u0131\xE7 \u015Eablonu"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Dinamik rota demosu"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Merhaba, ", _interpolate(_named("name")), "!"]);
    },
    "aka": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Ayr\u0131ca \u015F\xF6yle bilinir"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Ad\u0131n\u0131z nedir?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["Bulunamad\u0131"]);
  }
};
var __glob_1_10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": tr
}, Symbol.toStringTag, { value: "Module" }));
var vi = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["V\u1EC1"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Quay l\u1EA1i"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u0110i"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Kh\u1EDFi \u0111\u1EA7u"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Chuy\u1EC3n \u0111\u1ED5i ch\u1EBF \u0111\u1ED9 t\u1ED1i"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["Thay \u0111\u1ED5i ng\xF4n ng\u1EEF"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\xDD ki\u1EBFn c\xE1 nh\xE2n Vite Template \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["B\u1EA3n gi\u1EDBi thi\u1EC7u v\u1EC1 dynamic route"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Hi, ", _interpolate(_named("name")), "!"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["T\xEAn b\u1EA1n l\xE0 g\xEC?"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["Kh\xF4ng t\xECm th\u1EA5y"]);
  }
};
var __glob_1_11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": vi
}, Symbol.toStringTag, { value: "Module" }));
var zhCN = {
  "button": {
    "about": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u5173\u4E8E"]);
    },
    "back": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u8FD4\u56DE"]);
    },
    "go": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u786E\u5B9A"]);
    },
    "home": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u9996\u9875"]);
    },
    "toggle_dark": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u5207\u6362\u6DF1\u8272\u6A21\u5F0F"]);
    },
    "toggle_langs": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u5207\u6362\u8BED\u8A00"]);
    }
  },
  "intro": {
    "desc": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u56FA\u6267\u5DF1\u89C1\u7684 Vite \u9879\u76EE\u6A21\u677F"]);
    },
    "dynamic-route": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u52A8\u6001\u8DEF\u7531\u6F14\u793A"]);
    },
    "hi": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["\u4F60\u597D\uFF0C", _interpolate(_named("name"))]);
    },
    "aka": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u4E5F\u53EB"]);
    },
    "whats-your-name": (ctx) => {
      const { normalize: _normalize } = ctx;
      return _normalize(["\u8F93\u5165\u4F60\u7684\u540D\u5B57"]);
    }
  },
  "not-found": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["\u672A\u627E\u5230\u9875\u9762"]);
  }
};
var __glob_1_12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": zhCN
}, Symbol.toStringTag, { value: "Module" }));
const messages = Object.fromEntries(Object.entries({ "../../locales/de.yml": __glob_1_0, "../../locales/en.yml": __glob_1_1, "../../locales/es.yml": __glob_1_2, "../../locales/fr.yml": __glob_1_3, "../../locales/it.yml": __glob_1_4, "../../locales/ja.yml": __glob_1_5, "../../locales/ko.yml": __glob_1_6, "../../locales/pl.yml": __glob_1_7, "../../locales/pt-BR.yml": __glob_1_8, "../../locales/ru.yml": __glob_1_9, "../../locales/tr.yml": __glob_1_10, "../../locales/vi.yml": __glob_1_11, "../../locales/zh-CN.yml": __glob_1_12 }).map(([key, value]) => {
  const yaml = key.endsWith(".yaml");
  return [key.slice(14, yaml ? -5 : -4), value.default];
}));
const install$2 = ({ app: app2 }) => {
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    messages
  });
  app2.use(i18n);
};
var __glob_16_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  install: install$2
}, Symbol.toStringTag, { value: "Module" }));
const install$1 = ({ router: router2 }) => {
  router2.beforeEach(() => {
    NProgress.start();
  });
  router2.afterEach(() => {
    NProgress.done();
  });
};
var __glob_16_2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  install: install$1
}, Symbol.toStringTag, { value: "Module" }));
const install = ({ app: app2 }) => {
  const pinia = createPinia();
  app2.use(pinia);
};
var __glob_16_3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  install
}, Symbol.toStringTag, { value: "Module" }));
var ChainId = /* @__PURE__ */ ((ChainId2) => {
  ChainId2[ChainId2["Hardhat"] = 31337] = "Hardhat";
  ChainId2[ChainId2["Mainnet"] = 1] = "Mainnet";
  ChainId2[ChainId2["Ropsten"] = 3] = "Ropsten";
  ChainId2[ChainId2["Rinkeby"] = 4] = "Rinkeby";
  ChainId2[ChainId2["Goerli"] = 5] = "Goerli";
  ChainId2[ChainId2["Kovan"] = 42] = "Kovan";
  ChainId2[ChainId2["xDai"] = 100] = "xDai";
  ChainId2[ChainId2["Rinkarby"] = 421611] = "Rinkarby";
  ChainId2[ChainId2["Arbitrum"] = 42161] = "Arbitrum";
  ChainId2[ChainId2["Polygon"] = 137] = "Polygon";
  return ChainId2;
})(ChainId || {});
const NETWORK_DETAILS = {
  [42161]: {
    chainId: "0x" + 42161 .toString(16),
    chainName: "Arbitrum",
    nativeCurrency: {
      symbol: "ETH",
      decimals: 18
    },
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"]
  },
  [421611]: {
    chainId: "0x" + 421611 .toString(16),
    chainName: "RinkArby",
    nativeCurrency: {
      symbol: "ETH",
      decimals: 18
    },
    rpcUrls: ["https://rinkeby.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://rinkeby-explorer.arbitrum.io"]
  },
  [100]: {
    chainId: "0x" + 100 .toString(16),
    chainName: "xDAI",
    nativeCurrency: {
      symbol: "xDAI",
      decimals: 18
    },
    rpcUrls: ["https://rpc.xdaichain.com"],
    blockExplorerUrls: ["https://blockscout.com/poa/xdai"]
  },
  [137]: {
    chainId: "0x" + 137 .toString(16),
    chainName: "Polygon Mainnet",
    nativeCurrency: {
      symbol: "MATIC",
      decimals: 18
    },
    rpcUrls: ["https://polygon-rpc.com/"],
    blockExplorerUrls: ["https://polygonscan.com/"]
  }
};
const contractName = "ERC20";
const abi = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address"
      },
      {
        name: "_value",
        type: "uint256"
      }
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "_from",
        type: "address"
      },
      {
        name: "_to",
        type: "address"
      },
      {
        name: "_value",
        type: "uint256"
      }
    ],
    name: "transferFrom",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "_to",
        type: "address"
      },
      {
        name: "_value",
        type: "uint256"
      }
    ],
    name: "transfer",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address"
      },
      {
        name: "_spender",
        type: "address"
      }
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    payable: true,
    stateMutability: "payable",
    type: "fallback"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        name: "spender",
        type: "address"
      },
      {
        indexed: false,
        name: "value",
        type: "uint256"
      }
    ],
    name: "Approval",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address"
      },
      {
        indexed: true,
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        name: "value",
        type: "uint256"
      }
    ],
    name: "Transfer",
    type: "event"
  }
];
const bytecode = "0x608060405234801561001057600080fd5b506105dd806100206000396000f3fe608060405234801561001057600080fd5b50600436106100a5576000357c01000000000000000000000000000000000000000000000000000000009004806370a082311161007857806370a0823114610166578063a457c2d71461018c578063a9059cbb146101b8578063dd62ed3e146101e4576100a5565b8063095ea7b3146100aa57806318160ddd146100ea57806323b872dd14610104578063395093511461013a575b600080fd5b6100d6600480360360408110156100c057600080fd5b50600160a060020a038135169060200135610212565b604080519115158252519081900360200190f35b6100f2610290565b60408051918252519081900360200190f35b6100d66004803603606081101561011a57600080fd5b50600160a060020a03813581169160208101359091169060400135610296565b6100d66004803603604081101561015057600080fd5b50600160a060020a03813516906020013561035f565b6100f26004803603602081101561017c57600080fd5b5035600160a060020a031661040f565b6100d6600480360360408110156101a257600080fd5b50600160a060020a03813516906020013561042a565b6100d6600480360360408110156101ce57600080fd5b50600160a060020a038135169060200135610475565b6100f2600480360360408110156101fa57600080fd5b50600160a060020a038135811691602001351661048b565b6000600160a060020a038316151561022957600080fd5b336000818152600160209081526040808320600160a060020a03881680855290835292819020869055805186815290519293927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929181900390910190a350600192915050565b60025490565b600160a060020a03831660009081526001602090815260408083203384529091528120546102ca908363ffffffff6104b616565b600160a060020a03851660009081526001602090815260408083203384529091529020556102f98484846104cb565b600160a060020a0384166000818152600160209081526040808320338085529083529281902054815190815290519293927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929181900390910190a35060019392505050565b6000600160a060020a038316151561037657600080fd5b336000908152600160209081526040808320600160a060020a03871684529091529020546103aa908363ffffffff61059816565b336000818152600160209081526040808320600160a060020a0389168085529083529281902085905580519485525191937f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929081900390910190a350600192915050565b600160a060020a031660009081526020819052604090205490565b6000600160a060020a038316151561044157600080fd5b336000908152600160209081526040808320600160a060020a03871684529091529020546103aa908363ffffffff6104b616565b60006104823384846104cb565b50600192915050565b600160a060020a03918216600090815260016020908152604080832093909416825291909152205490565b6000828211156104c557600080fd5b50900390565b600160a060020a03821615156104e057600080fd5b600160a060020a038316600090815260208190526040902054610509908263ffffffff6104b616565b600160a060020a03808516600090815260208190526040808220939093559084168152205461053e908263ffffffff61059816565b600160a060020a038084166000818152602081815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b6000828201838110156105aa57600080fd5b939250505056fea165627a7a72305820722c0187518ce2856a424bdba350d5a263c8f98fcb19cb4cc161372bc3b794c90029";
const deployedBytecode = "0x608060405234801561001057600080fd5b50600436106100a5576000357c01000000000000000000000000000000000000000000000000000000009004806370a082311161007857806370a0823114610166578063a457c2d71461018c578063a9059cbb146101b8578063dd62ed3e146101e4576100a5565b8063095ea7b3146100aa57806318160ddd146100ea57806323b872dd14610104578063395093511461013a575b600080fd5b6100d6600480360360408110156100c057600080fd5b50600160a060020a038135169060200135610212565b604080519115158252519081900360200190f35b6100f2610290565b60408051918252519081900360200190f35b6100d66004803603606081101561011a57600080fd5b50600160a060020a03813581169160208101359091169060400135610296565b6100d66004803603604081101561015057600080fd5b50600160a060020a03813516906020013561035f565b6100f26004803603602081101561017c57600080fd5b5035600160a060020a031661040f565b6100d6600480360360408110156101a257600080fd5b50600160a060020a03813516906020013561042a565b6100d6600480360360408110156101ce57600080fd5b50600160a060020a038135169060200135610475565b6100f2600480360360408110156101fa57600080fd5b50600160a060020a038135811691602001351661048b565b6000600160a060020a038316151561022957600080fd5b336000818152600160209081526040808320600160a060020a03881680855290835292819020869055805186815290519293927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929181900390910190a350600192915050565b60025490565b600160a060020a03831660009081526001602090815260408083203384529091528120546102ca908363ffffffff6104b616565b600160a060020a03851660009081526001602090815260408083203384529091529020556102f98484846104cb565b600160a060020a0384166000818152600160209081526040808320338085529083529281902054815190815290519293927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929181900390910190a35060019392505050565b6000600160a060020a038316151561037657600080fd5b336000908152600160209081526040808320600160a060020a03871684529091529020546103aa908363ffffffff61059816565b336000818152600160209081526040808320600160a060020a0389168085529083529281902085905580519485525191937f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929081900390910190a350600192915050565b600160a060020a031660009081526020819052604090205490565b6000600160a060020a038316151561044157600080fd5b336000908152600160209081526040808320600160a060020a03871684529091529020546103aa908363ffffffff6104b616565b60006104823384846104cb565b50600192915050565b600160a060020a03918216600090815260016020908152604080832093909416825291909152205490565b6000828211156104c557600080fd5b50900390565b600160a060020a03821615156104e057600080fd5b600160a060020a038316600090815260208190526040902054610509908263ffffffff6104b616565b600160a060020a03808516600090815260208190526040808220939093559084168152205461053e908263ffffffff61059816565b600160a060020a038084166000818152602081815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b6000828201838110156105aa57600080fd5b939250505056fea165627a7a72305820722c0187518ce2856a424bdba350d5a263c8f98fcb19cb4cc161372bc3b794c90029";
const compiler = {
  name: "solc",
  version: "0.5.4+commit.9549d8ff.Emscripten.clang"
};
var ERC20 = {
  contractName,
  abi,
  bytecode,
  deployedBytecode,
  compiler
};
new Interface(ERC20.abi);
const isDark = useDark();
const toggleDark = useToggle(isDark);
const boardOpen = ref(false);
function useBoard() {
  const open = () => {
    boardOpen.value = true;
  };
  const close = () => {
    boardOpen.value = false;
  };
  return {
    boardOpen,
    open,
    close
  };
}
function checkChainId(chainId) {
  if (chainId in ChainId) {
    return true;
  }
  return false;
}
class Metamask {
  static async check() {
    const provider2 = await dist();
    return provider2 ? true : false;
  }
  static async connect() {
    const provider2 = await dist();
    await provider2.request({
      method: "eth_requestAccounts",
      params: [{ eth_accounts: {} }]
    });
    return provider2;
  }
  static async switchChain(provider2, chainId) {
    try {
      await provider2.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + chainId.toString(16) }]
      });
    } catch (err) {
      try {
        if (err.code === 4902 && checkChainId(chainId)) {
          await Metamask.addChain(provider2, NETWORK_DETAILS[chainId]);
          return;
        }
      } catch (err2) {
        throw new Error(`Failed to add new chain: ${err2.message}`);
      }
      throw new Error(`Failed to switch chain: ${err.message}`);
    }
  }
  static async addChain(provider2, networkDetails) {
    return provider2.request({
      method: "wallet_addEthereumChain",
      params: [networkDetails]
    });
  }
}
class Walletconnect {
  static async check() {
    if (!WalletConnectProvider) {
      console.warn('Walletconnect unavailable: please add below script to enable the feature: <script src="https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.6.5/dist/umd/index.min.js"><\/script>');
      return false;
    }
    return true;
  }
  static async connect(infuraId, options) {
    const provider2 = new WalletConnectProvider(__spreadValues({
      infuraId
    }, options));
    return new Promise(async (resolve, reject) => {
      provider2.wc.on("disconnect", (err, payload) => {
        if (!provider2.connected) {
          console.log(err, payload);
          reject(new Error("User rejected the request."));
        }
      });
      try {
        await provider2.enable();
      } catch (e) {
        reject(new Error(e));
        return;
      }
      resolve(provider2);
    });
  }
}
class Walletlink {
  static async check() {
    if (!WalletLink) {
      console.warn("WalletLink unavailable");
      return false;
    }
    return true;
  }
  static async connect(infuraId, appName) {
    const walletLink = new WalletLink({ appName });
    const provider2 = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${infuraId}`);
    return new Promise(async (resolve, reject) => {
      provider2.on("disconnect", (err, payload) => {
        if (!provider2.connected) {
          console.log(err, payload);
          reject(new Error("User rejected the request."));
        }
      });
      try {
        await provider2.enable();
      } catch (e) {
        reject(new Error(e.message));
        return;
      }
      resolve(provider2);
    });
  }
}
const isActivated = ref(false);
const provider$1 = ref(null);
const signer = ref(null);
const network = ref(null);
const address = ref("");
const balance = ref(BigInt(0));
const deactivate = () => {
  isActivated.value = false;
  provider$1.value = null;
  signer.value = null;
  network.value = null;
  address.value = "";
  balance.value = BigInt(0);
};
async function activate(walletProvider) {
  if (!walletProvider)
    throw new Error("Failed to activate: missing provider");
  const _provider = new Web3Provider(walletProvider);
  const _signer = _provider.getSigner();
  const _network = await _provider.getNetwork();
  const _address = await _signer.getAddress();
  const _balance = await _signer.getBalance();
  provider$1.value = markRaw(_provider);
  signer.value = markRaw(_signer);
  network.value = _network;
  address.value = _address;
  balance.value = _balance.toBigInt();
  isActivated.value = true;
}
function useEthers() {
  const chainId = computed(() => {
    var _a;
    return (_a = network.value) == null ? void 0 : _a.chainId;
  });
  return {
    isActivated,
    provider: provider$1,
    signer,
    network,
    address,
    balance,
    chainId,
    activate,
    deactivate
  };
}
const provider = ref(null);
const status = ref("none");
const walletName = ref("none");
const error = ref("");
const onDisconnectCallback = ref(null);
const onAccountsChangedCallback = ref(null);
const onChainChangedCallback = ref(null);
function useWallet(options = { library: "ethers" }) {
  const { activate: activate2, deactivate: deactivate2 } = useEthers();
  function clear() {
    provider.value = null;
    status.value = "none";
    walletName.value = "none";
    error.value = "";
    onDisconnectCallback.value = null;
    onAccountsChangedCallback.value = null;
    onChainChangedCallback.value = null;
    options.library === "ethers" && deactivate2();
  }
  async function connect(_walletName, infuraAPI, appName) {
    let _provider = null;
    error.value = "";
    try {
      status.value = "connecting";
      switch (_walletName) {
        case "metamask":
          _provider = await Metamask.connect();
          if (!_provider.isConnected)
            throw new Error("metamask is not connected");
          break;
        case "walletconnect":
          if (!infuraAPI)
            throw new Error("You should provide infuraAPI for connecting WalletConnect");
          _provider = await Walletconnect.connect(infuraAPI);
          if (!_provider.connected)
            throw new Error("walletconnect is not connected");
          break;
        case "walletlink":
          if (!infuraAPI)
            throw new Error("You should provide infuraAPI for connecting WalletLink");
          if (!appName)
            throw new Error("You should provide an app name for connecting WalletLink");
          _provider = await Walletlink.connect(infuraAPI, appName);
          if (!_provider.isConnected)
            throw new Error("walletlink is not connected");
          break;
        default:
          throw new Error("Connect Error: wallet name not found");
      }
    } catch (err) {
      clear();
      error.value = `Failed to connect: ${err.message}`;
      return;
    }
    provider.value = markRaw(_provider);
    walletName.value = _walletName;
    status.value = "connected";
    subscribeDisconnect();
    subscribeAccountsChanged();
    subscribeChainChanged();
    try {
      options.library === "ethers" && await activate2(provider.value);
    } catch (err) {
      clear();
      error.value = `Failed to load data: ${err.message}`;
      return;
    }
  }
  async function disconnect() {
    if (walletName.value === "walletconnect") {
      try {
        await provider.value.disconnect();
      } catch (err) {
        console.error(err.message);
      }
    }
    clear();
    onDisconnectCallback.value && onDisconnectCallback.value("Disconnect from Dapp");
  }
  function subscribeDisconnect() {
    switch (walletName.value) {
      case "metamask":
        provider.value.on("disconnect", (err) => {
          clear();
          onDisconnectCallback.value && onDisconnectCallback.value(err.message);
        });
        break;
      case "walletconnect":
        provider.value.on("disconnect", (code, reason) => {
          clear();
          onDisconnectCallback.value && onDisconnectCallback.value(`${code}: ${reason}`);
        });
        break;
      case "walletlink":
        provider.value.on("disconnect", (err) => {
          clear();
          onDisconnectCallback.value && onDisconnectCallback.value(err.message);
        });
        break;
    }
  }
  function subscribeAccountsChanged() {
    switch (walletName.value) {
      case "metamask":
        provider.value.on("accountsChanged", async (accounts) => {
          try {
            options.library === "ethers" && await activate2(provider.value);
            onAccountsChangedCallback.value && onAccountsChangedCallback.value(accounts);
          } catch (err) {
            error.value = `Failed when changing account: ${err.message}`;
            return;
          }
        });
        break;
      case "walletconnect":
        provider.value.on("accountsChanged", async (accounts) => {
          try {
            options.library === "ethers" && await activate2(provider.value);
            onAccountsChangedCallback.value && onAccountsChangedCallback.value(accounts);
          } catch (err) {
            error.value = `Failed when changing account: ${err.message}`;
            return;
          }
        });
        break;
      case "walletlink":
        provider.value.on("accountsChanged", async (accounts) => {
          try {
            options.library === "ethers" && await activate2(provider.value);
            onAccountsChangedCallback.value && onAccountsChangedCallback.value(accounts);
          } catch (err) {
            error.value = `Failed when changing account: ${err.message}`;
            return;
          }
        });
        break;
    }
  }
  function subscribeChainChanged() {
    switch (walletName.value) {
      case "metamask":
        provider.value.on("chainChanged", async (hexChainId) => {
          if (!provider.value) {
            error.value = `Failed when changing chain: missing provider`;
            return;
          }
          try {
            const chainId = parseInt(hexChainId, 16);
            options.library === "ethers" && await activate2(provider.value);
            onChainChangedCallback.value && onChainChangedCallback.value(chainId);
          } catch (err) {
            error.value = `Failed when changing chain: ${err.message}`;
            return;
          }
        });
        break;
      case "walletconnect":
        provider.value.on("chainChanged", async (chainId) => {
          if (!provider.value) {
            error.value = `Failed when changing chain: missing provider`;
            return;
          }
          try {
            options.library === "ethers" && await activate2(provider.value);
            onChainChangedCallback.value && onChainChangedCallback.value(chainId);
          } catch (err) {
            error.value = `Failed when changing chain: ${err.message}`;
            return;
          }
        });
        break;
      case "walletlink":
        provider.value.on("chainChanged", async (hexChainId) => {
          if (!provider.value) {
            error.value = `Failed when changing chain: missing provider`;
            return;
          }
          try {
            const chainId = parseInt(hexChainId, 16);
            options.library === "ethers" && await activate2(provider.value);
            onChainChangedCallback.value && onChainChangedCallback.value(chainId);
          } catch (err) {
            error.value = `Failed when changing chain: ${err.message}`;
            return;
          }
        });
        break;
    }
  }
  function onDisconnect(callback) {
    onDisconnectCallback.value = callback;
  }
  function onAccountsChanged(callback) {
    onAccountsChangedCallback.value = callback;
  }
  function onChainChanged(callback) {
    onChainChangedCallback.value = callback;
  }
  const isConnected = computed(() => {
    if (status.value === "connected")
      return true;
    else
      return false;
  });
  return {
    provider,
    status,
    walletName,
    error,
    isConnected,
    connect,
    disconnect,
    onDisconnect,
    onAccountsChanged,
    onChainChanged
  };
}
useEthers();
var Modal_vue_vue_type_style_index_0_scoped_true_lang = "";
var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$9 = defineComponent({
  emits: ["close"],
  props: {
    modalOpen: {
      type: Boolean,
      required: true
    }
  },
  setup(props, { emit }) {
    const closeModal = () => {
      emit("close");
    };
    watch(() => props.modalOpen, (value) => {
      if (value) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });
    return {
      closeModal
    };
  }
});
const _hoisted_1$f = {
  key: 0,
  class: "modal"
};
const _hoisted_2$e = { class: "modal-inner" };
const _hoisted_3$c = { class: "modal-content" };
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createBlock(Teleport, { to: "body" }, [
    createVNode(Transition, { name: "modal-animation" }, {
      default: withCtx(() => [
        _ctx.modalOpen ? (openBlock(), createElementBlock("div", _hoisted_1$f, [
          createBaseVNode("div", _hoisted_2$e, [
            createBaseVNode("div", _hoisted_3$c, [
              renderSlot(_ctx.$slots, "default", {}, void 0, true)
            ])
          ])
        ])) : createCommentVNode("", true)
      ]),
      _: 3
    })
  ]);
}
var Modal = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$5], ["__scopeId", "data-v-01b77bff"]]);
const _sfc_main$8 = {};
const _hoisted_1$e = {
  height: "246",
  viewBox: "0 0 400 246",
  width: "400",
  xmlns: "http://www.w3.org/2000/svg"
};
const _hoisted_2$d = /* @__PURE__ */ createBaseVNode("path", {
  d: "m81.9180572 48.3416816c65.2149658-63.8508884 170.9493158-63.8508884 236.1642788 0l7.848727 7.6845565c3.260748 3.1925442 3.260748 8.3686816 0 11.5612272l-26.848927 26.2873374c-1.630375 1.5962734-4.273733 1.5962734-5.904108 0l-10.800779-10.5748639c-45.495589-44.5439756-119.258514-44.5439756-164.754105 0l-11.566741 11.3248068c-1.630376 1.5962721-4.273735 1.5962721-5.904108 0l-26.8489263-26.2873375c-3.2607483-3.1925456-3.2607483-8.3686829 0-11.5612272zm291.6903948 54.3649934 23.895596 23.395862c3.260732 3.19253 3.260751 8.368636.000041 11.561187l-107.746894 105.494845c-3.260726 3.192568-8.547443 3.192604-11.808214.000083-.000013-.000013-.000029-.000029-.000042-.000043l-76.472191-74.872762c-.815187-.798136-2.136867-.798136-2.952053 0-.000006.000005-.00001.00001-.000015.000014l-76.470562 74.872708c-3.260715 3.192576-8.547434 3.19263-11.808215.000116-.000019-.000018-.000039-.000037-.000059-.000058l-107.74989297-105.496247c-3.26074695-3.192544-3.26074695-8.368682 0-11.561226l23.89563947-23.395823c3.260747-3.1925446 8.5474652-3.1925446 11.8082136 0l76.4733029 74.873809c.815188.798136 2.136866.798136 2.952054 0 .000012-.000012.000023-.000023.000035-.000032l76.469471-74.873777c3.260673-3.1926181 8.547392-3.1927378 11.808214-.000267.000046.000045.000091.00009.000135.000135l76.473203 74.873909c.815186.798135 2.136866.798135 2.952053 0l76.471967-74.872433c3.260748-3.1925458 8.547465-3.1925458 11.808213 0z",
  fill: "#3b99fc"
}, null, -1);
const _hoisted_3$b = [
  _hoisted_2$d
];
function _sfc_render$4(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$e, _hoisted_3$b);
}
var WalletConnectIcon = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$4]]);
const _sfc_main$7 = {};
const _hoisted_1$d = {
  height: "355",
  viewBox: "0 0 397 355",
  width: "397",
  xmlns: "http://www.w3.org/2000/svg"
};
const _hoisted_2$c = /* @__PURE__ */ createStaticVNode('<g fill="none" fill-rule="evenodd" transform="translate(-1 -1)"><path d="m114.622644 327.195472 52.004717 13.810198v-18.05949l4.245283-4.249292h29.716982v21.246459 14.872523h-31.839624l-39.268868-16.997169z" fill="#cdbdb2"></path><path d="m199.528305 327.195472 50.943397 13.810198v-18.05949l4.245283-4.249292h29.716981v21.246459 14.872523h-31.839623l-39.268868-16.997169z" fill="#cdbdb2" transform="matrix(-1 0 0 1 483.96227 0)"></path><path d="m170.872644 287.889523-4.245283 35.056657 5.306604-4.249292h55.18868l6.367925 4.249292-4.245284-35.056657-8.490565-5.311615-42.452832 1.062323z" fill="#393939"></path><path d="m142.216984 50.9915022 25.471698 59.4900858 11.674528 173.158643h41.391511l12.735849-173.158643 23.349056-59.4900858z" fill="#f89c35"></path><path d="m30.7783023 181.657226-29.71698153 86.048161 74.29245393-4.249293h47.7594343v-37.181303l-2.122641-76.487253-10.613208 8.498583z" fill="#f89d35"></path><path d="m87.0283032 191.218134 87.0283028 2.124646-9.551886 44.617563-41.391511-10.623229z" fill="#d87c30"></path><path d="m87.0283032 192.280457 36.0849058 33.994334v33.994334z" fill="#ea8d3a"></path><path d="m123.113209 227.337114 42.452831 10.623229 13.79717 45.679888-9.551886 5.311615-46.698115-27.620398z" fill="#f89d35"></path><path d="m123.113209 261.331448-8.490565 65.864024 56.25-39.305949z" fill="#eb8f35"></path><path d="m174.056606 193.34278 5.306604 90.297451-15.919812-46.211049z" fill="#ea8e3a"></path><path d="m74.2924539 262.393771 48.8207551-1.062323-8.490565 65.864024z" fill="#d87c30"></path><path d="m24.4103777 355.878193 90.2122663-28.682721-40.3301901-64.801701-73.23113313 5.311616z" fill="#eb8f35"></path><path d="m167.688682 110.481588-45.636793 38.243627-35.0235858 42.492919 87.0283028 3.186969z" fill="#e8821e"></path><path d="m114.622644 327.195472 56.25-39.305949-4.245283 33.994334v19.121813l-38.207548-7.43626z" fill="#dfcec3"></path><path d="m229.245286 327.195472 55.18868-39.305949-4.245283 33.994334v19.121813l-38.207548-7.43626z" fill="#dfcec3" transform="matrix(-1 0 0 1 513.679252 0)"></path><path d="m132.665096 212.464593-11.674528 24.433427 41.39151-10.623229z" fill="#393939" transform="matrix(-1 0 0 1 283.372646 0)"></path><path d="m23.349057 1.06232296 144.339625 109.41926504-24.410378-59.4900858z" fill="#e88f35"></path><path d="m23.349057 1.06232296-19.10377392 58.42776294 10.61320772 63.7393781-7.42924541 4.249292 10.61320771 9.560906-8.49056617 7.436261 11.67452847 10.623229-7.4292454 6.373938 16.9811323 21.246459 79.5990577-24.433428c38.915096-31.161473 58.018869-47.096318 57.311322-47.804533-.707548-.708215-48.820756-37.1813036-144.339625-109.41926504z" fill="#8e5a30"></path><g transform="matrix(-1 0 0 1 399.056611 0)"><path d="m30.7783023 181.657226-29.71698153 86.048161 74.29245393-4.249293h47.7594343v-37.181303l-2.122641-76.487253-10.613208 8.498583z" fill="#f89d35"></path><path d="m87.0283032 191.218134 87.0283028 2.124646-9.551886 44.617563-41.391511-10.623229z" fill="#d87c30"></path><path d="m87.0283032 192.280457 36.0849058 33.994334v33.994334z" fill="#ea8d3a"></path><path d="m123.113209 227.337114 42.452831 10.623229 13.79717 45.679888-9.551886 5.311615-46.698115-27.620398z" fill="#f89d35"></path><path d="m123.113209 261.331448-8.490565 65.864024 55.18868-38.243626z" fill="#eb8f35"></path><path d="m174.056606 193.34278 5.306604 90.297451-15.919812-46.211049z" fill="#ea8e3a"></path><path d="m74.2924539 262.393771 48.8207551-1.062323-8.490565 65.864024z" fill="#d87c30"></path><path d="m24.4103777 355.878193 90.2122663-28.682721-40.3301901-64.801701-73.23113313 5.311616z" fill="#eb8f35"></path><path d="m167.688682 110.481588-45.636793 38.243627-35.0235858 42.492919 87.0283028 3.186969z" fill="#e8821e"></path><path d="m132.665096 212.464593-11.674528 24.433427 41.39151-10.623229z" fill="#393939" transform="matrix(-1 0 0 1 283.372646 0)"></path><path d="m23.349057 1.06232296 144.339625 109.41926504-24.410378-59.4900858z" fill="#e88f35"></path><path d="m23.349057 1.06232296-19.10377392 58.42776294 10.61320772 63.7393781-7.42924541 4.249292 10.61320771 9.560906-8.49056617 7.436261 11.67452847 10.623229-7.4292454 6.373938 16.9811323 21.246459 79.5990577-24.433428c38.915096-31.161473 58.018869-47.096318 57.311322-47.804533-.707548-.708215-48.820756-37.1813036-144.339625-109.41926504z" fill="#8e5a30"></path></g></g>', 1);
const _hoisted_3$a = [
  _hoisted_2$c
];
function _sfc_render$3(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$d, _hoisted_3$a);
}
var MetaMaskIcon = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$3]]);
const _sfc_main$6 = {};
const _hoisted_1$c = {
  viewBox: "0 0 128 128",
  xmlns: "http://www.w3.org/2000/svg",
  "xmlns:xlink": "http://www.w3.org/1999/xlink"
};
const _hoisted_2$b = /* @__PURE__ */ createStaticVNode('<defs><circle id="a" cx="59.928" cy="59.928" r="59.928"></circle><linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="c"><stop stop-color="#2E66F8" offset="0%"></stop><stop stop-color="#124ADB" offset="100%"></stop></linearGradient></defs><g fill="none" fill-rule="evenodd"><path fill="#FFF" fill-rule="nonzero" d="M0 0h128v128H0z"></path><path fill="#FFF" fill-rule="nonzero" d="M0 0h128v128H0z"></path><path d="M0 0h128v128H0z"></path><path d="M19 64c0 24.853 20.147 45 45 45s45-20.147 45-45-20.147-45-45-45-45 20.147-45 45zm33.5-14.5a3 3 0 0 0-3 3v23a3 3 0 0 0 3 3h23a3 3 0 0 0 3-3v-23a3 3 0 0 0-3-3h-23z" fill="#FFF"></path><g transform="translate(4 4)"><mask id="b" fill="#fff"><use xlink:href="#a"></use></mask><g mask="url(#b)"><path d="M0 0h119.856v119.856H0z"></path><rect fill="url(#c)" fill-rule="nonzero" width="119.856" height="119.856" rx="48"></rect><path d="M24.97 59.928c0 19.307 15.651 34.958 34.958 34.958s34.958-15.651 34.958-34.958S79.235 24.97 59.928 24.97 24.97 40.62 24.97 59.928zm26.024-11.264a2.33 2.33 0 0 0-2.33 2.33v17.868a2.33 2.33 0 0 0 2.33 2.33h17.868a2.33 2.33 0 0 0 2.33-2.33V50.994a2.33 2.33 0 0 0-2.33-2.33H50.994z" fill="#FFF"></path></g></g></g>', 2);
const _hoisted_4$4 = [
  _hoisted_2$b
];
function _sfc_render$2(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$c, _hoisted_4$4);
}
var WalletLinkIcon = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$2]]);
var Board_vue_vue_type_style_index_0_scoped_true_lang = "";
defineComponent({
  components: {
    Modal,
    MetaMaskIcon,
    WalletConnectIcon,
    WalletLinkIcon
  },
  inject: ["infuraId"],
  setup() {
    const { boardOpen: boardOpen2, close } = useBoard();
    const { connect, status: status2 } = useWallet();
    const metamaskDisabled = ref(true);
    const walletconnectDisabled = ref(true);
    const walletlinkDisabled = ref(true);
    const infuraId = inject("infuraId");
    const appName = inject("appName");
    const appUrl = inject("appUrl");
    onMounted(async () => {
      if (await Metamask.check()) {
        metamaskDisabled.value = false;
      }
      if (infuraId && await Walletconnect.check()) {
        walletconnectDisabled.value = false;
      }
      if (infuraId && appName && await Walletlink.check()) {
        walletlinkDisabled.value = false;
      }
    });
    const loadingOpen = ref(false);
    const openLoading = () => {
      loadingOpen.value = true;
    };
    const closeLoading = () => {
      loadingOpen.value = false;
    };
    const connectWallet = async (wallet) => {
      try {
        switch (wallet) {
          case "metamask":
            await connectMetamask();
            break;
          case "walletconnect":
            await connectWalletconnect();
            break;
          case "walletlink":
            await connectWalletlink();
            break;
        }
      } catch (e) {
        console.error(e.message);
      } finally {
        closeLoading();
      }
    };
    const connectMetamask = async () => {
      if (metamaskDisabled.value && appUrl) {
        window.open(`https://metamask.app.link/dapp/${appUrl}`, "_blank");
        return;
      } else if (metamaskDisabled.value)
        return;
      close();
      openLoading();
      await connect("metamask");
    };
    const connectWalletconnect = async () => {
      if (walletconnectDisabled.value)
        return;
      close();
      openLoading();
      await connect("walletconnect", infuraId);
    };
    const connectWalletlink = async () => {
      if (walletlinkDisabled.value)
        return;
      close();
      openLoading();
      await connect("walletlink", infuraId, appName);
    };
    return {
      status: status2,
      boardOpen: boardOpen2,
      metamaskDisabled,
      walletconnectDisabled,
      walletlinkDisabled,
      appUrl,
      close,
      connectWallet,
      loadingOpen,
      openLoading,
      closeLoading
    };
  }
});
const scriptRel = "modulepreload";
const seen = {};
const base = "/wp-content/plugins/threed-garden/public/dist/";
const __vitePreload = function preload(baseModule, deps) {
  if (!deps || deps.length === 0) {
    return baseModule();
  }
  return Promise.all(deps.map((dep) => {
    dep = `${base}${dep}`;
    if (dep in seen)
      return;
    seen[dep] = true;
    const isCss = dep.endsWith(".css");
    const cssSelector = isCss ? '[rel="stylesheet"]' : "";
    if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
      return;
    }
    const link = document.createElement("link");
    link.rel = isCss ? "stylesheet" : scriptRel;
    if (!isCss) {
      link.as = "script";
      link.crossOrigin = "";
    }
    link.href = dep;
    document.head.appendChild(link);
    if (isCss) {
      return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(new Error(`Unable to preload CSS for ${dep}`)));
      });
    }
  })).then(() => baseModule());
};
const useStore = defineStore("store", {
  state: () => ({
    count: 0
  })
});
const useUserStore = defineStore("user", () => {
  const savedName = ref("");
  const previousNames = ref(/* @__PURE__ */ new Set());
  const usedNames = computed(() => Array.from(previousNames.value));
  const otherNames = computed(() => usedNames.value.filter((name) => name !== savedName.value));
  function setNewName(name) {
    if (savedName.value)
      previousNames.value.add(savedName.value);
    savedName.value = name;
  }
  return {
    setNewName,
    otherNames,
    savedName
  };
});
var _imports_0 = "/wp-content/plugins/threed-garden/public/dist/assets/logo-threedgarden.png";
var block0 = {};
const _hoisted_1$b = ["src"];
const _hoisted_2$a = /* @__PURE__ */ createBaseVNode("p", null, [
  /* @__PURE__ */ createBaseVNode("a", {
    rel: "noreferrer",
    href: "https://github.com/companyjuice/threedgarden",
    target: "_blank"
  }, " ThreeD Garden ")
], -1);
const _hoisted_3$9 = { class: "text-sm opacity-75" };
const _hoisted_4$3 = /* @__PURE__ */ createBaseVNode("div", { class: "py-4" }, null, -1);
const _hoisted_5$2 = ["placeholder", "aria-label", "onKeydown"];
const _hoisted_6$2 = {
  class: "hidden",
  for: "input"
};
const _hoisted_7$1 = ["disabled"];
const _hoisted_8$1 = { class: "mt-5 text-center" };
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  setup(__props) {
    const store = useStore();
    const user = useUserStore();
    const name = ref(user.savedName);
    const router2 = useRouter();
    const go = () => {
      if (name.value)
        router2.push(`/hi/${encodeURIComponent(name.value)}`);
    };
    useHead({
      title: "ThreeD Garden | 3D WordPress Plugin"
    });
    const { t } = useI18n();
    return (_ctx, _cache) => {
      const _component_router_link = resolveComponent("router-link");
      return openBlock(), createElementBlock("div", null, [
        createBaseVNode("img", {
          src: unref(_imports_0),
          width: "77",
          class: "mx-auto"
        }, null, 8, _hoisted_1$b),
        _hoisted_2$a,
        createBaseVNode("p", null, [
          createBaseVNode("em", _hoisted_3$9, toDisplayString(unref(t)("intro.desc")), 1)
        ]),
        _hoisted_4$3,
        withDirectives(createBaseVNode("input", {
          id: "input",
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => name.value = $event),
          placeholder: unref(t)("intro.whats-your-name"),
          "aria-label": unref(t)("intro.whats-your-name"),
          type: "text",
          autocomplete: "false",
          p: "x-4 y-2",
          w: "250px",
          text: "center",
          bg: "transparent",
          border: "~ rounded gray-200 dark:gray-700",
          outline: "none active:none",
          onKeydown: withKeys(go, ["enter"])
        }, null, 40, _hoisted_5$2), [
          [vModelText, name.value]
        ]),
        createBaseVNode("label", _hoisted_6$2, toDisplayString(unref(t)("intro.whats-your-name")), 1),
        createBaseVNode("div", null, [
          createBaseVNode("button", {
            class: "m-3 text-sm btn",
            disabled: !name.value,
            onClick: go
          }, toDisplayString(unref(t)("button.go")), 9, _hoisted_7$1)
        ]),
        createBaseVNode("div", _hoisted_8$1, [
          createBaseVNode("button", {
            onClick: _cache[1] || (_cache[1] = ($event) => unref(store).$state.count++),
            class: "px-4 py-2 dark:bg-blue-800 bg-blue-500 text-white rounded"
          }, " Count : " + toDisplayString(unref(store).$state.count), 1)
        ]),
        createVNode(_component_router_link, {
          to: { name: "other-page" },
          class: "mt-5 text-center hover:text-gray-200 dark:hover:text-gray-500 hover:underline"
        }, {
          default: withCtx(() => [
            createTextVNode(toDisplayString(unref(t)("pages.other.menu")), 1)
          ]),
          _: 1
        })
      ]);
    };
  }
});
if (typeof block0 === "function")
  block0(_sfc_main$5);
const routes$1 = [{ "name": "about", "path": "/about", "component": () => __vitePreload(() => import("./about.js"), true ? ["assets/about.js","assets/vendor.js"] : void 0), "props": true }, { "name": "index", "path": "/", "component": _sfc_main$5, "props": true, "meta": { "layout": "home" } }, { "name": "other-page", "path": "/other-page", "component": () => __vitePreload(() => import("./other-page.js"), true ? ["assets/other-page.js","assets/vendor.js"] : void 0), "props": true, "meta": { "layout": "home", "name": "other-page" } }, { "name": "participate", "path": "/participate", "component": () => __vitePreload(() => import("./participate.js"), true ? ["assets/participate.js","assets/vendor.js"] : void 0), "props": true }, { "name": "README", "path": "/readme", "component": () => __vitePreload(() => import("./README.js"), true ? ["assets/README.js","assets/vendor.js"] : void 0), "props": true }, { "name": "all", "path": "/:all(.*)*", "component": () => __vitePreload(() => import("./_...all_.js"), true ? ["assets/_...all_.js","assets/vendor.js"] : void 0), "props": true, "meta": { "layout": 404 } }, { "name": "hi-name", "path": "/hi/:name", "component": () => __vitePreload(() => import("./_name_.js"), true ? ["assets/_name_.js","assets/vendor.js"] : void 0), "props": true }];
const _hoisted_1$a = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$9 = /* @__PURE__ */ createBaseVNode("path", {
  fill: "currentColor",
  "fill-rule": "evenodd",
  d: "M16 2a14 14 0 0 0-4.43 27.28c.7.13 1-.3 1-.67v-2.38c-3.89.84-4.71-1.88-4.71-1.88a3.71 3.71 0 0 0-1.62-2.05c-1.27-.86.1-.85.1-.85a2.94 2.94 0 0 1 2.14 1.45a3 3 0 0 0 4.08 1.16a2.93 2.93 0 0 1 .88-1.87c-3.1-.36-6.37-1.56-6.37-6.92a5.4 5.4 0 0 1 1.44-3.76a5 5 0 0 1 .14-3.7s1.17-.38 3.85 1.43a13.3 13.3 0 0 1 7 0c2.67-1.81 3.84-1.43 3.84-1.43a5 5 0 0 1 .14 3.7a5.4 5.4 0 0 1 1.44 3.76c0 5.38-3.27 6.56-6.39 6.91a3.33 3.33 0 0 1 .95 2.59v3.84c0 .46.25.81 1 .67A14 14 0 0 0 16 2Z"
}, null, -1);
const _hoisted_3$8 = [
  _hoisted_2$9
];
function render$5(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$a, _hoisted_3$8);
}
var __unplugin_components_5 = { name: "carbon-logo-github", render: render$5 };
const _hoisted_1$9 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$8 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M28 6v20H4V6h24m0-2H4a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z",
  fill: "currentColor"
}, null, -1);
const _hoisted_3$7 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M6 8h10v2H6z",
  fill: "currentColor"
}, null, -1);
const _hoisted_4$2 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M6 12h10v2H6z",
  fill: "currentColor"
}, null, -1);
const _hoisted_5$1 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M6 16h6v2H6z",
  fill: "currentColor"
}, null, -1);
const _hoisted_6$1 = [
  _hoisted_2$8,
  _hoisted_3$7,
  _hoisted_4$2,
  _hoisted_5$1
];
function render$4(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$9, _hoisted_6$1);
}
var __unplugin_components_0$1 = { name: "carbon-dicom-overlay", render: render$4 };
const _hoisted_1$8 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$7 = /* @__PURE__ */ createBaseVNode("path", {
  fill: "currentColor",
  d: "M18 19h6v2h-6zm0-4h12v2H18zm0-4h12v2H18zm-4 10v-2H9v-2H7v2H2v2h8.215a8.591 8.591 0 0 1-2.216 3.977A9.273 9.273 0 0 1 6.552 23H4.333a10.855 10.855 0 0 0 2.145 3.297A14.658 14.658 0 0 1 3 28.127L3.702 30a16.42 16.42 0 0 0 4.29-2.336A16.488 16.488 0 0 0 12.299 30L13 28.127A14.664 14.664 0 0 1 9.523 26.3a10.313 10.313 0 0 0 2.729-5.3zm-2.833-8h2.166L8.75 2H6.583L2 13h2.166L5 11h5.333zM5.833 9l1.833-4.4L9.5 9z"
}, null, -1);
const _hoisted_3$6 = [
  _hoisted_2$7
];
function render$3(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$8, _hoisted_3$6);
}
var __unplugin_components_3 = { name: "carbon-language", render: render$3 };
const _hoisted_1$7 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$6 = /* @__PURE__ */ createBaseVNode("path", {
  fill: "currentColor",
  d: "M16 12.005a4 4 0 1 1-4 4a4.005 4.005 0 0 1 4-4m0-2a6 6 0 1 0 6 6a6 6 0 0 0-6-6ZM5.394 6.813L6.81 5.399l3.505 3.506L8.9 10.319zM2 15.005h5v2H2zm3.394 10.193L8.9 21.692l1.414 1.414l-3.505 3.506zM15 25.005h2v5h-2zm6.687-1.9l1.414-1.414l3.506 3.506l-1.414 1.414zm3.313-8.1h5v2h-5zm-3.313-6.101l3.506-3.506l1.414 1.414l-3.506 3.506zM15 2.005h2v5h-2z"
}, null, -1);
const _hoisted_3$5 = [
  _hoisted_2$6
];
function render$2(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$7, _hoisted_3$5);
}
var __unplugin_components_2 = { name: "carbon-sun", render: render$2 };
const _hoisted_1$6 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$5 = /* @__PURE__ */ createBaseVNode("path", {
  fill: "currentColor",
  d: "M13.502 5.414a15.075 15.075 0 0 0 11.594 18.194a11.113 11.113 0 0 1-7.975 3.39c-.138 0-.278.005-.418 0a11.094 11.094 0 0 1-3.2-21.584M14.98 3a1.002 1.002 0 0 0-.175.016a13.096 13.096 0 0 0 1.825 25.981c.164.006.328 0 .49 0a13.072 13.072 0 0 0 10.703-5.555a1.01 1.01 0 0 0-.783-1.565A13.08 13.08 0 0 1 15.89 4.38A1.015 1.015 0 0 0 14.98 3Z"
}, null, -1);
const _hoisted_3$4 = [
  _hoisted_2$5
];
function render$1(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$6, _hoisted_3$4);
}
var __unplugin_components_1 = { name: "carbon-moon", render: render$1 };
const _hoisted_1$5 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$4 = /* @__PURE__ */ createBaseVNode("path", {
  fill: "currentColor",
  d: "M26 28a4 4 0 1 1 4-4a4.005 4.005 0 0 1-4 4zm0-6a2 2 0 1 0 2 2a2.002 2.002 0 0 0-2-2zM24 8h-6v2h6a1 1 0 0 1 0 2h-3a1 1 0 0 0-.98 1.196l.924 4.621L18.434 22h-2.69l-2.572-8.575A1.988 1.988 0 0 0 11.256 12H6v2h5.256l.6 2H7a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h1a4 4 0 0 0 8 0h7a1 1 0 0 0 .857-.485l3-5a1 1 0 0 0 .123-.711L22.22 14H24a3 3 0 0 0 0-6zM8 26a2.002 2.002 0 0 1-2-2h4a2.002 2.002 0 0 1-2 2zm-4-4v-1a3.003 3.003 0 0 1 3-3h5.456l1.2 4z"
}, null, -1);
const _hoisted_3$3 = [
  _hoisted_2$4
];
function render(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$5, _hoisted_3$3);
}
var __unplugin_components_0 = { name: "carbon-scooter", render };
const _hoisted_1$4 = { class: "text-xl mt-6" };
const _hoisted_2$3 = ["title"];
const _hoisted_3$2 = ["title"];
const _hoisted_4$1 = {
  class: "icon-btn mx-2",
  rel: "noreferrer",
  href: "https://github.com/companyjuice/threedgarden",
  target: "_blank",
  title: "GitHub: Company Juice -- ThreeD Garden"
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  setup(__props) {
    const { t, availableLocales, locale } = useI18n();
    const toggleLocales = () => {
      const locales = availableLocales;
      locale.value = locales[(locales.indexOf(locale.value) + 1) % locales.length];
    };
    return (_ctx, _cache) => {
      const _component_carbon_scooter = __unplugin_components_0;
      const _component_router_link = resolveComponent("router-link");
      const _component_carbon_moon = __unplugin_components_1;
      const _component_carbon_sun = __unplugin_components_2;
      const _component_carbon_language = __unplugin_components_3;
      const _component_carbon_dicom_overlay = __unplugin_components_0$1;
      const _component_carbon_logo_github = __unplugin_components_5;
      return openBlock(), createElementBlock("nav", _hoisted_1$4, [
        createVNode(_component_router_link, {
          class: "icon-btn mx-2",
          to: "/",
          title: unref(t)("button.home")
        }, {
          default: withCtx(() => [
            createVNode(_component_carbon_scooter)
          ]),
          _: 1
        }, 8, ["title"]),
        createBaseVNode("button", {
          class: "icon-btn mx-2 !outline-none",
          title: unref(t)("button.toggle_dark"),
          onClick: _cache[0] || (_cache[0] = ($event) => unref(toggleDark)())
        }, [
          unref(isDark) ? (openBlock(), createBlock(_component_carbon_moon, { key: 0 })) : (openBlock(), createBlock(_component_carbon_sun, { key: 1 }))
        ], 8, _hoisted_2$3),
        createBaseVNode("a", {
          class: "icon-btn mx-2",
          title: unref(t)("button.toggle_langs"),
          onClick: toggleLocales
        }, [
          createVNode(_component_carbon_language)
        ], 8, _hoisted_3$2),
        createVNode(_component_router_link, {
          class: "icon-btn mx-2",
          to: "/about",
          title: unref(t)("button.about")
        }, {
          default: withCtx(() => [
            createVNode(_component_carbon_dicom_overlay)
          ]),
          _: 1
        }, 8, ["title"]),
        createBaseVNode("a", _hoisted_4$1, [
          createVNode(_component_carbon_logo_github)
        ])
      ]);
    };
  }
});
const _sfc_main$3 = {};
const _hoisted_1$3 = { class: "text-center text-gray-700 dark:text-gray-200" };
const _hoisted_2$2 = /* @__PURE__ */ createBaseVNode("div", { class: "mt-5 mx-auto text-center opacity-25 text-sm" }, " [Default Layout] ", -1);
function _sfc_render$1(_ctx, _cache) {
  const _component_router_view = resolveComponent("router-view");
  const _component_Footer = _sfc_main$4;
  return openBlock(), createElementBlock("main", _hoisted_1$3, [
    createVNode(_component_router_view),
    createVNode(_component_Footer),
    _hoisted_2$2
  ]);
}
var __layout_0 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$1]]);
const layouts = {
  "404": () => __vitePreload(() => import("./404.js"), true ? ["assets/404.js","assets/vendor.js"] : void 0),
  "default": __layout_0,
  "home": () => __vitePreload(() => import("./home.js"), true ? ["assets/home.js","assets/vendor.js"] : void 0)
};
function setupLayouts(routes2) {
  return routes2.map((route) => {
    var _a;
    return {
      path: route.path,
      component: layouts[((_a = route.meta) == null ? void 0 : _a.layout) || "default"],
      children: [__spreadProps(__spreadValues({}, route), { path: "" })]
    };
  });
}
var erc20Abi = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "spender",
        type: "address"
      },
      {
        name: "value",
        type: "uint256"
      }
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "from",
        type: "address"
      },
      {
        name: "to",
        type: "address"
      },
      {
        name: "value",
        type: "uint256"
      }
    ],
    name: "transferFrom",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "to",
        type: "address"
      },
      {
        name: "value",
        type: "uint256"
      }
    ],
    name: "transfer",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address"
      },
      {
        name: "spender",
        type: "address"
      }
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    payable: true,
    stateMutability: "payable",
    type: "fallback"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        name: "spender",
        type: "address"
      },
      {
        indexed: false,
        name: "value",
        type: "uint256"
      }
    ],
    name: "Approval",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address"
      },
      {
        indexed: true,
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        name: "value",
        type: "uint256"
      }
    ],
    name: "Transfer",
    type: "event"
  }
];
var ownableAbi = [
  {
    inputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    constant: true,
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "isOwner",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "transferOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  }
];
const abis = {
  erc20: erc20Abi,
  ownable: ownableAbi
};
const addresses = {
  ceaErc20: "0xc1C0472c0C80bCcDC7F5D01A376Bd97a734B8815"
};
const GET_TRANSFERS = gql`
  {
    transfers(first: 10) {
      id
      from
      to
      value
    }
  }
`;
var HelloWorld_vue_vue_type_style_index_0_scoped_true_lang = "";
const _sfc_main$2 = {
  methods: {
    readOnchainData: async function() {
      const defaultProvider = getDefaultProvider();
      const ceaErc20 = new Contract(addresses.ceaErc20, abis.erc20, defaultProvider);
      const tokenBalance = await ceaErc20.balanceOf("0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C");
      console.log({ tokenBalance: tokenBalance.toString() });
    }
  },
  name: "HelloWorld",
  props: {
    msg: String
  },
  async mounted() {
    try {
      const { data, loading, stale } = await this.$apollo.query({
        query: GET_TRANSFERS
      });
      if (!loading && !stale && data && data.transfers) {
        console.log({ transfers: data.transfers });
      }
    } catch (error2) {
      console.error("Error while pulling data from the subgraph:", error2);
    }
  }
};
const _withScopeId$1 = (n) => (pushScopeId("data-v-351409ac"), n = n(), popScopeId(), n);
const _hoisted_1$2 = { class: "hello" };
const _hoisted_2$1 = /* @__PURE__ */ _withScopeId$1(() => /* @__PURE__ */ createBaseVNode("p", null, [
  /* @__PURE__ */ createTextVNode(" For a guide and recipes on how to configure / customize the Vue part of "),
  /* @__PURE__ */ createBaseVNode("br"),
  /* @__PURE__ */ createTextVNode("this project, check out the "),
  /* @__PURE__ */ createBaseVNode("a", {
    href: "https://cli.vuejs.org",
    target: "_blank",
    rel: "noopener"
  }, "vue-cli documentation"),
  /* @__PURE__ */ createTextVNode(". ")
], -1));
const _hoisted_3$1 = /* @__PURE__ */ createStaticVNode('<h3 data-v-351409ac>Learn Ethereum</h3><ul data-v-351409ac><li data-v-351409ac><a href="https://ethereum.org/developers/#getting-started" target="_blank" rel="noopener" data-v-351409ac>Getting Started</a></li><li data-v-351409ac><a href="https://ethereum.org/wallets/" target="_blank" rel="noopener" data-v-351409ac>Wallets</a></li><li data-v-351409ac><a href="https://ethereum.stackexchange.com/" target="_blank" rel="noopener" data-v-351409ac>StackExchange</a></li><li data-v-351409ac><a href="https://reddit.com/r/ethdev/" target="_blank" rel="noopener" data-v-351409ac>Reddit</a></li></ul><h3 data-v-351409ac>Learn Vue</h3><ul data-v-351409ac><li data-v-351409ac><a href="https://vuejs.org" target="_blank" rel="noopener" data-v-351409ac>Core Docs</a></li><li data-v-351409ac><a href="https://forum.vuejs.org" target="_blank" rel="noopener" data-v-351409ac>Forum</a></li><li data-v-351409ac><a href="https://chat.vuejs.org" target="_blank" rel="noopener" data-v-351409ac>Community Chat</a></li><li data-v-351409ac><a href="https://twitter.com/vuejs" target="_blank" rel="noopener" data-v-351409ac>Twitter</a></li><li data-v-351409ac><a href="https://news.vuejs.org" target="_blank" rel="noopener" data-v-351409ac>News</a></li></ul><h3 data-v-351409ac>Learn The Graph</h3><ul data-v-351409ac><li data-v-351409ac><a href="https://thegraph.com/docs/quick-start" target="_blank" rel="noopener" data-v-351409ac>Core Docs</a></li><li data-v-351409ac><a href="https://discord.gg/vtvv7FP" target="_blank" rel="noopener" data-v-351409ac>Community Chat</a></li><li data-v-351409ac><a href="https://twitter.com/graphprotocol" target="_blank" rel="noopener" data-v-351409ac>Twitter</a></li></ul>', 6);
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$2, [
    createBaseVNode("h1", null, toDisplayString($props.msg), 1),
    _hoisted_2$1,
    createBaseVNode("button", {
      id: "readOnchainData",
      style: { "display": "none" },
      onClick: _cache[0] || (_cache[0] = (...args) => $options.readOnchainData && $options.readOnchainData(...args))
    }, "Read On-Chain Balance"),
    _hoisted_3$1
  ]);
}
var HelloWorld = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render], ["__scopeId", "data-v-351409ac"]]);
var LayoutHeader_vue_vue_type_style_index_0_scoped_true_lang = "";
const _withScopeId = (n) => (pushScopeId("data-v-7c948b0a"), n = n(), popScopeId(), n);
const _hoisted_1$1 = { class: "w-full px-4" };
const _hoisted_2 = { class: "flex justify-between p-4 px-3" };
const _hoisted_3 = {
  id: "nav",
  class: "w-full"
};
const _hoisted_4 = { class: "flex items-center justify-between" };
const _hoisted_5 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("div", { class: "flex space-x-4 items-center" }, [
  /* @__PURE__ */ createBaseVNode("img", {
    class: "h-10 min-w-10",
    src: _imports_0,
    alt: "logo"
  }),
  /* @__PURE__ */ createBaseVNode("p", { class: "hover:text-gray-900" }, "ThreeD Garden")
], -1));
const _hoisted_6 = { class: "flex items-center space-x-10" };
const _hoisted_7 = /* @__PURE__ */ createTextVNode("Home");
const _hoisted_8 = /* @__PURE__ */ createTextVNode("About");
const _hoisted_9 = /* @__PURE__ */ createTextVNode("Participate");
const _hoisted_10 = {
  key: 0,
  class: "flex items-center"
};
const _hoisted_11 = { class: "sm:flex py-1 px-2 flex items-center rounded-3xl border border-solid" };
const _hoisted_12 = { class: "px-1 mr-1" };
const _hoisted_13 = { class: "py-2 px-3 rounded-2xl inline-block bg-gray-100" };
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  setup(__props) {
    window.global = window;
    console.log("vue-dapp window.global");
    window.process = process;
    window.Buffer = buffer.Buffer;
    window.util = util;
    const { open } = useBoard$1();
    const { address: address2, balance: balance2, isActivated: isActivated2 } = useEthers$1();
    return (_ctx, _cache) => {
      const _component_router_link = resolveComponent("router-link");
      return openBlock(), createElementBlock("header", _hoisted_1$1, [
        createBaseVNode("div", _hoisted_2, [
          createBaseVNode("nav", _hoisted_3, [
            createBaseVNode("div", _hoisted_4, [
              createVNode(_component_router_link, {
                to: "/",
                "active-class": "text-gray-900",
                class: "text-xl text-gray-600"
              }, {
                default: withCtx(() => [
                  _hoisted_5
                ]),
                _: 1
              }),
              createBaseVNode("div", _hoisted_6, [
                createVNode(_component_router_link, { to: { name: "index", params: { userId: 123 } } }, {
                  default: withCtx(() => [
                    _hoisted_7
                  ]),
                  _: 1
                }),
                createVNode(_component_router_link, { to: { name: "about", params: { userId: 123 } } }, {
                  default: withCtx(() => [
                    _hoisted_8
                  ]),
                  _: 1
                }),
                createVNode(_component_router_link, { to: { name: "participate", params: { userId: 123 } } }, {
                  default: withCtx(() => [
                    _hoisted_9
                  ]),
                  _: 1
                }),
                unref(isActivated2) ? (openBlock(), createElementBlock("div", _hoisted_10, [
                  createBaseVNode("div", _hoisted_11, [
                    createBaseVNode("div", _hoisted_12, toDisplayString(unref(displayEther)(unref(balance2), 10)) + " ETH", 1),
                    createBaseVNode("div", _hoisted_13, toDisplayString(unref(shortenAddress)(unref(address2))), 1)
                  ])
                ])) : (openBlock(), createElementBlock("button", {
                  key: 1,
                  onClick: _cache[0] || (_cache[0] = (...args) => unref(open) && unref(open)(...args)),
                  class: "btn"
                }, "Connect Wallet"))
              ])
            ])
          ])
        ])
      ]);
    };
  }
});
var LayoutHeader = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-7c948b0a"]]);
const _hoisted_1 = { id: "APP" };
const __default__ = {
  name: "EthereumApp",
  components: {
    HelloWorld
  }
};
const _sfc_main = /* @__PURE__ */ defineComponent(__spreadProps(__spreadValues({}, __default__), {
  setup(__props) {
    console.log("*** HEY HEY HEY -- App.vue 1 (typescript setup)");
    return (_ctx, _cache) => {
      const _component_router_view = resolveComponent("router-view");
      const _component_vdapp_board = resolveComponent("vdapp-board");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(HelloWorld, { msg: "Welcome to Your Ethereum App" }),
        createVNode(LayoutHeader),
        createVNode(_component_router_view),
        createVNode(_component_vdapp_board)
      ]);
    };
  }
}));
var windiBase = "";
var windiComponents = "";
var main = "";
var windiUtilities = "";
const app = createApp(_sfc_main);
const routes = setupLayouts(routes$1);
const router = createRouter({ history: createWebHashHistory(), routes });
app.use(router);
Object.values({ "./modules/head.ts": __glob_16_0, "./modules/i18n.ts": __glob_16_1, "./modules/nprogress.ts": __glob_16_2, "./modules/pinia.ts": __glob_16_3 }).map((i) => {
  var _a;
  return (_a = i.install) == null ? void 0 : _a.call(i, { app, router, routes });
});
app.config.globalProperties.window = window;
app.use(VueDapp, {
  infuraId: "432d743bb1d944268c6e3725f243a7e0",
  appName: "ThreeDGarden"
});
console.log("vue dapp (app.use)", app);
app.mount("#app");
console.log("vue app (mounted)", app);
export { __unplugin_components_0$1 as _, _export_sfc as a, _sfc_main$4 as b, useUserStore as u };
