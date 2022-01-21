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
import { c as createHead, a as createI18n, N as NProgress, b as createPinia, d as defineStore, r as ref, e as computed, f as defineComponent, u as useRouter, g as useHead, h as useI18n, i as createElementBlock, j as createBaseVNode, k as unref, t as toDisplayString, w as withDirectives, v as vModelText, l as withKeys, m as createVNode, n as withCtx, o as resolveComponent, p as openBlock, q as createTextVNode, s as createStaticVNode, x as useDark, y as useToggle, z as createBlock, A as process, B as buffer, C as util, D as useEthers, E as shortenAddress, F as displayEther, G as pushScopeId, H as popScopeId, I as useBoard, W as WalletConnectProvider, J as lib, K as Web3Provider, L as createApp, M as createRouter, O as createWebHashHistory, V as VueDapp } from "./vendor.js";
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
var __glob_11_0 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  install: install$3
});
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
var __glob_1_0 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": de
});
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
var __glob_1_1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": en
});
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
var __glob_1_2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": es
});
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
var __glob_1_3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": fr
});
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
var __glob_1_4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": it
});
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
var __glob_1_5 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": ja
});
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
var __glob_1_6 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": ko
});
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
var __glob_1_7 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": pl
});
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
var __glob_1_8 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": ptBR
});
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
var __glob_1_9 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": ru
});
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
var __glob_1_10 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": tr
});
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
var __glob_1_11 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": vi
});
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
var __glob_1_12 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": zhCN
});
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
var __glob_11_1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  install: install$2
});
const install$1 = ({ router: router2 }) => {
  router2.beforeEach(() => {
    NProgress.start();
  });
  router2.afterEach(() => {
    NProgress.done();
  });
};
var __glob_11_2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  install: install$1
});
const install = ({ app: app2 }) => {
  const pinia = createPinia();
  app2.use(pinia);
};
var __glob_11_3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  install
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
        link.addEventListener("error", rej);
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
  const previousNames = ref(new Set());
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
const _hoisted_1$a = ["src"];
const _hoisted_2$9 = /* @__PURE__ */ createBaseVNode("p", null, [
  /* @__PURE__ */ createBaseVNode("a", {
    rel: "noreferrer",
    href: "https://github.com/companyjuice/threedgarden",
    target: "_blank"
  }, " ThreeD Garden ")
], -1);
const _hoisted_3$6 = { class: "text-sm opacity-75" };
const _hoisted_4$4 = /* @__PURE__ */ createBaseVNode("div", { class: "py-4" }, null, -1);
const _hoisted_5$2 = ["placeholder", "aria-label", "onKeydown"];
const _hoisted_6$2 = {
  class: "hidden",
  for: "input"
};
const _hoisted_7$2 = ["disabled"];
const _hoisted_8$1 = { class: "mt-5 text-center" };
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
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
        }, null, 8, _hoisted_1$a),
        _hoisted_2$9,
        createBaseVNode("p", null, [
          createBaseVNode("em", _hoisted_3$6, toDisplayString(unref(t)("intro.desc")), 1)
        ]),
        _hoisted_4$4,
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
          }, toDisplayString(unref(t)("button.go")), 9, _hoisted_7$2)
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
  block0(_sfc_main$4);
const routes$1 = [{ "name": "about", "path": "/about", "component": () => __vitePreload(() => import("./about.js"), true ? ["assets/about.js","assets/vendor.js"] : void 0), "props": true }, { "name": "index", "path": "/", "component": _sfc_main$4, "props": true, "meta": { "layout": "home" } }, { "name": "other-page", "path": "/other-page", "component": () => __vitePreload(() => import("./other-page.js"), true ? ["assets/other-page.js","assets/vendor.js"] : void 0), "props": true, "meta": { "layout": "home", "name": "other-page" } }, { "name": "participate", "path": "/participate", "component": () => __vitePreload(() => import("./participate.js"), true ? ["assets/participate.js","assets/vendor.js"] : void 0), "props": true }, { "name": "README", "path": "/readme", "component": () => __vitePreload(() => import("./README.js"), true ? ["assets/README.js","assets/vendor.js"] : void 0), "props": true }, { "name": "all", "path": "/:all(.*)*", "component": () => __vitePreload(() => import("./_...all_.js"), true ? ["assets/_...all_.js","assets/vendor.js"] : void 0), "props": true, "meta": { "layout": 404 } }, { "name": "hi-name", "path": "/hi/:name", "component": () => __vitePreload(() => import("./_name_.js"), true ? ["assets/_name_.js","assets/vendor.js"] : void 0), "props": true }];
const _hoisted_1$9 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$8 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M16 2a14 14 0 0 0-4.43 27.28c.7.13 1-.3 1-.67v-2.38c-3.89.84-4.71-1.88-4.71-1.88a3.71 3.71 0 0 0-1.62-2.05c-1.27-.86.1-.85.1-.85a2.94 2.94 0 0 1 2.14 1.45a3 3 0 0 0 4.08 1.16a2.93 2.93 0 0 1 .88-1.87c-3.1-.36-6.37-1.56-6.37-6.92a5.4 5.4 0 0 1 1.44-3.76a5 5 0 0 1 .14-3.7s1.17-.38 3.85 1.43a13.3 13.3 0 0 1 7 0c2.67-1.81 3.84-1.43 3.84-1.43a5 5 0 0 1 .14 3.7a5.4 5.4 0 0 1 1.44 3.76c0 5.38-3.27 6.56-6.39 6.91a3.33 3.33 0 0 1 .95 2.59v3.84c0 .46.25.81 1 .67A14 14 0 0 0 16 2z",
  "fill-rule": "evenodd",
  fill: "currentColor"
}, null, -1);
const _hoisted_3$5 = [
  _hoisted_2$8
];
function render$5(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$9, _hoisted_3$5);
}
var __unplugin_components_5 = { name: "carbon-logo-github", render: render$5 };
const _hoisted_1$8 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$7 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M28 6v20H4V6h24m0-2H4a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z",
  fill: "currentColor"
}, null, -1);
const _hoisted_3$4 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M6 8h10v2H6z",
  fill: "currentColor"
}, null, -1);
const _hoisted_4$3 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M6 12h10v2H6z",
  fill: "currentColor"
}, null, -1);
const _hoisted_5$1 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M6 16h6v2H6z",
  fill: "currentColor"
}, null, -1);
const _hoisted_6$1 = [
  _hoisted_2$7,
  _hoisted_3$4,
  _hoisted_4$3,
  _hoisted_5$1
];
function render$4(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$8, _hoisted_6$1);
}
var __unplugin_components_0$1 = { name: "carbon-dicom-overlay", render: render$4 };
const _hoisted_1$7 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$6 = /* @__PURE__ */ createStaticVNode('<path d="M18 19h6v2h-6z" fill="currentColor"></path><path d="M18 15h12v2H18z" fill="currentColor"></path><path d="M18 11h12v2H18z" fill="currentColor"></path><path d="M14 21v-2H9v-2H7v2H2v2h8.215a8.591 8.591 0 0 1-2.216 3.977A9.273 9.273 0 0 1 6.552 23H4.333a10.855 10.855 0 0 0 2.145 3.297A14.658 14.658 0 0 1 3 28.127L3.702 30a16.42 16.42 0 0 0 4.29-2.336A16.488 16.488 0 0 0 12.299 30L13 28.127A14.664 14.664 0 0 1 9.523 26.3a10.313 10.313 0 0 0 2.729-5.3z" fill="currentColor"></path><path d="M11.167 13h2.166L8.75 2H6.583L2 13h2.166L5 11h5.333zM5.833 9l1.833-4.4L9.5 9z" fill="currentColor"></path>', 5);
const _hoisted_7$1 = [
  _hoisted_2$6
];
function render$3(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$7, _hoisted_7$1);
}
var __unplugin_components_3 = { name: "carbon-language", render: render$3 };
const _hoisted_1$6 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$5 = /* @__PURE__ */ createStaticVNode('<path d="M16 12.005a4 4 0 1 1-4 4a4.005 4.005 0 0 1 4-4m0-2a6 6 0 1 0 6 6a6 6 0 0 0-6-6z" fill="currentColor"></path><path d="M5.394 6.813l1.414-1.415l3.506 3.506L8.9 10.318z" fill="currentColor"></path><path d="M2 15.005h5v2H2z" fill="currentColor"></path><path d="M5.394 25.197L8.9 21.691l1.414 1.415l-3.506 3.505z" fill="currentColor"></path><path d="M15 25.005h2v5h-2z" fill="currentColor"></path><path d="M21.687 23.106l1.414-1.415l3.506 3.506l-1.414 1.414z" fill="currentColor"></path><path d="M25 15.005h5v2h-5z" fill="currentColor"></path><path d="M21.687 8.904l3.506-3.506l1.414 1.415l-3.506 3.505z" fill="currentColor"></path><path d="M15 2.005h2v5h-2z" fill="currentColor"></path>', 9);
const _hoisted_11$1 = [
  _hoisted_2$5
];
function render$2(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$6, _hoisted_11$1);
}
var __unplugin_components_2 = { name: "carbon-sun", render: render$2 };
const _hoisted_1$5 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$4 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M13.502 5.414a15.075 15.075 0 0 0 11.594 18.194a11.113 11.113 0 0 1-7.975 3.39c-.138 0-.278.005-.418 0a11.094 11.094 0 0 1-3.2-21.584M14.98 3a1.002 1.002 0 0 0-.175.016a13.096 13.096 0 0 0 1.825 25.981c.164.006.328 0 .49 0a13.072 13.072 0 0 0 10.703-5.555a1.01 1.01 0 0 0-.783-1.565A13.08 13.08 0 0 1 15.89 4.38A1.015 1.015 0 0 0 14.98 3z",
  fill: "currentColor"
}, null, -1);
const _hoisted_3$3 = [
  _hoisted_2$4
];
function render$1(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$5, _hoisted_3$3);
}
var __unplugin_components_1 = { name: "carbon-moon", render: render$1 };
const _hoisted_1$4 = {
  width: "1.2em",
  height: "1.2em",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 32 32"
};
const _hoisted_2$3 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M26 28a4 4 0 1 1 4-4a4.005 4.005 0 0 1-4 4zm0-6a2 2 0 1 0 2 2a2.002 2.002 0 0 0-2-2z",
  fill: "currentColor"
}, null, -1);
const _hoisted_3$2 = /* @__PURE__ */ createBaseVNode("path", {
  d: "M24 8h-6v2h6a1 1 0 0 1 0 2h-3a1 1 0 0 0-.98 1.196l.924 4.621L18.434 22h-2.69l-2.572-8.575A1.988 1.988 0 0 0 11.256 12H6v2h5.256l.6 2H7a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h1a4 4 0 0 0 8 0h7a1 1 0 0 0 .857-.485l3-5a1 1 0 0 0 .123-.711L22.22 14H24a3 3 0 0 0 0-6zM8 26a2.002 2.002 0 0 1-2-2h4a2.002 2.002 0 0 1-2 2zm-4-4v-1a3.003 3.003 0 0 1 3-3h5.456l1.2 4z",
  fill: "currentColor"
}, null, -1);
const _hoisted_4$2 = [
  _hoisted_2$3,
  _hoisted_3$2
];
function render(_ctx, _cache) {
  return openBlock(), createElementBlock("svg", _hoisted_1$4, _hoisted_4$2);
}
var __unplugin_components_0 = { name: "carbon-scooter", render };
const isDark = useDark();
const toggleDark = useToggle(isDark);
const _hoisted_1$3 = { class: "text-xl mt-6" };
const _hoisted_2$2 = ["title"];
const _hoisted_3$1 = ["title"];
const _hoisted_4$1 = {
  class: "icon-btn mx-2",
  rel: "noreferrer",
  href: "https://github.com/companyjuice/threedgarden",
  target: "_blank",
  title: "GitHub: Company Juice -- ThreeD Garden"
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
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
      return openBlock(), createElementBlock("nav", _hoisted_1$3, [
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
        ], 8, _hoisted_2$2),
        createBaseVNode("a", {
          class: "icon-btn mx-2",
          title: unref(t)("button.toggle_langs"),
          onClick: toggleLocales
        }, [
          createVNode(_component_carbon_language)
        ], 8, _hoisted_3$1),
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
var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$2 = {};
const _hoisted_1$2 = { class: "px-4 py-10 text-center text-gray-700 dark:text-gray-200" };
const _hoisted_2$1 = /* @__PURE__ */ createBaseVNode("div", { class: "mt-5 mx-auto text-center opacity-25 text-sm" }, " [Default Layout] ", -1);
function _sfc_render(_ctx, _cache) {
  const _component_router_view = resolveComponent("router-view");
  const _component_Footer = _sfc_main$3;
  return openBlock(), createElementBlock("main", _hoisted_1$2, [
    createVNode(_component_router_view),
    createVNode(_component_Footer),
    _hoisted_2$1
  ]);
}
var __layout_0 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render]]);
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
var LayoutHeader_vue_vue_type_style_index_0_scoped_true_lang = "";
const _withScopeId = (n) => (pushScopeId("data-v-02f55bb9"), n = n(), popScopeId(), n);
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
const _hoisted_11 = { class: "sm:hidden py-2 px-3 rounded-2xl inline-block bg-gray-100" };
const _hoisted_12 = { class: "hidden sm:flex py-1 px-2 flex items-center rounded-3xl border border-solid" };
const _hoisted_13 = { class: "px-1 mr-1" };
const _hoisted_14 = { class: "py-2 px-3 rounded-2xl inline-block bg-gray-100" };
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  setup(__props) {
    window.global = window;
    window.process = process;
    window.Buffer = buffer.Buffer;
    window.util = util;
    const { open } = useBoard();
    const { address, balance, isActivated } = useEthers();
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
                unref(isActivated) ? (openBlock(), createElementBlock("div", _hoisted_10, [
                  createBaseVNode("div", _hoisted_11, toDisplayString(unref(shortenAddress)(unref(address))), 1),
                  createBaseVNode("div", _hoisted_12, [
                    createBaseVNode("div", _hoisted_13, toDisplayString(unref(displayEther)(unref(balance))) + " ETH", 1),
                    createBaseVNode("div", _hoisted_14, toDisplayString(unref(shortenAddress)(unref(address))), 1)
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
var LayoutHeader = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-02f55bb9"]]);
const _hoisted_1 = { id: "APP" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  setup(__props) {
    console.log("HEY HEY HEY -- App.vue 1 (typescript setup)");
    const provider4Web3 = new WalletConnectProvider({
      infuraId: "432d743bb1d944268c6e3725f243a7e0"
    });
    const web3 = new lib(provider4Web3);
    console.log("vue web3 (provider)", web3, provider4Web3);
    console.log("HEY HEY HEY -- App.vue 2 (web3)");
    const provider4ethers = new Web3Provider(window.ethereum);
    const signer4ethers = provider4ethers.getSigner();
    console.log("ethers (provider, signer)", provider4ethers, signer4ethers);
    console.log("HEY HEY HEY -- App.vue 3 (ethers)");
    return (_ctx, _cache) => {
      const _component_router_view = resolveComponent("router-view");
      const _component_vdapp_board = resolveComponent("vdapp-board");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(LayoutHeader),
        createVNode(_component_router_view),
        createVNode(_component_vdapp_board)
      ]);
    };
  }
});
var windiBase = "";
var windiComponents = "";
var main = "";
var windiUtilities = "";
const app = createApp(_sfc_main);
const routes = setupLayouts(routes$1);
const router = createRouter({ history: createWebHashHistory(), routes });
app.use(router);
Object.values({ "./modules/head.ts": __glob_11_0, "./modules/i18n.ts": __glob_11_1, "./modules/nprogress.ts": __glob_11_2, "./modules/pinia.ts": __glob_11_3 }).map((i) => {
  var _a;
  return (_a = i.install) == null ? void 0 : _a.call(i, { app, router, routes });
});
app.use(VueDapp, {
  infuraId: "432d743bb1d944268c6e3725f243a7e0"
});
console.log("vue dapp (app.use)", app);
app.mount("#app");
console.log("vue app (mounted)", app);
export { __unplugin_components_0$1 as _, _export_sfc as a, _sfc_main$3 as b, useUserStore as u };
