
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    // src/icon/index.ts
    var matchName = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    var iconDefaults = Object.freeze({
      left: 0,
      top: 0,
      width: 16,
      height: 16,
      rotate: 0,
      vFlip: false,
      hFlip: false
    });
    function fullIcon(data) {
      return { ...iconDefaults, ...data };
    }

    // src/icon/name.ts
    var stringToIcon = (value, validate, allowSimpleName, provider = "") => {
      const colonSeparated = value.split(":");
      if (value.slice(0, 1) === "@") {
        if (colonSeparated.length < 2 || colonSeparated.length > 3) {
          return null;
        }
        provider = colonSeparated.shift().slice(1);
      }
      if (colonSeparated.length > 3 || !colonSeparated.length) {
        return null;
      }
      if (colonSeparated.length > 1) {
        const name2 = colonSeparated.pop();
        const prefix = colonSeparated.pop();
        const result = {
          provider: colonSeparated.length > 0 ? colonSeparated[0] : provider,
          prefix,
          name: name2
        };
        return validate && !validateIcon(result) ? null : result;
      }
      const name = colonSeparated[0];
      const dashSeparated = name.split("-");
      if (dashSeparated.length > 1) {
        const result = {
          provider,
          prefix: dashSeparated.shift(),
          name: dashSeparated.join("-")
        };
        return validate && !validateIcon(result) ? null : result;
      }
      if (allowSimpleName && provider === "") {
        const result = {
          provider,
          prefix: "",
          name
        };
        return validate && !validateIcon(result, allowSimpleName) ? null : result;
      }
      return null;
    };
    var validateIcon = (icon, allowSimpleName) => {
      if (!icon) {
        return false;
      }
      return !!((icon.provider === "" || icon.provider.match(matchName)) && (allowSimpleName && icon.prefix === "" || icon.prefix.match(matchName)) && icon.name.match(matchName));
    };

    // src/icon/merge.ts
    function mergeIconData(icon, alias) {
      const result = { ...icon };
      for (const key in iconDefaults) {
        const prop = key;
        if (alias[prop] !== void 0) {
          const value = alias[prop];
          if (result[prop] === void 0) {
            result[prop] = value;
            continue;
          }
          switch (prop) {
            case "rotate":
              result[prop] = (result[prop] + value) % 4;
              break;
            case "hFlip":
            case "vFlip":
              result[prop] = value !== result[prop];
              break;
            default:
              result[prop] = value;
          }
        }
      }
      return result;
    }

    // src/icon-set/get-icon.ts
    function getIconData$1(data, name, full = false) {
      function getIcon(name2, iteration) {
        var _a, _b, _c, _d;
        if (data.icons[name2] !== void 0) {
          return Object.assign({}, data.icons[name2]);
        }
        if (iteration > 5) {
          return null;
        }
        if (((_a = data.aliases) == null ? void 0 : _a[name2]) !== void 0) {
          const item = (_b = data.aliases) == null ? void 0 : _b[name2];
          const result2 = getIcon(item.parent, iteration + 1);
          if (result2) {
            return mergeIconData(result2, item);
          }
          return result2;
        }
        if (iteration === 0 && ((_c = data.chars) == null ? void 0 : _c[name2]) !== void 0) {
          return getIcon((_d = data.chars) == null ? void 0 : _d[name2], iteration + 1);
        }
        return null;
      }
      const result = getIcon(name, 0);
      if (result) {
        for (const key in iconDefaults) {
          if (result[key] === void 0 && data[key] !== void 0) {
            result[key] = data[key];
          }
        }
      }
      return result && full ? fullIcon(result) : result;
    }

    // src/icon-set/validate.ts
    var matchChar = /^[a-f0-9]+(-[a-f0-9]+)*$/;
    function validateIconProps(item, fix) {
      for (const key in item) {
        const attr = key;
        const value = item[attr];
        const type = typeof value;
        if (type === "undefined") {
          delete item[attr];
          continue;
        }
        switch (key) {
          case "body":
          case "parent":
            if (type !== "string") {
              return key;
            }
            break;
          case "hFlip":
          case "vFlip":
          case "hidden":
            if (type !== "boolean") {
              if (fix) {
                delete item[attr];
              } else {
                return key;
              }
            }
            break;
          case "width":
          case "height":
          case "left":
          case "top":
          case "rotate":
          case "inlineHeight":
          case "inlineTop":
          case "verticalAlign":
            if (type !== "number") {
              if (fix) {
                delete item[attr];
              } else {
                return key;
              }
            }
            break;
          default:
            if (type === "object") {
              if (fix) {
                delete item[attr];
              } else {
                return key;
              }
            }
        }
      }
      return null;
    }
    function validateIconSet(obj, options) {
      const fix = !!(options == null ? void 0 : options.fix);
      if (typeof obj !== "object" || obj === null || typeof obj.icons !== "object" || !obj.icons) {
        throw new Error("Bad icon set");
      }
      const data = obj;
      if (typeof (options == null ? void 0 : options.prefix) === "string") {
        data.prefix = options.prefix;
      } else if (typeof data.prefix !== "string" || !data.prefix.match(matchName)) {
        throw new Error("Invalid prefix");
      }
      if (typeof (options == null ? void 0 : options.provider) === "string") {
        data.provider = options.provider;
      } else if (data.provider !== void 0) {
        const value = data.provider;
        if (typeof value !== "string" || value !== "" && !value.match(matchName)) {
          if (fix) {
            delete data.provider;
          } else {
            throw new Error("Invalid provider");
          }
        }
      }
      const icons = data.icons;
      Object.keys(icons).forEach((name) => {
        if (!name.match(matchName)) {
          if (fix) {
            delete icons[name];
            return;
          }
          throw new Error(`Invalid icon name: "${name}"`);
        }
        const item = icons[name];
        if (typeof item !== "object" || item === null || typeof item.body !== "string") {
          if (fix) {
            delete icons[name];
            return;
          }
          throw new Error(`Invalid icon: "${name}"`);
        }
        const key = typeof item.parent === "string" ? "parent" : validateIconProps(item, fix);
        if (key !== null) {
          if (fix) {
            delete icons[name];
            return;
          }
          throw new Error(`Invalid property "${key}" in icon "${name}"`);
        }
      });
      if (!Object.keys(data.icons).length) {
        throw new Error("Icon set is empty");
      }
      if (data.aliases !== void 0) {
        if (typeof data.aliases !== "object" || data.aliases === null) {
          if (fix) {
            delete data.aliases;
          } else {
            throw new Error("Invalid aliases list");
          }
        }
      }
      if (typeof data.aliases === "object") {
        let validateAlias = function(name, iteration) {
          if (validatedAliases.has(name)) {
            return !failedAliases.has(name);
          }
          const item = aliases[name];
          if (iteration > 5 || typeof item !== "object" || item === null || typeof item.parent !== "string" || !name.match(matchName)) {
            if (fix) {
              delete aliases[name];
              failedAliases.add(name);
              return false;
            }
            throw new Error(`Invalid icon alias: "${name}"`);
          }
          const parent = item.parent;
          if (data.icons[parent] === void 0) {
            if (aliases[parent] === void 0 || !validateAlias(parent, iteration + 1)) {
              if (fix) {
                delete aliases[name];
                failedAliases.add(name);
                return false;
              }
              throw new Error(`Missing parent icon for alias "${name}`);
            }
          }
          if (fix && item.body !== void 0) {
            delete item.body;
          }
          const key = item.body !== void 0 ? "body" : validateIconProps(item, fix);
          if (key !== null) {
            if (fix) {
              delete aliases[name];
              failedAliases.add(name);
              return false;
            }
            throw new Error(`Invalid property "${key}" in alias "${name}"`);
          }
          validatedAliases.add(name);
          return true;
        };
        const aliases = data.aliases;
        const validatedAliases = new Set();
        const failedAliases = new Set();
        Object.keys(aliases).forEach((name) => {
          validateAlias(name, 0);
        });
        if (fix && !Object.keys(data.aliases).length) {
          delete data.aliases;
        }
      }
      Object.keys(iconDefaults).forEach((prop) => {
        const expectedType = typeof iconDefaults[prop];
        const actualType = typeof data[prop];
        if (actualType !== "undefined" && actualType !== expectedType) {
          throw new Error(`Invalid value type for "${prop}"`);
        }
      });
      if (data.chars !== void 0) {
        if (typeof data.chars !== "object" || data.chars === null) {
          if (fix) {
            delete data.chars;
          } else {
            throw new Error("Invalid characters map");
          }
        }
      }
      if (typeof data.chars === "object") {
        const chars = data.chars;
        Object.keys(chars).forEach((char) => {
          var _a;
          if (!char.match(matchChar) || typeof chars[char] !== "string") {
            if (fix) {
              delete chars[char];
              return;
            }
            throw new Error(`Invalid character "${char}"`);
          }
          const target = chars[char];
          if (data.icons[target] === void 0 && ((_a = data.aliases) == null ? void 0 : _a[target]) === void 0) {
            if (fix) {
              delete chars[char];
              return;
            }
            throw new Error(`Character "${char}" points to missing icon "${target}"`);
          }
        });
        if (fix && !Object.keys(data.chars).length) {
          delete data.chars;
        }
      }
      return data;
    }

    // src/icon-set/parse.ts
    function isVariation(item) {
      for (const key in iconDefaults) {
        if (item[key] !== void 0) {
          return true;
        }
      }
      return false;
    }
    function parseIconSet(data, callback, options) {
      options = options || {};
      const names = [];
      if (typeof data !== "object" || typeof data.icons !== "object") {
        return names;
      }
      const validate = options.validate;
      if (validate !== false) {
        try {
          validateIconSet(data, typeof validate === "object" ? validate : { fix: true });
        } catch (err) {
          return names;
        }
      }
      if (data.not_found instanceof Array) {
        data.not_found.forEach((name) => {
          callback(name, null);
          names.push(name);
        });
      }
      const icons = data.icons;
      Object.keys(icons).forEach((name) => {
        const iconData = getIconData$1(data, name, true);
        if (iconData) {
          callback(name, iconData);
          names.push(name);
        }
      });
      const parseAliases = options.aliases || "all";
      if (parseAliases !== "none" && typeof data.aliases === "object") {
        const aliases = data.aliases;
        Object.keys(aliases).forEach((name) => {
          if (parseAliases === "variations" && isVariation(aliases[name])) {
            return;
          }
          const iconData = getIconData$1(data, name, true);
          if (iconData) {
            callback(name, iconData);
            names.push(name);
          }
        });
      }
      return names;
    }

    // src/storage/storage.ts
    var storage$1 = Object.create(null);
    function newStorage(provider, prefix) {
      return {
        provider,
        prefix,
        icons: Object.create(null),
        missing: Object.create(null)
      };
    }
    function getStorage(provider, prefix) {
      if (storage$1[provider] === void 0) {
        storage$1[provider] = Object.create(null);
      }
      const providerStorage = storage$1[provider];
      if (providerStorage[prefix] === void 0) {
        providerStorage[prefix] = newStorage(provider, prefix);
      }
      return providerStorage[prefix];
    }
    function addIconSet(storage2, data) {
      const t = Date.now();
      return parseIconSet(data, (name, icon) => {
        if (icon) {
          storage2.icons[name] = icon;
        } else {
          storage2.missing[name] = t;
        }
      });
    }
    function addIconToStorage(storage2, name, icon) {
      try {
        if (typeof icon.body === "string") {
          storage2.icons[name] = Object.freeze(fullIcon(icon));
          return true;
        }
      } catch (err) {
      }
      return false;
    }
    function getIconFromStorage(storage2, name) {
      const value = storage2.icons[name];
      return value === void 0 ? null : value;
    }
    function listIcons(provider, prefix) {
      let allIcons = [];
      let providers;
      if (typeof provider === "string") {
        providers = [provider];
      } else {
        providers = Object.keys(storage$1);
      }
      providers.forEach((provider2) => {
        let prefixes;
        if (typeof provider2 === "string" && typeof prefix === "string") {
          prefixes = [prefix];
        } else {
          prefixes = storage$1[provider2] === void 0 ? [] : Object.keys(storage$1[provider2]);
        }
        prefixes.forEach((prefix2) => {
          const storage2 = getStorage(provider2, prefix2);
          const icons = Object.keys(storage2.icons).map((name) => (provider2 !== "" ? "@" + provider2 + ":" : "") + prefix2 + ":" + name);
          allIcons = allIcons.concat(icons);
        });
      });
      return allIcons;
    }

    // src/storage/functions.ts
    var simpleNames = false;
    function allowSimpleNames(allow) {
      if (typeof allow === "boolean") {
        simpleNames = allow;
      }
      return simpleNames;
    }
    function getIconData(name) {
      const icon = typeof name === "string" ? stringToIcon(name, true, simpleNames) : name;
      return icon ? getIconFromStorage(getStorage(icon.provider, icon.prefix), icon.name) : null;
    }
    function addIcon(name, data) {
      const icon = stringToIcon(name, true, simpleNames);
      if (!icon) {
        return false;
      }
      const storage = getStorage(icon.provider, icon.prefix);
      return addIconToStorage(storage, icon.name, data);
    }
    function addCollection(data, provider) {
      if (typeof data !== "object") {
        return false;
      }
      if (typeof provider !== "string") {
        provider = typeof data.provider === "string" ? data.provider : "";
      }
      if (simpleNames && provider === "" && (typeof data.prefix !== "string" || data.prefix === "")) {
        let added = false;
        parseIconSet(data, (name, icon) => {
          if (icon && addIcon(name, icon)) {
            added = true;
          }
        }, {
          validate: {
            fix: true,
            prefix: ""
          }
        });
        return added;
      }
      if (typeof data.prefix !== "string" || !validateIcon({
        provider,
        prefix: data.prefix,
        name: "a"
      })) {
        return false;
      }
      const storage = getStorage(provider, data.prefix);
      return !!addIconSet(storage, data);
    }
    function iconExists(name) {
      return getIconData(name) !== null;
    }
    function getIcon(name) {
      const result = getIconData(name);
      return result ? { ...result } : null;
    }

    // src/customisations/index.ts
    var defaults = Object.freeze({
      inline: false,
      width: null,
      height: null,
      hAlign: "center",
      vAlign: "middle",
      slice: false,
      hFlip: false,
      vFlip: false,
      rotate: 0
    });
    function mergeCustomisations(defaults2, item) {
      const result = {};
      for (const key in defaults2) {
        const attr = key;
        result[attr] = defaults2[attr];
        if (item[attr] === void 0) {
          continue;
        }
        const value = item[attr];
        switch (attr) {
          case "inline":
          case "slice":
            if (typeof value === "boolean") {
              result[attr] = value;
            }
            break;
          case "hFlip":
          case "vFlip":
            if (value === true) {
              result[attr] = !result[attr];
            }
            break;
          case "hAlign":
          case "vAlign":
            if (typeof value === "string" && value !== "") {
              result[attr] = value;
            }
            break;
          case "width":
          case "height":
            if (typeof value === "string" && value !== "" || typeof value === "number" && value || value === null) {
              result[attr] = value;
            }
            break;
          case "rotate":
            if (typeof value === "number") {
              result[attr] += value;
            }
            break;
        }
      }
      return result;
    }

    // src/svg/size.ts
    var unitsSplit = /(-?[0-9.]*[0-9]+[0-9.]*)/g;
    var unitsTest = /^-?[0-9.]*[0-9]+[0-9.]*$/g;
    function calculateSize(size, ratio, precision) {
      if (ratio === 1) {
        return size;
      }
      precision = precision === void 0 ? 100 : precision;
      if (typeof size === "number") {
        return Math.ceil(size * ratio * precision) / precision;
      }
      if (typeof size !== "string") {
        return size;
      }
      const oldParts = size.split(unitsSplit);
      if (oldParts === null || !oldParts.length) {
        return size;
      }
      const newParts = [];
      let code = oldParts.shift();
      let isNumber = unitsTest.test(code);
      while (true) {
        if (isNumber) {
          const num = parseFloat(code);
          if (isNaN(num)) {
            newParts.push(code);
          } else {
            newParts.push(Math.ceil(num * ratio * precision) / precision);
          }
        } else {
          newParts.push(code);
        }
        code = oldParts.shift();
        if (code === void 0) {
          return newParts.join("");
        }
        isNumber = !isNumber;
      }
    }

    // src/svg/build.ts
    function preserveAspectRatio(props) {
      let result = "";
      switch (props.hAlign) {
        case "left":
          result += "xMin";
          break;
        case "right":
          result += "xMax";
          break;
        default:
          result += "xMid";
      }
      switch (props.vAlign) {
        case "top":
          result += "YMin";
          break;
        case "bottom":
          result += "YMax";
          break;
        default:
          result += "YMid";
      }
      result += props.slice ? " slice" : " meet";
      return result;
    }
    function iconToSVG(icon, customisations) {
      const box = {
        left: icon.left,
        top: icon.top,
        width: icon.width,
        height: icon.height
      };
      let body = icon.body;
      [icon, customisations].forEach((props) => {
        const transformations = [];
        const hFlip = props.hFlip;
        const vFlip = props.vFlip;
        let rotation = props.rotate;
        if (hFlip) {
          if (vFlip) {
            rotation += 2;
          } else {
            transformations.push("translate(" + (box.width + box.left) + " " + (0 - box.top) + ")");
            transformations.push("scale(-1 1)");
            box.top = box.left = 0;
          }
        } else if (vFlip) {
          transformations.push("translate(" + (0 - box.left) + " " + (box.height + box.top) + ")");
          transformations.push("scale(1 -1)");
          box.top = box.left = 0;
        }
        let tempValue;
        if (rotation < 0) {
          rotation -= Math.floor(rotation / 4) * 4;
        }
        rotation = rotation % 4;
        switch (rotation) {
          case 1:
            tempValue = box.height / 2 + box.top;
            transformations.unshift("rotate(90 " + tempValue + " " + tempValue + ")");
            break;
          case 2:
            transformations.unshift("rotate(180 " + (box.width / 2 + box.left) + " " + (box.height / 2 + box.top) + ")");
            break;
          case 3:
            tempValue = box.width / 2 + box.left;
            transformations.unshift("rotate(-90 " + tempValue + " " + tempValue + ")");
            break;
        }
        if (rotation % 2 === 1) {
          if (box.left !== 0 || box.top !== 0) {
            tempValue = box.left;
            box.left = box.top;
            box.top = tempValue;
          }
          if (box.width !== box.height) {
            tempValue = box.width;
            box.width = box.height;
            box.height = tempValue;
          }
        }
        if (transformations.length) {
          body = '<g transform="' + transformations.join(" ") + '">' + body + "</g>";
        }
      });
      let width, height;
      if (customisations.width === null && customisations.height === null) {
        height = "1em";
        width = calculateSize(height, box.width / box.height);
      } else if (customisations.width !== null && customisations.height !== null) {
        width = customisations.width;
        height = customisations.height;
      } else if (customisations.height !== null) {
        height = customisations.height;
        width = calculateSize(height, box.width / box.height);
      } else {
        width = customisations.width;
        height = calculateSize(width, box.height / box.width);
      }
      if (width === "auto") {
        width = box.width;
      }
      if (height === "auto") {
        height = box.height;
      }
      width = typeof width === "string" ? width : width + "";
      height = typeof height === "string" ? height : height + "";
      const result = {
        attributes: {
          width,
          height,
          preserveAspectRatio: preserveAspectRatio(customisations),
          viewBox: box.left + " " + box.top + " " + box.width + " " + box.height
        },
        body
      };
      if (customisations.inline) {
        result.inline = true;
      }
      return result;
    }

    // src/builder/functions.ts
    function buildIcon(icon, customisations) {
      return iconToSVG(fullIcon(icon), customisations ? mergeCustomisations(defaults, customisations) : defaults);
    }

    // src/svg/id.ts
    var regex = /\sid="(\S+)"/g;
    var randomPrefix = "IconifyId-" + Date.now().toString(16) + "-" + (Math.random() * 16777216 | 0).toString(16) + "-";
    var counter = 0;
    function replaceIDs(body, prefix = randomPrefix) {
      const ids = [];
      let match;
      while (match = regex.exec(body)) {
        ids.push(match[1]);
      }
      if (!ids.length) {
        return body;
      }
      ids.forEach((id) => {
        const newID = typeof prefix === "function" ? prefix(id) : prefix + counter++;
        const escapedID = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        body = body.replace(new RegExp('([#;"])(' + escapedID + ')([")]|\\.[a-z])', "g"), "$1" + newID + "$3");
      });
      return body;
    }

    // src/api/modules.ts
    var storage = Object.create(null);
    function setAPIModule(provider, item) {
      storage[provider] = item;
    }
    function getAPIModule(provider) {
      return storage[provider] || storage[""];
    }

    // src/api/config.ts
    function createAPIConfig(source) {
      let resources;
      if (typeof source.resources === "string") {
        resources = [source.resources];
      } else {
        resources = source.resources;
        if (!(resources instanceof Array) || !resources.length) {
          return null;
        }
      }
      const result = {
        resources,
        path: source.path === void 0 ? "/" : source.path,
        maxURL: source.maxURL ? source.maxURL : 500,
        rotate: source.rotate ? source.rotate : 750,
        timeout: source.timeout ? source.timeout : 5e3,
        random: source.random === true,
        index: source.index ? source.index : 0,
        dataAfterTimeout: source.dataAfterTimeout !== false
      };
      return result;
    }
    var configStorage = Object.create(null);
    var fallBackAPISources = [
      "https://api.simplesvg.com",
      "https://api.unisvg.com"
    ];
    var fallBackAPI = [];
    while (fallBackAPISources.length > 0) {
      if (fallBackAPISources.length === 1) {
        fallBackAPI.push(fallBackAPISources.shift());
      } else {
        if (Math.random() > 0.5) {
          fallBackAPI.push(fallBackAPISources.shift());
        } else {
          fallBackAPI.push(fallBackAPISources.pop());
        }
      }
    }
    configStorage[""] = createAPIConfig({
      resources: ["https://api.iconify.design"].concat(fallBackAPI)
    });
    function addAPIProvider(provider, customConfig) {
      const config = createAPIConfig(customConfig);
      if (config === null) {
        return false;
      }
      configStorage[provider] = config;
      return true;
    }
    function getAPIConfig(provider) {
      return configStorage[provider];
    }
    function listAPIProviders() {
      return Object.keys(configStorage);
    }

    // src/api/params.ts
    var mergeParams = (base, params) => {
      let result = base, hasParams = result.indexOf("?") !== -1;
      function paramToString(value) {
        switch (typeof value) {
          case "boolean":
            return value ? "true" : "false";
          case "number":
            return encodeURIComponent(value);
          case "string":
            return encodeURIComponent(value);
          default:
            throw new Error("Invalid parameter");
        }
      }
      Object.keys(params).forEach((key) => {
        let value;
        try {
          value = paramToString(params[key]);
        } catch (err) {
          return;
        }
        result += (hasParams ? "&" : "?") + encodeURIComponent(key) + "=" + value;
        hasParams = true;
      });
      return result;
    };

    // src/api/modules/fetch.ts
    var maxLengthCache = Object.create(null);
    var pathCache = Object.create(null);
    var detectFetch = () => {
      let callback;
      try {
        callback = fetch;
        if (typeof callback === "function") {
          return callback;
        }
      } catch (err) {
      }
      try {
        const chunk = String.fromCharCode(114) + String.fromCharCode(101);
        const req = global[chunk + "qui" + chunk];
        callback = req("cross-fetch");
        if (typeof callback === "function") {
          return callback;
        }
      } catch (err) {
      }
      return null;
    };
    var fetchModule = detectFetch();
    function setFetch(fetch2) {
      fetchModule = fetch2;
    }
    function calculateMaxLength(provider, prefix) {
      const config = getAPIConfig(provider);
      if (!config) {
        return 0;
      }
      let result;
      if (!config.maxURL) {
        result = 0;
      } else {
        let maxHostLength = 0;
        config.resources.forEach((item) => {
          const host = item;
          maxHostLength = Math.max(maxHostLength, host.length);
        });
        const url = mergeParams(prefix + ".json", {
          icons: ""
        });
        result = config.maxURL - maxHostLength - config.path.length - url.length;
      }
      const cacheKey = provider + ":" + prefix;
      pathCache[provider] = config.path;
      maxLengthCache[cacheKey] = result;
      return result;
    }
    var prepare = (provider, prefix, icons) => {
      const results = [];
      let maxLength = maxLengthCache[prefix];
      if (maxLength === void 0) {
        maxLength = calculateMaxLength(provider, prefix);
      }
      const type = "icons";
      let item = {
        type,
        provider,
        prefix,
        icons: []
      };
      let length = 0;
      icons.forEach((name, index) => {
        length += name.length + 1;
        if (length >= maxLength && index > 0) {
          results.push(item);
          item = {
            type,
            provider,
            prefix,
            icons: []
          };
          length = name.length;
        }
        item.icons.push(name);
      });
      results.push(item);
      return results;
    };
    function getPath(provider) {
      if (typeof provider === "string") {
        if (pathCache[provider] === void 0) {
          const config = getAPIConfig(provider);
          if (!config) {
            return "/";
          }
          pathCache[provider] = config.path;
        }
        return pathCache[provider];
      }
      return "/";
    }
    var send = (host, params, status) => {
      if (!fetchModule) {
        status.done(void 0, 424);
        return;
      }
      let path = getPath(params.provider);
      switch (params.type) {
        case "icons": {
          const prefix = params.prefix;
          const icons = params.icons;
          const iconsList = icons.join(",");
          path += mergeParams(prefix + ".json", {
            icons: iconsList
          });
          break;
        }
        case "custom": {
          const uri = params.uri;
          path += uri.slice(0, 1) === "/" ? uri.slice(1) : uri;
          break;
        }
        default:
          status.done(void 0, 400);
          return;
      }
      let defaultError = 503;
      fetchModule(host + path).then((response) => {
        if (response.status !== 200) {
          setTimeout(() => {
            status.done(void 0, response.status);
          });
          return;
        }
        defaultError = 501;
        return response.json();
      }).then((data) => {
        if (typeof data !== "object" || data === null) {
          setTimeout(() => {
            status.done(void 0, defaultError);
          });
          return;
        }
        setTimeout(() => {
          status.done(data);
        });
      }).catch(() => {
        status.done(void 0, defaultError);
      });
    };
    var fetchAPIModule = {
      prepare,
      send
    };

    // src/icon/sort.ts
    function sortIcons(icons) {
      const result = {
        loaded: [],
        missing: [],
        pending: []
      };
      const storage = Object.create(null);
      icons.sort((a, b) => {
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider);
        }
        if (a.prefix !== b.prefix) {
          return a.prefix.localeCompare(b.prefix);
        }
        return a.name.localeCompare(b.name);
      });
      let lastIcon = {
        provider: "",
        prefix: "",
        name: ""
      };
      icons.forEach((icon) => {
        if (lastIcon.name === icon.name && lastIcon.prefix === icon.prefix && lastIcon.provider === icon.provider) {
          return;
        }
        lastIcon = icon;
        const provider = icon.provider;
        const prefix = icon.prefix;
        const name = icon.name;
        if (storage[provider] === void 0) {
          storage[provider] = Object.create(null);
        }
        const providerStorage = storage[provider];
        if (providerStorage[prefix] === void 0) {
          providerStorage[prefix] = getStorage(provider, prefix);
        }
        const localStorage = providerStorage[prefix];
        let list;
        if (localStorage.icons[name] !== void 0) {
          list = result.loaded;
        } else if (prefix === "" || localStorage.missing[name] !== void 0) {
          list = result.missing;
        } else {
          list = result.pending;
        }
        const item = {
          provider,
          prefix,
          name
        };
        list.push(item);
      });
      return result;
    }

    // src/api/callbacks.ts
    var callbacks = Object.create(null);
    var pendingUpdates = Object.create(null);
    function removeCallback(sources, id) {
      sources.forEach((source) => {
        const provider = source.provider;
        if (callbacks[provider] === void 0) {
          return;
        }
        const providerCallbacks = callbacks[provider];
        const prefix = source.prefix;
        const items = providerCallbacks[prefix];
        if (items) {
          providerCallbacks[prefix] = items.filter((row) => row.id !== id);
        }
      });
    }
    function updateCallbacks(provider, prefix) {
      if (pendingUpdates[provider] === void 0) {
        pendingUpdates[provider] = Object.create(null);
      }
      const providerPendingUpdates = pendingUpdates[provider];
      if (!providerPendingUpdates[prefix]) {
        providerPendingUpdates[prefix] = true;
        setTimeout(() => {
          providerPendingUpdates[prefix] = false;
          if (callbacks[provider] === void 0 || callbacks[provider][prefix] === void 0) {
            return;
          }
          const items = callbacks[provider][prefix].slice(0);
          if (!items.length) {
            return;
          }
          const storage = getStorage(provider, prefix);
          let hasPending = false;
          items.forEach((item) => {
            const icons = item.icons;
            const oldLength = icons.pending.length;
            icons.pending = icons.pending.filter((icon) => {
              if (icon.prefix !== prefix) {
                return true;
              }
              const name = icon.name;
              if (storage.icons[name] !== void 0) {
                icons.loaded.push({
                  provider,
                  prefix,
                  name
                });
              } else if (storage.missing[name] !== void 0) {
                icons.missing.push({
                  provider,
                  prefix,
                  name
                });
              } else {
                hasPending = true;
                return true;
              }
              return false;
            });
            if (icons.pending.length !== oldLength) {
              if (!hasPending) {
                removeCallback([
                  {
                    provider,
                    prefix
                  }
                ], item.id);
              }
              item.callback(icons.loaded.slice(0), icons.missing.slice(0), icons.pending.slice(0), item.abort);
            }
          });
        });
      }
    }
    var idCounter = 0;
    function storeCallback(callback, icons, pendingSources) {
      const id = idCounter++;
      const abort = removeCallback.bind(null, pendingSources, id);
      if (!icons.pending.length) {
        return abort;
      }
      const item = {
        id,
        icons,
        callback,
        abort
      };
      pendingSources.forEach((source) => {
        const provider = source.provider;
        const prefix = source.prefix;
        if (callbacks[provider] === void 0) {
          callbacks[provider] = Object.create(null);
        }
        const providerCallbacks = callbacks[provider];
        if (providerCallbacks[prefix] === void 0) {
          providerCallbacks[prefix] = [];
        }
        providerCallbacks[prefix].push(item);
      });
      return abort;
    }

    // src/icon/list.ts
    function listToIcons(list, validate = true, simpleNames = false) {
      const result = [];
      list.forEach((item) => {
        const icon = typeof item === "string" ? stringToIcon(item, false, simpleNames) : item;
        if (!validate || validateIcon(icon, simpleNames)) {
          result.push({
            provider: icon.provider,
            prefix: icon.prefix,
            name: icon.name
          });
        }
      });
      return result;
    }

    // src/config.ts
    var defaultConfig = {
      resources: [],
      index: 0,
      timeout: 2e3,
      rotate: 750,
      random: false,
      dataAfterTimeout: false
    };

    // src/query.ts
    function sendQuery(config, payload, query, done, success) {
      const resourcesCount = config.resources.length;
      const startIndex = config.random ? Math.floor(Math.random() * resourcesCount) : config.index;
      let resources;
      if (config.random) {
        let list = config.resources.slice(0);
        resources = [];
        while (list.length > 1) {
          const nextIndex = Math.floor(Math.random() * list.length);
          resources.push(list[nextIndex]);
          list = list.slice(0, nextIndex).concat(list.slice(nextIndex + 1));
        }
        resources = resources.concat(list);
      } else {
        resources = config.resources.slice(startIndex).concat(config.resources.slice(0, startIndex));
      }
      const startTime = Date.now();
      let status = "pending";
      let queriesSent = 0;
      let lastError = void 0;
      let timer = null;
      let queue = [];
      let doneCallbacks = [];
      if (typeof done === "function") {
        doneCallbacks.push(done);
      }
      function resetTimer() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      }
      function abort() {
        if (status === "pending") {
          status = "aborted";
        }
        resetTimer();
        queue.forEach((item) => {
          if (item.abort) {
            item.abort();
          }
          if (item.status === "pending") {
            item.status = "aborted";
          }
        });
        queue = [];
      }
      function subscribe(callback, overwrite) {
        if (overwrite) {
          doneCallbacks = [];
        }
        if (typeof callback === "function") {
          doneCallbacks.push(callback);
        }
      }
      function getQueryStatus() {
        return {
          startTime,
          payload,
          status,
          queriesSent,
          queriesPending: queue.length,
          subscribe,
          abort
        };
      }
      function failQuery() {
        status = "failed";
        doneCallbacks.forEach((callback) => {
          callback(void 0, lastError);
        });
      }
      function clearQueue() {
        queue = queue.filter((item) => {
          if (item.status === "pending") {
            item.status = "aborted";
          }
          if (item.abort) {
            item.abort();
          }
          return false;
        });
      }
      function moduleResponse(item, data, error) {
        const isError = data === void 0;
        queue = queue.filter((queued) => queued !== item);
        switch (status) {
          case "pending":
            break;
          case "failed":
            if (isError || !config.dataAfterTimeout) {
              return;
            }
            break;
          default:
            return;
        }
        if (isError) {
          if (error !== void 0) {
            lastError = error;
          }
          if (!queue.length) {
            if (!resources.length) {
              failQuery();
            } else {
              execNext();
            }
          }
          return;
        }
        resetTimer();
        clearQueue();
        if (success && !config.random) {
          const index = config.resources.indexOf(item.resource);
          if (index !== -1 && index !== config.index) {
            success(index);
          }
        }
        status = "completed";
        doneCallbacks.forEach((callback) => {
          callback(data);
        });
      }
      function execNext() {
        if (status !== "pending") {
          return;
        }
        resetTimer();
        const resource = resources.shift();
        if (resource === void 0) {
          if (queue.length) {
            const timeout2 = typeof config.timeout === "function" ? config.timeout(startTime) : config.timeout;
            if (timeout2) {
              timer = setTimeout(() => {
                resetTimer();
                if (status === "pending") {
                  clearQueue();
                  failQuery();
                }
              }, timeout2);
              return;
            }
          }
          failQuery();
          return;
        }
        const item = {
          getQueryStatus,
          status: "pending",
          resource,
          done: (data, error) => {
            moduleResponse(item, data, error);
          }
        };
        queue.push(item);
        queriesSent++;
        const timeout = typeof config.rotate === "function" ? config.rotate(queriesSent, startTime) : config.rotate;
        timer = setTimeout(execNext, timeout);
        query(resource, payload, item);
      }
      setTimeout(execNext);
      return getQueryStatus;
    }

    // src/index.ts
    function setConfig(config) {
      if (typeof config !== "object" || typeof config.resources !== "object" || !(config.resources instanceof Array) || !config.resources.length) {
        throw new Error("Invalid Reduncancy configuration");
      }
      const newConfig = Object.create(null);
      let key;
      for (key in defaultConfig) {
        if (config[key] !== void 0) {
          newConfig[key] = config[key];
        } else {
          newConfig[key] = defaultConfig[key];
        }
      }
      return newConfig;
    }
    function initRedundancy(cfg) {
      const config = setConfig(cfg);
      let queries = [];
      function cleanup() {
        queries = queries.filter((item) => item().status === "pending");
      }
      function query(payload, queryCallback, doneCallback) {
        const query2 = sendQuery(config, payload, queryCallback, (data, error) => {
          cleanup();
          if (doneCallback) {
            doneCallback(data, error);
          }
        }, (newIndex) => {
          config.index = newIndex;
        });
        queries.push(query2);
        return query2;
      }
      function find(callback) {
        const result = queries.find((value) => {
          return callback(value);
        });
        return result !== void 0 ? result : null;
      }
      const instance = {
        query,
        find,
        setIndex: (index) => {
          config.index = index;
        },
        getIndex: () => config.index,
        cleanup
      };
      return instance;
    }

    // src/api/query.ts
    function emptyCallback$1() {
    }
    var redundancyCache = Object.create(null);
    function getRedundancyCache(provider) {
      if (redundancyCache[provider] === void 0) {
        const config = getAPIConfig(provider);
        if (!config) {
          return;
        }
        const redundancy = initRedundancy(config);
        const cachedReundancy = {
          config,
          redundancy
        };
        redundancyCache[provider] = cachedReundancy;
      }
      return redundancyCache[provider];
    }
    function sendAPIQuery(target, query, callback) {
      let redundancy;
      let send;
      if (typeof target === "string") {
        const api = getAPIModule(target);
        if (!api) {
          callback(void 0, 424);
          return emptyCallback$1;
        }
        send = api.send;
        const cached = getRedundancyCache(target);
        if (cached) {
          redundancy = cached.redundancy;
        }
      } else {
        const config = createAPIConfig(target);
        if (config) {
          redundancy = initRedundancy(config);
          const moduleKey = target.resources ? target.resources[0] : "";
          const api = getAPIModule(moduleKey);
          if (api) {
            send = api.send;
          }
        }
      }
      if (!redundancy || !send) {
        callback(void 0, 424);
        return emptyCallback$1;
      }
      return redundancy.query(query, send, callback)().abort;
    }

    // src/cache.ts
    var cache = {};

    // src/api/icons.ts
    function emptyCallback() {
    }
    var pendingIcons = Object.create(null);
    var iconsToLoad = Object.create(null);
    var loaderFlags = Object.create(null);
    var queueFlags = Object.create(null);
    function loadedNewIcons(provider, prefix) {
      if (loaderFlags[provider] === void 0) {
        loaderFlags[provider] = Object.create(null);
      }
      const providerLoaderFlags = loaderFlags[provider];
      if (!providerLoaderFlags[prefix]) {
        providerLoaderFlags[prefix] = true;
        setTimeout(() => {
          providerLoaderFlags[prefix] = false;
          updateCallbacks(provider, prefix);
        });
      }
    }
    var errorsCache = Object.create(null);
    function loadNewIcons(provider, prefix, icons) {
      function err() {
        const key = (provider === "" ? "" : "@" + provider + ":") + prefix;
        const time = Math.floor(Date.now() / 6e4);
        if (errorsCache[key] < time) {
          errorsCache[key] = time;
          console.error('Unable to retrieve icons for "' + key + '" because API is not configured properly.');
        }
      }
      if (iconsToLoad[provider] === void 0) {
        iconsToLoad[provider] = Object.create(null);
      }
      const providerIconsToLoad = iconsToLoad[provider];
      if (queueFlags[provider] === void 0) {
        queueFlags[provider] = Object.create(null);
      }
      const providerQueueFlags = queueFlags[provider];
      if (pendingIcons[provider] === void 0) {
        pendingIcons[provider] = Object.create(null);
      }
      const providerPendingIcons = pendingIcons[provider];
      if (providerIconsToLoad[prefix] === void 0) {
        providerIconsToLoad[prefix] = icons;
      } else {
        providerIconsToLoad[prefix] = providerIconsToLoad[prefix].concat(icons).sort();
      }
      if (!providerQueueFlags[prefix]) {
        providerQueueFlags[prefix] = true;
        setTimeout(() => {
          providerQueueFlags[prefix] = false;
          const icons2 = providerIconsToLoad[prefix];
          delete providerIconsToLoad[prefix];
          const api = getAPIModule(provider);
          if (!api) {
            err();
            return;
          }
          const params = api.prepare(provider, prefix, icons2);
          params.forEach((item) => {
            sendAPIQuery(provider, item, (data, error) => {
              const storage = getStorage(provider, prefix);
              if (typeof data !== "object") {
                if (error !== 404) {
                  return;
                }
                const t = Date.now();
                item.icons.forEach((name) => {
                  storage.missing[name] = t;
                });
              } else {
                try {
                  const parsed = addIconSet(storage, data);
                  if (!parsed.length) {
                    return;
                  }
                  const pending = providerPendingIcons[prefix];
                  parsed.forEach((name) => {
                    delete pending[name];
                  });
                  if (cache.store) {
                    cache.store(provider, data);
                  }
                } catch (err2) {
                  console.error(err2);
                }
              }
              loadedNewIcons(provider, prefix);
            });
          });
        });
      }
    }
    var loadIcons = (icons, callback) => {
      const cleanedIcons = listToIcons(icons, true, allowSimpleNames());
      const sortedIcons = sortIcons(cleanedIcons);
      if (!sortedIcons.pending.length) {
        let callCallback = true;
        if (callback) {
          setTimeout(() => {
            if (callCallback) {
              callback(sortedIcons.loaded, sortedIcons.missing, sortedIcons.pending, emptyCallback);
            }
          });
        }
        return () => {
          callCallback = false;
        };
      }
      const newIcons = Object.create(null);
      const sources = [];
      let lastProvider, lastPrefix;
      sortedIcons.pending.forEach((icon) => {
        const provider = icon.provider;
        const prefix = icon.prefix;
        if (prefix === lastPrefix && provider === lastProvider) {
          return;
        }
        lastProvider = provider;
        lastPrefix = prefix;
        sources.push({
          provider,
          prefix
        });
        if (pendingIcons[provider] === void 0) {
          pendingIcons[provider] = Object.create(null);
        }
        const providerPendingIcons = pendingIcons[provider];
        if (providerPendingIcons[prefix] === void 0) {
          providerPendingIcons[prefix] = Object.create(null);
        }
        if (newIcons[provider] === void 0) {
          newIcons[provider] = Object.create(null);
        }
        const providerNewIcons = newIcons[provider];
        if (providerNewIcons[prefix] === void 0) {
          providerNewIcons[prefix] = [];
        }
      });
      const time = Date.now();
      sortedIcons.pending.forEach((icon) => {
        const provider = icon.provider;
        const prefix = icon.prefix;
        const name = icon.name;
        const pendingQueue = pendingIcons[provider][prefix];
        if (pendingQueue[name] === void 0) {
          pendingQueue[name] = time;
          newIcons[provider][prefix].push(name);
        }
      });
      sources.forEach((source) => {
        const provider = source.provider;
        const prefix = source.prefix;
        if (newIcons[provider][prefix].length) {
          loadNewIcons(provider, prefix, newIcons[provider][prefix]);
        }
      });
      return callback ? storeCallback(callback, sortedIcons, sources) : emptyCallback;
    };

    // src/browser-storage/index.ts
    var cacheVersion = "iconify2";
    var cachePrefix = "iconify";
    var countKey = cachePrefix + "-count";
    var versionKey = cachePrefix + "-version";
    var hour = 36e5;
    var cacheExpiration = 168;
    var config = {
      local: true,
      session: true
    };
    var loaded = false;
    var count = {
      local: 0,
      session: 0
    };
    var emptyList = {
      local: [],
      session: []
    };
    var _window = typeof window === "undefined" ? {} : window;
    function getGlobal(key) {
      const attr = key + "Storage";
      try {
        if (_window && _window[attr] && typeof _window[attr].length === "number") {
          return _window[attr];
        }
      } catch (err) {
      }
      config[key] = false;
      return null;
    }
    function setCount(storage, key, value) {
      try {
        storage.setItem(countKey, value + "");
        count[key] = value;
        return true;
      } catch (err) {
        return false;
      }
    }
    function getCount(storage) {
      const count2 = storage.getItem(countKey);
      if (count2) {
        const total = parseInt(count2);
        return total ? total : 0;
      }
      return 0;
    }
    function initCache(storage, key) {
      try {
        storage.setItem(versionKey, cacheVersion);
      } catch (err) {
      }
      setCount(storage, key, 0);
    }
    function destroyCache(storage) {
      try {
        const total = getCount(storage);
        for (let i = 0; i < total; i++) {
          storage.removeItem(cachePrefix + i);
        }
      } catch (err) {
      }
    }
    var loadCache = () => {
      if (loaded) {
        return;
      }
      loaded = true;
      const minTime = Math.floor(Date.now() / hour) - cacheExpiration;
      function load(key) {
        const func = getGlobal(key);
        if (!func) {
          return;
        }
        const getItem = (index) => {
          const name = cachePrefix + index;
          const item = func.getItem(name);
          if (typeof item !== "string") {
            return false;
          }
          let valid = true;
          try {
            const data = JSON.parse(item);
            if (typeof data !== "object" || typeof data.cached !== "number" || data.cached < minTime || typeof data.provider !== "string" || typeof data.data !== "object" || typeof data.data.prefix !== "string") {
              valid = false;
            } else {
              const provider = data.provider;
              const prefix = data.data.prefix;
              const storage = getStorage(provider, prefix);
              valid = addIconSet(storage, data.data).length > 0;
            }
          } catch (err) {
            valid = false;
          }
          if (!valid) {
            func.removeItem(name);
          }
          return valid;
        };
        try {
          const version = func.getItem(versionKey);
          if (version !== cacheVersion) {
            if (version) {
              destroyCache(func);
            }
            initCache(func, key);
            return;
          }
          let total = getCount(func);
          for (let i = total - 1; i >= 0; i--) {
            if (!getItem(i)) {
              if (i === total - 1) {
                total--;
              } else {
                emptyList[key].push(i);
              }
            }
          }
          setCount(func, key, total);
        } catch (err) {
        }
      }
      for (const key in config) {
        load(key);
      }
    };
    var storeCache = (provider, data) => {
      if (!loaded) {
        loadCache();
      }
      function store(key) {
        if (!config[key]) {
          return false;
        }
        const func = getGlobal(key);
        if (!func) {
          return false;
        }
        let index = emptyList[key].shift();
        if (index === void 0) {
          index = count[key];
          if (!setCount(func, key, index + 1)) {
            return false;
          }
        }
        try {
          const item = {
            cached: Math.floor(Date.now() / hour),
            provider,
            data
          };
          func.setItem(cachePrefix + index, JSON.stringify(item));
        } catch (err) {
          return false;
        }
        return true;
      }
      if (!store("local")) {
        store("session");
      }
    };

    // src/browser-storage/functions.ts
    function toggleBrowserCache(storage, value) {
      switch (storage) {
        case "local":
        case "session":
          config[storage] = value;
          break;
        case "all":
          for (const key in config) {
            config[key] = value;
          }
          break;
      }
    }

    // src/customisations/shorthand.ts
    var separator = /[\s,]+/;
    function flipFromString(custom, flip) {
      flip.split(separator).forEach((str) => {
        const value = str.trim();
        switch (value) {
          case "horizontal":
            custom.hFlip = true;
            break;
          case "vertical":
            custom.vFlip = true;
            break;
        }
      });
    }
    function alignmentFromString(custom, align) {
      align.split(separator).forEach((str) => {
        const value = str.trim();
        switch (value) {
          case "left":
          case "center":
          case "right":
            custom.hAlign = value;
            break;
          case "top":
          case "middle":
          case "bottom":
            custom.vAlign = value;
            break;
          case "slice":
          case "crop":
            custom.slice = true;
            break;
          case "meet":
            custom.slice = false;
        }
      });
    }

    // src/customisations/rotate.ts
    function rotateFromString(value, defaultValue = 0) {
      const units = value.replace(/^-?[0-9.]*/, "");
      function cleanup(value2) {
        while (value2 < 0) {
          value2 += 4;
        }
        return value2 % 4;
      }
      if (units === "") {
        const num = parseInt(value);
        return isNaN(num) ? 0 : cleanup(num);
      } else if (units !== value) {
        let split = 0;
        switch (units) {
          case "%":
            split = 25;
            break;
          case "deg":
            split = 90;
        }
        if (split) {
          let num = parseFloat(value.slice(0, value.length - units.length));
          if (isNaN(num)) {
            return 0;
          }
          num = num / split;
          return num % 1 === 0 ? cleanup(num) : 0;
        }
      }
      return defaultValue;
    }

    /**
     * Default SVG attributes
     */
    const svgDefaults = {
        'xmlns': 'http://www.w3.org/2000/svg',
        'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        'aria-hidden': true,
        'role': 'img',
    };
    /**
     * Generate icon from properties
     */
    function render(
    // Icon must be validated before calling this function
    icon, 
    // Properties
    props) {
        const customisations = mergeCustomisations(defaults, props);
        const componentProps = { ...svgDefaults };
        // Create style if missing
        let style = typeof props.style === 'string' ? props.style : '';
        // Get element properties
        for (let key in props) {
            const value = props[key];
            if (value === void 0) {
                continue;
            }
            switch (key) {
                // Properties to ignore
                case 'icon':
                case 'style':
                case 'onLoad':
                    break;
                // Boolean attributes
                case 'inline':
                case 'hFlip':
                case 'vFlip':
                    customisations[key] =
                        value === true || value === 'true' || value === 1;
                    break;
                // Flip as string: 'horizontal,vertical'
                case 'flip':
                    if (typeof value === 'string') {
                        flipFromString(customisations, value);
                    }
                    break;
                // Alignment as string
                case 'align':
                    if (typeof value === 'string') {
                        alignmentFromString(customisations, value);
                    }
                    break;
                // Color: copy to style, add extra ';' in case style is missing it
                case 'color':
                    style =
                        style +
                            (style.length > 0 && style.trim().slice(-1) !== ';'
                                ? ';'
                                : '') +
                            'color: ' +
                            value +
                            '; ';
                    break;
                // Rotation as string
                case 'rotate':
                    if (typeof value === 'string') {
                        customisations[key] = rotateFromString(value);
                    }
                    else if (typeof value === 'number') {
                        customisations[key] = value;
                    }
                    break;
                // Remove aria-hidden
                case 'ariaHidden':
                case 'aria-hidden':
                    if (value !== true && value !== 'true') {
                        delete componentProps['aria-hidden'];
                    }
                    break;
                default:
                    if (key.slice(0, 3) === 'on:') {
                        // Svelte event
                        break;
                    }
                    // Copy missing property if it does not exist in customisations
                    if (defaults[key] === void 0) {
                        componentProps[key] = value;
                    }
            }
        }
        // Generate icon
        const item = iconToSVG(icon, customisations);
        // Add icon stuff
        for (let key in item.attributes) {
            componentProps[key] =
                item.attributes[key];
        }
        if (item.inline) {
            // Style overrides it
            style = 'vertical-align: -0.125em; ' + style;
        }
        // Style
        if (style !== '') {
            componentProps.style = style;
        }
        // Counter for ids based on "id" property to render icons consistently on server and client
        let localCounter = 0;
        const id = props.id;
        // Generate HTML
        return {
            attributes: componentProps,
            body: replaceIDs(item.body, id ? () => id + '-' + localCounter++ : 'iconify-svelte-'),
        };
    }

    /**
     * Enable cache
     */
    function enableCache(storage) {
        toggleBrowserCache(storage, true);
    }
    /**
     * Disable cache
     */
    function disableCache(storage) {
        toggleBrowserCache(storage, false);
    }
    /**
     * Initialise stuff
     */
    // Enable short names
    allowSimpleNames(true);
    // Set API module
    setAPIModule('', fetchAPIModule);
    /**
     * Browser stuff
     */
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
        // Set cache and load existing cache
        cache.store = storeCache;
        loadCache();
        const _window = window;
        // Load icons from global "IconifyPreload"
        if (_window.IconifyPreload !== void 0) {
            const preload = _window.IconifyPreload;
            const err = 'Invalid IconifyPreload syntax.';
            if (typeof preload === 'object' && preload !== null) {
                (preload instanceof Array ? preload : [preload]).forEach((item) => {
                    try {
                        if (
                        // Check if item is an object and not null/array
                        typeof item !== 'object' ||
                            item === null ||
                            item instanceof Array ||
                            // Check for 'icons' and 'prefix'
                            typeof item.icons !== 'object' ||
                            typeof item.prefix !== 'string' ||
                            // Add icon set
                            !addCollection(item)) {
                            console.error(err);
                        }
                    }
                    catch (e) {
                        console.error(err);
                    }
                });
            }
        }
        // Set API from global "IconifyProviders"
        if (_window.IconifyProviders !== void 0) {
            const providers = _window.IconifyProviders;
            if (typeof providers === 'object' && providers !== null) {
                for (let key in providers) {
                    const err = 'IconifyProviders[' + key + '] is invalid.';
                    try {
                        const value = providers[key];
                        if (typeof value !== 'object' ||
                            !value ||
                            value.resources === void 0) {
                            continue;
                        }
                        if (!addAPIProvider(key, value)) {
                            console.error(err);
                        }
                    }
                    catch (e) {
                        console.error(err);
                    }
                }
            }
        }
    }
    /**
     * Check if component needs to be updated
     */
    function checkIconState(icon, state, mounted, callback, onload) {
        // Abort loading icon
        function abortLoading() {
            if (state.loading) {
                state.loading.abort();
                state.loading = null;
            }
        }
        // Icon is an object
        if (typeof icon === 'object' &&
            icon !== null &&
            typeof icon.body === 'string') {
            // Stop loading
            state.name = '';
            abortLoading();
            return { data: fullIcon(icon) };
        }
        // Invalid icon?
        let iconName;
        if (typeof icon !== 'string' ||
            (iconName = stringToIcon(icon, false, true)) === null) {
            abortLoading();
            return null;
        }
        // Load icon
        const data = getIconData(iconName);
        if (data === null) {
            // Icon needs to be loaded
            // Do not load icon until component is mounted
            if (mounted && (!state.loading || state.loading.name !== icon)) {
                // New icon to load
                abortLoading();
                state.name = '';
                state.loading = {
                    name: icon,
                    abort: loadIcons([iconName], callback),
                };
            }
            return null;
        }
        // Icon data is available
        abortLoading();
        if (state.name !== icon) {
            state.name = icon;
            if (onload && !state.destroyed) {
                onload(icon);
            }
        }
        // Add classes
        const classes = ['iconify'];
        if (iconName.prefix !== '') {
            classes.push('iconify--' + iconName.prefix);
        }
        if (iconName.provider !== '') {
            classes.push('iconify--' + iconName.provider);
        }
        return { data, classes };
    }
    /**
     * Generate icon
     */
    function generateIcon(icon, props) {
        return icon ? render(icon, props) : null;
    }
    /**
     * Internal API
     */
    const _api = {
        getAPIConfig,
        setAPIModule,
        sendAPIQuery,
        setFetch,
        listAPIProviders,
        mergeParams,
    };

    /* node_modules\@iconify\svelte\dist\Icon.svelte generated by Svelte v3.44.1 */
    const file$5 = "node_modules\\@iconify\\svelte\\dist\\Icon.svelte";

    // (106:0) {#if data !== null}
    function create_if_block(ctx) {
    	let svg;
    	let raw_value = /*data*/ ctx[0].body + "";
    	let svg_levels = [/*data*/ ctx[0].attributes];
    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$5, 106, 0, 1902);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			svg.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && raw_value !== (raw_value = /*data*/ ctx[0].body + "")) svg.innerHTML = raw_value;			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [dirty & /*data*/ 1 && /*data*/ ctx[0].attributes]));
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(106:0) {#if data !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*data*/ ctx[0] !== null && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[0] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Icon', slots, []);

    	const state = {
    		// Last icon name
    		name: '',
    		// Loading status
    		loading: null,
    		// Destroyed status
    		destroyed: false
    	};

    	// Mounted status
    	let mounted = false;

    	// Callback counter
    	let counter = 0;

    	// Generated data
    	let data;

    	const onLoad = icon => {
    		// Legacy onLoad property
    		if (typeof $$props.onLoad === 'function') {
    			$$props.onLoad(icon);
    		}

    		// on:load event
    		const dispatch = createEventDispatcher();

    		dispatch('load', { icon });
    	};

    	// Increase counter when loaded to force re-calculation of data
    	function loaded() {
    		$$invalidate(3, counter++, counter);
    	}

    	// Force re-render
    	onMount(() => {
    		$$invalidate(2, mounted = true);
    	});

    	// Abort loading when component is destroyed
    	onDestroy(() => {
    		$$invalidate(1, state.destroyed = true, state);

    		if (state.loading) {
    			state.loading.abort();
    			$$invalidate(1, state.loading = null, state);
    		}
    	});

    	$$self.$$set = $$new_props => {
    		$$invalidate(6, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$self.$capture_state = () => ({
    		enableCache,
    		disableCache,
    		iconExists,
    		getIcon,
    		listIcons,
    		addIcon,
    		addCollection,
    		calculateSize,
    		replaceIDs,
    		buildIcon,
    		loadIcons,
    		addAPIProvider,
    		_api,
    		onMount,
    		onDestroy,
    		createEventDispatcher,
    		checkIconState,
    		generateIcon,
    		state,
    		mounted,
    		counter,
    		data,
    		onLoad,
    		loaded
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(6, $$props = assign(assign({}, $$props), $$new_props));
    		if ('mounted' in $$props) $$invalidate(2, mounted = $$new_props.mounted);
    		if ('counter' in $$props) $$invalidate(3, counter = $$new_props.counter);
    		if ('data' in $$props) $$invalidate(0, data = $$new_props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		{
    			const iconData = checkIconState($$props.icon, state, mounted, loaded, onLoad);
    			$$invalidate(0, data = iconData ? generateIcon(iconData.data, $$props) : null);

    			if (data && iconData.classes) {
    				// Add classes
    				$$invalidate(
    					0,
    					data.attributes['class'] = (typeof $$props['class'] === 'string'
    					? $$props['class'] + ' '
    					: '') + iconData.classes.join(' '),
    					data
    				);
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [data, state, mounted, counter];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\Navbar.svelte generated by Svelte v3.44.1 */
    const file$4 = "src\\components\\Navbar.svelte";

    function create_fragment$4(ctx) {
    	let header;
    	let h3;
    	let t1;
    	let nav;
    	let ul;
    	let li0;
    	let a0;
    	let t3;
    	let li1;
    	let a1;
    	let t5;
    	let a2;
    	let t7;
    	let div0;
    	let icon0;
    	let t8;
    	let div3;
    	let div1;
    	let icon1;
    	let t9;
    	let div2;
    	let a3;
    	let t11;
    	let a4;
    	let t13;
    	let a5;
    	let current;
    	let mounted;
    	let dispose;

    	icon0 = new Icon({
    			props: { icon: "ci:menu-duo" },
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { icon: "ant-design:close-outlined" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			h3 = element("h3");
    			h3.textContent = "prsΔd";
    			t1 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Arstation";
    			t3 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Unsplash";
    			t5 = space();
    			a2 = element("a");
    			a2.textContent = "CONTACT";
    			t7 = space();
    			div0 = element("div");
    			create_component(icon0.$$.fragment);
    			t8 = space();
    			div3 = element("div");
    			div1 = element("div");
    			create_component(icon1.$$.fragment);
    			t9 = space();
    			div2 = element("div");
    			a3 = element("a");
    			a3.textContent = "Arstation";
    			t11 = space();
    			a4 = element("a");
    			a4.textContent = "Unsplash";
    			t13 = space();
    			a5 = element("a");
    			a5.textContent = "contact";
    			attr_dev(h3, "class", "logo svelte-1e22w2e");
    			add_location(h3, file$4, 17, 4, 312);
    			attr_dev(a0, "href", "https://heyprsa.artstation.com/");
    			attr_dev(a0, "class", "svelte-1e22w2e");
    			add_location(a0, file$4, 21, 17, 460);
    			attr_dev(li0, "class", "svelte-1e22w2e");
    			add_location(li0, file$4, 21, 12, 455);
    			attr_dev(a1, "href", "https://unsplash.com/@prasadjadhav");
    			attr_dev(a1, "class", "svelte-1e22w2e");
    			add_location(a1, file$4, 22, 17, 540);
    			attr_dev(li1, "class", "svelte-1e22w2e");
    			add_location(li1, file$4, 22, 12, 535);
    			attr_dev(ul, "class", "nav-links svelte-1e22w2e");
    			add_location(ul, file$4, 19, 8, 360);
    			add_location(nav, file$4, 18, 4, 345);
    			attr_dev(a2, "class", "contactbtn svelte-1e22w2e");
    			attr_dev(a2, "href", "/");
    			add_location(a2, file$4, 25, 4, 636);
    			attr_dev(div0, "class", "menubtn svelte-1e22w2e");
    			add_location(div0, file$4, 26, 4, 684);
    			attr_dev(header, "class", "svelte-1e22w2e");
    			add_location(header, file$4, 16, 0, 248);
    			attr_dev(div1, "class", "closebtn svelte-1e22w2e");
    			add_location(div1, file$4, 32, 4, 867);
    			attr_dev(a3, "href", "https://heyprsa.artstation.com/");
    			attr_dev(a3, "class", "svelte-1e22w2e");
    			add_location(a3, file$4, 39, 8, 1117);
    			attr_dev(a4, "href", "https://unsplash.com/@prasadjadhav");
    			attr_dev(a4, "class", "svelte-1e22w2e");
    			add_location(a4, file$4, 40, 8, 1182);
    			attr_dev(a5, "href", "/");
    			attr_dev(a5, "class", "svelte-1e22w2e");
    			add_location(a5, file$4, 41, 8, 1249);
    			attr_dev(div2, "class", "menu-content svelte-1e22w2e");
    			add_location(div2, file$4, 35, 4, 985);
    			attr_dev(div3, "id", "mobile-menu");
    			attr_dev(div3, "class", "menu-slide svelte-1e22w2e");
    			add_location(div3, file$4, 31, 0, 797);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h3);
    			append_dev(header, t1);
    			append_dev(header, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(header, t5);
    			append_dev(header, a2);
    			append_dev(header, t7);
    			append_dev(header, div0);
    			mount_component(icon0, div0, null);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			mount_component(icon1, div1, null);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, a3);
    			append_dev(div2, t11);
    			append_dev(div2, a4);
    			append_dev(div2, t13);
    			append_dev(div2, a5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(icon0);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div3);
    			destroy_component(icon1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function openNav() {
    	document.getElementById("mobile-menu").style.width = "100%";
    }

    function closeNav() {
    	document.getElementById("mobile-menu").style.width = "0";
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => openNav();
    	const click_handler_1 = () => closeNav();
    	$$self.$capture_state = () => ({ Icon, openNav, closeNav });
    	return [click_handler, click_handler_1];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Creations.svelte generated by Svelte v3.44.1 */

    const file$3 = "src\\components\\Creations.svelte";

    function create_fragment$3(ctx) {
    	let div0;
    	let h2;
    	let t1;
    	let div8;
    	let div1;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let div2;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div3;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let t4;
    	let div4;
    	let a3;
    	let img3;
    	let img3_src_value;
    	let t5;
    	let div5;
    	let a4;
    	let img4;
    	let img4_src_value;
    	let t6;
    	let div6;
    	let a5;
    	let img5;
    	let img5_src_value;
    	let t7;
    	let div7;
    	let a6;
    	let img6;
    	let img6_src_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Creations";
    			t1 = space();
    			div8 = element("div");
    			div1 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t2 = space();
    			div2 = element("div");
    			a1 = element("a");
    			img1 = element("img");
    			t3 = space();
    			div3 = element("div");
    			a2 = element("a");
    			img2 = element("img");
    			t4 = space();
    			div4 = element("div");
    			a3 = element("a");
    			img3 = element("img");
    			t5 = space();
    			div5 = element("div");
    			a4 = element("a");
    			img4 = element("img");
    			t6 = space();
    			div6 = element("div");
    			a5 = element("a");
    			img5 = element("img");
    			t7 = space();
    			div7 = element("div");
    			a6 = element("a");
    			img6 = element("img");
    			attr_dev(h2, "class", "svelte-13jhxgx");
    			add_location(h2, file$3, 1, 4, 29);
    			attr_dev(div0, "class", "creations svelte-13jhxgx");
    			add_location(div0, file$3, 0, 0, 0);
    			if (!src_url_equal(img0.src, img0_src_value = "/images/Qivyart.webp")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "A 3D render");
    			attr_dev(img0, "class", "svelte-13jhxgx");
    			add_location(img0, file$3, 6, 12, 150);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$3, 5, 8, 124);
    			attr_dev(div1, "class", "card cardtall");
    			add_location(div1, file$3, 4, 4, 86);
    			if (!src_url_equal(img1.src, img1_src_value = "/images/Depart.webp")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "A Render with spaceships");
    			attr_dev(img1, "class", "svelte-13jhxgx");
    			add_location(img1, file$3, 11, 12, 286);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$3, 10, 8, 260);
    			attr_dev(div2, "class", "card");
    			add_location(div2, file$3, 9, 4, 232);
    			if (!src_url_equal(img2.src, img2_src_value = "/images/DuneEvee.webp")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "A 3D render by prsAd");
    			attr_dev(img2, "class", "svelte-13jhxgx");
    			add_location(img2, file$3, 16, 12, 434);
    			attr_dev(a2, "href", "/");
    			add_location(a2, file$3, 15, 8, 408);
    			attr_dev(div3, "class", "card");
    			add_location(div3, file$3, 14, 4, 380);
    			if (!src_url_equal(img3.src, img3_src_value = "/images/Cruise.webp")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "A 3D render of a cruise");
    			attr_dev(img3, "class", "svelte-13jhxgx");
    			add_location(img3, file$3, 21, 12, 580);
    			attr_dev(a3, "href", "/");
    			add_location(a3, file$3, 20, 8, 554);
    			attr_dev(div4, "class", "card");
    			add_location(div4, file$3, 19, 4, 526);
    			if (!src_url_equal(img4.src, img4_src_value = "/images/firstapproach.webp")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "A 3Drender scene from Arrival");
    			attr_dev(img4, "class", "svelte-13jhxgx");
    			add_location(img4, file$3, 27, 12, 733);
    			attr_dev(a4, "href", "/");
    			add_location(a4, file$3, 26, 8, 707);
    			attr_dev(div5, "class", "card");
    			add_location(div5, file$3, 25, 4, 679);
    			if (!src_url_equal(img5.src, img5_src_value = "/images/Planetblue.webp")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "A 3D render by Prasad Y. Jadhav");
    			attr_dev(img5, "class", "svelte-13jhxgx");
    			add_location(img5, file$3, 33, 12, 895);
    			attr_dev(a5, "href", "/");
    			add_location(a5, file$3, 32, 8, 869);
    			attr_dev(div6, "class", "card");
    			add_location(div6, file$3, 31, 4, 841);
    			if (!src_url_equal(img6.src, img6_src_value = "/images/blades.webp")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "A 3D render by Prasad Y. Jadhav");
    			attr_dev(img6, "class", "svelte-13jhxgx");
    			add_location(img6, file$3, 39, 12, 1060);
    			attr_dev(a6, "href", "/");
    			add_location(a6, file$3, 38, 8, 1034);
    			attr_dev(div7, "class", "card");
    			add_location(div7, file$3, 37, 4, 1006);
    			attr_dev(div8, "class", "photogrid svelte-13jhxgx");
    			add_location(div8, file$3, 3, 0, 57);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h2);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div1);
    			append_dev(div1, a0);
    			append_dev(a0, img0);
    			append_dev(div8, t2);
    			append_dev(div8, div2);
    			append_dev(div2, a1);
    			append_dev(a1, img1);
    			append_dev(div8, t3);
    			append_dev(div8, div3);
    			append_dev(div3, a2);
    			append_dev(a2, img2);
    			append_dev(div8, t4);
    			append_dev(div8, div4);
    			append_dev(div4, a3);
    			append_dev(a3, img3);
    			append_dev(div8, t5);
    			append_dev(div8, div5);
    			append_dev(div5, a4);
    			append_dev(a4, img4);
    			append_dev(div8, t6);
    			append_dev(div8, div6);
    			append_dev(div6, a5);
    			append_dev(a5, img5);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			append_dev(div7, a6);
    			append_dev(a6, img6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Creations', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Creations> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Creations extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Creations",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\Heropage.svelte generated by Svelte v3.44.1 */
    const file$2 = "src\\components\\Heropage.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let creations;
    	let current;
    	creations = new Creations({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Welcome to the Sanctuary";
    			t1 = space();
    			create_component(creations.$$.fragment);
    			attr_dev(h1, "class", "svelte-ig8ozf");
    			add_location(h1, file$2, 8, 4, 133);
    			attr_dev(div0, "class", "image svelte-ig8ozf");
    			add_location(div0, file$2, 7, 4, 108);
    			attr_dev(div1, "class", "bg-image svelte-ig8ozf");
    			add_location(div1, file$2, 6, 0, 80);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			insert_dev(target, t1, anchor);
    			mount_component(creations, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(creations.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(creations.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			destroy_component(creations, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Heropage', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Heropage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Creations });
    	return [];
    }

    class Heropage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Heropage",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Footer.svelte generated by Svelte v3.44.1 */
    const file$1 = "src\\components\\Footer.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let a0;
    	let button;
    	let t1;
    	let div3;
    	let div2;
    	let p;
    	let t2;
    	let br;
    	let t3;
    	let span;
    	let t5;
    	let div1;
    	let a1;
    	let icon0;
    	let t6;
    	let a2;
    	let icon1;
    	let t7;
    	let a3;
    	let icon2;
    	let current;

    	icon0 = new Icon({
    			props: {
    				icon: "cib:twitter",
    				style: "font-size:1.3rem"
    			},
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: {
    				icon: "cib:artstation",
    				style: "font-size:1.3rem"
    			},
    			$$inline: true
    		});

    	icon2 = new Icon({
    			props: {
    				icon: "cib:unsplash",
    				style: "font-size:1.3rem"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			a0 = element("a");
    			button = element("button");
    			button.textContent = "more +";
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			p = element("p");
    			t2 = text("design & build ");
    			br = element("br");
    			t3 = space();
    			span = element("span");
    			span.textContent = "prasad";
    			t5 = space();
    			div1 = element("div");
    			a1 = element("a");
    			create_component(icon0.$$.fragment);
    			t6 = space();
    			a2 = element("a");
    			create_component(icon1.$$.fragment);
    			t7 = space();
    			a3 = element("a");
    			create_component(icon2.$$.fragment);
    			attr_dev(button, "class", "svelte-1thqse2");
    			add_location(button, file$1, 5, 61, 144);
    			attr_dev(a0, "href", "https://heyprsa.artstation.com/");
    			attr_dev(a0, "target", "blank");
    			add_location(a0, file$1, 5, 4, 87);
    			attr_dev(div0, "class", "morebtn svelte-1thqse2");
    			add_location(div0, file$1, 4, 0, 60);
    			add_location(br, file$1, 9, 26, 264);
    			attr_dev(span, "class", "svelte-1thqse2");
    			add_location(span, file$1, 10, 12, 282);
    			attr_dev(p, "class", "svelte-1thqse2");
    			add_location(p, file$1, 9, 8, 246);
    			attr_dev(a1, "href", "https://twitter.com/heyprsA");
    			attr_dev(a1, "target", "blank");
    			attr_dev(a1, "class", "svelte-1thqse2");
    			add_location(a1, file$1, 13, 12, 358);
    			attr_dev(a2, "href", "https://heyprsa.artstation.com/");
    			attr_dev(a2, "target", "blank");
    			attr_dev(a2, "class", "svelte-1thqse2");
    			add_location(a2, file$1, 16, 12, 512);
    			attr_dev(a3, "href", "https://unsplash.com/@prasadjadhav");
    			attr_dev(a3, "target", "blank");
    			attr_dev(a3, "class", "svelte-1thqse2");
    			add_location(a3, file$1, 19, 12, 673);
    			attr_dev(div1, "class", "icons svelte-1thqse2");
    			add_location(div1, file$1, 12, 8, 325);
    			attr_dev(div2, "class", "footer svelte-1thqse2");
    			add_location(div2, file$1, 8, 4, 216);
    			attr_dev(div3, "class", "footercontainer svelte-1thqse2");
    			add_location(div3, file$1, 7, 0, 181);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, a0);
    			append_dev(a0, button);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, p);
    			append_dev(p, t2);
    			append_dev(p, br);
    			append_dev(p, t3);
    			append_dev(p, span);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, a1);
    			mount_component(icon0, a1, null);
    			append_dev(div1, t6);
    			append_dev(div1, a2);
    			mount_component(icon1, a2, null);
    			append_dev(div1, t7);
    			append_dev(div1, a3);
    			mount_component(icon2, a3, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			destroy_component(icon2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Icon });
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.1 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let navbar;
    	let t0;
    	let heropage;
    	let t1;
    	let footer;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	heropage = new Heropage({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(heropage.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(div, "class", "layout svelte-w570d7");
    			add_location(div, file, 10, 1, 182);
    			add_location(main, file, 8, 0, 173);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			mount_component(navbar, div, null);
    			append_dev(div, t0);
    			mount_component(heropage, div, null);
    			append_dev(main, t1);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(heropage.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(heropage.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(heropage);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Heropage, Footer });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
