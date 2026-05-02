var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder2) => {
  try {
    return decoder2(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder2(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// src/constants.ts
var SESSION_COOKIE = "nm_session";
var SESSION_TTL_SECONDS = 12 * 60 * 60;
var PASSWORD_MAX_ITERATIONS = 1e5;
var PASSWORD_ITERATIONS = PASSWORD_MAX_ITERATIONS;
var PASSWORD_ALGORITHM = "pbkdf2-sha256";
var DEFAULT_WINDOW_MINUTES = 30;
var DEFAULT_MAX_EMAIL_BODY_BYTES = 24e6;
var DEFAULT_MAX_EMAIL_HEADERS_BYTES = 2e5;
var CONTENT_CHUNK_BYTES = 5e5;
var DEFAULT_EMAIL_LIMIT = 50;
var MAX_EMAIL_LIMIT = 100;
var MAX_EMAIL_PAGE = 1e4;
var RULE_FIELDS = ["from", "to", "subject", "text", "html", "code"];

// src/utils/encoding.ts
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function utf8Bytes(value) {
  return encoder.encode(value);
}
__name(utf8Bytes, "utf8Bytes");
function utf8ByteLength(value) {
  return utf8Bytes(value).byteLength;
}
__name(utf8ByteLength, "utf8ByteLength");
function base64DecodedByteLength(value) {
  const normalized = value.replace(/\s+/g, "");
  if (!normalized) {
    return 0;
  }
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor(normalized.length * 3 / 4) - padding);
}
__name(base64DecodedByteLength, "base64DecodedByteLength");
function bytesToBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode(...bytes.slice(i, i + 32768));
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
__name(bytesToBase64Url, "bytesToBase64Url");
function base64UrlToBytes(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(base64UrlToBytes, "base64UrlToBytes");
function base64UrlEncodeText(value) {
  return bytesToBase64Url(utf8Bytes(value));
}
__name(base64UrlEncodeText, "base64UrlEncodeText");
function base64UrlDecodeText(value) {
  return decoder.decode(base64UrlToBytes(value));
}
__name(base64UrlDecodeText, "base64UrlDecodeText");
async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", utf8Bytes(value));
  return bytesToBase64Url(new Uint8Array(digest));
}
__name(sha256Base64Url, "sha256Base64Url");
async function hmacSha256Base64Url(secret, value) {
  const key = await crypto.subtle.importKey("raw", utf8Bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, utf8Bytes(value));
  return bytesToBase64Url(new Uint8Array(signature));
}
__name(hmacSha256Base64Url, "hmacSha256Base64Url");
function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}
__name(randomToken, "randomToken");
function timingSafeEqual(left, right) {
  const a = utf8Bytes(left);
  const b = utf8Bytes(right);
  let diff = a.length ^ b.length;
  const maxLength = Math.max(a.length, b.length);
  for (let i = 0; i < maxLength; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");

// src/utils/time.ts
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso, "nowIso");
function minutesAgoIso(minutes, from = /* @__PURE__ */ new Date()) {
  return new Date(from.getTime() - minutes * 6e4).toISOString();
}
__name(minutesAgoIso, "minutesAgoIso");
function isPastIso(value, now = /* @__PURE__ */ new Date()) {
  if (!value) {
    return false;
  }
  return new Date(value).getTime() <= now.getTime();
}
__name(isPastIso, "isPastIso");
function epochSeconds(date = /* @__PURE__ */ new Date()) {
  return Math.floor(date.getTime() / 1e3);
}
__name(epochSeconds, "epochSeconds");

// src/services/auth.ts
function requireSessionSecret(env) {
  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required. Set it with `wrangler secret put SESSION_SECRET`.");
  }
  return env.SESSION_SECRET;
}
__name(requireSessionSecret, "requireSessionSecret");
async function derivePassword(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", utf8Bytes(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return bytesToBase64Url(new Uint8Array(bits));
}
__name(derivePassword, "derivePassword");
async function hashPassword(password) {
  const salt = base64UrlToBytes(randomToken(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return `${PASSWORD_ALGORITHM}$${PASSWORD_ITERATIONS}$${bytesToBase64Url(salt)}$${hash}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, stored) {
  const [algorithm, iterationsText, saltText, expected] = stored.split("$");
  const iterations = Number(iterationsText);
  if (algorithm !== PASSWORD_ALGORITHM || !Number.isInteger(iterations) || iterations <= 0 || iterations > PASSWORD_MAX_ITERATIONS || !saltText || !expected) {
    return false;
  }
  const actual = await derivePassword(password, base64UrlToBytes(saltText), iterations);
  return timingSafeEqual(actual, expected);
}
__name(verifyPassword, "verifyPassword");
async function countAdmins(db) {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM admins").first();
  return row?.count ?? 0;
}
__name(countAdmins, "countAdmins");
async function createAdmin(db, username, password) {
  const passwordHash = await hashPassword(password);
  const result = await db.prepare("INSERT INTO admins (username, password_hash, status) VALUES (?1, ?2, 'active')").bind(username, passwordHash).run();
  return Number(result.meta.last_row_id);
}
__name(createAdmin, "createAdmin");
async function findAdminByUsername(db, username) {
  return await db.prepare("SELECT * FROM admins WHERE username = ?1").bind(username).first();
}
__name(findAdminByUsername, "findAdminByUsername");
async function findAdminById(db, id) {
  return await db.prepare("SELECT * FROM admins WHERE id = ?1").bind(id).first();
}
__name(findAdminById, "findAdminById");
async function authenticateAdmin(db, username, password) {
  const admin = await findAdminByUsername(db, username);
  if (!admin || admin.status !== "active") {
    return null;
  }
  if (!await verifyPassword(password, admin.password_hash)) {
    return null;
  }
  await db.prepare("UPDATE admins SET last_login_at = ?1 WHERE id = ?2").bind(nowIso(), admin.id).run();
  return admin;
}
__name(authenticateAdmin, "authenticateAdmin");
async function createSessionValue(env, admin) {
  const payload = {
    sub: admin.id,
    username: admin.username,
    exp: epochSeconds() + SESSION_TTL_SECONDS
  };
  const encoded = base64UrlEncodeText(JSON.stringify(payload));
  const signature = await hmacSha256Base64Url(requireSessionSecret(env), encoded);
  return `${encoded}.${signature}`;
}
__name(createSessionValue, "createSessionValue");
async function verifySessionValue(db, env, value) {
  if (!value) {
    return null;
  }
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const expected = await hmacSha256Base64Url(requireSessionSecret(env), encoded);
  if (!timingSafeEqual(signature, expected)) {
    return null;
  }
  const payload = JSON.parse(base64UrlDecodeText(encoded));
  if (!payload.sub || payload.exp <= epochSeconds()) {
    return null;
  }
  const admin = await findAdminById(db, payload.sub);
  return admin?.status === "active" ? admin : null;
}
__name(verifySessionValue, "verifySessionValue");
function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rest] = cookie.trim().split("=");
    if (rawName === name) {
      return rest.join("=") || null;
    }
  }
  return null;
}
__name(getCookie, "getCookie");
function sessionSetCookie(value) {
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}
__name(sessionSetCookie, "sessionSetCookie");
function sessionClearCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
__name(sessionClearCookie, "sessionClearCookie");

// src/services/database.ts
var MIGRATION_TABLE_SQL = String.raw`
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
)`;
var INITIAL_SCHEMA_SQL = String.raw`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT,
  envelope_from TEXT NOT NULL,
  envelope_to TEXT NOT NULL,
  from_address TEXT,
  to_addresses_json TEXT NOT NULL DEFAULT '[]',
  subject TEXT,
  sent_at TEXT,
  received_at TEXT NOT NULL,
  raw_size INTEGER NOT NULL DEFAULT 0,
  has_attachments INTEGER NOT NULL DEFAULT 0,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  attachments_json TEXT NOT NULL DEFAULT '[]',
  content_truncated INTEGER NOT NULL DEFAULT 0,
  parse_status TEXT NOT NULL DEFAULT 'parsed',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS email_content_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('headers', 'text', 'html')),
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  UNIQUE (email_id, kind, chunk_index)
);

CREATE TABLE IF NOT EXISTS email_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('subject', 'text', 'html')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  fields_json TEXT NOT NULL DEFAULT '["subject","text","html","code"]',
  keyword TEXT NOT NULL,
  match_mode TEXT NOT NULL DEFAULT 'contains' CHECK (match_mode IN ('contains', 'exact')),
  case_sensitive INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  action TEXT NOT NULL DEFAULT 'allow' CHECK (action IN ('allow', 'block')),
  expression_json TEXT,
  schema_version INTEGER NOT NULL DEFAULT 2,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS share_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  window_minutes INTEGER NOT NULL DEFAULT 30,
  allow_rule_logic TEXT NOT NULL DEFAULT 'or' CHECK (allow_rule_logic IN ('and', 'or')),
  block_rule_logic TEXT NOT NULL DEFAULT 'or' CHECK (block_rule_logic IN ('and', 'or')),
  created_by_admin_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_accessed_at TEXT,
  FOREIGN KEY (created_by_admin_id) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS share_link_rules (
  share_link_id INTEGER NOT NULL,
  rule_id INTEGER NOT NULL,
  PRIMARY KEY (share_link_id, rule_id),
  FOREIGN KEY (share_link_id) REFERENCES share_links(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'visitor', 'system')),
  actor_id TEXT,
  action TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_envelope_to ON emails(envelope_to);
CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_codes(email_id);
CREATE INDEX IF NOT EXISTS idx_email_codes_code ON email_codes(code);
CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled);
CREATE INDEX IF NOT EXISTS idx_share_links_status ON share_links(status);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);
`;
var SHARE_LINK_TOKEN_SQL = String.raw`
ALTER TABLE share_links ADD COLUMN token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
`;
var RULE_EXPRESSIONS_SQL = String.raw`
ALTER TABLE rules ADD COLUMN action TEXT NOT NULL DEFAULT 'allow' CHECK (action IN ('allow', 'block'));
ALTER TABLE rules ADD COLUMN expression_json TEXT;
ALTER TABLE rules ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 2;
CREATE INDEX IF NOT EXISTS idx_rules_action_enabled ON rules(action, enabled);
`;
var SHARE_LINK_RULE_LOGIC_SQL = String.raw`
ALTER TABLE share_links ADD COLUMN allow_rule_logic TEXT NOT NULL DEFAULT 'or' CHECK (allow_rule_logic IN ('and', 'or'));
ALTER TABLE share_links ADD COLUMN block_rule_logic TEXT NOT NULL DEFAULT 'or' CHECK (block_rule_logic IN ('and', 'or'));
`;
var DATABASE_MIGRATIONS = [
  { id: "0001_initial", version: "v0.0.1", description: "\u521D\u59CB\u5316\u6838\u5FC3\u8868\u3001\u7D22\u5F15\u4E0E\u8BBF\u95EE\u65E5\u5FD7", sql: INITIAL_SCHEMA_SQL },
  { id: "0002_share_link_token", version: "v0.0.2", description: "\u4FDD\u5B58\u5206\u4EAB\u94FE\u63A5 token \u4EE5\u4FBF\u540E\u53F0\u91CD\u65B0\u590D\u5236", sql: SHARE_LINK_TOKEN_SQL },
  { id: "0003_rule_expressions", version: "v0.0.3", description: "\u652F\u6301\u89C4\u5219\u767D\u9ED1\u540D\u5355\u4E0E\u9AD8\u7EA7\u8868\u8FBE\u5F0F", sql: RULE_EXPRESSIONS_SQL },
  { id: "0004_share_link_rule_logic", version: "v0.0.4", description: "\u652F\u6301\u5206\u4EAB\u94FE\u63A5\u5141\u8BB8/\u6392\u9664\u89C4\u5219\u7EC4\u5408\u903B\u8F91", sql: SHARE_LINK_RULE_LOGIC_SQL }
];
var UNINITIALIZED_DATABASE_VERSION = "\u672A\u521D\u59CB\u5316";
async function ensureDatabaseSchema(db) {
  return await applyPendingDatabaseMigrations(db);
}
__name(ensureDatabaseSchema, "ensureDatabaseSchema");
async function getDatabaseStatus(db) {
  await ensureMigrationTable(db);
  return await buildDatabaseResult(db, await listMigrationStatus(db), []);
}
__name(getDatabaseStatus, "getDatabaseStatus");
async function applyPendingDatabaseMigrations(db) {
  await ensureMigrationTable(db);
  const applied = await appliedMigrationIds(db);
  const appliedMigrations = [];
  for (const migration of DATABASE_MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await applyMigration(db, migration);
    await markMigrationApplied(db, migration);
    applied.add(migration.id);
    appliedMigrations.push(migration.id);
  }
  return await buildDatabaseResult(db, await listMigrationStatus(db), appliedMigrations);
}
__name(applyPendingDatabaseMigrations, "applyPendingDatabaseMigrations");
async function buildDatabaseResult(db, migrations, appliedMigrations) {
  const currentDatabaseVersion = await currentVersionFromSchema(db, migrations);
  const requiredDatabaseVersion = DATABASE_MIGRATIONS.at(-1)?.version ?? UNINITIALIZED_DATABASE_VERSION;
  return {
    migrations,
    appliedMigrations,
    currentDatabaseVersion,
    requiredDatabaseVersion,
    needsUpgrade: currentDatabaseVersion !== requiredDatabaseVersion
  };
}
__name(buildDatabaseResult, "buildDatabaseResult");
async function currentVersionFromSchema(db, migrations) {
  if (await columnExists(db, "share_links", "allow_rule_logic") && await columnExists(db, "share_links", "block_rule_logic")) {
    return migrationVersion("0004_share_link_rule_logic");
  }
  if (await columnExists(db, "rules", "expression_json")) {
    return migrationVersion("0003_rule_expressions");
  }
  if (await columnExists(db, "share_links", "token")) {
    return migrationVersion("0002_share_link_token");
  }
  if (await tableExists(db, "share_links")) {
    return migrationVersion("0001_initial");
  }
  return currentVersionFromMigrations(migrations);
}
__name(currentVersionFromSchema, "currentVersionFromSchema");
function currentVersionFromMigrations(migrations) {
  const latestApplied = [...migrations].reverse().find((migration) => migration.applied);
  if (!latestApplied) {
    return UNINITIALIZED_DATABASE_VERSION;
  }
  return migrationVersion(latestApplied.id);
}
__name(currentVersionFromMigrations, "currentVersionFromMigrations");
function migrationVersion(id) {
  return DATABASE_MIGRATIONS.find((migration) => migration.id === id)?.version ?? id;
}
__name(migrationVersion, "migrationVersion");
async function applyMigration(db, migration) {
  if (migration.id === "0002_share_link_token") {
    await applyShareLinkTokenMigration(db);
    return;
  }
  if (migration.id === "0003_rule_expressions") {
    await applyRuleExpressionsMigration(db);
    return;
  }
  if (migration.id === "0004_share_link_rule_logic") {
    await applyShareLinkRuleLogicMigration(db);
    return;
  }
  await runSqlStatements(db, migration.sql);
}
__name(applyMigration, "applyMigration");
async function applyShareLinkTokenMigration(db) {
  if (!await columnExists(db, "share_links", "token")) {
    await db.prepare("ALTER TABLE share_links ADD COLUMN token TEXT").run();
  }
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token)").run();
}
__name(applyShareLinkTokenMigration, "applyShareLinkTokenMigration");
async function applyRuleExpressionsMigration(db) {
  if (!await columnExists(db, "rules", "action")) {
    await db.prepare("ALTER TABLE rules ADD COLUMN action TEXT NOT NULL DEFAULT 'allow' CHECK (action IN ('allow', 'block'))").run();
  }
  if (!await columnExists(db, "rules", "expression_json")) {
    await db.prepare("ALTER TABLE rules ADD COLUMN expression_json TEXT").run();
  }
  if (!await columnExists(db, "rules", "schema_version")) {
    await db.prepare("ALTER TABLE rules ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 2").run();
  }
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_rules_action_enabled ON rules(action, enabled)").run();
}
__name(applyRuleExpressionsMigration, "applyRuleExpressionsMigration");
async function applyShareLinkRuleLogicMigration(db) {
  if (!await columnExists(db, "share_links", "allow_rule_logic")) {
    await db.prepare("ALTER TABLE share_links ADD COLUMN allow_rule_logic TEXT NOT NULL DEFAULT 'or' CHECK (allow_rule_logic IN ('and', 'or'))").run();
  }
  if (!await columnExists(db, "share_links", "block_rule_logic")) {
    await db.prepare("ALTER TABLE share_links ADD COLUMN block_rule_logic TEXT NOT NULL DEFAULT 'or' CHECK (block_rule_logic IN ('and', 'or'))").run();
  }
}
__name(applyShareLinkRuleLogicMigration, "applyShareLinkRuleLogicMigration");
async function ensureMigrationTable(db) {
  await db.prepare(MIGRATION_TABLE_SQL).run();
}
__name(ensureMigrationTable, "ensureMigrationTable");
async function appliedMigrationIds(db) {
  const result = await db.prepare("SELECT id FROM schema_migrations").all();
  return new Set(result.results.map((row) => row.id));
}
__name(appliedMigrationIds, "appliedMigrationIds");
async function listMigrationStatus(db) {
  const result = await db.prepare("SELECT id, applied_at FROM schema_migrations").all();
  const applied = new Map(result.results.map((row) => [row.id, row.applied_at]));
  return DATABASE_MIGRATIONS.map((migration) => ({
    id: migration.id,
    description: migration.description,
    applied: applied.has(migration.id),
    appliedAt: applied.get(migration.id) ?? null
  }));
}
__name(listMigrationStatus, "listMigrationStatus");
async function markMigrationApplied(db, migration) {
  await db.prepare(
    `INSERT OR REPLACE INTO schema_migrations (id, description, applied_at)
       VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
  ).bind(migration.id, migration.description).run();
}
__name(markMigrationApplied, "markMigrationApplied");
async function columnExists(db, table, column) {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all();
  return result.results.some((row) => row.name === column);
}
__name(columnExists, "columnExists");
async function tableExists(db, table) {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1").bind(table).first();
  return Boolean(row);
}
__name(tableExists, "tableExists");
async function runSqlStatements(db, sql) {
  for (const statement of splitSqlStatements(sql)) {
    await db.prepare(statement).run();
  }
}
__name(runSqlStatements, "runSqlStatements");
function splitSqlStatements(sql) {
  return sql.split(";").map((statement) => statement.trim()).filter(Boolean);
}
__name(splitSqlStatements, "splitSqlStatements");

// node_modules/postal-mime/src/decode-strings.js
var textEncoder = new TextEncoder();
var base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64Lookup = new Uint8Array(256);
for (let i = 0; i < base64Chars.length; i++) {
  base64Lookup[base64Chars.charCodeAt(i)] = i;
}
function decodeBase64(base64) {
  let bufferLength = Math.ceil(base64.length / 4) * 3;
  const len = base64.length;
  let p = 0;
  if (base64.length % 4 === 3) {
    bufferLength--;
  } else if (base64.length % 4 === 2) {
    bufferLength -= 2;
  } else if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < len; i += 4) {
    let encoded1 = base64Lookup[base64.charCodeAt(i)];
    let encoded2 = base64Lookup[base64.charCodeAt(i + 1)];
    let encoded3 = base64Lookup[base64.charCodeAt(i + 2)];
    let encoded4 = base64Lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return arrayBuffer;
}
__name(decodeBase64, "decodeBase64");
function getDecoder(charset) {
  charset = charset || "utf8";
  let decoder2;
  try {
    decoder2 = new TextDecoder(charset);
  } catch (err) {
    decoder2 = new TextDecoder("windows-1252");
  }
  return decoder2;
}
__name(getDecoder, "getDecoder");
async function blobToArrayBuffer(blob) {
  if ("arrayBuffer" in blob) {
    return await blob.arrayBuffer();
  }
  const fr = new FileReader();
  return new Promise((resolve, reject) => {
    fr.onload = function(e) {
      resolve(e.target.result);
    };
    fr.onerror = function(e) {
      reject(fr.error);
    };
    fr.readAsArrayBuffer(blob);
  });
}
__name(blobToArrayBuffer, "blobToArrayBuffer");
function getHex(c) {
  if (c >= 48 && c <= 57 || c >= 97 && c <= 102 || c >= 65 && c <= 70) {
    return String.fromCharCode(c);
  }
  return false;
}
__name(getHex, "getHex");
function decodeWord(charset, encoding, str) {
  let splitPos = charset.indexOf("*");
  if (splitPos >= 0) {
    charset = charset.substr(0, splitPos);
  }
  encoding = encoding.toUpperCase();
  let byteStr;
  if (encoding === "Q") {
    str = str.replace(/=\s+([0-9a-fA-F])/g, "=$1").replace(/[_\s]/g, " ");
    let buf = textEncoder.encode(str);
    let encodedBytes = [];
    for (let i = 0, len = buf.length; i < len; i++) {
      let c = buf[i];
      if (i <= len - 2 && c === 61) {
        let c1 = getHex(buf[i + 1]);
        let c2 = getHex(buf[i + 2]);
        if (c1 && c2) {
          let c3 = parseInt(c1 + c2, 16);
          encodedBytes.push(c3);
          i += 2;
          continue;
        }
      }
      encodedBytes.push(c);
    }
    byteStr = new ArrayBuffer(encodedBytes.length);
    let dataView = new DataView(byteStr);
    for (let i = 0, len = encodedBytes.length; i < len; i++) {
      dataView.setUint8(i, encodedBytes[i]);
    }
  } else if (encoding === "B") {
    byteStr = decodeBase64(str.replace(/[^a-zA-Z0-9\+\/=]+/g, ""));
  } else {
    byteStr = textEncoder.encode(str);
  }
  return getDecoder(charset).decode(byteStr);
}
__name(decodeWord, "decodeWord");
function decodeWords(str) {
  let joinString = true;
  let done = false;
  while (!done) {
    let result = (str || "").toString().replace(
      /(=\?([^?]+)\?[Bb]\?([^?]*)\?=)\s*(?==\?([^?]+)\?[Bb]\?[^?]*\?=)/g,
      (match2, left, chLeft, encodedLeftStr, chRight) => {
        if (!joinString) {
          return match2;
        }
        if (chLeft === chRight && encodedLeftStr.length % 4 === 0 && !/=$/.test(encodedLeftStr)) {
          return left + "__\0JOIN\0__";
        }
        return match2;
      }
    ).replace(
      /(=\?([^?]+)\?[Qq]\?[^?]*\?=)\s*(?==\?([^?]+)\?[Qq]\?[^?]*\?=)/g,
      (match2, left, chLeft, chRight) => {
        if (!joinString) {
          return match2;
        }
        if (chLeft === chRight) {
          return left + "__\0JOIN\0__";
        }
        return match2;
      }
    ).replace(/(\?=)?__\x00JOIN\x00__(=\?([^?]+)\?[QqBb]\?)?/g, "").replace(/(=\?[^?]+\?[QqBb]\?[^?]*\?=)\s+(?==\?[^?]+\?[QqBb]\?[^?]*\?=)/g, "$1").replace(
      /=\?([\w_\-*]+)\?([QqBb])\?([^?]*)\?=/g,
      (m, charset, encoding, text) => decodeWord(charset, encoding, text)
    );
    if (joinString && result.indexOf("\uFFFD") >= 0) {
      joinString = false;
    } else {
      return result;
    }
  }
}
__name(decodeWords, "decodeWords");
function decodeURIComponentWithCharset(encodedStr, charset) {
  charset = charset || "utf-8";
  let encodedBytes = [];
  for (let i = 0; i < encodedStr.length; i++) {
    let c = encodedStr.charAt(i);
    if (c === "%" && /^[a-f0-9]{2}/i.test(encodedStr.substr(i + 1, 2))) {
      let byte = encodedStr.substr(i + 1, 2);
      i += 2;
      encodedBytes.push(parseInt(byte, 16));
    } else if (c.charCodeAt(0) > 126) {
      c = textEncoder.encode(c);
      for (let j = 0; j < c.length; j++) {
        encodedBytes.push(c[j]);
      }
    } else {
      encodedBytes.push(c.charCodeAt(0));
    }
  }
  const byteStr = new ArrayBuffer(encodedBytes.length);
  const dataView = new DataView(byteStr);
  for (let i = 0, len = encodedBytes.length; i < len; i++) {
    dataView.setUint8(i, encodedBytes[i]);
  }
  return getDecoder(charset).decode(byteStr);
}
__name(decodeURIComponentWithCharset, "decodeURIComponentWithCharset");
function decodeParameterValueContinuations(header) {
  let paramKeys = /* @__PURE__ */ new Map();
  Object.keys(header.params).forEach((key) => {
    let match2 = key.match(/\*((\d+)\*?)?$/);
    if (!match2) {
      return;
    }
    let actualKey = key.substr(0, match2.index).toLowerCase();
    let nr = Number(match2[2]) || 0;
    let paramVal;
    if (!paramKeys.has(actualKey)) {
      paramVal = {
        charset: false,
        values: []
      };
      paramKeys.set(actualKey, paramVal);
    } else {
      paramVal = paramKeys.get(actualKey);
    }
    let value = header.params[key];
    if (nr === 0 && match2[0].charAt(match2[0].length - 1) === "*" && (match2 = value.match(/^([^']*)'[^']*'(.*)$/))) {
      paramVal.charset = match2[1] || "utf-8";
      value = match2[2];
    }
    paramVal.values.push({ nr, value });
    delete header.params[key];
  });
  paramKeys.forEach((paramVal, key) => {
    header.params[key] = decodeURIComponentWithCharset(
      paramVal.values.sort((a, b) => a.nr - b.nr).map((a) => a.value).join(""),
      paramVal.charset
    );
  });
}
__name(decodeParameterValueContinuations, "decodeParameterValueContinuations");

// node_modules/postal-mime/src/pass-through-decoder.js
var PassThroughDecoder = class {
  static {
    __name(this, "PassThroughDecoder");
  }
  constructor() {
    this.chunks = [];
  }
  update(line) {
    this.chunks.push(line);
    this.chunks.push("\n");
  }
  finalize() {
    return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
  }
};

// node_modules/postal-mime/src/base64-decoder.js
var Base64Decoder = class {
  static {
    __name(this, "Base64Decoder");
  }
  constructor(opts) {
    opts = opts || {};
    this.decoder = opts.decoder || new TextDecoder();
    this.maxChunkSize = 100 * 1024;
    this.chunks = [];
    this.remainder = "";
  }
  update(buffer) {
    let str = this.decoder.decode(buffer);
    str = str.replace(/[^a-zA-Z0-9+\/]+/g, "");
    this.remainder += str;
    if (this.remainder.length >= this.maxChunkSize) {
      let allowedBytes = Math.floor(this.remainder.length / 4) * 4;
      let base64Str;
      if (allowedBytes === this.remainder.length) {
        base64Str = this.remainder;
        this.remainder = "";
      } else {
        base64Str = this.remainder.substr(0, allowedBytes);
        this.remainder = this.remainder.substr(allowedBytes);
      }
      if (base64Str.length) {
        this.chunks.push(decodeBase64(base64Str));
      }
    }
  }
  finalize() {
    if (this.remainder && !/^=+$/.test(this.remainder)) {
      this.chunks.push(decodeBase64(this.remainder));
    }
    return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
  }
};

// node_modules/postal-mime/src/qp-decoder.js
var VALID_QP_REGEX = /^=[a-f0-9]{2}$/i;
var QP_SPLIT_REGEX = /(?==[a-f0-9]{2})/i;
var SOFT_LINE_BREAK_REGEX = /=\r?\n/g;
var PARTIAL_QP_ENDING_REGEX = /=[a-fA-F0-9]?$/;
var QPDecoder = class {
  static {
    __name(this, "QPDecoder");
  }
  constructor(opts) {
    opts = opts || {};
    this.decoder = opts.decoder || new TextDecoder();
    this.maxChunkSize = 100 * 1024;
    this.remainder = "";
    this.chunks = [];
  }
  decodeQPBytes(encodedBytes) {
    let buf = new ArrayBuffer(encodedBytes.length);
    let dataView = new DataView(buf);
    for (let i = 0, len = encodedBytes.length; i < len; i++) {
      dataView.setUint8(i, parseInt(encodedBytes[i], 16));
    }
    return buf;
  }
  decodeChunks(str) {
    str = str.replace(SOFT_LINE_BREAK_REGEX, "");
    let list = str.split(QP_SPLIT_REGEX);
    let encodedBytes = [];
    for (let part of list) {
      if (part.charAt(0) !== "=") {
        if (encodedBytes.length) {
          this.chunks.push(this.decodeQPBytes(encodedBytes));
          encodedBytes = [];
        }
        this.chunks.push(part);
        continue;
      }
      if (part.length === 3) {
        if (VALID_QP_REGEX.test(part)) {
          encodedBytes.push(part.substr(1));
        } else {
          if (encodedBytes.length) {
            this.chunks.push(this.decodeQPBytes(encodedBytes));
            encodedBytes = [];
          }
          this.chunks.push(part);
        }
        continue;
      }
      if (part.length > 3) {
        const firstThree = part.substr(0, 3);
        if (VALID_QP_REGEX.test(firstThree)) {
          encodedBytes.push(part.substr(1, 2));
          this.chunks.push(this.decodeQPBytes(encodedBytes));
          encodedBytes = [];
          part = part.substr(3);
          this.chunks.push(part);
        } else {
          if (encodedBytes.length) {
            this.chunks.push(this.decodeQPBytes(encodedBytes));
            encodedBytes = [];
          }
          this.chunks.push(part);
        }
      }
    }
    if (encodedBytes.length) {
      this.chunks.push(this.decodeQPBytes(encodedBytes));
    }
  }
  update(buffer) {
    let str = this.decoder.decode(buffer) + "\n";
    str = this.remainder + str;
    if (str.length < this.maxChunkSize) {
      this.remainder = str;
      return;
    }
    this.remainder = "";
    let partialEnding = str.match(PARTIAL_QP_ENDING_REGEX);
    if (partialEnding) {
      if (partialEnding.index === 0) {
        this.remainder = str;
        return;
      }
      this.remainder = str.substr(partialEnding.index);
      str = str.substr(0, partialEnding.index);
    }
    this.decodeChunks(str);
  }
  finalize() {
    if (this.remainder.length) {
      this.decodeChunks(this.remainder);
      this.remainder = "";
    }
    return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
  }
};

// node_modules/postal-mime/src/mime-node.js
var defaultDecoder = getDecoder();
var MimeNode = class {
  static {
    __name(this, "MimeNode");
  }
  constructor(options) {
    this.options = options || {};
    this.postalMime = this.options.postalMime;
    this.root = !!this.options.parentNode;
    this.childNodes = [];
    if (this.options.parentNode) {
      this.parentNode = this.options.parentNode;
      this.depth = this.parentNode.depth + 1;
      if (this.depth > this.options.maxNestingDepth) {
        throw new Error(`Maximum MIME nesting depth of ${this.options.maxNestingDepth} levels exceeded`);
      }
      this.options.parentNode.childNodes.push(this);
    } else {
      this.depth = 0;
    }
    this.state = "header";
    this.headerLines = [];
    this.headerSize = 0;
    const parentMultipartType = this.options.parentMultipartType || null;
    const defaultContentType = parentMultipartType === "digest" ? "message/rfc822" : "text/plain";
    this.contentType = {
      value: defaultContentType,
      default: true
    };
    this.contentTransferEncoding = {
      value: "8bit"
    };
    this.contentDisposition = {
      value: ""
    };
    this.headers = [];
    this.contentDecoder = false;
  }
  setupContentDecoder(transferEncoding) {
    if (/base64/i.test(transferEncoding)) {
      this.contentDecoder = new Base64Decoder();
    } else if (/quoted-printable/i.test(transferEncoding)) {
      this.contentDecoder = new QPDecoder({ decoder: getDecoder(this.contentType.parsed.params.charset) });
    } else {
      this.contentDecoder = new PassThroughDecoder();
    }
  }
  async finalize() {
    if (this.state === "finished") {
      return;
    }
    if (this.state === "header") {
      this.processHeaders();
    }
    let boundaries = this.postalMime.boundaries;
    for (let i = boundaries.length - 1; i >= 0; i--) {
      let boundary = boundaries[i];
      if (boundary.node === this) {
        boundaries.splice(i, 1);
        break;
      }
    }
    await this.finalizeChildNodes();
    this.content = this.contentDecoder ? await this.contentDecoder.finalize() : null;
    this.state = "finished";
  }
  async finalizeChildNodes() {
    for (let childNode of this.childNodes) {
      await childNode.finalize();
    }
  }
  // Strip RFC 822 comments (parenthesized text) from structured header values
  stripComments(str) {
    let result = "";
    let depth = 0;
    let escaped = false;
    let inQuote = false;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charAt(i);
      if (escaped) {
        if (depth === 0) {
          result += chr;
        }
        escaped = false;
        continue;
      }
      if (chr === "\\") {
        escaped = true;
        if (depth === 0) {
          result += chr;
        }
        continue;
      }
      if (chr === '"' && depth === 0) {
        inQuote = !inQuote;
        result += chr;
        continue;
      }
      if (!inQuote) {
        if (chr === "(") {
          depth++;
          continue;
        }
        if (chr === ")" && depth > 0) {
          depth--;
          continue;
        }
      }
      if (depth === 0) {
        result += chr;
      }
    }
    return result;
  }
  parseStructuredHeader(str) {
    str = this.stripComments(str);
    let response = {
      value: false,
      params: {}
    };
    let key = false;
    let value = "";
    let stage = "value";
    let quote = false;
    let escaped = false;
    let chr;
    for (let i = 0, len = str.length; i < len; i++) {
      chr = str.charAt(i);
      switch (stage) {
        case "key":
          if (chr === "=") {
            key = value.trim().toLowerCase();
            stage = "value";
            value = "";
            break;
          }
          value += chr;
          break;
        case "value":
          if (escaped) {
            value += chr;
          } else if (chr === "\\") {
            escaped = true;
            continue;
          } else if (quote && chr === quote) {
            quote = false;
          } else if (!quote && chr === '"') {
            quote = chr;
          } else if (!quote && chr === ";") {
            if (key === false) {
              response.value = value.trim();
            } else {
              response.params[key] = value.trim();
            }
            stage = "key";
            value = "";
          } else {
            value += chr;
          }
          escaped = false;
          break;
      }
    }
    value = value.trim();
    if (stage === "value") {
      if (key === false) {
        response.value = value;
      } else {
        response.params[key] = value;
      }
    } else if (value) {
      response.params[value.toLowerCase()] = "";
    }
    if (response.value) {
      response.value = response.value.toLowerCase();
    }
    decodeParameterValueContinuations(response);
    return response;
  }
  decodeFlowedText(str, delSp) {
    return str.split(/\r?\n/).reduce((previousValue, currentValue) => {
      if (previousValue.endsWith(" ") && previousValue !== "-- " && !previousValue.endsWith("\n-- ")) {
        if (delSp) {
          return previousValue.slice(0, -1) + currentValue;
        } else {
          return previousValue + currentValue;
        }
      } else {
        return previousValue + "\n" + currentValue;
      }
    }).replace(/^ /gm, "");
  }
  getTextContent() {
    if (!this.content) {
      return "";
    }
    let str = getDecoder(this.contentType.parsed.params.charset).decode(this.content);
    if (/^flowed$/i.test(this.contentType.parsed.params.format)) {
      str = this.decodeFlowedText(str, /^yes$/i.test(this.contentType.parsed.params.delsp));
    }
    return str;
  }
  processHeaders() {
    for (let i = this.headerLines.length - 1; i >= 0; i--) {
      let line = this.headerLines[i];
      if (i && /^\s/.test(line)) {
        this.headerLines[i - 1] += "\n" + line;
        this.headerLines.splice(i, 1);
      }
    }
    this.rawHeaderLines = [];
    for (let i = this.headerLines.length - 1; i >= 0; i--) {
      let rawLine = this.headerLines[i];
      let sep = rawLine.indexOf(":");
      let rawKey = sep < 0 ? rawLine.trim() : rawLine.substr(0, sep).trim();
      this.rawHeaderLines.push({
        key: rawKey.toLowerCase(),
        line: rawLine
      });
      let normalizedLine = rawLine.replace(/\s+/g, " ");
      sep = normalizedLine.indexOf(":");
      let key = sep < 0 ? normalizedLine.trim() : normalizedLine.substr(0, sep).trim();
      let value = sep < 0 ? "" : normalizedLine.substr(sep + 1).trim();
      this.headers.push({ key: key.toLowerCase(), originalKey: key, value });
      switch (key.toLowerCase()) {
        case "content-type":
          if (this.contentType.default) {
            this.contentType = { value, parsed: {} };
          }
          break;
        case "content-transfer-encoding":
          this.contentTransferEncoding = { value, parsed: {} };
          break;
        case "content-disposition":
          this.contentDisposition = { value, parsed: {} };
          break;
        case "content-id":
          this.contentId = value;
          break;
        case "content-description":
          this.contentDescription = value;
          break;
      }
    }
    this.contentType.parsed = this.parseStructuredHeader(this.contentType.value);
    this.contentType.multipart = /^multipart\//i.test(this.contentType.parsed.value) ? this.contentType.parsed.value.substr(this.contentType.parsed.value.indexOf("/") + 1) : false;
    if (this.contentType.multipart && this.contentType.parsed.params.boundary) {
      this.postalMime.boundaries.push({
        value: textEncoder.encode(this.contentType.parsed.params.boundary),
        node: this
      });
    }
    this.contentDisposition.parsed = this.parseStructuredHeader(this.contentDisposition.value);
    this.contentTransferEncoding.encoding = this.contentTransferEncoding.value.toLowerCase().split(/[^\w-]/).shift();
    this.setupContentDecoder(this.contentTransferEncoding.encoding);
  }
  feed(line) {
    switch (this.state) {
      case "header":
        if (!line.length) {
          this.state = "body";
          return this.processHeaders();
        }
        this.headerSize += line.length;
        if (this.headerSize > this.options.maxHeadersSize) {
          let error = new Error(`Maximum header size of ${this.options.maxHeadersSize} bytes exceeded`);
          throw error;
        }
        this.headerLines.push(defaultDecoder.decode(line));
        break;
      case "body": {
        this.contentDecoder.update(line);
      }
    }
  }
};

// node_modules/postal-mime/src/html-entities.js
var htmlEntities = {
  "&AElig": "\xC6",
  "&AElig;": "\xC6",
  "&AMP": "&",
  "&AMP;": "&",
  "&Aacute": "\xC1",
  "&Aacute;": "\xC1",
  "&Abreve;": "\u0102",
  "&Acirc": "\xC2",
  "&Acirc;": "\xC2",
  "&Acy;": "\u0410",
  "&Afr;": "\u{1D504}",
  "&Agrave": "\xC0",
  "&Agrave;": "\xC0",
  "&Alpha;": "\u0391",
  "&Amacr;": "\u0100",
  "&And;": "\u2A53",
  "&Aogon;": "\u0104",
  "&Aopf;": "\u{1D538}",
  "&ApplyFunction;": "\u2061",
  "&Aring": "\xC5",
  "&Aring;": "\xC5",
  "&Ascr;": "\u{1D49C}",
  "&Assign;": "\u2254",
  "&Atilde": "\xC3",
  "&Atilde;": "\xC3",
  "&Auml": "\xC4",
  "&Auml;": "\xC4",
  "&Backslash;": "\u2216",
  "&Barv;": "\u2AE7",
  "&Barwed;": "\u2306",
  "&Bcy;": "\u0411",
  "&Because;": "\u2235",
  "&Bernoullis;": "\u212C",
  "&Beta;": "\u0392",
  "&Bfr;": "\u{1D505}",
  "&Bopf;": "\u{1D539}",
  "&Breve;": "\u02D8",
  "&Bscr;": "\u212C",
  "&Bumpeq;": "\u224E",
  "&CHcy;": "\u0427",
  "&COPY": "\xA9",
  "&COPY;": "\xA9",
  "&Cacute;": "\u0106",
  "&Cap;": "\u22D2",
  "&CapitalDifferentialD;": "\u2145",
  "&Cayleys;": "\u212D",
  "&Ccaron;": "\u010C",
  "&Ccedil": "\xC7",
  "&Ccedil;": "\xC7",
  "&Ccirc;": "\u0108",
  "&Cconint;": "\u2230",
  "&Cdot;": "\u010A",
  "&Cedilla;": "\xB8",
  "&CenterDot;": "\xB7",
  "&Cfr;": "\u212D",
  "&Chi;": "\u03A7",
  "&CircleDot;": "\u2299",
  "&CircleMinus;": "\u2296",
  "&CirclePlus;": "\u2295",
  "&CircleTimes;": "\u2297",
  "&ClockwiseContourIntegral;": "\u2232",
  "&CloseCurlyDoubleQuote;": "\u201D",
  "&CloseCurlyQuote;": "\u2019",
  "&Colon;": "\u2237",
  "&Colone;": "\u2A74",
  "&Congruent;": "\u2261",
  "&Conint;": "\u222F",
  "&ContourIntegral;": "\u222E",
  "&Copf;": "\u2102",
  "&Coproduct;": "\u2210",
  "&CounterClockwiseContourIntegral;": "\u2233",
  "&Cross;": "\u2A2F",
  "&Cscr;": "\u{1D49E}",
  "&Cup;": "\u22D3",
  "&CupCap;": "\u224D",
  "&DD;": "\u2145",
  "&DDotrahd;": "\u2911",
  "&DJcy;": "\u0402",
  "&DScy;": "\u0405",
  "&DZcy;": "\u040F",
  "&Dagger;": "\u2021",
  "&Darr;": "\u21A1",
  "&Dashv;": "\u2AE4",
  "&Dcaron;": "\u010E",
  "&Dcy;": "\u0414",
  "&Del;": "\u2207",
  "&Delta;": "\u0394",
  "&Dfr;": "\u{1D507}",
  "&DiacriticalAcute;": "\xB4",
  "&DiacriticalDot;": "\u02D9",
  "&DiacriticalDoubleAcute;": "\u02DD",
  "&DiacriticalGrave;": "`",
  "&DiacriticalTilde;": "\u02DC",
  "&Diamond;": "\u22C4",
  "&DifferentialD;": "\u2146",
  "&Dopf;": "\u{1D53B}",
  "&Dot;": "\xA8",
  "&DotDot;": "\u20DC",
  "&DotEqual;": "\u2250",
  "&DoubleContourIntegral;": "\u222F",
  "&DoubleDot;": "\xA8",
  "&DoubleDownArrow;": "\u21D3",
  "&DoubleLeftArrow;": "\u21D0",
  "&DoubleLeftRightArrow;": "\u21D4",
  "&DoubleLeftTee;": "\u2AE4",
  "&DoubleLongLeftArrow;": "\u27F8",
  "&DoubleLongLeftRightArrow;": "\u27FA",
  "&DoubleLongRightArrow;": "\u27F9",
  "&DoubleRightArrow;": "\u21D2",
  "&DoubleRightTee;": "\u22A8",
  "&DoubleUpArrow;": "\u21D1",
  "&DoubleUpDownArrow;": "\u21D5",
  "&DoubleVerticalBar;": "\u2225",
  "&DownArrow;": "\u2193",
  "&DownArrowBar;": "\u2913",
  "&DownArrowUpArrow;": "\u21F5",
  "&DownBreve;": "\u0311",
  "&DownLeftRightVector;": "\u2950",
  "&DownLeftTeeVector;": "\u295E",
  "&DownLeftVector;": "\u21BD",
  "&DownLeftVectorBar;": "\u2956",
  "&DownRightTeeVector;": "\u295F",
  "&DownRightVector;": "\u21C1",
  "&DownRightVectorBar;": "\u2957",
  "&DownTee;": "\u22A4",
  "&DownTeeArrow;": "\u21A7",
  "&Downarrow;": "\u21D3",
  "&Dscr;": "\u{1D49F}",
  "&Dstrok;": "\u0110",
  "&ENG;": "\u014A",
  "&ETH": "\xD0",
  "&ETH;": "\xD0",
  "&Eacute": "\xC9",
  "&Eacute;": "\xC9",
  "&Ecaron;": "\u011A",
  "&Ecirc": "\xCA",
  "&Ecirc;": "\xCA",
  "&Ecy;": "\u042D",
  "&Edot;": "\u0116",
  "&Efr;": "\u{1D508}",
  "&Egrave": "\xC8",
  "&Egrave;": "\xC8",
  "&Element;": "\u2208",
  "&Emacr;": "\u0112",
  "&EmptySmallSquare;": "\u25FB",
  "&EmptyVerySmallSquare;": "\u25AB",
  "&Eogon;": "\u0118",
  "&Eopf;": "\u{1D53C}",
  "&Epsilon;": "\u0395",
  "&Equal;": "\u2A75",
  "&EqualTilde;": "\u2242",
  "&Equilibrium;": "\u21CC",
  "&Escr;": "\u2130",
  "&Esim;": "\u2A73",
  "&Eta;": "\u0397",
  "&Euml": "\xCB",
  "&Euml;": "\xCB",
  "&Exists;": "\u2203",
  "&ExponentialE;": "\u2147",
  "&Fcy;": "\u0424",
  "&Ffr;": "\u{1D509}",
  "&FilledSmallSquare;": "\u25FC",
  "&FilledVerySmallSquare;": "\u25AA",
  "&Fopf;": "\u{1D53D}",
  "&ForAll;": "\u2200",
  "&Fouriertrf;": "\u2131",
  "&Fscr;": "\u2131",
  "&GJcy;": "\u0403",
  "&GT": ">",
  "&GT;": ">",
  "&Gamma;": "\u0393",
  "&Gammad;": "\u03DC",
  "&Gbreve;": "\u011E",
  "&Gcedil;": "\u0122",
  "&Gcirc;": "\u011C",
  "&Gcy;": "\u0413",
  "&Gdot;": "\u0120",
  "&Gfr;": "\u{1D50A}",
  "&Gg;": "\u22D9",
  "&Gopf;": "\u{1D53E}",
  "&GreaterEqual;": "\u2265",
  "&GreaterEqualLess;": "\u22DB",
  "&GreaterFullEqual;": "\u2267",
  "&GreaterGreater;": "\u2AA2",
  "&GreaterLess;": "\u2277",
  "&GreaterSlantEqual;": "\u2A7E",
  "&GreaterTilde;": "\u2273",
  "&Gscr;": "\u{1D4A2}",
  "&Gt;": "\u226B",
  "&HARDcy;": "\u042A",
  "&Hacek;": "\u02C7",
  "&Hat;": "^",
  "&Hcirc;": "\u0124",
  "&Hfr;": "\u210C",
  "&HilbertSpace;": "\u210B",
  "&Hopf;": "\u210D",
  "&HorizontalLine;": "\u2500",
  "&Hscr;": "\u210B",
  "&Hstrok;": "\u0126",
  "&HumpDownHump;": "\u224E",
  "&HumpEqual;": "\u224F",
  "&IEcy;": "\u0415",
  "&IJlig;": "\u0132",
  "&IOcy;": "\u0401",
  "&Iacute": "\xCD",
  "&Iacute;": "\xCD",
  "&Icirc": "\xCE",
  "&Icirc;": "\xCE",
  "&Icy;": "\u0418",
  "&Idot;": "\u0130",
  "&Ifr;": "\u2111",
  "&Igrave": "\xCC",
  "&Igrave;": "\xCC",
  "&Im;": "\u2111",
  "&Imacr;": "\u012A",
  "&ImaginaryI;": "\u2148",
  "&Implies;": "\u21D2",
  "&Int;": "\u222C",
  "&Integral;": "\u222B",
  "&Intersection;": "\u22C2",
  "&InvisibleComma;": "\u2063",
  "&InvisibleTimes;": "\u2062",
  "&Iogon;": "\u012E",
  "&Iopf;": "\u{1D540}",
  "&Iota;": "\u0399",
  "&Iscr;": "\u2110",
  "&Itilde;": "\u0128",
  "&Iukcy;": "\u0406",
  "&Iuml": "\xCF",
  "&Iuml;": "\xCF",
  "&Jcirc;": "\u0134",
  "&Jcy;": "\u0419",
  "&Jfr;": "\u{1D50D}",
  "&Jopf;": "\u{1D541}",
  "&Jscr;": "\u{1D4A5}",
  "&Jsercy;": "\u0408",
  "&Jukcy;": "\u0404",
  "&KHcy;": "\u0425",
  "&KJcy;": "\u040C",
  "&Kappa;": "\u039A",
  "&Kcedil;": "\u0136",
  "&Kcy;": "\u041A",
  "&Kfr;": "\u{1D50E}",
  "&Kopf;": "\u{1D542}",
  "&Kscr;": "\u{1D4A6}",
  "&LJcy;": "\u0409",
  "&LT": "<",
  "&LT;": "<",
  "&Lacute;": "\u0139",
  "&Lambda;": "\u039B",
  "&Lang;": "\u27EA",
  "&Laplacetrf;": "\u2112",
  "&Larr;": "\u219E",
  "&Lcaron;": "\u013D",
  "&Lcedil;": "\u013B",
  "&Lcy;": "\u041B",
  "&LeftAngleBracket;": "\u27E8",
  "&LeftArrow;": "\u2190",
  "&LeftArrowBar;": "\u21E4",
  "&LeftArrowRightArrow;": "\u21C6",
  "&LeftCeiling;": "\u2308",
  "&LeftDoubleBracket;": "\u27E6",
  "&LeftDownTeeVector;": "\u2961",
  "&LeftDownVector;": "\u21C3",
  "&LeftDownVectorBar;": "\u2959",
  "&LeftFloor;": "\u230A",
  "&LeftRightArrow;": "\u2194",
  "&LeftRightVector;": "\u294E",
  "&LeftTee;": "\u22A3",
  "&LeftTeeArrow;": "\u21A4",
  "&LeftTeeVector;": "\u295A",
  "&LeftTriangle;": "\u22B2",
  "&LeftTriangleBar;": "\u29CF",
  "&LeftTriangleEqual;": "\u22B4",
  "&LeftUpDownVector;": "\u2951",
  "&LeftUpTeeVector;": "\u2960",
  "&LeftUpVector;": "\u21BF",
  "&LeftUpVectorBar;": "\u2958",
  "&LeftVector;": "\u21BC",
  "&LeftVectorBar;": "\u2952",
  "&Leftarrow;": "\u21D0",
  "&Leftrightarrow;": "\u21D4",
  "&LessEqualGreater;": "\u22DA",
  "&LessFullEqual;": "\u2266",
  "&LessGreater;": "\u2276",
  "&LessLess;": "\u2AA1",
  "&LessSlantEqual;": "\u2A7D",
  "&LessTilde;": "\u2272",
  "&Lfr;": "\u{1D50F}",
  "&Ll;": "\u22D8",
  "&Lleftarrow;": "\u21DA",
  "&Lmidot;": "\u013F",
  "&LongLeftArrow;": "\u27F5",
  "&LongLeftRightArrow;": "\u27F7",
  "&LongRightArrow;": "\u27F6",
  "&Longleftarrow;": "\u27F8",
  "&Longleftrightarrow;": "\u27FA",
  "&Longrightarrow;": "\u27F9",
  "&Lopf;": "\u{1D543}",
  "&LowerLeftArrow;": "\u2199",
  "&LowerRightArrow;": "\u2198",
  "&Lscr;": "\u2112",
  "&Lsh;": "\u21B0",
  "&Lstrok;": "\u0141",
  "&Lt;": "\u226A",
  "&Map;": "\u2905",
  "&Mcy;": "\u041C",
  "&MediumSpace;": "\u205F",
  "&Mellintrf;": "\u2133",
  "&Mfr;": "\u{1D510}",
  "&MinusPlus;": "\u2213",
  "&Mopf;": "\u{1D544}",
  "&Mscr;": "\u2133",
  "&Mu;": "\u039C",
  "&NJcy;": "\u040A",
  "&Nacute;": "\u0143",
  "&Ncaron;": "\u0147",
  "&Ncedil;": "\u0145",
  "&Ncy;": "\u041D",
  "&NegativeMediumSpace;": "\u200B",
  "&NegativeThickSpace;": "\u200B",
  "&NegativeThinSpace;": "\u200B",
  "&NegativeVeryThinSpace;": "\u200B",
  "&NestedGreaterGreater;": "\u226B",
  "&NestedLessLess;": "\u226A",
  "&NewLine;": "\n",
  "&Nfr;": "\u{1D511}",
  "&NoBreak;": "\u2060",
  "&NonBreakingSpace;": "\xA0",
  "&Nopf;": "\u2115",
  "&Not;": "\u2AEC",
  "&NotCongruent;": "\u2262",
  "&NotCupCap;": "\u226D",
  "&NotDoubleVerticalBar;": "\u2226",
  "&NotElement;": "\u2209",
  "&NotEqual;": "\u2260",
  "&NotEqualTilde;": "\u2242\u0338",
  "&NotExists;": "\u2204",
  "&NotGreater;": "\u226F",
  "&NotGreaterEqual;": "\u2271",
  "&NotGreaterFullEqual;": "\u2267\u0338",
  "&NotGreaterGreater;": "\u226B\u0338",
  "&NotGreaterLess;": "\u2279",
  "&NotGreaterSlantEqual;": "\u2A7E\u0338",
  "&NotGreaterTilde;": "\u2275",
  "&NotHumpDownHump;": "\u224E\u0338",
  "&NotHumpEqual;": "\u224F\u0338",
  "&NotLeftTriangle;": "\u22EA",
  "&NotLeftTriangleBar;": "\u29CF\u0338",
  "&NotLeftTriangleEqual;": "\u22EC",
  "&NotLess;": "\u226E",
  "&NotLessEqual;": "\u2270",
  "&NotLessGreater;": "\u2278",
  "&NotLessLess;": "\u226A\u0338",
  "&NotLessSlantEqual;": "\u2A7D\u0338",
  "&NotLessTilde;": "\u2274",
  "&NotNestedGreaterGreater;": "\u2AA2\u0338",
  "&NotNestedLessLess;": "\u2AA1\u0338",
  "&NotPrecedes;": "\u2280",
  "&NotPrecedesEqual;": "\u2AAF\u0338",
  "&NotPrecedesSlantEqual;": "\u22E0",
  "&NotReverseElement;": "\u220C",
  "&NotRightTriangle;": "\u22EB",
  "&NotRightTriangleBar;": "\u29D0\u0338",
  "&NotRightTriangleEqual;": "\u22ED",
  "&NotSquareSubset;": "\u228F\u0338",
  "&NotSquareSubsetEqual;": "\u22E2",
  "&NotSquareSuperset;": "\u2290\u0338",
  "&NotSquareSupersetEqual;": "\u22E3",
  "&NotSubset;": "\u2282\u20D2",
  "&NotSubsetEqual;": "\u2288",
  "&NotSucceeds;": "\u2281",
  "&NotSucceedsEqual;": "\u2AB0\u0338",
  "&NotSucceedsSlantEqual;": "\u22E1",
  "&NotSucceedsTilde;": "\u227F\u0338",
  "&NotSuperset;": "\u2283\u20D2",
  "&NotSupersetEqual;": "\u2289",
  "&NotTilde;": "\u2241",
  "&NotTildeEqual;": "\u2244",
  "&NotTildeFullEqual;": "\u2247",
  "&NotTildeTilde;": "\u2249",
  "&NotVerticalBar;": "\u2224",
  "&Nscr;": "\u{1D4A9}",
  "&Ntilde": "\xD1",
  "&Ntilde;": "\xD1",
  "&Nu;": "\u039D",
  "&OElig;": "\u0152",
  "&Oacute": "\xD3",
  "&Oacute;": "\xD3",
  "&Ocirc": "\xD4",
  "&Ocirc;": "\xD4",
  "&Ocy;": "\u041E",
  "&Odblac;": "\u0150",
  "&Ofr;": "\u{1D512}",
  "&Ograve": "\xD2",
  "&Ograve;": "\xD2",
  "&Omacr;": "\u014C",
  "&Omega;": "\u03A9",
  "&Omicron;": "\u039F",
  "&Oopf;": "\u{1D546}",
  "&OpenCurlyDoubleQuote;": "\u201C",
  "&OpenCurlyQuote;": "\u2018",
  "&Or;": "\u2A54",
  "&Oscr;": "\u{1D4AA}",
  "&Oslash": "\xD8",
  "&Oslash;": "\xD8",
  "&Otilde": "\xD5",
  "&Otilde;": "\xD5",
  "&Otimes;": "\u2A37",
  "&Ouml": "\xD6",
  "&Ouml;": "\xD6",
  "&OverBar;": "\u203E",
  "&OverBrace;": "\u23DE",
  "&OverBracket;": "\u23B4",
  "&OverParenthesis;": "\u23DC",
  "&PartialD;": "\u2202",
  "&Pcy;": "\u041F",
  "&Pfr;": "\u{1D513}",
  "&Phi;": "\u03A6",
  "&Pi;": "\u03A0",
  "&PlusMinus;": "\xB1",
  "&Poincareplane;": "\u210C",
  "&Popf;": "\u2119",
  "&Pr;": "\u2ABB",
  "&Precedes;": "\u227A",
  "&PrecedesEqual;": "\u2AAF",
  "&PrecedesSlantEqual;": "\u227C",
  "&PrecedesTilde;": "\u227E",
  "&Prime;": "\u2033",
  "&Product;": "\u220F",
  "&Proportion;": "\u2237",
  "&Proportional;": "\u221D",
  "&Pscr;": "\u{1D4AB}",
  "&Psi;": "\u03A8",
  "&QUOT": '"',
  "&QUOT;": '"',
  "&Qfr;": "\u{1D514}",
  "&Qopf;": "\u211A",
  "&Qscr;": "\u{1D4AC}",
  "&RBarr;": "\u2910",
  "&REG": "\xAE",
  "&REG;": "\xAE",
  "&Racute;": "\u0154",
  "&Rang;": "\u27EB",
  "&Rarr;": "\u21A0",
  "&Rarrtl;": "\u2916",
  "&Rcaron;": "\u0158",
  "&Rcedil;": "\u0156",
  "&Rcy;": "\u0420",
  "&Re;": "\u211C",
  "&ReverseElement;": "\u220B",
  "&ReverseEquilibrium;": "\u21CB",
  "&ReverseUpEquilibrium;": "\u296F",
  "&Rfr;": "\u211C",
  "&Rho;": "\u03A1",
  "&RightAngleBracket;": "\u27E9",
  "&RightArrow;": "\u2192",
  "&RightArrowBar;": "\u21E5",
  "&RightArrowLeftArrow;": "\u21C4",
  "&RightCeiling;": "\u2309",
  "&RightDoubleBracket;": "\u27E7",
  "&RightDownTeeVector;": "\u295D",
  "&RightDownVector;": "\u21C2",
  "&RightDownVectorBar;": "\u2955",
  "&RightFloor;": "\u230B",
  "&RightTee;": "\u22A2",
  "&RightTeeArrow;": "\u21A6",
  "&RightTeeVector;": "\u295B",
  "&RightTriangle;": "\u22B3",
  "&RightTriangleBar;": "\u29D0",
  "&RightTriangleEqual;": "\u22B5",
  "&RightUpDownVector;": "\u294F",
  "&RightUpTeeVector;": "\u295C",
  "&RightUpVector;": "\u21BE",
  "&RightUpVectorBar;": "\u2954",
  "&RightVector;": "\u21C0",
  "&RightVectorBar;": "\u2953",
  "&Rightarrow;": "\u21D2",
  "&Ropf;": "\u211D",
  "&RoundImplies;": "\u2970",
  "&Rrightarrow;": "\u21DB",
  "&Rscr;": "\u211B",
  "&Rsh;": "\u21B1",
  "&RuleDelayed;": "\u29F4",
  "&SHCHcy;": "\u0429",
  "&SHcy;": "\u0428",
  "&SOFTcy;": "\u042C",
  "&Sacute;": "\u015A",
  "&Sc;": "\u2ABC",
  "&Scaron;": "\u0160",
  "&Scedil;": "\u015E",
  "&Scirc;": "\u015C",
  "&Scy;": "\u0421",
  "&Sfr;": "\u{1D516}",
  "&ShortDownArrow;": "\u2193",
  "&ShortLeftArrow;": "\u2190",
  "&ShortRightArrow;": "\u2192",
  "&ShortUpArrow;": "\u2191",
  "&Sigma;": "\u03A3",
  "&SmallCircle;": "\u2218",
  "&Sopf;": "\u{1D54A}",
  "&Sqrt;": "\u221A",
  "&Square;": "\u25A1",
  "&SquareIntersection;": "\u2293",
  "&SquareSubset;": "\u228F",
  "&SquareSubsetEqual;": "\u2291",
  "&SquareSuperset;": "\u2290",
  "&SquareSupersetEqual;": "\u2292",
  "&SquareUnion;": "\u2294",
  "&Sscr;": "\u{1D4AE}",
  "&Star;": "\u22C6",
  "&Sub;": "\u22D0",
  "&Subset;": "\u22D0",
  "&SubsetEqual;": "\u2286",
  "&Succeeds;": "\u227B",
  "&SucceedsEqual;": "\u2AB0",
  "&SucceedsSlantEqual;": "\u227D",
  "&SucceedsTilde;": "\u227F",
  "&SuchThat;": "\u220B",
  "&Sum;": "\u2211",
  "&Sup;": "\u22D1",
  "&Superset;": "\u2283",
  "&SupersetEqual;": "\u2287",
  "&Supset;": "\u22D1",
  "&THORN": "\xDE",
  "&THORN;": "\xDE",
  "&TRADE;": "\u2122",
  "&TSHcy;": "\u040B",
  "&TScy;": "\u0426",
  "&Tab;": "	",
  "&Tau;": "\u03A4",
  "&Tcaron;": "\u0164",
  "&Tcedil;": "\u0162",
  "&Tcy;": "\u0422",
  "&Tfr;": "\u{1D517}",
  "&Therefore;": "\u2234",
  "&Theta;": "\u0398",
  "&ThickSpace;": "\u205F\u200A",
  "&ThinSpace;": "\u2009",
  "&Tilde;": "\u223C",
  "&TildeEqual;": "\u2243",
  "&TildeFullEqual;": "\u2245",
  "&TildeTilde;": "\u2248",
  "&Topf;": "\u{1D54B}",
  "&TripleDot;": "\u20DB",
  "&Tscr;": "\u{1D4AF}",
  "&Tstrok;": "\u0166",
  "&Uacute": "\xDA",
  "&Uacute;": "\xDA",
  "&Uarr;": "\u219F",
  "&Uarrocir;": "\u2949",
  "&Ubrcy;": "\u040E",
  "&Ubreve;": "\u016C",
  "&Ucirc": "\xDB",
  "&Ucirc;": "\xDB",
  "&Ucy;": "\u0423",
  "&Udblac;": "\u0170",
  "&Ufr;": "\u{1D518}",
  "&Ugrave": "\xD9",
  "&Ugrave;": "\xD9",
  "&Umacr;": "\u016A",
  "&UnderBar;": "_",
  "&UnderBrace;": "\u23DF",
  "&UnderBracket;": "\u23B5",
  "&UnderParenthesis;": "\u23DD",
  "&Union;": "\u22C3",
  "&UnionPlus;": "\u228E",
  "&Uogon;": "\u0172",
  "&Uopf;": "\u{1D54C}",
  "&UpArrow;": "\u2191",
  "&UpArrowBar;": "\u2912",
  "&UpArrowDownArrow;": "\u21C5",
  "&UpDownArrow;": "\u2195",
  "&UpEquilibrium;": "\u296E",
  "&UpTee;": "\u22A5",
  "&UpTeeArrow;": "\u21A5",
  "&Uparrow;": "\u21D1",
  "&Updownarrow;": "\u21D5",
  "&UpperLeftArrow;": "\u2196",
  "&UpperRightArrow;": "\u2197",
  "&Upsi;": "\u03D2",
  "&Upsilon;": "\u03A5",
  "&Uring;": "\u016E",
  "&Uscr;": "\u{1D4B0}",
  "&Utilde;": "\u0168",
  "&Uuml": "\xDC",
  "&Uuml;": "\xDC",
  "&VDash;": "\u22AB",
  "&Vbar;": "\u2AEB",
  "&Vcy;": "\u0412",
  "&Vdash;": "\u22A9",
  "&Vdashl;": "\u2AE6",
  "&Vee;": "\u22C1",
  "&Verbar;": "\u2016",
  "&Vert;": "\u2016",
  "&VerticalBar;": "\u2223",
  "&VerticalLine;": "|",
  "&VerticalSeparator;": "\u2758",
  "&VerticalTilde;": "\u2240",
  "&VeryThinSpace;": "\u200A",
  "&Vfr;": "\u{1D519}",
  "&Vopf;": "\u{1D54D}",
  "&Vscr;": "\u{1D4B1}",
  "&Vvdash;": "\u22AA",
  "&Wcirc;": "\u0174",
  "&Wedge;": "\u22C0",
  "&Wfr;": "\u{1D51A}",
  "&Wopf;": "\u{1D54E}",
  "&Wscr;": "\u{1D4B2}",
  "&Xfr;": "\u{1D51B}",
  "&Xi;": "\u039E",
  "&Xopf;": "\u{1D54F}",
  "&Xscr;": "\u{1D4B3}",
  "&YAcy;": "\u042F",
  "&YIcy;": "\u0407",
  "&YUcy;": "\u042E",
  "&Yacute": "\xDD",
  "&Yacute;": "\xDD",
  "&Ycirc;": "\u0176",
  "&Ycy;": "\u042B",
  "&Yfr;": "\u{1D51C}",
  "&Yopf;": "\u{1D550}",
  "&Yscr;": "\u{1D4B4}",
  "&Yuml;": "\u0178",
  "&ZHcy;": "\u0416",
  "&Zacute;": "\u0179",
  "&Zcaron;": "\u017D",
  "&Zcy;": "\u0417",
  "&Zdot;": "\u017B",
  "&ZeroWidthSpace;": "\u200B",
  "&Zeta;": "\u0396",
  "&Zfr;": "\u2128",
  "&Zopf;": "\u2124",
  "&Zscr;": "\u{1D4B5}",
  "&aacute": "\xE1",
  "&aacute;": "\xE1",
  "&abreve;": "\u0103",
  "&ac;": "\u223E",
  "&acE;": "\u223E\u0333",
  "&acd;": "\u223F",
  "&acirc": "\xE2",
  "&acirc;": "\xE2",
  "&acute": "\xB4",
  "&acute;": "\xB4",
  "&acy;": "\u0430",
  "&aelig": "\xE6",
  "&aelig;": "\xE6",
  "&af;": "\u2061",
  "&afr;": "\u{1D51E}",
  "&agrave": "\xE0",
  "&agrave;": "\xE0",
  "&alefsym;": "\u2135",
  "&aleph;": "\u2135",
  "&alpha;": "\u03B1",
  "&amacr;": "\u0101",
  "&amalg;": "\u2A3F",
  "&amp": "&",
  "&amp;": "&",
  "&and;": "\u2227",
  "&andand;": "\u2A55",
  "&andd;": "\u2A5C",
  "&andslope;": "\u2A58",
  "&andv;": "\u2A5A",
  "&ang;": "\u2220",
  "&ange;": "\u29A4",
  "&angle;": "\u2220",
  "&angmsd;": "\u2221",
  "&angmsdaa;": "\u29A8",
  "&angmsdab;": "\u29A9",
  "&angmsdac;": "\u29AA",
  "&angmsdad;": "\u29AB",
  "&angmsdae;": "\u29AC",
  "&angmsdaf;": "\u29AD",
  "&angmsdag;": "\u29AE",
  "&angmsdah;": "\u29AF",
  "&angrt;": "\u221F",
  "&angrtvb;": "\u22BE",
  "&angrtvbd;": "\u299D",
  "&angsph;": "\u2222",
  "&angst;": "\xC5",
  "&angzarr;": "\u237C",
  "&aogon;": "\u0105",
  "&aopf;": "\u{1D552}",
  "&ap;": "\u2248",
  "&apE;": "\u2A70",
  "&apacir;": "\u2A6F",
  "&ape;": "\u224A",
  "&apid;": "\u224B",
  "&apos;": "'",
  "&approx;": "\u2248",
  "&approxeq;": "\u224A",
  "&aring": "\xE5",
  "&aring;": "\xE5",
  "&ascr;": "\u{1D4B6}",
  "&ast;": "*",
  "&asymp;": "\u2248",
  "&asympeq;": "\u224D",
  "&atilde": "\xE3",
  "&atilde;": "\xE3",
  "&auml": "\xE4",
  "&auml;": "\xE4",
  "&awconint;": "\u2233",
  "&awint;": "\u2A11",
  "&bNot;": "\u2AED",
  "&backcong;": "\u224C",
  "&backepsilon;": "\u03F6",
  "&backprime;": "\u2035",
  "&backsim;": "\u223D",
  "&backsimeq;": "\u22CD",
  "&barvee;": "\u22BD",
  "&barwed;": "\u2305",
  "&barwedge;": "\u2305",
  "&bbrk;": "\u23B5",
  "&bbrktbrk;": "\u23B6",
  "&bcong;": "\u224C",
  "&bcy;": "\u0431",
  "&bdquo;": "\u201E",
  "&becaus;": "\u2235",
  "&because;": "\u2235",
  "&bemptyv;": "\u29B0",
  "&bepsi;": "\u03F6",
  "&bernou;": "\u212C",
  "&beta;": "\u03B2",
  "&beth;": "\u2136",
  "&between;": "\u226C",
  "&bfr;": "\u{1D51F}",
  "&bigcap;": "\u22C2",
  "&bigcirc;": "\u25EF",
  "&bigcup;": "\u22C3",
  "&bigodot;": "\u2A00",
  "&bigoplus;": "\u2A01",
  "&bigotimes;": "\u2A02",
  "&bigsqcup;": "\u2A06",
  "&bigstar;": "\u2605",
  "&bigtriangledown;": "\u25BD",
  "&bigtriangleup;": "\u25B3",
  "&biguplus;": "\u2A04",
  "&bigvee;": "\u22C1",
  "&bigwedge;": "\u22C0",
  "&bkarow;": "\u290D",
  "&blacklozenge;": "\u29EB",
  "&blacksquare;": "\u25AA",
  "&blacktriangle;": "\u25B4",
  "&blacktriangledown;": "\u25BE",
  "&blacktriangleleft;": "\u25C2",
  "&blacktriangleright;": "\u25B8",
  "&blank;": "\u2423",
  "&blk12;": "\u2592",
  "&blk14;": "\u2591",
  "&blk34;": "\u2593",
  "&block;": "\u2588",
  "&bne;": "=\u20E5",
  "&bnequiv;": "\u2261\u20E5",
  "&bnot;": "\u2310",
  "&bopf;": "\u{1D553}",
  "&bot;": "\u22A5",
  "&bottom;": "\u22A5",
  "&bowtie;": "\u22C8",
  "&boxDL;": "\u2557",
  "&boxDR;": "\u2554",
  "&boxDl;": "\u2556",
  "&boxDr;": "\u2553",
  "&boxH;": "\u2550",
  "&boxHD;": "\u2566",
  "&boxHU;": "\u2569",
  "&boxHd;": "\u2564",
  "&boxHu;": "\u2567",
  "&boxUL;": "\u255D",
  "&boxUR;": "\u255A",
  "&boxUl;": "\u255C",
  "&boxUr;": "\u2559",
  "&boxV;": "\u2551",
  "&boxVH;": "\u256C",
  "&boxVL;": "\u2563",
  "&boxVR;": "\u2560",
  "&boxVh;": "\u256B",
  "&boxVl;": "\u2562",
  "&boxVr;": "\u255F",
  "&boxbox;": "\u29C9",
  "&boxdL;": "\u2555",
  "&boxdR;": "\u2552",
  "&boxdl;": "\u2510",
  "&boxdr;": "\u250C",
  "&boxh;": "\u2500",
  "&boxhD;": "\u2565",
  "&boxhU;": "\u2568",
  "&boxhd;": "\u252C",
  "&boxhu;": "\u2534",
  "&boxminus;": "\u229F",
  "&boxplus;": "\u229E",
  "&boxtimes;": "\u22A0",
  "&boxuL;": "\u255B",
  "&boxuR;": "\u2558",
  "&boxul;": "\u2518",
  "&boxur;": "\u2514",
  "&boxv;": "\u2502",
  "&boxvH;": "\u256A",
  "&boxvL;": "\u2561",
  "&boxvR;": "\u255E",
  "&boxvh;": "\u253C",
  "&boxvl;": "\u2524",
  "&boxvr;": "\u251C",
  "&bprime;": "\u2035",
  "&breve;": "\u02D8",
  "&brvbar": "\xA6",
  "&brvbar;": "\xA6",
  "&bscr;": "\u{1D4B7}",
  "&bsemi;": "\u204F",
  "&bsim;": "\u223D",
  "&bsime;": "\u22CD",
  "&bsol;": "\\",
  "&bsolb;": "\u29C5",
  "&bsolhsub;": "\u27C8",
  "&bull;": "\u2022",
  "&bullet;": "\u2022",
  "&bump;": "\u224E",
  "&bumpE;": "\u2AAE",
  "&bumpe;": "\u224F",
  "&bumpeq;": "\u224F",
  "&cacute;": "\u0107",
  "&cap;": "\u2229",
  "&capand;": "\u2A44",
  "&capbrcup;": "\u2A49",
  "&capcap;": "\u2A4B",
  "&capcup;": "\u2A47",
  "&capdot;": "\u2A40",
  "&caps;": "\u2229\uFE00",
  "&caret;": "\u2041",
  "&caron;": "\u02C7",
  "&ccaps;": "\u2A4D",
  "&ccaron;": "\u010D",
  "&ccedil": "\xE7",
  "&ccedil;": "\xE7",
  "&ccirc;": "\u0109",
  "&ccups;": "\u2A4C",
  "&ccupssm;": "\u2A50",
  "&cdot;": "\u010B",
  "&cedil": "\xB8",
  "&cedil;": "\xB8",
  "&cemptyv;": "\u29B2",
  "&cent": "\xA2",
  "&cent;": "\xA2",
  "&centerdot;": "\xB7",
  "&cfr;": "\u{1D520}",
  "&chcy;": "\u0447",
  "&check;": "\u2713",
  "&checkmark;": "\u2713",
  "&chi;": "\u03C7",
  "&cir;": "\u25CB",
  "&cirE;": "\u29C3",
  "&circ;": "\u02C6",
  "&circeq;": "\u2257",
  "&circlearrowleft;": "\u21BA",
  "&circlearrowright;": "\u21BB",
  "&circledR;": "\xAE",
  "&circledS;": "\u24C8",
  "&circledast;": "\u229B",
  "&circledcirc;": "\u229A",
  "&circleddash;": "\u229D",
  "&cire;": "\u2257",
  "&cirfnint;": "\u2A10",
  "&cirmid;": "\u2AEF",
  "&cirscir;": "\u29C2",
  "&clubs;": "\u2663",
  "&clubsuit;": "\u2663",
  "&colon;": ":",
  "&colone;": "\u2254",
  "&coloneq;": "\u2254",
  "&comma;": ",",
  "&commat;": "@",
  "&comp;": "\u2201",
  "&compfn;": "\u2218",
  "&complement;": "\u2201",
  "&complexes;": "\u2102",
  "&cong;": "\u2245",
  "&congdot;": "\u2A6D",
  "&conint;": "\u222E",
  "&copf;": "\u{1D554}",
  "&coprod;": "\u2210",
  "&copy": "\xA9",
  "&copy;": "\xA9",
  "&copysr;": "\u2117",
  "&crarr;": "\u21B5",
  "&cross;": "\u2717",
  "&cscr;": "\u{1D4B8}",
  "&csub;": "\u2ACF",
  "&csube;": "\u2AD1",
  "&csup;": "\u2AD0",
  "&csupe;": "\u2AD2",
  "&ctdot;": "\u22EF",
  "&cudarrl;": "\u2938",
  "&cudarrr;": "\u2935",
  "&cuepr;": "\u22DE",
  "&cuesc;": "\u22DF",
  "&cularr;": "\u21B6",
  "&cularrp;": "\u293D",
  "&cup;": "\u222A",
  "&cupbrcap;": "\u2A48",
  "&cupcap;": "\u2A46",
  "&cupcup;": "\u2A4A",
  "&cupdot;": "\u228D",
  "&cupor;": "\u2A45",
  "&cups;": "\u222A\uFE00",
  "&curarr;": "\u21B7",
  "&curarrm;": "\u293C",
  "&curlyeqprec;": "\u22DE",
  "&curlyeqsucc;": "\u22DF",
  "&curlyvee;": "\u22CE",
  "&curlywedge;": "\u22CF",
  "&curren": "\xA4",
  "&curren;": "\xA4",
  "&curvearrowleft;": "\u21B6",
  "&curvearrowright;": "\u21B7",
  "&cuvee;": "\u22CE",
  "&cuwed;": "\u22CF",
  "&cwconint;": "\u2232",
  "&cwint;": "\u2231",
  "&cylcty;": "\u232D",
  "&dArr;": "\u21D3",
  "&dHar;": "\u2965",
  "&dagger;": "\u2020",
  "&daleth;": "\u2138",
  "&darr;": "\u2193",
  "&dash;": "\u2010",
  "&dashv;": "\u22A3",
  "&dbkarow;": "\u290F",
  "&dblac;": "\u02DD",
  "&dcaron;": "\u010F",
  "&dcy;": "\u0434",
  "&dd;": "\u2146",
  "&ddagger;": "\u2021",
  "&ddarr;": "\u21CA",
  "&ddotseq;": "\u2A77",
  "&deg": "\xB0",
  "&deg;": "\xB0",
  "&delta;": "\u03B4",
  "&demptyv;": "\u29B1",
  "&dfisht;": "\u297F",
  "&dfr;": "\u{1D521}",
  "&dharl;": "\u21C3",
  "&dharr;": "\u21C2",
  "&diam;": "\u22C4",
  "&diamond;": "\u22C4",
  "&diamondsuit;": "\u2666",
  "&diams;": "\u2666",
  "&die;": "\xA8",
  "&digamma;": "\u03DD",
  "&disin;": "\u22F2",
  "&div;": "\xF7",
  "&divide": "\xF7",
  "&divide;": "\xF7",
  "&divideontimes;": "\u22C7",
  "&divonx;": "\u22C7",
  "&djcy;": "\u0452",
  "&dlcorn;": "\u231E",
  "&dlcrop;": "\u230D",
  "&dollar;": "$",
  "&dopf;": "\u{1D555}",
  "&dot;": "\u02D9",
  "&doteq;": "\u2250",
  "&doteqdot;": "\u2251",
  "&dotminus;": "\u2238",
  "&dotplus;": "\u2214",
  "&dotsquare;": "\u22A1",
  "&doublebarwedge;": "\u2306",
  "&downarrow;": "\u2193",
  "&downdownarrows;": "\u21CA",
  "&downharpoonleft;": "\u21C3",
  "&downharpoonright;": "\u21C2",
  "&drbkarow;": "\u2910",
  "&drcorn;": "\u231F",
  "&drcrop;": "\u230C",
  "&dscr;": "\u{1D4B9}",
  "&dscy;": "\u0455",
  "&dsol;": "\u29F6",
  "&dstrok;": "\u0111",
  "&dtdot;": "\u22F1",
  "&dtri;": "\u25BF",
  "&dtrif;": "\u25BE",
  "&duarr;": "\u21F5",
  "&duhar;": "\u296F",
  "&dwangle;": "\u29A6",
  "&dzcy;": "\u045F",
  "&dzigrarr;": "\u27FF",
  "&eDDot;": "\u2A77",
  "&eDot;": "\u2251",
  "&eacute": "\xE9",
  "&eacute;": "\xE9",
  "&easter;": "\u2A6E",
  "&ecaron;": "\u011B",
  "&ecir;": "\u2256",
  "&ecirc": "\xEA",
  "&ecirc;": "\xEA",
  "&ecolon;": "\u2255",
  "&ecy;": "\u044D",
  "&edot;": "\u0117",
  "&ee;": "\u2147",
  "&efDot;": "\u2252",
  "&efr;": "\u{1D522}",
  "&eg;": "\u2A9A",
  "&egrave": "\xE8",
  "&egrave;": "\xE8",
  "&egs;": "\u2A96",
  "&egsdot;": "\u2A98",
  "&el;": "\u2A99",
  "&elinters;": "\u23E7",
  "&ell;": "\u2113",
  "&els;": "\u2A95",
  "&elsdot;": "\u2A97",
  "&emacr;": "\u0113",
  "&empty;": "\u2205",
  "&emptyset;": "\u2205",
  "&emptyv;": "\u2205",
  "&emsp13;": "\u2004",
  "&emsp14;": "\u2005",
  "&emsp;": "\u2003",
  "&eng;": "\u014B",
  "&ensp;": "\u2002",
  "&eogon;": "\u0119",
  "&eopf;": "\u{1D556}",
  "&epar;": "\u22D5",
  "&eparsl;": "\u29E3",
  "&eplus;": "\u2A71",
  "&epsi;": "\u03B5",
  "&epsilon;": "\u03B5",
  "&epsiv;": "\u03F5",
  "&eqcirc;": "\u2256",
  "&eqcolon;": "\u2255",
  "&eqsim;": "\u2242",
  "&eqslantgtr;": "\u2A96",
  "&eqslantless;": "\u2A95",
  "&equals;": "=",
  "&equest;": "\u225F",
  "&equiv;": "\u2261",
  "&equivDD;": "\u2A78",
  "&eqvparsl;": "\u29E5",
  "&erDot;": "\u2253",
  "&erarr;": "\u2971",
  "&escr;": "\u212F",
  "&esdot;": "\u2250",
  "&esim;": "\u2242",
  "&eta;": "\u03B7",
  "&eth": "\xF0",
  "&eth;": "\xF0",
  "&euml": "\xEB",
  "&euml;": "\xEB",
  "&euro;": "\u20AC",
  "&excl;": "!",
  "&exist;": "\u2203",
  "&expectation;": "\u2130",
  "&exponentiale;": "\u2147",
  "&fallingdotseq;": "\u2252",
  "&fcy;": "\u0444",
  "&female;": "\u2640",
  "&ffilig;": "\uFB03",
  "&fflig;": "\uFB00",
  "&ffllig;": "\uFB04",
  "&ffr;": "\u{1D523}",
  "&filig;": "\uFB01",
  "&fjlig;": "fj",
  "&flat;": "\u266D",
  "&fllig;": "\uFB02",
  "&fltns;": "\u25B1",
  "&fnof;": "\u0192",
  "&fopf;": "\u{1D557}",
  "&forall;": "\u2200",
  "&fork;": "\u22D4",
  "&forkv;": "\u2AD9",
  "&fpartint;": "\u2A0D",
  "&frac12": "\xBD",
  "&frac12;": "\xBD",
  "&frac13;": "\u2153",
  "&frac14": "\xBC",
  "&frac14;": "\xBC",
  "&frac15;": "\u2155",
  "&frac16;": "\u2159",
  "&frac18;": "\u215B",
  "&frac23;": "\u2154",
  "&frac25;": "\u2156",
  "&frac34": "\xBE",
  "&frac34;": "\xBE",
  "&frac35;": "\u2157",
  "&frac38;": "\u215C",
  "&frac45;": "\u2158",
  "&frac56;": "\u215A",
  "&frac58;": "\u215D",
  "&frac78;": "\u215E",
  "&frasl;": "\u2044",
  "&frown;": "\u2322",
  "&fscr;": "\u{1D4BB}",
  "&gE;": "\u2267",
  "&gEl;": "\u2A8C",
  "&gacute;": "\u01F5",
  "&gamma;": "\u03B3",
  "&gammad;": "\u03DD",
  "&gap;": "\u2A86",
  "&gbreve;": "\u011F",
  "&gcirc;": "\u011D",
  "&gcy;": "\u0433",
  "&gdot;": "\u0121",
  "&ge;": "\u2265",
  "&gel;": "\u22DB",
  "&geq;": "\u2265",
  "&geqq;": "\u2267",
  "&geqslant;": "\u2A7E",
  "&ges;": "\u2A7E",
  "&gescc;": "\u2AA9",
  "&gesdot;": "\u2A80",
  "&gesdoto;": "\u2A82",
  "&gesdotol;": "\u2A84",
  "&gesl;": "\u22DB\uFE00",
  "&gesles;": "\u2A94",
  "&gfr;": "\u{1D524}",
  "&gg;": "\u226B",
  "&ggg;": "\u22D9",
  "&gimel;": "\u2137",
  "&gjcy;": "\u0453",
  "&gl;": "\u2277",
  "&glE;": "\u2A92",
  "&gla;": "\u2AA5",
  "&glj;": "\u2AA4",
  "&gnE;": "\u2269",
  "&gnap;": "\u2A8A",
  "&gnapprox;": "\u2A8A",
  "&gne;": "\u2A88",
  "&gneq;": "\u2A88",
  "&gneqq;": "\u2269",
  "&gnsim;": "\u22E7",
  "&gopf;": "\u{1D558}",
  "&grave;": "`",
  "&gscr;": "\u210A",
  "&gsim;": "\u2273",
  "&gsime;": "\u2A8E",
  "&gsiml;": "\u2A90",
  "&gt": ">",
  "&gt;": ">",
  "&gtcc;": "\u2AA7",
  "&gtcir;": "\u2A7A",
  "&gtdot;": "\u22D7",
  "&gtlPar;": "\u2995",
  "&gtquest;": "\u2A7C",
  "&gtrapprox;": "\u2A86",
  "&gtrarr;": "\u2978",
  "&gtrdot;": "\u22D7",
  "&gtreqless;": "\u22DB",
  "&gtreqqless;": "\u2A8C",
  "&gtrless;": "\u2277",
  "&gtrsim;": "\u2273",
  "&gvertneqq;": "\u2269\uFE00",
  "&gvnE;": "\u2269\uFE00",
  "&hArr;": "\u21D4",
  "&hairsp;": "\u200A",
  "&half;": "\xBD",
  "&hamilt;": "\u210B",
  "&hardcy;": "\u044A",
  "&harr;": "\u2194",
  "&harrcir;": "\u2948",
  "&harrw;": "\u21AD",
  "&hbar;": "\u210F",
  "&hcirc;": "\u0125",
  "&hearts;": "\u2665",
  "&heartsuit;": "\u2665",
  "&hellip;": "\u2026",
  "&hercon;": "\u22B9",
  "&hfr;": "\u{1D525}",
  "&hksearow;": "\u2925",
  "&hkswarow;": "\u2926",
  "&hoarr;": "\u21FF",
  "&homtht;": "\u223B",
  "&hookleftarrow;": "\u21A9",
  "&hookrightarrow;": "\u21AA",
  "&hopf;": "\u{1D559}",
  "&horbar;": "\u2015",
  "&hscr;": "\u{1D4BD}",
  "&hslash;": "\u210F",
  "&hstrok;": "\u0127",
  "&hybull;": "\u2043",
  "&hyphen;": "\u2010",
  "&iacute": "\xED",
  "&iacute;": "\xED",
  "&ic;": "\u2063",
  "&icirc": "\xEE",
  "&icirc;": "\xEE",
  "&icy;": "\u0438",
  "&iecy;": "\u0435",
  "&iexcl": "\xA1",
  "&iexcl;": "\xA1",
  "&iff;": "\u21D4",
  "&ifr;": "\u{1D526}",
  "&igrave": "\xEC",
  "&igrave;": "\xEC",
  "&ii;": "\u2148",
  "&iiiint;": "\u2A0C",
  "&iiint;": "\u222D",
  "&iinfin;": "\u29DC",
  "&iiota;": "\u2129",
  "&ijlig;": "\u0133",
  "&imacr;": "\u012B",
  "&image;": "\u2111",
  "&imagline;": "\u2110",
  "&imagpart;": "\u2111",
  "&imath;": "\u0131",
  "&imof;": "\u22B7",
  "&imped;": "\u01B5",
  "&in;": "\u2208",
  "&incare;": "\u2105",
  "&infin;": "\u221E",
  "&infintie;": "\u29DD",
  "&inodot;": "\u0131",
  "&int;": "\u222B",
  "&intcal;": "\u22BA",
  "&integers;": "\u2124",
  "&intercal;": "\u22BA",
  "&intlarhk;": "\u2A17",
  "&intprod;": "\u2A3C",
  "&iocy;": "\u0451",
  "&iogon;": "\u012F",
  "&iopf;": "\u{1D55A}",
  "&iota;": "\u03B9",
  "&iprod;": "\u2A3C",
  "&iquest": "\xBF",
  "&iquest;": "\xBF",
  "&iscr;": "\u{1D4BE}",
  "&isin;": "\u2208",
  "&isinE;": "\u22F9",
  "&isindot;": "\u22F5",
  "&isins;": "\u22F4",
  "&isinsv;": "\u22F3",
  "&isinv;": "\u2208",
  "&it;": "\u2062",
  "&itilde;": "\u0129",
  "&iukcy;": "\u0456",
  "&iuml": "\xEF",
  "&iuml;": "\xEF",
  "&jcirc;": "\u0135",
  "&jcy;": "\u0439",
  "&jfr;": "\u{1D527}",
  "&jmath;": "\u0237",
  "&jopf;": "\u{1D55B}",
  "&jscr;": "\u{1D4BF}",
  "&jsercy;": "\u0458",
  "&jukcy;": "\u0454",
  "&kappa;": "\u03BA",
  "&kappav;": "\u03F0",
  "&kcedil;": "\u0137",
  "&kcy;": "\u043A",
  "&kfr;": "\u{1D528}",
  "&kgreen;": "\u0138",
  "&khcy;": "\u0445",
  "&kjcy;": "\u045C",
  "&kopf;": "\u{1D55C}",
  "&kscr;": "\u{1D4C0}",
  "&lAarr;": "\u21DA",
  "&lArr;": "\u21D0",
  "&lAtail;": "\u291B",
  "&lBarr;": "\u290E",
  "&lE;": "\u2266",
  "&lEg;": "\u2A8B",
  "&lHar;": "\u2962",
  "&lacute;": "\u013A",
  "&laemptyv;": "\u29B4",
  "&lagran;": "\u2112",
  "&lambda;": "\u03BB",
  "&lang;": "\u27E8",
  "&langd;": "\u2991",
  "&langle;": "\u27E8",
  "&lap;": "\u2A85",
  "&laquo": "\xAB",
  "&laquo;": "\xAB",
  "&larr;": "\u2190",
  "&larrb;": "\u21E4",
  "&larrbfs;": "\u291F",
  "&larrfs;": "\u291D",
  "&larrhk;": "\u21A9",
  "&larrlp;": "\u21AB",
  "&larrpl;": "\u2939",
  "&larrsim;": "\u2973",
  "&larrtl;": "\u21A2",
  "&lat;": "\u2AAB",
  "&latail;": "\u2919",
  "&late;": "\u2AAD",
  "&lates;": "\u2AAD\uFE00",
  "&lbarr;": "\u290C",
  "&lbbrk;": "\u2772",
  "&lbrace;": "{",
  "&lbrack;": "[",
  "&lbrke;": "\u298B",
  "&lbrksld;": "\u298F",
  "&lbrkslu;": "\u298D",
  "&lcaron;": "\u013E",
  "&lcedil;": "\u013C",
  "&lceil;": "\u2308",
  "&lcub;": "{",
  "&lcy;": "\u043B",
  "&ldca;": "\u2936",
  "&ldquo;": "\u201C",
  "&ldquor;": "\u201E",
  "&ldrdhar;": "\u2967",
  "&ldrushar;": "\u294B",
  "&ldsh;": "\u21B2",
  "&le;": "\u2264",
  "&leftarrow;": "\u2190",
  "&leftarrowtail;": "\u21A2",
  "&leftharpoondown;": "\u21BD",
  "&leftharpoonup;": "\u21BC",
  "&leftleftarrows;": "\u21C7",
  "&leftrightarrow;": "\u2194",
  "&leftrightarrows;": "\u21C6",
  "&leftrightharpoons;": "\u21CB",
  "&leftrightsquigarrow;": "\u21AD",
  "&leftthreetimes;": "\u22CB",
  "&leg;": "\u22DA",
  "&leq;": "\u2264",
  "&leqq;": "\u2266",
  "&leqslant;": "\u2A7D",
  "&les;": "\u2A7D",
  "&lescc;": "\u2AA8",
  "&lesdot;": "\u2A7F",
  "&lesdoto;": "\u2A81",
  "&lesdotor;": "\u2A83",
  "&lesg;": "\u22DA\uFE00",
  "&lesges;": "\u2A93",
  "&lessapprox;": "\u2A85",
  "&lessdot;": "\u22D6",
  "&lesseqgtr;": "\u22DA",
  "&lesseqqgtr;": "\u2A8B",
  "&lessgtr;": "\u2276",
  "&lesssim;": "\u2272",
  "&lfisht;": "\u297C",
  "&lfloor;": "\u230A",
  "&lfr;": "\u{1D529}",
  "&lg;": "\u2276",
  "&lgE;": "\u2A91",
  "&lhard;": "\u21BD",
  "&lharu;": "\u21BC",
  "&lharul;": "\u296A",
  "&lhblk;": "\u2584",
  "&ljcy;": "\u0459",
  "&ll;": "\u226A",
  "&llarr;": "\u21C7",
  "&llcorner;": "\u231E",
  "&llhard;": "\u296B",
  "&lltri;": "\u25FA",
  "&lmidot;": "\u0140",
  "&lmoust;": "\u23B0",
  "&lmoustache;": "\u23B0",
  "&lnE;": "\u2268",
  "&lnap;": "\u2A89",
  "&lnapprox;": "\u2A89",
  "&lne;": "\u2A87",
  "&lneq;": "\u2A87",
  "&lneqq;": "\u2268",
  "&lnsim;": "\u22E6",
  "&loang;": "\u27EC",
  "&loarr;": "\u21FD",
  "&lobrk;": "\u27E6",
  "&longleftarrow;": "\u27F5",
  "&longleftrightarrow;": "\u27F7",
  "&longmapsto;": "\u27FC",
  "&longrightarrow;": "\u27F6",
  "&looparrowleft;": "\u21AB",
  "&looparrowright;": "\u21AC",
  "&lopar;": "\u2985",
  "&lopf;": "\u{1D55D}",
  "&loplus;": "\u2A2D",
  "&lotimes;": "\u2A34",
  "&lowast;": "\u2217",
  "&lowbar;": "_",
  "&loz;": "\u25CA",
  "&lozenge;": "\u25CA",
  "&lozf;": "\u29EB",
  "&lpar;": "(",
  "&lparlt;": "\u2993",
  "&lrarr;": "\u21C6",
  "&lrcorner;": "\u231F",
  "&lrhar;": "\u21CB",
  "&lrhard;": "\u296D",
  "&lrm;": "\u200E",
  "&lrtri;": "\u22BF",
  "&lsaquo;": "\u2039",
  "&lscr;": "\u{1D4C1}",
  "&lsh;": "\u21B0",
  "&lsim;": "\u2272",
  "&lsime;": "\u2A8D",
  "&lsimg;": "\u2A8F",
  "&lsqb;": "[",
  "&lsquo;": "\u2018",
  "&lsquor;": "\u201A",
  "&lstrok;": "\u0142",
  "&lt": "<",
  "&lt;": "<",
  "&ltcc;": "\u2AA6",
  "&ltcir;": "\u2A79",
  "&ltdot;": "\u22D6",
  "&lthree;": "\u22CB",
  "&ltimes;": "\u22C9",
  "&ltlarr;": "\u2976",
  "&ltquest;": "\u2A7B",
  "&ltrPar;": "\u2996",
  "&ltri;": "\u25C3",
  "&ltrie;": "\u22B4",
  "&ltrif;": "\u25C2",
  "&lurdshar;": "\u294A",
  "&luruhar;": "\u2966",
  "&lvertneqq;": "\u2268\uFE00",
  "&lvnE;": "\u2268\uFE00",
  "&mDDot;": "\u223A",
  "&macr": "\xAF",
  "&macr;": "\xAF",
  "&male;": "\u2642",
  "&malt;": "\u2720",
  "&maltese;": "\u2720",
  "&map;": "\u21A6",
  "&mapsto;": "\u21A6",
  "&mapstodown;": "\u21A7",
  "&mapstoleft;": "\u21A4",
  "&mapstoup;": "\u21A5",
  "&marker;": "\u25AE",
  "&mcomma;": "\u2A29",
  "&mcy;": "\u043C",
  "&mdash;": "\u2014",
  "&measuredangle;": "\u2221",
  "&mfr;": "\u{1D52A}",
  "&mho;": "\u2127",
  "&micro": "\xB5",
  "&micro;": "\xB5",
  "&mid;": "\u2223",
  "&midast;": "*",
  "&midcir;": "\u2AF0",
  "&middot": "\xB7",
  "&middot;": "\xB7",
  "&minus;": "\u2212",
  "&minusb;": "\u229F",
  "&minusd;": "\u2238",
  "&minusdu;": "\u2A2A",
  "&mlcp;": "\u2ADB",
  "&mldr;": "\u2026",
  "&mnplus;": "\u2213",
  "&models;": "\u22A7",
  "&mopf;": "\u{1D55E}",
  "&mp;": "\u2213",
  "&mscr;": "\u{1D4C2}",
  "&mstpos;": "\u223E",
  "&mu;": "\u03BC",
  "&multimap;": "\u22B8",
  "&mumap;": "\u22B8",
  "&nGg;": "\u22D9\u0338",
  "&nGt;": "\u226B\u20D2",
  "&nGtv;": "\u226B\u0338",
  "&nLeftarrow;": "\u21CD",
  "&nLeftrightarrow;": "\u21CE",
  "&nLl;": "\u22D8\u0338",
  "&nLt;": "\u226A\u20D2",
  "&nLtv;": "\u226A\u0338",
  "&nRightarrow;": "\u21CF",
  "&nVDash;": "\u22AF",
  "&nVdash;": "\u22AE",
  "&nabla;": "\u2207",
  "&nacute;": "\u0144",
  "&nang;": "\u2220\u20D2",
  "&nap;": "\u2249",
  "&napE;": "\u2A70\u0338",
  "&napid;": "\u224B\u0338",
  "&napos;": "\u0149",
  "&napprox;": "\u2249",
  "&natur;": "\u266E",
  "&natural;": "\u266E",
  "&naturals;": "\u2115",
  "&nbsp": "\xA0",
  "&nbsp;": "\xA0",
  "&nbump;": "\u224E\u0338",
  "&nbumpe;": "\u224F\u0338",
  "&ncap;": "\u2A43",
  "&ncaron;": "\u0148",
  "&ncedil;": "\u0146",
  "&ncong;": "\u2247",
  "&ncongdot;": "\u2A6D\u0338",
  "&ncup;": "\u2A42",
  "&ncy;": "\u043D",
  "&ndash;": "\u2013",
  "&ne;": "\u2260",
  "&neArr;": "\u21D7",
  "&nearhk;": "\u2924",
  "&nearr;": "\u2197",
  "&nearrow;": "\u2197",
  "&nedot;": "\u2250\u0338",
  "&nequiv;": "\u2262",
  "&nesear;": "\u2928",
  "&nesim;": "\u2242\u0338",
  "&nexist;": "\u2204",
  "&nexists;": "\u2204",
  "&nfr;": "\u{1D52B}",
  "&ngE;": "\u2267\u0338",
  "&nge;": "\u2271",
  "&ngeq;": "\u2271",
  "&ngeqq;": "\u2267\u0338",
  "&ngeqslant;": "\u2A7E\u0338",
  "&nges;": "\u2A7E\u0338",
  "&ngsim;": "\u2275",
  "&ngt;": "\u226F",
  "&ngtr;": "\u226F",
  "&nhArr;": "\u21CE",
  "&nharr;": "\u21AE",
  "&nhpar;": "\u2AF2",
  "&ni;": "\u220B",
  "&nis;": "\u22FC",
  "&nisd;": "\u22FA",
  "&niv;": "\u220B",
  "&njcy;": "\u045A",
  "&nlArr;": "\u21CD",
  "&nlE;": "\u2266\u0338",
  "&nlarr;": "\u219A",
  "&nldr;": "\u2025",
  "&nle;": "\u2270",
  "&nleftarrow;": "\u219A",
  "&nleftrightarrow;": "\u21AE",
  "&nleq;": "\u2270",
  "&nleqq;": "\u2266\u0338",
  "&nleqslant;": "\u2A7D\u0338",
  "&nles;": "\u2A7D\u0338",
  "&nless;": "\u226E",
  "&nlsim;": "\u2274",
  "&nlt;": "\u226E",
  "&nltri;": "\u22EA",
  "&nltrie;": "\u22EC",
  "&nmid;": "\u2224",
  "&nopf;": "\u{1D55F}",
  "&not": "\xAC",
  "&not;": "\xAC",
  "&notin;": "\u2209",
  "&notinE;": "\u22F9\u0338",
  "&notindot;": "\u22F5\u0338",
  "&notinva;": "\u2209",
  "&notinvb;": "\u22F7",
  "&notinvc;": "\u22F6",
  "&notni;": "\u220C",
  "&notniva;": "\u220C",
  "&notnivb;": "\u22FE",
  "&notnivc;": "\u22FD",
  "&npar;": "\u2226",
  "&nparallel;": "\u2226",
  "&nparsl;": "\u2AFD\u20E5",
  "&npart;": "\u2202\u0338",
  "&npolint;": "\u2A14",
  "&npr;": "\u2280",
  "&nprcue;": "\u22E0",
  "&npre;": "\u2AAF\u0338",
  "&nprec;": "\u2280",
  "&npreceq;": "\u2AAF\u0338",
  "&nrArr;": "\u21CF",
  "&nrarr;": "\u219B",
  "&nrarrc;": "\u2933\u0338",
  "&nrarrw;": "\u219D\u0338",
  "&nrightarrow;": "\u219B",
  "&nrtri;": "\u22EB",
  "&nrtrie;": "\u22ED",
  "&nsc;": "\u2281",
  "&nsccue;": "\u22E1",
  "&nsce;": "\u2AB0\u0338",
  "&nscr;": "\u{1D4C3}",
  "&nshortmid;": "\u2224",
  "&nshortparallel;": "\u2226",
  "&nsim;": "\u2241",
  "&nsime;": "\u2244",
  "&nsimeq;": "\u2244",
  "&nsmid;": "\u2224",
  "&nspar;": "\u2226",
  "&nsqsube;": "\u22E2",
  "&nsqsupe;": "\u22E3",
  "&nsub;": "\u2284",
  "&nsubE;": "\u2AC5\u0338",
  "&nsube;": "\u2288",
  "&nsubset;": "\u2282\u20D2",
  "&nsubseteq;": "\u2288",
  "&nsubseteqq;": "\u2AC5\u0338",
  "&nsucc;": "\u2281",
  "&nsucceq;": "\u2AB0\u0338",
  "&nsup;": "\u2285",
  "&nsupE;": "\u2AC6\u0338",
  "&nsupe;": "\u2289",
  "&nsupset;": "\u2283\u20D2",
  "&nsupseteq;": "\u2289",
  "&nsupseteqq;": "\u2AC6\u0338",
  "&ntgl;": "\u2279",
  "&ntilde": "\xF1",
  "&ntilde;": "\xF1",
  "&ntlg;": "\u2278",
  "&ntriangleleft;": "\u22EA",
  "&ntrianglelefteq;": "\u22EC",
  "&ntriangleright;": "\u22EB",
  "&ntrianglerighteq;": "\u22ED",
  "&nu;": "\u03BD",
  "&num;": "#",
  "&numero;": "\u2116",
  "&numsp;": "\u2007",
  "&nvDash;": "\u22AD",
  "&nvHarr;": "\u2904",
  "&nvap;": "\u224D\u20D2",
  "&nvdash;": "\u22AC",
  "&nvge;": "\u2265\u20D2",
  "&nvgt;": ">\u20D2",
  "&nvinfin;": "\u29DE",
  "&nvlArr;": "\u2902",
  "&nvle;": "\u2264\u20D2",
  "&nvlt;": "<\u20D2",
  "&nvltrie;": "\u22B4\u20D2",
  "&nvrArr;": "\u2903",
  "&nvrtrie;": "\u22B5\u20D2",
  "&nvsim;": "\u223C\u20D2",
  "&nwArr;": "\u21D6",
  "&nwarhk;": "\u2923",
  "&nwarr;": "\u2196",
  "&nwarrow;": "\u2196",
  "&nwnear;": "\u2927",
  "&oS;": "\u24C8",
  "&oacute": "\xF3",
  "&oacute;": "\xF3",
  "&oast;": "\u229B",
  "&ocir;": "\u229A",
  "&ocirc": "\xF4",
  "&ocirc;": "\xF4",
  "&ocy;": "\u043E",
  "&odash;": "\u229D",
  "&odblac;": "\u0151",
  "&odiv;": "\u2A38",
  "&odot;": "\u2299",
  "&odsold;": "\u29BC",
  "&oelig;": "\u0153",
  "&ofcir;": "\u29BF",
  "&ofr;": "\u{1D52C}",
  "&ogon;": "\u02DB",
  "&ograve": "\xF2",
  "&ograve;": "\xF2",
  "&ogt;": "\u29C1",
  "&ohbar;": "\u29B5",
  "&ohm;": "\u03A9",
  "&oint;": "\u222E",
  "&olarr;": "\u21BA",
  "&olcir;": "\u29BE",
  "&olcross;": "\u29BB",
  "&oline;": "\u203E",
  "&olt;": "\u29C0",
  "&omacr;": "\u014D",
  "&omega;": "\u03C9",
  "&omicron;": "\u03BF",
  "&omid;": "\u29B6",
  "&ominus;": "\u2296",
  "&oopf;": "\u{1D560}",
  "&opar;": "\u29B7",
  "&operp;": "\u29B9",
  "&oplus;": "\u2295",
  "&or;": "\u2228",
  "&orarr;": "\u21BB",
  "&ord;": "\u2A5D",
  "&order;": "\u2134",
  "&orderof;": "\u2134",
  "&ordf": "\xAA",
  "&ordf;": "\xAA",
  "&ordm": "\xBA",
  "&ordm;": "\xBA",
  "&origof;": "\u22B6",
  "&oror;": "\u2A56",
  "&orslope;": "\u2A57",
  "&orv;": "\u2A5B",
  "&oscr;": "\u2134",
  "&oslash": "\xF8",
  "&oslash;": "\xF8",
  "&osol;": "\u2298",
  "&otilde": "\xF5",
  "&otilde;": "\xF5",
  "&otimes;": "\u2297",
  "&otimesas;": "\u2A36",
  "&ouml": "\xF6",
  "&ouml;": "\xF6",
  "&ovbar;": "\u233D",
  "&par;": "\u2225",
  "&para": "\xB6",
  "&para;": "\xB6",
  "&parallel;": "\u2225",
  "&parsim;": "\u2AF3",
  "&parsl;": "\u2AFD",
  "&part;": "\u2202",
  "&pcy;": "\u043F",
  "&percnt;": "%",
  "&period;": ".",
  "&permil;": "\u2030",
  "&perp;": "\u22A5",
  "&pertenk;": "\u2031",
  "&pfr;": "\u{1D52D}",
  "&phi;": "\u03C6",
  "&phiv;": "\u03D5",
  "&phmmat;": "\u2133",
  "&phone;": "\u260E",
  "&pi;": "\u03C0",
  "&pitchfork;": "\u22D4",
  "&piv;": "\u03D6",
  "&planck;": "\u210F",
  "&planckh;": "\u210E",
  "&plankv;": "\u210F",
  "&plus;": "+",
  "&plusacir;": "\u2A23",
  "&plusb;": "\u229E",
  "&pluscir;": "\u2A22",
  "&plusdo;": "\u2214",
  "&plusdu;": "\u2A25",
  "&pluse;": "\u2A72",
  "&plusmn": "\xB1",
  "&plusmn;": "\xB1",
  "&plussim;": "\u2A26",
  "&plustwo;": "\u2A27",
  "&pm;": "\xB1",
  "&pointint;": "\u2A15",
  "&popf;": "\u{1D561}",
  "&pound": "\xA3",
  "&pound;": "\xA3",
  "&pr;": "\u227A",
  "&prE;": "\u2AB3",
  "&prap;": "\u2AB7",
  "&prcue;": "\u227C",
  "&pre;": "\u2AAF",
  "&prec;": "\u227A",
  "&precapprox;": "\u2AB7",
  "&preccurlyeq;": "\u227C",
  "&preceq;": "\u2AAF",
  "&precnapprox;": "\u2AB9",
  "&precneqq;": "\u2AB5",
  "&precnsim;": "\u22E8",
  "&precsim;": "\u227E",
  "&prime;": "\u2032",
  "&primes;": "\u2119",
  "&prnE;": "\u2AB5",
  "&prnap;": "\u2AB9",
  "&prnsim;": "\u22E8",
  "&prod;": "\u220F",
  "&profalar;": "\u232E",
  "&profline;": "\u2312",
  "&profsurf;": "\u2313",
  "&prop;": "\u221D",
  "&propto;": "\u221D",
  "&prsim;": "\u227E",
  "&prurel;": "\u22B0",
  "&pscr;": "\u{1D4C5}",
  "&psi;": "\u03C8",
  "&puncsp;": "\u2008",
  "&qfr;": "\u{1D52E}",
  "&qint;": "\u2A0C",
  "&qopf;": "\u{1D562}",
  "&qprime;": "\u2057",
  "&qscr;": "\u{1D4C6}",
  "&quaternions;": "\u210D",
  "&quatint;": "\u2A16",
  "&quest;": "?",
  "&questeq;": "\u225F",
  "&quot": '"',
  "&quot;": '"',
  "&rAarr;": "\u21DB",
  "&rArr;": "\u21D2",
  "&rAtail;": "\u291C",
  "&rBarr;": "\u290F",
  "&rHar;": "\u2964",
  "&race;": "\u223D\u0331",
  "&racute;": "\u0155",
  "&radic;": "\u221A",
  "&raemptyv;": "\u29B3",
  "&rang;": "\u27E9",
  "&rangd;": "\u2992",
  "&range;": "\u29A5",
  "&rangle;": "\u27E9",
  "&raquo": "\xBB",
  "&raquo;": "\xBB",
  "&rarr;": "\u2192",
  "&rarrap;": "\u2975",
  "&rarrb;": "\u21E5",
  "&rarrbfs;": "\u2920",
  "&rarrc;": "\u2933",
  "&rarrfs;": "\u291E",
  "&rarrhk;": "\u21AA",
  "&rarrlp;": "\u21AC",
  "&rarrpl;": "\u2945",
  "&rarrsim;": "\u2974",
  "&rarrtl;": "\u21A3",
  "&rarrw;": "\u219D",
  "&ratail;": "\u291A",
  "&ratio;": "\u2236",
  "&rationals;": "\u211A",
  "&rbarr;": "\u290D",
  "&rbbrk;": "\u2773",
  "&rbrace;": "}",
  "&rbrack;": "]",
  "&rbrke;": "\u298C",
  "&rbrksld;": "\u298E",
  "&rbrkslu;": "\u2990",
  "&rcaron;": "\u0159",
  "&rcedil;": "\u0157",
  "&rceil;": "\u2309",
  "&rcub;": "}",
  "&rcy;": "\u0440",
  "&rdca;": "\u2937",
  "&rdldhar;": "\u2969",
  "&rdquo;": "\u201D",
  "&rdquor;": "\u201D",
  "&rdsh;": "\u21B3",
  "&real;": "\u211C",
  "&realine;": "\u211B",
  "&realpart;": "\u211C",
  "&reals;": "\u211D",
  "&rect;": "\u25AD",
  "&reg": "\xAE",
  "&reg;": "\xAE",
  "&rfisht;": "\u297D",
  "&rfloor;": "\u230B",
  "&rfr;": "\u{1D52F}",
  "&rhard;": "\u21C1",
  "&rharu;": "\u21C0",
  "&rharul;": "\u296C",
  "&rho;": "\u03C1",
  "&rhov;": "\u03F1",
  "&rightarrow;": "\u2192",
  "&rightarrowtail;": "\u21A3",
  "&rightharpoondown;": "\u21C1",
  "&rightharpoonup;": "\u21C0",
  "&rightleftarrows;": "\u21C4",
  "&rightleftharpoons;": "\u21CC",
  "&rightrightarrows;": "\u21C9",
  "&rightsquigarrow;": "\u219D",
  "&rightthreetimes;": "\u22CC",
  "&ring;": "\u02DA",
  "&risingdotseq;": "\u2253",
  "&rlarr;": "\u21C4",
  "&rlhar;": "\u21CC",
  "&rlm;": "\u200F",
  "&rmoust;": "\u23B1",
  "&rmoustache;": "\u23B1",
  "&rnmid;": "\u2AEE",
  "&roang;": "\u27ED",
  "&roarr;": "\u21FE",
  "&robrk;": "\u27E7",
  "&ropar;": "\u2986",
  "&ropf;": "\u{1D563}",
  "&roplus;": "\u2A2E",
  "&rotimes;": "\u2A35",
  "&rpar;": ")",
  "&rpargt;": "\u2994",
  "&rppolint;": "\u2A12",
  "&rrarr;": "\u21C9",
  "&rsaquo;": "\u203A",
  "&rscr;": "\u{1D4C7}",
  "&rsh;": "\u21B1",
  "&rsqb;": "]",
  "&rsquo;": "\u2019",
  "&rsquor;": "\u2019",
  "&rthree;": "\u22CC",
  "&rtimes;": "\u22CA",
  "&rtri;": "\u25B9",
  "&rtrie;": "\u22B5",
  "&rtrif;": "\u25B8",
  "&rtriltri;": "\u29CE",
  "&ruluhar;": "\u2968",
  "&rx;": "\u211E",
  "&sacute;": "\u015B",
  "&sbquo;": "\u201A",
  "&sc;": "\u227B",
  "&scE;": "\u2AB4",
  "&scap;": "\u2AB8",
  "&scaron;": "\u0161",
  "&sccue;": "\u227D",
  "&sce;": "\u2AB0",
  "&scedil;": "\u015F",
  "&scirc;": "\u015D",
  "&scnE;": "\u2AB6",
  "&scnap;": "\u2ABA",
  "&scnsim;": "\u22E9",
  "&scpolint;": "\u2A13",
  "&scsim;": "\u227F",
  "&scy;": "\u0441",
  "&sdot;": "\u22C5",
  "&sdotb;": "\u22A1",
  "&sdote;": "\u2A66",
  "&seArr;": "\u21D8",
  "&searhk;": "\u2925",
  "&searr;": "\u2198",
  "&searrow;": "\u2198",
  "&sect": "\xA7",
  "&sect;": "\xA7",
  "&semi;": ";",
  "&seswar;": "\u2929",
  "&setminus;": "\u2216",
  "&setmn;": "\u2216",
  "&sext;": "\u2736",
  "&sfr;": "\u{1D530}",
  "&sfrown;": "\u2322",
  "&sharp;": "\u266F",
  "&shchcy;": "\u0449",
  "&shcy;": "\u0448",
  "&shortmid;": "\u2223",
  "&shortparallel;": "\u2225",
  "&shy": "\xAD",
  "&shy;": "\xAD",
  "&sigma;": "\u03C3",
  "&sigmaf;": "\u03C2",
  "&sigmav;": "\u03C2",
  "&sim;": "\u223C",
  "&simdot;": "\u2A6A",
  "&sime;": "\u2243",
  "&simeq;": "\u2243",
  "&simg;": "\u2A9E",
  "&simgE;": "\u2AA0",
  "&siml;": "\u2A9D",
  "&simlE;": "\u2A9F",
  "&simne;": "\u2246",
  "&simplus;": "\u2A24",
  "&simrarr;": "\u2972",
  "&slarr;": "\u2190",
  "&smallsetminus;": "\u2216",
  "&smashp;": "\u2A33",
  "&smeparsl;": "\u29E4",
  "&smid;": "\u2223",
  "&smile;": "\u2323",
  "&smt;": "\u2AAA",
  "&smte;": "\u2AAC",
  "&smtes;": "\u2AAC\uFE00",
  "&softcy;": "\u044C",
  "&sol;": "/",
  "&solb;": "\u29C4",
  "&solbar;": "\u233F",
  "&sopf;": "\u{1D564}",
  "&spades;": "\u2660",
  "&spadesuit;": "\u2660",
  "&spar;": "\u2225",
  "&sqcap;": "\u2293",
  "&sqcaps;": "\u2293\uFE00",
  "&sqcup;": "\u2294",
  "&sqcups;": "\u2294\uFE00",
  "&sqsub;": "\u228F",
  "&sqsube;": "\u2291",
  "&sqsubset;": "\u228F",
  "&sqsubseteq;": "\u2291",
  "&sqsup;": "\u2290",
  "&sqsupe;": "\u2292",
  "&sqsupset;": "\u2290",
  "&sqsupseteq;": "\u2292",
  "&squ;": "\u25A1",
  "&square;": "\u25A1",
  "&squarf;": "\u25AA",
  "&squf;": "\u25AA",
  "&srarr;": "\u2192",
  "&sscr;": "\u{1D4C8}",
  "&ssetmn;": "\u2216",
  "&ssmile;": "\u2323",
  "&sstarf;": "\u22C6",
  "&star;": "\u2606",
  "&starf;": "\u2605",
  "&straightepsilon;": "\u03F5",
  "&straightphi;": "\u03D5",
  "&strns;": "\xAF",
  "&sub;": "\u2282",
  "&subE;": "\u2AC5",
  "&subdot;": "\u2ABD",
  "&sube;": "\u2286",
  "&subedot;": "\u2AC3",
  "&submult;": "\u2AC1",
  "&subnE;": "\u2ACB",
  "&subne;": "\u228A",
  "&subplus;": "\u2ABF",
  "&subrarr;": "\u2979",
  "&subset;": "\u2282",
  "&subseteq;": "\u2286",
  "&subseteqq;": "\u2AC5",
  "&subsetneq;": "\u228A",
  "&subsetneqq;": "\u2ACB",
  "&subsim;": "\u2AC7",
  "&subsub;": "\u2AD5",
  "&subsup;": "\u2AD3",
  "&succ;": "\u227B",
  "&succapprox;": "\u2AB8",
  "&succcurlyeq;": "\u227D",
  "&succeq;": "\u2AB0",
  "&succnapprox;": "\u2ABA",
  "&succneqq;": "\u2AB6",
  "&succnsim;": "\u22E9",
  "&succsim;": "\u227F",
  "&sum;": "\u2211",
  "&sung;": "\u266A",
  "&sup1": "\xB9",
  "&sup1;": "\xB9",
  "&sup2": "\xB2",
  "&sup2;": "\xB2",
  "&sup3": "\xB3",
  "&sup3;": "\xB3",
  "&sup;": "\u2283",
  "&supE;": "\u2AC6",
  "&supdot;": "\u2ABE",
  "&supdsub;": "\u2AD8",
  "&supe;": "\u2287",
  "&supedot;": "\u2AC4",
  "&suphsol;": "\u27C9",
  "&suphsub;": "\u2AD7",
  "&suplarr;": "\u297B",
  "&supmult;": "\u2AC2",
  "&supnE;": "\u2ACC",
  "&supne;": "\u228B",
  "&supplus;": "\u2AC0",
  "&supset;": "\u2283",
  "&supseteq;": "\u2287",
  "&supseteqq;": "\u2AC6",
  "&supsetneq;": "\u228B",
  "&supsetneqq;": "\u2ACC",
  "&supsim;": "\u2AC8",
  "&supsub;": "\u2AD4",
  "&supsup;": "\u2AD6",
  "&swArr;": "\u21D9",
  "&swarhk;": "\u2926",
  "&swarr;": "\u2199",
  "&swarrow;": "\u2199",
  "&swnwar;": "\u292A",
  "&szlig": "\xDF",
  "&szlig;": "\xDF",
  "&target;": "\u2316",
  "&tau;": "\u03C4",
  "&tbrk;": "\u23B4",
  "&tcaron;": "\u0165",
  "&tcedil;": "\u0163",
  "&tcy;": "\u0442",
  "&tdot;": "\u20DB",
  "&telrec;": "\u2315",
  "&tfr;": "\u{1D531}",
  "&there4;": "\u2234",
  "&therefore;": "\u2234",
  "&theta;": "\u03B8",
  "&thetasym;": "\u03D1",
  "&thetav;": "\u03D1",
  "&thickapprox;": "\u2248",
  "&thicksim;": "\u223C",
  "&thinsp;": "\u2009",
  "&thkap;": "\u2248",
  "&thksim;": "\u223C",
  "&thorn": "\xFE",
  "&thorn;": "\xFE",
  "&tilde;": "\u02DC",
  "&times": "\xD7",
  "&times;": "\xD7",
  "&timesb;": "\u22A0",
  "&timesbar;": "\u2A31",
  "&timesd;": "\u2A30",
  "&tint;": "\u222D",
  "&toea;": "\u2928",
  "&top;": "\u22A4",
  "&topbot;": "\u2336",
  "&topcir;": "\u2AF1",
  "&topf;": "\u{1D565}",
  "&topfork;": "\u2ADA",
  "&tosa;": "\u2929",
  "&tprime;": "\u2034",
  "&trade;": "\u2122",
  "&triangle;": "\u25B5",
  "&triangledown;": "\u25BF",
  "&triangleleft;": "\u25C3",
  "&trianglelefteq;": "\u22B4",
  "&triangleq;": "\u225C",
  "&triangleright;": "\u25B9",
  "&trianglerighteq;": "\u22B5",
  "&tridot;": "\u25EC",
  "&trie;": "\u225C",
  "&triminus;": "\u2A3A",
  "&triplus;": "\u2A39",
  "&trisb;": "\u29CD",
  "&tritime;": "\u2A3B",
  "&trpezium;": "\u23E2",
  "&tscr;": "\u{1D4C9}",
  "&tscy;": "\u0446",
  "&tshcy;": "\u045B",
  "&tstrok;": "\u0167",
  "&twixt;": "\u226C",
  "&twoheadleftarrow;": "\u219E",
  "&twoheadrightarrow;": "\u21A0",
  "&uArr;": "\u21D1",
  "&uHar;": "\u2963",
  "&uacute": "\xFA",
  "&uacute;": "\xFA",
  "&uarr;": "\u2191",
  "&ubrcy;": "\u045E",
  "&ubreve;": "\u016D",
  "&ucirc": "\xFB",
  "&ucirc;": "\xFB",
  "&ucy;": "\u0443",
  "&udarr;": "\u21C5",
  "&udblac;": "\u0171",
  "&udhar;": "\u296E",
  "&ufisht;": "\u297E",
  "&ufr;": "\u{1D532}",
  "&ugrave": "\xF9",
  "&ugrave;": "\xF9",
  "&uharl;": "\u21BF",
  "&uharr;": "\u21BE",
  "&uhblk;": "\u2580",
  "&ulcorn;": "\u231C",
  "&ulcorner;": "\u231C",
  "&ulcrop;": "\u230F",
  "&ultri;": "\u25F8",
  "&umacr;": "\u016B",
  "&uml": "\xA8",
  "&uml;": "\xA8",
  "&uogon;": "\u0173",
  "&uopf;": "\u{1D566}",
  "&uparrow;": "\u2191",
  "&updownarrow;": "\u2195",
  "&upharpoonleft;": "\u21BF",
  "&upharpoonright;": "\u21BE",
  "&uplus;": "\u228E",
  "&upsi;": "\u03C5",
  "&upsih;": "\u03D2",
  "&upsilon;": "\u03C5",
  "&upuparrows;": "\u21C8",
  "&urcorn;": "\u231D",
  "&urcorner;": "\u231D",
  "&urcrop;": "\u230E",
  "&uring;": "\u016F",
  "&urtri;": "\u25F9",
  "&uscr;": "\u{1D4CA}",
  "&utdot;": "\u22F0",
  "&utilde;": "\u0169",
  "&utri;": "\u25B5",
  "&utrif;": "\u25B4",
  "&uuarr;": "\u21C8",
  "&uuml": "\xFC",
  "&uuml;": "\xFC",
  "&uwangle;": "\u29A7",
  "&vArr;": "\u21D5",
  "&vBar;": "\u2AE8",
  "&vBarv;": "\u2AE9",
  "&vDash;": "\u22A8",
  "&vangrt;": "\u299C",
  "&varepsilon;": "\u03F5",
  "&varkappa;": "\u03F0",
  "&varnothing;": "\u2205",
  "&varphi;": "\u03D5",
  "&varpi;": "\u03D6",
  "&varpropto;": "\u221D",
  "&varr;": "\u2195",
  "&varrho;": "\u03F1",
  "&varsigma;": "\u03C2",
  "&varsubsetneq;": "\u228A\uFE00",
  "&varsubsetneqq;": "\u2ACB\uFE00",
  "&varsupsetneq;": "\u228B\uFE00",
  "&varsupsetneqq;": "\u2ACC\uFE00",
  "&vartheta;": "\u03D1",
  "&vartriangleleft;": "\u22B2",
  "&vartriangleright;": "\u22B3",
  "&vcy;": "\u0432",
  "&vdash;": "\u22A2",
  "&vee;": "\u2228",
  "&veebar;": "\u22BB",
  "&veeeq;": "\u225A",
  "&vellip;": "\u22EE",
  "&verbar;": "|",
  "&vert;": "|",
  "&vfr;": "\u{1D533}",
  "&vltri;": "\u22B2",
  "&vnsub;": "\u2282\u20D2",
  "&vnsup;": "\u2283\u20D2",
  "&vopf;": "\u{1D567}",
  "&vprop;": "\u221D",
  "&vrtri;": "\u22B3",
  "&vscr;": "\u{1D4CB}",
  "&vsubnE;": "\u2ACB\uFE00",
  "&vsubne;": "\u228A\uFE00",
  "&vsupnE;": "\u2ACC\uFE00",
  "&vsupne;": "\u228B\uFE00",
  "&vzigzag;": "\u299A",
  "&wcirc;": "\u0175",
  "&wedbar;": "\u2A5F",
  "&wedge;": "\u2227",
  "&wedgeq;": "\u2259",
  "&weierp;": "\u2118",
  "&wfr;": "\u{1D534}",
  "&wopf;": "\u{1D568}",
  "&wp;": "\u2118",
  "&wr;": "\u2240",
  "&wreath;": "\u2240",
  "&wscr;": "\u{1D4CC}",
  "&xcap;": "\u22C2",
  "&xcirc;": "\u25EF",
  "&xcup;": "\u22C3",
  "&xdtri;": "\u25BD",
  "&xfr;": "\u{1D535}",
  "&xhArr;": "\u27FA",
  "&xharr;": "\u27F7",
  "&xi;": "\u03BE",
  "&xlArr;": "\u27F8",
  "&xlarr;": "\u27F5",
  "&xmap;": "\u27FC",
  "&xnis;": "\u22FB",
  "&xodot;": "\u2A00",
  "&xopf;": "\u{1D569}",
  "&xoplus;": "\u2A01",
  "&xotime;": "\u2A02",
  "&xrArr;": "\u27F9",
  "&xrarr;": "\u27F6",
  "&xscr;": "\u{1D4CD}",
  "&xsqcup;": "\u2A06",
  "&xuplus;": "\u2A04",
  "&xutri;": "\u25B3",
  "&xvee;": "\u22C1",
  "&xwedge;": "\u22C0",
  "&yacute": "\xFD",
  "&yacute;": "\xFD",
  "&yacy;": "\u044F",
  "&ycirc;": "\u0177",
  "&ycy;": "\u044B",
  "&yen": "\xA5",
  "&yen;": "\xA5",
  "&yfr;": "\u{1D536}",
  "&yicy;": "\u0457",
  "&yopf;": "\u{1D56A}",
  "&yscr;": "\u{1D4CE}",
  "&yucy;": "\u044E",
  "&yuml": "\xFF",
  "&yuml;": "\xFF",
  "&zacute;": "\u017A",
  "&zcaron;": "\u017E",
  "&zcy;": "\u0437",
  "&zdot;": "\u017C",
  "&zeetrf;": "\u2128",
  "&zeta;": "\u03B6",
  "&zfr;": "\u{1D537}",
  "&zhcy;": "\u0436",
  "&zigrarr;": "\u21DD",
  "&zopf;": "\u{1D56B}",
  "&zscr;": "\u{1D4CF}",
  "&zwj;": "\u200D",
  "&zwnj;": "\u200C"
};
var html_entities_default = htmlEntities;

// node_modules/postal-mime/src/text-format.js
function decodeHTMLEntities(str) {
  return str.replace(/&(#\d+|#x[a-f0-9]+|[a-z]+\d*);?/gi, (match2, entity) => {
    if (typeof html_entities_default[match2] === "string") {
      return html_entities_default[match2];
    }
    if (entity.charAt(0) !== "#" || match2.charAt(match2.length - 1) !== ";") {
      return match2;
    }
    let codePoint;
    if (entity.charAt(1) === "x") {
      codePoint = parseInt(entity.substr(2), 16);
    } else {
      codePoint = parseInt(entity.substr(1), 10);
    }
    let output = "";
    if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
      return "\uFFFD";
    }
    if (codePoint > 65535) {
      codePoint -= 65536;
      output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    output += String.fromCharCode(codePoint);
    return output;
  });
}
__name(decodeHTMLEntities, "decodeHTMLEntities");
function escapeHtml(str) {
  return str.trim().replace(/[<>"'?&]/g, (c) => {
    let hex = c.charCodeAt(0).toString(16);
    if (hex.length < 2) {
      hex = "0" + hex;
    }
    return "&#x" + hex.toUpperCase() + ";";
  });
}
__name(escapeHtml, "escapeHtml");
function textToHtml(str) {
  let html = escapeHtml(str).replace(/\n/g, "<br />");
  return "<div>" + html + "</div>";
}
__name(textToHtml, "textToHtml");
function htmlToText(str) {
  str = str.replace(/\r?\n/g, "").replace(/<\!\-\-.*?\-\->/gi, " ").replace(/<br\b[^>]*>/gi, "\n").replace(/<\/?(p|div|table|tr|td|th)\b[^>]*>/gi, "\n\n").replace(/<script\b[^>]*>.*?<\/script\b[^>]*>/gi, " ").replace(/^.*<body\b[^>]*>/i, "").replace(/^.*<\/head\b[^>]*>/i, "").replace(/^.*<\!doctype\b[^>]*>/i, "").replace(/<\/body\b[^>]*>.*$/i, "").replace(/<\/html\b[^>]*>.*$/i, "").replace(/<a\b[^>]*href\s*=\s*["']?([^\s"']+)[^>]*>/gi, " ($1) ").replace(/<\/?(span|em|i|strong|b|u|a)\b[^>]*>/gi, "").replace(/<li\b[^>]*>[\n\u0001\s]*/gi, "* ").replace(/<hr\b[^>]*>/g, "\n-------------\n").replace(/<[^>]*>/g, " ").replace(/\u0001/g, "\n").replace(/[ \t]+/g, " ").replace(/^\s+$/gm, "").replace(/\n\n+/g, "\n\n").replace(/^\n+/, "\n").replace(/\n+$/, "\n");
  str = decodeHTMLEntities(str);
  return str;
}
__name(htmlToText, "htmlToText");
function formatTextAddress(address) {
  return [].concat(address.name || []).concat(address.name ? `<${address.address}>` : address.address).join(" ");
}
__name(formatTextAddress, "formatTextAddress");
function formatTextAddresses(addresses) {
  let parts = [];
  let processAddress = /* @__PURE__ */ __name((address, partCounter) => {
    if (partCounter) {
      parts.push(", ");
    }
    if (address.group) {
      let groupStart = `${address.name}:`;
      let groupEnd = `;`;
      parts.push(groupStart);
      address.group.forEach(processAddress);
      parts.push(groupEnd);
    } else {
      parts.push(formatTextAddress(address));
    }
  }, "processAddress");
  addresses.forEach(processAddress);
  return parts.join("");
}
__name(formatTextAddresses, "formatTextAddresses");
function formatHtmlAddress(address) {
  return `<a href="mailto:${escapeHtml(address.address)}" class="postal-email-address">${escapeHtml(address.name || `<${address.address}>`)}</a>`;
}
__name(formatHtmlAddress, "formatHtmlAddress");
function formatHtmlAddresses(addresses) {
  let parts = [];
  let processAddress = /* @__PURE__ */ __name((address, partCounter) => {
    if (partCounter) {
      parts.push('<span class="postal-email-address-separator">, </span>');
    }
    if (address.group) {
      let groupStart = `<span class="postal-email-address-group">${escapeHtml(address.name)}:</span>`;
      let groupEnd = `<span class="postal-email-address-group">;</span>`;
      parts.push(groupStart);
      address.group.forEach(processAddress);
      parts.push(groupEnd);
    } else {
      parts.push(formatHtmlAddress(address));
    }
  }, "processAddress");
  addresses.forEach(processAddress);
  return parts.join(" ");
}
__name(formatHtmlAddresses, "formatHtmlAddresses");
function foldLines(str, lineLength, afterSpace) {
  str = (str || "").toString();
  lineLength = lineLength || 76;
  let pos = 0, len = str.length, result = "", line, match2;
  while (pos < len) {
    line = str.substr(pos, lineLength);
    if (line.length < lineLength) {
      result += line;
      break;
    }
    if (match2 = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
      line = match2[0];
      result += line;
      pos += line.length;
      continue;
    } else if ((match2 = line.match(/(\s+)[^\s]*$/)) && match2[0].length - (afterSpace ? (match2[1] || "").length : 0) < line.length) {
      line = line.substr(0, line.length - (match2[0].length - (afterSpace ? (match2[1] || "").length : 0)));
    } else if (match2 = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) {
      line = line + match2[0].substr(0, match2[0].length - (!afterSpace ? (match2[1] || "").length : 0));
    }
    result += line;
    pos += line.length;
    if (pos < len) {
      result += "\r\n";
    }
  }
  return result;
}
__name(foldLines, "foldLines");
function formatTextHeader(message) {
  let rows = [];
  if (message.from) {
    rows.push({ key: "From", val: formatTextAddress(message.from) });
  }
  if (message.subject) {
    rows.push({ key: "Subject", val: message.subject });
  }
  if (message.date) {
    let dateOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    };
    let dateStr = typeof Intl === "undefined" ? message.date : new Intl.DateTimeFormat("default", dateOptions).format(new Date(message.date));
    rows.push({ key: "Date", val: dateStr });
  }
  if (message.to && message.to.length) {
    rows.push({ key: "To", val: formatTextAddresses(message.to) });
  }
  if (message.cc && message.cc.length) {
    rows.push({ key: "Cc", val: formatTextAddresses(message.cc) });
  }
  if (message.bcc && message.bcc.length) {
    rows.push({ key: "Bcc", val: formatTextAddresses(message.bcc) });
  }
  let maxKeyLength = rows.map((r) => r.key.length).reduce((acc, cur) => {
    return cur > acc ? cur : acc;
  }, 0);
  rows = rows.flatMap((row) => {
    let sepLen = maxKeyLength - row.key.length;
    let prefix = `${row.key}: ${" ".repeat(sepLen)}`;
    let emptyPrefix = `${" ".repeat(row.key.length + 1)} ${" ".repeat(sepLen)}`;
    let foldedLines = foldLines(row.val, 80, true).split(/\r?\n/).map((line) => line.trim());
    return foldedLines.map((line, i) => `${i ? emptyPrefix : prefix}${line}`);
  });
  let maxLineLength = rows.map((r) => r.length).reduce((acc, cur) => {
    return cur > acc ? cur : acc;
  }, 0);
  let lineMarker = "-".repeat(maxLineLength);
  let template = `
${lineMarker}
${rows.join("\n")}
${lineMarker}
`;
  return template;
}
__name(formatTextHeader, "formatTextHeader");
function formatHtmlHeader(message) {
  let rows = [];
  if (message.from) {
    rows.push(
      `<div class="postal-email-header-key">From</div><div class="postal-email-header-value">${formatHtmlAddress(message.from)}</div>`
    );
  }
  if (message.subject) {
    rows.push(
      `<div class="postal-email-header-key">Subject</div><div class="postal-email-header-value postal-email-header-subject">${escapeHtml(
        message.subject
      )}</div>`
    );
  }
  if (message.date) {
    let dateOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    };
    let dateStr = typeof Intl === "undefined" ? message.date : new Intl.DateTimeFormat("default", dateOptions).format(new Date(message.date));
    rows.push(
      `<div class="postal-email-header-key">Date</div><div class="postal-email-header-value postal-email-header-date" data-date="${escapeHtml(
        message.date
      )}">${escapeHtml(dateStr)}</div>`
    );
  }
  if (message.to && message.to.length) {
    rows.push(
      `<div class="postal-email-header-key">To</div><div class="postal-email-header-value">${formatHtmlAddresses(message.to)}</div>`
    );
  }
  if (message.cc && message.cc.length) {
    rows.push(
      `<div class="postal-email-header-key">Cc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.cc)}</div>`
    );
  }
  if (message.bcc && message.bcc.length) {
    rows.push(
      `<div class="postal-email-header-key">Bcc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.bcc)}</div>`
    );
  }
  let template = `<div class="postal-email-header">${rows.length ? '<div class="postal-email-header-row">' : ""}${rows.join(
    '</div>\n<div class="postal-email-header-row">'
  )}${rows.length ? "</div>" : ""}</div>`;
  return template;
}
__name(formatHtmlHeader, "formatHtmlHeader");

// node_modules/postal-mime/src/address-parser.js
function _handleAddress(tokens, depth) {
  let isGroup = false;
  let state = "text";
  let address;
  let addresses = [];
  let data = {
    address: [],
    comment: [],
    group: [],
    text: [],
    textWasQuoted: []
    // Track which text tokens came from inside quotes
  };
  let i;
  let len;
  let insideQuotes = false;
  for (i = 0, len = tokens.length; i < len; i++) {
    let token = tokens[i];
    let prevToken = i ? tokens[i - 1] : null;
    if (token.type === "operator") {
      switch (token.value) {
        case "<":
          state = "address";
          insideQuotes = false;
          break;
        case "(":
          state = "comment";
          insideQuotes = false;
          break;
        case ":":
          state = "group";
          isGroup = true;
          insideQuotes = false;
          break;
        case '"':
          insideQuotes = !insideQuotes;
          state = "text";
          break;
        default:
          state = "text";
          insideQuotes = false;
          break;
      }
    } else if (token.value) {
      if (state === "address") {
        token.value = token.value.replace(/^[^<]*<\s*/, "");
      }
      if (prevToken && prevToken.noBreak && data[state].length) {
        data[state][data[state].length - 1] += token.value;
        if (state === "text" && insideQuotes) {
          data.textWasQuoted[data.textWasQuoted.length - 1] = true;
        }
      } else {
        data[state].push(token.value);
        if (state === "text") {
          data.textWasQuoted.push(insideQuotes);
        }
      }
    }
  }
  if (!data.text.length && data.comment.length) {
    data.text = data.comment;
    data.comment = [];
  }
  if (isGroup) {
    data.text = data.text.join(" ");
    let groupMembers = [];
    if (data.group.length) {
      let parsedGroup = addressParser(data.group.join(","), { _depth: depth + 1 });
      parsedGroup.forEach((member) => {
        if (member.group) {
          groupMembers = groupMembers.concat(member.group);
        } else {
          groupMembers.push(member);
        }
      });
    }
    addresses.push({
      name: decodeWords(data.text || address && address.name),
      group: groupMembers
    });
  } else {
    if (!data.address.length && data.text.length) {
      for (i = data.text.length - 1; i >= 0; i--) {
        if (!data.textWasQuoted[i] && data.text[i].match(/^[^@\s]+@[^@\s]+$/)) {
          data.address = data.text.splice(i, 1);
          data.textWasQuoted.splice(i, 1);
          break;
        }
      }
      let _regexHandler = /* @__PURE__ */ __name(function(address2) {
        if (!data.address.length) {
          data.address = [address2.trim()];
          return " ";
        } else {
          return address2;
        }
      }, "_regexHandler");
      if (!data.address.length) {
        for (i = data.text.length - 1; i >= 0; i--) {
          if (!data.textWasQuoted[i]) {
            data.text[i] = data.text[i].replace(/\s*\b[^@\s]+@[^\s]+\b\s*/, _regexHandler).trim();
            if (data.address.length) {
              break;
            }
          }
        }
      }
    }
    if (!data.text.length && data.comment.length) {
      data.text = data.comment;
      data.comment = [];
    }
    if (data.address.length > 1) {
      data.text = data.text.concat(data.address.splice(1));
    }
    data.text = data.text.join(" ");
    data.address = data.address.join(" ");
    if (!data.address && /^=\?[^=]+?=$/.test(data.text.trim())) {
      const decodedText = decodeWords(data.text);
      if (/<[^<>]+@[^<>]+>/.test(decodedText)) {
        const parsedSubAddresses = addressParser(decodedText);
        if (parsedSubAddresses && parsedSubAddresses.length) {
          return parsedSubAddresses;
        }
      }
      return [{ address: "", name: decodedText }];
    }
    address = {
      address: data.address || data.text || "",
      name: decodeWords(data.text || data.address || "")
    };
    if (address.address === address.name) {
      if ((address.address || "").match(/@/)) {
        address.name = "";
      } else {
        address.address = "";
      }
    }
    addresses.push(address);
  }
  return addresses;
}
__name(_handleAddress, "_handleAddress");
var Tokenizer = class {
  static {
    __name(this, "Tokenizer");
  }
  constructor(str) {
    this.str = (str || "").toString();
    this.operatorCurrent = "";
    this.operatorExpecting = "";
    this.node = null;
    this.escaped = false;
    this.list = [];
    this.operators = {
      '"': '"',
      "(": ")",
      "<": ">",
      ",": "",
      ":": ";",
      // Semicolons are not a legal delimiter per the RFC2822 grammar other
      // than for terminating a group, but they are also not valid for any
      // other use in this context.  Given that some mail clients have
      // historically allowed the semicolon as a delimiter equivalent to the
      // comma in their UI, it makes sense to treat them the same as a comma
      // when used outside of a group.
      ";": ""
    };
  }
  /**
   * Tokenizes the original input string
   *
   * @return {Array} An array of operator|text tokens
   */
  tokenize() {
    let list = [];
    for (let i = 0, len = this.str.length; i < len; i++) {
      let chr = this.str.charAt(i);
      let nextChr = i < len - 1 ? this.str.charAt(i + 1) : null;
      this.checkChar(chr, nextChr);
    }
    this.list.forEach((node) => {
      node.value = (node.value || "").toString().trim();
      if (node.value) {
        list.push(node);
      }
    });
    return list;
  }
  /**
   * Checks if a character is an operator or text and acts accordingly
   *
   * @param {String} chr Character from the address field
   */
  checkChar(chr, nextChr) {
    if (this.escaped) {
    } else if (chr === this.operatorExpecting) {
      this.node = {
        type: "operator",
        value: chr
      };
      if (nextChr && ![" ", "	", "\r", "\n", ",", ";"].includes(nextChr)) {
        this.node.noBreak = true;
      }
      this.list.push(this.node);
      this.node = null;
      this.operatorExpecting = "";
      this.escaped = false;
      return;
    } else if (!this.operatorExpecting && chr in this.operators) {
      this.node = {
        type: "operator",
        value: chr
      };
      this.list.push(this.node);
      this.node = null;
      this.operatorExpecting = this.operators[chr];
      this.escaped = false;
      return;
    } else if (this.operatorExpecting === '"' && chr === "\\") {
      this.escaped = true;
      return;
    }
    if (!this.node) {
      this.node = {
        type: "text",
        value: ""
      };
      this.list.push(this.node);
    }
    if (chr === "\n") {
      chr = " ";
    }
    if (chr.charCodeAt(0) >= 33 || [" ", "	"].includes(chr)) {
      this.node.value += chr;
    }
    this.escaped = false;
  }
};
var MAX_NESTED_GROUP_DEPTH = 50;
function addressParser(str, options) {
  options = options || {};
  let depth = options._depth || 0;
  if (depth > MAX_NESTED_GROUP_DEPTH) {
    return [];
  }
  let tokenizer = new Tokenizer(str);
  let tokens = tokenizer.tokenize();
  let addresses = [];
  let address = [];
  let parsedAddresses = [];
  tokens.forEach((token) => {
    if (token.type === "operator" && (token.value === "," || token.value === ";")) {
      if (address.length) {
        addresses.push(address);
      }
      address = [];
    } else {
      address.push(token);
    }
  });
  if (address.length) {
    addresses.push(address);
  }
  addresses.forEach((address2) => {
    address2 = _handleAddress(address2, depth);
    if (address2.length) {
      parsedAddresses = parsedAddresses.concat(address2);
    }
  });
  if (options.flatten) {
    let addresses2 = [];
    let walkAddressList = /* @__PURE__ */ __name((list) => {
      list.forEach((address2) => {
        if (address2.group) {
          return walkAddressList(address2.group);
        } else {
          addresses2.push(address2);
        }
      });
    }, "walkAddressList");
    walkAddressList(parsedAddresses);
    return addresses2;
  }
  return parsedAddresses;
}
__name(addressParser, "addressParser");
var address_parser_default = addressParser;

// node_modules/postal-mime/src/base64-encoder.js
function base64ArrayBuffer(arrayBuffer) {
  var base64 = "";
  var encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;
  var a, b, c, d;
  var chunk;
  for (var i = 0; i < mainLength; i = i + 3) {
    chunk = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
    a = (chunk & 16515072) >> 18;
    b = (chunk & 258048) >> 12;
    c = (chunk & 4032) >> 6;
    d = chunk & 63;
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];
    a = (chunk & 252) >> 2;
    b = (chunk & 3) << 4;
    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10;
    b = (chunk & 1008) >> 4;
    c = (chunk & 15) << 2;
    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }
  return base64;
}
__name(base64ArrayBuffer, "base64ArrayBuffer");

// node_modules/postal-mime/src/postal-mime.js
var MAX_NESTING_DEPTH = 256;
var MAX_HEADERS_SIZE = 2 * 1024 * 1024;
function toCamelCase(key) {
  return key.replace(/-(.)/g, (o, c) => c.toUpperCase());
}
__name(toCamelCase, "toCamelCase");
var PostalMime = class _PostalMime {
  static {
    __name(this, "PostalMime");
  }
  static parse(buf, options) {
    const parser = new _PostalMime(options);
    return parser.parse(buf);
  }
  constructor(options) {
    this.options = options || {};
    this.mimeOptions = {
      maxNestingDepth: this.options.maxNestingDepth || MAX_NESTING_DEPTH,
      maxHeadersSize: this.options.maxHeadersSize || MAX_HEADERS_SIZE
    };
    this.root = this.currentNode = new MimeNode({
      postalMime: this,
      ...this.mimeOptions
    });
    this.boundaries = [];
    this.textContent = {};
    this.attachments = [];
    this.attachmentEncoding = (this.options.attachmentEncoding || "").toString().replace(/[-_\s]/g, "").trim().toLowerCase() || "arraybuffer";
    this.started = false;
  }
  async finalize() {
    await this.root.finalize();
  }
  async processLine(line, isFinal) {
    let boundaries = this.boundaries;
    if (boundaries.length && line.length > 2 && line[0] === 45 && line[1] === 45) {
      for (let i = boundaries.length - 1; i >= 0; i--) {
        let boundary = boundaries[i];
        if (line.length < boundary.value.length + 2) {
          continue;
        }
        let boundaryMatches = true;
        for (let j = 0; j < boundary.value.length; j++) {
          if (line[j + 2] !== boundary.value[j]) {
            boundaryMatches = false;
            break;
          }
        }
        if (!boundaryMatches) {
          continue;
        }
        let boundaryEnd = boundary.value.length + 2;
        let isTerminator = false;
        if (line.length >= boundary.value.length + 4 && line[boundary.value.length + 2] === 45 && line[boundary.value.length + 3] === 45) {
          isTerminator = true;
          boundaryEnd = boundary.value.length + 4;
        }
        let hasValidTrailing = true;
        for (let j = boundaryEnd; j < line.length; j++) {
          if (line[j] !== 32 && line[j] !== 9) {
            hasValidTrailing = false;
            break;
          }
        }
        if (!hasValidTrailing) {
          continue;
        }
        if (isTerminator) {
          await boundary.node.finalize();
          this.currentNode = boundary.node.parentNode || this.root;
        } else {
          await boundary.node.finalizeChildNodes();
          this.currentNode = new MimeNode({
            postalMime: this,
            parentNode: boundary.node,
            parentMultipartType: boundary.node.contentType.multipart,
            ...this.mimeOptions
          });
        }
        if (isFinal) {
          return this.finalize();
        }
        return;
      }
    }
    this.currentNode.feed(line);
    if (isFinal) {
      return this.finalize();
    }
  }
  readLine() {
    let startPos = this.readPos;
    let endPos = this.readPos;
    while (this.readPos < this.av.length) {
      const c = this.av[this.readPos++];
      if (c !== 13 && c !== 10) {
        endPos = this.readPos;
      }
      if (c === 10) {
        return {
          bytes: new Uint8Array(this.buf, startPos, endPos - startPos),
          done: this.readPos >= this.av.length
        };
      }
    }
    return {
      bytes: new Uint8Array(this.buf, startPos, endPos - startPos),
      done: this.readPos >= this.av.length
    };
  }
  async processNodeTree() {
    let textContent = {};
    let textTypes = /* @__PURE__ */ new Set();
    let textMap = this.textMap = /* @__PURE__ */ new Map();
    let forceRfc822Attachments = this.forceRfc822Attachments();
    let walk = /* @__PURE__ */ __name(async (node, alternative, related) => {
      alternative = alternative || false;
      related = related || false;
      if (!node.contentType.multipart) {
        if (this.isInlineMessageRfc822(node) && !forceRfc822Attachments) {
          const subParser = new _PostalMime();
          node.subMessage = await subParser.parse(node.content);
          if (!textMap.has(node)) {
            textMap.set(node, {});
          }
          let textEntry = textMap.get(node);
          if (node.subMessage.text || !node.subMessage.html) {
            textEntry.plain = textEntry.plain || [];
            textEntry.plain.push({ type: "subMessage", value: node.subMessage });
            textTypes.add("plain");
          }
          if (node.subMessage.html) {
            textEntry.html = textEntry.html || [];
            textEntry.html.push({ type: "subMessage", value: node.subMessage });
            textTypes.add("html");
          }
          if (subParser.textMap) {
            subParser.textMap.forEach((subTextEntry, subTextNode) => {
              textMap.set(subTextNode, subTextEntry);
            });
          }
          for (let attachment of node.subMessage.attachments || []) {
            this.attachments.push(attachment);
          }
        } else if (this.isInlineTextNode(node)) {
          let textType = node.contentType.parsed.value.substr(node.contentType.parsed.value.indexOf("/") + 1);
          let selectorNode = alternative || node;
          if (!textMap.has(selectorNode)) {
            textMap.set(selectorNode, {});
          }
          let textEntry = textMap.get(selectorNode);
          textEntry[textType] = textEntry[textType] || [];
          textEntry[textType].push({ type: "text", value: node.getTextContent() });
          textTypes.add(textType);
        } else if (node.content) {
          const filename = node.contentDisposition?.parsed?.params?.filename || node.contentType.parsed.params.name || null;
          const attachment = {
            filename: filename ? decodeWords(filename) : null,
            mimeType: node.contentType.parsed.value,
            disposition: node.contentDisposition?.parsed?.value || null
          };
          if (related && node.contentId) {
            attachment.related = true;
          }
          if (node.contentDescription) {
            attachment.description = node.contentDescription;
          }
          if (node.contentId) {
            attachment.contentId = node.contentId;
          }
          switch (node.contentType.parsed.value) {
            // Special handling for calendar events
            case "text/calendar":
            case "application/ics": {
              if (node.contentType.parsed.params.method) {
                attachment.method = node.contentType.parsed.params.method.toString().toUpperCase().trim();
              }
              const decodedText = node.getTextContent().replace(/\r?\n/g, "\n").replace(/\n*$/, "\n");
              attachment.content = textEncoder.encode(decodedText);
              break;
            }
            // Regular attachments
            default:
              attachment.content = node.content;
          }
          this.attachments.push(attachment);
        }
      } else if (node.contentType.multipart === "alternative") {
        alternative = node;
      } else if (node.contentType.multipart === "related") {
        related = node;
      }
      for (let childNode of node.childNodes) {
        await walk(childNode, alternative, related);
      }
    }, "walk");
    await walk(this.root, false, false);
    textMap.forEach((mapEntry) => {
      textTypes.forEach((textType) => {
        if (!textContent[textType]) {
          textContent[textType] = [];
        }
        if (mapEntry[textType]) {
          mapEntry[textType].forEach((textEntry) => {
            switch (textEntry.type) {
              case "text":
                textContent[textType].push(textEntry.value);
                break;
              case "subMessage":
                {
                  switch (textType) {
                    case "html":
                      textContent[textType].push(formatHtmlHeader(textEntry.value));
                      break;
                    case "plain":
                      textContent[textType].push(formatTextHeader(textEntry.value));
                      break;
                  }
                }
                break;
            }
          });
        } else {
          let alternativeType;
          switch (textType) {
            case "html":
              alternativeType = "plain";
              break;
            case "plain":
              alternativeType = "html";
              break;
          }
          (mapEntry[alternativeType] || []).forEach((textEntry) => {
            switch (textEntry.type) {
              case "text":
                switch (textType) {
                  case "html":
                    textContent[textType].push(textToHtml(textEntry.value));
                    break;
                  case "plain":
                    textContent[textType].push(htmlToText(textEntry.value));
                    break;
                }
                break;
              case "subMessage":
                {
                  switch (textType) {
                    case "html":
                      textContent[textType].push(formatHtmlHeader(textEntry.value));
                      break;
                    case "plain":
                      textContent[textType].push(formatTextHeader(textEntry.value));
                      break;
                  }
                }
                break;
            }
          });
        }
      });
    });
    Object.keys(textContent).forEach((textType) => {
      textContent[textType] = textContent[textType].join("\n");
    });
    this.textContent = textContent;
  }
  isInlineTextNode(node) {
    if (node.contentDisposition?.parsed?.value === "attachment") {
      return false;
    }
    switch (node.contentType.parsed?.value) {
      case "text/html":
      case "text/plain":
        return true;
      case "text/calendar":
      case "text/csv":
      default:
        return false;
    }
  }
  isInlineMessageRfc822(node) {
    if (node.contentType.parsed?.value !== "message/rfc822") {
      return false;
    }
    let disposition = node.contentDisposition?.parsed?.value || (this.options.rfc822Attachments ? "attachment" : "inline");
    return disposition === "inline";
  }
  // Check if this is a specially crafted report email where message/rfc822 content should not be inlined
  forceRfc822Attachments() {
    if (this.options.forceRfc822Attachments) {
      return true;
    }
    let forceRfc822Attachments = false;
    let walk = /* @__PURE__ */ __name((node) => {
      if (!node.contentType.multipart) {
        if (node.contentType.parsed && ["message/delivery-status", "message/feedback-report"].includes(node.contentType.parsed.value)) {
          forceRfc822Attachments = true;
        }
      }
      for (let childNode of node.childNodes) {
        walk(childNode);
      }
    }, "walk");
    walk(this.root);
    return forceRfc822Attachments;
  }
  async resolveStream(stream) {
    let chunkLen = 0;
    let chunks = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      chunkLen += value.length;
    }
    const result = new Uint8Array(chunkLen);
    let chunkPointer = 0;
    for (let chunk of chunks) {
      result.set(chunk, chunkPointer);
      chunkPointer += chunk.length;
    }
    return result;
  }
  async parse(buf) {
    if (this.started) {
      throw new Error("Can not reuse parser, create a new PostalMime object");
    }
    this.started = true;
    if (buf && typeof buf.getReader === "function") {
      buf = await this.resolveStream(buf);
    }
    buf = buf || new ArrayBuffer(0);
    if (typeof buf === "string") {
      buf = textEncoder.encode(buf);
    }
    if (buf instanceof Blob || Object.prototype.toString.call(buf) === "[object Blob]") {
      buf = await blobToArrayBuffer(buf);
    }
    if (buf.buffer instanceof ArrayBuffer) {
      buf = new Uint8Array(buf).buffer;
    }
    this.buf = buf;
    this.av = new Uint8Array(buf);
    this.readPos = 0;
    while (this.readPos < this.av.length) {
      const line = this.readLine();
      await this.processLine(line.bytes, line.done);
    }
    await this.processNodeTree();
    const message = {
      headers: this.root.headers.map((entry) => ({ key: entry.key, originalKey: entry.originalKey, value: entry.value })).reverse()
    };
    for (const key of ["from", "sender"]) {
      const addressHeader = this.root.headers.find((line) => line.key === key);
      if (addressHeader && addressHeader.value) {
        const addresses = address_parser_default(addressHeader.value);
        if (addresses && addresses.length) {
          message[key] = addresses[0];
        }
      }
    }
    for (const key of ["delivered-to", "return-path"]) {
      const addressHeader = this.root.headers.find((line) => line.key === key);
      if (addressHeader && addressHeader.value) {
        const addresses = address_parser_default(addressHeader.value);
        if (addresses && addresses.length && addresses[0].address) {
          const camelKey = toCamelCase(key);
          message[camelKey] = addresses[0].address;
        }
      }
    }
    for (const key of ["to", "cc", "bcc", "reply-to"]) {
      const addressHeaders = this.root.headers.filter((line) => line.key === key);
      let addresses = [];
      addressHeaders.filter((entry) => entry && entry.value).map((entry) => address_parser_default(entry.value)).forEach((parsed) => addresses = addresses.concat(parsed || []));
      if (addresses && addresses.length) {
        const camelKey = toCamelCase(key);
        message[camelKey] = addresses;
      }
    }
    for (const key of ["subject", "message-id", "in-reply-to", "references"]) {
      const header = this.root.headers.find((line) => line.key === key);
      if (header && header.value) {
        const camelKey = toCamelCase(key);
        message[camelKey] = decodeWords(header.value);
      }
    }
    let dateHeader = this.root.headers.find((line) => line.key === "date");
    if (dateHeader) {
      let date = new Date(dateHeader.value);
      if (date.toString() === "Invalid Date") {
        date = dateHeader.value;
      } else {
        date = date.toISOString();
      }
      message.date = date;
    }
    if (this.textContent?.html) {
      message.html = this.textContent.html;
    }
    if (this.textContent?.plain) {
      message.text = this.textContent.plain;
    }
    message.attachments = this.attachments;
    message.headerLines = (this.root.rawHeaderLines || []).slice().reverse();
    switch (this.attachmentEncoding) {
      case "arraybuffer":
        break;
      case "base64":
        for (let attachment of message.attachments || []) {
          if (attachment?.content) {
            attachment.content = base64ArrayBuffer(attachment.content);
            attachment.encoding = "base64";
          }
        }
        break;
      case "utf8":
        let attachmentDecoder = new TextDecoder("utf8");
        for (let attachment of message.attachments || []) {
          if (attachment?.content) {
            attachment.content = attachmentDecoder.decode(attachment.content);
            attachment.encoding = "utf8";
          }
        }
        break;
      default:
        throw new Error("Unknown attachment encoding");
    }
    return message;
  }
};

// src/utils/text.ts
var HTML_ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " "
};
var INVISIBLE_CHARS = /[\u00ad\u034f\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g;
function stripHtml(html) {
  return decodeHtmlEntities(
    html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p\s*>/gi, "\n").replace(/<\/div\s*>/gi, "\n").replace(/<[^>]+>/g, " ")
  ).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
__name(stripHtml, "stripHtml");
function cleanEmailBody(value) {
  const lines = value.replace(/\r\n?/g, "\n").replace(INVISIBLE_CHARS, "").split("\n").map((line) => line.replace(/[ \t]+$/g, ""));
  return collapseBlankLines(removeForwardedHeader(lines)).trim();
}
__name(cleanEmailBody, "cleanEmailBody");
function previewText(value, length = 600) {
  const trimmed = cleanEmailBody(value).replace(/\s+/g, " ").trim();
  return trimmed.length > length ? `${trimmed.slice(0, length)}...` : trimmed;
}
__name(previewText, "previewText");
function decodeHtmlEntities(value) {
  return value.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity, body) => {
    const normalized = body.toLowerCase();
    if (normalized.startsWith("#x")) {
      return codePointToString(Number.parseInt(normalized.slice(2), 16), entity);
    }
    if (normalized.startsWith("#")) {
      return codePointToString(Number.parseInt(normalized.slice(1), 10), entity);
    }
    return HTML_ENTITY_MAP[normalized] ?? entity;
  });
}
__name(decodeHtmlEntities, "decodeHtmlEntities");
function removeForwardedHeader(lines) {
  const output = [];
  let skippingForwardHeader = false;
  for (const line of lines) {
    if (/^-+\s*Forwarded message\s*-+$/i.test(line.trim())) {
      skippingForwardHeader = true;
      continue;
    }
    if (skippingForwardHeader && line.trim() === "") {
      skippingForwardHeader = false;
      continue;
    }
    if (skippingForwardHeader && isForwardHeaderLine(line)) {
      continue;
    }
    skippingForwardHeader = false;
    output.push(line);
  }
  return output;
}
__name(removeForwardedHeader, "removeForwardedHeader");
function isForwardHeaderLine(line) {
  return /^(发件人|寄件者|收件人|主题|日期|from|to|subject|date)[:：]/i.test(line.trim());
}
__name(isForwardHeaderLine, "isForwardHeaderLine");
function collapseBlankLines(lines) {
  const output = [];
  for (const line of lines) {
    if (line.trim() === "" && output.at(-1)?.trim() === "") {
      continue;
    }
    output.push(line);
  }
  return output.join("\n").replace(/\n{3,}/g, "\n\n");
}
__name(collapseBlankLines, "collapseBlankLines");
function codePointToString(codePoint, fallback) {
  return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : fallback;
}
__name(codePointToString, "codePointToString");

// src/services/codes.ts
var CODE_PATTERN = /\b(?:\d{4,8}|(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{4,8})\b/g;
var KEYWORD_PATTERN = /(验证码|校验码|动态码|登录代码|代码|code|verification|passcode|otp|security)/i;
var URL_PATTERN = /<?https?:\/\/\S+>?/gi;
var EMAIL_PATTERN = /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g;
var UUID_PATTERN = /\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi;
function extractCodesFromText(value, source) {
  const searchable = searchableText(value, source);
  const seen = /* @__PURE__ */ new Set();
  const codes = [];
  for (const match2 of rawMatches(searchable)) {
    const code = match2.code.toUpperCase();
    if (seen.has(code) || !isUsableCode(code, searchable, match2.index)) {
      continue;
    }
    seen.add(code);
    codes.push({ code, source });
  }
  return codes;
}
__name(extractCodesFromText, "extractCodesFromText");
function extractCodes(input) {
  const subjectCodes = extractCodesFromText(input.subject ?? "", "subject");
  const textCodes = extractCodesFromText(input.text ?? "", "text");
  const htmlCodes = textCodes.length > 0 ? [] : extractCodesFromText(input.html ?? "", "html");
  return dedupeByCode([...subjectCodes, ...textCodes, ...htmlCodes]);
}
__name(extractCodes, "extractCodes");
async function insertCodes(db, emailId, codes) {
  if (codes.length === 0) {
    return;
  }
  await db.batch(
    codes.map(
      (code) => db.prepare("INSERT INTO email_codes (email_id, code, source) VALUES (?1, ?2, ?3)").bind(emailId, code.code, code.source)
    )
  );
}
__name(insertCodes, "insertCodes");
function searchableText(value, source) {
  const text = source === "html" ? stripHtml(value) : value;
  return text.replace(URL_PATTERN, " ").replace(EMAIL_PATTERN, " ").replace(UUID_PATTERN, " ").split(/\r?\n/).filter((line) => !/^\s*SRC\s*:/i.test(line)).join("\n");
}
__name(searchableText, "searchableText");
function rawMatches(value) {
  return [...value.matchAll(CODE_PATTERN)].map((match2) => ({ code: match2[0], index: match2.index ?? 0 }));
}
__name(rawMatches, "rawMatches");
function isUsableCode(code, text, index) {
  if (isCssUnit(code) || isYear(code) || isGuidSegment(text, index, code.length)) {
    return false;
  }
  if (hasKeywordContext(text, index, code.length)) {
    return true;
  }
  if (/^\d{4}$/.test(code)) {
    return false;
  }
  return /^[A-Z0-9]{5,8}$/i.test(code) && !isLikelyCssColor(code, text, index);
}
__name(isUsableCode, "isUsableCode");
function hasKeywordContext(text, index, length) {
  const start = Math.max(0, index - 90);
  const end = Math.min(text.length, index + length + 90);
  return KEYWORD_PATTERN.test(text.slice(start, end));
}
__name(hasKeywordContext, "hasKeywordContext");
function isCssUnit(code) {
  return /^\d{1,4}PX$/i.test(code);
}
__name(isCssUnit, "isCssUnit");
function isYear(code) {
  const value = Number(code);
  return /^\d{4}$/.test(code) && value >= 1900 && value <= 2099;
}
__name(isYear, "isYear");
function isGuidSegment(text, index, length) {
  return text[index - 1] === "-" || text[index + length] === "-" || text[index - 1] === "_" || text[index + length] === "_";
}
__name(isGuidSegment, "isGuidSegment");
function isLikelyCssColor(code, text, index) {
  return /^[A-F0-9]{6}$/i.test(code) && /[#:]\s*$/i.test(text.slice(Math.max(0, index - 3), index));
}
__name(isLikelyCssColor, "isLikelyCssColor");
function dedupeByCode(candidates) {
  const seen = /* @__PURE__ */ new Set();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.code)) {
      return false;
    }
    seen.add(candidate.code);
    return true;
  });
}
__name(dedupeByCode, "dedupeByCode");

// src/services/content.ts
function takeUtf8Bytes(value, maxBytes) {
  if (maxBytes <= 0) {
    return "";
  }
  let used = 0;
  let result = "";
  for (const char of value) {
    const size = utf8ByteLength(char);
    if (used + size > maxBytes) {
      break;
    }
    result += char;
    used += size;
  }
  return result;
}
__name(takeUtf8Bytes, "takeUtf8Bytes");
function splitUtf8Chunks(value, maxBytes = CONTENT_CHUNK_BYTES) {
  const chunks = [];
  let current = "";
  let currentBytes = 0;
  for (const char of value) {
    const size = utf8ByteLength(char);
    if (current && currentBytes + size > maxBytes) {
      chunks.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += size;
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
}
__name(splitUtf8Chunks, "splitUtf8Chunks");
function prepareContentChunks(input, limits) {
  const chunks = [];
  const content = { headers: "", text: "", html: "" };
  const headerLimit = Math.max(0, limits.headersBytes ?? DEFAULT_MAX_EMAIL_HEADERS_BYTES);
  let remainingBody = Math.max(0, limits.bodyBytes);
  let truncated = false;
  const headers = input.headers ?? "";
  content.headers = takeUtf8Bytes(headers, headerLimit);
  truncated ||= content.headers.length < headers.length;
  appendChunks(chunks, "headers", content.headers);
  for (const kind of ["text", "html"]) {
    const original = input[kind] ?? "";
    const allowed = takeUtf8Bytes(original, remainingBody);
    if (allowed.length < original.length) {
      truncated = true;
    }
    content[kind] = allowed;
    remainingBody -= utf8ByteLength(allowed);
    appendChunks(chunks, kind, allowed);
  }
  return { chunks, content, truncated };
}
__name(prepareContentChunks, "prepareContentChunks");
function reconstructContent(chunks) {
  const output = { headers: "", text: "", html: "" };
  const sorted = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
  for (const chunk of sorted) {
    output[chunk.kind] += chunk.content;
  }
  return output;
}
__name(reconstructContent, "reconstructContent");
async function insertContentChunks(db, emailId, chunks) {
  if (chunks.length === 0) {
    return;
  }
  await db.batch(
    chunks.map(
      (chunk) => db.prepare("INSERT INTO email_content_chunks (email_id, kind, chunk_index, content) VALUES (?1, ?2, ?3, ?4)").bind(emailId, chunk.kind, chunk.chunkIndex, chunk.content)
    )
  );
}
__name(insertContentChunks, "insertContentChunks");
async function getContentChunks(db, emailId) {
  const result = await db.prepare("SELECT kind, chunk_index, content FROM email_content_chunks WHERE email_id = ?1 ORDER BY kind, chunk_index").bind(emailId).all();
  return result.results.map((row) => ({ kind: row.kind, chunkIndex: row.chunk_index, content: row.content }));
}
__name(getContentChunks, "getContentChunks");
function appendChunks(chunks, kind, value) {
  splitUtf8Chunks(value).forEach((content, chunkIndex) => {
    chunks.push({ kind, chunkIndex, content });
  });
}
__name(appendChunks, "appendChunks");

// src/services/emails.ts
async function storeInboundEmail(message, env) {
  const receivedAt = nowIso();
  const parsed = await PostalMime.parse(message.raw, { attachmentEncoding: "base64", maxNestingDepth: 64 });
  const email = parsed;
  const text = email.text ?? "";
  const html = email.html ?? "";
  const headersJson = JSON.stringify(email.headers ?? []);
  const prepared = prepareContentChunks(
    { headers: headersJson, text, html },
    { bodyBytes: maxEmailBodyBytes(env), headersBytes: maxEmailHeadersBytes(env) }
  );
  const attachments = attachmentMetadata(email.attachments ?? []);
  const codes = extractCodes({ subject: email.subject, text: prepared.content.text, html: prepared.content.html });
  const result = await env.DB.prepare(
    `INSERT INTO emails
      (message_id, envelope_from, envelope_to, from_address, to_addresses_json, subject, sent_at, received_at,
       raw_size, has_attachments, attachment_count, attachments_json, content_truncated, parse_status)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'parsed')`
  ).bind(
    email.messageId ?? message.headers.get("message-id"),
    message.from,
    message.to,
    addressToString(email.from),
    JSON.stringify(addressesToStrings(email.to)),
    email.subject ?? null,
    toIsoDate(email.date),
    receivedAt,
    message.rawSize,
    attachments.length > 0 ? 1 : 0,
    attachments.length,
    JSON.stringify(attachments),
    prepared.truncated ? 1 : 0
  ).run();
  const emailId = Number(result.meta.last_row_id);
  await insertContentChunks(env.DB, emailId, prepared.chunks);
  await insertCodes(env.DB, emailId, codes);
  return emailId;
}
__name(storeInboundEmail, "storeInboundEmail");
async function listEmails(db, options = {}) {
  const limit = clampLimit(options.limit);
  const offset = clampOffset(options.offset);
  const filter = emailSearchFilter(options.q);
  const result = await db.prepare(
    `SELECT e.*,
        (SELECT group_concat(code, ', ') FROM email_codes WHERE email_id = e.id) AS codes
       FROM emails e
       ${filter.whereSql}
       ORDER BY e.received_at DESC
       LIMIT ? OFFSET ?`
  ).bind(...filter.params, limit, offset).all();
  return result.results;
}
__name(listEmails, "listEmails");
async function listEmailPage(db, options = {}) {
  const pageSize = clampLimit(options.limit);
  const total = await countEmails(db, options.q);
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const page2 = normalizePage(options.page, totalPages);
  const offset = (page2 - 1) * pageSize;
  const emails = await listEmails(db, { q: options.q, limit: pageSize, offset });
  return {
    emails,
    pagination: {
      page: page2,
      pageSize,
      total,
      totalPages,
      hasPreviousPage: totalPages > 0 && page2 > 1,
      hasNextPage: totalPages > 0 && page2 < totalPages
    }
  };
}
__name(listEmailPage, "listEmailPage");
async function countEmails(db, q) {
  const filter = emailSearchFilter(q);
  const statement = db.prepare(`SELECT COUNT(*) AS count FROM emails e ${filter.whereSql}`);
  const row = await bindSearchParams(statement, filter.params).first();
  return Number(row?.count ?? 0);
}
__name(countEmails, "countEmails");
async function getEmailDetail(db, id) {
  const row = await db.prepare("SELECT * FROM emails WHERE id = ?1").bind(id).first();
  if (!row) {
    return null;
  }
  const [chunks, storedCodes] = await Promise.all([getContentChunks(db, id), listCodes(db, id)]);
  const content = reconstructContent(chunks);
  const codes = materializeCodeRows(id, storedCodes, extractCodes({ subject: row.subject, text: content.text, html: content.html }));
  return {
    ...row,
    toAddresses: parseJsonArray(row.to_addresses_json),
    attachments: parseJsonArray(row.attachments_json),
    content,
    codes
  };
}
__name(getEmailDetail, "getEmailDetail");
async function listCandidateEmailDetailsSince(db, sinceIso, limit = MAX_EMAIL_LIMIT) {
  const result = await db.prepare("SELECT id FROM emails WHERE received_at >= ?1 ORDER BY received_at DESC LIMIT ?2").bind(sinceIso, clampLimit(limit)).all();
  const details = await Promise.all(result.results.map((row) => getEmailDetail(db, row.id)));
  return details.filter((detail) => detail !== null);
}
__name(listCandidateEmailDetailsSince, "listCandidateEmailDetailsSince");
function emailDetailToRuleInput(email) {
  return {
    fromAddress: email.from_address,
    envelopeTo: email.envelope_to,
    toAddresses: email.toAddresses,
    subject: email.subject,
    text: email.content.text,
    html: email.content.html,
    codes: email.codes.map((code) => code.code)
  };
}
__name(emailDetailToRuleInput, "emailDetailToRuleInput");
function maxEmailBodyBytes(env) {
  const parsed = Number(env.MAX_EMAIL_CONTENT_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_MAX_EMAIL_BODY_BYTES;
}
__name(maxEmailBodyBytes, "maxEmailBodyBytes");
function maxEmailHeadersBytes(env) {
  const parsed = Number(env.MAX_EMAIL_HEADERS_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_MAX_EMAIL_HEADERS_BYTES;
}
__name(maxEmailHeadersBytes, "maxEmailHeadersBytes");
function clampLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_EMAIL_LIMIT;
  }
  return Math.min(MAX_EMAIL_LIMIT, Math.max(1, Math.floor(parsed)));
}
__name(clampLimit, "clampLimit");
function clampOffset(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}
__name(clampOffset, "clampOffset");
function normalizePage(value, totalPages) {
  const parsed = Number(value);
  const requested = Number.isFinite(parsed) ? Math.floor(parsed) : 1;
  const page2 = Math.min(MAX_EMAIL_PAGE, Math.max(1, requested));
  return totalPages > 0 ? Math.min(page2, totalPages) : 1;
}
__name(normalizePage, "normalizePage");
function emailSearchFilter(q) {
  const pattern = safeLikePattern(q);
  if (!pattern) {
    return { whereSql: "", params: [] };
  }
  return {
    whereSql: "WHERE (e.subject LIKE ? ESCAPE '\\' OR e.from_address LIKE ? ESCAPE '\\' OR e.envelope_to LIKE ? ESCAPE '\\')",
    params: [pattern, pattern, pattern]
  };
}
__name(emailSearchFilter, "emailSearchFilter");
function bindSearchParams(statement, params) {
  return params.length > 0 ? statement.bind(...params) : statement;
}
__name(bindSearchParams, "bindSearchParams");
function safeLikePattern(value) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const term = takeUtf8Bytes(trimmed, 40).replace(/[\\%_]/g, (match2) => `\\${match2}`);
  return `%${term}%`;
}
__name(safeLikePattern, "safeLikePattern");
function isMailbox(address) {
  return !("group" in address) || !address.group;
}
__name(isMailbox, "isMailbox");
function addressToString(address) {
  if (!address) {
    return null;
  }
  if (isMailbox(address)) {
    return address.address || null;
  }
  return address.group.map((mailbox) => mailbox.address).filter(Boolean).join(", ") || null;
}
__name(addressToString, "addressToString");
function addressesToStrings(addresses) {
  return (addresses ?? []).flatMap((address) => {
    const text = addressToString(address);
    return text ? [text] : [];
  });
}
__name(addressesToStrings, "addressesToStrings");
function attachmentMetadata(attachments) {
  return attachments.map((attachment) => ({
    filename: attachment.filename ?? null,
    mimeType: attachment.mimeType ?? null,
    disposition: attachment.disposition ?? null,
    related: Boolean(attachment.related),
    contentId: attachment.contentId ?? null,
    size: attachmentSize(attachment)
  }));
}
__name(attachmentMetadata, "attachmentMetadata");
function attachmentSize(attachment) {
  const content = attachment.content;
  if (content instanceof ArrayBuffer) {
    return content.byteLength;
  }
  if (typeof content === "string") {
    return attachment.encoding === "base64" ? base64DecodedByteLength(content) : utf8ByteLength(content);
  }
  return null;
}
__name(attachmentSize, "attachmentSize");
function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
__name(toIsoDate, "toIsoDate");
function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
__name(parseJsonArray, "parseJsonArray");
function materializeCodeRows(emailId, storedRows, candidates) {
  return candidates.map((candidate, index) => {
    const stored = storedRows.find((row) => row.code === candidate.code && row.source === candidate.source);
    return stored ?? { id: 0 - index, email_id: emailId, code: candidate.code, source: candidate.source, created_at: "" };
  });
}
__name(materializeCodeRows, "materializeCodeRows");
async function listCodes(db, emailId) {
  const result = await db.prepare("SELECT * FROM email_codes WHERE email_id = ?1 ORDER BY id").bind(emailId).all();
  return result.results;
}
__name(listCodes, "listCodes");

// src/services/logs.ts
async function writeAccessLog(db, input) {
  const ip = input.request?.headers.get("CF-Connecting-IP") ?? null;
  const userAgent = input.request?.headers.get("User-Agent") ?? null;
  await db.prepare(
    "INSERT INTO access_logs (actor_type, actor_id, action, ip, user_agent) VALUES (?1, ?2, ?3, ?4, ?5)"
  ).bind(input.actorType, input.actorId == null ? null : String(input.actorId), input.action, ip, userAgent).run();
}
__name(writeAccessLog, "writeAccessLog");

// src/services/rules.ts
var DEFAULT_RULE_FIELDS = ["subject", "text", "html", "code"];
var MAX_REGEX_PATTERN_LENGTH = 200;
function parseRuleFields(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed.filter((field) => RULE_FIELDS.includes(field));
  } catch {
    return DEFAULT_RULE_FIELDS;
  }
}
__name(parseRuleFields, "parseRuleFields");
function parseRuleKeywords(value) {
  return String(value ?? "").split(/[\n,]/).map((keyword) => keyword.trim()).filter(Boolean).filter((keyword, index, keywords) => keywords.indexOf(keyword) === index);
}
__name(parseRuleKeywords, "parseRuleKeywords");
function sanitizeRuleInput(input) {
  const name = input.name?.trim();
  const action = input.action === "block" ? "block" : "allow";
  const caseSensitive = Boolean(input.caseSensitive);
  const expression = sanitizeRuleExpression(input.expression) ?? legacyExpressionFromInput(input, caseSensitive);
  if (!name || !expression) {
    return null;
  }
  const keywords = extractExpressionKeywords(expression);
  const fields = extractExpressionFields(expression);
  return {
    name,
    keyword: keywords.join("\n") || name,
    keywords,
    fields: fields.length > 0 ? fields : DEFAULT_RULE_FIELDS,
    matchMode: input.matchMode === "exact" ? "exact" : "contains",
    caseSensitive,
    enabled: input.enabled ?? true,
    action,
    expression
  };
}
__name(sanitizeRuleInput, "sanitizeRuleInput");
async function listRules(db, includeDisabled = true) {
  const sql = includeDisabled ? "SELECT * FROM rules ORDER BY id DESC" : "SELECT * FROM rules WHERE enabled = 1 ORDER BY id DESC";
  const result = await db.prepare(sql).all();
  return result.results;
}
__name(listRules, "listRules");
async function getRulesByIds(db, ids, includeDisabled = false) {
  if (ids.length === 0) {
    return [];
  }
  const placeholders = ids.map((_, index) => `?${index + 1}`).join(", ");
  const enabledClause = includeDisabled ? "" : "enabled = 1 AND ";
  const result = await db.prepare(`SELECT * FROM rules WHERE ${enabledClause}id IN (${placeholders})`).bind(...ids).all();
  return result.results;
}
__name(getRulesByIds, "getRulesByIds");
async function createRule(db, input) {
  const result = await db.prepare(
    `INSERT INTO rules (name, fields_json, keyword, match_mode, case_sensitive, enabled, action, expression_json, schema_version)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 2)`
  ).bind(
    input.name,
    JSON.stringify(input.fields),
    input.keyword,
    input.matchMode ?? "contains",
    input.caseSensitive ? 1 : 0,
    input.enabled === false ? 0 : 1,
    input.action,
    JSON.stringify(input.expression)
  ).run();
  return Number(result.meta.last_row_id);
}
__name(createRule, "createRule");
async function updateRule(db, id, input) {
  await db.prepare(
    `UPDATE rules
       SET name = ?1, fields_json = ?2, keyword = ?3, match_mode = ?4, case_sensitive = ?5, enabled = ?6,
           action = ?7, expression_json = ?8, schema_version = 2,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?9`
  ).bind(
    input.name,
    JSON.stringify(input.fields),
    input.keyword,
    input.matchMode ?? "contains",
    input.caseSensitive ? 1 : 0,
    input.enabled === false ? 0 : 1,
    input.action,
    JSON.stringify(input.expression),
    id
  ).run();
}
__name(updateRule, "updateRule");
async function deleteRule(db, id) {
  await db.prepare("DELETE FROM rules WHERE id = ?1").bind(id).run();
}
__name(deleteRule, "deleteRule");
function ruleAction(rule) {
  return rule.action === "block" ? "block" : "allow";
}
__name(ruleAction, "ruleAction");
function ruleExpression(rule) {
  const parsed = sanitizeRuleExpression(parseJson(rule.expression_json));
  return parsed ?? legacyExpressionFromRule(rule);
}
__name(ruleExpression, "ruleExpression");
function matchesRule(email, rule) {
  return Boolean(rule.enabled) && evaluateExpression(email, ruleExpression(rule));
}
__name(matchesRule, "matchesRule");
function evaluateRuleSet(email, rules, options = {}) {
  const allowRuleLogic = options.allowRuleLogic ?? "or";
  const blockRuleLogic = options.blockRuleLogic ?? "or";
  const enabledRules = rules.filter((rule) => Boolean(rule.enabled));
  const allowRules = enabledRules.filter((rule) => ruleAction(rule) === "allow");
  const blockRules = enabledRules.filter((rule) => ruleAction(rule) === "block");
  const matchedAllowRuleIds = [];
  const matchedBlockRuleIds = [];
  for (const rule of allowRules) {
    if (!matchesRule(email, rule)) continue;
    matchedAllowRuleIds.push(rule.id);
  }
  for (const rule of blockRules) {
    if (!matchesRule(email, rule)) continue;
    matchedBlockRuleIds.push(rule.id);
  }
  const allowed = evaluateRuleGroupMatch(allowRules.length, matchedAllowRuleIds.length, allowRuleLogic);
  const blocked = evaluateRuleGroupMatch(blockRules.length, matchedBlockRuleIds.length, blockRuleLogic);
  return { allowed, blocked, visible: allowed && !blocked, matchedAllowRuleIds, matchedBlockRuleIds };
}
__name(evaluateRuleSet, "evaluateRuleSet");
function normalizeShareLinkRuleLogic(value, fallback = "or") {
  if (value === "and" || value === "or") return value;
  return fallback;
}
__name(normalizeShareLinkRuleLogic, "normalizeShareLinkRuleLogic");
function extractExpressionKeywords(expression) {
  if (expression.op === "condition") return [expression.value];
  if (expression.op === "not") return extractExpressionKeywords(expression.child);
  return unique(expression.children.flatMap(extractExpressionKeywords));
}
__name(extractExpressionKeywords, "extractExpressionKeywords");
function extractExpressionFields(expression) {
  if (expression.op === "condition") return [expression.field];
  if (expression.op === "not") return extractExpressionFields(expression.child);
  return unique(expression.children.flatMap(extractExpressionFields));
}
__name(extractExpressionFields, "extractExpressionFields");
function sanitizeRuleExpression(value) {
  if (!value || typeof value !== "object") return null;
  const raw2 = value;
  if (raw2.op === "condition") return sanitizeCondition(raw2);
  if (raw2.op === "not") {
    const child = sanitizeRuleExpression(raw2.child);
    return child ? { op: "not", child } : null;
  }
  if (raw2.op !== "and" && raw2.op !== "or") return null;
  if (!Array.isArray(raw2.children)) return null;
  const children = raw2.children.map(sanitizeRuleExpression).filter((child) => Boolean(child));
  if (children.length === 0) return null;
  return children.length === 1 ? children[0] : { op: raw2.op, children };
}
__name(sanitizeRuleExpression, "sanitizeRuleExpression");
function sanitizeCondition(raw2) {
  const field = raw2.field;
  const operator = raw2.operator;
  const value = typeof raw2.value === "string" ? raw2.value.trim() : "";
  if (!RULE_FIELDS.includes(field) || !isRuleOperator(operator) || !value) return null;
  if (operator === "regex" && !isSafeRegexPattern(value)) return null;
  return { op: "condition", field, operator, value, caseSensitive: Boolean(raw2.caseSensitive) };
}
__name(sanitizeCondition, "sanitizeCondition");
function legacyExpressionFromInput(input, caseSensitive) {
  const fields = (input.fields ?? []).filter((field) => RULE_FIELDS.includes(field));
  const keywords = input.keywords?.length ? input.keywords : parseRuleKeywords(input.keyword);
  if (fields.length === 0 || keywords.length === 0) return null;
  const operator = input.matchMode === "exact" ? "exact" : "contains";
  const keywordLogic = normalizeRuleLogic(input.keywordLogic, "or");
  const fieldLogic = normalizeRuleLogic(input.fieldLogic, "or");
  const keywordGroups = keywords.map((keyword) => expressionGroup(fieldLogic, fields.map((field) => ({ op: "condition", field, operator, value: keyword, caseSensitive })))).filter((group) => Boolean(group));
  return expressionGroup(keywordLogic, keywordGroups);
}
__name(legacyExpressionFromInput, "legacyExpressionFromInput");
function legacyExpressionFromRule(rule) {
  const fields = parseRuleFields(rule.fields_json);
  const keywords = parseRuleKeywords(rule.keyword);
  const operator = rule.match_mode === "exact" ? "exact" : "contains";
  const caseSensitive = Boolean(rule.case_sensitive);
  const conditions = keywords.flatMap((value) => fields.map((field) => ({ op: "condition", field, operator, value, caseSensitive })));
  return expressionGroup("or", conditions) ?? { op: "condition", field: "subject", operator: "contains", value: "__never_match__" };
}
__name(legacyExpressionFromRule, "legacyExpressionFromRule");
function evaluateExpression(email, expression) {
  if (expression.op === "condition") return evaluateCondition(email, expression);
  if (expression.op === "not") return !evaluateExpression(email, expression.child);
  const matches = expression.children.map((child) => evaluateExpression(email, child));
  return expression.op === "and" ? matches.every(Boolean) : matches.some(Boolean);
}
__name(evaluateExpression, "evaluateExpression");
function evaluateCondition(email, condition) {
  return fieldValues(email, condition.field).some((rawValue) => matchesValue(rawValue, condition));
}
__name(evaluateCondition, "evaluateCondition");
function matchesValue(rawValue, condition) {
  const value = normalize(rawValue, Boolean(condition.caseSensitive));
  const expected = normalize(condition.value, Boolean(condition.caseSensitive));
  if (condition.operator === "exact") return value === expected;
  if (condition.operator === "startsWith") return value.startsWith(expected);
  if (condition.operator === "endsWith") return value.endsWith(expected);
  if (condition.operator === "regex") return regexMatches(rawValue, condition.value, Boolean(condition.caseSensitive));
  return value.includes(expected);
}
__name(matchesValue, "matchesValue");
function fieldValues(email, field) {
  if (field === "from") return [email.fromAddress ?? ""];
  if (field === "to") return [email.envelopeTo, ...email.toAddresses];
  if (field === "subject") return [email.subject ?? ""];
  if (field === "text") return [email.text];
  if (field === "html") return [email.html];
  return email.codes;
}
__name(fieldValues, "fieldValues");
function isRuleOperator(value) {
  return value === "contains" || value === "exact" || value === "startsWith" || value === "endsWith" || value === "regex";
}
__name(isRuleOperator, "isRuleOperator");
function isSafeRegexPattern(pattern) {
  if (pattern.length > MAX_REGEX_PATTERN_LENGTH) return false;
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}
__name(isSafeRegexPattern, "isSafeRegexPattern");
function regexMatches(value, pattern, caseSensitive) {
  try {
    return new RegExp(pattern, caseSensitive ? "" : "i").test(value);
  } catch {
    return false;
  }
}
__name(regexMatches, "regexMatches");
function normalize(value, caseSensitive) {
  return caseSensitive ? value : value.toLowerCase();
}
__name(normalize, "normalize");
function expressionGroup(op, children) {
  if (children.length === 0) return null;
  return children.length === 1 ? children[0] : { op, children };
}
__name(expressionGroup, "expressionGroup");
function normalizeRuleLogic(value, fallback) {
  if (value === "all" || value === "and") return "and";
  if (value === "any" || value === "or") return "or";
  return fallback;
}
__name(normalizeRuleLogic, "normalizeRuleLogic");
function evaluateRuleGroupMatch(totalRuleCount, matchedRuleCount, logic) {
  if (totalRuleCount === 0) return false;
  return logic === "and" ? matchedRuleCount === totalRuleCount : matchedRuleCount > 0;
}
__name(evaluateRuleGroupMatch, "evaluateRuleGroupMatch");
function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
__name(parseJson, "parseJson");
function unique(values) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
__name(unique, "unique");

// src/services/share-links.ts
async function hashShareToken(token) {
  return await sha256Base64Url(token);
}
__name(hashShareToken, "hashShareToken");
async function createShareLink(db, input) {
  if (input.ruleIds.length === 0) {
    throw new Error("At least one rule is required.");
  }
  const token = randomToken();
  const tokenHash = await hashShareToken(token);
  const result = await db.prepare(
    `INSERT INTO share_links (
         name, token, token_hash, expires_at, status, window_minutes,
         allow_rule_logic, block_rule_logic, created_by_admin_id
       )
       VALUES (?1, ?2, ?3, ?4, 'active', ?5, ?6, ?7, ?8)`
  ).bind(
    input.name ?? null,
    token,
    tokenHash,
    input.expiresAt ?? null,
    DEFAULT_WINDOW_MINUTES,
    input.allowRuleLogic ?? "or",
    input.blockRuleLogic ?? "or",
    input.adminId
  ).run();
  const id = Number(result.meta.last_row_id);
  await db.batch(
    input.ruleIds.map(
      (ruleId) => db.prepare("INSERT INTO share_link_rules (share_link_id, rule_id) VALUES (?1, ?2)").bind(id, ruleId)
    )
  );
  return { id, token };
}
__name(createShareLink, "createShareLink");
async function listShareLinks(db) {
  const result = await db.prepare("SELECT * FROM share_links ORDER BY id DESC").all();
  return await Promise.all(result.results.map((row) => withRuleIds(db, row)));
}
__name(listShareLinks, "listShareLinks");
async function updateShareLink(db, id, input) {
  const updates = [];
  const values = [];
  addShareLinkUpdate(updates, values, "name", input.name);
  addShareLinkUpdate(updates, values, "expires_at", input.expiresAt);
  addShareLinkUpdate(updates, values, "status", input.status);
  addShareLinkUpdate(updates, values, "allow_rule_logic", input.allowRuleLogic);
  addShareLinkUpdate(updates, values, "block_rule_logic", input.blockRuleLogic);
  if (updates.length > 0) {
    values.push(id);
    await db.prepare(`UPDATE share_links SET ${updates.join(", ")} WHERE id = ?${values.length}`).bind(...values).run();
  }
  if (input.ruleIds) {
    await replaceShareLinkRules(db, id, input.ruleIds);
  }
}
__name(updateShareLink, "updateShareLink");
async function resetShareLinkToken(db, id) {
  const token = randomToken();
  const tokenHash = await hashShareToken(token);
  await db.prepare("UPDATE share_links SET token = ?1, token_hash = ?2 WHERE id = ?3").bind(token, tokenHash, id).run();
  return token;
}
__name(resetShareLinkToken, "resetShareLinkToken");
async function deleteShareLink(db, id) {
  await db.prepare("DELETE FROM share_links WHERE id = ?1").bind(id).run();
}
__name(deleteShareLink, "deleteShareLink");
async function getShareLinkByToken(db, token) {
  const tokenHash = await hashShareToken(token);
  const row = await db.prepare("SELECT * FROM share_links WHERE token_hash = ?1").bind(tokenHash).first();
  return row ? await withRuleIds(db, row) : null;
}
__name(getShareLinkByToken, "getShareLinkByToken");
function isShareLinkUsable(link) {
  return link.status === "active" && !isPastIso(link.expires_at);
}
__name(isShareLinkUsable, "isShareLinkUsable");
async function markShareLinkAccessed(db, id) {
  await db.prepare("UPDATE share_links SET last_accessed_at = ?1 WHERE id = ?2").bind(nowIso(), id).run();
}
__name(markShareLinkAccessed, "markShareLinkAccessed");
async function withRuleIds(db, row) {
  const rules = await db.prepare("SELECT rule_id FROM share_link_rules WHERE share_link_id = ?1 ORDER BY rule_id").bind(row.id).all();
  return { ...row, ruleIds: rules.results.map((rule) => rule.rule_id) };
}
__name(withRuleIds, "withRuleIds");
function addShareLinkUpdate(updates, values, column, value) {
  if (value === void 0) {
    return;
  }
  values.push(value);
  updates.push(`${column} = ?${values.length}`);
}
__name(addShareLinkUpdate, "addShareLinkUpdate");
async function replaceShareLinkRules(db, id, ruleIds) {
  await db.prepare("DELETE FROM share_link_rules WHERE share_link_id = ?1").bind(id).run();
  if (ruleIds.length === 0) {
    return;
  }
  await db.batch(
    ruleIds.map(
      (ruleId) => db.prepare("INSERT INTO share_link_rules (share_link_id, rule_id) VALUES (?1, ?2)").bind(id, ruleId)
    )
  );
}
__name(replaceShareLinkRules, "replaceShareLinkRules");

// src/utils/http.ts
async function readJson(c) {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}
__name(readJson, "readJson");
function badRequest(c, message) {
  return c.json({ ok: false, error: message }, 400);
}
__name(badRequest, "badRequest");
function unauthorized(c, message = "Unauthorized") {
  return c.json({ ok: false, error: message }, 401);
}
__name(unauthorized, "unauthorized");
function forbidden(c, message = "Forbidden") {
  return c.json({ ok: false, error: message }, 403);
}
__name(forbidden, "forbidden");
function notFound(c, message = "Not found") {
  return c.json({ ok: false, error: message }, 404);
}
__name(notFound, "notFound");
function clampNumber(value, fallback, min, max) {
  const normalized = typeof value === "string" ? value.trim() : value;
  if (normalized == null || normalized === "") {
    return fallback;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}
__name(clampNumber, "clampNumber");

// src/routes/admin.ts
function registerAdminRoutes(app2) {
  app2.get("/api/setup/status", async (c) => {
    await ensureDatabaseSchema(c.env.DB);
    return c.json({ ok: true, hasAdmin: await countAdmins(c.env.DB) > 0 });
  });
  app2.post("/api/setup/admin", createFirstAdmin);
  app2.post("/api/admin/login", login);
  app2.post("/api/admin/logout", async (c) => {
    c.header("Set-Cookie", sessionClearCookie());
    return c.json({ ok: true });
  });
  app2.get("/api/admin/me", async (c) => withAdmin(c, (admin) => c.json({ ok: true, admin: publicAdmin(admin) })));
  app2.get("/api/admin/emails", async (c) => withAdmin(c, () => adminListEmails(c)));
  app2.get("/api/admin/emails/:id", async (c) => withAdmin(c, () => adminEmailDetail(c)));
  app2.get("/api/admin/rules", async (c) => withAdmin(c, () => adminListRules(c)));
  app2.post("/api/admin/rules", async (c) => withAdmin(c, () => adminCreateRule(c)));
  app2.patch("/api/admin/rules/:id", async (c) => withAdmin(c, () => adminUpdateRule(c)));
  app2.delete("/api/admin/rules/:id", async (c) => withAdmin(c, () => adminDeleteRule(c)));
  app2.get("/api/admin/share-links", async (c) => withAdmin(c, () => adminListShareLinks(c)));
  app2.post("/api/admin/share-links", async (c) => withAdmin(c, (admin) => adminCreateShareLink(c, admin)));
  app2.patch("/api/admin/share-links/:id", async (c) => withAdmin(c, () => adminUpdateShareLink(c)));
  app2.post("/api/admin/share-links/:id/reset", async (c) => withAdmin(c, (admin) => adminResetShareLink(c, admin)));
  app2.delete("/api/admin/share-links/:id", async (c) => withAdmin(c, () => adminDeleteShareLink(c)));
  app2.get("/api/admin/database/status", async (c) => withAdmin(c, () => adminDatabaseStatus(c)));
  app2.post("/api/admin/database/upgrade", async (c) => withAdmin(c, () => adminUpgradeDatabase(c)));
  app2.get("/api/admin/access-logs", async (c) => withAdmin(c, () => adminAccessLogs(c)));
}
__name(registerAdminRoutes, "registerAdminRoutes");
async function createFirstAdmin(c) {
  if (!c.env.ADMIN_SETUP_TOKEN) {
    return c.json({ ok: false, error: "ADMIN_SETUP_TOKEN is required before setup." }, 500);
  }
  const body = await readJson(c);
  const setupToken = typeof body?.setupToken === "string" ? body.setupToken : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!setupToken || !username || !password) {
    return badRequest(c, "setupToken, username and password are required.");
  }
  if (!timingSafeEqual(setupToken, c.env.ADMIN_SETUP_TOKEN)) {
    return forbidden(c, "Invalid setup token.");
  }
  if (password.length < 10) {
    return badRequest(c, "Password must be at least 10 characters.");
  }
  await ensureDatabaseSchema(c.env.DB);
  if (await countAdmins(c.env.DB) > 0) {
    return forbidden(c, "Admin already exists.");
  }
  const id = await createAdmin(c.env.DB, username, password);
  await writeAccessLog(c.env.DB, { actorType: "system", actorId: id, action: "admin.created", request: c.req.raw });
  return c.json({ ok: true, id });
}
__name(createFirstAdmin, "createFirstAdmin");
async function login(c) {
  const body = await readJson(c);
  if (!body?.username || !body.password) {
    return badRequest(c, "username and password are required.");
  }
  const admin = await authenticateAdmin(c.env.DB, body.username.trim(), body.password);
  if (!admin) {
    return unauthorized(c, "Invalid credentials.");
  }
  const session = await createSessionValue(c.env, admin);
  c.header("Set-Cookie", sessionSetCookie(session));
  await writeAccessLog(c.env.DB, { actorType: "admin", actorId: admin.id, action: "admin.login", request: c.req.raw });
  return c.json({ ok: true, admin: publicAdmin(admin) });
}
__name(login, "login");
async function withAdmin(c, handler) {
  const value = getCookie(c.req.raw, SESSION_COOKIE);
  const admin = await verifySessionValue(c.env.DB, c.env, value);
  if (!admin) {
    return unauthorized(c);
  }
  return await handler(admin);
}
__name(withAdmin, "withAdmin");
async function adminListEmails(c) {
  const page2 = clampNumber(c.req.query("page"), 1, 1, MAX_EMAIL_PAGE);
  const pageSizeParam = c.req.query("pageSize") ?? c.req.query("limit");
  const pageSize = clampNumber(pageSizeParam, DEFAULT_EMAIL_LIMIT, 1, MAX_EMAIL_LIMIT);
  const result = await listEmailPage(c.env.DB, { q: c.req.query("q"), page: page2, limit: pageSize });
  return c.json({ ok: true, emails: result.emails, pagination: result.pagination });
}
__name(adminListEmails, "adminListEmails");
async function adminEmailDetail(c) {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return badRequest(c, "Invalid email id.");
  }
  const email = await getEmailDetail(c.env.DB, id);
  return email ? c.json({ ok: true, email }) : notFound(c, "Email not found.");
}
__name(adminEmailDetail, "adminEmailDetail");
async function adminListRules(c) {
  const rules = (await listRules(c.env.DB)).map((rule) => ({
    ...rule,
    fields: parseRuleFields(rule.fields_json),
    matchMode: rule.match_mode,
    caseSensitive: Boolean(rule.case_sensitive),
    enabled: Boolean(rule.enabled),
    action: ruleAction(rule),
    expression: ruleExpression(rule)
  }));
  return c.json({ ok: true, rules });
}
__name(adminListRules, "adminListRules");
async function adminCreateRule(c) {
  const input = sanitizeRuleInput(await readJson(c) ?? {});
  if (!input) {
    return badRequest(c, "name, keyword and at least one field are required.");
  }
  const id = await createRule(c.env.DB, input);
  return c.json({ ok: true, id }, 201);
}
__name(adminCreateRule, "adminCreateRule");
async function adminUpdateRule(c) {
  const id = Number(c.req.param("id"));
  const input = sanitizeRuleInput(await readJson(c) ?? {});
  if (!Number.isInteger(id) || !input) {
    return badRequest(c, "Invalid rule update.");
  }
  await updateRule(c.env.DB, id, input);
  return c.json({ ok: true });
}
__name(adminUpdateRule, "adminUpdateRule");
async function adminDeleteRule(c) {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return badRequest(c, "Invalid rule id.");
  }
  await deleteRule(c.env.DB, id);
  return c.json({ ok: true });
}
__name(adminDeleteRule, "adminDeleteRule");
async function adminListShareLinks(c) {
  const links = await listShareLinks(c.env.DB);
  return c.json({ ok: true, links: links.map((link) => publicShareLink(c, link)) });
}
__name(adminListShareLinks, "adminListShareLinks");
async function adminCreateShareLink(c, admin) {
  const body = await readJson(c);
  if (!isValidOptionalShareRuleLogic(body?.allowRuleLogic) || !isValidOptionalShareRuleLogic(body?.blockRuleLogic)) {
    return badRequest(c, "allowRuleLogic and blockRuleLogic must be 'and' or 'or'.");
  }
  const ruleIds = body?.ruleIds?.filter(Number.isInteger) ?? [];
  if (ruleIds.length === 0) {
    return badRequest(c, "At least one rule is required.");
  }
  const uniqueRuleIds = [...new Set(ruleIds)];
  const rules = await getRulesByIds(c.env.DB, uniqueRuleIds);
  if (rules.length !== uniqueRuleIds.length) {
    return badRequest(c, "All selected rules must exist and be enabled.");
  }
  if (!hasAllowRule(rules)) {
    return badRequest(c, "At least one allow rule is required.");
  }
  const created = await createShareLink(c.env.DB, {
    name: body?.name?.trim() || null,
    expiresAt: normalizeExpiresAt(body?.expiresAt),
    ruleIds: uniqueRuleIds,
    adminId: admin.id,
    allowRuleLogic: normalizeShareLinkRuleLogic(body?.allowRuleLogic),
    blockRuleLogic: normalizeShareLinkRuleLogic(body?.blockRuleLogic)
  });
  const url = new URL(`/v/${created.token}`, c.req.url).toString();
  await writeAccessLog(c.env.DB, {
    actorType: "admin",
    actorId: admin.id,
    action: `share_link.created:${created.id}`,
    request: c.req.raw
  });
  return c.json({ ok: true, id: created.id, token: created.token, url }, 201);
}
__name(adminCreateShareLink, "adminCreateShareLink");
async function adminUpdateShareLink(c) {
  const id = Number(c.req.param("id"));
  const body = await readJson(c) ?? {};
  if (!Number.isInteger(id) || !isValidShareStatus(body.status) || !isValidOptionalShareRuleLogic(body.allowRuleLogic)) {
    return badRequest(c, "Invalid share link update.");
  }
  if (!isValidOptionalShareRuleLogic(body.blockRuleLogic)) {
    return badRequest(c, "Invalid share link update.");
  }
  const update = await buildShareLinkUpdate(c, body);
  if (!update) {
    return badRequest(c, "Invalid share link update.");
  }
  await updateShareLink(c.env.DB, id, update);
  return c.json({ ok: true });
}
__name(adminUpdateShareLink, "adminUpdateShareLink");
async function adminDeleteShareLink(c) {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return badRequest(c, "Invalid share link id.");
  }
  await deleteShareLink(c.env.DB, id);
  return c.json({ ok: true });
}
__name(adminDeleteShareLink, "adminDeleteShareLink");
async function adminResetShareLink(c, admin) {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return badRequest(c, "Invalid share link id.");
  }
  const token = await resetShareLinkToken(c.env.DB, id);
  const url = new URL(`/v/${token}`, c.req.url).toString();
  await writeAccessLog(c.env.DB, {
    actorType: "admin",
    actorId: admin.id,
    action: `share_link.reset:${id}`,
    request: c.req.raw
  });
  return c.json({ ok: true, id, token, url });
}
__name(adminResetShareLink, "adminResetShareLink");
async function adminDatabaseStatus(c) {
  return c.json({ ok: true, ...await getDatabaseStatus(c.env.DB) });
}
__name(adminDatabaseStatus, "adminDatabaseStatus");
async function adminUpgradeDatabase(c) {
  return c.json({ ok: true, ...await applyPendingDatabaseMigrations(c.env.DB) });
}
__name(adminUpgradeDatabase, "adminUpgradeDatabase");
async function adminAccessLogs(c) {
  const limit = clampNumber(c.req.query("limit") ?? null, 50, 1, 100);
  const result = await c.env.DB.prepare("SELECT * FROM access_logs ORDER BY created_at DESC LIMIT ?1").bind(limit).all();
  return c.json({ ok: true, logs: result.results });
}
__name(adminAccessLogs, "adminAccessLogs");
function publicAdmin(admin) {
  return {
    id: admin.id,
    username: admin.username,
    status: admin.status,
    last_login_at: admin.last_login_at
  };
}
__name(publicAdmin, "publicAdmin");
function publicShareLink(c, link) {
  return {
    id: link.id,
    name: link.name,
    expires_at: link.expires_at,
    status: link.status,
    window_minutes: link.window_minutes,
    created_by_admin_id: link.created_by_admin_id,
    created_at: link.created_at,
    last_accessed_at: link.last_accessed_at,
    ruleIds: link.ruleIds,
    allowRuleLogic: normalizeShareLinkRuleLogic(link.allow_rule_logic),
    blockRuleLogic: normalizeShareLinkRuleLogic(link.block_rule_logic),
    url: link.token ? new URL(`/v/${link.token}`, c.req.url).toString() : null
  };
}
__name(publicShareLink, "publicShareLink");
function normalizeExpiresAt(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
__name(normalizeExpiresAt, "normalizeExpiresAt");
function hasAllowRule(rules) {
  return rules.some((rule) => Boolean(rule.enabled) && ruleAction(rule) === "allow");
}
__name(hasAllowRule, "hasAllowRule");
function isValidShareStatus(status) {
  return status === void 0 || status === "active" || status === "disabled";
}
__name(isValidShareStatus, "isValidShareStatus");
function isValidOptionalShareRuleLogic(value) {
  return value === void 0 || value === "and" || value === "or";
}
__name(isValidOptionalShareRuleLogic, "isValidOptionalShareRuleLogic");
async function buildShareLinkUpdate(c, body) {
  const update = {};
  if ("name" in body) update.name = body.name?.trim() || null;
  if ("expiresAt" in body) update.expiresAt = normalizeExpiresAt(body.expiresAt);
  if (body.status) update.status = body.status;
  if ("allowRuleLogic" in body) update.allowRuleLogic = normalizeShareLinkRuleLogic(body.allowRuleLogic);
  if ("blockRuleLogic" in body) update.blockRuleLogic = normalizeShareLinkRuleLogic(body.blockRuleLogic);
  if (Array.isArray(body.ruleIds)) {
    const ruleIds = body.ruleIds.filter(Number.isInteger);
    if (ruleIds.length === 0) return null;
    const uniqueRuleIds = [...new Set(ruleIds)];
    const rules = await getRulesByIds(c.env.DB, uniqueRuleIds, true);
    if (rules.length !== uniqueRuleIds.length || !hasAllowRule(rules)) return null;
    update.ruleIds = uniqueRuleIds;
  }
  return Object.keys(update).length > 0 ? update : null;
}
__name(buildShareLinkUpdate, "buildShareLinkUpdate");

// src/views/mail-styles.ts
var MAIL_STYLES = String.raw`
.mail-viewer-shell {
  padding: 10px 12px 16px;
  background: var(--surface);
  border-color: var(--line);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}
.mail-viewer-shell .muted { color: var(--muted); }
.mail-viewer-topbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.mail-viewer-topbar input {
  min-height: 34px;
  border-color: var(--line-strong);
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.86);
  color: var(--text);
}
.mail-viewer-topbar input:focus {
  border-color: rgba(11, 116, 222, 0.72);
  box-shadow: 0 0 0 4px rgba(11, 116, 222, 0.12);
  background: #fff;
}
.mail-viewer-topbar button,
.mail-viewer-controls button,
.mail-refresh-actions button,
.mail-action-row button,
.mail-detail-nav button {
  min-height: 36px;
  border-color: var(--line-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--primary);
  padding: 6px 12px;
  box-shadow: var(--shadow-sm);
}
.mail-viewer-topbar button:not(.secondary) {
  background: linear-gradient(135deg, var(--primary), #0869c9);
  border-color: var(--primary);
  color: #fff;
}
.mail-viewer-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin: 0 0 10px;
}
.mail-refresh-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  line-height: 1;
}
.toolbar > .mail-refresh-actions { min-width: fit-content; }
.mail-auto-refresh-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  margin: 0;
  padding: 6px 8px 6px 12px;
  border: 1px solid #cfe3ff;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
  color: var(--primary-dark);
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.mail-auto-refresh-control input {
  position: absolute;
  width: 1px;
  height: 1px;
  min-height: 1px;
  opacity: 0;
  pointer-events: none;
}
.mail-auto-refresh-control:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(11, 116, 222, 0.12);
}
.mail-auto-refresh-switch {
  position: relative;
  width: 32px;
  height: 20px;
  border-radius: 999px;
  background: var(--line-strong);
  transition: background 180ms ease;
}
.mail-auto-refresh-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
  transition: transform 180ms ease;
}
.mail-auto-refresh-control input:checked + .mail-auto-refresh-switch {
  background: var(--primary);
}
.mail-auto-refresh-control input:checked + .mail-auto-refresh-switch::after {
  transform: translateX(12px);
}
.mail-control-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
  color: var(--muted-strong);
  border: 1px solid #cfe3ff;
  font-weight: 700;
}
.mail-control-chip strong { color: var(--primary); }
.mail-control-chip .visitor-count {
  font-size: inherit;
  line-height: 1;
}
.mail-pagination-controls {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.mail-pagination-controls label,
.mail-page-indicator,
.mail-page-numbers {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  margin: 0;
  color: var(--muted-strong);
  font-weight: 750;
  line-height: 1;
  white-space: nowrap;
}
.mail-page-numbers { gap: 4px; }
.mail-page-number {
  min-width: 36px;
  padding-inline: 10px;
}
.mail-page-number.active {
  background: var(--primary-soft);
  border-color: #bfdbfe;
  color: var(--primary-dark);
  box-shadow: none;
}
.mail-page-ellipsis {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  color: var(--muted);
  font-weight: 800;
  padding: 0 2px;
}
.mail-pagination-controls select {
  min-height: 36px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  background: #fff;
  color: var(--text);
}
.mail-viewer-controls button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mail-viewer-grid {
  display: grid;
  grid-template-columns: minmax(290px, 380px) minmax(0, 1fr);
  min-height: min(780px, calc(100vh - 220px));
  border-top: 1px solid var(--line);
  align-items: stretch;
}
.mail-list-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--line);
  background: var(--surface-solid);
}
.mail-list-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  color: var(--text);
}
.mail-list-title span { color: var(--muted); font-size: 12px; }
.mail-list {
  display: grid;
  align-content: start;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  overflow: auto;
}
button.mail-list-item {
  display: grid;
  width: 100%;
  min-height: unset;
  justify-content: stretch;
  align-items: start;
  gap: 9px;
  padding: 15px 18px;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-left: 3px solid transparent;
  border-radius: 0;
  background: var(--surface-solid);
  color: var(--text);
  text-align: left;
  box-shadow: none;
}
button.mail-list-item:hover,
button.mail-list-item.selected {
  background: #eef6ff;
  color: var(--text);
  border-left-color: var(--primary);
  box-shadow: none;
}
.mail-list-tags,
.mail-meta-row,
.mail-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.mail-meta-pill {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 27px;
  padding: 2px 7px;
  border: 1px solid rgba(96, 165, 250, 0.48);
  color: var(--primary);
  background: #f7fbff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mail-meta-pill strong { color: var(--primary-dark); margin-right: 4px; }
.mail-detail-panel {
  min-width: 0;
  background: var(--surface-solid);
  color: var(--text);
}
.mail-detail-view { display: grid; gap: 16px; padding: 14px 24px 24px; }
.mail-detail-nav { display: flex; justify-content: space-between; gap: 12px; }
.mail-detail-header { display: grid; gap: 14px; padding-top: 4px; }
.mail-detail-header h2 { font-size: 20px; }
.mail-preview-stage {
  min-height: 520px;
  padding: 0;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  overflow: auto;
}
.mail-preview-stage .mail-body { max-height: none; min-height: 520px; border: 0; border-radius: 0; background: #fff; color: var(--text); }
.mail-preview-stage .mail-frame {
  min-height: min(760px, calc(100vh - 320px));
  border: 0;
  border-radius: 0;
}
.mail-list .empty-state, .mail-empty-detail { color: var(--muted); background: var(--surface); border-color: var(--line-strong); }
.mail-plain-panel {
  max-height: 420px;
  background: #fbfdff;
  border-color: var(--line);
  color: #334155;
}
.mail-empty-detail { margin: 24px; }
.email-card { display: grid; grid-template-columns: 64px minmax(0, 1.2fr) minmax(240px, 1fr) 170px; gap: 18px; align-items: center; padding: 20px 24px; margin-bottom: 14px; }
.email-body-preview { color: var(--muted-strong); }
.empty-state { padding: 32px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--line-strong); border-radius: var(--radius-md); }
.mail-body { max-height: 560px; line-height: 1.75; background: #fbfdff; }
.mail-frame { width: 100%; min-height: 680px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: #fff; }
.mail-risk { display: grid; gap: 10px; margin-bottom: 12px; padding: 14px; border: 1px solid #fed7aa; border-radius: var(--radius-sm); background: #fff7ed; color: #9a3412; }
.mail-risk button { width: fit-content; }
.advanced-info { border: 1px solid var(--line); border-radius: var(--radius-md); padding: 14px 16px; background: var(--surface-muted); }
.advanced-info summary { cursor: pointer; font-weight: 800; color: var(--primary); }
.advanced-info h3 { margin-top: 14px; }
`;

// src/views/layout.ts
function escapeHtml2(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
__name(escapeHtml2, "escapeHtml");
function page(title, body, script = "") {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml2(title)}</title>
  <style>${styles()}</style>
</head>
<body>
${body}
${script ? `<script>${script}<\/script>` : ""}
</body>
</html>`;
}
__name(page, "page");
var BASE_STYLES = String.raw`
:root {
  color-scheme: light;
  --bg: #f3f8ff;
  --bg-soft: #eef6ff;
  --surface: rgba(255, 255, 255, 0.92);
  --surface-solid: #ffffff;
  --surface-muted: #f8fbff;
  --text: #0f172a;
  --muted: #64748b;
  --muted-strong: #475569;
  --line: #dbe7f6;
  --line-strong: #c6d8ef;
  --primary: #0b74de;
  --primary-dark: #075fb8;
  --primary-soft: #e8f2ff;
  --success: #16a34a;
  --success-soft: #dcfce7;
  --warning: #f59e0b;
  --warning-soft: #fff7ed;
  --danger: #dc2626;
  --danger-soft: #fef2f2;
  --shadow-sm: 0 8px 24px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 18px 50px rgba(15, 23, 42, 0.10);
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --sidebar: 260px;
}
* { box-sizing: border-box; }
html { min-height: 100%; }
body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 8% 18%, rgba(59, 130, 246, 0.13), transparent 28%),
    radial-gradient(circle at 88% 10%, rgba(14, 165, 233, 0.10), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, var(--bg) 100%);
  color: var(--text);
  font: 14px/1.55 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
a { color: var(--primary); text-decoration: none; }
a:hover { color: var(--primary-dark); }
h1, h2, h3, p { margin: 0; }
h1 { font-size: clamp(28px, 3vw, 40px); line-height: 1.15; letter-spacing: -0.04em; }
h2 { font-size: 18px; line-height: 1.25; letter-spacing: -0.02em; }
h3 { font-size: 15px; line-height: 1.35; }
main { width: min(1280px, calc(100vw - 32px)); margin: 28px auto; }
section, .card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
section { padding: 22px; margin-bottom: 18px; }
label { display: block; color: var(--muted-strong); font-weight: 650; font-size: 13px; margin: 14px 0 7px; }
input, select, textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--text);
  font: inherit;
  outline: none;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}
input::placeholder, textarea::placeholder { color: #94a3b8; }
input:focus, select:focus, textarea:focus {
  border-color: rgba(11, 116, 222, 0.72);
  box-shadow: 0 0 0 4px rgba(11, 116, 222, 0.12);
  background: #fff;
}
input[type="checkbox"], input[type="radio"] {
  width: 16px;
  min-height: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--primary);
}
textarea { min-height: 96px; resize: vertical; }
button, .button-link {
  min-height: 44px;
  border: 1px solid var(--primary);
  background: linear-gradient(135deg, var(--primary), #0869c9);
  color: #fff;
  border-radius: var(--radius-sm);
  padding: 10px 16px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease;
}
button:hover, .button-link:hover { box-shadow: 0 12px 26px rgba(11, 116, 222, 0.22); color: #fff; }
button:active, .button-link:active { transform: translateY(1px); }
button.secondary, .button-link.secondary { background: #fff; color: var(--primary); border-color: var(--line-strong); }
button.secondary:hover, .button-link.secondary:hover { border-color: var(--primary); color: var(--primary-dark); box-shadow: var(--shadow-sm); }
button.danger { background: #fff; color: var(--danger); border-color: #fecaca; }
button.danger:hover { border-color: var(--danger); box-shadow: 0 10px 22px rgba(220, 38, 38, 0.12); color: var(--danger); }
button:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: 3px solid rgba(11, 116, 222, 0.25);
  outline-offset: 2px;
}
table { width: 100%; border-collapse: separate; border-spacing: 0; }
th, td { border-bottom: 1px solid var(--line); padding: 14px 12px; text-align: left; vertical-align: middle; }
th { color: var(--muted); font-weight: 750; font-size: 12px; background: var(--surface-muted); }
tbody tr { transition: background 180ms ease; }
tbody tr:hover { background: #f7fbff; }
tr[data-id] { cursor: pointer; }
pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: linear-gradient(180deg, #f8fbff, #f3f7fc);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px;
  max-height: 360px;
  overflow: auto;
  color: #334155;
}
.hidden { display: none !important; }
.muted { color: var(--muted); }
.ok { color: var(--success); }
.danger-text { color: var(--danger); }
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 18px; }
.span-4 { grid-column: span 4; }
.span-5 { grid-column: span 5; }
.span-7 { grid-column: span 7; }
.span-8 { grid-column: span 8; }
.span-12 { grid-column: span 12; }
.toolbar { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; }
.toolbar > * { min-width: 150px; }
.card-header, .page-title-row, .topbar, .brand, .nav-item, .metric-card, .inline-status {
  display: flex;
  align-items: center;
}
.card-header { justify-content: space-between; gap: 14px; margin-bottom: 18px; }
.card-title { display: grid; gap: 4px; }
.page-title-row { justify-content: space-between; gap: 18px; margin-bottom: 22px; }
.page-kicker { color: var(--primary); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px; }
.brand { gap: 12px; font-weight: 850; font-size: 18px; letter-spacing: -0.02em; }
.brand-icon, .soft-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: #fff;
  background: linear-gradient(135deg, #1778e8, #075fb8);
  box-shadow: 0 12px 28px rgba(11, 116, 222, 0.20);
}
.brand-icon svg, .soft-icon svg { width: 22px; height: 22px; stroke: currentColor; }
.soft-icon { color: var(--primary); background: var(--primary-soft); box-shadow: none; }
.soft-icon.success { color: var(--success); background: var(--success-soft); }
.soft-icon.warning { color: var(--warning); background: var(--warning-soft); }
.badge, .chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 750;
  color: var(--primary);
  background: var(--primary-soft);
  border: 1px solid #cfe3ff;
}
.badge.success, .chip.success { color: #15803d; background: var(--success-soft); border-color: #bbf7d0; }
.badge.muted-badge { color: var(--muted-strong); background: #f1f5f9; border-color: #e2e8f0; }
.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 18px;
  letter-spacing: 0.02em;
  color: #059669;
  background: var(--success-soft);
  border-color: #bbf7d0;
}
.code-label {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 12px;
  letter-spacing: 0;
}
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.checkbox-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 9px 11px;
  min-height: 40px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--primary);
  cursor: pointer;
}
.inline-status { gap: 8px; color: var(--muted-strong); font-weight: 650; }
.status-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.14); }
.table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-md); }
.table-wrap table { min-width: 720px; }
.modal-card {
  width: min(680px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 0;
  background: var(--surface-solid);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
#rule-dialog { width: min(1280px, calc(100vw - 16px)); }
.modal-card::backdrop { background: rgba(15, 23, 42, 0.38); backdrop-filter: blur(4px); }
.modal-form { max-height: calc(100vh - 32px); overflow-y: auto; padding: 22px; }
.modal-title-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 12px; }
.list-item-card {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-solid);
  box-shadow: var(--shadow-sm);
}
.item-main { display: grid; gap: 12px; min-width: 0; }
.item-title-row, .item-meta, .item-actions, .generated-link {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.item-title-row strong { font-size: 16px; }
.item-actions { justify-content: flex-end; flex: 0 0 auto; }
.item-actions button { min-height: 36px; padding: 7px 12px; }
.generated-link {
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 13px 14px;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  background: var(--success-soft);
  color: #166534;
}
.generated-link span { min-width: 0; overflow-wrap: anywhere; }
.database-version-line {
  display: inline-block;
  padding: 12px 14px;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-sm);
  background: rgba(239, 246, 255, 0.86);
  color: #1e40af;
  font-weight: 750;
}
.database-version-line strong { color: var(--primary-dark); }
.database-version-line.warning {
  border-color: #fed7aa;
  background: var(--warning-soft);
  color: #9a3412;
}
.database-version-line.warning strong { color: #9a3412; }
.metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px; }
.metric-card { gap: 14px; padding: 18px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.metric-value { display: block; font-size: 28px; line-height: 1; font-weight: 850; letter-spacing: -0.04em; margin-top: 4px; }
.app-shell { min-height: 100vh; display: grid; grid-template-columns: var(--sidebar) minmax(0, 1fr); }
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 24px 18px;
  background: rgba(255,255,255,0.78);
  border-right: 1px solid var(--line);
  backdrop-filter: blur(18px);
}
.sidebar-nav { display: grid; gap: 8px; margin-top: 34px; }
.nav-item {
  gap: 10px;
  min-height: 46px;
  padding: 10px 12px;
  border-radius: 14px;
  color: var(--muted-strong);
  font-weight: 720;
}
.nav-item.active, .nav-item:hover { background: #e9f3ff; color: var(--primary); }
.nav-item svg { width: 19px; height: 19px; stroke: currentColor; }
.sidebar-footer { position: absolute; left: 18px; right: 18px; bottom: 24px; padding-top: 18px; border-top: 1px solid var(--line); }
.content-shell { min-width: 0; }
.topbar {
  min-height: 76px;
  justify-content: space-between;
  padding: 18px 28px;
  background: rgba(255,255,255,0.66);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px);
}
.dashboard-main { width: min(1480px, calc(100vw - var(--sidebar) - 56px)); margin: 28px auto; }
.search-panel { display: grid; grid-template-columns: minmax(260px, 1fr) auto auto; gap: 14px; align-items: end; }
.detail-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
.detail-row { display: grid; grid-template-columns: 110px 1fr; gap: 14px; padding: 8px 0; color: var(--muted-strong); }
.hero-auth { min-height: 100vh; display: grid; grid-template-columns: minmax(280px, 420px) 520px; gap: 54px; align-items: center; width: min(1320px, calc(100vw - 48px)); margin: 0 auto; padding: 48px 0; background: transparent; border: 0; box-shadow: none; }
.hero-copy { display: grid; gap: 28px; }
.auth-loading { min-height: 100vh; display: grid; place-content: center; gap: 18px; text-align: center; }
.compact-hero { align-content: center; gap: 22px; }
.hero-copy p { font-size: 17px; color: var(--muted-strong); }
.hero-features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.feature-card { padding: 16px; display: flex; gap: 12px; align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.auth-card { padding: 42px; border-radius: 28px; background: rgba(255,255,255,0.86); border: 1px solid var(--line); box-shadow: var(--shadow-md); }
.auth-card form { margin-top: 26px; }
.form-actions { display: grid; gap: 12px; margin-top: 20px; }
.setup-shell { min-height: 100vh; padding: 28px; }
.setup-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 44px; }
.setup-card { width: min(760px, 100%); margin: 0 auto; padding: 42px; text-align: center; }
.setup-card form { text-align: left; margin-top: 26px; }
.progress-line { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 26px; color: var(--primary); font-weight: 800; }
.progress-line::before, .progress-line::after { content: ""; width: min(180px, 24vw); height: 6px; border-radius: 999px; background: linear-gradient(90deg, var(--primary), #60a5fa); }
.notice { display: flex; gap: 12px; align-items: flex-start; padding: 16px; border-radius: var(--radius-md); border: 1px solid #bfdbfe; background: rgba(239, 246, 255, 0.86); color: #1e40af; }
.rule-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.rule-page-shell {
  padding: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,251,255,0.94));
}
.rule-page-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.rule-page-header { margin-bottom: 18px; }
.rule-list-shell {
  display: grid;
  gap: 12px;
}
.rule-list-shell .list-item-card {
  margin-bottom: 0;
  padding: 18px 20px;
  border-color: rgba(198, 216, 239, 0.96);
  background: rgba(255, 255, 255, 0.94);
}
.rule-list-shell .list-item-card:hover {
  border-color: rgba(11, 116, 222, 0.3);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
}
.rule-dialog-form { padding: 0; }
.rule-dialog-shell {
  display: grid;
  gap: 14px;
  padding: 18px;
}
.rule-dialog-title-row {
  margin-bottom: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
  align-items: center;
}
.rule-dialog-title-row h2 {
  font-size: 18px;
  line-height: 1.3;
}
.rule-dialog-close {
  min-height: 36px;
  width: 36px;
  padding: 0;
  font-size: 22px;
  line-height: 1;
  color: var(--muted-strong);
}
.rule-dialog-close:hover { color: var(--text); }
.rule-form-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.rule-form-field { margin: 0; }
.rule-form-field > span {
  display: block;
  margin-bottom: 8px;
  color: var(--muted-strong);
  font-weight: 700;
}
.rule-canvas {
  padding: 14px;
  border: 2px solid rgba(59, 130, 246, 0.72);
  border-radius: 20px;
  background:
    linear-gradient(rgba(59, 130, 246, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.045) 1px, transparent 1px),
    radial-gradient(circle at 12% 0%, rgba(37, 99, 235, 0.12), transparent 30%),
    linear-gradient(180deg, #ffffff, #f8fbff);
  background-size: 22px 22px, 22px 22px, auto, auto;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.92), 0 18px 42px rgba(37, 99, 235, 0.08);
}
.rule-builder-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 8px;
}
.rule-builder-topline > div:first-child {
  display: grid;
  gap: 4px;
}
.rule-builder-summary {
  flex: 0 0 min(420px, 42%);
  margin: 0;
  padding: 8px 10px;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #1e3a8a;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}
.rule-builder-summary.invalid {
  border-color: #fdba74;
  background: #fff7ed;
  color: #c2410c;
}
.rule-builder-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  align-items: center;
}
.rule-builder-toolbar {
  margin: 0 0 12px;
  padding-top: 2px;
}
.rule-builder-fallback-toolbar { display: none; }
.rule-builder-actions button,
.rule-group-header-actions button,
.rule-condition-actions button {
  min-height: 36px;
  padding: 0 13px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}
.rule-builder-tree {
  position: relative;
  display: grid;
  gap: 12px;
}
.rule-workspace {
  min-height: 240px;
  padding: 8px;
  border: 1px solid rgba(147, 197, 253, 0.42);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.66);
}
.rule-builder-tree.is-pointer-dragging { cursor: grabbing; }
.rule-node {
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  transition: transform 140ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease, opacity 160ms ease;
}
.rule-node:hover,
.rule-node:focus-within {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.rule-node.is-dragging-source {
  opacity: 1;
  border-color: rgba(37, 99, 235, 0.64);
  border-style: dashed;
  background: rgba(219, 234, 254, 0.48);
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.14);
}
.rule-node.rule-drag-placeholder {
  outline: 1.5px dashed rgba(37, 99, 235, 0.58);
  outline-offset: -2px;
  background: rgba(219, 234, 254, 0.46);
}
.rule-builder-tree.is-pointer-dragging .rule-node.is-dragging-source > * {
  visibility: hidden;
}
.rule-node-group.root {
  border-color: rgba(59, 130, 246, 0.62);
  border-radius: 18px;
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.22), 0 18px 44px rgba(37, 99, 235, 0.08);
}
.rule-node-group.nested {
  border-color: rgba(96, 165, 250, 0.48);
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.96));
}
.rule-node-group.rule-node-not {
  border-style: dashed;
  border-color: #c4b5fd;
  background: #fcfaff;
}
.rule-group-shell { display: grid; }
.rule-group-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(219, 234, 254, 0.9);
  background: linear-gradient(180deg, rgba(239,246,255,0.98), rgba(255,255,255,0.96));
}
.rule-node-not .rule-group-header {
  background: linear-gradient(180deg, rgba(248,245,255,0.98), rgba(255,255,255,0.94));
}
.rule-group-header-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}
.rule-group-header-actions,
.rule-condition-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  margin-left: auto;
}
.rule-group-header-actions { flex-wrap: wrap; justify-content: flex-end; }
.rule-condition-actions {
  align-items: flex-end;
  gap: 6px;
  padding-bottom: 3px;
  flex-wrap: nowrap;
}
.rule-condition-actions button {
  min-height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1;
}
.rule-group-header-actions .rule-action-primary {
  color: #2563eb;
  border-color: #bfdbfe;
  background: #fff;
}
.rule-group-header-actions .danger,
.rule-condition-actions .danger {
  color: #ef4444;
  border-color: #fecaca;
  background: #fff7f7;
}
.rule-more-button {
  min-width: 40px;
  padding: 0 10px !important;
  font-size: 18px !important;
  letter-spacing: 0.08em;
}
.rule-title-grip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 34px;
  color: #64748b;
}
.rule-node-caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 16px;
}
.rule-node-kind {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  min-height: 38px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
}
.rule-node-kind.rule-node-kind-or { background: linear-gradient(135deg, #a78bfa, #7c3aed); box-shadow: 0 8px 18px rgba(124, 58, 237, 0.2); }
.rule-node-kind.rule-node-kind-not { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.rule-node-kind.rule-node-kind-condition {
  color: var(--primary-dark);
  background: rgba(219, 234, 254, 0.92);
  border: 1px solid rgba(147, 197, 253, 0.88);
}
.rule-node-pill-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.rule-inline-select {
  position: absolute;
  inset: 0;
  width: 100%;
  min-width: 100%;
  max-width: none;
  min-height: 100%;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: auto;
  cursor: pointer;
}
.rule-group-title {
  color: #1f2937;
  font-size: 15px;
  font-weight: 900;
  white-space: nowrap;
}
.rule-title-edit {
  color: #64748b;
  font-size: 15px;
}
.rule-node-hint {
  color: var(--muted-strong);
  font-weight: 700;
}
.rule-node-children {
  display: grid;
  gap: 10px;
  padding: 12px 16px 16px;
  position: relative;
}
.rule-node-group:not(.root) .rule-node-children {
  margin-left: 32px;
  border-left: 2px solid rgba(147, 197, 253, 0.38);
}
.rule-node-condition-card {
  background: transparent;
  border: 0;
  box-shadow: none;
}
.rule-node-condition-card.rule-drag-placeholder {
  border: 1.5px dashed rgba(37, 99, 235, 0.58);
  border-radius: 14px;
  background: rgba(219, 234, 254, 0.42);
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.1);
}
.rule-condition-card {
  border: 0;
  border-radius: 0;
  background: #fff;
  padding: 0;
  box-shadow: none;
}
.rule-condition-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: end;
  min-height: 62px;
}
.rule-condition-leading {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 3px;
}
.rule-drag-handle {
  cursor: grab;
  min-height: 34px;
  width: 28px;
  padding: 0;
  user-select: none;
  touch-action: none;
  color: #64748b;
  border-color: transparent;
  background: transparent;
}
.rule-drag-handle:hover,
.rule-drag-handle:focus-visible {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.12);
}
.rule-drag-handle:disabled { cursor: not-allowed; }
.rule-drag-handle:active,
.rule-builder-tree.is-pointer-dragging .rule-drag-handle { cursor: grabbing; }
.rule-builder-tree.is-pointer-dragging .rule-node:not(.is-dragging-source) {
  will-change: transform;
}
.rule-grip {
  width: 14px;
  height: 14px;
  display: inline-block;
  background-image: radial-gradient(currentColor 1.3px, transparent 1.3px);
  background-size: 6px 6px;
  background-position: 0 0;
  opacity: 0.72;
}
.rule-condition-fields {
  display: grid;
  grid-template-columns: minmax(150px, 1.05fr) minmax(118px, 0.78fr) minmax(190px, 1fr) max-content;
  gap: 10px;
  align-items: end;
}
.rule-field-cell {
  display: grid;
  gap: 5px;
  margin: 0;
}
.rule-field-cell span {
  display: block;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.2;
}
.rule-select-shell {
  position: relative;
  display: flex;
  align-items: center;
}
.rule-field-select-shell select { padding-left: 42px !important; }
.rule-field-icon {
  position: absolute;
  left: 10px;
  z-index: 1;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  color: #2563eb !important;
  background: #eff6ff;
  font-size: 12px !important;
  font-weight: 900 !important;
  letter-spacing: 0 !important;
  pointer-events: none;
}
.rule-field-icon-code { font-size: 18px !important; }
.rule-field-cell select,
.rule-field-cell input {
  width: 100%;
  min-height: 34px;
  padding: 6px 10px;
  border-color: #dbe7f6;
  border-radius: 8px;
  background-color: #fff;
  color: #1f2937;
  font-weight: 800;
  font-size: 13px;
}
.rule-field-checkbox { min-width: 104px; }
.rule-case-toggle {
  min-height: 34px;
  width: 100%;
  justify-content: flex-start;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted-strong);
  box-shadow: none;
  white-space: nowrap;
}
.rule-case-toggle input {
  width: 16px !important;
  height: 16px;
  min-height: 16px !important;
  margin: 0;
  padding: 0;
  accent-color: #2563eb;
  flex: 0 0 auto;
}
.rule-drop-zone { display: none; }
.rule-builder-tree.is-pointer-dragging .rule-drop-zone {
  position: relative;
  display: grid;
  min-height: 10px;
  margin: -5px 0;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: #2563eb;
  font-size: 0;
  font-weight: 800;
  place-items: center;
  transition: min-height 160ms cubic-bezier(0.2, 0, 0, 1), margin 160ms cubic-bezier(0.2, 0, 0, 1), background 160ms ease, box-shadow 160ms ease;
}
.rule-builder-tree.is-pointer-dragging .rule-drop-zone.active::before,
.rule-builder-tree.is-pointer-dragging .rule-drop-zone.active::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  border: 3px solid #2563eb;
  border-radius: 999px;
  background: #fff;
}
.rule-builder-tree.is-pointer-dragging .rule-drop-zone::before { left: -5px; }
.rule-builder-tree.is-pointer-dragging .rule-drop-zone::after { right: -5px; }
.rule-add-drop-zone {
  display: grid;
  gap: 10px;
  min-height: 68px;
  padding: 12px;
  border: 1.5px dashed #93c5fd;
  border-radius: 14px;
  background: rgba(239, 246, 255, 0.62);
  color: #2563eb;
  font-weight: 900;
  place-items: center;
}
.rule-add-drop-zone-title {
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
}
.rule-add-drop-zone-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
.rule-add-drop-zone-actions button {
  min-height: 34px;
  border-color: #bfdbfe;
  background: #fff;
  color: #2563eb;
  font-weight: 900;
}
.rule-add-drop-zone.active {
  border-color: #2563eb;
  background: rgba(219, 234, 254, 0.9);
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.16);
}
.rule-drop-zone.active {
  min-height: var(--rule-placeholder-height, 64px) !important;
  margin: 4px 0 !important;
  border: 1.5px dashed #2563eb !important;
  background: rgba(219, 234, 254, 0.66) !important;
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.12), 0 12px 28px rgba(37, 99, 235, 0.1) !important;
}
.rule-drag-ghost {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2147483647;
  width: min(560px, calc(100vw - 32px));
  padding: 14px 16px;
  border: 1px solid rgba(96, 165, 250, 0.78);
  border-radius: 14px;
  background: rgba(255,255,255,0.98);
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.2);
  opacity: 0.96;
  pointer-events: none;
  transform-origin: top left;
  will-change: transform;
}
.rule-drag-ghost-card {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: 0 26px 60px rgba(15, 23, 42, 0.22);
}
.rule-drag-ghost-card .rule-node {
  margin: 0;
  border-color: rgba(37, 99, 235, 0.72);
  box-shadow: 0 22px 54px rgba(15, 23, 42, 0.2);
}
.rule-drag-ghost-card button,
.rule-drag-ghost-card input,
.rule-drag-ghost-card select,
.rule-drag-ghost-card textarea {
  pointer-events: none;
}
.rule-drag-ghost .rule-drag-ghost-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  color: var(--text);
  font-weight: 800;
}
.rule-drag-ghost .rule-drag-ghost-body {
  color: var(--muted-strong);
  font-size: 13px;
  line-height: 1.45;
}
.rule-dialog-panels {
  display: grid;
  gap: 10px;
}
.rule-quick,
.rule-advanced {
  margin-top: 0;
  padding: 10px 12px;
  border: 1px solid #eef2f7;
  border-radius: var(--radius-sm);
  background: #fbfdff;
}
.rule-quick summary,
.rule-advanced summary {
  cursor: pointer;
  color: var(--muted-strong);
  font-weight: 800;
}
.rule-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.rule-enabled-chip {
  margin: 0;
  color: var(--muted-strong);
  white-space: nowrap;
}
.rule-dialog-submit {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 1 1 auto;
}
.rule-dialog-submit #rule-message {
  margin-right: auto;
  text-align: left;
}
.rule-quick summary:focus-visible, .rule-advanced summary:focus-visible { outline: 3px solid rgba(11, 116, 222, 0.22); outline-offset: 4px; border-radius: var(--radius-sm); }
.danger-badge { color: var(--danger); background: var(--danger-soft); border-color: #fecaca; }
.ui-message-container { position: fixed; top: 18px; left: 50%; z-index: 9999; display: grid; gap: 10px; width: min(420px, calc(100vw - 32px)); transform: translateX(-50%); pointer-events: none; }
.ui-message { padding: 11px 14px; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); background: #fff; color: var(--primary-dark); font-weight: 800; text-align: center; box-shadow: var(--shadow-md); opacity: 0; transform: translateY(-8px); transition: opacity 180ms ease, transform 180ms ease; }
.ui-message.visible { opacity: 1; transform: translateY(0); }
.ui-message.success { color: #15803d; background: var(--success-soft); border-color: #bbf7d0; }
.ui-message.error { color: var(--danger); background: var(--danger-soft); border-color: #fecaca; }
.visitor-shell { min-height: 100vh; width: min(1320px, calc(100vw - 40px)); margin: 0 auto; padding: 34px 0; }
.visitor-header { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 28px; }
.visitor-hero { display: grid; grid-template-columns: auto 1fr auto; gap: 22px; align-items: center; padding: 28px; margin-bottom: 22px; }
.visitor-count { font-size: 28px; font-weight: 850; color: var(--primary); }
.mail-reader-page { width: min(1600px, calc(100vw - 32px)); }
${MAIL_STYLES}
@media (max-width: 1100px) {
  .app-shell { grid-template-columns: 1fr; }
  .sidebar { position: relative; height: auto; padding: 18px; }
  .sidebar-nav { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 18px; }
  .sidebar-footer { position: static; margin-top: 18px; }
  .dashboard-main { width: min(100vw - 32px, 1180px); }
  .hero-auth { grid-template-columns: 1fr; }
  .metric-grid, .hero-features, .rule-dialog-panels { grid-template-columns: 1fr; }
  .email-card { grid-template-columns: 54px 1fr; }
  .mail-viewer-grid { grid-template-columns: 1fr; }
  .mail-list-panel { border-right: 0; border-bottom: 1px solid var(--line); }
  .rule-form-meta-grid,
  .rule-condition-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rule-dialog-footer { display: grid; }
  .rule-builder-topline { align-items: flex-start; }
  .rule-builder-summary { flex-basis: 100%; width: 100%; }
}
@media (max-width: 760px) {
  main, .dashboard-main, .visitor-shell { width: min(100vw - 24px, 100%); margin-top: 16px; }
  section { padding: 16px; }
  .grid, .search-panel, .visitor-hero, .mail-viewer-topbar { display: block; }
  .toolbar > *, .search-panel > * { min-width: 100%; }
  .page-title-row, .topbar, .visitor-header, .visitor-email-head, .card-header, .rule-page-toolbar { align-items: flex-start; flex-direction: column; }
  .sidebar-nav { grid-template-columns: 1fr; }
  .hero-auth { width: min(100vw - 24px, 100%); padding: 24px 0; gap: 22px; }
  .auth-card, .setup-card { padding: 24px; }
  .setup-shell { padding: 18px 12px; }
  .email-card { grid-template-columns: 1fr; }
  .detail-row { grid-template-columns: 1fr; gap: 4px; }
  .mail-viewer-topbar input, .mail-viewer-topbar button { width: 100%; margin-bottom: 8px; }
  .mail-detail-view { padding: 14px; }
  .list-item-card { display: grid; }
  .item-actions { justify-content: flex-start; }
  .rule-builder-topline, .rule-form-meta-grid, .rule-dialog-submit, .rule-page-toolbar { display: grid; }
  .rule-condition-fields, .rule-grid { grid-template-columns: 1fr; }
  .rule-condition-row { grid-template-columns: 1fr; }
  .rule-condition-leading { justify-content: flex-start; }
  .rule-node-children { padding-left: 12px; }
  .rule-group-header,
  .rule-group-header-main,
  .rule-group-header-actions,
  .rule-condition-actions,
  .rule-builder-actions,
  .rule-dialog-submit { width: 100%; }
  .rule-group-header,
  .rule-group-header-main { flex-wrap: wrap; }
  .rule-group-header-actions,
  .rule-condition-actions,
  .rule-builder-actions,
  .rule-dialog-submit { flex-wrap: wrap; }
  .rule-group-header-actions button,
  .rule-condition-actions button,
  .rule-builder-actions button,
  .rule-dialog-submit button { flex: 1 1 auto; min-height: 44px; }
  .rule-dialog-shell { padding: 16px; }
  .rule-dialog-submit #rule-message { margin-right: 0; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}`;
function styles() {
  return BASE_STYLES;
}
__name(styles, "styles");

// src/views/mail-shared.ts
var COMMON_MAIL_CLIENT_SCRIPT = String.raw`
function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
function escapeAttribute(value) {
  return escapeText(value).replace(new RegExp(String.fromCharCode(96), "g"), "&#096;");
}
function formatDate(value) { return value ? new Date(value).toLocaleString() : "--"; }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString() : "--"; }
function optional(selector) { return document.querySelector(selector); }
function on(selector, eventName, handler) {
  const element = optional(selector);
  if (element) element.addEventListener(eventName, handler);
}
function createMailRefreshController(options) {
  const input = optional(options.inputSelector);
  const label = optional(options.labelSelector);
  const intervalSeconds = Math.max(5, Number(options.intervalSeconds) || 60);
  let enabled = input ? input.checked !== false : true;
  let remaining = intervalSeconds;
  let loading = false;
  const updateLabel = () => {
    if (label) label.textContent = enabled ? remaining + "秒后刷新" : "自动刷新已关闭";
  };
  const reset = () => {
    remaining = intervalSeconds;
    updateLabel();
  };
  async function refreshNow() {
    if (loading) return;
    loading = true;
    try {
      await options.refresh();
    } finally {
      loading = false;
      reset();
    }
  }
  function setEnabled(nextEnabled) {
    enabled = Boolean(nextEnabled);
    if (input) input.checked = enabled;
    reset();
  }
  const timerId = setInterval(() => {
    if (!enabled || loading) return;
    remaining -= 1;
    if (remaining <= 0) refreshNow();
    else updateLabel();
  }, 1000);
  if (input) input.addEventListener("change", () => setEnabled(input.checked));
  setEnabled(enabled);
  return { refreshNow, setEnabled, reset, stop: () => clearInterval(timerId) };
}
function mailPageNumberItems(currentPage, totalPages) {
  if (totalPages <= 10) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  if (currentPage >= totalPages - 3) return [1, 2, 3, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, 2, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages - 1, totalPages];
}
function normalizeCodes(codes) {
  if (Array.isArray(codes)) return codes.map((code) => typeof code === "string" ? code : code?.code).filter(Boolean);
  if (typeof codes === "string") return codes.split(",").map((code) => code.trim()).filter(Boolean);
  return [];
}
function renderCodeChips(codes) {
  const items = normalizeCodes(codes);
  return items.map((code) => '<span class="chip code"><span class="code-label">验证码</span>' + escapeText(code) + '</span>').join("");
}
function renderMetaPill(label, value) {
  return '<span class="mail-meta-pill"><strong>' + escapeText(label) + ':</strong> ' + escapeText(value || "--") + '</span>';
}
function renderMailBodyFromContent(html, text, trusted) {
  if (!html) return '<pre class="mail-body">' + escapeText(text || "暂无正文") + '</pre>';
  const warning = trusted ? "" : '<div class="mail-risk"><strong>外部资源已拦截</strong><span>未检测到可信邮件签名/认证结果。为避免追踪或钓鱼风险，默认不加载外部图片和链接。</span><button type="button" class="secondary" data-load-remote-mail>仍然加载图片和链接</button></div>';
  return warning + mailFrameHtml(html, trusted);
}
function mailFrameHtml(html, allowRemote) {
  const sandbox = allowRemote ? ' sandbox="allow-popups allow-popups-to-escape-sandbox"' : ' sandbox=""';
  return '<iframe class="mail-frame"' + sandbox + ' referrerpolicy="no-referrer" data-mail-html="' + escapeAttribute(html) + '" srcdoc="' + escapeAttribute(buildMailFrameDoc(html, allowRemote)) + '"></iframe>';
}
function buildMailFrameDoc(html, allowRemote) {
  const imgSrc = allowRemote ? "data: blob: cid: https:" : "data: blob: cid:";
  return "<!doctype html><html><head><meta charset=\"utf-8\">" +
    "<meta name=\"referrer\" content=\"no-referrer\">" +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; img-src " + imgSrc + "; style-src 'unsafe-inline'; font-src data:; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none';\">" +
    "<base target=\"_blank\"><style>html,body{margin:0;padding:0;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif;}body{padding:20px;}table{max-width:100%;}img{max-width:100%;height:auto;}</style>" +
    "</head><body>" + sanitizeEmailHtml(html, allowRemote) + "</body></html>";
}
function sanitizeEmailHtml(html, allowRemote) {
  let output = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  if (!allowRemote) {
    output = output
      .replace(/\s(src|srcset)\s*=\s*("https?:[^\"]*"|'https?:[^']*'|https?:[^\s>]+)/gi, "")
      .replace(/\shref\s*=\s*("https?:[^\"]*"|'https?:[^']*'|https?:[^\s>]+)/gi, ' href="#"');
  }
  return output;
}
function bindRemoteMailButtons(rootSelector) {
  const root = rootSelector ? optional(rootSelector) : document;
  if (!root) return;
  root.querySelectorAll("[data-load-remote-mail]").forEach((button) => {
    if (button.dataset.boundRemote === "1") return;
    button.dataset.boundRemote = "1";
    button.addEventListener("click", () => {
      const scope = button.closest(".mail-detail-panel") || root;
      const frame = scope.querySelector(".mail-frame[data-mail-html]");
      if (!frame) return;
      const html = frame.getAttribute("data-mail-html") || "";
      frame.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox");
      frame.setAttribute("srcdoc", buildMailFrameDoc(html, true));
      button.closest(".mail-risk")?.remove();
    });
  });
}
function requestMailFullscreen(selector) {
  const element = optional(selector);
  if (element?.requestFullscreen) element.requestFullscreen().catch(() => null);
}
function togglePlainPanel(panelSelector, button) {
  const panel = optional(panelSelector);
  if (!panel) return;
  const hidden = panel.classList.toggle("hidden");
  if (button) button.textContent = hidden ? "显示纯文本邮件" : "隐藏纯文本邮件";
}
function hasTrustedAuthentication(headersText) {
  const text = authenticationHeaderText(headersText).toLowerCase();
  return /\bdkim\s*=\s*pass\b/.test(text) || /\bdmarc\s*=\s*pass\b/.test(text) || /\barc\s*=\s*pass\b/.test(text);
}
function authenticationHeaderText(headersText) {
  try {
    const headers = JSON.parse(headersText || "[]");
    if (!Array.isArray(headers)) return "";
    return headers
      .filter((header) => /^(authentication-results|arc-authentication-results)$/i.test(header.key || header.originalKey || ""))
      .map((header) => String(header.value || ""))
      .join("\n");
  } catch {
    return headersText || "";
  }
}
function htmlToText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>|<\/div\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'");
}
function cleanEmailBody(value) {
  const lines = String(value || "")
    .replace(/[\u00ad\u034f\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));
  const output = [];
  let skippingForwardHeader = false;
  for (const line of lines) {
    if (/^-+\s*Forwarded message\s*-+$/i.test(line.trim())) { skippingForwardHeader = true; continue; }
    if (skippingForwardHeader && line.trim() === "") { skippingForwardHeader = false; continue; }
    if (skippingForwardHeader && /^(发件人|寄件者|收件人|主题|日期|from|to|subject|date)[:：]/i.test(line.trim())) continue;
    skippingForwardHeader = false;
    if (line.trim() === "" && output.at(-1)?.trim() === "") continue;
    output.push(line);
  }
  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
`;

// src/views/admin-client.ts
function adminScript(section) {
  return COMMON_MAIL_CLIENT_SCRIPT + ADMIN_SCRIPT.replace("__ADMIN_SECTION__", section);
}
__name(adminScript, "adminScript");
var ADMIN_SCRIPT = String.raw`
const state = {
  rules: [],
  links: [],
  emails: [],
  selectedEmailId: null,
  currentQuery: "",
  emailPage: 1,
  emailPageSize: 50,
  emailPagination: null,
  ruleBuilder: null,
  ruleBuilderBound: false,
  ruleBuilderDragging: null,
  ruleBuilderPointerId: null,
  ruleBuilderActiveDropZone: null,
  ruleBuilderDragOffset: null,
  ruleBuilderDropTargetKey: null,
  ruleBuilderPlaceholderSize: null,
  ruleBuilderPendingPointer: null,
  ruleBuilderMoveFrame: 0,
  ruleBuilderJsonDirty: false,
  ruleBuilderCounter: 0
};
const MAIL_AUTO_REFRESH_SECONDS = 60;
const RULE_FIELD_OPTIONS = ["from", "to", "subject", "text", "html", "code"];
const RULE_OPERATOR_OPTIONS = ["contains", "exact", "startsWith", "endsWith", "regex"];
const RULE_FIELD_LABELS = { from: "From", to: "To", subject: "Subject", text: "Text", html: "HTML", code: "Code" };
const RULE_OPERATOR_LABELS = { contains: "包含", exact: "完全相等", startsWith: "开头匹配", endsWith: "结尾匹配", regex: "正则" };
const currentPage = "__ADMIN_SECTION__";
const authLoading = document.querySelector("#auth-loading");
const loginSection = document.querySelector("#login-section");
const appSection = document.querySelector("#app-section");
const loginMessage = document.querySelector("#login-message");
const adminName = document.querySelector("#admin-name");
const logoutButton = document.querySelector("#logout");
let mailRefreshController = null;
let ruleBuilderGhostEl = null;
let ruleBuilderPointerHandle = null;

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}
function showApp(admin) {
  authLoading.classList.add("hidden");
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  logoutButton.classList.remove("hidden");
  adminName.textContent = admin.username;
}
function showLogin() {
  authLoading.classList.add("hidden");
  loginSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  logoutButton.classList.add("hidden");
  adminName.textContent = "";
  stopMailRefreshController();
}

on("#login-form", "submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  loginMessage.className = "muted";
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify(body) });
    showApp(data.admin);
    await loadCurrentPage();
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.className = "danger-text";
  }
});
on("#logout", "click", async () => {
  await api("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => null);
  showLogin();
});
on("#search-form", "submit", async (event) => {
  event.preventDefault();
  await loadEmails(new FormData(event.currentTarget).get("q"), 1);
});
on("#reload-emails", "click", () => refreshAdminEmailsNow());
on("#email-page-prev", "click", () => loadEmails(state.currentQuery, state.emailPage - 1));
on("#email-page-next", "click", () => loadEmails(state.currentQuery, state.emailPage + 1));
on("#email-page-size", "change", async (event) => {
  state.emailPageSize = Number(event.currentTarget.value) || 50;
  await loadEmails(state.currentQuery, 1);
});
on("#open-rule-form", "click", () => openRuleForm());
on("#open-link-form", "click", () => openLinkForm());
on("#upgrade-database", "click", () => upgradeDatabase());
on("#rule-form", "submit", submitRuleForm);
on("#link-form", "submit", submitLinkForm);
on("#rule-builder-add-condition", "click", () => addRuleBuilderChild("condition"));
on("#rule-builder-add-group", "click", () => addRuleBuilderChild("group"));
on("#rule-builder-reset", "click", resetRuleBuilderToDefault);
on("#rule-builder-quick-apply", "click", applyQuickRuleBuilderTemplate);
on("#rule-builder-import", "click", importRuleBuilderJson);
on("#rule-builder-copy-json", "click", copyRuleBuilderJson);
on("#rule-expression-json", "input", () => {
  state.ruleBuilderJsonDirty = true;
  optional("#rule-message").textContent = "JSON 已修改；保存时会自动导入校验。";
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
});

async function loadCurrentPage() {
  if (currentPage === "rules") {
    bindRuleBuilderEvents();
    await loadRules();
  }
  if (currentPage === "share") await Promise.all([loadRules(), loadLinks()]);
  if (currentPage === "database") await loadDatabaseStatus();
  if (currentPage === "mail") {
    ensureMailRefreshController();
    await loadEmails();
  }
}

function ensureMailRefreshController() {
  if (mailRefreshController || currentPage !== "mail") return;
  mailRefreshController = createMailRefreshController({
    inputSelector: "#admin-auto-refresh-toggle",
    labelSelector: "#admin-auto-refresh-label",
    intervalSeconds: MAIL_AUTO_REFRESH_SECONDS,
    refresh: () => loadEmails()
  });
}
function stopMailRefreshController() {
  if (!mailRefreshController) return;
  mailRefreshController.stop();
  mailRefreshController = null;
}
function refreshAdminEmailsNow() {
  if (mailRefreshController) return mailRefreshController.refreshNow();
  return loadEmails();
}

async function submitRuleForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = String(data.get("id") || "");
  let expression;
  try {
    expression = readRuleExpression(form, data);
  } catch (error) {
    optional("#rule-message").textContent = error.message;
    return;
  }
  const body = {
    name: data.get("name"),
    action: data.get("action"),
    keyword: data.get("keyword"),
    keywords: splitRuleKeywords(data.get("keyword")),
    fields: data.getAll("fields"),
    keywordLogic: data.get("keywordLogic"),
    fieldLogic: data.get("fieldLogic"),
    matchMode: data.get("matchMode"),
    caseSensitive: data.has("caseSensitive"),
    enabled: data.has("enabled"),
    expression
  };
  try {
    const path = id ? "/api/admin/rules/" + encodeURIComponent(id) : "/api/admin/rules";
    await api(path, { method: id ? "PATCH" : "POST", body: JSON.stringify(body) });
    optional("#rule-message").textContent = id ? "已更新" : "已保存";
    closeDialog("rule-dialog");
    resetRuleForm();
    await loadRules();
  } catch (error) {
    optional("#rule-message").textContent = error.message;
  }
}
async function submitLinkForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = String(data.get("id") || "");
  const expiresRaw = data.get("expiresAt");
  const body = {
    name: data.get("name"),
    expiresAt: expiresRaw ? new Date(expiresRaw).toISOString() : null,
    ruleIds: data.getAll("ruleIds").map(Number),
    status: data.get("status"),
    allowRuleLogic: data.get("allowRuleLogic"),
    blockRuleLogic: data.get("blockRuleLogic")
  };
  try {
    if (id) {
      await api("/api/admin/share-links/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(body) });
      optional("#link-message").textContent = "已更新";
    } else {
      const result = await api("/api/admin/share-links", { method: "POST", body: JSON.stringify(body) });
      renderGeneratedLink(result.url);
      optional("#link-message").textContent = "已生成";
    }
    closeDialog("link-dialog");
    resetLinkForm();
    await loadLinks();
  } catch (error) {
    optional("#link-message").textContent = error.message;
  }
}

function updateMetrics(emails) {
  const total = optional("#metric-total");
  if (!total) return;
  const pagination = state.emailPagination || fallbackEmailPagination(emails);
  const visiblePage = pagination.total > 0 ? pagination.page : 0;
  total.textContent = String(pagination.total);
  optional("#metric-page-count").textContent = String(emails.length);
  optional("#metric-codes").textContent = String(emails.filter((email) => normalizeCodes(email.codes).length > 0).length);
  optional("#metric-current-page").textContent = String(visiblePage);
  optional("#metric-total-pages").textContent = String(pagination.totalPages);
  renderEmailPageNumbers(pagination);
  const prevButton = optional("#email-page-prev");
  const nextButton = optional("#email-page-next");
  if (prevButton) prevButton.disabled = !pagination.hasPreviousPage;
  if (nextButton) nextButton.disabled = !pagination.hasNextPage;
  const pageSize = optional("#email-page-size");
  if (pageSize) pageSize.value = String(pagination.pageSize);
}
function renderEmailPageNumbers(pagination) {
  const container = optional("#email-page-numbers");
  if (!container) return;
  const totalPages = Number(pagination.totalPages) || 0;
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  const currentPage = Math.min(Math.max(1, Number(pagination.page) || 1), totalPages);
  container.innerHTML = emailPageNumberItems(currentPage, totalPages).map((item) => {
    if (item === "ellipsis") return '<span class="mail-page-ellipsis" aria-hidden="true">…</span>';
    const active = item === currentPage ? " active" : "";
    const disabled = item === currentPage ? " disabled" : "";
    return '<button type="button" class="secondary mail-page-number' + active + '" data-email-page="' + item +
      '" aria-label="第 ' + item + ' 页" aria-current="' + (item === currentPage ? "page" : "false") + '"' + disabled + '>' + item + '</button>';
  }).join("");
  container.querySelectorAll("[data-email-page]").forEach((button) => {
    button.addEventListener("click", () => loadEmails(state.currentQuery, Number(button.dataset.emailPage)));
  });
}
function emailPageNumberItems(currentPage, totalPages) {
  return mailPageNumberItems(currentPage, totalPages);
}
async function loadEmails(q = state.currentQuery, page = state.emailPage) {
  state.currentQuery = String(q || "");
  state.emailPage = Math.max(1, Number(page) || 1);
  const params = new URLSearchParams({
    q: state.currentQuery,
    page: String(state.emailPage),
    pageSize: String(state.emailPageSize)
  });
  const data = await api("/api/admin/emails?" + params.toString());
  state.emails = data.emails;
  state.emailPagination = data.pagination || fallbackEmailPagination(state.emails);
  state.emailPage = state.emailPagination.page;
  state.emailPageSize = state.emailPagination.pageSize;
  updateMetrics(state.emails);
  renderAdminEmailList();
  const nextId = resolveAdminSelectedEmailId();
  if (nextId) await loadEmailDetail(nextId);
  else renderAdminEmptyDetail("暂无邮件");
}
function fallbackEmailPagination(emails) {
  return {
    page: state.emailPage,
    pageSize: state.emailPageSize,
    total: emails.length,
    totalPages: emails.length > 0 ? 1 : 0,
    hasPreviousPage: false,
    hasNextPage: false
  };
}
function resolveAdminSelectedEmailId() {
  if (state.emails.length === 0) return null;
  const selected = state.emails.find((email) => String(email.id) === String(state.selectedEmailId));
  return selected ? selected.id : state.emails[0].id;
}
function renderAdminEmailList() {
  const list = optional("#emails-table");
  if (!list) return;
  list.innerHTML = state.emails.map(renderAdminEmailListItem).join("") || '<div class="empty-state">暂无邮件</div>';
  list.querySelectorAll("[data-id]").forEach((item) => item.addEventListener("click", () => loadEmailDetail(item.dataset.id)));
}
function renderAdminEmailListItem(email) {
  const selected = String(email.id) === String(state.selectedEmailId) ? " selected" : "";
  const sender = email.from_address || email.envelope_from || "--";
  return '<button type="button" class="mail-list-item' + selected + '" data-id="' + email.id + '">' +
    '<strong>' + escapeText(email.subject || "(无主题)") + '</strong>' +
    '<div class="mail-list-tags">' + renderMetaPill("ID", email.id) + renderMetaPill("时间", formatDate(email.received_at)) + '</div>' +
    '<div class="mail-list-tags">' + renderMetaPill("FROM", sender) + '</div>' +
    '<div class="mail-list-tags">' + renderMetaPill("TO", email.envelope_to) + '</div>' +
  '</button>';
}
async function loadEmailDetail(id) {
  const data = await api("/api/admin/emails/" + encodeURIComponent(id));
  const email = data.email;
  const body = cleanEmailBody(email.content.text || htmlToText(email.content.html) || "");
  state.selectedEmailId = String(email.id);
  renderAdminEmailList();
  optional("#email-detail").classList.remove("hidden");
  optional("#email-detail-content").innerHTML = renderAdminEmailDetail(email, body);
  bindAdminDetailActions();
}
function renderAdminEmailDetail(email, body) {
  const codes = renderCodeChips(email.codes) || '<span class="badge muted-badge">无验证码</span>';
  const trusted = hasTrustedAuthentication(email.content.headers || "");
  const attachmentCount = Number(email.attachment_count || email.attachments?.length || 0);
  const attachmentTag = attachmentCount > 0 ? '<span class="badge muted-badge">附件 ' + attachmentCount + '</span>' : "";
  const index = state.emails.findIndex((item) => String(item.id) === String(email.id));
  const prevDisabled = index <= 0 ? " disabled" : "";
  const nextDisabled = index < 0 || index >= state.emails.length - 1 ? " disabled" : "";
  return '<div class="mail-detail-view"><div class="mail-detail-nav">' +
    '<button type="button" class="secondary" data-mail-prev' + prevDisabled + '>‹ 上一封</button>' +
    '<button type="button" class="secondary" data-mail-next' + nextDisabled + '>下一封 ›</button></div>' +
    '<div class="mail-detail-header"><h2>' + escapeText(email.subject || "(无主题)") + '</h2>' +
    '<div class="mail-meta-row">' + renderMetaPill("ID", email.id) + renderMetaPill("时间", formatDate(email.received_at)) +
    renderMetaPill("FROM", email.from_address || email.envelope_from) + renderMetaPill("TO", email.envelope_to) + '</div>' +
    '<div class="mail-action-row">' + attachmentTag + '<button type="button" class="secondary" data-toggle-plain>显示纯文本邮件</button>' +
    '<button type="button" class="secondary" data-mail-fullscreen>全屏</button></div></div>' +
    '<div class="chips">' + codes + '</div><div class="mail-preview-stage">' +
    renderMailBodyFromContent(email.content.html || "", body, trusted) + '</div>' +
    '<pre class="mail-plain-panel hidden">' + escapeText(body || "暂无正文") + '</pre>' +
    '<details class="advanced-info"><summary>高级信息</summary><h3>HTML 原文</h3><pre>' + escapeText(email.content.html || "") +
    '</pre><h3>Headers</h3><pre>' + escapeText(email.content.headers || "") + '</pre><h3>Attachments</h3><pre>' +
    escapeText(JSON.stringify(email.attachments, null, 2)) + '</pre></details></div>';
}
function renderAdminEmptyDetail(message) {
  optional("#email-detail").classList.remove("hidden");
  optional("#email-detail-content").innerHTML = '<div class="mail-empty-detail empty-state">' + escapeText(message) + '</div>';
}
function bindAdminDetailActions() {
  on("[data-mail-prev]", "click", () => navigateAdminEmail(-1));
  on("[data-mail-next]", "click", () => navigateAdminEmail(1));
  on("[data-mail-fullscreen]", "click", () => requestMailFullscreen(".mail-preview-stage"));
  on("[data-toggle-plain]", "click", (event) => togglePlainPanel(".mail-plain-panel", event.currentTarget));
  bindRemoteMailButtons("#email-detail");
}
function navigateAdminEmail(delta) {
  const index = state.emails.findIndex((email) => String(email.id) === String(state.selectedEmailId));
  const target = state.emails[index + delta];
  if (target) loadEmailDetail(target.id);
}

async function loadRules() {
  const data = await api("/api/admin/rules");
  state.rules = data.rules;
  renderRulesTable();
  populateShareRules();
}
function renderRulesTable() {
  const list = optional("#rules-table");
  if (!list) return;
  list.innerHTML = state.rules.map(renderRuleItem).join("") || '<div class="empty-state">暂无规则</div>';
  list.querySelectorAll("[data-edit-rule]").forEach((button) => button.addEventListener("click", () => editRule(Number(button.dataset.editRule))));
  list.querySelectorAll("[data-delete-rule]").forEach((button) => button.addEventListener("click", () => deleteRuleItem(Number(button.dataset.deleteRule))));
}
function renderRuleItem(rule) {
  const status = rule.enabled ? '<span class="badge success">启用</span>' : '<span class="badge muted-badge">停用</span>';
  const type = rule.action === "block" ? '<span class="badge danger-badge">隐藏 / 排除</span>' : '<span class="badge success">允许显示</span>';
  const summary = summarizeRuleExpression(rule.expression || legacyRuleExpression(rule));
  return '<article class="list-item-card">' +
    '<div class="item-main"><div class="item-title-row"><strong>' + escapeText(rule.name) + '</strong><span class="badge muted-badge">#' + rule.id + '</span>' + type + status + '</div>' +
    '<div class="item-meta">' + renderMetaPill("表达式", summary) + renderMetaPill("字段", (rule.fields || []).join(", ")) +
    renderMetaPill("大小写", rule.caseSensitive ? "区分" : "按条件") + '</div></div>' +
    '<div class="item-actions"><button type="button" class="secondary" data-edit-rule="' + rule.id + '">编辑</button>' +
    '<button type="button" class="danger" data-delete-rule="' + rule.id + '">删除</button></div></article>';
}
function openRuleForm() {
  resetRuleForm();
  showDialog("rule-dialog");
}
function resetRuleForm() {
  const form = optional("#rule-form");
  if (!form) return;
  form.reset();
  form.elements.id.value = "";
  form.elements.action.value = "allow";
  form.elements.keywordLogic.value = "any";
  form.elements.fieldLogic.value = "any";
  form.elements.matchMode.value = "contains";
  form.elements.expressionJson.value = "";
  form.elements.enabled.checked = true;
  form.querySelectorAll('input[name="fields"]').forEach((input) => { input.checked = ["subject", "text", "code"].includes(input.value); });
  setRuleBuilderExpression({ op: "condition", field: "subject", operator: "contains", value: "" });
  optional("#rule-form-title").textContent = "添加规则";
  optional("#rule-submit").textContent = "保存规则";
  optional("#rule-message").textContent = "";
}
function editRule(id) {
  const rule = state.rules.find((item) => Number(item.id) === id);
  const form = optional("#rule-form");
  if (!rule || !form) return;
  resetRuleForm();
  form.elements.id.value = rule.id;
  form.elements.name.value = rule.name || "";
  form.elements.action.value = rule.action || "allow";
  form.elements.keyword.value = rule.keyword || "";
  form.elements.matchMode.value = rule.matchMode || "contains";
  form.elements.caseSensitive.checked = Boolean(rule.caseSensitive);
  form.elements.enabled.checked = Boolean(rule.enabled);
  form.elements.expressionJson.value = rule.expression ? JSON.stringify(rule.expression, null, 2) : "";
  form.querySelectorAll('input[name="fields"]').forEach((input) => { input.checked = (rule.fields || []).includes(input.value); });
  setRuleBuilderExpression(rule.expression || legacyRuleExpression(rule));
  optional("#rule-form-title").textContent = "编辑规则";
  optional("#rule-submit").textContent = "保存修改";
  showDialog("rule-dialog");
}
async function deleteRuleItem(id) {
  const rule = state.rules.find((item) => Number(item.id) === id);
  if (!rule || !confirm("确认删除规则“" + rule.name + "”？关联分享链接会同步失去该规则。")) return;
  await api("/api/admin/rules/" + encodeURIComponent(id), { method: "DELETE" });
  await Promise.all([loadRules(), currentPage === "share" ? loadLinks() : Promise.resolve()]);
}
function readRuleExpression(form, data) {
  if (state.ruleBuilderJsonDirty) {
    const textarea = optional("#rule-expression-json");
    const expression = JSON.parse(textarea?.value || "");
    if (!isRawRuleExpressionValid(expression)) throw new Error("高级 JSON 表达式结构无效");
    setRuleBuilderExpression(expression);
    return expression;
  }
  if (state.ruleBuilder) {
    const expression = stripRuleBuilderMetadata(state.ruleBuilder);
    if (isBuilderExpressionValid(expression)) return expression;
    throw new Error("请完善可视化条件组中的字段和值");
  }
  const json = String(data.get("expressionJson") || "").trim();
  if (json) return JSON.parse(json);
  return buildQuickRuleExpression(data);
}
function defaultRuleBuilderExpression() {
  return hydrateRuleBuilderExpression({ op: "and", children: [{ op: "condition", field: "subject", operator: "contains", value: "" }] });
}
function normalizeRuleBuilderRootExpression(expression) {
  const fallback = { op: "condition", field: "subject", operator: "contains", value: "" };
  const source = expression && typeof expression === "object" ? expression : fallback;
  return source.op === "and" || source.op === "or" ? source : { op: "and", children: [source] };
}
function hydrateRuleBuilderExpression(expression) {
  const source = expression && typeof expression === "object" ? expression : { op: "condition", field: "subject", operator: "contains", value: "" };
  const id = nextRuleBuilderId();
  if (source.op === "and" || source.op === "or") {
    const children = Array.isArray(source.children) && source.children.length ? source.children.map(hydrateRuleBuilderExpression) : [hydrateRuleBuilderExpression({ op: "condition", field: "subject", operator: "contains", value: "" })];
    return { id, op: source.op, children };
  }
  if (source.op === "not") {
    return { id, op: "not", child: hydrateRuleBuilderExpression(source.child) };
  }
  return {
    id,
    op: "condition",
    field: RULE_FIELD_OPTIONS.includes(source.field) ? source.field : "subject",
    operator: RULE_OPERATOR_OPTIONS.includes(source.operator) ? source.operator : "contains",
    value: String(source.value || ""),
    caseSensitive: Boolean(source.caseSensitive)
  };
}
function nextRuleBuilderId() {
  state.ruleBuilderCounter += 1;
  return "rb-" + state.ruleBuilderCounter;
}
function setRuleBuilderExpression(expression) {
  state.ruleBuilder = hydrateRuleBuilderExpression(normalizeRuleBuilderRootExpression(expression));
  state.ruleBuilderJsonDirty = false;
  renderRuleBuilder();
}
function stripRuleBuilderMetadata(node) {
  if (!node) return null;
  if (node.op === "condition") {
    return { op: "condition", field: node.field, operator: node.operator, value: String(node.value || "").trim(), caseSensitive: Boolean(node.caseSensitive) };
  }
  if (node.op === "not") return { op: "not", child: stripRuleBuilderMetadata(node.child) };
  return { op: node.op, children: (node.children || []).map(stripRuleBuilderMetadata).filter(Boolean) };
}
function isBuilderExpressionValid(expression) {
  if (!expression || typeof expression !== "object") return false;
  if (expression.op === "condition") return RULE_FIELD_OPTIONS.includes(expression.field) && RULE_OPERATOR_OPTIONS.includes(expression.operator) && String(expression.value || "").trim().length > 0;
  if (expression.op === "not") return isBuilderExpressionValid(expression.child);
  return (expression.op === "and" || expression.op === "or") && Array.isArray(expression.children) && expression.children.length > 0 && expression.children.every(isBuilderExpressionValid);
}
function renderRuleBuilder() {
  const root = optional("#rule-builder-root");
  if (!root) return;
  if (!state.ruleBuilder) state.ruleBuilder = defaultRuleBuilderExpression();
  root.innerHTML = renderRuleBuilderNode(state.ruleBuilder, null, 0, 0);
  syncRuleBuilderJson();
  syncRuleBuilderSummary();
}
function renderRuleBuilderNode(node, parentId, depth, index) {
  if (node.op === "condition") return renderRuleConditionCard(node, parentId, depth, index);
  return renderRuleGroupNode(node, parentId, depth, index);
}
function renderRuleGroupNode(node, parentId, depth, index) {
  const classes = "rule-node rule-node-group rule-node-" + node.op + (depth === 0 ? " root" : " nested");
  return '<div class="' + classes + '" data-builder-node-id="' + escapeAttribute(node.id) + '" data-builder-depth="' + depth + '">' +
    '<div class="rule-group-shell">' +
      '<div class="rule-group-header">' +
        '<div class="rule-group-header-main">' + renderRuleGroupLead(node, parentId) + '</div>' +
        '<div class="rule-group-header-actions">' + renderRuleNodeActions(node, parentId, index) + '</div>' +
      '</div>' +
      renderRuleGroupBody(node, depth) +
    '</div>' +
  '</div>';
}
function renderRuleGroupLead(node, parentId) {
  const canMove = Boolean(parentId);
  const leadIcon = canMove
    ? '<button type="button" class="secondary rule-drag-handle" data-builder-drag-id="' + escapeAttribute(node.id) + '" data-builder-drag-handle="true" aria-label="拖拽移动节点"><span class="rule-grip" aria-hidden="true"></span></button>'
    : '<span class="rule-title-grip" aria-hidden="true"><span class="rule-grip"></span></span><span class="rule-node-caret" aria-hidden="true">⌄</span>';
  if (node.op === "not") {
    return leadIcon + renderRuleNodeKind(node) + '<span class="rule-node-hint">反向匹配子条件</span>';
  }
  const title = node.op === "and" ? "全部满足" : "满足任一条件";
  return leadIcon + '<div class="rule-node-pill-select">' + renderRuleNodeKind(node) + '<select class="rule-inline-select" data-builder-op="' + escapeAttribute(node.id) + '" aria-label="条件组关系">' +
    '<option value="and"' + (node.op === "and" ? ' selected' : '') + '>全部满足</option>' +
    '<option value="or"' + (node.op === "or" ? ' selected' : '') + '>满足任一条件</option></select><span class="rule-group-title">' + title + '</span><span class="rule-title-edit" aria-hidden="true">✎</span></div>';
}
function renderRuleConditionCard(node, parentId, depth, index) {
  const canMove = Boolean(parentId);
  return '<div class="rule-node rule-node-condition-card" data-builder-node-id="' + escapeAttribute(node.id) + '" data-builder-depth="' + depth + '">' +
    '<div class="rule-condition-card">' +
      '<div class="rule-condition-row">' +
        '<div class="rule-condition-leading">' +
          '<button type="button" class="secondary rule-drag-handle" data-builder-drag-id="' + escapeAttribute(node.id) + '" data-builder-drag-handle="true" aria-label="拖拽移动节点"' + (canMove ? '' : ' disabled') + '><span class="rule-grip" aria-hidden="true"></span></button>' +
        '</div>' +
        '<div class="rule-condition-fields">' + renderRuleConditionFields(node) + '</div>' +
        '<div class="rule-condition-actions">' + renderRuleNodeActions(node, parentId, index) + '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}
function renderRuleConditionFields(node) {
  return '<label class="rule-field-cell"><span>字段</span><span class="rule-select-shell rule-field-select-shell"><span class="rule-field-icon rule-field-icon-' + escapeAttribute(node.field) + '">' + ruleFieldIcon(node.field) + '</span><select data-builder-field="' + escapeAttribute(node.id) + '">' + ruleOptions(RULE_FIELD_OPTIONS, node.field, RULE_FIELD_LABELS) + '</select></span></label>' +
    '<label class="rule-field-cell"><span>方式</span><span class="rule-select-shell"><select data-builder-operator="' + escapeAttribute(node.id) + '">' + ruleOptions(RULE_OPERATOR_OPTIONS, node.operator, RULE_OPERATOR_LABELS) + '</select></span></label>' +
    '<label class="rule-field-cell rule-value-cell"><span>值</span><input data-builder-value="' + escapeAttribute(node.id) + '" value="' + escapeAttribute(node.value || '') + '" placeholder="' + escapeAttribute(ruleValuePlaceholder(node)) + '"></label>' +
    '<div class="rule-field-cell rule-field-checkbox"><span>&nbsp;</span><label class="checkbox-pill rule-case-toggle"><input type="checkbox" data-builder-case="' + escapeAttribute(node.id) + '"' + (node.caseSensitive ? ' checked' : '') + '> 区分大小写</label></div>';
}
function ruleFieldIcon(field) {
  if (field === "from" || field === "to") return "✉";
  if (field === "code") return "#";
  if (field === "html") return "&lt;/&gt;";
  return "T";
}
function ruleValuePlaceholder(node) {
  if (node.operator === "regex") return "输入正则表达式";
  if (node.field === "from" || node.field === "to") return "输入邮箱地址或域名";
  if (node.field === "code") return "输入验证码";
  return node.operator === "exact" ? "输入完整匹配内容" : "输入关键词、地址、验证码或正则";
}
function renderRuleNodeKind(node) {
  const kind = node.op === "and" ? "AND" : node.op === "or" ? "OR" : node.op === "not" ? "NOT" : "条件";
  const className = node.op === "or" ? " rule-node-kind-or" : node.op === "not" ? " rule-node-kind-not" : node.op === "condition" ? " rule-node-kind-condition" : "";
  return '<span class="rule-node-kind' + className + '">' + escapeText(kind) + '</span>';
}
function renderRuleNodeActions(node, parentId, index) {
  const canMove = Boolean(parentId);
  const toggleLabel = node.op === 'not' ? '取消 NOT' : '取反';
  const groupAdds = node.op === "and" || node.op === "or"
    ? '<button type="button" class="secondary rule-action-primary" data-builder-add-condition="' + escapeAttribute(node.id) + '">＋ 添加条件</button>' +
      '<button type="button" class="secondary rule-action-primary" data-builder-add-group="' + escapeAttribute(node.id) + '">＋ 添加规则组</button>'
    : '';
  const moveActions = canMove
    ? '<button type="button" class="secondary" data-builder-move="up" data-builder-move-id="' + escapeAttribute(node.id) + '">↑ 上移</button>' +
      '<button type="button" class="secondary" data-builder-move="down" data-builder-move-id="' + escapeAttribute(node.id) + '">↓ 下移</button>' +
      '<button type="button" class="danger" data-builder-delete="' + escapeAttribute(node.id) + '">删除</button>'
    : '<button type="button" class="secondary rule-more-button" data-builder-reset="true" aria-label="重置条件组" title="重置条件组">…</button>';
  return groupAdds +
    '<button type="button" class="secondary" data-builder-duplicate="' + escapeAttribute(node.id) + '">复制</button>' +
    '<button type="button" class="secondary" data-builder-toggle-not="' + escapeAttribute(node.id) + '">' + toggleLabel + '</button>' +
    moveActions;
}
function renderRuleGroupBody(node, depth) {
  const children = node.op === 'not' ? [node.child] : (node.children || []);
  let html = '<div class="rule-node-children" data-builder-group="' + escapeAttribute(node.id) + '">';
  children.forEach((child, index) => {
    if (node.op !== 'not') html += renderDropZone(node.id, index);
    html += renderRuleBuilderNode(child, node.op === 'not' ? null : node.id, depth + 1, index);
  });
  if (node.op !== 'not') html += renderDropZone(node.id, children.length);
  if (node.op !== 'not') html += renderRuleGroupAddZone(node.id, children.length);
  html += '</div>';
  return html;
}
function renderRuleGroupAddZone(groupId, index) {
  return '<div class="rule-add-drop-zone" data-builder-drop-parent="' + escapeAttribute(groupId) + '" data-builder-drop-index="' + index + '" aria-label="拖放或在此条件组底部添加节点">' +
    '<span class="rule-add-drop-zone-title">拖到这里，或继续添加</span>' +
    '<div class="rule-add-drop-zone-actions">' +
      '<button type="button" class="secondary" data-builder-add-condition="' + escapeAttribute(groupId) + '">＋ 添加条件</button>' +
      '<button type="button" class="secondary" data-builder-add-group="' + escapeAttribute(groupId) + '">＋ 添加规则组</button>' +
    '</div>' +
  '</div>';
}
function renderDropZone(parentId, index) {
  return '<div class="rule-drop-zone" data-builder-drop-parent="' + escapeAttribute(parentId) + '" data-builder-drop-index="' + index + '" aria-label="拖放到此位置"><span>插入位置</span></div>';
}
function ruleOptions(values, selected, labels) {
  return values.map((value) => '<option value="' + escapeAttribute(value) + '"' + (value === selected ? ' selected' : '') + '>' + escapeText(labels[value] || value) + '</option>').join('');
}
function bindRuleBuilderEvents() {
  const root = optional("#rule-builder-root");
  if (!root || state.ruleBuilderBound) return;
  state.ruleBuilderBound = true;
  root.addEventListener("input", handleRuleBuilderInput);
  root.addEventListener("change", handleRuleBuilderInput);
  root.addEventListener("click", handleRuleBuilderClick);
  root.addEventListener("pointerdown", handleRuleBuilderPointerDown);
  root.addEventListener("lostpointercapture", handleRuleBuilderLostPointerCapture, true);
  document.addEventListener("pointermove", handleRuleBuilderPointerMove);
  document.addEventListener("pointerup", handleRuleBuilderPointerUp);
  document.addEventListener("pointercancel", handleRuleBuilderPointerCancel);
}
function handleRuleBuilderInput(event) {
  const target = event.target;
  const id = target.dataset.builderField || target.dataset.builderOperator || target.dataset.builderValue || target.dataset.builderCase || target.dataset.builderOp;
  if (!id) return;
  const node = findRuleBuilderNode(state.ruleBuilder, id);
  if (!node) return;
  let shouldRender = false;
  if (target.dataset.builderField) {
    node.field = target.value;
    shouldRender = true;
  }
  if (target.dataset.builderOperator) {
    node.operator = target.value;
    shouldRender = true;
  }
  if (target.dataset.builderValue) node.value = target.value;
  if (target.dataset.builderCase) node.caseSensitive = target.checked;
  if (target.dataset.builderOp && (target.value === "and" || target.value === "or")) {
    node.op = target.value;
    shouldRender = true;
  }
  if (shouldRender) return renderRuleBuilder();
  syncRuleBuilderJson();
}
function handleRuleBuilderClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.builderAddCondition) addRuleBuilderChild("condition", target.dataset.builderAddCondition);
  if (target.dataset.builderAddGroup) addRuleBuilderChild("group", target.dataset.builderAddGroup);
  if (target.dataset.builderToggleNot) toggleRuleBuilderNot(target.dataset.builderToggleNot);
  if (target.dataset.builderDelete) deleteRuleBuilderNode(target.dataset.builderDelete);
  if (target.dataset.builderDuplicate) duplicateRuleBuilderNode(target.dataset.builderDuplicate);
  if (target.dataset.builderMove) moveRuleBuilderSibling(target.dataset.builderMoveId, target.dataset.builderMove);
  if (target.dataset.builderReset) resetRuleBuilderToDefault();
}
function handleRuleBuilderPointerDown(event) {
  const handle = event.target.closest("[data-builder-drag-id]");
  if (!handle || handle.disabled || event.button !== 0 || state.ruleBuilderDragging) return;
  event.preventDefault();
  state.ruleBuilderDragging = handle.dataset.builderDragId;
  state.ruleBuilderPointerId = event.pointerId;
  state.ruleBuilderDropTargetKey = null;
  ruleBuilderPointerHandle = handle;
  try { handle.setPointerCapture(event.pointerId); } catch (error) {}
  const root = optional("#rule-builder-root");
  root?.classList.add("is-pointer-dragging");
  const sourceNode = handle.closest("[data-builder-node-id]");
  state.ruleBuilderDragOffset = getRuleBuilderDragOffset(sourceNode, event.clientX, event.clientY);
  state.ruleBuilderPlaceholderSize = getRuleBuilderPlaceholderSize(sourceNode);
  sourceNode?.classList.add("is-dragging-source", "rule-drag-placeholder");
  createRuleBuilderGhost(state.ruleBuilderDragging, event.clientX, event.clientY, sourceNode);
  syncRuleBuilderActiveZone(resolveRuleBuilderDropZone(event.clientX, event.clientY));
  optional("#rule-message").textContent = "拖动中：卡片将跟随指针移动，松开后完成排序";
}
function handleRuleBuilderPointerMove(event) {
  if (!state.ruleBuilderDragging || event.pointerId !== state.ruleBuilderPointerId) return;
  event.preventDefault();
  state.ruleBuilderPendingPointer = { x: event.clientX, y: event.clientY };
  if (state.ruleBuilderMoveFrame) return;
  state.ruleBuilderMoveFrame = requestAnimationFrame(processRuleBuilderPointerMove);
}
function processRuleBuilderPointerMove() {
  state.ruleBuilderMoveFrame = 0;
  const point = state.ruleBuilderPendingPointer;
  if (!point || !state.ruleBuilderDragging) return;
  updateRuleBuilderGhostPosition(point.x, point.y);
  syncRuleBuilderActiveZone(resolveRuleBuilderDropZone(point.x, point.y));
}
function flushRuleBuilderPointerMove() {
  if (state.ruleBuilderMoveFrame) cancelAnimationFrame(state.ruleBuilderMoveFrame);
  state.ruleBuilderMoveFrame = 0;
  processRuleBuilderPointerMove();
}
function handleRuleBuilderPointerUp(event) {
  if (!state.ruleBuilderDragging || event.pointerId !== state.ruleBuilderPointerId) return;
  flushRuleBuilderPointerMove();
  const zone = state.ruleBuilderActiveDropZone;
  const moved = zone
    ? moveRuleBuilderNode(state.ruleBuilderDragging, zone.dataset.builderDropParent, Number(zone.dataset.builderDropIndex))
    : false;
  optional("#rule-message").textContent = moved ? "已完成拖拽排序" : zone ? "无法移动到该位置" : "已取消拖拽";
  clearRuleBuilderDropState();
}
function handleRuleBuilderPointerCancel(event) {
  if (!state.ruleBuilderDragging || event.pointerId !== state.ruleBuilderPointerId) return;
  clearRuleBuilderDropState();
}
function handleRuleBuilderLostPointerCapture(event) {
  if (!state.ruleBuilderDragging) return;
  if (event.target !== ruleBuilderPointerHandle) return;
  clearRuleBuilderDropState();
}
function cssEscapeAttribute(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function resolveRuleBuilderDropZone(x, y) {
  const hits = getRuleBuilderPointHits(x, y);
  return resolveRuleBuilderDirectDropZone(hits) ||
    resolveRuleBuilderNodeDropZone(hits, y) ||
    resolveRuleBuilderGroupEndDropZone(hits, y);
}
function getRuleBuilderPointHits(x, y) {
  return typeof document.elementsFromPoint === "function" ? document.elementsFromPoint(x, y) : [document.elementFromPoint(x, y)];
}
function resolveRuleBuilderDirectDropZone(hits) {
  for (const hit of hits) {
    const zone = hit?.closest?.("[data-builder-drop-parent]");
    if (zone) return zone;
  }
  return null;
}
function resolveRuleBuilderNodeDropZone(hits, y) {
  for (const hit of hits) {
    const nodeElement = hit?.closest?.("#rule-builder-root [data-builder-node-id]");
    const nodeId = nodeElement?.dataset?.builderNodeId;
    const found = nodeId ? findRuleBuilderParent(state.ruleBuilder, nodeId) : null;
    if (!found || !Array.isArray(found.parent.children)) continue;
    const rect = nodeElement.getBoundingClientRect();
    const index = found.index + (y > rect.top + rect.height / 2 ? 1 : 0);
    const zone = findRuleBuilderDropZone(found.parent.id, index);
    if (zone) return zone;
  }
  return null;
}
function resolveRuleBuilderGroupEndDropZone(hits, y) {
  for (const hit of hits) {
    const groupElement = hit?.closest?.("#rule-builder-root [data-builder-group]");
    const groupId = groupElement?.dataset?.builderGroup;
    const group = groupId ? findRuleBuilderNode(state.ruleBuilder, groupId) : null;
    if (!group || (group.op !== "and" && group.op !== "or")) continue;
    const rect = groupElement.getBoundingClientRect();
    if (y < rect.top + rect.height * 0.45) continue;
    const zone = findRuleBuilderDropZone(group.id, group.children.length);
    if (zone) return zone;
  }
  return null;
}
function findRuleBuilderDropZone(parentId, index) {
  return document.querySelector('[data-builder-drop-parent="' + cssEscapeAttribute(parentId) + '"][data-builder-drop-index="' + index + '"]');
}
function ruleBuilderDropZoneKey(zone) {
  return zone ? zone.dataset.builderDropParent + ":" + zone.dataset.builderDropIndex : null;
}
function syncRuleBuilderActiveZone(zone) {
  const key = ruleBuilderDropZoneKey(zone);
  if (state.ruleBuilderActiveDropZone === zone && state.ruleBuilderDropTargetKey === key) return;
  if (state.ruleBuilderActiveDropZone) {
    state.ruleBuilderActiveDropZone.classList.remove("active");
    state.ruleBuilderActiveDropZone.style.removeProperty("--rule-placeholder-height");
  }
  state.ruleBuilderActiveDropZone = zone || null;
  state.ruleBuilderDropTargetKey = key;
  if (state.ruleBuilderActiveDropZone) {
    state.ruleBuilderActiveDropZone.classList.add("active");
    const size = state.ruleBuilderPlaceholderSize;
    if (size?.height) state.ruleBuilderActiveDropZone.style.setProperty("--rule-placeholder-height", size.height + "px");
  }
}
function createRuleBuilderGhost(sourceId, x, y, sourceElement) {
  const node = findRuleBuilderNode(state.ruleBuilder, sourceId);
  if (!node) return;
  ensureRuleBuilderGhostHost(sourceElement);
  ruleBuilderGhostEl.className = "rule-drag-ghost" + (sourceElement ? " rule-drag-ghost-card" : "");
  if (sourceElement) renderRuleBuilderGhostCard(sourceElement);
  else ruleBuilderGhostEl.innerHTML = '<div class="rule-drag-ghost-title">' + renderRuleNodeKind(node) + '<span>' + escapeText(ruleBuilderGhostTitle(node)) + '</span></div><div class="rule-drag-ghost-body">' + escapeText(ruleBuilderGhostBody(node)) + '</div>';
  updateRuleBuilderGhostPosition(x, y);
}
function ensureRuleBuilderGhostHost(sourceElement) {
  const host = getRuleBuilderGhostHost(sourceElement);
  if (!ruleBuilderGhostEl) ruleBuilderGhostEl = document.createElement("div");
  if (ruleBuilderGhostEl.parentElement !== host) host.appendChild(ruleBuilderGhostEl);
}
function getRuleBuilderGhostHost(sourceElement) {
  return sourceElement?.closest?.("#rule-dialog") || sourceElement?.closest?.("dialog") || document.body;
}
function renderRuleBuilderGhostCard(sourceElement) {
  const rect = sourceElement.getBoundingClientRect();
  const clone = sourceElement.cloneNode(true);
  clone.classList.remove("is-dragging-source", "rule-drag-placeholder");
  clone.querySelectorAll("[id]").forEach((item) => item.removeAttribute("id"));
  clone.querySelectorAll("button, input, select, textarea").forEach((item) => item.setAttribute("tabindex", "-1"));
  ruleBuilderGhostEl.style.width = Math.min(rect.width, window.innerWidth - 32) + "px";
  ruleBuilderGhostEl.innerHTML = "";
  ruleBuilderGhostEl.appendChild(clone);
}
function getRuleBuilderDragOffset(sourceElement, x, y) {
  if (!sourceElement) return { x: -18, y: -18 };
  const rect = sourceElement.getBoundingClientRect();
  return { x: x - rect.left, y: y - rect.top };
}
function getRuleBuilderPlaceholderSize(sourceElement) {
  if (!sourceElement) return null;
  const rect = sourceElement.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}
function updateRuleBuilderGhostPosition(x, y) {
  if (!ruleBuilderGhostEl) return;
  const offset = state.ruleBuilderDragOffset || { x: -18, y: -18 };
  ruleBuilderGhostEl.style.transform = 'translate(' + (x - offset.x) + 'px,' + (y - offset.y) + 'px)';
}
function ruleBuilderGhostTitle(node) {
  if (node.op === "condition") return "条件节点";
  if (node.op === "not") return "NOT 分组";
  return node.op.toUpperCase() + " 分组";
}
function ruleBuilderGhostBody(node) {
  if (node.op === "condition") return (RULE_FIELD_LABELS[node.field] || node.field) + ' ' + (RULE_OPERATOR_LABELS[node.operator] || node.operator) + ' ' + String(node.value || '');
  if (node.op === "not") return '反向匹配：' + summarizeRuleExpression(stripRuleBuilderMetadata(node.child));
  return '包含 ' + String((node.children || []).length) + ' 个子节点';
}
function clearRuleBuilderDropState() {
  const pointerId = state.ruleBuilderPointerId;
  state.ruleBuilderDragging = null;
  state.ruleBuilderPointerId = null;
  state.ruleBuilderDragOffset = null;
  state.ruleBuilderDropTargetKey = null;
  state.ruleBuilderPlaceholderSize = null;
  state.ruleBuilderPendingPointer = null;
  if (state.ruleBuilderMoveFrame) cancelAnimationFrame(state.ruleBuilderMoveFrame);
  state.ruleBuilderMoveFrame = 0;
  syncRuleBuilderActiveZone(null);
  document.querySelectorAll(".rule-node.is-dragging-source").forEach((node) => node.classList.remove("is-dragging-source", "rule-drag-placeholder"));
  optional("#rule-builder-root")?.classList.remove("is-pointer-dragging");
  if (ruleBuilderGhostEl) {
    ruleBuilderGhostEl.remove();
    ruleBuilderGhostEl = null;
  }
  if (ruleBuilderPointerHandle && pointerId !== null) {
    try { ruleBuilderPointerHandle.releasePointerCapture(pointerId); } catch (error) {}
  }
  ruleBuilderPointerHandle = null;
}
function addRuleBuilderChild(kind, parentId) {
  ensureRuleBuilderGroupRoot();
  const parent = findRuleBuilderNode(state.ruleBuilder, parentId || state.ruleBuilder.id);
  if (!parent || (parent.op !== "and" && parent.op !== "or")) return;
  parent.children.push(kind === "group" ? hydrateRuleBuilderExpression({ op: "and", children: [{ op: "condition", field: "subject", operator: "contains", value: "" }] }) : hydrateRuleBuilderExpression({ op: "condition", field: "subject", operator: "contains", value: "" }));
  renderRuleBuilder();
}
function ensureRuleBuilderGroupRoot() {
  if (!state.ruleBuilder) state.ruleBuilder = defaultRuleBuilderExpression();
  if (state.ruleBuilder.op !== "and" && state.ruleBuilder.op !== "or") {
    state.ruleBuilder = { id: nextRuleBuilderId(), op: "and", children: [state.ruleBuilder] };
  }
}
function toggleRuleBuilderNot(id) {
  const node = findRuleBuilderNode(state.ruleBuilder, id);
  if (!node) return;
  if (node.op === "not") replaceRuleBuilderNode(id, node.child);
  else replaceRuleBuilderNode(id, { id: nextRuleBuilderId(), op: "not", child: cloneRuleBuilderNode(node) });
  renderRuleBuilder();
}
function deleteRuleBuilderNode(id) {
  if (!id || state.ruleBuilder?.id === id) return;
  detachRuleBuilderNode(state.ruleBuilder, id);
  renderRuleBuilder();
}
function moveRuleBuilderSibling(id, direction) {
  const found = findRuleBuilderParent(state.ruleBuilder, id);
  if (!found || !Array.isArray(found.parent.children)) return;
  const nextIndex = found.index + (direction === "up" ? -1 : 1);
  if (nextIndex < 0 || nextIndex >= found.parent.children.length) return;
  const list = found.parent.children;
  const item = list.splice(found.index, 1)[0];
  list.splice(nextIndex, 0, item);
  renderRuleBuilder();
}
function moveRuleBuilderNode(sourceId, parentId, index) {
  if (!sourceId || !parentId || sourceId === state.ruleBuilder?.id || sourceId === parentId || isRuleBuilderDescendant(sourceId, parentId)) return false;
  const parent = findRuleBuilderNode(state.ruleBuilder, parentId);
  if (!parent || (parent.op !== "and" && parent.op !== "or")) return false;
  const oldParent = findRuleBuilderParent(state.ruleBuilder, sourceId);
  if (!oldParent || oldParent.parent.op === "not") return false;
  let targetIndex = Number.isFinite(index) ? index : parent.children.length;
  if (oldParent.parent.id === parent.id && oldParent.index < targetIndex) targetIndex -= 1;
  const currentParent = parent;
  const currentLength = currentParent.children.length;
  const safeIndex = Math.max(0, Math.min(targetIndex, currentLength));
  if (oldParent.parent.id === currentParent.id && oldParent.index === safeIndex) return false;
  const detached = detachRuleBuilderNode(state.ruleBuilder, sourceId);
  if (!detached) return false;
  const insertIndex = Math.max(0, Math.min(safeIndex, currentParent.children.length));
  currentParent.children.splice(insertIndex, 0, detached);
  renderRuleBuilder();
  return true;
}
function findRuleBuilderNode(node, id) {
  if (!node || !id) return null;
  if (node.id === id) return node;
  if (node.op === "not") return findRuleBuilderNode(node.child, id);
  if (node.children) {
    for (const child of node.children) {
      const found = findRuleBuilderNode(child, id);
      if (found) return found;
    }
  }
  return null;
}
function findRuleBuilderParent(node, id) {
  if (!node || !id) return null;
  if (node.op === "not" && node.child?.id === id) return { parent: node, index: 0 };
  if (node.children) {
    const index = node.children.findIndex((child) => child.id === id);
    if (index >= 0) return { parent: node, index };
    for (const child of node.children) {
      const found = findRuleBuilderParent(child, id);
      if (found) return found;
    }
  }
  if (node.op === "not") return findRuleBuilderParent(node.child, id);
  return null;
}
function replaceRuleBuilderNode(id, replacement) {
  if (state.ruleBuilder?.id === id) {
    state.ruleBuilder = replacement;
    return true;
  }
  const found = findRuleBuilderParent(state.ruleBuilder, id);
  if (!found) return false;
  if (found.parent.op === "not") found.parent.child = replacement;
  else found.parent.children[found.index] = replacement;
  return true;
}
function detachRuleBuilderNode(node, id) {
  const found = findRuleBuilderParent(node, id);
  if (!found || found.parent.op === "not") return null;
  return found.parent.children.splice(found.index, 1)[0];
}
function isRuleBuilderDescendant(sourceId, possibleDescendantId) {
  const source = findRuleBuilderNode(state.ruleBuilder, sourceId);
  return Boolean(source && findRuleBuilderNode(source, possibleDescendantId));
}
function cloneRuleBuilderNode(node) {
  return hydrateRuleBuilderExpression(stripRuleBuilderMetadata(node));
}
function duplicateRuleBuilderNode(id) {
  if (state.ruleBuilder?.id === id) {
    const cloned = cloneRuleBuilderNode(state.ruleBuilder);
    state.ruleBuilder = hydrateRuleBuilderExpression({ op: "and", children: [stripRuleBuilderMetadata(state.ruleBuilder), stripRuleBuilderMetadata(cloned)] });
    renderRuleBuilder();
    return;
  }
  const found = findRuleBuilderParent(state.ruleBuilder, id);
  if (!found || found.parent.op === "not") return;
  found.parent.children.splice(found.index + 1, 0, cloneRuleBuilderNode(found.parent.children[found.index]));
  renderRuleBuilder();
}
function resetRuleBuilderToDefault() {
  setRuleBuilderExpression({ op: "condition", field: "subject", operator: "contains", value: "" });
  optional("#rule-message").textContent = "已重置可视化条件组";
}
function syncRuleBuilderJson() {
  const textarea = optional("#rule-expression-json");
  if (!textarea || !state.ruleBuilder) return;
  textarea.value = JSON.stringify(stripRuleBuilderMetadata(state.ruleBuilder), null, 2);
  state.ruleBuilderJsonDirty = false;
  syncRuleBuilderSummary();
}
function syncRuleBuilderSummary() {
  const summary = optional("#rule-builder-summary");
  if (!summary || !state.ruleBuilder) return;
  const expression = stripRuleBuilderMetadata(state.ruleBuilder);
  const valid = isBuilderExpressionValid(expression);
  summary.textContent = valid ? "当前表达式：" + summarizeRuleExpression(expression) : "当前表达式未完善：请补全字段和值";
  summary.classList.toggle("invalid", !valid);
}
function importRuleBuilderJson() {
  const textarea = optional("#rule-expression-json");
  if (!textarea) return;
  try {
    const expression = JSON.parse(textarea.value);
    if (!isRawRuleExpressionValid(expression)) throw new Error("表达式结构无效");
    setRuleBuilderExpression(expression);
    optional("#rule-message").textContent = "已导入 JSON";
  } catch (error) {
    optional("#rule-message").textContent = "JSON 格式错误：" + error.message;
  }
}
function isRawRuleExpressionValid(expression) {
  if (!expression || typeof expression !== "object") return false;
  if (expression.op === "condition") {
    return RULE_FIELD_OPTIONS.includes(expression.field) && RULE_OPERATOR_OPTIONS.includes(expression.operator) && String(expression.value || "").trim().length > 0;
  }
  if (expression.op === "not") return isRawRuleExpressionValid(expression.child);
  if (expression.op !== "and" && expression.op !== "or") return false;
  return Array.isArray(expression.children) && expression.children.length > 0 && expression.children.every(isRawRuleExpressionValid);
}
async function copyRuleBuilderJson() {
  const textarea = optional("#rule-expression-json");
  if (!textarea) return;
  await copyShareText(textarea.value);
}
function applyQuickRuleBuilderTemplate() {
  const form = optional("#rule-form");
  if (!form) return;
  try {
    setRuleBuilderExpression(buildQuickRuleExpression(new FormData(form)));
    optional("#rule-message").textContent = "已应用批量条件";
  } catch (error) {
    optional("#rule-message").textContent = error.message;
  }
}
function buildQuickRuleExpression(data) {
  const keywords = splitRuleKeywords(data.get("keyword"));
  const fields = data.getAll("fields");
  if (keywords.length === 0 || fields.length === 0) throw new Error("请至少填写一个关键词并选择一个字段");
  const operator = String(data.get("matchMode") || "contains");
  const caseSensitive = data.has("caseSensitive");
  const keywordLogic = data.get("keywordLogic") === "all" ? "and" : "or";
  const fieldLogic = data.get("fieldLogic") === "all" ? "and" : "or";
  return groupExpression(keywordLogic, keywords.map((value) => groupExpression(fieldLogic, fields.map((field) => ({ op: "condition", field, operator, value, caseSensitive })))));
}
function splitRuleKeywords(value) {
  return String(value || "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean).filter((item, index, list) => list.indexOf(item) === index);
}
function groupExpression(op, children) {
  return children.length === 1 ? children[0] : { op, children };
}
function legacyRuleExpression(rule) {
  const keywords = splitRuleKeywords(rule.keyword);
  const fields = rule.fields || [];
  const operator = rule.matchMode || "contains";
  return groupExpression("or", keywords.flatMap((value) => fields.map((field) => ({ op: "condition", field, operator, value, caseSensitive: Boolean(rule.caseSensitive) }))));
}
function summarizeRuleExpression(expression) {
  if (!expression) return "-";
  if (expression.op === "condition") return expression.field + " " + expression.operator + " " + expression.value;
  if (expression.op === "not") return "NOT (" + summarizeRuleExpression(expression.child) + ")";
  const joined = (expression.children || []).slice(0, 3).map(summarizeRuleExpression).join(" " + expression.op.toUpperCase() + " ");
  return (expression.children || []).length > 3 ? joined + " ..." : joined;
}
function renderShareRuleOption(rule, selected) {
  const id = String(rule.id);
  const type = rule.action === "block" ? "黑" : "白";
  const label = "[" + type + "] " + rule.name + (rule.enabled ? "" : "（停用）");
  return '<option value="' + escapeAttribute(id) + '"' + (selected.has(id) ? " selected" : "") + '>' + escapeText(label) + '</option>';
}

async function loadLinks() {
  const data = await api("/api/admin/share-links");
  state.links = data.links;
  renderLinksTable();
}
function renderLinksTable() {
  const list = optional("#links-table");
  if (!list) return;
  list.innerHTML = state.links.map(renderLinkItem).join("") || '<div class="empty-state">暂无链接</div>';
  list.querySelectorAll("[data-edit-link]").forEach((button) => button.addEventListener("click", () => editLink(Number(button.dataset.editLink))));
  list.querySelectorAll("[data-copy-link]").forEach((button) => button.addEventListener("click", () => copyShareLink(Number(button.dataset.copyLink))));
  list.querySelectorAll("[data-reset-link]").forEach((button) => button.addEventListener("click", () => resetShareLink(Number(button.dataset.resetLink))));
  list.querySelectorAll("[data-delete-link]").forEach((button) => button.addEventListener("click", () => deleteLinkItem(Number(button.dataset.deleteLink))));
}
function renderLinkItem(link) {
  const status = link.status === "active" ? '<span class="badge success">active</span>' : '<span class="badge muted-badge">disabled</span>';
  const copyHint = link.url ? "复制链接" : "旧链接缺少明文 token，请先重置链接";
  const allowLogic = link.allowRuleLogic === "and" ? "允许全部命中" : "允许任一命中";
  const blockLogic = link.blockRuleLogic === "and" ? "排除全部命中" : "排除任一命中";
  return '<article class="list-item-card">' +
    '<div class="item-main"><div class="item-title-row"><strong>' + escapeText(link.name || "未命名") + '</strong><span class="badge muted-badge">#' + link.id + '</span>' + status + '</div>' +
    '<div class="item-meta">' + renderMetaPill("规则", link.ruleIds.join(", ") || "无") + renderMetaPill("过期", formatDate(link.expires_at)) +
    renderMetaPill("规则关系", allowLogic + " / " + blockLogic) + renderMetaPill("窗口", String(link.window_minutes || 30) + " 分钟") +
    renderMetaPill("最近访问", formatDate(link.last_accessed_at)) + '</div></div>' +
    '<div class="item-actions"><button type="button" class="secondary" data-edit-link="' + link.id + '">编辑</button>' +
    '<button type="button" class="secondary" title="' + escapeAttribute(copyHint) + '" data-copy-link="' + link.id + '">复制</button>' +
    '<button type="button" class="secondary" data-reset-link="' + link.id + '">重置链接</button>' +
    '<button type="button" class="danger" data-delete-link="' + link.id + '">删除</button></div></article>';
}
function openLinkForm() {
  resetLinkForm();
  populateShareRules();
  showDialog("link-dialog");
}
function resetLinkForm() {
  const form = optional("#link-form");
  if (!form) return;
  form.reset();
  form.elements.id.value = "";
  form.elements.status.value = "active";
  form.elements.allowRuleLogic.value = "or";
  form.elements.blockRuleLogic.value = "or";
  populateShareRules();
  optional("#link-form-title").textContent = "添加分享链接";
  optional("#link-submit").textContent = "生成链接";
  optional("#link-message").textContent = "";
}
function editLink(id) {
  const link = state.links.find((item) => Number(item.id) === id);
  const form = optional("#link-form");
  if (!link || !form) return;
  resetLinkForm();
  form.elements.id.value = link.id;
  form.elements.name.value = link.name || "";
  form.elements.expiresAt.value = toDatetimeLocal(link.expires_at);
  form.elements.status.value = link.status || "active";
  form.elements.allowRuleLogic.value = link.allowRuleLogic || "or";
  form.elements.blockRuleLogic.value = link.blockRuleLogic || "or";
  populateShareRules(link.ruleIds);
  optional("#link-form-title").textContent = "编辑分享链接";
  optional("#link-submit").textContent = "保存修改";
  showDialog("link-dialog");
}
async function copyShareLink(id) {
  const link = state.links.find((item) => Number(item.id) === id);
  if (!link) return;
  if (!link.url) {
    showUiMessage("旧链接缺少明文 token，请点击“重置链接”后再复制。", "error");
    return;
  }
  await copyShareText(link.url);
}
async function resetShareLink(id) {
  const link = state.links.find((item) => Number(item.id) === id);
  if (!link || !confirm("重置后旧访问链接将失效，确认重置“" + (link.name || "未命名") + "”？")) return;
  const result = await api("/api/admin/share-links/" + encodeURIComponent(id) + "/reset", { method: "POST", body: "{}" });
  renderGeneratedLink(result.url, "重置后新链接：");
  optional("#link-message").textContent = "已重置链接";
  await loadLinks();
}
async function deleteLinkItem(id) {
  const link = state.links.find((item) => Number(item.id) === id);
  if (!link || !confirm("确认删除分享链接“" + (link.name || "未命名") + "”？")) return;
  await api("/api/admin/share-links/" + encodeURIComponent(id), { method: "DELETE" });
  await loadLinks();
}
function populateShareRules(selectedIds = []) {
  const select = optional("#share-rules");
  if (!select) return;
  const selected = new Set(selectedIds.map(String));
  const rules = state.rules.filter((rule) => rule.enabled || selected.has(String(rule.id)));
  select.innerHTML = ["allow", "block"].map((action) => {
    const groupRules = rules.filter((rule) => (rule.action || "allow") === action);
    if (groupRules.length === 0) return "";
    const label = action === "block" ? "隐藏 / 排除动作（命中后隐藏）" : "允许显示动作（至少选择一个）";
    return '<optgroup label="' + escapeAttribute(label) + '">' + groupRules.map((rule) => renderShareRuleOption(rule, selected)).join("") + '</optgroup>';
  }).join("");
}
async function loadDatabaseStatus() {
  const data = await api("/api/admin/database/status");
  renderDatabaseStatus(data);
}
async function upgradeDatabase() {
  const message = optional("#database-message");
  if (message) message.textContent = "正在升级数据库...";
  const data = await api("/api/admin/database/upgrade", { method: "POST", body: "{}" });
  renderDatabaseStatus(data);
  if (message) message.textContent = data.appliedMigrations.length ? "已升级：" + data.appliedMigrations.join(", ") : "数据库已是最新";
}
function renderDatabaseStatus(data) {
  const target = optional("#database-status");
  if (!target) return;
  const upgradeButton = optional("#upgrade-database");
  if (upgradeButton) upgradeButton.classList.toggle("hidden", !data.needsUpgrade);
  const statusClass = data.needsUpgrade ? " warning" : "";
  target.innerHTML = '<div class="database-version-line' + statusClass + '">' +
    '当前数据库版本: <strong>' + escapeText(data.currentDatabaseVersion) + '</strong>, ' +
    '需要的数据库版本: <strong>' + escapeText(data.requiredDatabaseVersion) + '</strong>' +
    '</div>';
}
function showDialog(id) {
  const dialog = optional("#" + id);
  if (!dialog) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.classList.remove("hidden");
}
function closeDialog(id) {
  const dialog = optional("#" + id);
  if (!dialog) return;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.classList.add("hidden");
}
function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function renderGeneratedLink(url, label = "新链接：") {
  const output = optional("#new-link");
  if (!output) return;
  output.classList.remove("hidden");
  output.innerHTML = '<span><strong>' + escapeText(label) + '</strong>' + escapeText(url) + '</span><button type="button" class="secondary" data-copy-new-link>复制</button>';
  on("[data-copy-new-link]", "click", async () => {
    await copyShareText(url);
  });
}
async function copyShareText(text) {
  try {
    await copyText(text);
    showUiMessage("已复制链接", "success");
  } catch {
    showUiMessage("复制失败，请手动复制链接", "error");
  }
}
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy failed");
}
function showUiMessage(content, type = "info") {
  let container = optional("#ui-message-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "ui-message-container";
    container.className = "ui-message-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }
  const item = document.createElement("div");
  item.className = "ui-message " + type;
  item.textContent = content;
  container.appendChild(item);
  window.setTimeout(() => item.classList.add("visible"), 10);
  window.setTimeout(() => {
    item.classList.remove("visible");
    window.setTimeout(() => item.remove(), 220);
  }, 2600);
}

(async function init() {
  try {
    const data = await api("/api/admin/me");
    showApp(data.admin);
    await loadCurrentPage();
  } catch {
    showLogin();
  }
})();`;

// src/views/admin.ts
function adminPage(section = "mail") {
  return page("\u7BA1\u7406\u5458\u540E\u53F0", adminBody(section), adminScript(section));
}
__name(adminPage, "adminPage");
var MAIL_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke-width="2"/><path d="m4 7 8 6 8-6" stroke-width="2"/></svg>`;
var SHIELD_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6z" stroke-width="2"/><path d="m9 12 2 2 4-5" stroke-width="2"/></svg>`;
var LINK_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" stroke-width="2"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" stroke-width="2"/></svg>`;
var RULE_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16M7 12h10M10 19h4" stroke-width="2" stroke-linecap="round"/></svg>`;
var DB_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5" rx="7" ry="3" stroke-width="2"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" stroke-width="2"/><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" stroke-width="2"/></svg>`;
var TITLES = {
  mail: "\u90AE\u4EF6\u4E2D\u5FC3",
  rules: "\u89C4\u5219\u7BA1\u7406",
  share: "\u5206\u4EAB\u94FE\u63A5",
  database: "\u6570\u636E\u5E93\u7BA1\u7406"
};
function adminBody(section) {
  return String.raw`
${authLoading()}
${loginSection()}
<div id="app-section" class="app-shell hidden">
  <aside class="sidebar">
    <div class="brand"><span class="brand-icon">${MAIL_ICON}</span><span>邮件管家</span></div>
    <nav class="sidebar-nav" aria-label="后台导航">
      ${navItem("mail", section, "/admin", MAIL_ICON, "\u90AE\u4EF6\u4E2D\u5FC3")}
      ${navItem("rules", section, "/admin/rules", RULE_ICON, "\u89C4\u5219\u7BA1\u7406")}
      ${navItem("share", section, "/admin/share-links", LINK_ICON, "\u5206\u4EAB\u94FE\u63A5")}
      ${navItem("database", section, "/admin/database", DB_ICON, "\u6570\u636E\u5E93\u7BA1\u7406")}
    </nav>
    <div class="sidebar-footer">
      <div class="inline-status"><span class="status-dot"></span><span>系统运行正常</span></div>
    </div>
  </aside>
  <div class="content-shell">
    <header class="topbar">
      <div><p class="page-kicker">Netflix Mail Console</p><h2>${TITLES[section]}</h2></div>
      <div class="toolbar">
        <span id="admin-name" class="badge muted-badge"></span>
        <button id="logout" class="secondary hidden" type="button">退出登录</button>
      </div>
    </header>
    <main class="dashboard-main">${moduleContent(section)}</main>
  </div>
</div>`;
}
__name(adminBody, "adminBody");
function authLoading() {
  return String.raw`<div id="auth-loading" class="auth-loading">
  <div class="brand"><span class="brand-icon">${MAIL_ICON}</span><span>Netflix Mail</span></div>
  <div class="inline-status"><span class="status-dot"></span><span>正在确认登录状态...</span></div>
</div>`;
}
__name(authLoading, "authLoading");
function loginSection() {
  return String.raw`<section id="login-section" class="hero-auth hidden">
  <div class="hero-copy compact-hero">
    <div class="brand"><span class="brand-icon">${MAIL_ICON}</span><span>Netflix Mail</span></div>
    <div><h1>管理员后台</h1><p style="margin-top:12px">临时邮件访问与分享管理。</p></div>
  </div>
  <div class="auth-card">
    <div class="card-title"><p class="page-kicker">Admin Portal</p><h1>管理员登录</h1><p class="muted">仅授权管理员可访问邮件中心。</p></div>
    <form id="login-form">
      <label>用户名</label><input name="username" autocomplete="username" placeholder="请输入用户名" required>
      <label>密码</label><input name="password" type="password" autocomplete="current-password" placeholder="请输入密码" required>
      <div class="form-actions"><button type="submit">登录后台</button><span id="login-message" class="muted"></span></div>
    </form>
  </div>
</section>`;
}
__name(loginSection, "loginSection");
function navItem(section, current, href, icon, label) {
  const activeClass = section === current ? " active" : "";
  return `<a class="nav-item${activeClass}" href="${href}">${icon}<span>${label}</span></a>`;
}
__name(navItem, "navItem");
function moduleContent(section) {
  if (section === "rules") return rulesSection();
  if (section === "share") return shareSection();
  if (section === "database") return databaseSection();
  return mailSection();
}
__name(moduleContent, "moduleContent");
function mailSection() {
  return String.raw`<section id="mail-center" class="mail-viewer-shell admin-mail-viewer">
  <form id="search-form" class="mail-viewer-topbar">
    <input name="q" aria-label="搜索邮件" placeholder="留空查询所有地址；或输入主题、发件人、收件人">
    <button type="submit">查询</button>
  </form>
  <div class="mail-viewer-controls">
    <div class="mail-refresh-actions" aria-label="邮件刷新控制">
      <label class="mail-auto-refresh-control" for="admin-auto-refresh-toggle">
        <span id="admin-auto-refresh-label">60秒后刷新</span>
        <input id="admin-auto-refresh-toggle" type="checkbox" checked aria-label="自动刷新邮件">
        <span class="mail-auto-refresh-switch" aria-hidden="true"></span>
      </label>
      <button id="reload-emails" type="button" class="secondary">刷新</button>
    </div>
    <span class="mail-control-chip">本页 <strong id="metric-page-count">0</strong></span>
    <span class="mail-control-chip">总结果 <strong id="metric-total">0</strong></span>
    <span class="mail-control-chip">命中邮件 <strong id="metric-codes">0</strong></span>
    <div class="mail-pagination-controls" aria-label="邮件分页">
      <button id="email-page-prev" type="button" class="secondary">上一页</button>
      <span class="mail-page-indicator">第 <strong id="metric-current-page">0</strong> / <strong id="metric-total-pages">0</strong> 页</span>
      <div id="email-page-numbers" class="mail-page-numbers" aria-label="邮件页码"></div>
      <label>每页
        <select id="email-page-size" aria-label="每页邮件数量">
          <option value="20">20</option>
          <option value="50" selected>50</option>
          <option value="100">100</option>
        </select>
      </label>
      <button id="email-page-next" type="button" class="secondary">下一页</button>
    </div>
  </div>
  <div class="mail-viewer-grid">
    <aside class="mail-list-panel" aria-label="邮件列表">
      <div class="mail-list-title"><strong>邮件列表</strong><span>点击左侧邮件查看正文</span></div>
      <div id="emails-table" class="mail-list"></div>
    </aside>
    <article id="email-detail" class="mail-detail-panel hidden" aria-live="polite">
      <div id="email-detail-content"></div>
    </article>
  </div>
</section>`;
}
__name(mailSection, "mailSection");
function rulesSection() {
  return String.raw`<section id="rule-center" class="rule-page-shell">
  <div class="rule-page-toolbar rule-page-header">
    <div class="card-title"><p class="page-kicker">Rules</p><h1>规则管理</h1><p class="muted">按命中后动作维护访客可见邮件，支持允许显示与隐藏排除。</p></div>
    <button id="open-rule-form" type="button">添加规则</button>
  </div>
  ${ruleForm()}
  <div id="rules-table" class="rule-list-shell"></div>
</section>`;
}
__name(rulesSection, "rulesSection");
function shareSection() {
  return String.raw`<section id="share-center">
  <div class="card-header">
    <div class="card-title"><p class="page-kicker">Share Links</p><h1>分享链接</h1><p class="muted">为访客生成临时访问链接，只返回最近 30 分钟命中邮件。</p></div>
    <button id="open-link-form" type="button">添加分享链接</button>
  </div>
  ${shareForm()}
  <div id="new-link" class="generated-link hidden"></div>
  <div id="links-table"></div>
</section>`;
}
__name(shareSection, "shareSection");
function databaseSection() {
  return String.raw`<section id="database-center">
  <div class="card-header">
    <div class="card-title"><p class="page-kicker">Database</p><h1>数据库管理</h1><p class="muted">更新 Worker JS 后，可在这里检查并升级数据库版本。</p></div>
    <button id="upgrade-database" class="hidden" type="button">升级数据库</button>
  </div>
  <div id="database-message" class="muted" style="margin-bottom:12px"></div>
  <div id="database-status"></div>
</section>`;
}
__name(databaseSection, "databaseSection");
function ruleForm() {
  return String.raw`<dialog id="rule-dialog" class="modal-card" aria-labelledby="rule-form-title">
<form id="rule-form" class="modal-form rule-dialog-form">
  <input type="hidden" name="id">
  <div class="rule-dialog-shell">
    <div class="modal-title-row rule-dialog-title-row"><div><h2 id="rule-form-title">添加规则</h2></div><button type="button" class="secondary rule-dialog-close" data-close-dialog="rule-dialog" aria-label="关闭">×</button></div>
    <div class="rule-form-meta-grid">
      <label class="rule-form-field"><span>规则名称</span><input name="name" placeholder="例如：Netflix 登录验证码" required></label>
      <label class="rule-form-field"><span>命中后动作</span><select name="action"><option value="allow">允许显示：命中后可在访客链接中显示</option><option value="block">隐藏 / 排除：命中后从访客链接中隐藏</option></select></label>
    </div>
    <div class="rule-canvas" role="group" aria-labelledby="rule-builder-title" aria-describedby="rule-builder-help">
      <div class="rule-builder-topline">
        <div><strong id="rule-builder-title">可视化条件组</strong><p id="rule-builder-help" class="muted">用条件卡片组合 AND / OR 关系，拖拽排序或移动到其他分组。</p></div>
        <div id="rule-builder-summary" class="rule-builder-summary" role="status" aria-live="polite">当前表达式：未配置</div>
      </div>
      <div class="rule-builder-actions rule-builder-toolbar rule-builder-fallback-toolbar"><button type="button" class="secondary" id="rule-builder-add-condition">＋ 添加条件</button><button type="button" class="secondary" id="rule-builder-add-group">＋ 添加规则组</button><button type="button" class="secondary" id="rule-builder-reset">重置</button></div>
      <div id="rule-builder-root" class="rule-builder-tree rule-workspace" aria-label="规则条件树"></div>
    </div>
    <div class="rule-dialog-panels">
      <details class="rule-quick"><summary>批量生成条件</summary>
        <label>关键词（支持多行或逗号分隔）</label><textarea name="keyword" rows="4" placeholder="netflix&#10;verification code&#10;account access"></textarea>
        <div class="rule-grid">
          <div><label>关键词关系</label><select name="keywordLogic"><option value="any">任一关键词命中</option><option value="all">所有关键词都命中</option></select></div>
          <div><label>字段关系</label><select name="fieldLogic"><option value="any">任一字段命中</option><option value="all">每个选中字段都命中</option></select></div>
        </div>
        <label>匹配字段</label>
        <div class="chips">
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="from"> From</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="to"> To</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="subject" checked> Subject</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="text" checked> Text</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="html"> HTML</label>
          <label class="checkbox-pill"><input type="checkbox" name="fields" value="code" checked> Code</label>
        </div>
        <div class="rule-grid">
          <div><label>匹配方式</label><select name="matchMode"><option value="contains">包含</option><option value="exact">完全相等</option><option value="startsWith">开头匹配</option><option value="endsWith">结尾匹配</option><option value="regex">正则表达式</option></select></div>
          <label class="checkbox-pill rule-enabled-chip"><input type="checkbox" name="caseSensitive"> 区分大小写</label>
        </div>
        <button type="button" class="secondary" id="rule-builder-quick-apply">应用到可视化编辑器</button>
      </details>
      <details class="rule-advanced"><summary>高级表达式 JSON 预览 / 导入</summary><textarea id="rule-expression-json" name="expressionJson" rows="8" spellcheck="false" placeholder='{"op":"and","children":[{"op":"condition","field":"subject","operator":"contains","value":"Netflix"}]}'></textarea><div class="rule-builder-actions"><button type="button" class="secondary" id="rule-builder-import">导入 JSON</button><button type="button" class="secondary" id="rule-builder-copy-json">复制 JSON</button></div><p class="muted">JSON 会随可视化编辑器自动刷新；手动修改后请点击“导入 JSON”。</p></details>
    </div>
    <div class="rule-dialog-footer">
      <label class="checkbox-pill rule-enabled-chip"><input type="checkbox" name="enabled" checked> 启用规则</label>
      <div class="rule-dialog-submit"><span id="rule-message" class="muted" role="status" aria-live="polite"></span><button type="button" class="secondary" data-close-dialog="rule-dialog">取消</button><button id="rule-submit" type="submit">保存规则</button></div>
    </div>
  </div>
</form>
</dialog>`;
}
__name(ruleForm, "ruleForm");
function shareForm() {
  return String.raw`<dialog id="link-dialog" class="modal-card">
<form id="link-form" class="modal-form">
  <input type="hidden" name="id">
  <div class="modal-title-row"><h2 id="link-form-title">添加分享链接</h2><button type="button" class="secondary" data-close-dialog="link-dialog">关闭</button></div>
  <label>链接名称</label><input name="name" placeholder="例如：临时访客">
  <label>过期时间</label><input name="expiresAt" type="datetime-local">
  <label>绑定规则</label><select id="share-rules" name="ruleIds" multiple size="7" required></select>
  <div class="rule-grid">
    <div><label>允许规则关系</label><select name="allowRuleLogic"><option value="or">任一允许规则命中即可显示</option><option value="and">全部允许规则都命中才显示</option></select></div>
    <div><label>排除规则关系</label><select name="blockRuleLogic"><option value="or">任一排除规则命中即隐藏</option><option value="and">全部排除规则都命中才隐藏</option></select></div>
  </div>
  <label>状态</label><select name="status"><option value="active">启用</option><option value="disabled">停用</option></select>
  <div class="form-actions"><button id="link-submit" type="submit">生成链接</button><span id="link-message" class="muted"></span></div>
</form>
</dialog>`;
}
__name(shareForm, "shareForm");

// src/views/setup.ts
function setupPage() {
  return page("\u521D\u59CB\u5316\u7BA1\u7406\u5458", SETUP_BODY, setupScript());
}
__name(setupPage, "setupPage");
var LOCK_ICON = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M7 11V8a5 5 0 0 1 10 0v3" stroke-width="2"/><rect x="5" y="11" width="14" height="10" rx="2" stroke-width="2"/><path d="M12 15v2" stroke-width="2" stroke-linecap="round"/></svg>`;
var MAIL_ICON2 = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke-width="2"/><path d="m4 7 8 6 8-6" stroke-width="2"/></svg>`;
var SETUP_BODY = String.raw`
<div class="setup-shell">
  <div class="setup-topbar">
    <a class="brand" href="/admin"><span class="brand-icon">${MAIL_ICON2}</span><span>Netflix Mail</span></a>
    <a class="button-link secondary" href="/admin">返回管理员后台</a>
  </div>
  <main>
    <div class="progress-line"><span class="badge">1 / 1</span><span>初始化完成前不可访问后台</span></div>
    <section class="setup-card">
      <span class="soft-icon success" style="width:80px;height:80px;margin:0 auto 22px">${LOCK_ICON}</span>
      <h1>创建第一个管理员</h1>
      <p class="muted" style="margin-top:12px">本步骤用于初始化系统管理员账号，请妥善保管相关信息。</p>
      <form id="setup-form">
        <label>Setup Token</label>
        <input name="setupToken" type="password" autocomplete="off" placeholder="请输入 Setup Token" required>
        <label>用户名</label>
        <input name="username" autocomplete="username" placeholder="请输入用户名" required>
        <label>密码</label>
        <input name="password" type="password" autocomplete="new-password" minlength="10" placeholder="请输入至少 10 位密码" required>
        <div class="form-actions">
          <button type="submit">创建管理员</button>
          <span id="message" class="muted"></span>
        </div>
      </form>
    </section>
    <div class="notice" style="width:min(760px,100%);margin:22px auto 0">
      <span class="soft-icon">${LOCK_ICON}</span>
      <div><strong>安全提示</strong><div>请确保在安全环境中操作。初始化完成后该 Token 将失效且无法恢复。</div></div>
    </div>
  </main>
</div>`;
function setupScript() {
  return `
const form = document.querySelector("#setup-form");
const message = document.querySelector("#message");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  message.className = "muted";
  const body = Object.fromEntries(new FormData(form).entries());
  const response = await fetch("/api/setup/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    message.textContent = data.error || "\u521B\u5EFA\u5931\u8D25";
    message.className = "danger-text";
    return;
  }
  message.textContent = "\u5DF2\u521B\u5EFA";
  message.className = "ok";
  location.href = "/admin";
});`;
}
__name(setupScript, "setupScript");

// src/views/visitor.ts
function visitorPage(token) {
  return page("\u8BBF\u95EE\u4EE3\u7801", VISITOR_BODY, visitorScript(token));
}
__name(visitorPage, "visitorPage");
var MAIL_ICON3 = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke-width="2"/><path d="m4 7 8 6 8-6" stroke-width="2"/></svg>`;
var SHIELD_ICON2 = String.raw`<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6z" stroke-width="2"/><path d="m9 12 2 2 4-5" stroke-width="2"/></svg>`;
var VISITOR_BODY = String.raw`
<div class="visitor-shell mail-reader-page">
  <header class="visitor-header mail-reader-header">
    <div>
      <div class="brand"><span class="brand-icon">${MAIL_ICON3}</span><span>访问代码</span></div>
      <p class="muted" style="margin-top:8px">展示最近 30 分钟内的匹配邮件，页面会自动刷新。</p>
    </div>
    <div class="toolbar">
      <span class="inline-status"><span class="status-dot"></span><span id="status">同步中</span></span>
    </div>
  </header>
  <main style="width:100%;margin:0">
    <section class="mail-viewer-shell visitor-mail-viewer">
      <div class="mail-viewer-topbar">
        <input id="visitor-filter" aria-label="过滤邮件" placeholder="过滤当前页">
        <button id="visitor-clear-filter" type="button" class="secondary">清空</button>
      </div>
      <div class="mail-viewer-controls">
        <div class="mail-refresh-actions" aria-label="邮件刷新控制">
          <label class="mail-auto-refresh-control" for="visitor-auto-refresh-toggle">
            <span id="visitor-auto-refresh-label">60秒后刷新</span>
            <input id="visitor-auto-refresh-toggle" type="checkbox" checked aria-label="自动刷新邮件">
            <span class="mail-auto-refresh-switch" aria-hidden="true"></span>
          </label>
          <button id="refresh" type="button" class="secondary">刷新</button>
        </div>
        <span class="mail-control-chip">匹配邮件 <strong id="email-count" class="visitor-count">0</strong></span>
        <span class="mail-control-chip">最近同步 <strong id="last-sync">--</strong></span>
        <span class="mail-control-chip">30 分钟窗口</span>
        <div class="mail-pagination-controls" aria-label="访客邮件分页">
          <button id="visitor-page-prev" type="button" class="secondary">上一页</button>
          <span class="mail-page-indicator">第 <strong id="visitor-current-page">0</strong> / <strong id="visitor-total-pages">0</strong> 页</span>
          <div id="visitor-page-numbers" class="mail-page-numbers" aria-label="访客邮件页码"></div>
          <label>每页
            <select id="visitor-page-size" aria-label="每页匹配邮件数量">
              <option value="10">10</option>
              <option value="20" selected>20</option>
              <option value="50">50</option>
            </select>
          </label>
          <button id="visitor-page-next" type="button" class="secondary">下一页</button>
        </div>
      </div>
      <div class="mail-viewer-grid">
        <aside class="mail-list-panel" aria-label="匹配邮件列表">
          <div class="mail-list-title"><strong>邮件列表</strong><span>点击左侧邮件查看正文</span></div>
          <div id="emails" class="mail-list"></div>
        </aside>
        <article id="visitor-email-detail" class="mail-detail-panel" aria-live="polite">
          <div id="visitor-email-detail-content"></div>
        </article>
      </div>
    </section>
    <p class="muted" style="text-align:center;margin:18px 0">数据仅保留最近 30 分钟，自动刷新，保障访问隐私安全。</p>
  </main>
</div>`;
function safeScriptString(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
__name(safeScriptString, "safeScriptString");
function visitorScript(token) {
  return COMMON_MAIL_CLIENT_SCRIPT + `
const token = ${safeScriptString(token)};
const visitorState = { emails: [], selectedEmailKey: null, filter: "", emailPage: 1, emailPageSize: 20, emailPagination: null };
const emails = document.querySelector("#emails");
const statusEl = document.querySelector("#status");
const countEl = document.querySelector("#email-count");
const lastSyncEl = document.querySelector("#last-sync");
const filterInput = document.querySelector("#visitor-filter");
const pageSizeInput = document.querySelector("#visitor-page-size");
const visitorRefreshController = createMailRefreshController({
  inputSelector: "#visitor-auto-refresh-toggle",
  labelSelector: "#visitor-auto-refresh-label",
  intervalSeconds: 60,
  refresh: () => loadEmails()
});
document.querySelector("#refresh").addEventListener("click", () => visitorRefreshController.refreshNow());
document.querySelector("#visitor-page-prev").addEventListener("click", () => loadEmails(visitorState.emailPage - 1));
document.querySelector("#visitor-page-next").addEventListener("click", () => loadEmails(visitorState.emailPage + 1));
pageSizeInput.addEventListener("change", async () => {
  visitorState.emailPageSize = Number(pageSizeInput.value) || 20;
  await loadEmails(1);
});
filterInput.addEventListener("input", () => {
  visitorState.filter = filterInput.value;
  renderVisitorListAndDetail();
});
document.querySelector("#visitor-clear-filter").addEventListener("click", () => {
  filterInput.value = "";
  visitorState.filter = "";
  renderVisitorListAndDetail();
});

async function loadEmails(page = visitorState.emailPage) {
  statusEl.textContent = "\u540C\u6B65\u4E2D";
  visitorState.emailPage = Math.max(1, Number(page) || 1);
  const params = new URLSearchParams({
    page: String(visitorState.emailPage),
    pageSize: String(visitorState.emailPageSize)
  });
  const response = await fetch("/api/visitor/" + encodeURIComponent(token) + "/emails?" + params.toString());
  const data = await response.json();
  if (!response.ok) {
    statusEl.textContent = data.error || "\u94FE\u63A5\u4E0D\u53EF\u7528";
    countEl.textContent = "0";
    visitorState.emailPagination = fallbackVisitorPagination([]);
    updateVisitorPagination(visitorState.emailPagination);
    emails.innerHTML = '<div class="empty-state">\u94FE\u63A5\u4E0D\u53EF\u7528\u6216\u5DF2\u8FC7\u671F</div>';
    renderVisitorEmptyDetail("\u94FE\u63A5\u4E0D\u53EF\u7528\u6216\u5DF2\u8FC7\u671F");
    return;
  }
  const syncTime = new Date().toLocaleTimeString();
  statusEl.textContent = "\u5DF2\u540C\u6B65";
  lastSyncEl.textContent = syncTime;
  visitorState.emailPagination = data.pagination || fallbackVisitorPagination(data.emails);
  visitorState.emailPage = visitorState.emailPagination.page;
  visitorState.emailPageSize = visitorState.emailPagination.pageSize;
  visitorState.emails = data.emails.map((email, index) => ({
    ...email,
    viewKey: String(visitorState.emailPage) + "-" + String(index) + "-" + String(email.receivedAt || "")
  }));
  countEl.textContent = String(visitorState.emailPagination.total);
  updateVisitorPagination(visitorState.emailPagination);
  renderVisitorListAndDetail();
}
function fallbackVisitorPagination(items) {
  return {
    page: visitorState.emailPage,
    pageSize: visitorState.emailPageSize,
    total: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    hasPreviousPage: false,
    hasNextPage: false
  };
}
function updateVisitorPagination(pagination) {
  const visiblePage = pagination.total > 0 ? pagination.page : 0;
  optional("#visitor-current-page").textContent = String(visiblePage);
  optional("#visitor-total-pages").textContent = String(pagination.totalPages);
  const prevButton = optional("#visitor-page-prev");
  const nextButton = optional("#visitor-page-next");
  if (prevButton) prevButton.disabled = !pagination.hasPreviousPage;
  if (nextButton) nextButton.disabled = !pagination.hasNextPage;
  if (pageSizeInput) pageSizeInput.value = String(pagination.pageSize);
  renderVisitorPageNumbers(pagination);
}
function renderVisitorPageNumbers(pagination) {
  const container = optional("#visitor-page-numbers");
  if (!container) return;
  const totalPages = Number(pagination.totalPages) || 0;
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  const currentPage = Math.min(Math.max(1, Number(pagination.page) || 1), totalPages);
  container.innerHTML = mailPageNumberItems(currentPage, totalPages).map((item) => {
    if (item === "ellipsis") return '<span class="mail-page-ellipsis" aria-hidden="true">\u2026</span>';
    const active = item === currentPage ? " active" : "";
    const disabled = item === currentPage ? " disabled" : "";
    return '<button type="button" class="secondary mail-page-number' + active + '" data-visitor-page="' + item +
      '" aria-label="\u7B2C ' + item + ' \u9875" aria-current="' + (item === currentPage ? "page" : "false") + '"' + disabled + '>' + item + '</button>';
  }).join("");
  container.querySelectorAll("[data-visitor-page]").forEach((button) => {
    button.addEventListener("click", () => loadEmails(Number(button.dataset.visitorPage)));
  });
}
function visitorVisibleEmails() {
  const query = visitorState.filter.trim().toLowerCase();
  if (!query) return visitorState.emails;
  return visitorState.emails.filter((email) => [
    email.subject, email.bodyText, email.body, normalizeCodes(email.codes).join(" ")
  ].some((value) => String(value || "").toLowerCase().includes(query)));
}
function renderVisitorListAndDetail() {
  const visible = visitorVisibleEmails();
  emails.innerHTML = visible.map(renderVisitorListItem).join("") || '<div class="empty-state">\u6682\u65E0\u5339\u914D\u90AE\u4EF6</div>';
  emails.querySelectorAll("[data-key]").forEach((item) => item.addEventListener("click", () => selectVisitorEmail(item.dataset.key)));
  const selected = visible.find((email) => email.viewKey === visitorState.selectedEmailKey);
  if (selected) selectVisitorEmail(selected.viewKey);
  else if (visible[0]) selectVisitorEmail(visible[0].viewKey);
  else renderVisitorEmptyDetail("\u6682\u65E0\u5339\u914D\u90AE\u4EF6");
}
function renderVisitorListItem(email) {
  const selected = email.viewKey === visitorState.selectedEmailKey ? " selected" : "";
  const truncated = email.contentTruncated ? '<span class="badge muted-badge">\u622A\u65AD</span>' : "";
  return '<button type="button" class="mail-list-item' + selected + '" data-key="' + escapeAttribute(email.viewKey) + '">' +
    '<strong>' + escapeText(email.subject || "(\u65E0\u4E3B\u9898)") + '</strong>' +
    '<div class="mail-list-tags">' + renderMetaPill("\u65F6\u95F4", formatDate(email.receivedAt)) + truncated + '</div>' +
  '</button>';
}
function selectVisitorEmail(key) {
  const visible = visitorVisibleEmails();
  const email = visible.find((item) => item.viewKey === key);
  if (!email) return;
  visitorState.selectedEmailKey = email.viewKey;
  emails.querySelectorAll(".mail-list-item").forEach((item) => item.classList.toggle("selected", item.dataset.key === email.viewKey));
  optional("#visitor-email-detail-content").innerHTML = renderVisitorEmailDetail(email, visible);
  bindVisitorDetailActions();
}
function renderVisitorEmailDetail(email, visible) {
  const body = cleanEmailBody(email.bodyText || email.body || htmlToText(email.bodyHtml) || "");
  const codes = renderCodeChips(email.codes) || '<span class="badge muted-badge">\u65E0\u9A8C\u8BC1\u7801</span>';
  const truncated = email.contentTruncated ? '<span class="badge muted-badge">\u5185\u5BB9\u5DF2\u622A\u65AD</span>' : "";
  const index = visible.findIndex((item) => item.viewKey === email.viewKey);
  const prevDisabled = index <= 0 ? " disabled" : "";
  const nextDisabled = index < 0 || index >= visible.length - 1 ? " disabled" : "";
  return '<div class="mail-detail-view"><div class="mail-detail-nav">' +
    '<button type="button" class="secondary" data-visitor-prev' + prevDisabled + '>\u2039 \u4E0A\u4E00\u5C01</button>' +
    '<button type="button" class="secondary" data-visitor-next' + nextDisabled + '>\u4E0B\u4E00\u5C01 \u203A</button></div>' +
    '<div class="mail-detail-header"><h2>' + escapeText(email.subject || "(\u65E0\u4E3B\u9898)") + '</h2>' +
    '<div class="mail-meta-row">' + renderMetaPill("\u65F6\u95F4", formatDate(email.receivedAt)) + '</div>' +
    '<div class="mail-action-row">' + truncated + '<button type="button" class="secondary" data-toggle-visitor-plain>\u663E\u793A\u7EAF\u6587\u672C\u90AE\u4EF6</button>' +
    '<button type="button" class="secondary" data-visitor-fullscreen>\u5168\u5C4F</button></div></div>' +
    '<div class="chips">' + codes + '</div><div class="mail-preview-stage">' +
    renderMailBodyFromContent(email.bodyHtml || "", body, Boolean(email.trustedAuthentication)) + '</div>' +
    '<pre class="mail-plain-panel hidden">' + escapeText(body || "\u6682\u65E0\u6B63\u6587") + '</pre></div>';
}
function renderVisitorEmptyDetail(message) {
  optional("#visitor-email-detail-content").innerHTML = '<div class="mail-empty-detail empty-state">' + escapeText(message) + '</div>';
}
function bindVisitorDetailActions() {
  on("[data-visitor-prev]", "click", () => navigateVisitorEmail(-1));
  on("[data-visitor-next]", "click", () => navigateVisitorEmail(1));
  on("[data-visitor-fullscreen]", "click", () => requestMailFullscreen("#visitor-email-detail .mail-preview-stage"));
  on("[data-toggle-visitor-plain]", "click", (event) => togglePlainPanel("#visitor-email-detail .mail-plain-panel", event.currentTarget));
  bindRemoteMailButtons("#visitor-email-detail");
}
function navigateVisitorEmail(delta) {
  const visible = visitorVisibleEmails();
  const index = visible.findIndex((email) => email.viewKey === visitorState.selectedEmailKey);
  const target = visible[index + delta];
  if (target) selectVisitorEmail(target.viewKey);
}

loadEmails();
`;
}
__name(visitorScript, "visitorScript");

// src/routes/pages.ts
function registerPageRoutes(app2) {
  app2.get("/", (c) => c.redirect("/admin"));
  app2.get("/admin", (c) => c.html(adminPage("mail")));
  app2.get("/admin/rules", (c) => c.html(adminPage("rules")));
  app2.get("/admin/share-links", (c) => c.html(adminPage("share")));
  app2.get("/admin/database", (c) => c.html(adminPage("database")));
  app2.get("/setup", (c) => c.html(setupPage()));
  app2.get("/v/:token", (c) => c.html(visitorPage(c.req.param("token"))));
}
__name(registerPageRoutes, "registerPageRoutes");

// src/routes/visitor.ts
function registerVisitorRoutes(app2) {
  app2.get("/api/visitor/:token/emails", visitorEmails);
}
__name(registerVisitorRoutes, "registerVisitorRoutes");
async function visitorEmails(c) {
  const token = c.req.param("token");
  if (!token) {
    return notFound(c, "Link is not available.");
  }
  const link = await getShareLinkByToken(c.env.DB, token);
  if (!link || !isShareLinkUsable(link)) {
    return notFound(c, "Link is not available.");
  }
  const since = minutesAgoIso(link.window_minutes);
  const pageSize = clampNumber(c.req.query("pageSize") ?? c.req.query("limit"), 20, 1, MAX_EMAIL_LIMIT);
  const requestedPage = clampNumber(c.req.query("page"), 1, 1, MAX_EMAIL_PAGE);
  const rules = await getRulesByIds(c.env.DB, link.ruleIds);
  const candidates = await listCandidateEmailDetailsSince(c.env.DB, since);
  const matchedEmails = candidates.filter(
    (email) => evaluateRuleSet(emailDetailToRuleInput(email), rules, {
      allowRuleLogic: link.allow_rule_logic,
      blockRuleLogic: link.block_rule_logic
    }).visible
  ).map((email) => ({
    subject: email.subject,
    receivedAt: email.received_at,
    codes: email.codes.map((code) => code.code),
    body: previewText(cleanEmailBody(email.content.text || stripHtml(email.content.html)), 1200),
    bodyText: cleanEmailBody(email.content.text || stripHtml(email.content.html)),
    bodyHtml: email.content.html || "",
    trustedAuthentication: hasTrustedAuthentication(email.content.headers),
    contentTruncated: Boolean(email.content_truncated)
  }));
  const pagination = visitorPagination(matchedEmails.length, requestedPage, pageSize);
  const emails = matchedEmails.slice(pagination.offset, pagination.offset + pagination.pageSize);
  await Promise.all([markShareLinkAccessed(c.env.DB, link.id), logVisitorAccess(c, link)]);
  return c.json({ ok: true, windowMinutes: link.window_minutes, since, emails, pagination: pagination.response });
}
__name(visitorEmails, "visitorEmails");
function visitorPagination(total, requestedPage, pageSize) {
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const page2 = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;
  return {
    pageSize,
    offset: (page2 - 1) * pageSize,
    response: {
      page: page2,
      pageSize,
      total,
      totalPages,
      hasPreviousPage: totalPages > 0 && page2 > 1,
      hasNextPage: totalPages > 0 && page2 < totalPages
    }
  };
}
__name(visitorPagination, "visitorPagination");
async function logVisitorAccess(c, link) {
  await writeAccessLog(c.env.DB, {
    actorType: "visitor",
    actorId: link.id,
    action: "share_link.view",
    request: c.req.raw
  });
}
__name(logVisitorAccess, "logVisitorAccess");
function hasTrustedAuthentication(headersText) {
  const text = authenticationHeaderText(headersText).toLowerCase();
  return /\bdkim\s*=\s*pass\b/.test(text) || /\bdmarc\s*=\s*pass\b/.test(text) || /\barc\s*=\s*pass\b/.test(text);
}
__name(hasTrustedAuthentication, "hasTrustedAuthentication");
function authenticationHeaderText(headersText) {
  try {
    const headers = JSON.parse(headersText || "[]");
    if (!Array.isArray(headers)) return "";
    return headers.filter((header) => /^(authentication-results|arc-authentication-results)$/i.test(header.key || header.originalKey || "")).map((header) => String(header.value || "")).join("\n");
  } catch {
    return headersText || "";
  }
}
__name(authenticationHeaderText, "authenticationHeaderText");

// src/index.ts
var app = new Hono2();
registerPageRoutes(app);
registerAdminRoutes(app);
registerVisitorRoutes(app);
app.notFound((c) => c.json({ ok: false, error: "Not found" }, 404));
var index_default = {
  fetch: app.fetch,
  async email(message, env) {
    const emailId = await storeInboundEmail(message, env);
    await writeAccessLog(env.DB, {
      actorType: "system",
      actorId: emailId,
      action: "email.received"
    });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
