function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function set_svg_attributes(node, attributes) {
    for (const key in attributes) {
        attr(node, key, attributes[key]);
    }
}
function children(element) {
    return Array.from(element.childNodes);
}
function claim_element(nodes, name, attributes, svg) {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.nodeName === name) {
            let j = 0;
            const remove = [];
            while (j < node.attributes.length) {
                const attribute = node.attributes[j++];
                if (!attributes[attribute.name]) {
                    remove.push(attribute.name);
                }
            }
            for (let k = 0; k < remove.length; k++) {
                node.removeAttribute(remove[k]);
            }
            return nodes.splice(i, 1)[0];
        }
    }
    return svg ? svg_element(name) : element(name);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

const modal = createModal();
const login = createLoginFunctions();
const __ = writable({
	"calltoaction": "Choose your login method",
	"nodetect": "Error: cannot detect crypto wallet",
	"permission": "Waiting for your permission",
	"fetching": "Fetching login phrase...",
	"awaiting": "Waiting for your signature",
	"verifying": "Verifying signature...",
	"loggedin": "Logged in",
	"aborted": "Login aborted",
	"heading": "Log In",
	"walletconnectButtonTitle": "Scan a QR code with your wallet, https://walletconnect.org",
	"metamaskButtonTitle": "Browser add-on and mobile app, https://metamask.io",
});

function createModal() {
	const { update, set, subscribe } = writable(false);
	return {
		subscribe,
		open: () => set(true),
		close: () => set(false),
		toggle: () => update(n => !n)
	};
}

// This holds things passed to `Web3Login.configure`:
// The getLoginMessage and verifySignature methods.
function createLoginFunctions() {
	const { update, subscribe } = writable({});
	return {
		subscribe,
		update: obj => update(n => ({
			...n,
			...obj
		}))
	};
}

/* src/Modal.svelte generated by Svelte v3.28.0 */

const { document: document_1 } = globals;

function add_css() {
	var style = element("style");
	style.id = "svelte-1ad5ldo-style";
	style.textContent = ".web3login-modal-background.svelte-1ad5ldo{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0, 0, 0, 0.3);z-index:1336}.web3login-modal-heading.svelte-1ad5ldo{font-size:1.5em;font-weight:bold}.web3login-modal.svelte-1ad5ldo{position:fixed;left:50%;top:50%;width:calc(100vw - 4.2em);max-width:22em;max-height:calc(100vh - 4.2em);overflow:auto;transform:translate(-50%, -50%);padding:24px;border-radius:0.2em;background:white;z-index:1337;color:black}";
	append(document_1.head, style);
}

const get_heading_slot_changes = dirty => ({});
const get_heading_slot_context = ctx => ({});

function create_fragment(ctx) {
	let div0;
	let t0;
	let div3;
	let div1;
	let t1;
	let div2;
	let current;
	let mounted;
	let dispose;
	const heading_slot_template = /*#slots*/ ctx[4].heading;
	const heading_slot = create_slot(heading_slot_template, ctx, /*$$scope*/ ctx[3], get_heading_slot_context);
	const default_slot_template = /*#slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

	return {
		c() {
			div0 = element("div");
			t0 = space();
			div3 = element("div");
			div1 = element("div");
			if (heading_slot) heading_slot.c();
			t1 = space();
			div2 = element("div");
			if (default_slot) default_slot.c();
			attr(div0, "class", "web3login-modal-background svelte-1ad5ldo");
			attr(div1, "class", "web3login-modal-heading svelte-1ad5ldo");
			attr(div2, "class", "web3login-modal-content");
			attr(div3, "class", "web3login-modal svelte-1ad5ldo");
			attr(div3, "role", "dialog");
			attr(div3, "aria-modal", "true");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			insert(target, t0, anchor);
			insert(target, div3, anchor);
			append(div3, div1);

			if (heading_slot) {
				heading_slot.m(div1, null);
			}

			append(div3, t1);
			append(div3, div2);

			if (default_slot) {
				default_slot.m(div2, null);
			}

			/*div3_binding*/ ctx[5](div3);
			current = true;

			if (!mounted) {
				dispose = [
					listen(window, "keydown", /*handle_keydown*/ ctx[2]),
					listen(div0, "click", /*close*/ ctx[1])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (heading_slot) {
				if (heading_slot.p && dirty & /*$$scope*/ 8) {
					update_slot(heading_slot, heading_slot_template, ctx, /*$$scope*/ ctx[3], dirty, get_heading_slot_changes, get_heading_slot_context);
				}
			}

			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 8) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(heading_slot, local);
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(heading_slot, local);
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching) detach(t0);
			if (detaching) detach(div3);
			if (heading_slot) heading_slot.d(detaching);
			if (default_slot) default_slot.d(detaching);
			/*div3_binding*/ ctx[5](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	const dispatch = createEventDispatcher();
	const close = () => dispatch("close");
	let modal;

	const handle_keydown = e => {
		if (e.key === "Escape") {
			close();
			return;
		}

		if (e.key === "Tab") {
			// trap focus
			const nodes = modal.querySelectorAll("*");

			const tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0);
			let index = tabbable.indexOf(document.activeElement);
			if (index === -1 && e.shiftKey) index = 0;
			index += tabbable.length + (e.shiftKey ? -1 : 1);
			index %= tabbable.length;
			tabbable[index].focus();
			e.preventDefault();
		}
	};

	const previously_focused = typeof document !== "undefined" && document.activeElement;

	if (previously_focused) {
		onDestroy(() => {
			previously_focused.focus();
		});
	}

	function div3_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			modal = $$value;
			$$invalidate(0, modal);
		});
	}

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	return [modal, close, handle_keydown, $$scope, slots, div3_binding];
}

class Modal extends SvelteComponent {
	constructor(options) {
		super();
		if (!document_1.getElementById("svelte-1ad5ldo-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

/* src/images/metamask.svg generated by Svelte v3.28.0 */

function create_fragment$1(ctx) {
	let svg;
	let g1;
	let path0;
	let path1;
	let path2;
	let path3;
	let path4;
	let path5;
	let path6;
	let path7;
	let path8;
	let path9;
	let path10;
	let path11;
	let path12;
	let path13;
	let path14;
	let path15;
	let path16;
	let path17;
	let g0;
	let path18;
	let path19;
	let path20;
	let path21;
	let path22;
	let path23;
	let path24;
	let path25;
	let path26;
	let path27;
	let path28;
	let path29;

	let svg_levels = [
		{ height: "355" },
		{ viewBox: "0 0 397 355" },
		{ width: "397" },
		{ xmlns: "http://www.w3.org/2000/svg" },
		/*$$props*/ ctx[0]
	];

	let svg_data = {};

	for (let i = 0; i < svg_levels.length; i += 1) {
		svg_data = assign(svg_data, svg_levels[i]);
	}

	return {
		c() {
			svg = svg_element("svg");
			g1 = svg_element("g");
			path0 = svg_element("path");
			path1 = svg_element("path");
			path2 = svg_element("path");
			path3 = svg_element("path");
			path4 = svg_element("path");
			path5 = svg_element("path");
			path6 = svg_element("path");
			path7 = svg_element("path");
			path8 = svg_element("path");
			path9 = svg_element("path");
			path10 = svg_element("path");
			path11 = svg_element("path");
			path12 = svg_element("path");
			path13 = svg_element("path");
			path14 = svg_element("path");
			path15 = svg_element("path");
			path16 = svg_element("path");
			path17 = svg_element("path");
			g0 = svg_element("g");
			path18 = svg_element("path");
			path19 = svg_element("path");
			path20 = svg_element("path");
			path21 = svg_element("path");
			path22 = svg_element("path");
			path23 = svg_element("path");
			path24 = svg_element("path");
			path25 = svg_element("path");
			path26 = svg_element("path");
			path27 = svg_element("path");
			path28 = svg_element("path");
			path29 = svg_element("path");
			this.h();
		},
		l(nodes) {
			svg = claim_element(
				nodes,
				"svg",
				{
					height: true,
					viewBox: true,
					width: true,
					xmlns: true
				},
				1
			);

			var svg_nodes = children(svg);

			g1 = claim_element(
				svg_nodes,
				"g",
				{
					fill: true,
					"fill-rule": true,
					transform: true
				},
				1
			);

			var g1_nodes = children(g1);
			path0 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path0).forEach(detach);
			path1 = claim_element(g1_nodes, "path", { d: true, fill: true, transform: true }, 1);
			children(path1).forEach(detach);
			path2 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path2).forEach(detach);
			path3 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path3).forEach(detach);
			path4 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path4).forEach(detach);
			path5 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path5).forEach(detach);
			path6 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path6).forEach(detach);
			path7 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path7).forEach(detach);
			path8 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path8).forEach(detach);
			path9 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path9).forEach(detach);
			path10 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path10).forEach(detach);
			path11 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path11).forEach(detach);
			path12 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path12).forEach(detach);
			path13 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path13).forEach(detach);
			path14 = claim_element(g1_nodes, "path", { d: true, fill: true, transform: true }, 1);
			children(path14).forEach(detach);
			path15 = claim_element(g1_nodes, "path", { d: true, fill: true, transform: true }, 1);
			children(path15).forEach(detach);
			path16 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path16).forEach(detach);
			path17 = claim_element(g1_nodes, "path", { d: true, fill: true }, 1);
			children(path17).forEach(detach);
			g0 = claim_element(g1_nodes, "g", { transform: true }, 1);
			var g0_nodes = children(g0);
			path18 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path18).forEach(detach);
			path19 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path19).forEach(detach);
			path20 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path20).forEach(detach);
			path21 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path21).forEach(detach);
			path22 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path22).forEach(detach);
			path23 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path23).forEach(detach);
			path24 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path24).forEach(detach);
			path25 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path25).forEach(detach);
			path26 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path26).forEach(detach);
			path27 = claim_element(g0_nodes, "path", { d: true, fill: true, transform: true }, 1);
			children(path27).forEach(detach);
			path28 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path28).forEach(detach);
			path29 = claim_element(g0_nodes, "path", { d: true, fill: true }, 1);
			children(path29).forEach(detach);
			g0_nodes.forEach(detach);
			g1_nodes.forEach(detach);
			svg_nodes.forEach(detach);
			this.h();
		},
		h() {
			attr(path0, "d", "m114.622644 327.195472 52.004717 13.810198v-18.05949l4.245283-4.249292h29.716982v21.246459 14.872523h-31.839624l-39.268868-16.997169z");
			attr(path0, "fill", "#cdbdb2");
			attr(path1, "d", "m199.528305 327.195472 50.943397 13.810198v-18.05949l4.245283-4.249292h29.716981v21.246459 14.872523h-31.839623l-39.268868-16.997169z");
			attr(path1, "fill", "#cdbdb2");
			attr(path1, "transform", "matrix(-1 0 0 1 483.96227 0)");
			attr(path2, "d", "m170.872644 287.889523-4.245283 35.056657 5.306604-4.249292h55.18868l6.367925 4.249292-4.245284-35.056657-8.490565-5.311615-42.452832 1.062323z");
			attr(path2, "fill", "#393939");
			attr(path3, "d", "m142.216984 50.9915022 25.471698 59.4900858 11.674528 173.158643h41.391511l12.735849-173.158643 23.349056-59.4900858z");
			attr(path3, "fill", "#f89c35");
			attr(path4, "d", "m30.7783023 181.657226-29.71698153 86.048161 74.29245393-4.249293h47.7594343v-37.181303l-2.122641-76.487253-10.613208 8.498583z");
			attr(path4, "fill", "#f89d35");
			attr(path5, "d", "m87.0283032 191.218134 87.0283028 2.124646-9.551886 44.617563-41.391511-10.623229z");
			attr(path5, "fill", "#d87c30");
			attr(path6, "d", "m87.0283032 192.280457 36.0849058 33.994334v33.994334z");
			attr(path6, "fill", "#ea8d3a");
			attr(path7, "d", "m123.113209 227.337114 42.452831 10.623229 13.79717 45.679888-9.551886 5.311615-46.698115-27.620398z");
			attr(path7, "fill", "#f89d35");
			attr(path8, "d", "m123.113209 261.331448-8.490565 65.864024 56.25-39.305949z");
			attr(path8, "fill", "#eb8f35");
			attr(path9, "d", "m174.056606 193.34278 5.306604 90.297451-15.919812-46.211049z");
			attr(path9, "fill", "#ea8e3a");
			attr(path10, "d", "m74.2924539 262.393771 48.8207551-1.062323-8.490565 65.864024z");
			attr(path10, "fill", "#d87c30");
			attr(path11, "d", "m24.4103777 355.878193 90.2122663-28.682721-40.3301901-64.801701-73.23113313 5.311616z");
			attr(path11, "fill", "#eb8f35");
			attr(path12, "d", "m167.688682 110.481588-45.636793 38.243627-35.0235858 42.492919 87.0283028 3.186969z");
			attr(path12, "fill", "#e8821e");
			attr(path13, "d", "m114.622644 327.195472 56.25-39.305949-4.245283 33.994334v19.121813l-38.207548-7.43626z");
			attr(path13, "fill", "#dfcec3");
			attr(path14, "d", "m229.245286 327.195472 55.18868-39.305949-4.245283 33.994334v19.121813l-38.207548-7.43626z");
			attr(path14, "fill", "#dfcec3");
			attr(path14, "transform", "matrix(-1 0 0 1 513.679252 0)");
			attr(path15, "d", "m132.665096 212.464593-11.674528 24.433427 41.39151-10.623229z");
			attr(path15, "fill", "#393939");
			attr(path15, "transform", "matrix(-1 0 0 1 283.372646 0)");
			attr(path16, "d", "m23.349057 1.06232296 144.339625 109.41926504-24.410378-59.4900858z");
			attr(path16, "fill", "#e88f35");
			attr(path17, "d", "m23.349057 1.06232296-19.10377392 58.42776294 10.61320772 63.7393781-7.42924541 4.249292 10.61320771 9.560906-8.49056617 7.436261 11.67452847 10.623229-7.4292454 6.373938 16.9811323 21.246459 79.5990577-24.433428c38.915096-31.161473 58.018869-47.096318 57.311322-47.804533-.707548-.708215-48.820756-37.1813036-144.339625-109.41926504z");
			attr(path17, "fill", "#8e5a30");
			attr(path18, "d", "m30.7783023 181.657226-29.71698153 86.048161 74.29245393-4.249293h47.7594343v-37.181303l-2.122641-76.487253-10.613208 8.498583z");
			attr(path18, "fill", "#f89d35");
			attr(path19, "d", "m87.0283032 191.218134 87.0283028 2.124646-9.551886 44.617563-41.391511-10.623229z");
			attr(path19, "fill", "#d87c30");
			attr(path20, "d", "m87.0283032 192.280457 36.0849058 33.994334v33.994334z");
			attr(path20, "fill", "#ea8d3a");
			attr(path21, "d", "m123.113209 227.337114 42.452831 10.623229 13.79717 45.679888-9.551886 5.311615-46.698115-27.620398z");
			attr(path21, "fill", "#f89d35");
			attr(path22, "d", "m123.113209 261.331448-8.490565 65.864024 55.18868-38.243626z");
			attr(path22, "fill", "#eb8f35");
			attr(path23, "d", "m174.056606 193.34278 5.306604 90.297451-15.919812-46.211049z");
			attr(path23, "fill", "#ea8e3a");
			attr(path24, "d", "m74.2924539 262.393771 48.8207551-1.062323-8.490565 65.864024z");
			attr(path24, "fill", "#d87c30");
			attr(path25, "d", "m24.4103777 355.878193 90.2122663-28.682721-40.3301901-64.801701-73.23113313 5.311616z");
			attr(path25, "fill", "#eb8f35");
			attr(path26, "d", "m167.688682 110.481588-45.636793 38.243627-35.0235858 42.492919 87.0283028 3.186969z");
			attr(path26, "fill", "#e8821e");
			attr(path27, "d", "m132.665096 212.464593-11.674528 24.433427 41.39151-10.623229z");
			attr(path27, "fill", "#393939");
			attr(path27, "transform", "matrix(-1 0 0 1 283.372646 0)");
			attr(path28, "d", "m23.349057 1.06232296 144.339625 109.41926504-24.410378-59.4900858z");
			attr(path28, "fill", "#e88f35");
			attr(path29, "d", "m23.349057 1.06232296-19.10377392 58.42776294 10.61320772 63.7393781-7.42924541 4.249292 10.61320771 9.560906-8.49056617 7.436261 11.67452847 10.623229-7.4292454 6.373938 16.9811323 21.246459 79.5990577-24.433428c38.915096-31.161473 58.018869-47.096318 57.311322-47.804533-.707548-.708215-48.820756-37.1813036-144.339625-109.41926504z");
			attr(path29, "fill", "#8e5a30");
			attr(g0, "transform", "matrix(-1 0 0 1 399.056611 0)");
			attr(g1, "fill", "none");
			attr(g1, "fill-rule", "evenodd");
			attr(g1, "transform", "translate(-1 -1)");
			set_svg_attributes(svg, svg_data);
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, g1);
			append(g1, path0);
			append(g1, path1);
			append(g1, path2);
			append(g1, path3);
			append(g1, path4);
			append(g1, path5);
			append(g1, path6);
			append(g1, path7);
			append(g1, path8);
			append(g1, path9);
			append(g1, path10);
			append(g1, path11);
			append(g1, path12);
			append(g1, path13);
			append(g1, path14);
			append(g1, path15);
			append(g1, path16);
			append(g1, path17);
			append(g1, g0);
			append(g0, path18);
			append(g0, path19);
			append(g0, path20);
			append(g0, path21);
			append(g0, path22);
			append(g0, path23);
			append(g0, path24);
			append(g0, path25);
			append(g0, path26);
			append(g0, path27);
			append(g0, path28);
			append(g0, path29);
		},
		p(ctx, [dirty]) {
			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
				{ height: "355" },
				{ viewBox: "0 0 397 355" },
				{ width: "397" },
				{ xmlns: "http://www.w3.org/2000/svg" },
				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
			]));
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	$$self.$$set = $$new_props => {
		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
	};

	$$props = exclude_internal_props($$props);
	return [$$props];
}

class Metamask extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
	}
}

/* src/images/walletconnect.svg generated by Svelte v3.28.0 */

function create_fragment$2(ctx) {
	let svg;
	let path;

	let svg_levels = [
		{ height: "246" },
		{ viewBox: "0 0 400 246" },
		{ width: "400" },
		{ xmlns: "http://www.w3.org/2000/svg" },
		/*$$props*/ ctx[0]
	];

	let svg_data = {};

	for (let i = 0; i < svg_levels.length; i += 1) {
		svg_data = assign(svg_data, svg_levels[i]);
	}

	return {
		c() {
			svg = svg_element("svg");
			path = svg_element("path");
			this.h();
		},
		l(nodes) {
			svg = claim_element(
				nodes,
				"svg",
				{
					height: true,
					viewBox: true,
					width: true,
					xmlns: true
				},
				1
			);

			var svg_nodes = children(svg);
			path = claim_element(svg_nodes, "path", { d: true, fill: true }, 1);
			children(path).forEach(detach);
			svg_nodes.forEach(detach);
			this.h();
		},
		h() {
			attr(path, "d", "m81.9180572 48.3416816c65.2149658-63.8508884 170.9493158-63.8508884 236.1642788 0l7.848727 7.6845565c3.260748 3.1925442 3.260748 8.3686816 0 11.5612272l-26.848927 26.2873374c-1.630375 1.5962734-4.273733 1.5962734-5.904108 0l-10.800779-10.5748639c-45.495589-44.5439756-119.258514-44.5439756-164.754105 0l-11.566741 11.3248068c-1.630376 1.5962721-4.273735 1.5962721-5.904108 0l-26.8489263-26.2873375c-3.2607483-3.1925456-3.2607483-8.3686829 0-11.5612272zm291.6903948 54.3649934 23.895596 23.395862c3.260732 3.19253 3.260751 8.368636.000041 11.561187l-107.746894 105.494845c-3.260726 3.192568-8.547443 3.192604-11.808214.000083-.000013-.000013-.000029-.000029-.000042-.000043l-76.472191-74.872762c-.815187-.798136-2.136867-.798136-2.952053 0-.000006.000005-.00001.00001-.000015.000014l-76.470562 74.872708c-3.260715 3.192576-8.547434 3.19263-11.808215.000116-.000019-.000018-.000039-.000037-.000059-.000058l-107.74989297-105.496247c-3.26074695-3.192544-3.26074695-8.368682 0-11.561226l23.89563947-23.395823c3.260747-3.1925446 8.5474652-3.1925446 11.8082136 0l76.4733029 74.873809c.815188.798136 2.136866.798136 2.952054 0 .000012-.000012.000023-.000023.000035-.000032l76.469471-74.873777c3.260673-3.1926181 8.547392-3.1927378 11.808214-.000267.000046.000045.000091.00009.000135.000135l76.473203 74.873909c.815186.798135 2.136866.798135 2.952053 0l76.471967-74.872433c3.260748-3.1925458 8.547465-3.1925458 11.808213 0z");
			attr(path, "fill", "#3b99fc");
			set_svg_attributes(svg, svg_data);
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, path);
		},
		p(ctx, [dirty]) {
			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
				{ height: "246" },
				{ viewBox: "0 0 400 246" },
				{ width: "400" },
				{ xmlns: "http://www.w3.org/2000/svg" },
				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
			]));
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	$$self.$$set = $$new_props => {
		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
	};

	$$props = exclude_internal_props($$props);
	return [$$props];
}

class Walletconnect extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
	}
}

/* node_modules/svelte-spinner/src/index.svelte generated by Svelte v3.28.0 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-1bbsd2f-style";
	style.textContent = ".svelte-spinner.svelte-1bbsd2f{transition-property:transform;animation-name:svelte-1bbsd2f-svelte-spinner_infinite-spin;animation-iteration-count:infinite;animation-timing-function:linear}@keyframes svelte-1bbsd2f-svelte-spinner_infinite-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
	append(document.head, style);
}

function create_fragment$3(ctx) {
	let svg;
	let circle;
	let circle_stroke_dasharray_value;

	return {
		c() {
			svg = svg_element("svg");
			circle = svg_element("circle");
			attr(circle, "role", "presentation");
			attr(circle, "cx", "16");
			attr(circle, "cy", "16");
			attr(circle, "r", /*radius*/ ctx[4]);
			attr(circle, "stroke", /*color*/ ctx[2]);
			attr(circle, "fill", "none");
			attr(circle, "stroke-width", /*thickness*/ ctx[3]);
			attr(circle, "stroke-dasharray", circle_stroke_dasharray_value = "" + (/*dash*/ ctx[5] + ",100"));
			attr(circle, "stroke-linecap", "round");
			attr(svg, "height", /*size*/ ctx[0]);
			attr(svg, "width", /*size*/ ctx[0]);
			set_style(svg, "animation-duration", /*speed*/ ctx[1] + "ms");
			attr(svg, "class", "svelte-spinner svelte-1bbsd2f");
			attr(svg, "viewBox", "0 0 32 32");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, circle);
		},
		p(ctx, [dirty]) {
			if (dirty & /*radius*/ 16) {
				attr(circle, "r", /*radius*/ ctx[4]);
			}

			if (dirty & /*color*/ 4) {
				attr(circle, "stroke", /*color*/ ctx[2]);
			}

			if (dirty & /*thickness*/ 8) {
				attr(circle, "stroke-width", /*thickness*/ ctx[3]);
			}

			if (dirty & /*dash*/ 32 && circle_stroke_dasharray_value !== (circle_stroke_dasharray_value = "" + (/*dash*/ ctx[5] + ",100"))) {
				attr(circle, "stroke-dasharray", circle_stroke_dasharray_value);
			}

			if (dirty & /*size*/ 1) {
				attr(svg, "height", /*size*/ ctx[0]);
			}

			if (dirty & /*size*/ 1) {
				attr(svg, "width", /*size*/ ctx[0]);
			}

			if (dirty & /*speed*/ 2) {
				set_style(svg, "animation-duration", /*speed*/ ctx[1] + "ms");
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { size = 25 } = $$props;
	let { speed = 750 } = $$props;
	let { color = "rgba(0,0,0,0.4)" } = $$props;
	let { thickness = 2 } = $$props;
	let { gap = 40 } = $$props;
	let { radius = 10 } = $$props;
	let dash;

	$$self.$$set = $$props => {
		if ("size" in $$props) $$invalidate(0, size = $$props.size);
		if ("speed" in $$props) $$invalidate(1, speed = $$props.speed);
		if ("color" in $$props) $$invalidate(2, color = $$props.color);
		if ("thickness" in $$props) $$invalidate(3, thickness = $$props.thickness);
		if ("gap" in $$props) $$invalidate(6, gap = $$props.gap);
		if ("radius" in $$props) $$invalidate(4, radius = $$props.radius);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*radius, gap*/ 80) {
			 $$invalidate(5, dash = 2 * Math.PI * radius * (100 - gap) / 100);
		}
	};

	return [size, speed, color, thickness, radius, dash, gap];
}

class Src extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1bbsd2f-style")) add_css$1();

		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
			size: 0,
			speed: 1,
			color: 2,
			thickness: 3,
			gap: 6,
			radius: 4
		});
	}
}

class MetaMaskConnector {
	constructor(ethereum) {
		if ( ! ethereum  ) {
			throw new Error( 'MetaMask is not injected.' );
		}
		this._ethereum = ethereum;
	}

	async enable() {
		return this._ethereum.request({
			method: 'eth_requestAccounts'
		});
	}

	async personalSign(address, message) {
		return this._ethereum.request({
			method: 'personal_sign',
			params: [ message, address ],
			from: address
		}).then(signature => ([ signature, address ]));
	}
}

/**
 * Returns a Promise that resolves to the value of window.ethereum if it is
 * set within the given timeout, or null.
 * The Promise will not reject, but an error will be thrown if invalid options
 * are provided.
 *
 * @param {Object} [options] - Options bag.
 * @param {boolean} [options.mustBeMetaMask] - Whether to only look for MetaMask
 * providers. Default: false
 * @param {boolean} [options.silent] - Whether to silence console errors. Does
 * not affect thrown errors. Default: false
 * @param {number} [options.timeout] - Milliseconds to wait for
 * 'ethereum#initialized' to be dispatched. Default: 3000
 * @returns {Promise<EthereumProvider | null>} A Promise that resolves with the
 * Provider if it is detected within the given timeout, otherwise null.
 */
var detectProvider = function detectEthereumProvider ({
  mustBeMetaMask = false,
  silent = false,
  timeout = 3000,
} = {}) {

  _validateInputs();

  let handled = false;

  return new Promise((resolve) => {
    if (window.ethereum) {

      handleEthereum();

    } else {

      window.addEventListener(
        'ethereum#initialized',
        handleEthereum,
        { once: true },
      );

      setTimeout(() => {
        handleEthereum();
      }, timeout);
    }

    function handleEthereum () {

      if (handled) {
        return
      }
      handled = true;

      window.removeEventListener('ethereum#initialized', handleEthereum);

      const { ethereum } = window;

      if (ethereum && (!mustBeMetaMask || ethereum.isMetaMask)) {
        resolve(ethereum);
      } else {

        const message = mustBeMetaMask && ethereum
          ? 'Non-MetaMask window.ethereum detected.'
          : 'Unable to detect window.ethereum.';

        !silent && console.error('@metamask/detect-provider:', message);
        resolve(null);
      }
    }
  })

  function _validateInputs () {
    if (typeof mustBeMetaMask !== 'boolean') {
      throw new Error(`@metamask/detect-provider: Expected option 'mustBeMetaMask' to be a boolean.`)
    }
    if (typeof silent !== 'boolean') {
      throw new Error(`@metamask/detect-provider: Expected option 'silent' to be a boolean.`)
    }
    if (typeof timeout !== 'number') {
      throw new Error(`@metamask/detect-provider: Expected option 'timeout' to be a number.`)
    }
  }
};

/* src/Component.svelte generated by Svelte v3.28.0 */

function add_css$2() {
	var style = element("style");
	style.id = "svelte-xu17ap-style";
	style.textContent = "ul.svelte-xu17ap{margin:auto;padding:0}.web3login-spinner.svelte-xu17ap{display:inline-flex}ul.svelte-xu17ap{list-style:none;margin-top:15px;padding-bottom:15px}button.svelte-xu17ap{padding:0 1em;font-size:1.2em;height:5em;width:100%;margin-top:1em;cursor:pointer;display:flex;justify-content:center;align-items:center}.web3login-logo svg{width:30px;height:1.2em;padding-right:0.3em;float:left}.web3login-close.svelte-xu17ap{color:dimgray;float:right;cursor:pointer}";
	append(document.head, style);
}

// (85:0) {#if $modal}
function create_if_block(ctx) {
	let modal_1;
	let current;

	modal_1 = new Modal({
			props: {
				$$slots: {
					default: [create_default_slot],
					heading: [create_heading_slot]
				},
				$$scope: { ctx }
			}
		});

	modal_1.$on("close", modal.close);

	return {
		c() {
			create_component(modal_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(modal_1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const modal_1_changes = {};

			if (dirty & /*$$scope, $__, status, showSpinner*/ 519) {
				modal_1_changes.$$scope = { dirty, ctx };
			}

			modal_1.$set(modal_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(modal_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(modal_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(modal_1, detaching);
		}
	};
}

// (89:4) {#if showSpinner}
function create_if_block_2(ctx) {
	let span;
	let spinner;
	let current;
	spinner = new Src({ props: { size: "0.9em" } });

	return {
		c() {
			span = element("span");
			create_component(spinner.$$.fragment);
			attr(span, "class", "web3login-spinner svelte-xu17ap");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			mount_component(spinner, span, null);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(spinner.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(spinner.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(span);
			destroy_component(spinner);
		}
	};
}

// (87:3) <span slot="heading">
function create_heading_slot(ctx) {
	let span0;
	let t0_value = /*$__*/ ctx[2]["heading"] + "";
	let t0;
	let t1;
	let t2;
	let span1;
	let current;
	let mounted;
	let dispose;
	let if_block = /*showSpinner*/ ctx[1] && create_if_block_2();

	return {
		c() {
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			if (if_block) if_block.c();
			t2 = space();
			span1 = element("span");
			span1.textContent = "×";
			attr(span1, "class", "web3login-close svelte-xu17ap");
			attr(span0, "slot", "heading");
		},
		m(target, anchor) {
			insert(target, span0, anchor);
			append(span0, t0);
			append(span0, t1);
			if (if_block) if_block.m(span0, null);
			append(span0, t2);
			append(span0, span1);
			current = true;

			if (!mounted) {
				dispose = listen(span1, "click", prevent_default(modal.close));
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if ((!current || dirty & /*$__*/ 4) && t0_value !== (t0_value = /*$__*/ ctx[2]["heading"] + "")) set_data(t0, t0_value);

			if (/*showSpinner*/ ctx[1]) {
				if (if_block) {
					if (dirty & /*showSpinner*/ 2) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_2();
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(span0, t2);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(span0);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

// (103:4) {#if window.isSecureContext}
function create_if_block_1(ctx) {
	let li;
	let button;
	let span0;
	let walletconnectimage;
	let t0;
	let span1;
	let button_title_value;
	let current;
	let mounted;
	let dispose;
	walletconnectimage = new Walletconnect({ props: { size: "1.5em" } });

	return {
		c() {
			li = element("li");
			button = element("button");
			span0 = element("span");
			create_component(walletconnectimage.$$.fragment);
			t0 = space();
			span1 = element("span");
			span1.textContent = "WalletConnect";
			attr(span0, "class", "web3login-logo");
			attr(span0, "aria-hidden", "true");
			attr(button, "class", "web3login-walletconnect svelte-xu17ap");
			attr(button, "title", button_title_value = /*$__*/ ctx[2]["walletconnectButtonTitle"]);
			attr(button, "type", "button");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, button);
			append(button, span0);
			mount_component(walletconnectimage, span0, null);
			append(button, t0);
			append(button, span1);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*walletconnectLogin*/ ctx[5]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (!current || dirty & /*$__*/ 4 && button_title_value !== (button_title_value = /*$__*/ ctx[2]["walletconnectButtonTitle"])) {
				attr(button, "title", button_title_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(walletconnectimage.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(walletconnectimage.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			destroy_component(walletconnectimage);
			mounted = false;
			dispose();
		}
	};
}

// (86:1) <Modal on:close={modal.close}>
function create_default_slot(ctx) {
	let t0;
	let p;
	let t1;
	let t2;
	let ul;
	let li;
	let button;
	let span0;
	let metamaskimage;
	let t3;
	let span1;
	let button_title_value;
	let t5;
	let current;
	let mounted;
	let dispose;
	metamaskimage = new Metamask({ props: { size: "1.5em" } });
	let if_block = window.isSecureContext && create_if_block_1(ctx);

	return {
		c() {
			t0 = space();
			p = element("p");
			t1 = text(/*status*/ ctx[0]);
			t2 = space();
			ul = element("ul");
			li = element("li");
			button = element("button");
			span0 = element("span");
			create_component(metamaskimage.$$.fragment);
			t3 = space();
			span1 = element("span");
			span1.textContent = "MetaMask";
			t5 = space();
			if (if_block) if_block.c();
			attr(span0, "class", "web3login-logo");
			attr(span0, "aria-hidden", "true");
			attr(button, "class", "web3login-metamask svelte-xu17ap");
			attr(button, "title", button_title_value = /*$__*/ ctx[2]["metamaskButtonTitle"]);
			attr(button, "type", "button");
			attr(ul, "class", "svelte-xu17ap");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, p, anchor);
			append(p, t1);
			insert(target, t2, anchor);
			insert(target, ul, anchor);
			append(ul, li);
			append(li, button);
			append(button, span0);
			mount_component(metamaskimage, span0, null);
			append(button, t3);
			append(button, span1);
			append(ul, t5);
			if (if_block) if_block.m(ul, null);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*metamaskLogin*/ ctx[4]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (!current || dirty & /*status*/ 1) set_data(t1, /*status*/ ctx[0]);

			if (!current || dirty & /*$__*/ 4 && button_title_value !== (button_title_value = /*$__*/ ctx[2]["metamaskButtonTitle"])) {
				attr(button, "title", button_title_value);
			}

			if (window.isSecureContext) if_block.p(ctx, dirty);
		},
		i(local) {
			if (current) return;
			transition_in(metamaskimage.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(metamaskimage.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(p);
			if (detaching) detach(t2);
			if (detaching) detach(ul);
			destroy_component(metamaskimage);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$4(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*$modal*/ ctx[3] && create_if_block(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*$modal*/ ctx[3]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*$modal*/ 8) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let $__;
	let $modal;
	component_subscribe($$self, __, $$value => $$invalidate(2, $__ = $$value));
	component_subscribe($$self, modal, $$value => $$invalidate(3, $modal = $$value));
	let status = $__["calltoaction"];
	let showSpinner = false;
	const { getLoginMessage, verifySignature } = get_store_value(login) || {};

	function connect(provider) {
		if (!getLoginMessage || !verifySignature) {
			throw new Error("Web3Login: You must set `getLoginMessage` and `verifySignature` callbacks with `Web3Login.configure(getLoginMessage, verifySignature)` before this can work.");
		}

		$$invalidate(0, status = $__["permission"]);

		return provider.enable().then(addresses => {
			$$invalidate(0, status = $__["fetching"]);
			return getLoginMessage(addresses);
		}).then(([message, address] = []) => {
			if (!message || !address) {
				throw new Error(`Need message and address, got: ${message} + ${address}`);
			}

			$$invalidate(0, status = $__["awaiting"]);
			return provider.personalSign(address, message);
		}).then(([signedMessage, address] = []) => {
			if (!signedMessage || !address) {
				throw new Error(`Need signedMessage and address, got: ${signedMessage} + ${address}`);
			}

			$$invalidate(0, status = $__["verifying"]);
			return verifySignature([signedMessage, address, provider]);
		}).then(message => {
			if (message) {
				$$invalidate(0, status = message);
			} else {
				$$invalidate(0, status = $__["loggedin"]);
			}
		}).catch(err => {
			if (typeof err !== "string") {
				if (err && err.message) {
					err = err.message;
				} else {
					err = $__["aborted"];
				}
			}

			$$invalidate(0, status = err || $__["aborted"]);
		});
	}

	async function metamaskLogin(e) {
		e.preventDefault();
		const provider = await detectProvider();

		if (!provider) {
			$$invalidate(0, status = $__["nodetect"]);
		} else {
			connect(new MetaMaskConnector(provider));
		}
	}

	async function walletconnectLogin(e) {
		e.preventDefault();
		$$invalidate(1, showSpinner = true);
		const { default: WalletConnect } = await import('./WalletConnect.es.js');
		$$invalidate(1, showSpinner = false);

		if ($modal) {
			const wc = new WalletConnect();
			connect(wc);
		}
	}

	return [status, showSpinner, $__, $modal, metamaskLogin, walletconnectLogin];
}

class Component extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-xu17ap-style")) add_css$2();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});
	}
}

/**
 * Sets a callback for the message that will be signed with personal_sign.
 *
 * @param function getLoginMessage Callback for login message generation.
 * @param function verifySignature Callback for verifying message.
 * @param Object   i18n            Translated strings object.
 */
function configure(getLoginMessage, verifySignature, i18n) {
	login.update({
		getLoginMessage,
		verifySignature
	});
	if (i18n) {
		__.set(i18n);
	}
}

window.addEventListener('load', () => {
	const id = 'web3-login-root';
	let el = document.getElementById(id);
	if (!el) {
		el = document.createElement('div');
		el.id = id;
		document.body.appendChild(el);
		new Component({
			target: el
		});
	}
});
window.Web3Login = {
	modal,
	configure
};

var Web3Login = /*#__PURE__*/Object.freeze({
	__proto__: null,
	configure: configure,
	modal: modal
});

/**
 * Configures web3login to work with EthPress and WordPress.
 */

( function( ethpressLoginWP ) {
	window.Web3Login = Web3Login;
	window.ethpress = window.ethpress || {};
	window.ethpress.metamask = {
		connect: window.Web3Login && window.Web3Login.modal.open
	};

	configure( function( addresses ) {
		var data, _address;

		_address = addresses[0];
		data = new FormData();

		// Using web3.eth.coinbase is unreliable.
		// https://github.com/MetaMask/metamask-extension/issues/6674
		data.append( 'action', ethpressLoginWP.getMessageAction );
		data.append( '_ajax_nonce', ethpressLoginWP.getNonceNonce );
		data.append( 'coinbase', '' + _address );
		return fetch( ethpressLoginWP.ajaxUrl, {
			method: 'POST',
			body: data,
			credentials: 'same-origin'
		})
		.then( function( res ) {
			if ( res.ok ) {
				return res.json();
			}
			throw new Error( res.statusText );
		})
		.then( function( result ) {
			if ( ! result.success ) {
				throw new Error( result.data );
			}
			return [ result.data, _address ];
		});
	}, function( arg ) {
		var signedMessage = arg[0];
		var _address = arg[1];
		var provider = arg[2];
		var data = new FormData();
		var providerName = provider.isMetaMask ? 'metamask' : ( provider.isTrust ? 'trust' : 'walletconnect' );

		if ( 'string' !== typeof signedMessage ) {
			throw new Error( 'Missing signature' );
		}

		data.append( 'signature', signedMessage );
		data.append( '_ajax_nonce', ethpressLoginWP.loginNonce );
		data.append( 'action', ethpressLoginWP.loginAction );
		data.append( 'coinbase', _address );
		data.append( 'provider', providerName );
		data.append( 'redirect_to', new URLSearchParams( window.location.search ).get( 'redirect_to' ) || '' );

		return fetch( ethpressLoginWP.ajaxUrl, {
			method: 'POST',
			body: data,
			credentials: 'same-origin'
		})
		.then( function( res ) {
			if ( res.ok ) {
				return res.json();
			}
			throw new Error( res.statusText );
		})
		.then( function( result ) {
			var _err;

			if ( result.success ) {
				return result.data;
			}
			_err = 'Unknown error.';
			if ( result.data && result.data.message ) {
				_err = result.data.message;
			} else if ( 'string' === typeof result.data ) {
				_err = result.data;
			}
			throw new Error( _err );
		})
		.then( function( data ) {

			// Succesful login.
			if ( data.redirect ) {
				document.location.href = data.redirect;
			}
			if ( data ) {
				return data.message;
			}
		});
	}, ethpressLoginWP.l10n );

}( window.ethpressLoginWP ) );
