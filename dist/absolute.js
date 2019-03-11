/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: none
 */
if (typeof DEBUG == 'undefined')
    DEBUG = true;

/**
 * Sea.js 2.2.3 | seajs.org/LICENSE.md
 */
(function(global, undefined) {

// Avoid conflicting when `sea.js` is loaded multiple times
if (global.seajs) {
  return
}

var seajs = global.seajs = {
  // The current version of Sea.js being used
  version: "2.2.3"
}

var data = seajs.data = {}


/**
 * util-lang.js - The minimal language enhancement
 */

function isType(type) {
  return function(obj) {
    return {}.toString.call(obj) == "[object " + type + "]"
  }
}

var isObject = isType("Object")
var isString = isType("String")
var isArray = Array.isArray || isType("Array")
var isFunction = isType("Function")
var isUndefined = isType("Undefined")

var _cid = 0
function cid() {
  return _cid++
}

/**
 * util-events.js - The minimal events support
 */

var events = data.events = {}

// Bind event
seajs.on = function(name, callback) {
  var list = events[name] || (events[name] = [])
  list.push(callback)
  return seajs
}

// Remove event. If `callback` is undefined, remove all callbacks for the
// event. If `event` and `callback` are both undefined, remove all callbacks
// for all events
seajs.off = function(name, callback) {
  // Remove *all* events
  if (!(name || callback)) {
    events = data.events = {}
    return seajs
  }

  var list = events[name]
  if (list) {
    if (callback) {
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i] === callback) {
          list.splice(i, 1)
        }
      }
    }
    else {
      delete events[name]
    }
  }

  return seajs
}

// Emit event, firing all bound callbacks. Callbacks receive the same
// arguments as `emit` does, apart from the event name
var emit = seajs.emit = function(name, data) {
  var list = events[name], fn

  if (list) {
    // Copy callback lists to prevent modification
    list = list.slice()

    // Execute event callbacks
    while ((fn = list.shift())) {
      fn(data)
    }
  }

  return seajs
}


/**
 * util-path.js - The utilities for operating path such as id, uri
 */

var DIRNAME_RE = /[^?#]*\//

var DOT_RE = /\/\.\//g
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//
var DOUBLE_SLASH_RE = /([^:/])\/\//g

// Extract the directory portion of a path
// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
// ref: http://jsperf.com/regex-vs-split/2
function dirname(path) {
  return path.match(DIRNAME_RE)[0]
}

// Canonicalize a path
// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
function realpath(path) {
  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, "/")

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/")
  }

  // a//b/c  ==>  a/b/c
  path = path.replace(DOUBLE_SLASH_RE, "$1/")

  return path
}

// Normalize an id
// normalize("path/to/a") ==> "path/to/a.js"
// NOTICE: substring is faster than negative slice and RegExp
function normalize(path) {
  var last = path.length - 1
  var lastC = path.charAt(last)

  // If the uri ends with `#`, just return it without '#'
  if (lastC === "#") {
    return path.substring(0, last)
  }

  return (path.substring(last - 2) === ".js" ||
      path.indexOf("?") > 0 ||
      path.substring(last - 3) === ".css" ||
      lastC === "/") ? path : path + ".js"
}


var PATHS_RE = /^([^/:]+)(\/.+)$/
var VARS_RE = /{([^{]+)}/g

function parseAlias(id) {
  var alias = data.alias
  return alias && isString(alias[id]) ? alias[id] : id
}

function parsePaths(id) {
  var paths = data.paths
  var m

  if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
    id = paths[m[1]] + m[2]
  }

  return id
}

function parseVars(id) {
  var vars = data.vars

  if (vars && id.indexOf("{") > -1) {
    id = id.replace(VARS_RE, function(m, key) {
      return isString(vars[key]) ? vars[key] : m
    })
  }

  return id
}

function parseMap(uri) {
  var map = data.map
  var ret = uri

  if (map) {
    for (var i = 0, len = map.length; i < len; i++) {
      var rule = map[i]

      ret = isFunction(rule) ?
          (rule(uri) || uri) :
          uri.replace(rule[0], rule[1])

      // Only apply the first matched rule
      if (ret !== uri) break
    }
  }

  return ret
}


var ABSOLUTE_RE = /^\/\/.|:\//
var ROOT_DIR_RE = /^.*?\/\/.*?\//

function addBase(id, refUri) {
  var ret
  var first = id.charAt(0)

  // Absolute
  if (ABSOLUTE_RE.test(id)) {
    ret = id
  }
  // Relative
  else if (first === ".") {
    ret = realpath((refUri ? dirname(refUri) : data.cwd) + id)
  }
  // Root
  else if (first === "/") {
    var m = data.cwd.match(ROOT_DIR_RE)
    ret = m ? m[0] + id.substring(1) : id
  }
  // Top-level
  else {
    ret = data.base + id
  }

  // Add default protocol when uri begins with "//"
  if (ret.indexOf("//") === 0) {
    ret = location.protocol + ret
  }

  return ret
}

function id2Uri(id, refUri) {
  if (!id) return ""

  id = parseAlias(id)
  id = parsePaths(id)
  id = parseVars(id)
  id = normalize(id)

  var uri = addBase(id, refUri)
  uri = parseMap(uri)

  return uri
}


var doc = document
var cwd = dirname(doc.URL)
var scripts = doc.scripts

// Recommend to add `seajsnode` id for the `sea.js` script element
var loaderScript = doc.getElementById("seajsnode") ||
    scripts[scripts.length - 1]

// When `sea.js` is inline, set loaderDir to current working directory
var loaderDir = dirname(getScriptAbsoluteSrc(loaderScript) || cwd)

function getScriptAbsoluteSrc(node) {
  return node.hasAttribute ? // non-IE6/7
      node.src :
    // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
      node.getAttribute("src", 4)
}


// For Developers
seajs.resolve = id2Uri


/**
 * util-request.js - The utilities for requesting script and style files
 * ref: tests/research/load-js-css/test.html
 */

var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement
var baseElement = head.getElementsByTagName("base")[0]

var IS_CSS_RE = /\.css(?:\?|$)/i
var currentlyAddingScript
var interactiveScript

// `onload` event is not supported in WebKit < 535.23 and Firefox < 9.0
// ref:
//  - https://bugs.webkit.org/show_activity.cgi?id=38995
//  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
//  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
var isOldWebKit = +navigator.userAgent
    .replace(/.*(?:AppleWebKit|AndroidWebKit)\/(\d+).*/, "$1") < 536


function request(url, callback, charset, crossorigin) {
  var isCSS = IS_CSS_RE.test(url)
  var node = doc.createElement(isCSS ? "link" : "script")

  if (charset) {
    node.charset = charset
  }

  // crossorigin default value is `false`.
  if (!isUndefined(crossorigin)) {
    node.setAttribute("crossorigin", crossorigin)
  }


  addOnload(node, callback, isCSS, url)

  if (isCSS) {
    node.rel = "stylesheet"
    node.href = url
  }
  else {
    node.async = true
    node.src = url
  }

  // For some cache cases in IE 6-8, the script executes IMMEDIATELY after
  // the end of the insert execution, so use `currentlyAddingScript` to
  // hold current node, for deriving url in `define` call
  currentlyAddingScript = node

  // ref: #185 & http://dev.jquery.com/ticket/2709
  baseElement ?
      head.insertBefore(node, baseElement) :
      head.appendChild(node)

  currentlyAddingScript = null
}

function addOnload(node, callback, isCSS, url) {
  var supportOnload = "onload" in node

  // for Old WebKit and Old Firefox
  if (isCSS && (isOldWebKit || !supportOnload)) {
    setTimeout(function() {
      pollCss(node, callback)
    }, 1) // Begin after node insertion
    return
  }

  if (supportOnload) {
    node.onload = onload
    node.onerror = function() {
      emit("error", { uri: url, node: node })
      onload()
    }
  }
  else {
    node.onreadystatechange = function() {
      if (/loaded|complete/.test(node.readyState)) {
        onload()
      }
    }
  }

  function onload() {
    // Ensure only run once and handle memory leak in IE
    node.onload = node.onerror = node.onreadystatechange = null

    // Remove the script to reduce memory leak
    if (!isCSS && !data.debug) {
      head.removeChild(node)
    }

    // Dereference the node
    node = null

    callback()
  }
}

function pollCss(node, callback) {
  var sheet = node.sheet
  var isLoaded

  // for WebKit < 536
  if (isOldWebKit) {
    if (sheet) {
      isLoaded = true
    }
  }
  // for Firefox < 9.0
  else if (sheet) {
    try {
      if (sheet.cssRules) {
        isLoaded = true
      }
    } catch (ex) {
      // The value of `ex.name` is changed from "NS_ERROR_DOM_SECURITY_ERR"
      // to "SecurityError" since Firefox 13.0. But Firefox is less than 9.0
      // in here, So it is ok to just rely on "NS_ERROR_DOM_SECURITY_ERR"
      if (ex.name === "NS_ERROR_DOM_SECURITY_ERR") {
        isLoaded = true
      }
    }
  }

  setTimeout(function() {
    if (isLoaded) {
      // Place callback here to give time for style rendering
      callback()
    }
    else {
      pollCss(node, callback)
    }
  }, 20)
}

function getCurrentScript() {
  if (currentlyAddingScript) {
    return currentlyAddingScript
  }

  // For IE6-9 browsers, the script onload event may not fire right
  // after the script is evaluated. Kris Zyp found that it
  // could query the script nodes and the one that is in "interactive"
  // mode indicates the current script
  // ref: http://goo.gl/JHfFW
  if (interactiveScript && interactiveScript.readyState === "interactive") {
    return interactiveScript
  }

  var scripts = head.getElementsByTagName("script")

  for (var i = scripts.length - 1; i >= 0; i--) {
    var script = scripts[i]
    if (script.readyState === "interactive") {
      interactiveScript = script
      return interactiveScript
    }
  }
}


// For Developers
seajs.request = request

/**
 * util-deps.js - The parser for dependencies
 * ref: tests/research/parse-dependencies/test.html
 */

var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g
var SLASH_RE = /\\\\/g

function parseDependencies(code) {
  var ret = []

  code.replace(SLASH_RE, "")
      .replace(REQUIRE_RE, function(m, m1, m2) {
        if (m2) {
          ret.push(m2)
        }
      })

  return ret
}


/**
 * module.js - The core of module loader
 */

var cachedMods = seajs.cache = {}
var anonymousMeta

var fetchingList = {}
var fetchedList = {}
var callbackList = {}

var STATUS = Module.STATUS = {
  // 1 - The `module.uri` is being fetched
  FETCHING: 1,
  // 2 - The meta data has been saved to cachedMods
  SAVED: 2,
  // 3 - The `module.dependencies` are being loaded
  LOADING: 3,
  // 4 - The module are ready to execute
  LOADED: 4,
  // 5 - The module is being executed
  EXECUTING: 5,
  // 6 - The `module.exports` is available
  EXECUTED: 6
}


function Module(uri, deps) {
  this.uri = uri
  this.dependencies = deps || []
  this.exports = null
  this.status = 0

  // Who depends on me
  this._waitings = {}

  // The number of unloaded dependencies
  this._remain = 0
}

// Resolve module.dependencies
Module.prototype.resolve = function() {
  var mod = this
  var ids = mod.dependencies
  var uris = []

  for (var i = 0, len = ids.length; i < len; i++) {
    uris[i] = Module.resolve(ids[i], mod.uri)
  }
  return uris
}

// Load module.dependencies and fire onload when all done
Module.prototype.load = function() {
  var mod = this

  // If the module is being loaded, just wait it onload call
  if (mod.status >= STATUS.LOADING) {
    return
  }

  mod.status = STATUS.LOADING

  // Emit `load` event for plugins such as combo plugin
  var uris = mod.resolve()
  emit("load", uris)

  var len = mod._remain = uris.length
  var m

  // Initialize modules and register waitings
  for (var i = 0; i < len; i++) {
    m = Module.get(uris[i])

    if (m.status < STATUS.LOADED) {
      // Maybe duplicate: When module has dupliate dependency, it should be it's count, not 1
      m._waitings[mod.uri] = (m._waitings[mod.uri] || 0) + 1
    }
    else {
      mod._remain--
    }
  }

  if (mod._remain === 0) {
    mod.onload()
    return
  }

  // Begin parallel loading
  var requestCache = {}

  for (i = 0; i < len; i++) {
    m = cachedMods[uris[i]]

    if (m.status < STATUS.FETCHING) {
      m.fetch(requestCache)
    }
    else if (m.status === STATUS.SAVED) {
      m.load()
    }
  }

  // Send all requests at last to avoid cache bug in IE6-9. Issues#808
  for (var requestUri in requestCache) {
    if (requestCache.hasOwnProperty(requestUri)) {
      requestCache[requestUri]()
    }
  }
}

// Call this method when module is loaded
Module.prototype.onload = function() {
  var mod = this
  mod.status = STATUS.LOADED

  if (mod.callback) {
    mod.callback()
  }

  // Notify waiting modules to fire onload
  var waitings = mod._waitings
  var uri, m

  for (uri in waitings) {
    if (waitings.hasOwnProperty(uri)) {
      m = cachedMods[uri]
      m._remain -= waitings[uri]
      if (m._remain === 0) {
        m.onload()
      }
    }
  }

  // Reduce memory taken
  delete mod._waitings
  delete mod._remain
}

// Fetch a module
Module.prototype.fetch = function(requestCache) {
  var mod = this
  var uri = mod.uri

  mod.status = STATUS.FETCHING

  // Emit `fetch` event for plugins such as combo plugin
  var emitData = { uri: uri }
  emit("fetch", emitData)
  var requestUri = emitData.requestUri || uri

  // Empty uri or a non-CMD module
  if (!requestUri || fetchedList[requestUri]) {
    mod.load()
    return
  }

  if (fetchingList[requestUri]) {
    callbackList[requestUri].push(mod)
    return
  }

  fetchingList[requestUri] = true
  callbackList[requestUri] = [mod]

  // Emit `request` event for plugins such as text plugin
  emit("request", emitData = {
    uri: uri,
    requestUri: requestUri,
    onRequest: onRequest,
    charset: isFunction(data.charset) ? data.charset(requestUri): data.charset,
    crossorigin: isFunction(data.crossorigin) ? data.crossorigin(requestUri) : data.crossorigin
  })

  if (!emitData.requested) {
    requestCache ?
        requestCache[emitData.requestUri] = sendRequest :
        sendRequest()
  }

  function sendRequest() {
    seajs.request(emitData.requestUri, emitData.onRequest, emitData.charset, emitData.crossorigin)
  }

  function onRequest() {
    delete fetchingList[requestUri]
    fetchedList[requestUri] = true

    // Save meta data of anonymous module
    if (anonymousMeta) {
      Module.save(uri, anonymousMeta)
      anonymousMeta = null
    }

    // Call callbacks
    var m, mods = callbackList[requestUri]
    delete callbackList[requestUri]
    while ((m = mods.shift())) m.load()
  }
}

// Execute a module
Module.prototype.exec = function () {
  var mod = this

  // When module is executed, DO NOT execute it again. When module
  // is being executed, just return `module.exports` too, for avoiding
  // circularly calling
  if (mod.status >= STATUS.EXECUTING) {
    return mod.exports
  }

  mod.status = STATUS.EXECUTING

  // Create require
  var uri = mod.uri

  function require(id) {
    return Module.get(require.resolve(id)).exec()
  }

  require.resolve = function(id) {
    return Module.resolve(id, uri)
  }

  require.async = function(ids, callback) {
    Module.use(ids, callback, uri + "_async_" + cid())
    return require
  }

  // Exec factory
  var factory = mod.factory

  var exports = isFunction(factory) ?
      factory(require, mod.exports = {}, mod) :
      factory

  if (exports === undefined) {
    exports = mod.exports
  }

  // Reduce memory leak
  delete mod.factory

  mod.exports = exports
  mod.status = STATUS.EXECUTED

  // Emit `exec` event
  emit("exec", mod)

  return exports
}

// Resolve id to uri
Module.resolve = function(id, refUri) {
  // Emit `resolve` event for plugins such as text plugin
  var emitData = { id: id, refUri: refUri }
  emit("resolve", emitData)

  return emitData.uri || seajs.resolve(emitData.id, refUri)
}

// Define a module
Module.define = function (id, deps, factory) {
  var argsLen = arguments.length

  // define(factory)
  if (argsLen === 1) {
    factory = id
    id = undefined
  }
  else if (argsLen === 2) {
    factory = deps

    // define(deps, factory)
    if (isArray(id)) {
      deps = id
      id = undefined
    }
    // define(id, factory)
    else {
      deps = undefined
    }
  }

  // Parse dependencies according to the module factory code
  if (!isArray(deps) && isFunction(factory)) {
    deps = parseDependencies(factory.toString())
  }

  var meta = {
    id: id,
    uri: Module.resolve(id),
    deps: deps,
    factory: factory
  }

  // Try to derive uri in IE6-9 for anonymous modules
  if (!meta.uri && doc.attachEvent) {
    var script = getCurrentScript()

    if (script) {
      meta.uri = script.src
    }

    // NOTE: If the id-deriving methods above is failed, then falls back
    // to use onload event to get the uri
  }

  // Emit `define` event, used in nocache plugin, seajs node version etc
  emit("define", meta)

  meta.uri ? Module.save(meta.uri, meta) :
      // Save information for "saving" work in the script onload event
      anonymousMeta = meta
}

// Save meta data to cachedMods
Module.save = function(uri, meta) {
  var mod = Module.get(uri)

  // Do NOT override already saved modules
  if (mod.status < STATUS.SAVED) {
    mod.id = meta.id || uri
    mod.dependencies = meta.deps || []
    mod.factory = meta.factory
    mod.status = STATUS.SAVED
  }
}

// Get an existed module or create a new one
Module.get = function(uri, deps) {
  return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps))
}

// Use function is equal to load a anonymous module
Module.use = function (ids, callback, uri) {
  var mod = Module.get(uri, isArray(ids) ? ids : [ids])

  mod.callback = function() {
    var exports = []
    var uris = mod.resolve()

    for (var i = 0, len = uris.length; i < len; i++) {
      exports[i] = cachedMods[uris[i]].exec()
    }

    if (callback) {
      callback.apply(global, exports)
    }

    delete mod.callback
  }

  mod.load()
}

// Load preload modules before all other modules
Module.preload = function(callback) {
  var preloadMods = data.preload
  var len = preloadMods.length

  if (len) {
    Module.use(preloadMods, function() {
      // Remove the loaded preload modules
      preloadMods.splice(0, len)

      // Allow preload modules to add new preload modules
      Module.preload(callback)
    }, data.cwd + "_preload_" + cid())
  }
  else {
    callback()
  }
}


// Public API

seajs.use = function(ids, callback) {
  Module.preload(function() {
    Module.use(ids, callback, data.cwd + "_use_" + cid())
  })
  return seajs
}

Module.define.cmd = {}
global.define = Module.define


// For Developers

seajs.Module = Module
data.fetchedList = fetchedList
data.cid = cid

seajs.require = function(id) {
  var mod = Module.get(Module.resolve(id))
  if (mod.status < STATUS.EXECUTING) {
    mod.onload()
    mod.exec()
  }
  return mod.exports
}


/**
 * config.js - The configuration for the loader
 */

var BASE_RE = /^(.+?\/)(\?\?)?(seajs\/)+/

// The root path to use for id2uri parsing
// If loaderUri is `http://test.com/libs/seajs/[??][seajs/1.2.3/]sea.js`, the
// baseUri should be `http://test.com/libs/`
data.base = (loaderDir.match(BASE_RE) || ["", loaderDir])[1]

// The loader directory
data.dir = loaderDir

// The current working directory
data.cwd = cwd

// The charset for requesting files
data.charset = "utf-8"

// The history of every config
data.history = {}

// The CORS options, Do't set CORS on default.
//data.crossorigin = undefined

// Modules that are needed to load before all other modules
data.preload = (function() {
  var plugins = []

  // Convert `seajs-xxx` to `seajs-xxx=1`
  // NOTE: use `seajs-xxx=1` flag in uri or cookie to preload `seajs-xxx`
  var str = location.search.replace(/(seajs-\w+)(&|$)/g, "$1=1$2")

  // Add cookie string
  str += " " + doc.cookie

  // Exclude seajs-xxx=0
  str.replace(/(seajs-\w+)=1/g, function(m, name) {
    plugins.push(name)
  })

  return plugins
})()

// data.alias - An object containing shorthands of module id
// data.paths - An object containing path shorthands in module id
// data.vars - The {xxx} variables in module id
// data.map - An array containing rules to map module uri
// data.debug - Debug mode. The default value is false

seajs.config = function(configData) {

  for (var key in configData) {
    var curr = configData[key]
    var prev = data[key]

    // record the config
    data.history[key] = data.history[key] || []
    data.history[key].push(clone(curr))

    // Merge object config such as alias, vars
    if (prev && isObject(prev)) {
      for (var k in curr) {
        prev[k] = curr[k]
      }
    }
    else {
      // Concat array config such as map, preload
      if (isArray(prev)) {
        curr = prev.concat(curr)
      }
      // Make sure that `data.base` is an absolute path
      else if (key === "base") {
        // Make sure end with "/"
        if (curr.slice(-1) !== "/") {
          curr += "/"
        }
        curr = addBase(curr)
      }

      // Set config
      data[key] = curr
    }
  }

  emit("config", configData)
  return seajs
}

// simple clone an object
function clone(obj) {
  if (isObject(obj)) {
    var copy = {}
    for (var k in obj) {
      copy[k] = obj[k]
    }
    return copy
  }
  return obj
}
})(this);
/*!5.0.0 Licensed MIT*/
/*
author:kooboy_li@163.com
loader:cmd
enables:

optionals:router
*/
define('magix5', () => {
    //VARS
    if (typeof DEBUG == 'undefined')
        window.DEBUG = true;
    let Counter = 0;
    let Empty = '';
    let Empty_Array = [];
    let Comma = ',';
    let Null = null;
    let Doc_Window = window;
    let Undefined = void Counter;
    let Doc_Document = document;
    let Timeout = setTimeout;
    let Encode = encodeURIComponent;
    let Value = 'value';
    let Tag_Static_Key = 'mxs';
    let Tag_View_Params_Key = 'mxv';
    let Hash_Key = '#';
    function Noop() { }
    let JSON_Stringify = JSON.stringify;
    let Doc_Body = Doc_Document.body;
    let Date_Now = Date.now;
    /*
        关于spliter
        出于安全考虑，使用不可见字符\u0000，然而，window手机上ie11有这样的一个问题：'\u0000'+"abc",结果却是一个空字符串，好奇特。
     */
    let Spliter = '\x1e';
    let Prototype = 'prototype';
    let Params = 'params';
    let Path = 'path';
    let MX_View = 'mx-view';
    let ToString = Object[Prototype].toString;
    let Type = o => ToString.call(o).slice(8, -1);
    let IsObject = o => Type(o) == 'Object';
    let IsArray = Array.isArray;
    let GUID = prefix => (prefix || 'mx_') + Counter++;
    let GetById = id => Doc_Document.getElementById(id);
    let MxGlobalView = GUID();
    let Mx_Cfg = {
        rootId: GUID(),
        defaultView: MxGlobalView,
        error(e) {
            throw e;
        }
    };
    let IsPrimitive = args => !args || typeof args != 'object';
    let UpdateData = (newData, oldData, keys, unchanged) => {
        let changed = 0, now, old, p;
        for (p in newData) {
            now = newData[p];
            old = oldData[p];
            if ((!IsPrimitive(now) || old !== now) && !Has(unchanged, p)) {
                keys[p] = 1;
                changed = 1;
            }
            oldData[p] = now;
        }
        return changed;
    };
    let NodeIn = (a, b, r) => {
        if (a && b) {
            r = a == b;
            if (!r) {
                try {
                    r = (b.compareDocumentPosition(a) & 16) == 16;
                }
                catch (_magix) { }
            }
        }
        return r;
    };
    let { assign: Assign, keys: Keys, hasOwnProperty: HasProp } = Object;
    let Header = Doc_Document.head;
    let Temp = Doc_Document.createElement('div');
    let GA = Temp.getAttribute;
    let GetAttribute = (node, attr) => GA.call(node, attr);
    let ApplyStyle = (key, css) => {
        if (DEBUG && IsArray(key)) {
            for (let i = 0; i < key.length; i += 2) {
                ApplyStyle(key[i], key[i + 1]);
            }
            return;
        }
        if (css && !ApplyStyle[key]) {
            ApplyStyle[key] = 1;
            if (DEBUG) {
                if (key.indexOf('$throw_') === 0) {
                    throw new Error(css);
                }
                Temp.innerHTML = `<style id="${key}">${css}`;
                Header.appendChild(Temp.firstChild);
            }
            else {
                Temp.innerHTML = `<style>${css}`;
                Header.appendChild(Temp.firstChild);
            }
        }
    };
    let ToTry = (fns, args, context, r, e) => {
        args = args || Empty_Array;
        if (!IsArray(fns))
            fns = [fns];
        if (!IsArray(args))
            args = [args];
        for (e of fns) {
            try {
                r = e && e.apply(context, args);
            }
            catch (x) {
                Mx_Cfg.error(x);
            }
        }
        return r;
    };
    let Has = (owner, prop) => owner && HasProp.call(owner, prop);
    let TranslateData = (data, params) => {
        let p, val;
        if (IsPrimitive(params)) {
            p = params + Empty;
            if (p[0] == Spliter && data.has(p)) {
                params = data.get(p);
            }
        }
        else {
            for (p in params) {
                val = params[p];
                val = TranslateData(data, val);
                params[p] = val;
            }
        }
        return params;
    };
    let CacheSort = (a, b) => b['a'] - a['a'] || b['b'] - a['b'];
    /**
     * Magix.Cache 类
     * @name Cache
     * @constructor
     * @param {Integer} [max] 缓存最大值，默认20
     * @param {Integer} [buffer] 缓冲区大小，默认5
     * @param {Function} [remove] 当缓存的元素被删除时调用
     * @example
     * let c = new Magix.cache(5,2);//创建一个可缓存5个，且缓存区为2个的缓存对象
     * c.set('key1',{});//缓存
     * c.get('key1');//获取
     * c.del('key1');//删除
     * c.has('key1');//判断
     * //注意：缓存通常配合其它方法使用，在Magix中，对路径的解析等使用了缓存。在使用缓存优化性能时，可以达到节省CPU和内存的双赢效果
     */
    function Cache(max, buffer, remove, me) {
        me = this;
        me['a'] = [];
        me['b'] = buffer || 5; //buffer先取整，如果为0则再默认5
        me['c'] = me['b'] + (max || 20);
        me['d'] = remove;
    }
    Assign(Cache[Prototype], {
        /**
         * @lends Cache#
         */
        /**
         * 获取缓存的值
         * @param  {String} key
         * @return {Object} 初始设置的缓存对象
         */
        get(key) {
            let me = this;
            let c = me['a'];
            let r = c[Spliter + key];
            if (r) {
                r['a']++;
                r['b'] = Counter++;
                r = r['c'];
            }
            return r;
        },
        /**
         * 设置缓存
         * @param {String} key 缓存的key
         * @param {Object} value 缓存的对象
         */
        set(okey, value) {
            let me = this;
            let c = me['a'];
            let key = Spliter + okey;
            let r = c[key];
            let t = me['b'];
            if (!r) {
                if (c.length >= me['c']) {
                    c.sort(CacheSort);
                    while (t--) {
                        r = c.pop();
                        //为什么要判断r['a']>0,考虑这样的情况：用户设置a,b，主动删除了a,重新设置a,数组中的a原来指向的对象残留在列表里，当排序删除时，如果不判断则会把新设置的删除，因为key都是a
                        //
                        if (r['a'] > 0)
                            me.del(r.o); //如果没有引用，则删除
                    }
                }
                r = {
                    'd': okey
                };
                c.push(r);
                c[key] = r;
            }
            r['c'] = value;
            r['a'] = 1;
            r['b'] = Counter++;
        },
        /**
         * 删除缓存
         * @param  {String} key 缓存key
         */
        del(k) {
            k = Spliter + k;
            let c = this['a'];
            let r = c[k], m = this['d'];
            if (r) {
                r['a'] = -1;
                r['c'] = Empty;
                delete c[k];
                if (m) {
                    ToTry(m, r['d']);
                }
            }
        },
        /**
         * 检测缓存中是否有给定的key
         * @param  {String} key 缓存key
         * @return {Boolean}
         */
        has(k) {
            return Has(this['a'], Spliter + k);
        }
    });
    let EventDefaultOptions = {
        bubbles: true,
        cancelable: true
    };
    //https://www.w3.org/TR/dom/#interface-event
    let DispatchEvent = (element, type, data) => {
        let e = new Event(type, EventDefaultOptions);
        Assign(e, data);
        element.dispatchEvent(e);
    };
    let AttachEventHandlers = [];
    let AddEventListener = (element, type, fn, viewId, eventOptions, view) => {
        let h = {
            'a': viewId,
            'b': fn,
            'c': type,
            'd': element,
            'e'(e) {
                if (viewId) {
                    ToTry(fn, e, view);
                }
                else {
                    fn(e);
                }
            }
        };
        AttachEventHandlers.push(h);
        element.addEventListener(type, h['e'], eventOptions);
    };
    let RemoveEventListener = (element, type, cb, viewId, eventOptions) => {
        for (let c, i = AttachEventHandlers.length; i--;) {
            c = AttachEventHandlers[i];
            if (c['c'] == type &&
                c['a'] == viewId &&
                c['d'] == element &&
                c['b'] === cb) {
                AttachEventHandlers.splice(i, 1);
                element.removeEventListener(type, c['e'], eventOptions);
                break;
            }
        }
    };
    let Path_Trim_Params_Reg = /[#?].*$/;
    let Path_Params_Reg = /([^=&?\/#]+)=?([^&#?]*)/g;
    let Path_Is_Param_Reg = /(?!^)=|&/;
    let PathToObject = new Cache();
    let ParamsObjectTemp;
    let ParamsFn = (match, name, value) => {
        try {
            value = decodeURIComponent(value);
        }
        catch (_magix) {
        }
        ParamsObjectTemp[name] = value;
    };
    /**
     * 把路径字符串转换成对象
     * @param  {String} path 路径字符串
     * @return {Object} 解析后的对象
     * @example
     * let obj = Magix.parseUri('/xxx/?a=b&c=d');
     * // obj = {path:'/xxx/',params:{a:'b',c:'d'}}
     */
    let ParseUri = path => {
        //把形如 /xxx/?a=b&c=d 转换成对象 {path:'/xxx/',params:{a:'b',c:'d'}}
        //1. /xxx/a.b.c.html?a=b&c=d  path /xxx/a.b.c.html
        //2. /xxx/?a=b&c=d  path /xxx/
        //3. /xxx/#?a=b => path /xxx/
        //4. /xxx/index.html# => path /xxx/index.html
        //5. /xxx/index.html  => path /xxx/index.html
        //6. /xxx/#           => path /xxx/
        //7. a=b&c=d          => path ''
        //8. /s?src=b#        => path /s params:{src:'b'}
        //9. a=YT3O0sPH1No=   => path '' params:{a:'YT3O0sPH1No='}
        //10.a=YT3O0sPH1No===&b=c => path '' params:{a:'YT3O0sPH1No===',b:'c'}
        //11. ab?a&b          => path ab  params:{a:'',b:''}
        //12. a=b&c           => path '' params:{a:'b',c:''}
        //13. =abc            => path '=abc'
        //14. ab=             => path '' params:{ab:''}
        //15. a&b             => path '' params:{a:'',b:''}
        let r = PathToObject.get(path), pathname;
        if (!r) {
            ParamsObjectTemp = {};
            pathname = path.replace(Path_Trim_Params_Reg, Empty);
            if (path == pathname && Path_Is_Param_Reg.test(pathname))
                pathname = Empty; //考虑 YT3O0sPH1No= base64后的pathname
            path.replace(pathname, Empty).replace(Path_Params_Reg, ParamsFn);
            PathToObject.set(path, r = {
                a: pathname,
                b: ParamsObjectTemp
            });
        }
        return {
            path: r.a,
            params: Assign({}, r.b)
        };
    };
    /**
     * 转换成字符串路径
     * @param  {String} path 路径
     * @param {Object} params 参数对象
     * @param {Object} [keo] 保留空白值的对象
     * @return {String} 字符串路径
     * @example
     * let str = Magix.toUri('/xxx/',{a:'b',c:'d'});
     * // str == /xxx/?a=b&c=d
     *
     * let str = Magix.toUri('/xxx/',{a:'',c:2});
     *
     * // str == /xxx/?a=&c=2
     *
     * let str = Magix.toUri('/xxx/',{a:'',c:2},{c:1});
     *
     * // str == /xxx/?c=2
     * let str = Magix.toUri('/xxx/',{a:'',c:2},{a:1,c:1});
     *
     * // str == /xxx/?a=&c=2
     */
    let ToUri = (path, params, keo) => {
        let arr = [], v, p, f;
        for (p in params) {
            v = params[p] + Empty;
            if (!keo || v || Has(keo, p)) {
                v = Encode(v);
                arr.push(f = p + '=' + v);
            }
        }
        if (f) {
            path += (path && (~path.indexOf('?') ? '&' : '?')) + arr.join('&');
        }
        return path;
    };
    let ToMap = (list, key) => {
        let e, map = {};
        if (list) {
            for (e of list) {
                map[(key && e) ? e[key] : e] = key ? e : (map[e] | 0) + 1; //对于简单数组，采用累加的方式，以方便知道有多少个相同的元素
            }
        }
        return map;
    };
    let ParseExprCache = new Cache();
    let ParseExpr = (expr, data, result) => {
        if (ParseExprCache.has(expr)) {
            result = ParseExprCache.get(expr);
        }
        else {
            //jshint evil:true
            result = ToTry(Function(`return ${expr}`));
            if (expr.indexOf(Spliter) > -1) {
                TranslateData(data, result);
            }
            else {
                ParseExprCache.set(expr, result);
            }
        }
        if (DEBUG) {
            result = Safeguard(result);
        }
        return result;
    };
    let MxDefaultViewEntity;
    let Async_Require = (name, fn) => {
        if (name) {
            let a = [], n;
            if (MxGlobalView == name) {
                if (!MxDefaultViewEntity) {
                    MxDefaultViewEntity = View.extend();
                }
                fn(MxDefaultViewEntity);
            }
            else /*if (Doc_Window.seajs)*/ {
                seajs.use(name, (...g) => {
                    for (let m of g) {
                        a.push(m && m.__esModule && m.default || m);
                    }
                    if (fn)
                        fn(...a);
                });
            } /*else {
                if (!IsArray(name)) name = [name];
                for (n of name) {
                    n = require(n);
                    a.push(n && n.__esModule && n.default || n);
                }
                if (fn) fn(...a);
            }*/
        }
        else {
            fn();
        }
    };
    function T() { }
    let Extend = (ctor, base, props, statics, cProto) => {
        //bProto.constructor = base;
        T[Prototype] = base[Prototype];
        cProto = new T();
        Assign(cProto, props);
        Assign(ctor, statics);
        cProto.constructor = ctor;
        ctor[Prototype] = cProto;
        return ctor;
    };
    let Safeguard = data => data;
    if (DEBUG && window.Proxy) {
        let ProxiesPool = new Map();
        Safeguard = (data, getter, setter, root) => {
            if (IsPrimitive(data)) {
                return data;
            }
            let build = (prefix, o) => {
                let key = getter + '\x01' + setter;
                let cached = ProxiesPool.get(o);
                if (cached && cached.key == key) {
                    return cached.entity;
                }
                if (o['\x1e_sf_\x1e']) {
                    return o;
                }
                let entity = new Proxy(o, {
                    set(target, property, value) {
                        if (!setter && !prefix) {
                            throw new Error('avoid writeback,key: ' + prefix + property + ' value:' + value + ' more info: https://github.com/thx/magix/issues/38');
                        }
                        target[property] = value;
                        if (setter) {
                            setter(prefix + property, value);
                        }
                        return true;
                    },
                    get(target, property) {
                        if (property == '\x1e_sf_\x1e') {
                            return true;
                        }
                        let out = target[property];
                        if (!prefix && getter) {
                            getter(property);
                        }
                        if (!root && Has(target, property) &&
                            (IsArray(out) || IsObject(out))) {
                            return build(prefix + property + '.', out);
                        }
                        return out;
                    }
                });
                ProxiesPool.set(o, {
                    key,
                    entity
                });
                return entity;
            };
            return build('', data);
        };
    }
    /**
 * 多播事件对象
 * @name Event
 * @namespace
 */
    let MxEvent = {
        /**
         * @lends MEvent
         */
        /**
         * 触发事件
         * @param {String} name 事件名称
         * @param {Object} data 事件对象
         * @param {Boolean} [remove] 事件触发完成后是否移除这个事件的所有监听
         */
        fire(name, data) {
            let key = Spliter + name, me = this, list = me[key], idx = 0, len, t;
            if (!data)
                data = {};
            data.type = name;
            if (list) {
                for (len = list.length; idx < len; idx++) {
                    t = list[idx];
                    if (t.f) {
                        t.x = 1;
                        ToTry(t.f, data, me);
                        t.x = Empty;
                    }
                    else if (!t.x) {
                        list.splice(idx--, 1);
                        len--;
                    }
                }
            }
            list = me[`on${name}`];
            if (list)
                ToTry(list, data, me);
            return me;
        },
        /**
         * 绑定事件
         * @param {String} name 事件名称
         * @param {Function} fn 事件处理函数
         * @example
         * let T = Magix.mix({},Magix.Event);
         * T.on('done',function(e){
         *     alert(1);
         * });
         * T.on('done',function(e){
         *     alert(2);
         *     T.off('done',arguments.callee);
         * });
    
         * T.fire('done',{data:'test'});
         * T.fire('done',{data:'test2'});
         */
        on(name, f) {
            let me = this;
            let key = Spliter + name;
            let list = me[key] || (me[key] = []);
            list.push({
                f
            });
            return me;
        },
        /**
         * 解除事件绑定
         * @param {String} name 事件名称
         * @param {Function} [fn] 事件处理函数
         */
        off(name, fn) {
            let key = Spliter + name, me = this, list = me[key], t;
            if (fn) {
                if (list) {
                    for (t of list) {
                        if (t.f == fn) {
                            t.f = Empty;
                            break;
                        }
                    }
                }
            }
            else {
                delete me[key];
                delete me[`on${name}`];
            }
            return me;
        }
    };
    let State_AppData = {};
    /**
     * 可观察的内存数据对象
     * @name State
     * @namespace
     * @borrows Event.on as on
     * @borrows Event.fire as fire
     * @borrows Event.off as off
     * @beta
     * @module router
     */
    let State = Assign({
        /**
         * @lends State
         */
        /**
         * 从Magix.State中获取数据
         * @param {String} [key] 数据key
         * @return {Object}
         */
        get(key) {
            let r = key ? State_AppData[key] : State_AppData;
            return r;
        },
        /**
         * 设置数据
         * @param {Object} data 数据对象
         */
        set(data) {
            Assign(State_AppData, data);
        }
    }, MxEvent);
    let Vframe_RootVframe;
    let Vframe_Vframes = {};
    let Vframe_TranslateQuery = (pId, src, params, pVf) => {
        if (src.indexOf(Spliter) > 0 &&
            (pVf = Vframe_Vframes[pId])) {
            TranslateData(pVf['a']['a'], params);
        }
    };
    /**
     * 获取根vframe;
     * @return {Vframe}
     * @private
     */
    let Vframe_Root = (rootId, e) => {
        if (!Vframe_RootVframe) {
            rootId = Mx_Cfg.rootId;
            e = GetById(rootId);
            if (!e) {
                e = Doc_Body;
            }
            Vframe_RootVframe = new Vframe(e);
        }
        return Vframe_RootVframe;
    };
    let Vframe_AddVframe = (id, vframe) => {
        if (!Has(Vframe_Vframes, id)) {
            Vframe_Vframes[id] = vframe;
            Vframe.fire('add', {
                vframe
            });
        }
    };
    let Vframe_RemoveVframe = (id, vframe) => {
        vframe = Vframe_Vframes[id];
        if (vframe) {
            delete Vframe_Vframes[id];
            vframe.root['a'] = 0;
            Vframe.fire('remove', {
                vframe
            });
            vframe.id = vframe.root = vframe.pId = vframe['b'] = Null; //清除引用,防止被移除的view内部通过setTimeout之类的异步操作有关的界面，影响真正渲染的view
            if (DEBUG) {
                let nodes = Doc_Document.querySelectorAll('#' + id);
                if (nodes.length > 1) {
                    Mx_Cfg.error(Error(`remove vframe error. dom id:"${id}" duplicate`));
                }
            }
        }
    };
    let Vframe_RunInvokes = (vf, list, o) => {
        list = vf['c']; //invokeList
        while (list.length) {
            o = list.shift();
            if (!o.r) { //remove
                vf.invoke(o.n, o.a); //name,arguments
            }
            delete list[o.k]; //key
        }
    };
    let Vframe_GetVfId = node => node['b'] || (node['b'] = GUID());
    /**
     * Vframe类
     * @name Vframe
     * @class
     * @constructor
     */
    function Vframe(root, pId) {
        let me = this;
        let vfId = Vframe_GetVfId(root);
        me.id = vfId;
        me.root = root;
        me.pId = pId;
        me['b'] = {}; //childrenMap
        me['d'] = 1; //signature
        me['c'] = []; //invokeList
        Vframe_AddVframe(vfId, me);
    }
    Assign(Vframe, {
        /**
         * @lends Vframe
         */
        /**
         * 获取所有的vframe对象
         * @return {Object}
         */
        all() {
            return Vframe_Vframes;
        },
        byId(id) {
            return Vframe_Vframes[id];
        },
        /**
         * 根据vframe的id获取vframe对象
         * @param {String} id vframe的id
         * @return {Vframe|undefined} vframe对象
         */
        byNode(node) {
            return Vframe_Vframes[node['b']];
        }
    }, MxEvent);
    Assign(Vframe[Prototype], {
        /**
         * @lends Vframe#
         */
        /**
         * 加载对应的view
         * @param {String} viewPath 形如:app/views/home?type=1&page=2 这样的view路径
         * @param {Object|Null} [viewInitParams] 调用view的init方法时传递的参数
         */
        mountView(viewPath, viewInitParams /*,keepPreHTML*/) {
            let me = this;
            let { id, root, pId } = me;
            let po, sign, view, params, ctors;
            if (!me['e'] && root) { //alter
                me['e'] = 1;
                me['f'] = root.innerHTML;
            }
            me.unmountView();
            if (root && viewPath) {
                po = ParseUri(viewPath);
                view = po[Path];
                me[Path] = viewPath;
                params = po[Params];
                Vframe_TranslateQuery(pId, viewPath, params);
                me['g'] = view;
                Assign(params, viewInitParams);
                sign = me['d'];
                Async_Require(view, TView => {
                    if (sign == me['d']) { //有可能在view载入后，vframe已经卸载了
                        if (!TView) {
                            return Mx_Cfg.error(Error(`${id} cannot load:${view}`));
                        }
                        ctors = View_Prepare(TView);
                        view = new TView(id, root, me, params, ctors);
                        if (DEBUG) {
                            let viewProto = TView.prototype;
                            let importantProps = {
                                id: 1,
                                owner: 1,
                                'b': 1,
                                'c': 1,
                                'd': 1,
                                'e': 1,
                                'a': 1,
                                'f': 1
                            };
                            for (let p in view) {
                                if (Has(view, p) && viewProto[p]) {
                                    throw new Error(`avoid write ${p} at file ${viewPath}!`);
                                }
                            }
                            view = Safeguard(view, null, (key, value) => {
                                if (Has(viewProto, key) ||
                                    (Has(importantProps, key) &&
                                        (key != 'd' || !isFinite(value)) &&
                                        ((key != 'owner' && key != 'root') || value !== Null))) {
                                    throw new Error(`avoid write ${key} at file ${viewPath}!`);
                                }
                            }, true);
                        }
                        me['a'] = view;
                        View_DelegateEvents(view);
                        ToTry(view.init, params, view);
                        view['g']();
                        if (!view.tmpl) { //无模板
                            me['e'] = 0; //不会修改节点，因此销毁时不还原
                            if (!view['h']) {
                                view.endUpdate();
                            }
                        }
                    }
                });
            }
        },
        /**
         * 销毁对应的view
         */
        unmountView() {
            let me = this;
            let { 'a': v, id, root } = me;
            me['c'] = [];
            if (v) {
                me.unmountZone();
                me['a'] = 0; //unmountView时，尽可能早的删除vframe上的$v对象，防止$v销毁时，再调用该 vfrmae的类似unmountZone方法引起的多次created
                if (v['d'] > 0) {
                    v['d'] = 0;
                    v.fire('destroy');
                    v.off('destroy');
                    View_DestroyAllResources(v, 1);
                    View_DelegateEvents(v, 1);
                    v.owner = v.root = Null;
                }
                v['d']--;
                if (root && me['e'] /*&&!keepPreHTML*/) { //如果$v本身是没有模板的，也需要把节点恢复到之前的状态上：只有保留模板且$v有模板的情况下，这条if才不执行，否则均需要恢复节点的html，即$v安装前什么样，销毁后把节点恢复到安装前的情况
                    root.innerHTML = me['f'];
                }
            }
            me['d']++; //增加signature，阻止相应的回调，见mountView
        },
        /**
         * 加载vframe
         * @param  {String} id             节点id
         * @param  {String} viewPath       view路径
         * @param  {Object} [viewInitParams] 传递给view init方法的参数
         * @return {Vframe} vframe对象
         * @example
         * // html
         * // &lt;div id="magix_vf_defer"&gt;&lt;/div&gt;
         *
         *
         * //js
         * view.owner.mountVframe('magix_vf_defer','app/views/list',{page:2})
         * //注意：动态向某个节点渲染view时，该节点无须是vframe标签
         */
        mountVframe(node, viewPath, viewInitParams) {
            let me = this, vf, id = me.id, c = me['b'];
            let vfId = Vframe_GetVfId(node);
            vf = Vframe_Vframes[vfId];
            if (!vf) {
                if (!Has(c, vfId)) { //childrenMap,当前子vframe不包含这个id
                    me['h'] = 0; //childrenList 清空缓存的子列表
                }
                c[vfId] = vfId; //map
                vf = new Vframe(node, id);
            }
            vf.mountView(viewPath, viewInitParams);
            return vf;
        },
        /**
         * 加载某个区域下的view
         * @param {HTMLElement|String} zoneId 节点对象或id
         * @example
         * // html
         * // &lt;div id="zone"&gt;
         * //   &lt;div mx-view="path/to/v1"&gt;&lt;/div&gt;
         * // &lt;/div&gt;
         *
         * view.onwer.mountZone('zone');//即可完成zone节点下的view渲染
         */
        mountZone(zone) {
            let me = this, it;
            zone = zone || me.root;
            let vframes = zone.querySelectorAll(`[${MX_View}]`);
            /*
                body(#mx-root)
                    div(mx-vframe=true,mx-view='xx')
                        div(mx-vframe=true,mx-view=yy)
                这种结构，自动构建父子关系，
                根结点渲染，获取到子列表[div(mx-view=xx)]
                    子列表渲染，获取子子列表的子列表
                        加入到忽略标识里
                会导致过多的dom查询
    
                现在使用的这种，无法处理这样的情况，考虑到项目中几乎没出现过这种情况，先采用高效的写法
                上述情况一般出现在展现型页面，dom结构已经存在，只是附加上js行为
                不过就展现来讲，一般是不会出现嵌套的情况，出现的话，把里面有层级的vframe都挂到body上也未尝不可，比如brix2.0
             */
            //me['i'] = 1; //hold fire creted
            //me.unmountZone(zoneId, 1); 不去清理，详情见：https://github.com/thx/magix/issues/27
            for (it of vframes) {
                if (!it['a']) { //防止嵌套的情况下深层的view被反复实例化
                    it['a'] = 1;
                    me.mountVframe(it, GetAttribute(it, MX_View));
                }
            }
            //me['i'] = 0;
        },
        /**
         * 销毁vframe
         * @param  {String} [id]      节点id
         */
        unmountVframe(node, isVframeId) {
            let me = this, vf, pId;
            node = node ? me['b'][isVframeId ? node : node['b']] : me.id;
            vf = Vframe_Vframes[node];
            if (vf) {
                vf.unmountView();
                pId = vf.pId;
                Vframe_RemoveVframe(node);
                vf = Vframe_Vframes[pId];
                if (vf && Has(vf['b'], node)) { //childrenMap
                    delete vf['b'][node]; //childrenMap
                    vf['h'] = 0;
                }
            }
        },
        /**
         * 销毁某个区域下面的所有子vframes
         * @param {HTMLElement|String} [zoneId] 节点对象或id
         */
        unmountZone(root) {
            let me = this;
            let p, vf, unmount;
            for (p in me['b']) {
                if (root) {
                    vf = Vframe_Vframes[p];
                    unmount = vf && NodeIn(vf.root, root);
                }
                else {
                    unmount = 1;
                }
                if (unmount) {
                    me.unmountVframe(p, 1);
                }
            }
        },
        /**
         * 获取父vframe
         * @param  {Integer} [level] 向上查找层级，默认1,取当前vframe的父级
         * @return {Vframe|undefined}
         * @beta
         * @module linkage
         */
        parent(level, vf) {
            vf = this;
            level = (level >>> 0) || 1;
            while (vf && level--) {
                vf = Vframe_Vframes[vf.pId];
            }
            return vf;
        },
        /**
         * 获取当前vframe的所有子vframe的id。返回数组中，vframe在数组中的位置并不固定
         * @return {Array[String]}
         * @beta
         * @module linkage
         * @example
         * let children = view.owner.children();
         * console.log(children);
         */
        children(me) {
            me = this;
            return me['h'] || (me['h'] = Keys(me['b']));
        },
        /**
         * 调用view的方法
         * @param  {String} name 方法名
         * @param  {Array} [args] 参数
         * @return {Object}
         * @beta
         * @module linkage
         * @example
         * // html
         * // &lt;div&gt; mx-view="path/to/v1" id="test"&gt;&lt;/div&gt;
         * let vf = Magix.Vframe.get('test');
         * vf.invoke('methodName',['args1','agrs2']);
         */
        invoke(name, args) {
            let result;
            let vf = this, view, fn, o, list = vf['c'], key;
            if ((view = vf['a']) && view['h']) { //view rendered
                result = (fn = view[name]) && ToTry(fn, args, view);
            }
            else {
                o = list[key = Spliter + name];
                if (o) {
                    o.r = args === o.a; //参数一样，则忽略上次的
                }
                o = {
                    n: name,
                    a: args,
                    k: key
                };
                list.push(o);
                list[key] = o;
            }
            return result;
        }
    });
    /*
    dom event处理思路

    性能和低资源占用高于一切，在不特别影响编程体验的情况下，向性能和资源妥协

    1.所有事件代理到body上
    2.优先使用原生冒泡事件，使用mouseover+Magix.inside代替mouseenter
        'over<mouseover>':function(e){
            if(!Magix.inside(e.relatedTarget,e.eventTarget)){
                //enter
            }
        }
    3.事件支持嵌套，向上冒泡
    4.如果同一节点上同时绑定了mx-event和选择器事件，如
        <div data-menu="true" mx-click="clickMenu()"></div>

        'clickMenu<click>'(e){
            console.log('direct',e);
        },
        '$div[data-menu="true"]<click>'(e){
            console.log('selector',e);
        }

        那么先派发选择器绑定的事件再派发mx-event绑定的事件


    5.在当前view根节点上绑定事件，目前只能使用选择器绑定，如
        '$<click>'(e){
            console.log('view root click',e);
        }
    
    range:{
        app:{
            20:{
                mouseover:1,
                mousemove:1
            }
        }
    }
    view:{
        linkage:{
            40:1
        }
    }
 */
    let Body_EvtInfoCache = new Cache(30, 10);
    let Body_EvtInfoReg = /(?:([\w\-]+)\x1e)?([^(]+)\(([\s\S]*)?\)/;
    let Body_RootEvents = {};
    let Body_SearchSelectorEvents = {};
    let Body_FindVframeInfo = (current, eventType) => {
        let vf, tempId, selectorObject, eventSelector, eventInfos = [], begin = current, info = GetAttribute(current, `mx-${eventType}`), match, view, vfs, selectorVfId, backtrace = 0;
        if (info) {
            match = Body_EvtInfoCache.get(info);
            if (!match) {
                match = info.match(Body_EvtInfoReg) || Empty_Array;
                match = {
                    v: match[1],
                    n: match[2],
                    i: match[3]
                };
                Body_EvtInfoCache.set(info, match);
            }
            match = Assign({}, match, { r: info });
        }
        //如果有匹配但没有处理的vframe或者事件在要搜索的选择器事件里
        if ((match && !match.v) || Body_SearchSelectorEvents[eventType]) {
            selectorVfId = begin['c'];
            if (!selectorVfId) { //先找最近的vframe
                vfs = [begin];
                while (begin != Doc_Body && (begin = begin.parentNode)) {
                    if (Vframe_Vframes[tempId = begin['b']] ||
                        (tempId = begin['c'])) {
                        selectorVfId = tempId;
                        break;
                    }
                    vfs.push(begin);
                }
                if (selectorVfId) {
                    for (info of vfs) {
                        info['c'] = selectorVfId;
                    }
                }
            }
            if (selectorVfId) { //从最近的vframe向上查找带有选择器事件的view
                begin = current['b'];
                if (Vframe_Vframes[begin]) {
                    /*
                        如果当前节点是vframe的根节点，则把当前的vf置为该vframe
                        该处主要处理这样的边界情况
                        <mx-vrame src="./test" mx-click="parent()"/>
                        //.test.js
                        export default Magix.View.extend({
                            '$<click>'(){
                                console.log('test clicked');
                            }
                        });
        
                        当click事件发生在mx-vframe节点上时，要先派发内部通过选择器绑定在根节点上的事件，然后再派发外部的事件
                    */
                    backtrace = selectorVfId = begin;
                }
                do {
                    vf = Vframe_Vframes[selectorVfId];
                    if (vf && (view = vf['a'])) {
                        selectorObject = view['i'];
                        eventSelector = selectorObject[eventType];
                        if (eventSelector) {
                            for (begin = eventSelector.length; begin--;) {
                                tempId = eventSelector[begin];
                                selectorObject = {
                                    r: tempId,
                                    v: selectorVfId,
                                    n: tempId
                                };
                                if (tempId) {
                                    /*
                                        事件发生时，做为临界的根节点只能触发`$`绑定的事件，其它事件不能触发
                                    */
                                    if (!backtrace &&
                                        current.matches(tempId)) {
                                        eventInfos.push(selectorObject);
                                    }
                                }
                                else if (backtrace) {
                                    eventInfos.unshift(selectorObject);
                                }
                            }
                        }
                        //防止跨view选中，到带模板的view时就中止或未指定
                        if (view.tmpl && !backtrace) {
                            break; //带界面的中止
                        }
                        backtrace = 0;
                    }
                } while (vf && (selectorVfId = vf.pId));
            }
        }
        if (match) {
            eventInfos.push(match);
        }
        return eventInfos;
    };
    let Body_DOMEventProcessor = domEvent => {
        let { target, type } = domEvent;
        let eventInfos;
        let ignore;
        let vframe, view, eventName, fn;
        let lastVfId;
        let params, arr = [];
        while (target != Doc_Body) {
            if (domEvent.cancelBubble ||
                (ignore = target['d']) && ignore[type]) {
                break;
            }
            arr.push(target);
            eventInfos = Body_FindVframeInfo(target, type);
            if (eventInfos.length) {
                arr = [];
                for (let { v, r, n, i } of eventInfos) {
                    if (!v && DEBUG) {
                        return Mx_Cfg.error(Error(`bad ${type}:${r}`));
                    }
                    if (lastVfId != v) {
                        if (lastVfId && domEvent.cancelBubble) {
                            break;
                        }
                        lastVfId = v;
                    }
                    vframe = Vframe_Vframes[v];
                    view = vframe && vframe['a'];
                    if (view) {
                        if (view['h']) {
                            eventName = n + Spliter + type;
                            fn = view[eventName];
                            if (fn) {
                                domEvent.eventTarget = target;
                                params = i ? ParseExpr(i, view['a']) : {};
                                domEvent[Params] = params;
                                ToTry(fn, domEvent, view);
                            }
                            if (DEBUG) {
                                if (!fn) { //检测为什么找不到处理函数
                                    if (eventName[0] == '\u001f') {
                                        console.error('use view.wrapEvent wrap your html');
                                    }
                                    else {
                                        console.error('can not find event processor:' + n + '<' + type + '> from view:' + vframe.path);
                                    }
                                }
                            }
                        }
                    }
                    else { //如果处于删除中的事件触发，则停止事件的传播
                        domEvent.stopPropagation();
                    }
                    if (DEBUG) {
                        if (!view && view !== 0) { //销毁
                            console.error('can not find vframe:' + v);
                        }
                    }
                }
            }
            target = target.parentNode || Doc_Body;
        }
        for (lastVfId of arr) {
            ignore = lastVfId['d'] || (lastVfId['d'] = {});
            ignore[type] = 1;
        }
    };
    let Body_DOMEventBind = (type, searchSelector, remove) => {
        let counter = Body_RootEvents[type] | 0;
        let offset = (remove ? -1 : 1), fn = remove ? RemoveEventListener : AddEventListener;
        if (!counter || remove === counter) { // remove=1  counter=1
            fn(Doc_Body, type, Body_DOMEventProcessor);
        }
        Body_RootEvents[type] = counter + offset;
        if (searchSelector) { //记录需要搜索选择器的事件
            Body_SearchSelectorEvents[type] = (Body_SearchSelectorEvents[type] | 0) + offset;
        }
    };
    if (DEBUG) {
        var Updater_CheckInput = (view, html) => {
            if (/<(?:input|textarea|select)/i.test(html)) {
                let url = ParseUri(view.owner.path);
                let found = false, hasParams = false;
                for (let p in url.params) {
                    hasParams = true;
                    if (url.params[p][0] == Spliter) {
                        found = true;
                    }
                }
                if (hasParams && !found) {
                    console.warn('[!use at to pass parameter] path:' + view.owner.path + ' at ' + (view.owner.parent().path));
                }
            }
        };
    }
    let Updater_EM = {
        '&': 'amp',
        '<': 'lt',
        '>': 'gt',
        '"': '#34',
        '\'': '#39',
        '\`': '#96'
    };
    let Updater_ER = /[&<>"'\`]/g;
    let Updater_Safeguard = v => Empty + (v == Null ? Empty : v);
    let Updater_EncodeReplacer = m => `&${Updater_EM[m]};`;
    let Updater_Encode = v => Updater_Safeguard(v).replace(Updater_ER, Updater_EncodeReplacer);
    let Updater_UM = {
        '!': '%21',
        '\'': '%27',
        '(': '%28',
        ')': '%29',
        '*': '%2A'
    };
    let Updater_URIReplacer = m => Updater_UM[m];
    let Updater_URIReg = /[!')(*]/g;
    let Updater_EncodeURI = v => Encode(Updater_Safeguard(v)).replace(Updater_URIReg, Updater_URIReplacer);
    let Updater_QR = /[\\'"]/g;
    let Updater_EncodeQ = v => Updater_Safeguard(v).replace(Updater_QR, '\\$&');
    let Updater_Ref = ($$, v, k) => {
        if (!$$.has(v)) {
            k = Spliter + $$.size;
            $$.set(v, k);
            $$.set(k, v);
        }
        return $$.get(v);
    };
    let Updater_Digest = (view, digesting) => {
        let keys = view['j'], changed = view['k'], vf = view.owner, viewId = view.id, ref = { 'a': [] }, tmpl, vdom, data = view['e'], refData = view['a'], redigest = trigger => {
            if (digesting['a'] < digesting.length) {
                Updater_Digest(view, digesting);
            }
            else {
                ref = digesting.slice();
                digesting['a'] = digesting.length = 0;
                if (trigger) {
                    view.fire('domready');
                }
                ToTry(ref);
            }
        };
        digesting['a'] = digesting.length;
        view['k'] = 0;
        view['j'] = {};
        if (changed && view['d'] > 0 && (tmpl = view.tmpl)) {
            view.fire('dompatch');
            vdom = tmpl(data, Q_Create, viewId, Updater_Safeguard, Updater_EncodeURI, refData, Updater_Ref, Updater_EncodeQ, IsArray);
            if (DEBUG) {
                Updater_CheckInput(view, vdom['a']);
            }
            V_SetChildNodes(view.root, view['l'], vdom, ref, vf, keys);
            view['l'] = vdom;
            /*
                在dom diff patch时，如果已渲染的vframe有变化，则会在vom tree上先派发created事件，同时传递inner标志，vom tree处理alter事件派发状态，未进入created事件派发状态
    
                patch完成后，需要设置vframe hold fire created事件，因为带有assign方法的view在调用render后，vom tree处于就绪状态，此时会导致提前派发created事件，应该hold，统一在endUpdate中派发
    
                有可能不需要endUpdate，所以hold fire要视情况而定
            */
            //vf['i'] = tmpl = ref['b'] || !view['h'];
            for (vdom of ref['a']) {
                vdom['g']();
            }
            if (tmpl) {
                view.endUpdate();
            }
            redigest(1);
        }
        else {
            redigest();
        }
    };
    let Q_TEXTAREA = 'textarea';
    let Q_Create = (tag, props, children, unary) => {
        //html=tag+to_array(attrs)+children.html
        let token;
        if (tag) {
            props = props || {};
            let compareKey = Empty, hasMxv, prop, value, c, reused = {}, outerHTML = '<' + tag, attrs, innerHTML = Empty, newChildren = [], prevNode;
            if (children) {
                for (c of children) {
                    value = c['a'];
                    if (c['b'] == V_TEXT_NODE) {
                        value = value ? Updater_Encode(value) : ' '; //无值的文本节点我们用一个空格占位，这样在innerHTML的时候才会有文本节点
                    }
                    innerHTML += value;
                    //merge text node
                    if (prevNode &&
                        c['b'] == V_TEXT_NODE &&
                        prevNode['b'] == V_TEXT_NODE) {
                        //prevNode['c'] += c['c'];
                        prevNode['a'] += c['a'];
                    }
                    else {
                        //reused node if new node key equal old node key
                        if (c['d']) {
                            reused[c['d']] = (reused[c['d']] || 0) + 1;
                        }
                        //force diff children
                        if (c['e']) {
                            hasMxv = 1;
                        }
                        prevNode = c;
                        newChildren.push(c);
                    }
                }
            }
            for (prop in props) {
                value = props[prop];
                //布尔值
                if (value === false ||
                    value == Null) {
                    delete props[prop];
                    continue;
                }
                else if (value === true) {
                    props[prop] = value = Empty;
                }
                if (prop == 'id') { //如果有id优先使用
                    compareKey = value;
                }
                else if (prop == MX_View &&
                    value &&
                    !compareKey) {
                    //否则如果是组件,则使用组件的路径做为key
                    compareKey = ParseUri(value)[Path];
                }
                else if (prop == Tag_Static_Key) {
                    if (!compareKey) {
                        compareKey = value;
                    }
                    //newChildren = Empty_Array;
                }
                else if (prop == Tag_View_Params_Key) {
                    hasMxv = 1;
                }
                if (prop == Value &&
                    tag == Q_TEXTAREA) {
                    innerHTML = value;
                }
                if (!Has(V_SKIP_PROPS, prop)) {
                    outerHTML += ` ${prop}="${Updater_Encode(value)}"`;
                }
            }
            attrs = outerHTML;
            outerHTML += unary ? '/>' : `>${innerHTML}</${tag}>`;
            token = {
                'a': outerHTML,
                'c': innerHTML,
                'd': compareKey,
                'b': tag,
                'e': hasMxv || Has(V_SPECIAL_PROPS, tag),
                'f': attrs,
                'g': props,
                'h': newChildren,
                'i': reused,
                'j': unary
            };
        }
        else {
            token = {
                'b': props ? Spliter : V_TEXT_NODE,
                'a': children + Empty
            };
        }
        return token;
    };
    let V_SPECIAL_PROPS = {
        input: {
            [Value]: 1,
            checked: 1
        },
        [Q_TEXTAREA]: {
            [Value]: 1
        },
        option: {
            selected: 1
        }
    };
    let V_SKIP_PROPS = {
        [Tag_Static_Key]: 1,
        [Tag_View_Params_Key]: 1
    };
    if (DEBUG) {
        var CheckNodes = (realNodes, vNodes) => {
            let index = 0;
            if (vNodes.length != 1 ||
                vNodes[0]['b'] != Spliter) {
                for (let e of realNodes) {
                    if (e.nodeName.toLowerCase() != vNodes[index]['b'].toLowerCase()) {
                        console.error('real not match virtual!');
                    }
                    index++;
                }
            }
        };
    }
    let V_TEXT_NODE = Counter;
    if (DEBUG) {
        V_TEXT_NODE = '#text';
    }
    let V_W3C = 'http://www.w3.org/';
    let V_NSMap = {
        svg: `${V_W3C}2000/svg`,
        math: `${V_W3C}1998/Math/MathML`
    };
    let V_SetAttributes = (oldNode, lastVDOM, newVDOM, common) => {
        let key, value, changed = 0, specials = V_SPECIAL_PROPS[lastVDOM['b']], nMap = newVDOM['g'], oMap = lastVDOM['g'];
        if (common) {
            if (lastVDOM) {
                for (key in oMap) {
                    if (!Has(specials, key) &&
                        !Has(nMap, key)) { //如果旧有新木有
                        changed = 1;
                        oldNode.removeAttribute(key);
                    }
                }
            }
            for (key in nMap) {
                if (!Has(specials, key) &&
                    !Has(V_SKIP_PROPS, key)) {
                    value = nMap[key];
                    //旧值与新值不相等
                    if (!lastVDOM || oMap[key] !== value) {
                        changed = 1;
                        oldNode.setAttribute(key, value);
                    }
                }
            }
        }
        for (key in specials) {
            value = Has(nMap, key) ? key != Value || nMap[key] : key == Value && Empty;
            if (oldNode[key] != value) {
                changed = 1;
                oldNode[key] = value;
            }
        }
        if (changed) {
            delete oldNode['d'];
        }
        return changed;
    };
    let V_CreateNode = (vnode, owner, ref) => {
        let tag = vnode['b'], c;
        if (tag == V_TEXT_NODE) {
            c = Doc_Document.createTextNode(vnode['a']);
        }
        else {
            c = Doc_Document.createElementNS(V_NSMap[tag] || owner.namespaceURI, tag);
            if (V_SetAttributes(c, 0, vnode, 1)) {
                ref['b'] = 1;
            }
            c.innerHTML = vnode['c'];
        }
        return c;
    };
    let V_SetChildNodes = (realNode, lastVDOM, newVDOM, ref, vframe, keys) => {
        if (lastVDOM) { //view首次初始化，通过innerHTML快速更新
            if (lastVDOM['e'] ||
                lastVDOM['c'] != newVDOM['c']) {
                let i, oi, oldChildren = lastVDOM['h'], newChildren = newVDOM['h'], oc, nc, oldCount = oldChildren.length, oldRealCount = oldCount, newCount = newChildren.length, reused = newVDOM['i'], nodes = realNode.childNodes, compareKey, keyedNodes = {}, oldVIndex = 0, removedCount = 0;
                for (i = oldCount; i--;) {
                    oc = oldChildren[i];
                    compareKey = oc['d'];
                    if (compareKey) {
                        compareKey = keyedNodes[compareKey] || (keyedNodes[compareKey] = []);
                        compareKey.push(nodes[i]);
                    }
                }
                if (DEBUG) {
                    CheckNodes(nodes, oldChildren);
                }
                for (i = 0; i < newCount; i++) {
                    nc = newChildren[i];
                    oc = oldChildren[oldVIndex++];
                    compareKey = keyedNodes[nc['d']];
                    if (compareKey && (compareKey = compareKey.pop())) {
                        if (compareKey != nodes[i]) {
                            for (oi = oldRealCount; oi-- > i;) {
                                if (nodes[oi + removedCount] == compareKey) {
                                    oc = oldChildren[oi];
                                    oldChildren.splice(oi, 1);
                                    removedCount++;
                                    oldRealCount--;
                                    oldVIndex--;
                                    break;
                                }
                            }
                            realNode.insertBefore(compareKey, nodes[i]);
                        }
                        if (reused[oc['d']]) {
                            reused[oc['d']]--;
                        }
                        V_SetNode(compareKey, realNode, oc, nc, ref, vframe, keys);
                    }
                    else if (oc) { //有旧节点，则更新
                        if (keyedNodes[oc['d']] &&
                            reused[oc['d']]) {
                            oldCount++;
                            ref['b'] = 1;
                            realNode.insertBefore(V_CreateNode(nc, realNode, ref), nodes[i]);
                            oldVIndex--;
                        }
                        else {
                            V_SetNode(nodes[i], realNode, oc, nc, ref, vframe, keys);
                        }
                    }
                    else { //添加新的节点
                        realNode.appendChild(V_CreateNode(nc, realNode, ref));
                        ref['b'] = 1;
                    }
                }
                for (i = newCount; i < oldCount; i++) {
                    oi = nodes[newCount]; //删除多余的旧节点
                    if (oi.nodeType == 1) {
                        vframe.unmountZone(oi);
                    }
                    if (DEBUG) {
                        if (!oi.parentNode) {
                            console.error('Avoid remove node on view.destroy in digesting');
                        }
                    }
                    realNode.removeChild(oi);
                }
            }
        }
        else {
            ref['b'] = 1;
            realNode.innerHTML = newVDOM['c'];
        }
    };
    let V_SetNode = (realNode, oldParent, lastVDOM, newVDOM, ref, vframe, keys) => {
        if (DEBUG) {
            if (lastVDOM['b'] != Spliter &&
                newVDOM['b'] != Spliter) {
                if (oldParent.nodeName == 'TEMPLATE') {
                    console.error('unsupport template tag');
                }
                if ((realNode.nodeName == '#text' &&
                    lastVDOM['b'] != '#text') ||
                    (realNode.nodeName != '#text' &&
                        realNode.nodeName.toLowerCase() != lastVDOM['b'].toLowerCase())) {
                    console.error('Your code is not match the DOM tree generated by the browser. near:' + lastVDOM['c'] + '. Is that you lost some tags or modified the DOM tree?');
                }
            }
        }
        let lastAMap = lastVDOM['g'], newAMap = newVDOM['g'], lastNodeTag = lastVDOM['b'];
        if (lastVDOM['e'] ||
            lastVDOM['a'] != newVDOM['a']) {
            if (lastNodeTag == newVDOM['b']) {
                if (lastNodeTag == V_TEXT_NODE) {
                    ref['b'] = 1;
                    realNode.nodeValue = newVDOM['a'];
                }
                else if (lastNodeTag == Spliter) {
                    ref['b'] = 1;
                    oldParent.innerHTML = newVDOM['a'];
                }
                else if (!lastAMap[Tag_Static_Key] ||
                    lastAMap[Tag_Static_Key] != newAMap[Tag_Static_Key]) {
                    let newMxView = newAMap[MX_View], newHTML = newVDOM['c'], commonAttrs = lastVDOM['f'] != newVDOM['f'], updateAttribute = Has(V_SPECIAL_PROPS, lastNodeTag) || commonAttrs, updateChildren, unmountOld, oldVf = Vframe_Vframes[realNode['b']], assign, view, uri = newMxView && ParseUri(newMxView), params, htmlChanged, paramsChanged;
                    /*
                        如果存在新旧view，则考虑路径一致，避免渲染的问题
                     */
                    /*
                        只检测是否有参数控制view而不检测数据是否变化的原因：
                        例：view内有一input接收传递的参数，且该input也能被用户输入
                        var d1='xl';
                        var d2='xl';
                        当传递第一份数据时，input显示值xl，这时候用户修改了input的值且使用第二份数据重新渲染这个view，问input该如何显示？
                    */
                    if (updateAttribute) {
                        updateAttribute = V_SetAttributes(realNode, lastVDOM, newVDOM, commonAttrs);
                        if (updateAttribute) {
                            updateAttribute = ref['b'] = 1;
                        }
                    }
                    //旧节点有view,新节点有view,且是同类型的view
                    if (newMxView && oldVf &&
                        oldVf['g'] == uri[Path] &&
                        (view = oldVf['a'])) {
                        htmlChanged = newHTML != lastVDOM['c'];
                        paramsChanged = newMxView != oldVf[Path];
                        assign = lastAMap[Tag_View_Params_Key];
                        if (!htmlChanged && !paramsChanged && assign) {
                            params = assign.split(Comma);
                            for (assign of params) {
                                if (assign == Hash_Key || Has(keys, assign)) {
                                    paramsChanged = 1;
                                    break;
                                }
                            }
                        }
                        if (paramsChanged || htmlChanged || updateAttribute) {
                            assign = view['h'] && view['m'];
                            //如果有assign方法,且有参数或html变化
                            if (assign) {
                                params = uri[Params];
                                //处理引用赋值
                                Vframe_TranslateQuery(oldVf.pId, newMxView, params);
                                oldVf[Path] = newMxView; //update ref
                                //如果需要更新，则进行更新的操作
                                // uri = {
                                //     //node: newVDOM,//['h'],
                                //     //html: newHTML,
                                //     //mxv: hasMXV,
                                //     node: realNode,
                                //     attr: updateAttribute,
                                //     deep: !view.tmpl,
                                //     inner: htmlChanged,
                                //     query: paramsChanged
                                // };
                                //updateAttribute = 1;
                                if (ToTry(assign, params, /*[params, uri],*/ view)) {
                                    ref['a'].push(view);
                                }
                                //默认当一个组件有assign方法时，由该方法及该view上的render方法完成当前区域内的节点更新
                                //而对于不渲染界面的控制类型的组件来讲，它本身更新后，有可能需要继续由magix更新内部的子节点，此时通过deep参数控制
                                updateChildren = !view.tmpl; //uri.deep;
                            }
                            else {
                                unmountOld = 1;
                                updateChildren = 1;
                            }
                        } // else {
                        // updateAttribute = 1;
                        //}
                    }
                    else {
                        updateChildren = 1;
                        unmountOld = oldVf;
                    }
                    if (unmountOld) {
                        ref['b'] = 1;
                        oldVf.unmountVframe(0, 1);
                    }
                    // Update all children (and subchildren).
                    //自闭合标签不再检测子节点
                    if (updateChildren &&
                        !newVDOM['j']) {
                        V_SetChildNodes(realNode, lastVDOM, newVDOM, ref, vframe, keys);
                    }
                }
            }
            else {
                if (lastVDOM['b'] == Spliter) {
                    oldParent.innerHTML = newVDOM['a'];
                }
                else {
                    vframe.unmountZone(realNode);
                    oldParent.replaceChild(V_CreateNode(newVDOM, oldParent, ref), realNode);
                }
                ref['b'] = 1;
            }
        }
    };
    //like 'login<click>' or '$<click>' or '$win<scroll>' or '$win<scroll>&passive,capture'
    let View_EvtMethodReg = /^(\$?)([^<]*)<([^>]+)>(?:&(.+))?$/;
    let processMixinsSameEvent = (exist, additional, temp) => {
        if (exist['a']) {
            temp = exist;
        }
        else {
            temp = function (e) {
                ToTry(temp['a'], e, this);
            };
            temp['a'] = [exist];
            temp['b'] = 1;
        }
        temp['a'] = temp['a'].concat(additional['a'] || additional);
        return temp;
    };
    let View_DestroyAllResources = (me, lastly) => {
        let cache = me['c'], //reources
        p, c;
        for (p in cache) {
            c = cache[p];
            if (lastly || c['a']) { //destroy
                View_DestroyResource(cache, p, 1);
            }
        }
    };
    let View_DestroyResource = (cache, key, callDestroy, old) => {
        let o = cache[key], fn, res;
        if (o && o != old) {
            //let processed=false;
            res = o['b']; //entity
            fn = res.destroy;
            if (fn && callDestroy) {
                ToTry(fn, Empty_Array, res);
            }
            delete cache[key];
        }
        return res;
    };
    let View_WrapMethod = (prop, fName, short, fn, me) => {
        fn = prop[fName];
        prop[fName] = prop[short] = function (...args) {
            me = this;
            if (me['d'] > 0) { //signature
                me['d']++;
                me.fire('rendercall');
                View_DestroyAllResources(me);
                ToTry(fn, args, me);
            }
        };
    };
    let View_DelegateEvents = (me, destroy) => {
        let e, { 'n': eventsObject, 'i': selectorObject, 'o': eventsList, id } = me; //eventsObject
        for (e in eventsObject) {
            Body_DOMEventBind(e, selectorObject[e], destroy);
        }
        eventsObject = destroy ? RemoveEventListener : AddEventListener;
        for (e of eventsList) {
            eventsObject(e['a'], e['b'], e['c'], id, e['d'], me);
        }
    };
    let View_Globals = {
        win: Doc_Window,
        doc: Doc_Document
    };
    let View_MergeMixins = (mixins, proto, ctors) => {
        let temp = {}, p, node, fn, exist;
        for (node of mixins) {
            for (p in node) {
                fn = node[p];
                exist = temp[p];
                if (p == 'ctor') {
                    ctors.push(fn);
                    continue;
                }
                else if (View_EvtMethodReg.test(p)) {
                    if (exist) {
                        fn = processMixinsSameEvent(exist, fn);
                    }
                    else {
                        fn['b'] = 1;
                    }
                }
                else if (DEBUG && exist && p != 'extend' && p != Spliter) { //只在开发中提示
                    Mx_Cfg.error(Error('merge duplicate:' + p));
                }
                temp[p] = fn;
            }
        }
        for (p in temp) {
            if (!Has(proto, p)) {
                proto[p] = temp[p];
            }
        }
    };
    function merge(...args) {
        let me = this, _ = me['a'] || (me['a'] = []);
        View_MergeMixins(args, me[Prototype], _);
        return me;
    }
    function extend(props, statics) {
        let me = this;
        props = props || {};
        let ctor = props.ctor;
        let ctors = [];
        if (ctor)
            ctors.push(ctor);
        function NView(viewId, rootNode, ownerVf, initParams, mixinCtors, cs, z, concatCtors) {
            me.call(z = this, viewId, rootNode, ownerVf, initParams, mixinCtors);
            cs = NView['a'];
            if (cs)
                ToTry(cs, initParams, z);
            concatCtors = ctors.concat(mixinCtors);
            if (concatCtors.length) {
                ToTry(concatCtors, initParams, z);
            }
        }
        NView.merge = merge;
        NView.extend = extend;
        return Extend(NView, me, props, statics);
    }
    /**
     * 预处理view
     * @param  {View} oView view子类
     * @param  {Vom} vom vom
     */
    let View_Prepare = oView => {
        if (!oView[Spliter]) { //只处理一次
            oView[Spliter] = [];
            let prop = oView[Prototype], currentFn, matches, selectorOrCallback, events, eventsObject = {}, eventsList = [], selectorObject = {}, node, isSelector, p, item, mask, mod, modifiers;
            matches = prop.mixins;
            if (matches) {
                View_MergeMixins(matches, prop, oView[Spliter]);
            }
            for (p in prop) {
                currentFn = prop[p];
                matches = p.match(View_EvtMethodReg);
                if (matches) {
                    [, isSelector, selectorOrCallback, events, modifiers] = matches;
                    mod = {};
                    if (modifiers) {
                        modifiers = modifiers.split(Comma);
                        for (item of modifiers) {
                            mod[item] = true;
                        }
                    }
                    events = events.split(Comma);
                    for (item of events) {
                        node = View_Globals[selectorOrCallback];
                        mask = 1;
                        if (isSelector) {
                            if (node) {
                                eventsList.push({
                                    'c': currentFn,
                                    'a': node,
                                    'b': item,
                                    'd': mod
                                });
                                continue;
                            }
                            mask = 2;
                            node = selectorObject[item];
                            if (!node) {
                                node = selectorObject[item] = [];
                            }
                            if (!node[selectorOrCallback]) {
                                node[selectorOrCallback] = 1;
                                node.push(selectorOrCallback);
                            }
                        }
                        eventsObject[item] = eventsObject[item] | mask;
                        item = selectorOrCallback + Spliter + item;
                        node = prop[item];
                        //for in 就近遍历，如果有则忽略
                        if (!node) { //未设置过
                            prop[item] = currentFn;
                        }
                        else if (node['b']) { //现有的方法是mixins上的
                            if (currentFn['b']) { //2者都是mixins上的事件，则合并
                                prop[item] = processMixinsSameEvent(currentFn, node);
                            }
                            else if (Has(prop, p)) { //currentFn方法不是mixin上的，也不是继承来的，在当前view上，优先级最高
                                prop[item] = currentFn;
                            }
                        }
                    }
                }
            }
            //console.log(prop);
            View_WrapMethod(prop, 'render', 'g');
            prop['n'] = eventsObject;
            prop['o'] = eventsList;
            prop['i'] = selectorObject;
            prop['m'] = prop.assign;
        }
        return oView[Spliter];
    };
    /**
     * View类
     * @name View
     * @class
     * @constructor
     * @borrows Event.on as #on
     * @borrows Event.fire as #fire
     * @borrows Event.off as #off
     * @param {Object} ops 创建view时，需要附加到view对象上的其它属性
     * @property {String} id 当前view与页面vframe节点对应的id
     * @property {Vframe} owner 拥有当前view的vframe对象
     * @example
     * // 关于事件:
     * // html写法：
     *
     * //  &lt;input type="button" mx-click="test({id:100,name:'xinglie'})" value="test" /&gt;
     * //  &lt;a href="http://etao.com" mx-click="test({com:'etao.com'})"&gt;http://etao.com&lt;/a&gt;
     *
     * // js写法：
     *
     *     'test&lt;click&gt;':function(e){
     *          e.preventDefault();
     *          //e.current 处理事件的dom节点(即带有mx-click属性的节点)
     *          //e.target 触发事件的dom节点(即鼠标点中的节点，在current里包含其它节点时，current与target有可能不一样)
     *          //e.params  传递的参数
     *          //e.params.com,e.params.id,e.params.name
     *      },
     *      'test&lt;mousedown&gt;':function(e){
     *
     *       }
     *
     *  //上述示例对test方法标注了click与mousedown事件，也可以合写成：
     *  'test&lt;click,mousedown&gt;':function(e){
     *      alert(e.type);//可通过type识别是哪种事件类型
     *  }
     */
    function View(id, root, owner, ops, me) {
        me = this;
        me.root = root;
        me.owner = owner;
        me.id = id;
        me['c'] = {};
        me['d'] = 1; //标识view是否刷新过，对于托管的函数资源，在回调这个函数时，不但要确保view没有销毁，而且要确保view没有刷新过，如果刷新过则不回调
        me['k'] = 1;
        me['e'] = {
            id
        };
        me['a'] = new Map();
        me['f'] = [];
        me['j'] = {};
        id = View['a'];
        if (id)
            ToTry(id, ops, me);
    }
    Assign(View, {
        /**
         * @lends View
         */
        /**
         * 扩展View
         * @param  {Object} props 扩展到原型上的方法
         * @example
         * define('app/tview',function(require){
         *     let Magix = require('magix');
         *     Magix.View.merge({
         *         ctor:function(){
         *             this.$attr='test';
         *         },
         *         test:function(){
         *             alert(this.$attr);
         *         }
         *     });
         * });
         * //加入Magix.config的exts中
         *
         *  Magix.config({
         *      //...
         *      exts:['app/tview']
         *
         *  });
         *
         * //这样完成后，所有的view对象都会有一个$attr属性和test方法
         * //当然上述功能也可以用继承实现，但继承层次太多时，可以考虑使用扩展来消除多层次的继承
         * //同时当项目进行中发现所有view要实现某个功能时，该方式比继承更快捷有效
         *
         *
         */
        merge,
        /**
         * 继承
         * @param  {Object} [props] 原型链上的方法或属性对象
         * @param {Function} [props.ctor] 类似constructor，但不是constructor，当我们继承时，你无需显示调用上一层级的ctor方法，magix会自动帮你调用
         * @param {Array} [props.mixins] mix到当前原型链上的方法对象，该对象可以有一个ctor方法用于初始化
         * @param  {Object} [statics] 静态对象或方法
         * @example
         * let Magix = require('magix');
         * let Sortable = {
         *     ctor: function() {
         *         console.log('sortable ctor');
         *         //this==当前mix Sortable的view对象
         *         this.on('destroy', function() {
         *             console.log('dispose')
         *         });
         *     },
         *     sort: function() {
         *         console.log('sort');
         *     }
         * };
         * module.exports = Magix.View.extend({
         *     mixins: [Sortable],
         *     ctor: function() {
         *         console.log('view ctor');
         *     },
         *     render: function() {
         *         this.sort();
         *     }
         * });
         */
        extend
    });
    Assign(View[Prototype], MxEvent, {
        /**
         * @lends View#
         */
        /**
         * 初始化调用的方法
         * @beta
         * @module viewInit
         * @param {Object} extra 外部传递的数据对象
         */
        init: Noop,
        /**
         * 渲染view，供最终view开发者覆盖
         * @function
         */
        render: Noop,
        /*
         * 包装mx-event事件，比如把mx-click="test<prevent>({key:'field'})" 包装成 mx-click="magix_vf_root^test<prevent>({key:'field})"，以方便识别交由哪个view处理
         * @function
         * @param {String} html 处理的代码片断
         * @param {Boolean} [onlyAddPrefix] 是否只添加前缀
         * @return {String} 处理后的字符串
         * @example
         * View.extend({
         *     'del&lt;click&gt;':function(e){
         *         S.one(HashKey+e.currentId).remove();
         *     },
         *     'addNode&lt;click&gt;':function(e){
         *         let tmpl='&lt;div mx-click="del"&gt;delete&lt;/div&gt;';
         *         //因为tmpl中有mx-click，因此需要下面这行代码进行处理一次
         *         tmpl=this.wrapEvent(tmpl);
         *         S.one(HashKey+e.currentId).append(tmpl);
         *     }
         * });
         */
        /**
         * 通知当前view即将开始进行html的更新
         * @param {String} [id] 哪块区域需要更新，默认整个view
         */
        beginUpdate(node, me) {
            me = this;
            if (me['d'] > 0 && me['h']) {
                me.owner.unmountZone(node);
            }
        },
        /**
         * 通知当前view结束html的更新
         * @param {String} [id] 哪块区域结束更新，默认整个view
         */
        endUpdate(node, me, o, f) {
            me = this;
            if (me['d'] > 0) {
                f = me['h'];
                me['h'] = 1;
                o = me.owner;
                o.mountZone(node);
                if (!f) {
                    Timeout(me.wrapAsync(Vframe_RunInvokes), 0, o);
                }
            }
        },
        /**
         * 包装异步回调
         * @param  {Function} fn 异步回调的function
         * @return {Function}
         * @example
         * render:function(){
         *     setTimeout(this.wrapAsync(function(){
         *         //codes
         *     }),50000);
         * }
         * // 为什么要包装一次？
         * // 在单页应用的情况下，可能异步回调执行时，当前view已经被销毁。
         * // 比如上例中的setTimeout，50s后执行回调，如果你的回调中去操作了DOM，
         * // 则会出错，为了避免这种情况的出现，可以调用view的wrapAsync包装一次。
         * // (该示例中最好的做法是在view销毁时清除setTimeout，
         * // 但有时候你很难控制回调的执行，比如JSONP，所以最好包装一次)
         */
        wrapAsync(fn, context) {
            let me = this;
            let sign = me['d'];
            return (...a) => {
                if (sign > 0 && sign == me['d']) {
                    return fn.apply(context || me, a);
                }
            };
        },
        /**
         * 让view帮你管理资源，强烈建议对组件等进行托管
         * @param {String} key 资源标识key
         * @param {Object} res 要托管的资源
         * @param {Boolean} [destroyWhenCalleRender] 调用render方法时是否销毁托管的资源
         * @return {Object} 返回托管的资源
         * @beta
         * @module resource
         * @example
         * View.extend({
         *     render: function(){
         *         let me = this;
         *         let dropdown = new Dropdown();
         *
         *         me.capture('dropdown',dropdown,true);
         *     },
         *     getTest: function(){
         *         let dd = me.capture('dropdown');
         *         console.log(dd);
         *     }
         * });
         */
        capture(key, res, destroyWhenCallRender, cache) {
            cache = this['c'];
            if (res) {
                View_DestroyResource(cache, key, 1, res);
                cache[key] = {
                    'b': res,
                    'a': destroyWhenCallRender
                };
                //service托管检查
                if (DEBUG && res && (res.id + Empty).indexOf('\x1es') === 0) {
                    res.__captured = 1;
                    if (!destroyWhenCallRender) {
                        console.warn('beware! May be you should set destroyWhenCallRender = true');
                    }
                }
            }
            else {
                cache = cache[key];
                res = cache && cache['b'];
            }
            return res;
        },
        /**
         * 释放管理的资源
         * @param  {String} key 托管时的key
         * @param  {Boolean} [destroy] 是否销毁资源
         * @return {Object} 返回托管的资源，无论是否销毁
         * @beta
         * @module resource
         */
        release(key, destroy) {
            return View_DestroyResource(this['c'], key, destroy);
        },
        /**
         * 设置view的html内容
         * @param {String} id 更新节点的id
         * @param {Strig} html html字符串
         * @example
         * render:function(){
         *     this.setHTML(this.id,this.tmpl);//渲染界面，当界面复杂时，请考虑用其它方案进行更新
         * }
         */
        /*
            Q:为什么删除setHTML?
            A:统一使用updater更新界面。
            关于api的分级，高层api更内聚，一个api完成很多功能。方便开发者，但不灵活。
            底层api职责更单一，一个api只完成一个功能，灵活，但不方便开发者
            更新界面来讲，updater是一个高层api，但是有些功能却无法完成，如把view当成壳子或容器渲染第三方的组件，组件什么时间加载完成、渲染、更新了dom、如何通知magix等，这些问题在updater中是无解的，而setHTML这个api又不够底层，同样也无法完成一些功能，所以这个api食之无味，故删除
         */
        /**
         * 获取放入的数据
         * @param  {String} [key] key
         * @return {Object} 返回对应的数据，当key未传递时，返回整个数据对象
         * @example
         * render: function() {
         *     this.set({
         *         a: 10,
         *         b: 20
         *     });
         * },
         * 'read&lt;click&gt;': function() {
         *     console.log(this.get('a'));
         * }
         */
        get(key, result) {
            result = this['e'];
            if (key) {
                result = result[key];
            }
            return result;
        },
        /**
         * 通过path获取值
         * @param  {String} path 点分割的路径
         * @return {Object}
         */
        /*gain: function (path) {
            let result = this.$d;
            let ps = path.split('.'),
                temp;
            while (result && ps.length) {
                temp = ps.shift();
                result = result[temp];
            }
            return result;
        },*/
        /**
         * 获取放入的数据
         * @param  {Object} obj 待放入的数据
         * @return {Updater} 返回updater
         * @example
         * render: function() {
         *     this.set({
         *         a: 10,
         *         b: 20
         *     });
         * },
         * 'read&lt;click&gt;': function() {
         *     console.log(this.get('a'));
         * }
         */
        set(obj, unchanged) {
            let me = this;
            me['k'] = UpdateData(obj, me['e'], me['j'], unchanged) || me['k'];
            return me;
        },
        /**
         * 检测数据变化，更新界面，放入数据后需要显式调用该方法才可以把数据更新到界面
         * @example
         * render: function() {
         *     this.updater.set({
         *         a: 10,
         *         b: 20
         *     }).digest();
         * }
         */
        digest(data, unchanged, resolve) {
            let me = this.set(data, unchanged), digesting = me['f'];
            /*
                view:
                <div>
                    <mx-dropdown mx-focusout="rerender()"/>
                <div>
    
                view.digest=>dropdown.focusout=>view.redigest=>view.redigest.end=>view.digest.end
    
                view.digest中嵌套了view.redigest，view.redigest可能操作了view.digest中引用的dom,这样会导致view.redigest.end后续的view.digest中出错
    
                expect
                view.digest=>dropdown.focusout=>view.digest.end=>view.redigest=>view.redigest.end
    
                如果在digest的过程中，多次调用自身的digest，则后续的进行排队。前面的执行完成后，排队中的一次执行完毕
            */
            if (resolve) {
                digesting.push(resolve);
            }
            if (!digesting['a']) {
                Updater_Digest(me, digesting);
            }
            else if (DEBUG) {
                console.warn('Avoid redigest while updater is digesting');
            }
        },
        /**
         * 获取当前数据状态的快照，配合altered方法可获得数据是否有变化
         * @return {Updater} 返回updater
         * @example
         * render: function() {
         *     this.updater.set({
         *         a: 20,
         *         b: 30
         *     }).digest().snapshot(); //更新完界面后保存快照
         * },
         * 'save&lt;click&gt;': function() {
         *     //save to server
         *     console.log(this.updater.altered()); //false
         *     this.updater.set({
         *         a: 20,
         *         b: 40
         *     });
         *     console.log(this.updater.altered()); //true
         *     this.updater.snapshot(); //再保存一次快照
         *     console.log(this.updater.altered()); //false
         * }
         */
        snapshot() {
            let me = this;
            me['p'] = JSON_Stringify(me['e']);
            return me;
        },
        /**
         * 检测数据是否有变动
         * @return {Boolean} 是否变动
         * @example
         * render: function() {
         *     this.updater.set({
         *         a: 20,
         *         b: 30
         *     }).digest().snapshot(); //更新完界面后保存快照
         * },
         * 'save&lt;click&gt;': function() {
         *     //save to server
         *     console.log(this.updater.altered()); //false
         *     this.updater.set({
         *         a: 20,
         *         b: 40
         *     });
         *     console.log(this.updater.altered()); //true
         *     this.updater.snapshot(); //再保存一次快照
         *     console.log(this.updater.altered()); //false
         * }
         */
        altered() {
            let me = this;
            if (me['p']) {
                return me['p'] != JSON_Stringify(me['e']);
            }
        },
        /**
         * 翻译带@占位符的数据
         * @param {string} data 源对象
         */
        translate(data) {
            return TranslateData(this['e'], data);
        },
        /**
         * 翻译带@占位符的数据
         * @param {string} origin 源字符串
         */
        parse(origin) {
            return ParseExpr(origin, this['a']);
        }
    });
    /*
    一个请求send后，应该取消吗？
    参见xmlhttprequest的实现
        https://chromium.googlesource.com/chromium/blink/+/master/Source/core
        https://chromium.googlesource.com/chromium/blink/+/master/Source/core/xmlhttprequest/XMLHttpService.cpp
    当请求发出，服务器接受到之前取消才有用，否则连接已经建立，数据开始传递，中止只会浪费。
    但我们很难在合适的时间点abort，而且像jsonp的，我们根本无法abort掉，只能任数据返回

    然后我们在自已的代码中再去判断、决定回调是否调用

    那我们是否可以这样做：
        1. 不取消请求
        2. 请求返回后尽可能的处理保留数据，比如缓存。处理完成后才去决定是否调用回调（Service_Send中的Done实现）

    除此之外，我们还要考虑
        1. 跨请求对象对同一个缓存的接口进行请求，而某一个销毁了。
            Service.add([{
                name:'Test',
                url:'/test',
                cache:20000
            }]);

            let r1=new Service();
            r1.all('Test',function(e,m){

            });

            let r2=new Service();
            r2.all('Test',function(e,m){

            });

            r1.destroy();

            如上代码，我们在实现时：
            r2在请求Test时，此时Test是可缓存的，并且Test已经处于r1请求中了，我们不应该再次发起新的请求，只需要把回调排队到r1的Test请求中即可。参见代码：Service_Send中的for,Service.cached。

            当r1进行销毁时，并不能贸然销毁r1上的所有请求，如Test请求不能销毁，只能从回调中标识r1的回调不能再被调用。r1的Test还要继续，参考上面讨论的请求应该取消吗。就算能取消，也需要查看Test的请求中，除了r1外是否还有别的请求要用，我们示例中是r2，所以仍然继续请求。参考Service#.destroy


 */
    /**
     * Bag类
     * @name Bag
     * @beta
     * @module service
     * @constructor
     * @property {String} id bag唯一标识
     */
    function Bag() {
        this.id = GUID('b');
        this['a'] = {};
    }
    Assign(Bag[Prototype], {
        /**
         * @lends Bag#
         */
        /**
         * 获取属性
         * @param {String} [key] 要获取数据的key
         * @param {Object} [dValue] 当根据key取到的值为falsy时，使用默认值替代，防止代码出错
         * @return {Object}
         * @example
         * new Serice().one({
         *     name:'Test'
         * },function(error,bag){
         *     let obj=bag.get();//获取所有数据
         *
         *     let list=bag.get('list',[]);//获取list数据，如果不存在list则使用空数组
         *
         *     let count=bag.get('data.info.count',0);//获取data下面info下count的值，您无须关心data下是否有info属性
         *     console.log(list);
         * });
         */
        get(key, dValue) {
            let me = this;
            //let alen = arguments.length;
            /*
                目前只处理了key中不包含.的情况，如果key中包含.则下面的简单的通过split('.')的方案就不行了，需要改为：
    
                let reg=/[^\[\]]+(?=\])|[^.\[\]]+/g;
                let a=['a.b.c','a[b.c].d','a[0][2].e','a[b.c.d][eg].a.b.c','[e.g.d]','a.b[c.d.fff]'];
    
                for(let i=0,one;i<a.length;i++){
                  one=a[i];
                  console.log(one.match(reg))
                }
    
                但考虑到key中有.的情况非常少，则优先使用性能较高的方案
    
                或者key本身就是数组
             */
            let attrs = me['a'];
            if (key) {
                let tks = IsArray(key) ? key.slice() : (key + Empty).split('.'), tk;
                while ((tk = tks.shift()) && attrs) {
                    attrs = attrs[tk];
                }
                if (tk) {
                    attrs = Undefined;
                }
            }
            let type;
            if (dValue !== Undefined && (type = Type(dValue)) != Type(attrs)) {
                if (DEBUG) {
                    console.warn('type neq:' + key + ' is not a(n) ' + type);
                }
                attrs = dValue;
            }
            if (DEBUG && me['b'] && me['b']['a']) { //缓存中的接口不让修改数据
                attrs = Safeguard(attrs);
            }
            return attrs;
        },
        /**
         * 设置属性
         * @param {String|Object} key 属性对象或属性key
         * @param {Object} [val] 属性值
         */
        set(key, val) {
            if (!IsObject(key)) {
                key = { [key]: val };
            }
            Assign(this['a'], key);
        }
    });
    let Service_FetchFlags_ONE = 1;
    let Service_FetchFlags_ALL = 2;
    let Service_Cache_Done = (bagCacheKeys, cacheKey, fns) => error => {
        fns = bagCacheKeys[cacheKey];
        if (fns) {
            delete bagCacheKeys[cacheKey]; //先删除掉信息
            ToTry(fns, error, fns['a']); //执行所有的回调
        }
    };
    // function Service_CacheDone(cacheKey, err, fns) {
    //     fns = this[cacheKey]; //取出当前的缓存信息
    //     if (fns) {
    //         delete this[cacheKey]; //先删除掉信息
    //         ToTry(fns, err, fns['a']); //执行所有的回调
    //     }
    // }
    let Service_Task = (done, host, service, total, flag, bagCache) => {
        let doneArr = [];
        let errorArgs = Null;
        let currentDoneCount = 0;
        return function (idx, error) {
            currentDoneCount++; //当前完成加1.
            let newBag;
            let bag = this;
            let mm = bag['b'];
            let cacheKey = mm['a'], temp;
            doneArr[idx + 1] = bag; //完成的bag
            if (error) { //出错
                errorArgs = error;
                //errorArgs[idx] = err; //记录相应下标的错误信息
                //Assign(errorArgs, err);
                newBag = 1; //标记当前是一个新完成的bag,尽管出错了
            }
            else if (!bagCache.has(cacheKey)) { //如果缓存对象中不存在，则处理。注意在开始请求时，缓存与非缓存的都会调用当前函数，所以需要在该函数内部做判断处理
                if (cacheKey) { //需要缓存
                    bagCache.set(cacheKey, bag); //缓存
                }
                //bag.set(data);
                mm['b'] = Date_Now(); //记录当前完成的时间
                temp = mm['c'];
                if (temp) { //有after
                    ToTry(temp, bag, bag);
                }
                newBag = 1;
            }
            if (!service['a']) { //service['a'] 当前请求被销毁
                let finish = currentDoneCount == total;
                if (finish) {
                    service['b'] = 0;
                    if (flag == Service_FetchFlags_ALL) { //all
                        doneArr[0] = errorArgs;
                        ToTry(done, doneArr, service);
                    }
                }
                if (flag == Service_FetchFlags_ONE) { //如果是其中一个成功，则每次成功回调一次
                    ToTry(done, [error || Null, bag, finish, idx], service);
                }
            }
            if (newBag) { //不管当前request或回调是否销毁，均派发end事件，就像前面缓存一样，尽量让请求处理完成，该缓存的缓存，该派发事件派发事件。
                host.fire('end', {
                    bag,
                    error
                });
            }
        };
    };
    /**
     * 获取attrs，该用缓存的用缓存，该发起请求的请求
     * @private
     * @param {Object|Array} attrs 获取attrs时的描述信息，如:{name:'Home',urlParams:{a:'12'},formParams:{b:2}}
     * @param {Function} done   完成时的回调
     * @param {Integer} flag   获取哪种类型的attrs
     * @param {Boolean} save 是否是保存的动作
     * @return {Service}
     */
    let Service_Send = (me, attrs, done, flag, save) => {
        if (me['a'])
            return me; //如果已销毁，返回
        if (me['b']) { //繁忙，后续请求入队
            return me.enqueue(Service_Send.bind(me, me, attrs, done, flag, save));
        }
        me['b'] = 1; //标志繁忙
        if (!IsArray(attrs)) {
            attrs = [attrs];
        }
        let host = me.constructor, requestCount = 0;
        //let bagCache = host['c']; //存放bag的Cache对象
        let bagCacheKeys = host['d']; //可缓存的bag key
        let removeComplete = Service_Task(done, host, me, attrs.length, flag, host['c']);
        for (let bag of attrs) {
            if (bag) {
                let [bagEntity, update] = host.get(bag, save); //获取bag信息
                let cacheKey = bagEntity['b']['a']; //从实体上获取缓存key
                let complete = removeComplete.bind(bagEntity, requestCount++);
                let cacheList;
                if (cacheKey && bagCacheKeys[cacheKey]) { //如果需要缓存，并且请求已发出
                    bagCacheKeys[cacheKey].push(complete); //放到队列中
                }
                else if (update) { //需要更新
                    if (cacheKey) { //需要缓存
                        cacheList = [complete];
                        cacheList['a'] = bagEntity;
                        bagCacheKeys[cacheKey] = cacheList;
                        complete = Service_Cache_Done(bagCacheKeys, cacheKey); //替换回调，详见Service_CacheDone
                    }
                    host['e'](bagEntity, complete);
                }
                else { //不需要更新时，直接回调
                    complete();
                }
            }
        }
        return me;
    };
    /**
     * 接口请求服务类
     * @name Service
     * @constructor
     * @beta
     * @module service
     * @borrows Event.on as on
     * @borrows Event.fire as fire
     * @borrows Event.off as off
     * @example
     * let S = Magix.Service.extend(function(bag,callback){
     *     $.ajax({
     *         url:bag.get('url'),
     *         success:function(data){
     *             bag.set('data',data)//设置数据
     *             callback();//通知内部完成数据请求
     *         },
     *         error:function(msg){
     *             callback(msg);//出错
     *         }
     *     })
     * });
     * // 添加接口
     * S.add({
     *     name:'test',
     *     url:'/test',
     *     cache:1000*60 //缓存一分钟
     * });
     * // 使用接口
     * let s=new S();
     * s.all('test',function(err,bag){
     *     console.log(err,bag);
     * });
     */
    function Service() {
        let me = this;
        me.id = GUID('s');
        if (DEBUG) {
            me.id = GUID('\x1es');
            setTimeout(() => {
                if (!me.__captured) {
                    console.warn('beware! You should use view.capture to connect Service and View');
                }
            }, 1000);
        }
        me['f'] = [];
    }
    Assign(Service[Prototype], {
        /**
         * @lends Service#
         */
        /**
         * 获取attrs，所有请求完成回调done
         * @function
         * @param {Object|Array} attrs 获取attrs时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},formParams:{b:2}}
         * @param {Function} done   完成时的回调
         * @return {Service}
         * @example
         * new Service().all([{
         *     name:'Test1'
         * },{
         *     name:'Test2'
         * }],function(err,bag1,bag2){
         *     console.log(arguments);
         * });
         */
        all(attrs, done) {
            return Service_Send(this, attrs, done, Service_FetchFlags_ALL);
        },
        /**
         * 保存attrs，所有请求完成回调done
         * @function
         * @param {Object|Array} attrs 保存attrs时的描述信息，如:{name:'Home',urlParams:{a:'12'},formParams:{b:2}}
         * @param {Function} done   完成时的回调
         * @return {Service}
         * @example
         * // 同all,但与all不同的是，当指定接口缓存时，all方法会优先使用缓存，而save方法则每次都会发送请求到服务器，忽略掉缓存。同时save更语义化
         */
        save(attrs, done) {
            return Service_Send(this, attrs, done, Service_FetchFlags_ALL, 1);
        },
        /**
         * 获取attrs，其中任意一个成功均立即回调，回调会被调用多次。注：当使用promise时，不存在该方法。
         * @function
         * @param {Object|Array} attrs 获取attrs时的描述信息，如:{name:'Home',cacheKey:'key',urlParams:{a:'12'},formParams:{b:2}}
         * @param {Function} callback   完成时的回调
         * @beta
         * @return {Service}
         * @example
         *  //代码片断：
         * let s = new Service().one([
         *     {name:'M1'},
         *     {name:'M2'},
         *     {name:'M3'}
         * ],function(err,bag){//m1,m2,m3，谁快先调用谁，且被调用三次
         *     if(err){
         *         alert(err.msg);
         *     }else{
         *         alert(bag.get('name'));
         *     }
         * });
         */
        one(attrs, done) {
            return Service_Send(this, attrs, done, Service_FetchFlags_ONE);
        },
        /**
         * 前一个all,one或save任务做完后的下一个任务
         * @param  {Function} callback 当前面的任务完成后调用该回调
         * @return {Service}
         * @beta
         * @example
         * let r = new Service().all([
         *     {name:'M1'},
         *     {name:'M2'}
         * ],function(err,bag1,bag2){
         *     r.dequeue(['args1','args2']);
         * });
         * r.enqueue(function(args1,args2){
         *     alert([args1,args2]);
         * });
         */
        enqueue(callback) {
            let me = this;
            if (!me['a']) {
                me['f'].push(callback);
                me.dequeue(me['g']);
            }
            return me;
        },
        /**
         * 做下一个任务
         * @param {Array} preArgs 传递的参数
         * @beta
         * @example
         * let r = new Service();
         * r.all('Name',function(e,bag){
         *     r.dequeue([e,bag]);
         * });
         * r.enqueue(function(e,result){//result为m
         *     r.all('NextName',function(e,bag){
         *         r.dequeue([e,bag]);
         *     });
         * });
         *
         * r.enqueue(function(e,bag){//m===queue m;
         *     console.log(e,bag);
         *     r.dequeue([e,bag]);
         * });
         *
         * r.enqueue(function(e,bag){
         *     console.log(e,bag);
         * });
         *
         * //当出错时，e为出错的信息
         */
        dequeue(...a) {
            let me = this, one;
            if (!me['b'] && !me['a']) {
                me['b'] = 1;
                Timeout(() => {
                    me['b'] = 0;
                    if (!me['a']) { //不清除setTimeout,但在回调中识别是否调用了destroy方法
                        one = me['f'].shift();
                        if (one) {
                            ToTry(one, me['g'] = a);
                        }
                    }
                }, 0);
            }
        },
        /**
         * 销毁当前请求，不可以继续发起新请求，而且不再调用相应的回调
         */
        destroy(me) {
            me = this;
            me['a'] = 1; //只需要标记及清理即可，其它的不需要
            me['f'] = 0;
        }
        /**
         * 当Service发送请求前触发
         * @name Service.begin
         * @event
         * @param {Object} e 事件对象
         * @param {Bag} e.bag bag对象
         * @example
         * let S = Magix.Service.extend({
         *     //codes
         * });
         *
         * S.on('begin',function(e){//监听所有的开始请求事件
         *     console.log(e);
         * });
         */
        /**
         * 当Service结束请求时触发(成功或失败均触发)
         * @name Service.end
         * @event
         * @param {Object} e 事件对象
         * @param {Bag} e.bag bag对象
         * @param {String} e.error 当请求出错时，error是出错的消息
         */
        /**
         * 当Service发送请求失败时触发
         * @name Service.fail
         * @event
         * @param {Object} e 事件对象
         * @param {Bag} e.bag bag对象
         * @param {String} e.error 当请求出错时，error是出错的消息
         */
        /**
         * 当Service发送请求成功时触发
         * @name Service.done
         * @event
         * @param {Object} e 事件对象
         * @param {Bag} e.bag bag对象
         */
    });
    let Manager_DefaultCacheKey = (meta, attrs, arr) => {
        arr = [JSON_Stringify(attrs), JSON_Stringify(meta)];
        return arr.join(Spliter);
    };
    let Service_Manager = Assign({
        /**
         * @lends Service
         */
        /**
         * 添加元信息
         * @param {Object} attrs 信息属性
         */
        add(attrs) {
            let me = this;
            let metas = me['h'], bag;
            if (!IsArray(attrs)) {
                attrs = [attrs];
            }
            for (bag of attrs) {
                if (bag) {
                    let { name, cache } = bag;
                    bag.cache = cache | 0;
                    if (DEBUG && Has(metas, name)) {
                        throw new Error('service already exists:' + name);
                    }
                    metas[name] = bag;
                }
            }
        },
        /**
         * 创建bag对象
         * @param {Object} attrs           bag描述信息对象
         * @return {Bag}
         */
        create(attrs) {
            let me = this;
            let meta = me.meta(attrs);
            let cache = (attrs.cache | 0) || meta.cache;
            let entity = new Bag();
            entity.set(meta);
            entity['b'] = {
                'c': meta.after,
                'a': cache && Manager_DefaultCacheKey(meta, attrs)
            };
            if (IsObject(attrs)) {
                entity.set(attrs);
            }
            let before = meta.before;
            if (before) {
                ToTry(before, entity, entity);
            }
            me.fire('begin', {
                bag: entity
            });
            return entity;
        },
        /**
         * 获取bag注册时的元信息
         * @param  {String|Object} attrs 名称
         * @return {Object}
         * @example
         * let S = Magix.Service.extend({
         *     //extend code
         * });
         *
         * S.add({
         *     name:'test',
         *     url:'/test'
         * });
         *
         * console.log(S.meta('test'),S.meta({name:'test'}));//这2种方式都可以拿到add时的对象信息
         */
        meta(attrs) {
            let me = this;
            let metas = me['h'];
            let name = attrs.name || attrs;
            let ma = metas[name];
            return ma || attrs;
        },
        /**
         * 获取bag对象，优先从缓存中获取
         * @param {Object} attrs           bag描述信息对象
         * @param {Boolean} createNew 是否是创建新的Bag对象，如果否，则尝试从缓存中获取
         * @return {Object}
         */
        get(attrs, createNew) {
            let me = this;
            let e, u;
            if (!createNew) {
                e = me.cached(attrs);
            }
            if (!e) {
                e = me.create(attrs);
                u = 1;
            }
            return [e, u];
        },
        /**
         * 从缓存中获取bag对象
         * @param  {Object} attrs
         * @return {Bag}
         * @example
         * let S = Magix.Service.extend({
         *     //extend code
         * });
         *
         * S.add({
         *     name:'test',
         *     url:'/test',
         *     cache:1000*60
         * });
         *
         * S.cached('test');//尝试从缓存中获取bag对象
         */
        cached(attrs) {
            let me = this;
            let bagCache = me['c'];
            let entity;
            let cacheKey;
            let meta = me.meta(attrs);
            let cache = (attrs.cache | 0) || meta.cache;
            if (cache) {
                cacheKey = Manager_DefaultCacheKey(meta, attrs);
            }
            if (cacheKey) {
                let requestCacheKeys = me['d'];
                let info = requestCacheKeys[cacheKey];
                if (info) { //处于请求队列中的
                    entity = info['a'];
                }
                else { //缓存
                    entity = bagCache.get(cacheKey);
                    if (entity && Date_Now() - entity['b']['b'] > cache) {
                        bagCache.del(cacheKey);
                        entity = 0;
                    }
                }
            }
            return entity;
        }
    }, MxEvent);
    /**
     * 继承
     * @lends Service
     * @param  {Function} sync 接口服务同步数据方法
     * @param  {Integer} [cacheMax] 最大缓存数，默认20
     * @param  {Integer} [cacheBuffer] 缓存缓冲区大小，默认5
     * @return {Function} 返回新的接口类
     * @example
     * let S = Magix.Service.extend(function(bag,callback){
     *     $.ajax({
     *         url:bag.get('url'),
     *         success:function(data){
     *             bag.set('data',data);
     *             callback();
     *         },
     *         error:function(msg){
     *             callback({message:msg});
     *         }
     *     })
     * },10,2);//最大缓存10个接口数据，缓冲区2个
     */
    Service.extend = (sync, cacheMax, cacheBuffer) => {
        function NService() {
            Service.call(this);
        }
        NService['e'] = sync;
        NService['c'] = new Cache(cacheMax, cacheBuffer);
        NService['d'] = {};
        NService['h'] = {};
        return Extend(NService, Service, Null, Service_Manager);
    };
    Assign(Noop[Prototype], MxEvent);
    Noop.extend = function extend(props, statics) {
        let me = this;
        let ctor = props && props.ctor;
        function X(...a) {
            let t = this;
            me.apply(t, a);
            if (ctor)
                ctor.apply(t, a);
        }
        X.extend = extend;
        return Extend(X, me, props, statics);
    };
    let Magix_Booted = 0;
    /**
     * Magix对象，提供常用方法
     * @name Magix
     * @namespace
     */
    let Magix = {
        /**
         * @lends Magix
         */
        /**
         * 设置或获取配置信息
         * @param  {Object} cfg 初始化配置参数对象
         * @param {String} cfg.defaultView 默认加载的view
         * @param {String} cfg.defaultPath 当无法从地址栏取到path时的默认值。比如使用hash保存路由信息，而初始进入时并没有hash,此时defaultPath会起作用
         * @param {Object} cfg.routes path与view映射关系表
         * @param {String} cfg.unmatchView 在routes里找不到匹配时使用的view，比如显示404
         * @param {String} cfg.rootId 根view的id
         * @param {Array} cfg.exts 需要加载的扩展
         * @param {Function} cfg.error 发布版以try catch执行一些用户重写的核心流程，当出错时，允许开发者通过该配置项进行捕获。注意：您不应该在该方法内再次抛出任何错误！
         * @example
         * Magix.config({
         *      rootId:'J_app_main',
         *      defaultView:'app/views/layouts/default',//默认加载的view
         *      defaultPath:'/home',
         *      routes:{
         *          "/home":"app/views/layouts/default"
         *      }
         * });
         *
         *
         * let config = Magix.config();
         *
         * console.log(config.rootId);
         *
         * // 可以多次调用该方法，除内置的配置项外，您也可以缓存一些数据，如
         * Magix.config({
         *     user:'彳刂'
         * });
         *
         * console.log(Magix.config('user'));
         */
        config(cfg, r) {
            r = Mx_Cfg;
            if (cfg) {
                if (IsObject(cfg)) {
                    r = Assign(r, cfg);
                }
                else {
                    r = r[cfg];
                }
            }
            return r;
        },
        /**
         * 应用初始化入口
         * @function
         * @param {Object} [cfg] 配置信息对象,更多信息请参考Magix.config方法
         * @return {Object} 配置信息对象
         * @example
         * Magix.boot({
         *      rootId:'J_app_main'
         * });
         *
         */
        boot(cfg) {
            Assign(Mx_Cfg, cfg); //先放到配置信息中，供ini文件中使用
            Async_Require(Mx_Cfg.exts, () => {
                Vframe_Root().mountView(Mx_Cfg.defaultView);
            });
        },
        /**
         * 把列表转化成hash对象
         * @param  {Array} list 源数组
         * @param  {String} [key]  以数组中对象的哪个key的value做为hash的key
         * @return {Object}
         * @example
         * let map = Magix.toMap([1,2,3,5,6]);
         * //=> {1:1,2:1,3:1,4:1,5:1,6:1}
         *
         * let map = Magix.toMap([{id:20},{id:30},{id:40}],'id');
         * //=>{20:{id:20},30:{id:30},40:{id:40}}
         *
         * console.log(map['30']);//=> {id:30}
         * //转成对象后不需要每次都遍历数组查询
         */
        toMap: ToMap,
        /**
         * 以try cache方式执行方法，忽略掉任何异常
         * @function
         * @param  {Array} fns     函数数组
         * @param  {Array} [args]    参数数组
         * @param  {Object} [context] 在待执行的方法内部，this的指向
         * @return {Object} 返回执行的最后一个方法的返回值
         * @example
         * let result = Magix.toTry(function(){
         *     return true
         * });
         *
         * // result == true
         *
         * let result = Magix.toTry(function(){
         *     throw new Error('test');
         * });
         *
         * // result == undefined
         *
         * let result = Magix.toTry([function(){
         *     throw new Error('test');
         * },function(){
         *     return true;
         * }]);
         *
         * // result == true
         *
         * //异常的方法执行时，可以通过Magix.config中的error来捕获，如
         *
         * Magix.config({
         *     error:function(e){
         *         console.log(e);//在这里可以进行错误上报
         *     }
         * });
         *
         * let result = Magix.toTry(function(a1,a2){
         *     return a1 + a2;
         * },[1,2]);
         *
         * // result == 3
         * let o={
         *     title:'test'
         * };
         * let result = Magix.toTry(function(){
         *     return this.title;
         * },null,o);
         *
         * // result == 'test'
         */
        toTry: ToTry,
        /**
         * 转换成字符串路径
         * @function
         * @param  {String} path 路径
         * @param {Object} params 参数对象
         * @param {Object} [keo] 保留空白值的对象
         * @return {String} 字符串路径
         * @example
         * let str = Magix.toUrl('/xxx/',{a:'b',c:'d'});
         * // str == /xxx/?a=b&c=d
         *
         * let str = Magix.toUrl('/xxx/',{a:'',c:2});
         *
         * // str==/xxx/?a=&c=2
         *
         * let str = Magix.toUrl('/xxx/',{a:'',c:2},{c:1});
         *
         * // str == /xxx/?c=2
         * let str = Magix.toUrl('/xxx/',{a:'',c:2},{a:1,c:1});
         *
         * // str == /xxx/?a=&c=2
         */
        toUrl: ToUri,
        /**
         * 把路径字符串转换成对象
         * @function
         * @param  {String} path 路径字符串
         * @return {Object} 解析后的对象
         * @example
         * let obj = Magix.parseUrl('/xxx/?a=b&c=d');
         * // obj = {path:'/xxx/',params:{a:'b',c:'d'}}
         */
        parseUrl: ParseUri,
        /*
         * 路径
         * @function
         * @param  {String} url  参考地址
         * @param  {String} part 相对参考地址的片断
         * @return {String}
         * @example
         * http://www.a.com/a/b.html?a=b#!/home?e=f   /   => http://www.a.com/
         * http://www.a.com/a/b.html?a=b#!/home?e=f   ./     =>http://www.a.com/a/
         * http://www.a.com/a/b.html?a=b#!/home?e=f   ../../    => http://www.a.com/
         * http://www.a.com/a/b.html?a=b#!/home?e=f   ./../  => http://www.a.com/
         */
        /**
         * 把src对象的值混入到aim对象上
         * @function
         * @param  {Object} aim    要mix的目标对象
         * @param  {Object} src    mix的来源对象
         * @example
         * let o1={
         *     a:10
         * };
         * let o2={
         *     b:20,
         *     c:30
         * };
         *
         * Magix.mix(o1,o2);//{a:10,b:20,c:30}
         *
         *
         * @return {Object}
         */
        mix: Assign,
        /**
         * 检测某个对象是否拥有某个属性
         * @function
         * @param  {Object}  owner 检测对象
         * @param  {String}  prop  属性
         * @example
         * let obj={
         *     key1:undefined,
         *     key2:0
         * }
         *
         * Magix.has(obj,'key1');//true
         * Magix.has(obj,'key2');//true
         * Magix.has(obj,'key3');//false
         *
         *
         * @return {Boolean} 是否拥有prop属性
         */
        has: Has,
        /**
         * 获取对象的keys
         * @param {Object} object 获取key的对象
         * @type {Array}
         * @beta
         * @module linkage|router
         * @example
         * let o = {
         *     a:1,
         *     b:2,
         *     test:3
         * };
         * let keys = Magix.keys(o);
         *
         * // keys == ['a','b','test']
         * @return {Array}
         */
        keys: Keys,
        /**
         * 判断一个节点是否在另外一个节点内，如果比较的2个节点是同一个节点，也返回true
         * @function
         * @param {String|HTMLElement} node节点或节点id
         * @param {String|HTMLElement} container 容器
         * @example
         * let root = $('html');
         * let body = $('body');
         *
         * let r = Magix.inside(body[0],root[0]);
         *
         * // r == true
         *
         * let r = Magix.inside(root[0],body[0]);
         *
         * // r == false
         *
         * let r = Magix.inside(root[0],root[0]);
         *
         * // r == true
         *
         * @return {Boolean}
         */
        inside: NodeIn,
        /**
         * 应用样式
         * @beta
         * @module style
         * @param {String} prefix 样式的名称前缀
         * @param {String} css 样式字符串
         * @example
         * // 该方法配合magix-combine工具使用
         * // 更多信息可参考magix-combine工具：https://github.com/thx/magix-combine
         * // 样式问题可查阅这里：https://github.com/thx/magix-combine/issues/6
         *
         */
        applyStyle: ApplyStyle,
        /**
         * 返回全局唯一ID
         * @function
         * @param {String} [prefix] 前缀
         * @return {String}
         * @example
         *
         * let id = Magix.guid('mx-');
         * // id maybe mx-7
         */
        guid: GUID,
        Cache,
        use: Async_Require,
        dispatch: DispatchEvent,
        type: Type,
        View,
        Vframe,
        Service,
        State,
        guard: Safeguard,
        node: GetById
    };
    Magix.default = Magix;
    return Magix;
});

let Designer = {
    init(ops) {
        let node = document.getElementById('boot');
        let src = node.src.replace(/\/[^\/]+$/, '/');
        seajs.config({
            paths: {
                designer: src + 'designer',
                i18n: src + 'i18n',
                gallery: src + 'gallery',
                util: src + 'util',
                panels: src + 'panels',
                elements: src + 'elements'
            },
            alias: {
                magix: 'magix5'
            }
        });
        seajs.use([
            'magix',
            'i18n/index'
        ], (Magix, I18n) => {
            Magix.applyStyle("p_","body,figure,h5,input,p,textarea,ul{margin:0;padding:0}ul{list-style-type:none;list-style-image:none}a{background-color:transparent}a:active,a:hover{outline-width:0}a:focus{outline:1px dotted}html{-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%;-ms-text-size-adjust:100%;text-size-adjust:100%;font-size:62.5%}body{font-size:14px;line-height:1.5}body,button,input,textarea{font-family:helvetica neue,arial,hiragino sans gb,stheiti,wenquanyi micro hei,sans-serif;-ms-text-autospace:ideograph-alpha ideograph-numeric ideograph-parenthesis;-ms-text-spacing:ideograph-alpha ideograph-numeric ideograph-parenthesis;text-spacing:ideograph-alpha ideograph-numeric ideograph-parenthesis}h5{font-size:14px}img{border-style:none;width:auto\\9;height:auto;max-width:100%;vertical-align:top;-ms-interpolation-mode:bicubic}svg:not(:root){overflow:hidden}button,input,textarea{font-family:inherit;font-size:100%;margin:0;vertical-align:middle;*vertical-align:middle}button,input{*overflow:visible}button{text-transform:none}button,html input[type=button],input[type=reset],input[type=submit]{-webkit-appearance:button;-moz-appearance:button;appearance:button;cursor:pointer}button[disabled],input[disabled]{cursor:not-allowed}input[type=checkbox],input[type=radio]{box-sizing:border-box;padding:0;*height:13px;*width:13px}button::-moz-focus-inner,input::-moz-focus-inner{border-style:none;padding:0}textarea{overflow:auto;resize:vertical}@media screen and (-webkit-min-device-pixel-ratio:0){input{line-height:normal!important}}input::-moz-placeholder,textarea::-moz-placeholder{color:#a9a9a9;opacity:1}label{cursor:pointer}html{box-sizing:border-box}*,:after,:before{box-sizing:inherit}a:focus,button:focus,input:focus,textarea:focus{outline:none;resize:none}a{color:#fa742b;text-decoration:none}a:focus,a:hover{color:#bd361b}a:active,a:focus,a:hover,a:visited{outline:0;text-decoration:none}label{cursor:default;display:inline-block;max-width:100%;font-weight:400}::-ms-clear{display:none}@font-face{font-family:pa;src:url(\"data:application/x-font-woff;charset=utf-8;base64,d09GRgABAAAAAAcsAAsAAAAACqQAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAADMAAABCsP6z7U9TLzIAAAE8AAAARAAAAFZXOEjOY21hcAAAAYAAAACWAAACCs4hbhBnbHlmAAACGAAAAugAAAO0BG1azWhlYWQAAAUAAAAALwAAADYPpP4TaGhlYQAABTAAAAAcAAAAJAfeA4pobXR4AAAFTAAAABQAAAAkI+kAAGxvY2EAAAVgAAAAFAAAABQEcAVsbWF4cAAABXQAAAAfAAAAIAEYAF1uYW1lAAAFlAAAAUUAAAJtPlT+fXBvc3QAAAbcAAAATwAAAGizaRo4eJxjYGRgYOBikGPQYWB0cfMJYeBgYGGAAJAMY05meiJQDMoDyrGAaQ4gZoOIAgCKIwNPAHicY2Bk/ss4gYGVgYOpk+kMAwNDP4RmfM1gxMjBwMDEwMrMgBUEpLmmMDgwVDy7z9zwv4EhhrmB4RRQmBEkBwA4Ig2aeJzFkbsNwzAMRE+RP0IQwEEG8AReyl1Kl+68g5Eqy7m7NZyj6EZI6viEJ4AnkRJIADWAKAZRAeGNANNLbsh+xDX7FZ6KH7jLuWBmYseeIxeu3PZdZ7+8UkH55TIvIql6raoNWhnNV97fFM57utQt79MRJTEf6ItMjk2OnWN32Ds2SY6OTZiLow6Dq6Neg5uD9gPbdC1VAAB4nH1SO2sUURi9370zd3Zmd+48dh77yr4mO7MmutlsxkkR3DQ2GgtBCAhaCBY2SrAwjUUw5CEo+A/EoAgR1LBpArEUQVBs3MrCYEAbY+xsMnpHV0ghDsM9936cj+9xDhIR+rlDtkkOZVETjaOT6CxCQEehzvAQ1IKwhUfBrom2azESeEFN8uotcgLcOrWcThT6LpWoBgzKMFHrREELB3A87OIp6DhDAPli4ZzZKJnkHii5oLwUn8ZrYFe8ktY9Fp86Om11qtnUfMY086Z5J0VFMYWxoDG46jqyKCs0fihqBXu7cgRXIJMPCmfOq9WieWk1vDbUcGWAhQXIFqvs8bRRMPh/s+Bkzbykq6lcQfWGLZjfTeeymSH/E+If5rNG5AfxURpNJVMiyUFuhCZ9RFzH0oDWx8CvDzCchigcYKcCTmeACc/CqB/vUgqlfh9KlMa7ZxYZa2gNbZH5bJFjg7FFVf1XkPic3j+UfrD3/4RDwT8z3CIH5AbKowZCYuAHXTjegoCBVAa3E006Sa9R2OCxLkzyGAPy9aMkj7bFvc3NPZGfM0uRIH00RqoHmys9Qnorv09vRxKipZneN0H41uPE9qgs7WjVkZecsNwThN7ySg8Br79AhskC9wuSsWPRegCuH062x/l6HIvY8Syss3JTizWPMXirNctkJJ6NZ/mFwXdPa+rwRis3uR6QiEIu4s9cDwQ1wzNqds2YMGrkQry/Gu+Dvgo69EEfvNDfHPwS9pL6v8UKfG7FSuK/KFEMvxBNae0+NTPicyKTtLghwhdRXFsTlaz0jAhAN4j5t/YsbCGCUJbXfYLXD/jz+sAn78lrMoJaaIxTJcpXym3uJbbg6rcwLzQGLegCv0xz6CRL5z1gKpGtR7oQYJpWtUz6nW2/UosOg7agP1Uk2WKfnPQV6pZcejntfGaWLCnw4K7h7Kp2SqZzijInYd1Wv7j6baVQNHBTsD5kNC3zwRKa2CgWFN7eL0lutBh4nGNgZGBgAGLnEJdv8fw2Xxm4WRhA4JrTXQME/d+MhYG5AcjlYGACiQIAFvYJkgB4nGNgZGBgbvjfwBDDwgACQJKRARVwAgBHDwJyeJxjYWBgYH7JwMDCgBsDAB8LAQ0AAAAAAHYA2AEYAT4BWAF8AYoB2nicY2BkYGDgZAhkYGUAASYg5gJCBob/YD4DABGZAXYAeJxlj01OwzAQhV/6B6QSqqhgh+QFYgEo/RGrblhUavdddN+mTpsqiSPHrdQDcB6OwAk4AtyAO/BIJ5s2lsffvHljTwDc4Acejt8t95E9XDI7cg0XuBeuU38QbpBfhJto41W4Rf1N2MczpsJtdGF5g9e4YvaEd2EPHXwI13CNT+E69S/hBvlbuIk7/Aq30PHqwj7mXle4jUcv9sdWL5xeqeVBxaHJIpM5v4KZXu+Sha3S6pxrW8QmU4OgX0lTnWlb3VPs10PnIhVZk6oJqzpJjMqt2erQBRvn8lGvF4kehCblWGP+tsYCjnEFhSUOjDFCGGSIyujoO1Vm9K+xQ8Jee1Y9zed0WxTU/3OFAQL0z1xTurLSeTpPgT1fG1J1dCtuy56UNJFezUkSskJe1rZUQuoBNmVXjhF6XNGJPyhnSP8ACVpuyAAAAHicbccxDoAgDAXQfkQEbsOR6gLVpAykCeH0xrj6tkeOPpn+JThs8NgRcCAiIRNmqMZ6ShjdhvU4hbUu6/4SLnE11pulvFM/RSvRA98yEWMA\") format(\"woff\")}.p_{font-family:pa;line-height:1;font-size:16px;font-style:normal;font-weight:400;font-variant:normal;display:inline-block;speak:none;position:relative;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.pa{margin-right:10px}.pb{height:100%}.pc{text-align:center}.pd{float:left}.pe{float:right}html .pf{display:inline-block}.pg{position:absolute}.ph{position:relative}html .pi{display:none}.pj:after,.pj:before{content:\" \";display:table}.pj:after{clear:both}.pk{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.pl::-webkit-scrollbar,.pl::-webkit-scrollbar-corner{height:8px;width:8px;background:#fafafa}.pl::-webkit-scrollbar-thumb{background:silver}.pl::-webkit-scrollbar-thumb:hover{background:#949494}.pm{word-wrap:normal;overflow:hidden;text-overflow:ellipsis}.pm,.pn{white-space:nowrap}.pn{outline:none;display:inline-block;font-weight:400;text-align:center;vertical-align:middle;cursor:pointer;background-image:none;background-color:#ccc;padding:4px 14px;font-size:14px;line-height:1;border:0;color:#333;border-radius:2px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.pn:focus,.pn:hover{background-color:#a0a0a0;color:#333}.po{background-color:#fa742b;color:#fff}.po:focus,.po:hover{background-color:#bd361b;color:#fff}.pn[disabled]{background-color:#fbfbfb}.pn[disabled]:hover{border-color:#e6e6e6}.pp{padding:8px 25px;border-bottom:1px solid #e6e6e6;color:#333;margin:0;line-height:1.42857143;background:#fff}.pq{padding:18px 25px}.pr{padding:8px 25px;text-align:left;border-top:1px solid #e6e6e6;background:#fff}.ps{padding:150px 0;margin:0 auto;width:150px;text-align:center;line-height:0}.ps:after,.ps:before{content:\"\"}.ps:after,.ps:before,.pt{width:14px;height:14px;background-color:#ccc;border-radius:100%;display:inline-block;-webkit-animation:p_ 1s ease-in-out infinite both;animation:p_ 1s ease-in-out infinite both}.ps:before{-webkit-animation-delay:-.32s;animation-delay:-.32s}.pt{margin:0 10px;-webkit-animation-delay:-.16s;animation-delay:-.16s}@-webkit-keyframes p_{0%,80%,to{-webkit-transform:scale(0);transform:scale(0)}40%{-webkit-transform:scale(1);transform:scale(1)}}@keyframes p_{0%,80%,to{-webkit-transform:scale(0);transform:scale(0)}40%{-webkit-transform:scale(1);transform:scale(1)}}::-webkit-input-placeholder{color:#999}:-ms-input-placeholder{color:#999}::-ms-input-placeholder{color:#999}::placeholder{color:#999}::-moz-selection{background-color:rgba(243,123,99,.6)}::selection{background-color:rgba(243,123,99,.6)}.pu,.pv{caret-color:#fa742b;display:inline-block;height:22px;padding:3px 4px;border-radius:2px;box-sizing:border-box;box-shadow:none;border:1px solid #e6e6e6;background-color:#fff;color:#333;width:140px;vertical-align:middle;max-width:100%;outline:none;transition:border-color .25s}.pu:hover,.pv:hover{border-color:#ccc}.pu:focus,.pv:focus,.pw,.pw:hover{border-color:#fa742b!important}.pv{height:auto}.pu[disabled],.pv[disabled]{background-color:#fbfbfb}.pu[disabled]:hover,.pv[disabled]:hover{cursor:not-allowed;border-color:#e6e6e6}@font-face{font-family:pb;src:url(//at.alicdn.com/t/font_890516_hbs4agp4pw.eot);src:url(//at.alicdn.com/t/font_890516_hbs4agp4pw.eot#iefix) format(\"embedded-opentype\"),url(//at.alicdn.com/t/font_890516_hbs4agp4pw.woff) format(\"woff\"),url(//at.alicdn.com/t/font_890516_hbs4agp4pw.ttf) format(\"truetype\"),url(//at.alicdn.com/t/font_890516_hbs4agp4pw.svg#iconfont) format(\"svg\");font-display:swap}.px{font-family:pb;line-height:1;font-size:16px;font-style:normal;font-weight:400;font-variant:normal;display:inline-block;speak:none;position:relative;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}#app,body,html{height:100%;overflow:hidden}body{min-width:900px}.py{font-size:12px}.pz{margin-right:2px}.pA{-webkit-transform:rotate(180deg);transform:rotate(180deg)}.pB{-webkit-transform:scaleX(-1);transform:scaleX(-1)}.pC{margin-left:100px}.pD{margin-right:50px}.pE{display:flex;align-items:center}.pF{position:-webkit-sticky;position:sticky;top:0}");
            let lang = 'zh-cn';
            try {
                let store = window.localStorage;
                if (store) {
                    lang = store.getItem('l.report.lang') || lang;
                }
            }
            catch (_a) {
            }
            Magix.config(ops);
            Magix.config({
                lang
            });
            let i18n = I18n.default;
            Magix.View.merge({
                ctor() {
                    this.set({
                        i18n
                    });
                },
                '__dj'(fn, timespan) {
                    timespan = timespan || 150;
                    let last = Date.now();
                    let timer;
                    return (...args) => {
                        let now = Date.now();
                        clearTimeout(timer);
                        if (now - last > timespan) {
                            last = now;
                            fn.apply(this, args);
                        }
                        else {
                            timer = setTimeout(() => {
                                fn.apply(this, args);
                            }, timespan - (now - last));
                        }
                    };
                }
            });
            document.title = i18n('_k');
            Magix.boot({
                defaultPath: '/index',
                defaultView: 'designer/index',
                rootId: 'app',
                error(e) {
                    setTimeout(() => {
                        throw e;
                    }, 0);
                }
            });
        });
    }
};

/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-color/index",["magix","../mx-dragdrop/index","../mx-monitor/index"],(require,exports,module)=>{
/*magix_1,index_1,index_2*/
let $_quick_static_node_2;
let $_quick_static_node_3;
let $_quick_static_node_4;
let $_quick_static_node_5;
let $_quick_static_node_6;
let $_quick_static_node_7;
let $_quick_static_node_8;
let $_quick_static_node_9;
let $_quick_static_node_10;
let $_quick_static_node_11;
let $_quick_static_node_12;
let $_quick_static_node_13;
let $_quick_vnode_attr_static_0={'class': 'paJ',};
let $_quick_vnode_attr_static_1={'xmlns': 'http://www.w3.org/2000/svg', 'version': '1.1', 'width': '100%', 'height': '100%',};
let $_quick_vnode_attr_static_14={'class': 'paB ph',};
let $_quick_vnode_attr_static_15={'class': 'paO',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../mx-dragdrop/index");
const index_2 = require("../mx-monitor/index");
magix_1.default.applyStyle("pg",".paA{position:relative;height:22px;border:1px solid #e6e6e6;border-radius:2px;display:flex;align-items:center;cursor:pointer;padding:1px;transition:border-color .25s}.paA:hover{border-color:#ccc}.paB,.paC{background:#fff;background-image:linear-gradient(45deg,#eee 25%,transparent 0,transparent 75%,#eee 0),linear-gradient(45deg,#eee 25%,transparent 0,transparent 75%,#eee 0);background-position:0 0,6px 6px;background-size:12px 12px}.paC{min-width:18px;height:18px;text-indent:-100000em;border:1px solid #ccc;position:relative}.paD{padding:3px 4px}.paC:after{content:\" \";display:block;right:0;bottom:0;position:absolute;border-color:transparent #ccc;border-style:solid;border-width:6px 6px 0 0}.paE{position:absolute;border-radius:2px;z-index:300;border:1px solid #e6e6e6;background-color:#fff;display:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;padding:2px}.paF-bottom{top:100%;margin-top:4px}.paF-top{bottom:100%;margin-bottom:4px}.paG{width:176px}.paH{border:1px solid #000;float:left;width:12px;height:12px;margin:-1px 0 0 -1px;position:relative}.paI:before{content:\" \";position:absolute;left:2px;top:2px;border:1px inset #e8e8e8;width:6px;height:6px}.paJ{margin:5px 0;height:150px}.paK{position:relative;float:left;width:148px;height:148px}.paL{position:absolute;width:8px;height:8px;box-shadow:0 0 0 1.5px #fff,inset 0 0 1px 1px rgba(0,0,0,.3),0 0 1px 2px rgba(0,0,0,.4);border-radius:50%;left:-4px;top:-4px}.paM{width:18px;height:148px;position:relative;float:left;margin-left:10px}.paN{position:absolute;left:2px;top:-2px;height:4px;width:14px;box-shadow:0 0 0 1.5px #fff,inset 0 0 1px 1px rgba(0,0,0,.3),0 0 1px 2px rgba(0,0,0,.4);background:#fff}.paO{height:25px}.paP{width:80px}.paQ,.paP{margin-right:5px;vertical-align:middle}.paQ{width:30px;border-radius:2px;height:22px;display:inline-block;border:1px solid #ddd}.paR{position:absolute;right:5px;top:4px;font-size:12px;opacity:.2}.paR:hover{opacity:.5}.paB{width:174px;height:12px;margin-bottom:5px}.paS{height:100%}.paT{position:absolute;left:-2px;top:2px;height:8px;width:4px;box-shadow:0 0 0 1.5px #fff,inset 0 0 1px 1px rgba(0,0,0,.3),0 0 1px 2px rgba(0,0,0,.4);background:#fff}.paU{cursor:not-allowed;background-color:#fbfbfb}.paU:hover{border-color:#e6e6e6}.paU:hover .paR{opacity:.1}.paU .paC{opacity:.4}.paU .paR{opacity:.1}");
let ShortCuts = ['d81e06', 'f4ea2a', '1afa29', '1296db', '13227a', 'd4237a', 'ffffff', 'e6e6e6', 'dbdbdb', 'cdcdcd', 'bfbfbf', '8a8a8a', '707070', '515151', '2c2c2c', '000000', 'ea986c', 'eeb174', 'f3ca7e', 'f9f28b', 'c8db8c', 'aad08f', '87c38f', '83c6c2', '7dc5eb', '87a7d6', '8992c8', 'a686ba', 'bd8cbb', 'be8dbd', 'e89abe', 'e8989a', 'e16632', 'e98f36', 'efb336', 'f6ef37', 'afcd51', '7cba59', '36ab60', '1baba8', '17ace3', '3f81c1', '4f68b0', '594d9c', '82529d', 'a4579d', 'db649b', 'dd6572', 'd84e06', 'e0620d', 'ea9518', 'f4ea2a', '8cbb1a', '2ba515', '0e932e', '0c9890', '1295db', '0061b2', '0061b0', '004198', '122179', '88147f', 'd3227b', 'd6204b'];
let HSV2RGB = (h, s, v) => {
    let R, G, B, X, C;
    h = (h % 360) / 60;
    C = v * s;
    X = C * (1 - Math.abs(h % 2 - 1));
    R = G = B = v - C;
    h = ~~h;
    R += [C, X, 0, 0, X, C][h];
    G += [X, C, C, X, 0, 0][h];
    B += [0, 0, X, C, C, X][h];
    let r = R * 255, g = G * 255, b = B * 255;
    return {
        r: r,
        g: g,
        b: b,
        hex: '#' + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1)
    };
};
let RGB2HSV = (r, g, b) => {
    //if (r > 0 || g > 0 || b > 0) {
    r /= 255;
    g /= 255;
    b /= 255;
    //}
    let H, S, V, C;
    V = Math.max(r, g, b);
    C = V - Math.min(r, g, b);
    H = (C === 0 ? null : V == r ? (g - b) / C + (g < b ? 6 : 0) : V == g ? (b - r) / C + 2 : (r - g) / C + 4);
    H = (H % 6) * 60;
    S = C === 0 ? 0 : C / V;
    return {
        h: H,
        s: S,
        v: V
    };
};
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i,$eq)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	disabled,
	id,
	text,
	textWidth,
	color,
	clear,
	i18n,
	placement,
	align,
	renderUI,
	shortcuts,
	alpha,
	current,}=$$,
$$_class,
$vnode_1,
$vnode_2,
$$_style,
$vnode_3,
$text,
$vnode_4,
$vnode_5,
$vnode_6,
$vnode_7,
$vnode_8; 
 $vnode_1=[]; if(text){  $vnode_3=[$_create(0,0,(text))];;$$_style='';if(textWidth){;$$_style+='width:'+$n(textWidth)+'px';};$vnode_2=[$_create('div',{'class': 'paD pk', 'mx-click': $_viewId+'__br()', 'style': $$_style,},$vnode_3 )]; $vnode_1.push(...$vnode_2); } $vnode_2=[$_create(0,0,'picker')];;$$_style='';if(color){;$$_style+='background:'+$n(color)+';';};if(!text){;$$_style+='width:100%';};$vnode_1.push($_create('div',{'class': 'paC pk', 'mx-click': $_viewId+'__br()', 'style': $$_style,},$vnode_2 )); if(clear&&color){  $vnode_3=[$_create(0,0,'')];;$vnode_2=[$_create('i',{'class': 'p_ paR', 'mx-click': $_viewId+'__bs()', 'title': $n(i18n('_aa')),},$vnode_3 )]; $vnode_1.push(...$vnode_2); } $vnode_2=[]; if(renderUI){ $vnode_3=[];  $vnode_4=[]; for(let $q_key_sulkrtxln=0,$q_a_grtuex=shortcuts,$q_c_gyrysgpghs=$q_a_grtuex.length;$q_key_sulkrtxln<$q_c_gyrysgpghs;$q_key_sulkrtxln++){let sc=$q_a_grtuex[$q_key_sulkrtxln];  ;$vnode_5=[$_create('li',{'class': 'paH', 'id': 'sc_'+$n(sc)+'_'+$n(id), 'style': 'background:#'+$n(sc), 'mx-click': $_viewId+'__bo({color:\'#'+($eq(sc))+'\'})',})]; $vnode_4.push(...$vnode_5); };$vnode_3.push($_create('ul',{'class': 'paG pj', 'id': 'scs_'+$n(id),},$vnode_4 ));       if ($_quick_static_node_2) {
                                $vnode_8=[$_quick_static_node_2]; }else{;$vnode_8=[$_quick_static_node_2=$_create('stop',{'mxs': 'pm:_', 'offset': '0%', 'stop-color': '#000000', 'stop-opacity': '1',})]; } if ($_quick_static_node_3) {
                                $vnode_8.push($_quick_static_node_3); }else{;$vnode_8.push($_quick_static_node_3=$_create('stop',{'mxs': 'pm:a', 'offset': '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0',})); };$vnode_7=[$_create('lineargradient',{'id': 'gb_'+$n(id), 'x1': '0%', 'y1': '100%', 'x2': '0%', 'y2': '0%',},$vnode_8 )];   if ($_quick_static_node_4) {
                                $vnode_8=[$_quick_static_node_4]; }else{;$vnode_8=[$_quick_static_node_4=$_create('stop',{'mxs': 'pm:b', 'offset': '0%', 'stop-color': '#FFFFFF', 'stop-opacity': '1',})]; } if ($_quick_static_node_3) {
                                $vnode_8.push($_quick_static_node_3); }else{;$vnode_8.push($_quick_static_node_3=$_create('stop',{'mxs': 'pm:a', 'offset': '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0',})); };$vnode_7.push($_create('lineargradient',{'id': 'gw_'+$n(id), 'x1': '0%', 'y1': '100%', 'x2': '100%', 'y2': '100%',},$vnode_8 )); ;$vnode_6=[$_create('defs',0,$vnode_7 )];  ;$vnode_6.push($_create('rect',{'x': '0', 'y': '0', 'width': '100%', 'height': '100%', 'fill': 'url(#gw_'+$n(id)+')',}));  ;$vnode_6.push($_create('rect',{'x': '0', 'y': '0', 'width': '100%', 'height': '100%', 'fill': 'url(#gb_'+$n(id)+')',})); ;$vnode_5=[$_create('svg',$_quick_vnode_attr_static_1,$vnode_6 )];  ;$vnode_5.push($_create('div',{'class': 'paL', 'id': 'ci_'+$n(id),})); ;$vnode_4=[$_create('div',{'class': 'paK', 'id': 'cz_'+$n(id), 'mx-mousedown': $_viewId+'__bk()',},$vnode_5 )];      if ($_quick_static_node_5) {
                                $vnode_8=[$_quick_static_node_5]; }else{;$vnode_8=[$_quick_static_node_5=$_create('stop',{'mxs': 'pm:c', 'offset': '0%', 'stop-color': '#FF0000', 'stop-opacity': '1',})]; } if ($_quick_static_node_6) {
                                $vnode_8.push($_quick_static_node_6); }else{;$vnode_8.push($_quick_static_node_6=$_create('stop',{'mxs': 'pm:d', 'offset': '13%', 'stop-color': '#FF00FF', 'stop-opacity': '1',})); } if ($_quick_static_node_7) {
                                $vnode_8.push($_quick_static_node_7); }else{;$vnode_8.push($_quick_static_node_7=$_create('stop',{'mxs': 'pm:e', 'offset': '25%', 'stop-color': '#8000FF', 'stop-opacity': '1',})); } if ($_quick_static_node_8) {
                                $vnode_8.push($_quick_static_node_8); }else{;$vnode_8.push($_quick_static_node_8=$_create('stop',{'mxs': 'pm:f', 'offset': '38%', 'stop-color': '#0040FF', 'stop-opacity': '1',})); } if ($_quick_static_node_9) {
                                $vnode_8.push($_quick_static_node_9); }else{;$vnode_8.push($_quick_static_node_9=$_create('stop',{'mxs': 'pm:g', 'offset': '50%', 'stop-color': '#00FFFF', 'stop-opacity': '1',})); } if ($_quick_static_node_10) {
                                $vnode_8.push($_quick_static_node_10); }else{;$vnode_8.push($_quick_static_node_10=$_create('stop',{'mxs': 'pm:h', 'offset': '63%', 'stop-color': '#00FF40', 'stop-opacity': '1',})); } if ($_quick_static_node_11) {
                                $vnode_8.push($_quick_static_node_11); }else{;$vnode_8.push($_quick_static_node_11=$_create('stop',{'mxs': 'pm:i', 'offset': '75%', 'stop-color': '#0BED00', 'stop-opacity': '1',})); } if ($_quick_static_node_12) {
                                $vnode_8.push($_quick_static_node_12); }else{;$vnode_8.push($_quick_static_node_12=$_create('stop',{'mxs': 'pm:j', 'offset': '88%', 'stop-color': '#FFFF00', 'stop-opacity': '1',})); } if ($_quick_static_node_13) {
                                $vnode_8.push($_quick_static_node_13); }else{;$vnode_8.push($_quick_static_node_13=$_create('stop',{'mxs': 'pm:k', 'offset': '100%', 'stop-color': '#FF0000', 'stop-opacity': '1',})); };$vnode_7=[$_create('lineargradient',{'id': 'ghsv_'+$n(id), 'x1': '0%', 'y1': '100%', 'x2': '0%', 'y2': '0%',},$vnode_8 )]; ;$vnode_6=[$_create('defs',0,$vnode_7 )];  ;$vnode_6.push($_create('rect',{'x': '0', 'y': '0', 'width': '100%', 'height': '100%', 'fill': 'url(#ghsv_'+$n(id)+')',})); ;$vnode_5=[$_create('svg',$_quick_vnode_attr_static_1,$vnode_6 )];  ;$vnode_5.push($_create('div',{'class': 'paN', 'id': 'si_'+$n(id),})); ;$vnode_4.push($_create('div',{'class': 'paM', 'mx-mousedown': $_viewId+'__bl()',},$vnode_5 )); ;$vnode_3.push($_create('div',$_quick_vnode_attr_static_0,$vnode_4 )); if(alpha){    ;$vnode_6=[$_create('div',{'class': 'paT', 'id': 'ai_'+$n(id),})]; ;$vnode_5=[$_create('div',{'class': 'paS ph', 'id': 'at_'+$n(id), 'mx-mousedown': $_viewId+'__bm()',},$vnode_6 )]; ;$vnode_4=[$_create('div',$_quick_vnode_attr_static_14,$vnode_5 )]; $vnode_3.push(...$vnode_4); }  ;$vnode_4=[$_create('span',{'class': 'paQ', 'id': 'bc_'+$n(id),})];  ;$vnode_4.push($_create('input',{'class': 'pu paP', 'readonly': true, 'id': 'v_'+$n(id), 'value': $n(current),},0,1));  $vnode_5=[$_create(0,0,'确定')];;$vnode_4.push($_create('button',{'mxs': 'pm:l', 'class': 'pn po', 'type': 'button', 'mx-click': $_viewId+'__bn();',},$vnode_5 )); ;$vnode_3.push($_create('div',$_quick_vnode_attr_static_15,$vnode_4 )); $vnode_2.push(...$vnode_3); };$vnode_1.push($_create('div',{'id': 'bd_'+$n(id), 'class': 'paE paF-'+$n(placement), 'style': $n(align)+':-1px',},$vnode_2 )); ;$$_class='paA';if(disabled){;$$_class+=' paU';};$vnode_0.push($_create('div',{'mx-contextmenu': $_viewId+'__B()', 'id': 'root_'+$n(id), 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    init(data) {
        this.set({
            shortcuts: ShortCuts
        });
        index_2.default["__ba"]();
        this.on('destroy', () => {
            index_2.default['__at'](this);
            index_2.default['__bb']();
        });
        this.assign(data);
    },
    assign(data) {
        let me = this;
        me['__a_'] = data.color;
        me['__bc'] = (data.alpha + '') == 'true';
        me['__bd'] = {
            h: 0,
            s: 1,
            v: 1
        };
        me.set({
            clear: (data.clear + '') == 'true',
            text: data.text || '',
            disabled: (data.disabled + '') == 'true',
            align: data.align || 'left',
            textWidth: data.textWidth || 0,
            placement: data.placement || 'bottom'
        });
        return true;
    },
    render() {
        this.digest({
            alpha: this['__bc'],
            color: this['__a_'],
            current: this['__a_']
        });
    },
    '__bg'(hsv, ignoreSyncUI) {
        let me = this;
        let selfHSV = me['__bd'];
        selfHSV.h = hsv.h;
        selfHSV.s = hsv.s;
        selfHSV.v = hsv.v;
        let rgb = HSV2RGB(hsv.h, hsv.s, hsv.v);
        let hex = rgb.hex;
        let cpickerNode = magix_1.default.node('cz_' + me.id);
        let pickerZone = cpickerNode.clientWidth;
        let colorZone = HSV2RGB(hsv.h, 1, 1);
        cpickerNode.style.background = colorZone.hex;
        me['__be'] = hex;
        me['__bf']();
        if (!ignoreSyncUI) {
            let selected = magix_1.node('scs_' + me.id).querySelector('li[class$="paI"]');
            if (selected) {
                selected.classList.remove('paI');
            }
            let snode = magix_1.node('si_' + me.id);
            let slider = snode.clientHeight / 2;
            let top = Math.round(selfHSV.h * pickerZone / 360 - slider);
            let cnode = magix_1.node('ci_' + me.id);
            let pickerIndicator = cnode.clientWidth / 2;
            snode.style.top = top + 'px';
            top = Math.round((1 - selfHSV.v) * pickerZone - pickerIndicator);
            let left = Math.round(selfHSV.s * pickerZone - pickerIndicator);
            cnode.style.left = left + 'px';
            cnode.style.top = top + 'px';
        }
        let sc = magix_1.node('sc_' + hex.substr(1, 6) + '_' + me.id);
        if (sc) {
            sc.classList.add('paI');
        }
    },
    '__bj'(hex) {
        let me = this;
        let r = parseInt(hex.substr(1, 2), 16);
        if (isNaN(r))
            r = 255;
        let g = parseInt(hex.substr(3, 2), 16);
        if (isNaN(g))
            g = 255;
        let b = parseInt(hex.substr(5, 2), 16);
        if (isNaN(b))
            b = 255;
        let hsv = RGB2HSV(r, g, b);
        let a = parseInt(hex.substr(7, 2), 16);
        if (isNaN(a)) {
            a = 255;
        }
        me['__bh'] = ('0' + a.toString(16)).slice(-2);
        me['__bg'](hsv);
        if (me['__bc']) {
            me['__bi'](a);
        }
    },
    '__bi'(a) {
        let me = this;
        let ai = magix_1.node('ai_' + me.id);
        let alphaWidth = magix_1.node('at_' + me.id).clientWidth;
        let slider = ai.clientWidth / 2;
        a /= 255;
        a *= alphaWidth;
        a -= slider;
        ai.style.left = a + 'px';
    },
    '__bf'() {
        let me = this;
        let n = magix_1.node('bc_' + me.id);
        let hex = me['__be'];
        if (me['__bc']) {
            magix_1.node('at_' + me.id).style.background = 'linear-gradient(to right, ' + hex + '00 0%,' + hex + ' 100%)';
            hex += me['__bh'];
        }
        n.style.background = hex;
        let n1 = magix_1.node('v_' + me.id);
        n1.value = hex;
    },
    '__B<contextmenu>'(e) {
        e.preventDefault();
    },
    '__bk<mousedown>'(e) {
        let me = this, pickerZone = magix_1.node('cz_' + me.id).clientWidth, pickerIndicator = magix_1.node('ci_' + me.id).clientWidth / 2, offset = e.eventTarget.getBoundingClientRect(), left = e.pageX - offset.left - window.pageXOffset, top = e.pageY - offset.top - window.pageYOffset, s = left / pickerZone, v = (pickerZone - top) / pickerZone;
        me['__bg']({
            h: me['__bd'].h,
            s: s,
            v: v
        });
        let current = magix_1.node('ci_' + me.id);
        let styles = getComputedStyle(current);
        let sleft = styles.left;
        let stop = styles.top;
        let startX = parseInt(sleft, 10);
        let startY = parseInt(stop, 10);
        let pos = e;
        me['__x'](e, (event) => {
            let offsetY = event.pageY - pos.pageY;
            let offsetX = event.pageX - pos.pageX;
            offsetY += startY;
            if (offsetY <= -pickerIndicator)
                offsetY = -pickerIndicator;
            else if (offsetY >= (pickerZone - pickerIndicator))
                offsetY = pickerZone - pickerIndicator;
            offsetX += startX;
            if (offsetX <= -pickerIndicator)
                offsetX = -pickerIndicator;
            else if (offsetX >= (pickerZone - pickerIndicator))
                offsetX = pickerZone - pickerIndicator;
            current.style.left = offsetX + 'px';
            current.style.top = offsetY + 'px';
            let s = (offsetX + pickerIndicator) / pickerZone;
            let v = (pickerZone - (offsetY + pickerIndicator)) / pickerZone;
            me['__bg']({
                h: me['__bd'].h,
                s: s,
                v: v
            });
        });
    },
    '__bl<mousedown>'(e) {
        let me = this;
        let current = e.eventTarget;
        let indicator = magix_1.node('si_' + me.id);
        let pickerZone = magix_1.node('cz_' + me.id).clientWidth;
        let slider = indicator.clientHeight / 2;
        let offset = current.getBoundingClientRect(), top = e.pageY - offset.top - window.scrollY, h = top / pickerZone * 360;
        me['__bg']({
            h: h,
            s: me['__bd'].s,
            v: me['__bd'].v
        });
        let startY = parseInt(getComputedStyle(indicator).top, 10);
        me['__x'](e, event => {
            let offsetY = event.pageY - e.pageY;
            offsetY += startY;
            if (offsetY <= -slider)
                offsetY = -slider;
            else if (offsetY >= (pickerZone - slider))
                offsetY = pickerZone - slider;
            indicator.style.top = offsetY + 'px';
            let h = (offsetY + slider) / pickerZone * 360;
            me['__bg']({
                h: h,
                s: me['__bd'].s,
                v: me['__bd'].v
            }, true);
        });
    },
    '__bm<mousedown>'(e) {
        let current = e.eventTarget;
        let me = this;
        let indicator = magix_1.node('ai_' + me.id);
        let alphaWidth = magix_1.node('at_' + me.id).clientWidth;
        let slider = indicator.clientWidth / 2;
        let offset = current.getBoundingClientRect(), left = e.pageX - offset.left, a = (left / alphaWidth * 255) | 0;
        me['__bh'] = ('0' + a.toString(16)).slice(-2);
        me['__bi'](a);
        me['__bf']();
        let styles = getComputedStyle(indicator);
        let startX = parseInt(styles.left, 10);
        me['__x'](e, (event) => {
            let offsetX = event.pageX - e.pageX;
            offsetX += startX;
            if (offsetX <= -slider)
                offsetX = -slider;
            else if (offsetX >= (alphaWidth - slider))
                offsetX = alphaWidth - slider;
            indicator.style.left = offsetX + 'px';
            let a = Math.round((offsetX + slider) / alphaWidth * 255);
            me['__bh'] = ('0' + a.toString(16)).slice(-2);
            me['__bf']();
        });
    },
    '__bn<click>'() {
        let me = this;
        me['__z']();
        let n = magix_1.node('v_' + me.id);
        let c = n.value;
        if (c != me['__a_']) {
            me.digest({
                color: c,
                current: c
            });
            magix_1.default.dispatch(me.root, 'input', {
                color: me['__a_'] = c
            });
        }
    },
    '__bo<click>'(e) {
        this['__bj'](e.params.color);
        e.eventTarget.classList.add('paI');
    },
    '__bp'(node) {
        return magix_1.default.inside(node, this.root);
    },
    '__y'() {
        let n = magix_1.node('bd_' + this.id);
        let d = getComputedStyle(n).display;
        if (d == 'none') {
            n.style.display = 'block';
            index_2.default["__au"](this);
            magix_1.node('root_' + this.id).classList.add('pw');
            if (!this['__bq']) {
                this.digest({
                    renderUI: true
                }, null, () => {
                    this['__bj'](this['__a_']);
                });
                this['__bq'] = 1;
            }
        }
    },
    '__z'() {
        let n = magix_1.node('bd_' + this.id);
        let d = getComputedStyle(n).display;
        if (d != 'none') {
            magix_1.node('root_' + this.id).classList.remove('pw');
            n.style.display = 'none';
            index_2.default["__at"](this);
        }
    },
    '__br<click>'() {
        if (this.get('disabled'))
            return;
        let n = magix_1.node('bd_' + this.id);
        let d = getComputedStyle(n).display;
        if (d == 'none') {
            this['__y']();
        }
        else {
            this['__z']();
        }
    },
    '__bs<click>'() {
        if (this.get('disabled'))
            return;
        let me = this, c = '';
        if (me['__bq']) {
            let cr = magix_1.node('v_' + me.id).value;
            me['__z']();
            me.digest({
                color: '',
                current: cr
            });
        }
        else {
            me.digest({
                color: ''
            });
        }
        magix_1.default.dispatch(me.root, 'input', {
            color: me['__a_'] = c
        });
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-dialog/alert",["magix","../../i18n/index"],(require,exports,module)=>{
/*magix_1,index_1*/
let $_quick_vnode_attr_static_0={'class': 'pp',};
let $_quick_vnode_attr_static_1={'class': 'pq', 'style': 'word-break:break-all;',};
let $_quick_vnode_attr_static_2={'class': 'pr pj',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@taobao.com
 */
const magix_1 = require("magix");
const index_1 = require("../../i18n/index");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	title,
	body,
	i18n,}=$$,
$vnode_1,
$vnode_2,
$text; 
  $vnode_2=[$_create(0,0,(title))];;$vnode_1=[$_create('h5',0,$vnode_2 )]; ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_0,$vnode_1 ));  $vnode_1=[$_create(0,0,(body))];;$vnode_0.push($_create('div',$_quick_vnode_attr_static_1,$vnode_1 ));   $vnode_2=[$_create(0,0,(i18n('_ac')))];;$vnode_1=[$_create('button',{'mx-click': $_viewId+'__bn();', 'class': 'pn po pe', 'type': 'button',},$vnode_2 )]; ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_2,$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(extra) {
        let me = this;
        me['__bt'] = extra.dialog;
        me['__bu'] = extra.body;
        me['__bv'] = extra.title || index_1.default('__ab');
        me['__bw'] = extra.enterCallback;
    },
    render() {
        let me = this;
        me.digest({
            body: me['__bu'],
            title: me['__bv']
        });
    },
    '__bn<click>'() {
        let me = this;
        me['__bt'].close();
        if (me['__bw']) {
            magix_1.default.toTry(me['__bw']);
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-dialog/confirm",["magix","../../i18n/index"],(require,exports,module)=>{
/*magix_1,index_1*/
let $_quick_vnode_attr_static_0={'class': 'pp',};
let $_quick_vnode_attr_static_1={'class': 'pq', 'style': 'word-break:break-all;',};
let $_quick_vnode_attr_static_2={'class': 'pr pj',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@taobao.com
 */
const magix_1 = require("magix");
const index_1 = require("../../i18n/index");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	title,
	body,
	i18n,}=$$,
$vnode_1,
$vnode_2,
$text; 
  $vnode_2=[$_create(0,0,(title))];;$vnode_1=[$_create('h5',0,$vnode_2 )]; ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_0,$vnode_1 ));  $vnode_1=[$_create(0,0,(body))];;$vnode_0.push($_create('div',$_quick_vnode_attr_static_1,$vnode_1 ));   $vnode_2=[$_create(0,0,(i18n('_ad')))];;$vnode_1=[$_create('button',{'type': 'button', 'mx-click': $_viewId+'__by()', 'class': 'pn pe',},$vnode_2 )];  $vnode_2=[$_create(0,0,(i18n('_ac')))];;$vnode_1.push($_create('button',{'type': 'button', 'mx-click': $_viewId+'__bn()', 'class': 'pn po pa pe',},$vnode_2 )); ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_2,$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(extra) {
        let me = this;
        me['__bt'] = extra.dialog;
        me['__bu'] = extra.body;
        me['__bv'] = extra.title || index_1.default('__ab');
        me['__bw'] = extra.enterCallback;
        me['__bx'] = extra.cancelCallback;
    },
    render() {
        let me = this;
        me.digest({
            body: me['__bu'],
            title: me['__bv']
        });
    },
    '__bn<click>'() {
        let me = this;
        me['__bt'].close();
        if (me['__bw']) {
            magix_1.default.toTry(me['__bw']);
        }
    },
    '__by<click>'() {
        let me = this;
        me['__bt'].close();
        if (me['__bx']) {
            magix_1.default.toTry(me['__bx']);
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-dialog/index",["magix","./alert","./confirm"],(require,exports,module)=>{
/*magix_1*/
let $_quick_static_node_0;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
 */
const magix_1 = require("magix");
require("./alert");
require("./confirm");
magix_1.default.applyStyle("ph",".paV{position:absolute}.paW{position:relative;background-color:#fff;border-radius:2px;border:1px solid #e6e6e6}.paX{position:absolute;cursor:pointer;opacity:.2;z-index:1;top:7px;right:10px}.paX:focus,.paX:hover{opacity:.5}.paY{position:fixed;top:0;right:0;left:0;bottom:0;background-color:#000;opacity:.2}.paZ{-webkit-filter:blur(3px);filter:blur(3px)}.pb_{-webkit-animation:pc .3s;animation:pc .3s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards}.pba{position:absolute;right:10px;top:0;width:1px;height:0}.pbb{padding:80px 0}@-webkit-keyframes pc{0%{opacity:0}to{opacity:.2}}@keyframes pc{0%{opacity:0}to{opacity:.2}}.pbc{-webkit-animation:pd .2s;animation:pd .2s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards}@-webkit-keyframes pd{0%{opacity:.2}to{opacity:0}}@keyframes pd{0%{opacity:.2}to{opacity:0}}.pbd{margin-bottom:50px;min-height:60px}.pbe{position:fixed;width:100%;height:100%;overflow:auto;left:0;top:0}.pbf{-webkit-animation:pe .3s;animation:pe .3s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards}@-webkit-keyframes pe{0%{margin-top:-50px;opacity:0}to{margin-top:0;opacity:1}}@keyframes pe{0%{margin-top:-50px;opacity:0}to{margin-top:0;opacity:1}}.pbg{-webkit-animation:pf .2s;animation:pf .2s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards}@-webkit-keyframes pf{0%{margin-top:0;opacity:1}to{margin-top:-50px;opacity:0}}@keyframes pf{0%{margin-top:0;opacity:1}to{margin-top:-50px;opacity:0}}");
let DialogZIndex = 500;
let CacheList = [];
let RemoveCache = (view) => {
    for (let i = CacheList.length - 1, one; i >= 0; i--) {
        one = CacheList[i];
        if (one.id == view.id) {
            CacheList.splice(i, 1);
            break;
        }
    }
};
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	removeClass,
	zIndex,
	id,
	left,
	top,
	width,
	closable,}=$$,
$$_class,
$vnode_1,
$vnode_2,
$vnode_3,
$text,
$vnode_4; 
 ;$$_class='paY';if(!removeClass){;$$_class+=' pb_';};$vnode_0.push($_create('div',{'style': 'z-index:'+$n(zIndex-1), 'id': 'mask_'+$n(id), 'class': $$_class,}));    ;$vnode_2=[$_create('input',{'id': 'focus_'+$n(id), 'class': 'pba',},0,1)];  $vnode_3=[$_create(0,0,'')];;$vnode_2.push($_create('span',{'class': 'p_ paX '+$n( closable ? '' : 'pi'), 'mx-click': $_viewId+'__bB()',},$vnode_3 ));   if ($_quick_static_node_0) {
                                $vnode_3=[$_quick_static_node_0]; }else{ ;$vnode_4=[$_create('span',{'class': 'pt',})]; ;$vnode_3=[$_quick_static_node_0=$_create('div',{'mxs': 'pp:_', 'class': 'ps pbb',},$vnode_4 )]; };$vnode_2.push($_create('div',{'class': 'paW pbd', 'id': 'cnt_'+$n(id),},$vnode_3 )); ;$$_class='paV';if(!removeClass){;$$_class+=' pbf';};$vnode_1=[$_create('div',{'id': 'body_'+$n(id), 'style': 'left:'+$n(left)+'px;top:'+$n(top)+'px;width:'+$n(width)+'px;', 'class': $$_class,},$vnode_2 )]; ;$vnode_0.push($_create('div',{'class': 'pbe', 'style': 'z-index:'+$n(zIndex)+';',},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(extra) {
        let me = this;
        let app = magix_1.default.node('app');
        let root = me.root;
        me.on('destroy', () => {
            RemoveCache(me);
            DialogZIndex -= 2;
            if (DialogZIndex == 500) {
                app.classList.remove('paZ');
            }
            magix_1.default.dispatch(root, 'close');
            root.parentNode.removeChild(root);
        });
        if (!magix_1.default.has(extra, 'closable')) {
            extra.closable = true;
        }
        me.set(extra);
        if (DialogZIndex == 500) {
            app.classList.add('paZ');
        }
        DialogZIndex += 2;
        CacheList.push(me);
    },
    render() {
        let me = this;
        me.digest({
            zIndex: DialogZIndex
        }, null, () => {
            let data = me.get();
            setTimeout(me.wrapAsync(() => {
                me.root.style.display = 'block';
                magix_1.default.node('focus_' + me.id).focus();
            }), 30);
            me.owner.mountVframe(magix_1.default.node('cnt_' + me.id), data.view, data);
            setTimeout(me.wrapAsync(() => {
                me.digest({
                    removeClass: true
                });
            }), 300);
        });
    },
    '__bz'(e) {
        let n = magix_1.default.node('cnt_' + this.id);
        let vf = magix_1.default.Vframe.byNode(n);
        vf.invoke('fire', ['unload', e]);
    },
    '__bA'() {
        let id = this.id, node;
        node = magix_1.default.node('body_' + id);
        node.classList.add('pbg');
        node = magix_1.default.node('mask_' + id);
        node.classList.add('pbc');
    },
    '__bB<click>'() {
        magix_1.default.dispatch(this.root, 'dlg_close');
    },
    '$doc<keyup>'(e) {
        if (e.keyCode == 27) { //esc
            let dlg = CacheList[CacheList.length - 1];
            if (dlg == this && dlg.get('closable')) {
                magix_1.default.dispatch(this.root, 'dlg_close');
            }
        }
    }
}, {
    '__bD'(view, options) {
        let id = magix_1.default.guid('dlg_');
        document.body.insertAdjacentHTML('beforeend', '<div id="' + id + '" style="display:none" />');
        let node = magix_1.default.node(id);
        let vf = view.owner.mountVframe(node, 'gallery/mx-dialog/index', options);
        let suspend;
        let whenClose = () => {
            if (!node['__bC'] && !suspend) {
                let resume = () => {
                    node['__bC'] = 1;
                    vf.invoke('__bA');
                    setTimeout(() => {
                        vf.unmountVframe();
                    }, 200);
                };
                let e = {
                    p: 0,
                    prevent() {
                        suspend = 1;
                    },
                    resolve() {
                        e.p = 1;
                        suspend = 0;
                        resume();
                    },
                    reject() {
                        e.p = 1;
                        suspend = 0;
                    }
                };
                vf.invoke('__bz', [e]);
                if (!suspend && !e.p) {
                    resume();
                }
            }
        };
        node.addEventListener('dlg_close', whenClose);
        return node;
    },
    alert(content, enterCallback, title) {
        this.confirm(content, enterCallback, null, title, 'alert');
    },
    confirm(content, enterCallback, cancelCallback, title, view) {
        this.mxDialog('gallery/mx-dialog/' + (view || 'confirm'), {
            body: content,
            cancelCallback: cancelCallback,
            enterCallback: enterCallback,
            title: title,
            modal: true,
            width: 300,
            closable: false,
            left: (window.innerWidth - 300) / 2,
            top: Math.max((window.innerHeight - 220) / 2, 0)
        });
    },
    mxDialog(view, options) {
        let me = this;
        let dlg;
        let closeCallback;
        let dOptions = {
            view: view
        };
        magix_1.default.use(view, me.wrapAsync(V => {
            let key = '$dlg_' + view;
            if (me[key])
                return;
            me[key] = 1;
            magix_1.default.mix(dOptions, V.dialogOptions);
            magix_1.default.mix(dOptions, options);
            if (!dOptions.width)
                dOptions.width = 500;
            if (!dOptions.left)
                dOptions.left = (window.innerWidth - dOptions.width) / 2;
            if (!dOptions.top)
                dOptions.top = 100;
            dOptions.dialog = {
                close() {
                    if (dlg) {
                        magix_1.default.dispatch(dlg, 'dlg_close');
                    }
                }
            };
            dlg = me['__bD'](me, dOptions);
            dlg.addEventListener('close', () => {
                delete me[key];
                if (closeCallback) {
                    closeCallback();
                }
            });
        }));
        return {
            close() {
                if (dlg) {
                    magix_1.default.dispatch(dlg, 'dlg_close');
                }
            },
            whenClose(fn) {
                closeCallback = fn;
            }
        };
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-dragdrop/index",[],(require,exports,module)=>{
/**/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@taobao.com
 */
let IsW3C = window.getComputedStyle;
let ClearSelection = (t) => {
    if ((t = window.getSelection)) {
        t().removeAllRanges();
    }
};
let DragPrevent = (e) => {
    console.log(e);
    e.preventDefault();
};
let DragMoveEvent = ['mousemove', 'touchmove', 'pointermove'];
let DragEndEvent = ['mouseup', 'touchend', 'pointercancel', 'touchcancel'];
let DragPreventEvent = ['keydown', 'mousewheel', 'DOMMouseScroll', 'fullscreenchange'];
exports.default = {
    ctor() {
        let me = this;
        me.on('destroy', () => {
            me['__bE']();
        });
    },
    '__bE'(e) {
        let me = this;
        let info = me['__bF'];
        if (info) {
            delete me['__bF'];
            let fn;
            for (fn of DragMoveEvent) {
                document.removeEventListener(fn, me['__bG']);
            }
            for (fn of DragEndEvent) {
                document.removeEventListener(fn, me['__bH']);
            }
            for (fn of DragPreventEvent) {
                document.removeEventListener(fn, DragPrevent);
            }
            window.removeEventListener('blur', me['__bH']);
            //let node = info['@{dd&node}'];
            let stop = info['__bI'];
            let iStop = info['__bJ'];
            // if (node.releaseCapture) {
            //     node.releaseCapture();
            // } else if (node.releasePointerCapture && e.pointerId) {
            //     node.releasePointerCapture(e.pointerId);
            // }
            if (iStop) {
                stop(e);
            }
        }
    },
    '__x'(e, moveCallback, endCallback) {
        let me = this;
        me['__bE']();
        if (e) {
            ClearSelection();
            //let node = e.eventTarget || e.target;
            // if (node.setCapture) {
            //     //node.setCapture();
            // } else if (node.setPointerCapture && e.pointerId) {
            //     node.setPointerCapture(e.pointerId);
            // }
            me['__bF'] = {
                '__bI': endCallback,
                //'@{dd&node}': node,
                '__bJ': !!endCallback
            };
            let moveIsFunction = !!moveCallback;
            me['__bK'] = 0;
            me['__bH'] = e => {
                me['__bK'] = 1;
                me['__bE'](e);
            };
            me['__bG'] = e => {
                if (moveIsFunction) {
                    moveCallback(e);
                }
            };
            let fn;
            for (fn of DragMoveEvent) {
                document.addEventListener(fn, me['__bG']);
            }
            for (fn of DragEndEvent) {
                document.addEventListener(fn, me['__bH']);
            }
            for (fn of DragPreventEvent) {
                document.addEventListener(fn, DragPrevent, {
                    passive: false
                });
            }
            window.addEventListener('blur', me['__bH']);
        }
    },
    '__J'(x, y) {
        let node = null;
        if (document.elementFromPoint) {
            if (!DragPrevent['__bL'] && IsW3C) {
                DragPrevent['__bL'] = true;
                DragPrevent['__bM'] = document.elementFromPoint(-1, -1) !== null;
            }
            if (DragPrevent['__bM']) {
                x += window.pageXOffset;
                y += window.pageYOffset;
            }
            node = document.elementFromPoint(x, y);
            while (node && node.nodeType == 3)
                node = node.parentNode;
        }
        return node;
    },
    '__bN': ClearSelection
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-dropdown/index",["magix","../mx-monitor/index"],(require,exports,module)=>{
/*magix_1,index_1*/
let $_quick_static_node_0;
let $_quick_vnode_attr_static_1={'class': 'pbo',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../mx-monitor/index");
magix_1.default.applyStyle("pi",".pbh{outline:0;position:relative;min-width:50px;width:100%;background-color:#fff;border:1px solid #e6e6e6;border-radius:2px;display:inline-block;vertical-align:middle;height:22px;transition:all .25s}.pbh:hover{border-color:#ccc}.pbi{color:#333;position:relative;width:100%;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;padding:0 20px 0 3px}.pbj{cursor:not-allowed;background-color:#fbfbfb}.pbj:hover{border-color:#e6e6e6}.pbj .pbi{cursor:not-allowed}.pbk{position:absolute;right:0;top:0;font-size:20px;color:#ccc;transition:all .25s}.pbl .pbk{-webkit-transform:rotate(180deg);transform:rotate(180deg);top:0}.pbh[tabindex=\"0\"]:focus,.pbl,.pbl:hover{border-color:#fa742b}.pbm{height:20px;line-height:21px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}.pbn{color:#999}.pbo{position:absolute;top:100%;left:-1px;right:-1px;margin-top:4px;border-radius:2px;z-index:300;border:1px solid #e6e6e6;background-color:#fff;display:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.pbl .pbo{display:block}.pbp{overflow:auto;max-height:196px;padding:2px 0}.pbq{padding:0 2px;margin:2px 0}.pbr{cursor:pointer;color:#666;display:block;width:100%;padding:0 5px;height:20px;line-height:20px;border-radius:2px}.pbr:hover{color:#333;background-color:#f0f0f0}.pbs,.pbs:active,.pbs:focus,.pbs:hover{color:#fff;background-color:#fa742b}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	disabled,
	id,
	selectedText,
	selected,
	emptyText,
	rList,
	list,
	textKey,
	valueKey,}=$$,
$$_class,
$vnode_1,
$vnode_2,
$vnode_3,
$text,
$vnode_4,
$vnode_5,
$vnode_6,
$vnode_7; 
 $vnode_1=[];   $vnode_3=[$_create(0,0,(selectedText))];;$$_class='pbm';if(selected===''||selected==emptyText){;$$_class+=' pbn';};$vnode_2=[$_create('span',{'class': $$_class,},$vnode_3 )];  if ($_quick_static_node_0) {
                                $vnode_2.push($_quick_static_node_0); }else{$vnode_3=[$_create(0,0,'')];;$vnode_2.push($_quick_static_node_0=$_create('span',{'mxs': 'pq:_', 'class': 'p_ pbk',},$vnode_3 )); };$vnode_1.push($_create('div',{'class': 'pbi', 'mx-click': $_viewId+'__br()', 'title': $n(selectedText),},$vnode_2 )); if(rList){   $vnode_4=[]; for(let $q_key_tzvhjuj=0,$q_a_vgeajqei=list,$q_c_nztuyzzuh=$q_a_vgeajqei.length;$q_key_tzvhjuj<$q_c_nztuyzzuh;$q_key_tzvhjuj++){let item=$q_a_vgeajqei[$q_key_tzvhjuj]; $vnode_5=[]; let text=item,value=item;;if(textKey&&valueKey){ $text='';text=item[textKey];$text+=' ';value=item[valueKey];}let equal=(value+'')===(selected+'');;  $vnode_7=[$_create(0,0,(text))];;$$_class='pbr pm';if(equal){;$$_class+=' pbs';};$vnode_6=[$_create('span',{'mx-click': $_viewId+'__bO({item:\''+$i($_ref,item)+'\'})', 'class': $$_class,},$vnode_7 )]; ;$vnode_5.push($_create('li',{'title': $n(text), 'active': ($_temp=(equal))!=null&&$_temp, 'class': 'pbq',},$vnode_6 )); $vnode_4.push(...$vnode_5); };$vnode_3=[$_create('ul',{'class': 'pbp', 'id': 'list_'+$n(id),},$vnode_4 )]; ;$vnode_2=[$_create('div',$_quick_vnode_attr_static_1,$vnode_3 )]; $vnode_1.push(...$vnode_2); };$$_class='pbh';if(disabled){;$$_class+=' pbj';};$vnode_0.push($_create('div',{'id': 'dd_'+$n(id), 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        index_1.default["__ba"]();
        this.on('destroy', () => {
            index_1.default['__at'](this);
            index_1.default['__bb']();
        });
        this.assign(data);
    },
    assign(data) {
        let me = this;
        let selected = data.selected;
        let textKey = data.textKey || '';
        let valueKey = data.valueKey || '';
        let emptyText = data.emptyText || '';
        let disabled = (data.disabled + '') === 'true';
        let list = data.list || [];
        list = list.slice();
        let map = magix_1.default.toMap(list, valueKey);
        if (emptyText) {
            if (textKey && valueKey) {
                if (!map['']) {
                    let temp = {};
                    temp[textKey] = emptyText;
                    temp[valueKey] = '';
                    list.unshift(temp);
                    map[''] = temp;
                }
            }
            else {
                if (!map[emptyText]) {
                    list.unshift(emptyText);
                    map[emptyText] = emptyText;
                }
            }
        }
        if (!selected && emptyText && !(textKey || valueKey)) {
            selected = emptyText;
        }
        if (!selected || !map[selected]) { //未提供选项，或提供的选项不在列表里，则默认第一个
            selected = map[selected] || list[0];
            if (textKey && valueKey) {
                selected = selected[valueKey];
            }
        }
        let selectedText = textKey && valueKey ? map[selected][textKey] : selected;
        me.set({
            selected,
            selectedText,
            list,
            textKey,
            valueKey,
            emptyText,
            disabled
        });
        return true;
    },
    render() {
        this.digest();
    },
    '__bp'(node) {
        return magix_1.default.inside(node, this.root);
    },
    '__y'() {
        let me = this;
        let node = magix_1.default.node('dd_' + me.id);
        if (!node.classList.contains('pbl')) {
            node.classList.add('pbl');
            let r = me.get('rList');
            let resume = () => {
                node = magix_1.default.node('list_' + me.id);
                let active = node.querySelector('li[active]');
                if (active && active.scrollIntoViewIfNeeded) {
                    active.scrollIntoViewIfNeeded();
                }
            };
            if (!r) {
                me.digest({
                    rList: true
                }, null, resume);
            }
            else {
                resume();
            }
            index_1.default['__au'](me);
        }
    },
    '__z'() {
        let me = this;
        let node = magix_1.default.node('dd_' + me.id);
        if (node.classList.contains('pbl')) {
            node.classList.remove('pbl');
            index_1.default['__at'](me);
        }
    },
    '__br<click>'() {
        let me = this;
        let node = magix_1.default.node('dd_' + me.id);
        if (node.classList.contains('pbl')) {
            me['__z']();
        }
        else if (!node.classList.contains('pbj')) {
            me['__y']();
        }
    },
    '__bO<click>'(e) {
        let me = this;
        me['__z']();
        let valueKey = me.get('valueKey');
        let textKey = me.get('textKey');
        let lastSelected = me.get('selected');
        let item = e.params.item;
        let selected = item;
        let selectedText = item;
        if (textKey && valueKey) {
            selectedText = item[textKey];
            selected = item[valueKey];
        }
        if (lastSelected !== selected) {
            me.digest({
                selected,
                selectedText
            });
            magix_1.default.dispatch(me.root, 'change', {
                item,
                value: valueKey ? item[valueKey] : item,
                text: textKey ? item[textKey] : item
            });
        }
    },
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-font/align",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
magix_1.default.applyStyle("pj",".pbt{display:inline-block;height:25px;line-height:25px;vertical-align:bottom}.pbu{width:20px;margin:0 1px;text-align:center;height:20px;line-height:20px;cursor:pointer;background:#e0e0e0;border-radius:2px}.pbu:hover{background:#ccc}.pbv,.pbv:hover{background:#fa742b;color:#fff}.pbw,.pbw .pbu{cursor:not-allowed;opacity:.7}.pbw .pbu,.pbw .pbu:hover{background:#e9e9e9}.pbw .pbv,.pbw .pbv:hover{background:#fb955d}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	disabled,
	i18n,
	value,}=$$,
$$_class,
$vnode_1,
$vnode_2,
$text; 
  $vnode_2=[$_create(0,0,'')];;$$_class='pd pbu px';if(value.h=='flex-start'){;$$_class+=' pbv';};$vnode_1=[$_create('li',{'title': $n(i18n('_ae')), 'mx-click': $_viewId+'__as({type:\'h\',v:\'flex-start\'})', 'class': $$_class,},$vnode_2 )];  $vnode_2=[$_create(0,0,'')];;$$_class='pd pbu px';if(value.h=='center'){;$$_class+=' pbv';};$vnode_1.push($_create('li',{'title': $n(i18n('_af')), 'mx-click': $_viewId+'__as({type:\'h\',v:\'center\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='pd pbu px';if(value.h=='flex-end'){;$$_class+=' pbv';};$vnode_1.push($_create('li',{'title': $n(i18n('_ag')), 'mx-click': $_viewId+'__as({type:\'h\',v:\'flex-end\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='pd pbu px';if(value.v=='flex-start'){;$$_class+=' pbv';};$vnode_1.push($_create('li',{'title': $n(i18n('_ah')), 'mx-click': $_viewId+'__as({type:\'v\',v:\'flex-start\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='pd pbu px';if(value.v=='center'){;$$_class+=' pbv';};$vnode_1.push($_create('li',{'title': $n(i18n('_ai')), 'mx-click': $_viewId+'__as({type:\'v\',v:\'center\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='pd pbu px';if(value.v=='flex-end'){;$$_class+=' pbv';};$vnode_1.push($_create('li',{'title': $n(i18n('_aj')), 'mx-click': $_viewId+'__as({type:\'v\',v:\'flex-end\'})', 'class': $$_class,},$vnode_2 )); ;$$_class='pk pbt';if(disabled){;$$_class+=' pbw';};$vnode_0.push($_create('ul',{'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        this.assign(data);
    },
    assign(data) {
        this['__bP'] = data.value;
        this.set({
            value: data.value,
            disabled: data.disabled
        });
        return true;
    },
    render() {
        this.digest();
    },
    '__as<click>'(e) {
        let me = this;
        if (me.get('disabled')) {
            return;
        }
        let value = me['__bP'];
        let { type, v } = e.params;
        value[type] = v;
        me['__bP'] = value;
        me.digest({
            value
        });
        magix_1.default.dispatch(me.root, 'input', {
            value
        });
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-font/style",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
magix_1.default.applyStyle("pj",".pbt{display:inline-block;height:25px;line-height:25px;vertical-align:bottom}.pbu{width:20px;margin:0 1px;text-align:center;height:20px;line-height:20px;cursor:pointer;background:#e0e0e0;border-radius:2px}.pbu:hover{background:#ccc}.pbv,.pbv:hover{background:#fa742b;color:#fff}.pbw,.pbw .pbu{cursor:not-allowed;opacity:.7}.pbw .pbu,.pbw .pbu:hover{background:#e9e9e9}.pbw .pbv,.pbw .pbv:hover{background:#fb955d}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	disabled,
	i18n,
	value,}=$$,
$$_class,
$vnode_1,
$vnode_2,
$text; 
  $vnode_2=[$_create(0,0,'')];;$$_class='pd pbu px';if(value.bold){;$$_class+=' pbv';};$vnode_1=[$_create('li',{'title': $n(i18n('_ak')), 'mx-click': $_viewId+'__as({key:\'bold\'})', 'class': $$_class,},$vnode_2 )];  $vnode_2=[$_create(0,0,'')];;$$_class='pd pbu px';if(value.italic){;$$_class+=' pbv';};$vnode_1.push($_create('li',{'title': $n(i18n('_al')), 'mx-click': $_viewId+'__as({key:\'italic\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='pd pbu px';if(value.underline){;$$_class+=' pbv';};$vnode_1.push($_create('li',{'title': $n(i18n('_am')), 'mx-click': $_viewId+'__as({key:\'underline\'})', 'class': $$_class,},$vnode_2 )); ;$$_class='pk pbt';if(disabled){;$$_class+=' pbw';};$vnode_0.push($_create('ul',{'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        this.assign(data);
    },
    assign(data) {
        this['__bP'] = data.value;
        this.set({
            value: data.value,
            disabled: data.disabled
        });
        return true;
    },
    render() {
        this.digest();
    },
    '__as<click>'(e) {
        let me = this;
        if (me.get('disabled')) {
            return;
        }
        let v = me['__bP'];
        let { key } = e.params;
        v[key] = !v[key];
        me['__bP'] = v;
        me.digest({
            value: v
        });
        magix_1.default.dispatch(me.root, 'input', {
            value: v
        });
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-menu/index",["magix","../mx-monitor/index"],(require,exports,module)=>{
/*magix_1,index_1*/
let $_quick_static_node_1;
let $_quick_vnode_attr_static_0={'class': 'pby pk',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
 */
const magix_1 = require("magix");
const index_1 = require("../mx-monitor/index");
magix_1.default.applyStyle("pk",".pbx{z-index:400}.pby{background-color:#fff;border:1px solid #e6e6e6;border-radius:2px;cursor:default;padding:2px 0;box-shadow:0 1px 3px 1px rgba(0,0,0,.06)}.pbz{height:22px;line-height:22px;cursor:default;border-radius:2px;padding:0 8px;margin:2px}.pbA{color:#fff;background-color:#fa742b}.pbB{height:1px;background:#eee;margin:4px 0}.pbC{color:#ccc;cursor:not-allowed}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	width,
	id,
	list,
	disabled,
	textKey,}=$$,
$vnode_1,
$vnode_2,
$vnode_3,
$vnode_4,
$$_class,
$vnode_5,
$text; 
  $vnode_2=[]; for(let $q_key_mdtvywus=0,$q_a_nuqoph=list,$q_c_sajkruhr=$q_a_nuqoph.length;$q_key_mdtvywus<$q_c_sajkruhr;$q_key_mdtvywus++){let one=$q_a_nuqoph[$q_key_mdtvywus]; $vnode_3=[]; if(one.spliter){  if ($_quick_static_node_1) {
                                $vnode_4=[$_quick_static_node_1]; }else{;$vnode_4=[$_quick_static_node_1=$_create('li',{'mxs': 'pt:_', 'class': 'pbB',})]; }$vnode_3.push(...$vnode_4); }else{  $vnode_5=[$_create(0,0,(one[textKey]))];;$$_class='pm pbz ';if(disabled[one.id]){;$$_class+=' pbC';};$vnode_4=[$_create('li',{'mx-mouseover': $_viewId+'__bX({d:'+$n(disabled[one.id]||0)+'})', 'mx-mouseout': $_viewId+'__bX({d:'+$n(disabled[one.id]||0)+'});', 'mx-click': $_viewId+'__bO({item:\''+$i($_ref,one)+'\',d:'+$n(disabled[one.id]||0)+'})', 'title': $n(one[textKey]), 'class': $$_class,},$vnode_5 )]; $vnode_3.push(...$vnode_4); }$vnode_2.push(...$vnode_3); };$vnode_1=[$_create('ul',$_quick_vnode_attr_static_0,$vnode_2 )]; ;$vnode_0.push($_create('div',{'style': 'width:'+$n(width)+'px;position:absolute;left:-10000px;top:-10000px', 'class': 'pbx', 'id': 'cnt_'+$n(id), 'mx-contextmenu': $_viewId+'__B()',},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(extra) {
        let me = this;
        me.assign(extra);
        index_1.default['__ba']();
        me.on('destroy', () => {
            index_1.default['__at'](me);
            index_1.default['__bb']();
        });
    },
    assign(ops) {
        let me = this;
        let width = ops.width || 140;
        let valueKey = ops.valueKey || 'id';
        let textKey = ops.textKey || 'text';
        me['__bQ'] = ops.list;
        me['__bR'] = width;
        me['__bS'] = valueKey;
        me['__bT'] = textKey;
        me['__bU'] = ops.disabled || {};
        me['__bV'] = ops.picked;
        return true;
    },
    render() {
        let me = this;
        me.digest({
            disabled: me['__bU'],
            list: me['__bQ'],
            width: me['__bR'],
            valueKey: me['__bS'],
            textKey: me['__bT']
        });
    },
    '__bp'(node) {
        return magix_1.default.inside(node, this.root);
    },
    '__y'(e) {
        let me = this;
        if (!me['__bW']) {
            me['__bW'] = 1;
            let n = magix_1.node('cnt_' + me.id);
            let width = n.clientWidth;
            let height = n.clientHeight;
            let left = e.pageX;
            let top = e.pageY;
            if ((left + width) > window.innerWidth) {
                left = left - width;
                if (left < 0)
                    left = 0;
            }
            if ((top + height) > window.innerHeight) {
                top -= height;
                if (top < 0)
                    top = 0;
            }
            n.style.left = left + 'px';
            n.style.top = top + 'px';
            index_1.default['__au'](me);
        }
    },
    '__z'() {
        let me = this;
        if (me['__bW']) {
            me['__bW'] = false;
            let n = magix_1.node('cnt_' + me.id);
            n.style.left = '-10000px';
            index_1.default['__at'](me);
        }
    },
    '__bX<mouseover,mouseout>'(e) {
        if (e.params.d)
            return;
        let target = e.eventTarget;
        let flag = !magix_1.default.inside(e.relatedTarget, target);
        if (flag) {
            target.classList[e.type == 'mouseout' ? 'remove' : 'add']('pbA');
        }
    },
    '__bO<click>'(e) {
        if (e.params.d)
            return;
        let me = this;
        me['__z']();
        let fn = me['__bV'];
        if (fn) {
            fn(e.params.item);
        }
    },
    '__B<contextmenu>'(e) {
        e.preventDefault();
    }
}, {
    show(view, e, ops) {
        let id = 'ctx_' + view.id;
        let n = magix_1.node(id);
        let vf = n && magix_1.default.Vframe.byNode(n);
        if (vf) {
            vf.invoke('assign', [ops]);
            vf.invoke('render');
            vf.invoke('__y', [e]);
        }
        else {
            document.body.insertAdjacentHTML("beforeend", `<div id="${id}"></div>`);
            vf = view.owner.mountVframe(magix_1.node(id), 'gallery/mx-menu/index', ops);
            vf.invoke('__y', [e]);
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-monitor/index",[],(require,exports,module)=>{
/**/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@taobao.com
 */
let ICounter = 0;
let Instances = [];
let DocumentEvents = ['mousedown', 'keyup', 'touchstart', 'pointerstart'];
let Watcher = (e) => {
    for (let i = Instances.length; i--;) {
        let info = Instances[i];
        if (info['__bY']) {
            Instances.splice(i, 1);
        }
        else {
            let view = info['__bZ'];
            if (e.type == 'resize' || !view['__bp'](e.target)) {
                view['__z']();
            }
        }
    }
};
let Remove = view => {
    let info = Instances[view.id];
    if (info) {
        info['__bY'] = true;
    }
    delete Instances[view.id];
};
exports.default = {
    '__au'(view) {
        Remove(view);
        let info = {
            '__bZ': view
        };
        Instances.push(info);
        Instances[view.id] = info;
    },
    '__at': Remove,
    '__ba'() {
        if (!ICounter) {
            for (let e of DocumentEvents) {
                document.addEventListener(e, Watcher);
            }
            window.addEventListener('resize', Watcher);
        }
        ICounter++;
    },
    '__bb'() {
        if (ICounter > 0) {
            ICounter--;
            if (!ICounter) {
                for (let e of DocumentEvents) {
                    document.removeEventListener(e, Watcher);
                }
                window.removeEventListener('resize', Watcher);
            }
        }
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-number/index",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
 */
const magix_1 = require("magix");
magix_1.default.applyStyle("pl",".pbD{width:100%;border:none;height:100%;background-color:transparent;color:#333;display:block}.pbE,.pbF{width:20px;height:50%;position:absolute;right:1px;border:2px solid #fff;border-radius:2px;cursor:pointer}.pbE:hover,.pbF:hover{background-color:#f0f0f0}.pbF{top:1px}.pbE{bottom:1px}.pbG:after{width:0;height:0;position:absolute;top:0;right:0;bottom:0;left:0;border-left:4px solid transparent;border-right:4px solid transparent;content:\"\";display:block;margin:auto}.pbE:after{border-top:4px solid #ccc}.pbF:after{border-bottom:4px solid #ccc}.pbE.pbH,.pbF.pbH{cursor:not-allowed;border-color:transparent}.pbE.pbH:hover,.pbF.pbH:hover{background-color:transparent}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	id,
	disabled,}=$$,
$$_class; 
 ;$vnode_0.push($_create('input',{'class': 'pbD', 'id': 'ipt_'+$n(id), 'mx-focusin': $_viewId+'__cr()', 'mx-focusout': $_viewId+'__ct()', 'mx-change': $_viewId+'__cq()', 'mx-keydown': $_viewId+'__cy()', 'disabled': (disabled), 'autocomplete': 'off', 'mx-input': $_viewId+'__cz()',},0,1));  ;$$_class='pbF pbG pk';if(disabled){;$$_class+=' pbH';};$vnode_0.push($_create('span',{'mx-click': $_viewId+'__cm({i:1})', 'mx-mousedown': $_viewId+'__cx({i:1})', 'mx-contextmenu': $_viewId+'__B()', 'class': $$_class,}));  ;$$_class='pbE pbG pk';if(disabled){;$$_class+=' pbH';};$vnode_0.push($_create('span',{'mx-click': $_viewId+'__cm()', 'mx-mousedown': $_viewId+'__cx()', 'mx-contextmenu': $_viewId+'__B()', 'class': $$_class,}));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(extra) {
        let me = this;
        me.assign(extra);
    },
    assign(ops) {
        let me = this;
        let v = ops.value;
        if (v === undefined)
            v = '';
        if (v !== '') {
            v = +v;
        }
        let diff = me['__c_'] !== v;
        let preDis = me['__ca'];
        me['__c_'] = v;
        me['__cb'] = +ops.step || 1;
        me['__cc'] = (ops.empty + '') == 'true';
        me['__cd'] = (ops.format + '') == 'true';
        me['__ca'] = me.root.hasAttribute('disabled');
        me['__ce'] = magix_1.default.has(ops, 'max') ? +ops.max : Number.MAX_VALUE;
        me['__cf'] = magix_1.default.has(ops, 'min') ? +ops.min : -Number.MAX_VALUE;
        me['__cg'] = +ops.ratio || 10;
        me['__ch'] = ops.fixed || 0;
        return diff || preDis != me['__ca'];
    },
    render() {
        let me = this;
        me.digest({
            disabled: me['__ca']
        }, null, () => {
            me['__ci']();
        });
    },
    '__ci'() {
        let me = this;
        let v = me['__c_'];
        if (v !== '') {
            v = me['__cj'](v); //.toFixed(me['@{tail.length}']);
            if (me['__cd']) {
                v = v.toFixed(me['__ch']);
            }
        }
        me['__ck'] = magix_1.node('ipt_' + me.id);
        me['__ck'].value = v;
    },
    '__cj'(v) {
        let me = this;
        v = +v;
        if (v || v === 0) {
            let max = me['__ce'];
            let min = me['__cf'];
            // let step = me['@{step}'];
            // v = step < 1 ? Math.round(v / step) * step : v;
            if (v > max) {
                v = max;
            }
            else if (v < min) {
                v = min;
            }
            v = +v.toFixed(me['__ch']);
        }
        return isNaN(v) ? (me['__cc'] ? '' : 0) : v;
    },
    '__cl'(v, ignoreFill) {
        let me = this;
        if (v === '' && me['__cc']) {
            magix_1.default.dispatch(me.root, 'input', {
                value: me['__c_'] = v
            });
            return;
        }
        v = me['__cj'](v);
        if (v !== me['__c_']) {
            if (!ignoreFill) {
                me['__ck'].value = v;
            }
            magix_1.default.dispatch(me.root, 'input', {
                value: me['__c_'] = v
            });
        }
        return me['__c_'];
    },
    '__cm'(increase, enlarge) {
        let me = this;
        console.log(increase);
        let value = me['__c_'];
        if (value === '')
            value = 0; //for init
        let step = me['__cb'];
        let c = value;
        if (enlarge)
            step *= me['__cg'];
        if (increase) {
            c += step;
        }
        else {
            c -= step;
        }
        me['__cl'](c);
    },
    '__cn'() {
        let me = this;
        let ipt = me['__ck'];
        if (ipt) {
            ipt.focus();
            ipt.selectionStart = ipt.selectionEnd = ipt.value.length;
        }
    },
    '__cp'() {
        let me = this;
        me.root.classList.add('pw');
        if (!magix_1.default.has(me, '__co')) {
            me['__co'] = me['__c_'];
        }
    },
    '__cq<change>'(e) {
        e.stopPropagation();
    },
    '__cr<focusin>'() {
        this['__cp']();
    },
    '__ct<focusout>'(e) {
        let me = this;
        if (!me['__cs']) {
            me.root.classList.remove('pw');
            me['__ci']();
            if (me['__co'] != me['__c_']) {
                magix_1.default.dispatch(me.root, 'change', {
                    value: me['__c_']
                });
            }
            delete me['__co'];
        }
    },
    '__cm<click>'(e) {
        let me = this;
        if (!me['__ca'] && !me['__cu']) {
            me['__cm'](e.params.i, e.shiftKey);
            me['__cn']();
        }
    },
    '__cx<mousedown>'(e) {
        let me = this;
        if (!me['__ca']) {
            me['__cs'] = true;
            me['__cp']();
            let i = e.params.i;
            me['__cv'] = setTimeout(me.wrapAsync(() => {
                me['__cw'] = setInterval(me.wrapAsync(() => {
                    me['__cu'] = true;
                    me['__cm'](i);
                    me['__cn']();
                }), 50);
            }), 300);
        }
    },
    '__cy<keydown>'(e) {
        if (e.keyCode == 38 || e.keyCode == 40) {
            e.preventDefault();
            let me = this;
            if (!me['__ca']) {
                let target = e.eventTarget;
                let value = target.value;
                if (value === '') {
                    me['__c_'] = '';
                }
                else {
                    let v = Number(value);
                    if (v || v === 0) {
                        if (v != me['__c_']) {
                            me['__c_'] = v;
                        }
                    }
                }
                me['__cm'](e.keyCode == 38, e.shiftKey);
            }
        }
    },
    '__B<contextmenu>'(e) {
        e.preventDefault();
    },
    '__cz<input>'(e) {
        e.stopPropagation();
        let target = e.eventTarget;
        this['__cl'](target.value, true);
    },
    '$doc<mouseup>'() {
        let me = this;
        clearTimeout(me['__cv']);
        clearInterval(me['__cw']);
        delete me['__cs'];
        setTimeout(me.wrapAsync(() => {
            delete me['__cu'];
        }), 0);
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-picture/index",["magix","../mx-dialog/index"],(require,exports,module)=>{
/*magix_1,index_1*/
let $_quick_vnode_attr_static_0={'class': 'pbJ',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../mx-dialog/index");
magix_1.default.applyStyle("pm",".pbI{height:100px;padding:4px;border:1px solid #e6e6e6;background:#fff;cursor:pointer;margin:4px 0}.pbJ{line-height:92px;text-align:center;color:#999}.pbK{min-height:500px}.pbL{width:100px;height:100px;margin:4px;overflow:hidden;border:1px solid #e6e6e6;cursor:pointer;padding:4px}.pbL:hover{border-color:#999}.pbM{width:100%;height:100%;background-position:50%;background-repeat:no-repeat;background-size:contain}.pbN{width:100px;margin:0 5px;height:25px}.pbO{margin:30px 0}.pbP{font-size:16px}.pbQ{position:absolute;right:3px;top:2px;opacity:.2}.pbQ:hover{opacity:.5}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	src,
	i18n,}=$$,
$vnode_1,
$vnode_2,
$vnode_3,
$vnode_4,
$text; 
 $vnode_1=[]; if(src){   $vnode_4=[$_create(0,0,'')];;$vnode_3=[$_create('i',{'class': 'p_ pbQ', 'mx-click': $_viewId+'__cC()', 'title': $n(i18n('_an')),},$vnode_4 )]; ;$vnode_2=[$_create('div',{'class': 'pbM', 'style': 'background-image:url(\''+$n(src)+'\')',},$vnode_3 )]; $vnode_1.push(...$vnode_2); }else{  $vnode_3=[$_create(0,0,(i18n('_ao')))];;$vnode_2=[$_create('div',$_quick_vnode_attr_static_0,$vnode_3 )]; $vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',{'class': 'pbI ph', 'mx-click': $_viewId+'__cB()',},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    init(data) {
        this.assign(data);
    },
    assign(data) {
        this.set(data);
        return true;
    },
    render() {
        this.digest();
    },
    '__cB<click>'() {
        let me = this;
        me.mxDialog('gallery/mx-picture/list', {
            width: 932,
            done(pic) {
                me.digest(pic);
                me['__cA'](pic);
            }
        });
    },
    '__cA'(pic) {
        magix_1.default.dispatch(this.root, 'change', pic);
    },
    '__cC<click>'(e) {
        e.stopPropagation();
        this.digest({
            src: ''
        });
        this['__cA']({
            src: '',
            width: 0,
            height: 0
        });
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-picture/list",["magix","../../designer/service","../../i18n/index"],(require,exports,module)=>{
/*magix_1,service_1,index_1*/
let $_quick_vnode_attr_static_0={'class': 'pp pF',};
let $_quick_vnode_attr_static_1={'class': 'pq pj pbK',};
let $_quick_vnode_attr_static_2={'class': 'pc pbO pbP',};
let $_quick_vnode_attr_static_3={'class': 'pc pbN pm',};
/*
    author:xinglie.lkf@alibaba-inc.com
*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const service_1 = require("../../designer/service");
const index_1 = require("../../i18n/index");
exports.default = magix_1.default.View.extend({
    mixins: [service_1.default],
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i,$eq)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	i18n,
	error,
	list,}=$$,
$vnode_1,
$vnode_2,
$text,
$vnode_3,
$vnode_4,
$vnode_5; 
  $vnode_2=[$_create(0,0,(i18n('_aq')))];;$vnode_1=[$_create('h5',0,$vnode_2 )]; ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_0,$vnode_1 ));  $vnode_1=[]; if(error){  $vnode_3=[$_create(0,0,(error.msg))];;$vnode_2=[$_create('div',$_quick_vnode_attr_static_2,$vnode_3 )]; $vnode_1.push(...$vnode_2); }else{ $vnode_2=[]; for(let $q_key_gdzumbym=0,$q_a_rggrcjlkor=list,$q_c_gonkhusf=$q_a_rggrcjlkor.length;$q_key_gdzumbym<$q_c_gonkhusf;$q_key_gdzumbym++){let p=$q_a_rggrcjlkor[$q_key_gdzumbym];    ;$vnode_5=[$_create('div',{'class': 'pbM', 'style': 'background-image:url(\''+$n(p.src)+'\')',})]; ;$vnode_4=[$_create('div',{'class': 'pbL', 'mx-click': $_viewId+'__cE({src:\''+($eq(p.src))+'\'})',},$vnode_5 )];  $vnode_5=[$_create(0,0,(p.title))];;$vnode_4.push($_create('div',$_quick_vnode_attr_static_3,$vnode_5 )); ;$vnode_3=[$_create('div',{'class': 'pd', 'title': $n(p.title),},$vnode_4 )]; $vnode_2.push(...$vnode_3); }$vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',$_quick_vnode_attr_static_1,$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        let me = this;
        me['__bt'] = data.dialog;
        me['__cD'] = data.done;
    },
    render() {
        this.fetch(['__ah'], (err, bag) => {
            this.digest({
                error: err,
                list: bag.get('data', [])
            });
        });
    },
    '__cE<click>'(e) {
        let me = this;
        let img = new Image();
        let done = me['__cD'];
        let src = e.params.src;
        img.onerror = me.wrapAsync(() => {
            me.alert(index_1.default('__ap'));
        });
        img.onload = me.wrapAsync(() => {
            let w = img.width;
            let h = img.height;
            me['__bt'].close();
            done({
                src,
                width: w,
                height: h
            });
        });
        img.src = src;
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-pointer/cursor",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const CursorId = magix_1.default.guid('cursor_');
magix_1.default.applyStyle("pn",".pbR{opacity:0;background:#fff;position:fixed;left:0;right:0;top:0;bottom:0;z-index:10000}");
const Body = document.body;
exports.default = {
    '__y'(e) {
        let styles = getComputedStyle(e);
        this['__aw'](styles.cursor);
    },
    '__aw'(cursor) {
        let n = magix_1.node(CursorId);
        if (!n) {
            document.body.insertAdjacentHTML('beforeend', `<div class="pbR" id="${CursorId}"/>`);
            n = magix_1.node(CursorId);
        }
        n.style.cursor = cursor;
        n.style.display = 'block';
    },
    '__z'() {
        magix_1.node(CursorId).style.display = 'none';
    },
    '__I'(cursor) {
        Body.style.cursor = cursor;
    },
    '__K'() {
        Body.style.cursor = 'auto';
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-pointer/follower",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
magix_1.default.applyStyle("po",".pbS{background:#fa742b;position:absolute;opacity:.6;left:-1000px;top:-1000px;width:30px;height:30px;text-align:center;line-height:30px;color:#fff;border-radius:2px;z-index:5000;pointer-events:none}");
let DEId = magix_1.default.guid('de_');
exports.default = {
    '__aH'(html) {
        let n = magix_1.node(DEId);
        if (!n) {
            document.body.insertAdjacentHTML('beforeend', `<div class="pbS px" id="${DEId}"/>`);
            n = magix_1.node(DEId);
        }
        n.innerHTML = html;
    },
    '__y'(e) {
        let s = magix_1.node(DEId).style;
        s.left = e.pageX + 10 + 'px';
        s.top = e.pageY + 18 + 'px';
    },
    '__z'() {
        let s = magix_1.node(DEId).style;
        s.left = -1e3 + 'px';
        s.top = -1e3 + 'px';
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-pointer/select",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
magix_1.default.applyStyle("pp",".pbT{position:absolute;border:1px dashed #fa742b;display:none;pointer-events:none}");
let SId = magix_1.default.guid('set_');
exports.default = {
    '__H'() {
        let n = magix_1.node(SId);
        if (!n) {
            document.body.insertAdjacentHTML('beforeend', `<div id="${SId}" class="pbT"></div>`);
        }
    },
    '__aH'(left, top, width, height) {
        let ns = magix_1.node(SId).style;
        ns.left = left + 'px';
        ns.top = top + 'px';
        ns.width = width + 'px';
        ns.height = height + 'px';
        ns.display = 'block';
    },
    '__z'() {
        magix_1.node(SId).style.display = 'none';
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-runner/fx",["magix","./index"],(require,exports,module)=>{
/*magix_1,index_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const index_1 = require("./index");
let DALG = t => t;
let Now = Date.now;
let FX = function (interval, alg) {
    let me = this;
    if (!me['__cF'] || alg) {
        alg = alg || DALG;
        me['__cF'] = (from, to) => {
            return (from + (to - from) * alg(me['__cG'] / me['__cH']));
        };
    }
    me['__cI'] = [];
    me['__cJ'] = interval;
};
magix_1.default.mix(FX.prototype, {
    '__cO'(time, callback) {
        let me = this;
        if (!me['__bY']) {
            me['__cI'].push({
                '__cK': time,
                '__cL': callback
            });
            if (!me['__cM']) {
                me['__cN']();
            }
        }
    },
    '__cN'() {
        let me = this;
        let item = me['__cI'].shift();
        if (item) {
            me['__cH'] = item['__cK'];
            me['__cP'] = item['__cL'];
            me['__cQ'] = Now();
            if (!me['__cM']) {
                index_1.default['__cR'](me['__cJ'], me['__cM'] = end => {
                    me['__cG'] = Date.now() - me['__cQ'];
                    if (me['__cG'] > me['__cH']) {
                        me['__cG'] = me['__cH'];
                        end = 1;
                    }
                    try {
                        me['__cP'](me['__cF']);
                    }
                    catch (e) {
                        end = e;
                    }
                    if (end) {
                        me['__cN']();
                    }
                });
            }
        }
        else {
            me['__cS']();
        }
    },
    '__cS'() {
        let me = this;
        if (me['__cM']) {
            index_1.default['__cT'](me['__cM']);
            delete me['__cM'];
        }
    },
    destroy() {
        let me = this;
        me['__cS']();
        me['__cI'] = [];
        me['__bY'] = 1;
    }
});
exports.default = {
    '__cV'(interval, alg) {
        let fx = new FX(interval, alg);
        this.capture(magix_1.default.guid('__cU'), fx);
        return fx;
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-runner/index",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
 */
const magix_1 = require("magix");
let setRAF = window.requestAnimationFrame || ((fn) => {
    return setTimeout(fn, 16);
});
let cancelRAF = window.cancelAnimationFrame || clearTimeout;
let Now = Date.now;
exports.default = {
    '__cI': [],
    '__cR'(interval, fn) {
        let me = this;
        me['__cI'].push({
            i: interval || 15,
            f: fn,
            n: Now()
        });
        me['__cN']();
    },
    '__cT'(fn) {
        let me = this;
        let q = me['__cI'];
        for (let o, i = 0; i < q.length; i++) {
            o = q[i];
            if (!o.r && o.f == fn) {
                o.r = 1;
                break;
            }
        }
    },
    '__cN'() {
        let me = this;
        if (!me['__cW']) {
            let run = () => {
                let q = me['__cI'];
                for (let i = 0, o, now; i < q.length; i++) {
                    o = q[i];
                    if (o.r) {
                        q.splice(i--, 1);
                    }
                    else {
                        now = Now();
                        if (now - o.n >= o.i) {
                            o.n = now;
                            magix_1.default.toTry(o.f);
                        }
                    }
                }
                if (!q.length) {
                    cancelRAF(me['__cW']);
                    delete me['__cW'];
                }
                else {
                    me['__cW'] = setRAF(run);
                }
            };
            me['__cW'] = setRAF(run);
        }
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("i18n/index",["magix","./zh-cn"],(require,exports,module)=>{
/*magix_1,zh_cn_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const zh_cn_1 = require("./zh-cn");
const I18n = {
    'zh-cn': zh_cn_1.default
};
const DefaultLang = 'zh-cn';
const Has = magix_1.default.has;
const Reg = /\{(\d+)\}/g;
exports.default = (key, ...args) => {
    let lang = (magix_1.default.config('lang') || navigator.language).toLowerCase();
    if (!Has(I18n, lang)) {
        lang = DefaultLang;
    }
    let l = I18n[lang];
    let res = Has(l, key) ? l[key] : key;
    if (args.length) {
        res = res.replace(Reg, (m, i, k) => {
            i |= 0;
            if (args.length > i) {
                k = args[i];
                return Has(l, k) ? l[k] : k;
            }
            return m;
        });
    }
    return res;
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("i18n/zh-cn",[],(require,exports,module)=>{
/**/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    '_k': '报表设计器',
    '__ab': '提示',
    '_ac': '确定',
    '_ad': '取消',
    '_w': '放大',
    '_v': '缩小',
    '__': '删除辅助线',
    '_a': '按下拖动可移动辅助线',
    '_r': '撤销(Ctrl+Z)',
    '_s': '重做(Ctrl+Y,Ctrl+Shift+Z)',
    '__ar': '按下移动面板',
    '__as': '按下拖动改变面板宽度',
    '__at': '按下拖动改变面板高度',
    '__au': '元素',
    '__av': '属性',
    '__aw': '数据源',
    '_u': '打开{0}面板',
    '_t': '关闭{0}面板',
    '__ax': '展开{0}面板',
    '__ay': '折叠{0}面板',
    '_x': '按下拖动旋转元素',
    '_y': '按下拖动改变元素宽度',
    '_z': '按下拖动改变元素高度',
    '_A': '按下拖动改变元素宽度和高度',
    '__az': '类型：',
    '__Q': 'X坐标：',
    '__R': 'Y坐标：',
    '__C': '宽：',
    '__D': '高：',
    '__S': '旋转角度：',
    '__H': '背景颜色：',
    '__W': '文字颜色：',
    '__b': '全选',
    '__e': '粘贴',
    '__c': '复制',
    '__d': '剪切',
    '__j': '删除',
    '__f': '上移一层',
    '__h': '移至顶层',
    '__g': '下移一层',
    '__i': '移至底层',
    '_l': '左对齐',
    '_n': '右对齐',
    '_o': '上对齐',
    '_q': '下对齐',
    '_p': '垂直居中对齐',
    '_m': '水平居中对齐',
    '__ap': '获取图片尺寸失败，请重试～～',
    '_an': '清除图片',
    '_ao': '点击选择图片',
    '_aq': '图片库',
    '_aa': '清除颜色',
    '__T': '字号：',
    '__aA': '页面宽度：',
    '__aB': '页面高度：',
    '__E': '页面缩放：',
    '__I': '背景图片：',
    '__J': '背景平铺：',
    '__K': '拉伸铺满',
    '__L': '原始尺寸',
    '__M': '横向平铺',
    '__N': '垂直平铺',
    '__O': '双向平铺',
    '__F': '自适应',
    '__G': '全屏铺满',
    '__a_': '锁定编辑：',
    '__P': '文本',
    '__B': '页面',
    '__U': '透明度：',
    '__V': '字间距：',
    '__Z': '内容：',
    '__X': '样式：',
    '__Y': '排列：',
    '_ak': '加粗',
    '_al': '斜体',
    '_am': '下划线',
    '_ae': '水平居左',
    '_af': '水平居中',
    '_ag': '水平居右',
    '_ah': '垂直居上',
    '_ai': '垂直居中',
    '_aj': '垂直居下',
    '__aC': '上',
    '__aD': '右',
    '__aE': '下',
    '__aF': '左',
    '__aG': '外边距：',
    '__aH': '内边距：'
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("util/converter",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
exports.default = {
    '__aG'({ x, y }) {
        let n = magix_1.node('stage_canvas');
        let pos = n.getBoundingClientRect();
        x = x - pos.left; // + oNode.prop('scrollLeft');
        y = y - pos.top; // + oNode.prop('scrollTop');
        return {
            x,
            y
        };
    },
    '__cX'({ x, y }) {
        let n = magix_1.node('stage_canvas');
        let pos = n.getBoundingClientRect();
        x = x + pos.left; // + oNode.prop('scrollLeft');
        y = y + pos.top; // + oNode.prop('scrollTop');
        return {
            x,
            y
        };
    },
    '__aZ'(x) {
        let s = magix_1.State.get('__c');
        return (x / s) | 0;
    },
    '__b_'(x) {
        let s = magix_1.State.get('__c');
        return x * s;
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("util/transform",[],(require,exports,module)=>{
/**/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//transform
const Points = {
    lt: 0,
    mt: 1,
    rt: 2,
    rm: 3,
    rb: 4,
    mb: 5,
    lb: 6,
    lm: 7
};
exports.default = {
    '__az'({ x, y, width, height }, angle) {
        let r = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2;
        let a = width ? Math.round(Math.atan(height / width) * 180 / Math.PI) : 0;
        let tlbra = 180 - angle - a;
        let trbla = a - angle;
        let ta = 90 - angle;
        let ra = angle;
        let halfWidth = width / 2;
        let halfHeight = height / 2;
        let middleX = x + halfWidth;
        let middleY = y + halfHeight;
        let topLeft = {
            x: middleX + r * Math.cos(tlbra * Math.PI / 180),
            y: middleY - r * Math.sin(tlbra * Math.PI / 180)
        };
        let top = {
            x: middleX + halfHeight * Math.cos(ta * Math.PI / 180),
            y: middleY - halfHeight * Math.sin(ta * Math.PI / 180),
        };
        let topRight = {
            x: middleX + r * Math.cos(trbla * Math.PI / 180),
            y: middleY - r * Math.sin(trbla * Math.PI / 180)
        };
        let right = {
            x: middleX + halfWidth * Math.cos(ra * Math.PI / 180),
            y: middleY + halfWidth * Math.sin(ra * Math.PI / 180),
        };
        let bottomRight = {
            x: middleX - r * Math.cos(tlbra * Math.PI / 180),
            y: middleY + r * Math.sin(tlbra * Math.PI / 180)
        };
        let bottom = {
            x: middleX - halfHeight * Math.sin(ra * Math.PI / 180),
            y: middleY + halfHeight * Math.cos(ra * Math.PI / 180),
        };
        let bottomLeft = {
            x: middleX - r * Math.cos(trbla * Math.PI / 180),
            y: middleY + r * Math.sin(trbla * Math.PI / 180)
        };
        let left = {
            x: middleX - halfWidth * Math.cos(ra * Math.PI / 180),
            y: middleY - halfWidth * Math.sin(ra * Math.PI / 180),
        };
        let minX = Math.min(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x);
        let maxX = Math.max(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x);
        let minY = Math.min(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y);
        let maxY = Math.max(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y);
        return {
            point: [topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left],
            width: maxX - minX,
            height: maxY - minY,
            left: minX,
            right: maxX,
            top: minY,
            bottom: maxY
        };
    },
    '__aW'(point, pointer) {
        let oppositePoint = {};
        let currentPoint = {};
        let currentIndex = Points[pointer];
        let oppositeIndex = 0;
        currentPoint = point[currentIndex];
        // 对角线点index相差4
        let offset = 4;
        let oIndex = currentIndex - offset;
        if (oIndex < 0) {
            oIndex = currentIndex + offset;
        }
        // 取对角线点坐标
        oppositePoint = point.slice(oIndex, oIndex + 1)[0];
        oppositeIndex = oIndex;
        return {
            current: {
                index: currentIndex,
                point: currentPoint
            },
            opposite: {
                index: oppositeIndex,
                point: oppositePoint
            }
        };
    },
    '__dm'(params, baseIndex) {
        let { x, y, width, height, scale } = params;
        let offset = {
            x: 0,
            y: 0
        };
        let deltaXScale = scale.x - 1;
        let deltaYScale = scale.y - 1;
        let deltaWidth = width * deltaXScale;
        let deltaHeight = height * deltaYScale;
        let newWidth = width + deltaWidth;
        let newHeight = height + deltaHeight;
        let newX = x - deltaWidth / 2;
        let newY = y - deltaHeight / 2;
        if (baseIndex) {
            let points = [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
            let newPoints = [{ x: newX, y: newY }, { x: newX + newWidth, y: newY }, { x: newX + newWidth, y: newY + newHeight }, { x: newX, y: newY + newHeight }];
            offset.x = points[baseIndex].x - newPoints[baseIndex].x;
            offset.y = points[baseIndex].y - newPoints[baseIndex].y;
        }
        return {
            x: newX + offset.x,
            y: newY + offset.y,
            width: newWidth,
            height: newHeight
        };
    },
    '__aX'(oPoint, scale, oTransformedRect, baseIndex) {
        let scaledRect = this['__dm']({
            x: oPoint.x,
            y: oPoint.y,
            width: oPoint.width,
            height: oPoint.height,
            scale: scale
        });
        // 缩放后元素的高宽
        let newWidth = scaledRect.width;
        let newHeight = scaledRect.height;
        let transformedRotateRect = this['__az'](scaledRect, oPoint.rotate);
        // 计算到平移后的新坐标
        let translatedX = oTransformedRect.point[baseIndex].x - transformedRotateRect.point[baseIndex].x + transformedRotateRect.left;
        let translatedY = oTransformedRect.point[baseIndex].y - transformedRotateRect.point[baseIndex].y + transformedRotateRect.top;
        // 计算平移后元素左上角的坐标
        let newX = translatedX + transformedRotateRect.width / 2 - newWidth / 2;
        let newY = translatedY + transformedRotateRect.height / 2 - newHeight / 2;
        return {
            left: newX,
            top: newY,
            width: newWidth,
            height: newHeight
        };
    },
    '__dk'({ x, y, width, height }, deg) {
        if (width == 0) {
            return {
                x, y
            };
        }
        //圆心x0,y0
        let x0 = x + width / 2;
        let y0 = y + height / 2;
        //半径r
        let r = Math.sqrt(width * width / 2 / 2 + height * height / 2 / 2);
        //初始角度 左上角与圆心的角度
        let deg0 = 180 * Math.atan(height / width) / Math.PI;
        //旋转角度，与x轴正方向角度，左上角顶点要加上180度
        let rDeg = deg0 + deg + 180;
        //新的左上角坐标
        let x1 = x0 + r * Math.cos(rDeg * Math.PI / 180);
        let y1 = y0 + r * Math.sin(rDeg * Math.PI / 180);
        return {
            x: x1,
            y: y1
        };
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("panels/index",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
let Panels = [{
        title: '__au',
        icon: '&#xe629;',
        width: 100,
        height: 120,
        left: 25,
        top: 90,
        show: false,
        resizeY: true,
        id: 'p-elements',
        view: 'panels/elements/index'
    }, {
        title: '__av',
        icon: '&#xe7a1;',
        width: 240,
        height: 120,
        right: 10,
        top: 90,
        show: true,
        resizeY: true,
        id: 'p-props',
        view: 'panels/props/index'
    }, {
        title: '__aw',
        icon: '&#xe609;',
        width: 200,
        height: 120,
        show: false,
        right: 260,
        top: 90,
        id: 'p-data',
        view: 'panels/data/index'
    }];
let PanelsMap = magix_1.default.toMap(Panels, 'id');
exports.default = {
    '__Y'() {
        for (let p of Panels) {
            if (p.show) {
                this['__da'](p.id, true);
            }
        }
        magix_1.State.fire('__n');
    },
    '__da'(id, prevent) {
        let info = PanelsMap[id];
        if (!info.opened) {
            info.opened = 1;
            if (!info.eId) {
                info.eId = magix_1.default.guid('panel_');
                let app = magix_1.node(magix_1.default.config('rootId'));
                app.insertAdjacentHTML('beforeend', `<div id="${info.eId}"></div>`);
                let root = magix_1.Vframe.byNode(app);
                info.close = () => {
                    this['__db'](info.id);
                };
                root.mountVframe(magix_1.node(info.eId), 'panels/panel', info);
            }
            else {
                magix_1.node(info.eId).style.display = 'block';
            }
            if (!prevent) {
                magix_1.State.fire('__n');
                let vf = magix_1.Vframe.byNode(magix_1.node(info.eId));
                vf.invoke('__y');
            }
        }
    },
    '__db'(id) {
        let info = PanelsMap[id];
        if (info.opened) {
            info.opened = 0;
            let n = magix_1.node(info.eId);
            n.style.display = 'none';
            magix_1.State.fire('__n');
            let vf = magix_1.Vframe.byNode(n);
            vf.invoke('__z');
        }
    },
    '__aS'(id) {
        let info = PanelsMap[id];
        if (info.opened) {
            this['__db'](id);
        }
        else {
            this['__da'](id);
        }
    },
    '__aR'() {
        return Panels;
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("panels/panel",["magix","../gallery/mx-pointer/cursor","../gallery/mx-dragdrop/index"],(require,exports,module)=>{
/*magix_1,cursor_1,index_1*/
let $_quick_vnode_attr_static_0={'class': 'pc_ pk pj',};
let $_quick_vnode_attr_static_1={'class': 'px py pz',};
let $_quick_vnode_attr_static_2={'class': 'pe pE pb',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const cursor_1 = require("../gallery/mx-pointer/cursor");
const index_1 = require("../gallery/mx-dragdrop/index");
magix_1.default.applyStyle("pr",".pbZ{background:hsla(0,0%,100%,.93);position:absolute;box-shadow:0 2px 4px 0 rgba(0,0,0,.3)}.pc_{font-size:12px;height:18px;line-height:18px;background:#fa742b;color:#fff}.pca{padding:0 5px;cursor:move;width:calc(100% - 36px)}.pcb{width:16px;height:14px;margin:0 1px;font-size:11px;cursor:pointer;display:inline-flex;justify-content:center;align-items:center;border-radius:2px}.pcb:hover{background:#e64e30}.pcc{overflow:hidden;transition:height .25s}.pcd{transition:none}.pce{width:calc(100% - 2px);overflow:auto;float:left}.pcf{width:2px;float:right;cursor:ew-resize}.pcg,.pcf{background:#fafafa}.pcg{height:2px;cursor:ns-resize}.pch{scroll-behavior:smooth}.pch::-webkit-scrollbar,.pch::-webkit-scrollbar-corner{height:2px;width:2px;background:#fafafa}");
let MinWidth = 100;
let ZIndex = 300;
let Panels = [];
let PanelsManager = {
    '__au'(view) {
        Panels.push(view);
    },
    '__at'(view) {
        for (let i = Panels.length; i--;) {
            if (Panels[i] == view) {
                Panels.splice(i, 1);
                break;
            }
        }
        this['__dc']();
    },
    '__dc'() {
        for (let i = Panels.length; i--;) {
            Panels[i]['__dd'](ZIndex + i);
        }
    },
    '__de'(view) {
        if (Panels[Panels.length - 1] != view) {
            for (let i = Panels.length; i--;) {
                if (Panels[i] == view) {
                    Panels.splice(i, 1);
                    break;
                }
            }
            Panels.push(view);
            this['__dc']();
        }
    }
};
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	width,
	left,
	right,
	top,
	zIndex,
	id,
	i18n,
	icon,
	title,
	shrink,
	height,
	resizeX,
	view,
	resizeY,}=$$,
$$_style,
$vnode_1,
$vnode_2,
$vnode_3,
$vnode_4,
$text,
$$_class; 
    $vnode_4=[$_create(0,1,(icon))];;$vnode_3=[$_create('i',$_quick_vnode_attr_static_1,$vnode_4 )]; $vnode_3.push($_create(0,0,(i18n(title))));;$vnode_2=[$_create('div',{'class': 'pca pd', 'title': $n(i18n('__ar')), 'mx-mousedown': $_viewId+'__dg()',},$vnode_3 )];   $vnode_4=[$_create(0,0,'')];;$$_class='px pcb';if(shrink){;$$_class+=' pA';};$vnode_3=[$_create('i',{'mx-click': $_viewId+'__di()', 'title': $n(i18n(shrink?'__ax':'__ay',title)), 'class': $$_class,},$vnode_4 )];  $vnode_4=[$_create(0,0,'')];;$vnode_3.push($_create('i',{'class': 'px pcb', 'mx-click': $_viewId+'__bB()', 'title': $n(i18n('_t',title)),},$vnode_4 )); ;$vnode_2.push($_create('div',$_quick_vnode_attr_static_2,$vnode_3 )); ;$vnode_1=[$_create('div',$_quick_vnode_attr_static_0,$vnode_2 )];  $vnode_2=[];  ;$vnode_2.push($_create('div',{'style': 'width:'+$n(resizeX?'calc(100% - 2px)':'100%'), 'class': 'pce pl pch pb', 'mx-view': $n(view),})); if(!resizeX){  ;$vnode_3=[$_create('div',{'class': 'pcf pk pb', 'title': $n(i18n('__as')), 'mx-mousedown': $_viewId+'__aY({w:1})',})]; $vnode_2.push(...$vnode_3); };$vnode_1.push($_create('div',{'class': 'pcc', 'id': 'c_'+$n(id), 'style': 'height:'+$n((shrink?0:`calc(100vh - ${height}px)`)),},$vnode_2 ));  ;$$_class='pcg pk';if(shrink||!resizeY){;$$_class+=' pi';};$vnode_1.push($_create('div',{'title': $n(i18n('__at')), 'mx-mousedown': $_viewId+'__aY({h:1})', 'class': $$_class,})); ;$$_style='width:'+$n(width)+'px;';if(left===0||left){;$$_style+='left:'+$n(left);}else{;$$_style+='right:'+$n(right);};$$_style+='px;top:'+$n(top)+'px;z-index:'+$n(zIndex)+';';$vnode_0.push($_create('div',{'class': 'pbZ', 'id': 'p_'+$n(id), 'mx-mousedown': $_viewId+'__dh()', 'style': $$_style,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    init(data) {
        PanelsManager["__au"](this);
        this.on('destroy', () => {
            PanelsManager["__at"](this);
        });
        this['__df'] = data.close;
        this.set({
            icon: data.icon,
            title: data.title,
            width: data.width,
            height: data.height,
            left: data.left,
            top: data.top,
            right: data.right,
            view: data.view,
            resizeX: data.resizeX,
            resizeY: data.resizeY
        });
    },
    render() {
        this.digest({
            zIndex: ZIndex + Panels.length
        });
    },
    '__dg<mousedown>'(e) {
        let n = magix_1.node('p_' + this.id);
        let styles = n.style;
        let startX = this.get('left');
        let width = this.get('width');
        let dockRight = 0;
        if (startX === undefined) {
            dockRight = 1;
            startX = this.get('right');
        }
        let startY = this.get('top');
        let dockKey = dockRight ? 'right' : 'left';
        let showedCursor = 0;
        let target = e.eventTarget;
        this['__x'](e, ex => {
            if (!showedCursor) {
                showedCursor = 1;
                cursor_1.default["__y"](target);
            }
            let offsetX = (dockRight ? e.pageX - ex.pageX : ex.pageX - e.pageX) + startX;
            if (offsetX < 0) {
                offsetX = 0;
            }
            else if (offsetX + width > window.innerWidth) {
                offsetX = window.innerWidth - width;
            }
            let offsetY = ex.pageY - e.pageY + startY;
            if (offsetY < 0) {
                offsetY = 0;
            }
            else if (offsetY + 18 > window.innerHeight) {
                offsetY = window.innerHeight - 18;
            }
            styles[dockKey] = offsetX + 'px';
            styles.top = offsetY + 'px';
            this.set({
                [dockKey]: offsetX,
                top: offsetY
            });
        }, () => {
            cursor_1.default["__z"]();
        });
    },
    '__aY<mousedown>'(e) {
        let { w: resizeWidth } = e.params;
        let startWidth = this.get('width');
        let startHeight = this.get('height');
        let startRight = this.get('right');
        let cNode = magix_1.node('c_' + this.id);
        cNode.classList.add('pcd');
        let cStyles = cNode.style;
        let pStyles = magix_1.node('p_' + this.id).style;
        let showedCursor = 0;
        let target = e.eventTarget;
        this['__x'](e, ex => {
            if (!showedCursor) {
                showedCursor = 1;
                cursor_1.default["__y"](target);
            }
            if (resizeWidth) {
                let offset = ex.pageX - e.pageX;
                if (offset + startWidth < MinWidth) {
                    offset = MinWidth - startWidth;
                }
                let offsetX = offset + startWidth;
                pStyles.width = offsetX + 'px';
                if (startRight || startHeight === 0) {
                    pStyles.right = (startRight - offset) + 'px';
                    this.set({
                        right: startRight - offset
                    });
                }
                this.set({
                    width: offsetX
                });
            }
            else {
                let offsetY = e.pageY - ex.pageY + startHeight;
                cStyles.height = `calc(100vh - ${offsetY}px)`;
                this.digest({
                    height: offsetY
                });
            }
        }, () => {
            cursor_1.default["__z"]();
            cNode.classList.remove('pcd');
        });
    },
    '__dd'(z) {
        magix_1.node('p_' + this.id).style.zIndex = z;
    },
    '__dh<mousedown>'() {
        PanelsManager["__de"](this);
    },
    '__y'() {
        PanelsManager["__de"](this);
    },
    '__z'() {
    },
    '__di<click>'() {
        this.digest({
            shrink: !this.get('shrink')
        });
    },
    '__bB<click>'() {
        let c = this['__df'];
        if (c) {
            magix_1.default.toTry(c);
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("panels/data/index",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
$text; 
$vnode_0.push($_create(0,0,'data source panel')); 
return $_create($_viewId, 0, $vnode_0);  } ,
    render() {
        this.digest();
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("panels/elements/index",["magix","../../util/converter","../../designer/stage-elements"],(require,exports,module)=>{
/*magix_1,converter_1,stage_elements_1*/
let $_quick_vnode_attr_static_0={'class': 'pbU pk',};
let $_quick_vnode_attr_static_1={'class': 'px pbX',};
let $_quick_vnode_attr_static_2={'class': 'pm',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const converter_1 = require("../../util/converter");
const stage_elements_1 = require("../../designer/stage-elements");
magix_1.default.applyStyle("pq",".pbU{padding:5px 2px}.pbV{display:flex;align-items:center;padding:0 2px;color:#333;height:22px;line-height:22px;cursor:pointer;margin:1px 0}.pbV:hover{background:#f0f0f0}.pbW,.pbW:hover{background:#fcb58f}.pbX{margin:0 4px 0 2px;font-size:12px}.pbY{border:2px solid #fa742b}");
let RId = magix_1.default.guid('rp_');
let RectPole = {
    '__H'() {
        let n = magix_1.node(RId);
        if (!n) {
            document.body.insertAdjacentHTML("beforeend", `<div class="pg pbY" id="${RId}"></div>`);
        }
    },
    '__y'(element) {
        let ns = magix_1.node(RId).style;
        let { props } = element;
        let pos = converter_1.default["__cX"](props);
        ns.left = pos.x + 'px';
        ns.top = pos.y + 'px';
        ns.width = props.width + 'px';
        ns.height = props.height + 'px';
        ns.borderWidth = 2 * magix_1.State.get('__c') + 'px';
        let r = props.rotate || 0;
        ns.transform = `rotate(${r}deg)`;
    },
    '__z'() {
        magix_1.node(RId).style.left = '-10000px';
    }
};
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	elements,
	selectedMap,
	i18n,}=$$,
$vnode_1,
$vnode_2,
$text,
$$_class,
$vnode_3,
$vnode_4; 
 $vnode_1=[]; for(let i=elements.length;i--;){ let e=elements[i];;  $vnode_4=[$_create(0,1,(e.ctrl.icon))];;$vnode_3=[$_create('i',$_quick_vnode_attr_static_1,$vnode_4 )];  $vnode_4=[$_create(0,0,(i18n(e.ctrl.title)))];;$vnode_3.push($_create('div',$_quick_vnode_attr_static_2,$vnode_4 )); ;$$_class='pbV';if(selectedMap[e.id]){;$$_class+=' pbW';};$vnode_2=[$_create('div',{'mx-mouseover': $_viewId+'__cY({element:\''+$i($_ref,e)+'\'})', 'mx-mouseout': $_viewId+'__cZ()', 'mx-click': $_viewId+'__d_({element:\''+$i($_ref,e)+'\'})', 'class': $$_class,},$vnode_3 )]; $vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',$_quick_vnode_attr_static_0,$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        RectPole["__H"]();
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
        magix_1.State.on('__i', update);
        magix_1.State.on('__l', update);
    },
    render() {
        let elements = magix_1.State.get('__N');
        let selectedMap = magix_1.State.get('__W');
        this.digest({
            selectedMap,
            elements
        });
    },
    '__cY<mouseover>'(e) {
        let flag = magix_1.default.inside(e.relatedTarget, e.eventTarget);
        if (!flag) {
            let { element } = e.params;
            RectPole["__y"](element);
        }
    },
    '__cZ<mouseout>'(e) {
        let flag = magix_1.default.inside(e.relatedTarget, e.eventTarget);
        if (!flag) {
            RectPole["__z"]();
        }
    },
    '__d_<click>'(e) {
        let { element } = e.params;
        stage_elements_1.default["__av"](e, element);
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("panels/props/index",["magix","../../designer/props","../../designer/history","../../util/transform","gallery/mx-number/index","gallery/mx-color/index","gallery/mx-font/style","gallery/mx-font/align","./page"],(require,exports,module)=>{
/*magix_1,props_1,history_1,transform_1*/
require("gallery/mx-number/index");
require("gallery/mx-color/index");
require("gallery/mx-font/style");
require("gallery/mx-font/align");
require("./page");
let $_quick_static_node_3;
let $_quick_static_node_5;
let $_quick_static_node_6;
let $_quick_vnode_attr_static_0={'class': 'pci',};
let $_quick_vnode_attr_static_1={'class': 'pcj',};
let $_quick_vnode_attr_static_2={'class': 'pck',};
let $_quick_vnode_attr_static_4={'class': 'pcp',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const props_1 = require("../../designer/props");
const history_1 = require("../../designer/history");
const transform_1 = require("../../util/transform");
magix_1.default.applyStyle("ps",".pci{padding:4px;min-width:200px}.pcj{line-height:28px;display:flex;align-items:center}.pck{width:80px;text-align:right}.pcl{height:1px;line-height:1px;margin:5px 0;background:rgba(0,0,0,.2);background:-webkit-gradient(linear,left top,right top,from(rgba(165,69,243,0)),color-stop(.5,rgba(125,118,132,.33)),to(rgba(165,69,243,0)))}.pcm{width:140px}.pcn{height:90px}.pco{align-items:flex-start}.pcp{display:flex;align-items:center;cursor:pointer}.pcq{visibility:hidden;position:absolute}.pcr{width:32px;height:16px;position:relative;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;display:inline-block;border-radius:22px;background:#ccc}.pcr:before{content:\"\";width:12px;height:12px;position:absolute;left:0;margin:2px;border-radius:50%;background:#fff;transition:all .25s}.pcq:checked+.pcr{background:#fa742b}.pcq:checked+.pcr:before{left:100%;margin-left:-14px}.pcq:disabled+.pcr{background:#e6e6e6;cursor:not-allowed}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i,$eq)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	elements,
	i18n,
	props,}=$$,
$vnode_1,
$text,
$vnode_2,
$vnode_3,
$vnode_4,
$vnode_5,
$$_class,
$vnode_6,
$vnode_7,
$$_mx_view,
$vnode_8; 
if(elements.length==1){ let e=elements[0];; $vnode_2=[];   $vnode_4=[$_create(0,0,(i18n('__az')))];;$vnode_3=[$_create('span',$_quick_vnode_attr_static_2,$vnode_4 )];  $vnode_4=[$_create(0,0,(i18n(e.ctrl.title)))];;$vnode_3.push($_create('span',0,$vnode_4 )); ;$vnode_2.push($_create('li',$_quick_vnode_attr_static_1,$vnode_3 )); for(let $q_key_boiavdxzj=0,$q_a_sgsbokz=e.ctrl.props,$q_c_dkjlji=$q_a_sgsbokz.length;$q_key_boiavdxzj<$q_c_dkjlji;$q_key_boiavdxzj++){let p=$q_a_sgsbokz[$q_key_boiavdxzj]; $vnode_3=[]; if(p.type==props['__aa']){  if ($_quick_static_node_3) {
                                $vnode_4=[$_quick_static_node_3]; }else{;$vnode_4=[$_quick_static_node_3=$_create('li',{'mxs': 'pA:_', 'class': 'pcl',})]; }$vnode_3.push(...$vnode_4); }else{ $vnode_4=[]; let data=e.props[p.key];;if(p.read){ data=p.read(data);;}if(!p.ifShow||p.ifShow(e.props)){  $vnode_6=[];  $vnode_7=[$_create(0,0,(i18n(p.tip)))];;$vnode_6.push($_create('span',$_quick_vnode_attr_static_2,$vnode_7 )); if(p.type==props['__Z']){  ;$$_mx_view='gallery/mx-number/index?value='+$i($_ref,data);if(($_temp=p.max)!=null){;$$_mx_view+='&max='+($eu($_temp));};if(($_temp=p.step)!=null){;$$_mx_view+='&step='+($eu($_temp));};if(($_temp=p.fixed)!=null){;$$_mx_view+='&fixed='+($eu($_temp));};if(($_temp=p.min)!=null){;$$_mx_view+='&min='+($eu($_temp));};$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'pcm pu ph', 'param-@#disabled': $i($_ref,e.props.locked), 'mx-input': $_viewId+'__dl({key:\''+($eq(p.key))+'\',use:\'value\',element:\''+$i($_ref,e)+'\',write:\''+$i($_ref,p.write)+'\'})', 'mx-view': $$_mx_view,})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__a_']){  ;$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'pcm', 'mx-input': $_viewId+'__dl({key:\''+($eq(p.key))+'\',use:\'color\',element:\''+$i($_ref,e)+'\'})', 'mx-view': 'gallery/mx-color/index?clear='+($eu(p.clear))+'&color='+$i($_ref,data)+'&align=right&disabled='+($eu(e.props.locked))+'&alpha='+($eu(p.alpha)),})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__ab']){   ;$vnode_8=[$_create('input',{'class': 'pcq', 'type': 'checkbox', 'checked': (e.props[p.key]), 'mx-change': $_viewId+'__dl({key:\''+($eq(p.key))+'\',native:\'checked\',element:\''+$i($_ref,e)+'\',refresh:\''+$i($_ref,p.refresh)+'\'})',},0,1)];  if ($_quick_static_node_5) {
                                $vnode_8.push($_quick_static_node_5); }else{;$vnode_8.push($_quick_static_node_5=$_create('i',{'mxs': 'pA:a', 'class': 'pcr',})); };$vnode_7=[$_create('label',$_quick_vnode_attr_static_4,$vnode_8 )]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__ae']){  ;$vnode_7=[$_create('textarea',{'class': 'pv pcm pcn', '@#disabled': $i($_ref,e.props.locked), 'mx-input': $_viewId+'__dl({key:\''+($eq(p.key))+'\',native:\'value\',element:\''+$i($_ref,e)+'\'})', 'value': $n(data),})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__ac']){  ;$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'pcm', 'mx-input': $_viewId+'__dl({key:\''+($eq(p.key))+'\',use:\'value\',element:\''+$i($_ref,e)+'\'})', 'mx-view': 'gallery/mx-font/style?disabled='+$i($_ref,e.props.locked)+'&value='+$i($_ref,data),})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__ad']){  ;$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'pcm', 'mx-input': $_viewId+'__dl({key:\''+($eq(p.key))+'\',use:\'value\',element:\''+$i($_ref,e)+'\'})', 'mx-view': 'gallery/mx-font/align?disabled='+$i($_ref,e.props.locked)+'&value='+$i($_ref,data),})]; $vnode_6.push(...$vnode_7); };$$_class='pcj';if(p.dockTop){;$$_class+=' pco';};$vnode_5=[$_create('li',{'class': $$_class,},$vnode_6 )]; $vnode_4.push(...$vnode_5); }$vnode_3.push(...$vnode_4); }$vnode_2.push(...$vnode_3); };$vnode_1=[$_create('ul',$_quick_vnode_attr_static_0,$vnode_2 )]; $vnode_0.push(...$vnode_1); }else{  if ($_quick_static_node_6) {
                                $vnode_1=[$_quick_static_node_6]; }else{;$vnode_1=[$_quick_static_node_6=$_create('div',{'mxs': 'pA:b', 'mx-view': 'panels/props/page',})]; }$vnode_0.push(...$vnode_1); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this['__dj'](this.render.bind(this), 100);
        magix_1.State.on('__l', update);
        magix_1.State.on('__k', update);
        magix_1.State.on('___', update);
    },
    render() {
        this.digest({
            scale: magix_1.State.get('__c'),
            props: props_1.default,
            elements: magix_1.State.get('__O')
        });
    },
    '__dl<input,change>'(e) {
        let { key, use, element, refresh, native, write } = e.params;
        if (use || native) {
            let props = element.props;
            let resetXY = key == 'width' || key == 'height', old;
            if (resetXY) {
                old = transform_1.default["__dk"](props, props.rotate);
            }
            let v = native ? e.eventTarget[native] : e[use];
            if (write) {
                v = write(v, props);
            }
            props[key] = v;
            if (resetXY) {
                let n = transform_1.default["__dk"](props, props.rotate);
                props.x += old.x - n.x;
                props.y += old.y - n.y;
                refresh = true;
            }
        }
        if (refresh) {
            this.render();
            magix_1.State.fire('__m');
        }
        let n = magix_1.node(element.id);
        let vf = magix_1.Vframe.byNode(n);
        if (vf) {
            vf.invoke('__aH', [element]);
        }
        history_1.default["__t"]('__a' + key, 500);
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("panels/props/page",["magix","../../designer/history","../../designer/props","gallery/mx-number/index","gallery/mx-color/index","gallery/mx-picture/index","gallery/mx-dropdown/index"],(require,exports,module)=>{
/*magix_1,history_1,props_1*/
require("gallery/mx-number/index");
require("gallery/mx-color/index");
require("gallery/mx-picture/index");
require("gallery/mx-dropdown/index");
let $_quick_static_node_3;
let $_quick_vnode_attr_static_0={'class': 'pci',};
let $_quick_vnode_attr_static_1={'class': 'pcj',};
let $_quick_vnode_attr_static_2={'class': 'pck',};
/*
    author:xinglie.lkf@alibaba-inc.com
*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const history_1 = require("../../designer/history");
const props_1 = require("../../designer/props");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i,$eq)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	i18n,
	ctrl,
	props,
	page,}=$$,
$vnode_1,
$vnode_2,
$vnode_3,
$text,
$$_class,
$vnode_4,
$vnode_5,
$$_mx_view; 
 $vnode_1=[];   $vnode_3=[$_create(0,0,(i18n('__az')))];;$vnode_2=[$_create('span',$_quick_vnode_attr_static_2,$vnode_3 )];  $vnode_3=[$_create(0,0,(i18n(ctrl.title)))];;$vnode_2.push($_create('span',0,$vnode_3 )); ;$vnode_1.push($_create('li',$_quick_vnode_attr_static_1,$vnode_2 )); for(let $q_key_kyevoj=0,$q_a_hyxkzcf=ctrl.props,$q_c_vuazu=$q_a_hyxkzcf.length;$q_key_kyevoj<$q_c_vuazu;$q_key_kyevoj++){let p=$q_a_hyxkzcf[$q_key_kyevoj]; $vnode_2=[]; if(p.type==props['__aa']){  if ($_quick_static_node_3) {
                                $vnode_3=[$_quick_static_node_3]; }else{;$vnode_3=[$_quick_static_node_3=$_create('li',{'mxs': 'pB:_', 'class': 'pcl',})]; }$vnode_2.push(...$vnode_3); }else if(!p.ifShow||p.ifShow(page)){  $vnode_4=[];  $vnode_5=[$_create(0,0,(i18n(p.tip)))];;$vnode_4.push($_create('span',$_quick_vnode_attr_static_2,$vnode_5 )); if(p.type==props['__Z']){  ;$$_mx_view='gallery/mx-number/index?value='+$i($_ref,page[p.key]);if(($_temp=p.max)!=null){;$$_mx_view+='&max='+($eu($_temp));};$$_mx_view+='&step='+($eu(p.step));if(($_temp=p.fixed)!=null){;$$_mx_view+='&fixed='+($eu($_temp));};if(($_temp=p.min)!=null){;$$_mx_view+='&min='+($eu($_temp));};$vnode_5=[$_create('div',{'mxv': 'page,ctrl', 'class': 'pcm pu ph', 'mx-input': $_viewId+'__dl({key:\''+($eq(p.key))+'\',use:\'value\'})', 'mx-view': $$_mx_view,})]; $vnode_4.push(...$vnode_5); }else if(p.type==props['__a_']){  ;$vnode_5=[$_create('div',{'mxv': 'page,ctrl', 'class': 'pcm', 'mx-input': $_viewId+'__dl({key:\''+($eq(p.key))+'\',use:\'color\'})', 'mx-view': 'gallery/mx-color/index?clear='+($eu(p.clear))+'&color='+$i($_ref,page[p.key])+'&align=right&alpha='+($eu(p.alpha)),})]; $vnode_4.push(...$vnode_5); }else if(p.type==props['__af']){  ;$vnode_5=[$_create('div',{'class': 'pcm', 'mx-change': $_viewId+'__dl({key:\''+($eq(p.key))+'\',use:\'src\',refresh:\''+$i($_ref,p.refresh)+'\',write:\''+$i($_ref,p.write)+'\'})', 'mx-view': 'gallery/mx-picture/index?src='+($eu(page[p.key])),})]; $vnode_4.push(...$vnode_5); }else if(p.type==props['__ag']){  ;$vnode_5=[$_create('div',{'mxv': 'ctrl', 'class': 'pcm', 'mx-change': $_viewId+'__dl({key:\''+($eq(p.key))+'\',use:\'value\'})', 'mx-view': 'gallery/mx-dropdown/index?selected='+($eu(page[p.key]))+'&list='+$i($_ref,p.items)+'&textKey=text&valueKey=value',})]; $vnode_4.push(...$vnode_5); };$$_class='pcj';if(p.dockTop){;$$_class+=' pco';};$vnode_3=[$_create('li',{'class': $$_class,},$vnode_4 )]; $vnode_2.push(...$vnode_3); }$vnode_1.push(...$vnode_2); };$vnode_0.push($_create('ul',$_quick_vnode_attr_static_0,$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
    },
    render() {
        this.digest({
            props: props_1.default,
            ctrl: magix_1.State.get('__X'),
            page: magix_1.State.get('__d')
        });
    },
    '__dl<input,change>'(e) {
        let { key, use, refresh, write } = e.params;
        let page = magix_1.State.get('__d');
        page[key] = e[use];
        if (write) {
            write(page, e);
        }
        history_1.default["__t"]('__b', 500);
        magix_1.State.fire('__b');
        if (refresh) {
            this.render();
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("elements/designer",["magix","../gallery/mx-dragdrop/index","../gallery/mx-pointer/cursor","../designer/history","../util/transform","../util/converter"],(require,exports,module)=>{
/*magix_1,index_1,cursor_1,history_1,transform_1,converter_1*/
let $_quick_static_node_0;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../gallery/mx-dragdrop/index");
const cursor_1 = require("../gallery/mx-pointer/cursor");
const history_1 = require("../designer/history");
const transform_1 = require("../util/transform");
const converter_1 = require("../util/converter");
magix_1.default.applyStyle("pf",".pas{left:50%;top:50%;position:absolute}.pas:before{width:1px;height:5px;left:0;top:-2px}.pas:after,.pas:before{content:\" \";position:absolute;background:red}.pas:after{width:5px;height:1px;left:-2px;top:0}.pat{border:1px dotted hsla(0,0%,86.7%,.4);-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.pau{border:1px solid #fa742b}.pav{border:1px solid #999}.paw{border-right:3px solid #fa742b;right:-2px}.pax,.pay{border-bottom:3px solid #fa742b;bottom:-2px}.pay{border-right:3px solid #fa742b;right:-2px}.paz{cursor:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAABvUExURUdwTP///9XV1R0dHf///3Nzc////////////////1ZWVq+vr/T09PX19QQEBP///////8XFxf///////////wYGBv///+jo6P///4aGhqioqMzMzP///2BgYP///////////zExMf///wAAAP///xLps0AAAAAjdFJOUwCxxOdixRDmzSDMv8/Z+tz5wWpXWPk3zALCv8KnyXZVMNuNPnv3CwAAAJ1JREFUKM/NkckOwyAMRFkDBMhC9qWr+//fWCIV1WlzrjoXS36yxmMT8hdqqKoUvRAjMtw22kvecem1GjTuK1vApmI+wQMBbQFy5li+QQRaX4AtRX+vbntAJeRl9HTTx4TiwESs61DXNUPmVQeujzVrQwh43TTxpeRBslVfMUhbiXKWyiAwvnIsMcdyJkfJYdpNvG/ltDm+bjP+8KFP8ggL+zQLGxwAAAAASUVORK5CYII=\") 14 14,pointer;top:-3px;right:-3px;width:6px;height:6px;border-radius:50%;background:#fa742b}");
const BaseIndex = {
    0: 1,
    2: 1,
    4: 1,
    6: 1,
    1: 2,
    5: 2,
    3: 3,
    7: 3
};
let WatchSelectElements = {};
magix_1.State.on('__l', () => {
    for (let p in WatchSelectElements) {
        let vf = magix_1.Vframe.byId(p);
        if (vf) {
            vf.invoke('__aU');
            vf.invoke('render');
        }
    }
});
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	element,
	view,
	id,
	scale,
	onlyMove,
	fullscreen,
	selected,
	count,
	i18n,}=$$,
$text,
$$_style,
$$_class,
$vnode_1,
$vnode_2,
$vnode_3,
$vnode_4; 
let props=element.props;; ;$vnode_0.push($_create('div',{'mxv': 'element,scale,onlyMove', 'class': 'pk', 'mx-view': $n(view)+'?props='+$i($_ref,props)+'&scale='+$i($_ref,scale)+'&onlyMove='+$i($_ref,onlyMove), 'id': 'entity_'+$n(id),})); let r=props.rotate%360;; $vnode_1=[]; if(!fullscreen&&!props.locked){ $vnode_2=[]; if(selected){ $vnode_3=[];  if ($_quick_static_node_0) {
                                $vnode_3.push($_quick_static_node_0); }else{;$vnode_3.push($_quick_static_node_0=$_create('div',{'mxs': 'pk:_', 'class': 'pas',})); }if(count==1){  ;$vnode_4=[$_create('div',{'class': 'paz pg', 'mx-mousedown': $_viewId+'__aV()', 'title': $n(i18n('_x')),})]; $text='';let height=(Math.min(20,props.height-3)-4);;$text+=' ';let width=(Math.min(20,props.width)-4);;$text+=' ';let size=Math.max(Math.min(width,height)-2,0);;$text+=' ';width=Math.min(width,props.width-size-6);$text+=' ';height=Math.min(height,props.height-size-6-3);$text+=' ';let top=(props.height-height-size+3)/2;; ;$$_style='height:'+$n(Math.max(height,0))+'px;top:'+$n(top)+'px;cursor:';if(r<=22.5||r>337.5||(r>157.5&&r<=202.5)){;$$_style+='ew';}else if(r<=67.5||(r>202.5&&r<=247.5)){;$$_style+='nwse';}else if(r<=112.5||(r>247.5&&r<=292.5)){;$$_style+='ns';}else if(r<=157.5||(r>292.5&&r<=337.5)){;$$_style+='nesw';};$$_style+='-resize';$vnode_4.push($_create('div',{'class': 'pg paw', 'title': $n(i18n('_y')), 'mx-mousedown': $_viewId+'__aY({key:\'rm\'})', 'style': $$_style,})); let left=(props.width-width-size)/2;; ;$$_style='width:'+$n(Math.max(width,0))+'px;left:'+$n(left)+'px;cursor:';if(r<=22.5||r>337.5||(r>157.5&&r<=202.5)){;$$_style+='ns';}else if(r<=67.5||(r>202.5&&r<=247.5)){;$$_style+='nesw';}else if(r<=112.5||(r>247.5&&r<=292.5)){;$$_style+='ew';}else if(r<=157.5||(r>292.5&&r<=337.5)){;$$_style+='nwse';};$$_style+='-resize';$vnode_4.push($_create('div',{'class': 'pg pax', 'title': $n(i18n('_z')), 'mx-mousedown': $_viewId+'__aY({key:\'mb\'})', 'style': $$_style,}));  ;$$_style='';if(size==0){;$$_style+='display:none;';};$$_style+='width:'+$n(size)+'px;height:'+$n(size)+'px;cursor:';if(r<=22.5||r>337.5||(r>157.5&&r<=202.5)){;$$_style+='nwse';}else if(r<=67.5||(r>202.5&&r<=247.5)){;$$_style+='ns';}else if(r<=112.5||(r>247.5&&r<=292.5)){;$$_style+='nesw';}else if(r<=157.5||(r>292.5&&r<=337.5)){;$$_style+='ew';};$$_style+='-resize;';$vnode_4.push($_create('div',{'class': 'pg pay', 'title': $n(i18n('_A')), 'mx-mousedown': $_viewId+'__aY({key:\'rb\'})', 'style': $$_style,})); $vnode_3.push(...$vnode_4); }$vnode_2.push(...$vnode_3); }$vnode_1.push(...$vnode_2); };$$_style='left:'+$n(props.x)+'px;top:'+$n(props.y)+'px;width:'+$n(props.width)+'px;height:'+$n(props.height)+'px;';if(r){;$$_style+='transform:rotate('+$n(r)+'deg);';}$$_class='pg pk';if(!fullscreen){;$$_class+=' pat';};if(selected&&!fullscreen){;$$_class+=' ';if(props.locked){;$$_class+='pav';}else{;$$_class+='pau';};};$vnode_0.push($_create('div',{'id': 'mask_'+$n(element.id), 'style': $$_style, 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    ctor(data) {
        this.assign(data);
        WatchSelectElements[this.id] = 1;
        this.on('destroy', () => {
            delete WatchSelectElements[this.id];
        });
    },
    '__aU'() {
        let map = magix_1.State.get('__W');
        let elements = magix_1.State.get('__O');
        let count = elements.length;
        let data = this.get();
        let id = data.element.id;
        // if (data.selected) {
        //     if (!Has(map, id)) {
        //         let vf = Vframe.get('entity_' + this.id);
        //         if (vf) {
        //             vf.invoke('@{lost.select}');
        //         }
        //     }
        // } else {
        //     if (Has(map, id)) {
        //         let vf = Vframe.get('entity_' + this.id);
        //         if (vf) {
        //             vf.invoke('@{got.select}');
        //         }
        //     }
        // }
        this.set({
            selected: magix_1.has(map, id),
            count
        });
    },
    assign(data) {
        this.set(data);
        this['__aU']();
        return true;
    },
    render() {
        this.digest();
    },
    '__aH'(element) {
        this.digest({
            element
        });
    },
    '__aV<mousedown>'(e) {
        e.stopPropagation();
        let me = this;
        let element = me.get('element');
        let props = element.props;
        magix_1.State.fire('__j', {
            show: 1
        });
        let c = {
            x: props.x + props.width / 2,
            y: props.y + props.height / 2
        };
        let pos = converter_1.default["__aG"]({
            x: e.pageX,
            y: e.pageY
        });
        let rotate = props.rotate;
        let sdeg = Math.atan2(pos.y - c.y, pos.x - c.x) - rotate * Math.PI / 180, moved = false;
        me['__x'](e, (evt) => {
            if (!moved) {
                cursor_1.default["__y"](e.eventTarget);
            }
            moved = true;
            pos = converter_1.default["__aG"]({
                x: evt.pageX,
                y: evt.pageY
            });
            let deg = Math.atan2(pos.y - c.y, pos.x - c.x);
            deg = (deg - sdeg) * 180 / Math.PI;
            props.rotate = (360 + (deg | 0)) % 360;
            this.digest({
                element
            });
            magix_1.State.fire('__k');
        }, () => {
            cursor_1.default["__z"]();
            if (moved) {
                history_1.default["__t"]();
            }
            magix_1.State.fire('__j');
        });
    },
    '__aY<mousedown>'(e) {
        if (e.button)
            return;
        e.stopPropagation();
        let me = this;
        let element = me.get('element');
        let { props, ctrl } = element;
        magix_1.State.fire('__j', {
            show: 1
        });
        let rotate = props.rotate || 0;
        let { key } = e.params;
        rotate = (rotate + 360) % 360;
        if (props.width == 0)
            props.width = 0.01;
        if (props.height == 0)
            props.height = 0.01;
        let beginWidth = props.width;
        let beginHeight = props.height;
        let beginX = props.x;
        let beginY = props.y;
        let minWidth = 0, minHeight = 0, maxWidth = Number.MAX_VALUE, maxHeight = Number.MAX_VALUE;
        for (let p of ctrl.props) {
            if (p.key == 'width') {
                if (magix_1.default.has(p, 'max')) {
                    maxWidth = p.max;
                }
                if (magix_1.default.has(p, 'min')) {
                    minWidth = p.min;
                }
            }
            else if (p.key == 'height') {
                if (magix_1.default.has(p, 'max')) {
                    maxHeight = p.max;
                }
                if (magix_1.default.has(p, 'min')) {
                    minHeight = p.min;
                }
            }
        }
        let transformedRect = transform_1.default["__az"](props, rotate);
        // 获取当前点和对角线点
        let pointAndOpposite = transform_1.default["__aW"](transformedRect.point, key);
        let { opposite, current } = pointAndOpposite;
        // 对角线点的索引即为缩放基点索引
        let baseIndex = opposite.index;
        let oppositePoint = opposite.point;
        let currentPoint = current.point;
        let oppositeX = oppositePoint.x;
        let oppositeY = oppositePoint.y;
        // 鼠标释放点距离当前点对角线点的偏移量
        let offsetWidth = Math.abs(currentPoint.x - oppositeX);
        let offsetHeight = Math.abs(currentPoint.y - oppositeY);
        let oPoint = {
            x: beginX,
            y: beginY,
            rotate,
            width: beginWidth,
            height: beginHeight
        };
        let ex = e.pageX, ey = e.pageY;
        let moved = false;
        me['__x'](e, evt => {
            if (!moved) {
                cursor_1.default["__y"](e.eventTarget);
            }
            let scale = {
                x: 1, y: 1
            };
            moved = true;
            let useX = offsetWidth > offsetHeight;
            let realScale = 1;
            let oX = evt.pageX - ex;
            let oY = evt.pageY - ey;
            if (baseIndex == 0 || baseIndex == 7) {
                if (useX && rotate > 90 && rotate < 270) {
                    oX = -oX;
                }
                else if (!useX && rotate > 180 && rotate < 360) {
                    oY = -oY;
                }
            }
            else if (baseIndex == 0 || baseIndex == 1) {
                if (useX && rotate > 45 && rotate < 135) {
                    oX = -oX;
                }
                else if (!useX && rotate > 90 && rotate < 270) {
                    oY = -oY;
                }
            }
            if (useX) {
                realScale = (oX + offsetWidth) / offsetWidth;
            }
            else {
                realScale = (oY + offsetHeight) / offsetHeight;
            }
            if (realScale < 0)
                realScale = 0;
            let m = BaseIndex[baseIndex];
            if (m === 1) {
                scale.x = scale.y = realScale;
            }
            else if (m === 2) {
                scale.y = realScale;
            }
            else if (m === 3) {
                scale.x = realScale;
            }
            let newRect = transform_1.default["__aX"](oPoint, scale, transformedRect, baseIndex);
            let width = newRect.width, height = newRect.height;
            if (width < minWidth) {
                width = minWidth;
            }
            else if (width > maxWidth) {
                width = maxWidth;
            }
            if (height < minHeight) {
                height = minHeight;
            }
            else if (height > maxHeight) {
                height = maxHeight;
            }
            if (width != props.width ||
                height != props.height) {
                props.x = newRect.left;
                props.y = newRect.top;
                props.width = width;
                props.height = height;
                me.digest({
                    element
                });
                magix_1.State.fire('__k');
            }
        }, () => {
            if (moved) {
                history_1.default["__t"]();
            }
            cursor_1.default["__z"]();
            magix_1.State.fire('__j');
        });
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("elements/index",["magix","./text/designer","./page/designer"],(require,exports,module)=>{
/*magix_1,designer_1,designer_2*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const designer_1 = require("./text/designer");
const designer_2 = require("./page/designer");
let Elements = [designer_1.default];
let ElementsMap = magix_1.toMap(Elements, 'type');
let Groups = [designer_1.default, { spliter: true }, {
        icon: '&#xe629;',
        title: '图表',
        subs: [designer_1.default, designer_1.default, designer_1.default, designer_1.default, designer_1.default, designer_1.default, designer_1.default, designer_1.default]
    }];
exports.default = {
    '__F'() {
        return Groups;
    },
    '__U'() {
        return designer_2.default;
    },
    '__V'(elements) {
        let map = {};
        let walk = es => {
            for (let e of es) {
                let ctrl = ElementsMap[e.type];
                e.ctrl = ctrl;
                map[e.id] = e;
                if (e.role == 'layout') {
                    for (let c of e.props.columns) {
                        walk(c.elements);
                    }
                }
            }
        };
        walk(elements);
        return {
            elements,
            map
        };
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("elements/page/designer",["../../designer/props","../../i18n/index"],(require,exports,module)=>{
/*props_1,index_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const props_1 = require("../../designer/props");
const index_1 = require("../../i18n/index");
exports.default = {
    title: '__B',
    getProps() {
        return {
            width: 900,
            height: 500,
            background: '#ffffff',
            backgroundImage: '',
            backgroundRepeat: 'full',
            backgroundWidth: 0,
            backgroundHeight: 0,
            scaleType: 'auto'
        };
    },
    props: [{
            tip: '__C',
            key: 'width',
            type: props_1.default["__Z"],
            min: 0
        }, {
            tip: '__D',
            key: 'height',
            type: props_1.default["__Z"],
            min: 0
        }, {
            tip: '__E',
            key: 'scaleType',
            type: props_1.default["__ag"],
            items: [{
                    text: index_1.default('__F'),
                    value: 'auto'
                }, {
                    text: index_1.default('__G'),
                    value: 'full'
                }]
        }, {
            type: props_1.default["__aa"]
        }, {
            tip: '__H',
            key: 'background',
            type: props_1.default["__a_"]
        }, {
            tip: '__I',
            dockTop: true,
            key: 'backgroundImage',
            type: props_1.default["__af"],
            refresh: true,
            write(page, e) {
                page.backgroundWidth = e.width;
                page.backgroundHeight = e.height;
            }
        }, {
            tip: '__J',
            key: 'backgroundRepeat',
            type: props_1.default["__ag"],
            items: [{
                    text: index_1.default('__K'),
                    value: 'full'
                }, {
                    text: index_1.default('__L'),
                    value: 'no-repeat'
                }, {
                    text: index_1.default('__M'),
                    value: 'repeat-x'
                }, {
                    text: index_1.default('__N'),
                    value: 'repeat-y'
                }, {
                    text: index_1.default('__O'),
                    value: 'repeat'
                }],
            ifShow(page) {
                return page.backgroundImage;
            }
        }]
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("elements/text/designer",["../designer","../../designer/props","../../util/converter"],(require,exports,module)=>{
/*designer_1,props_1,converter_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const designer_1 = require("../designer");
const props_1 = require("../../designer/props");
const converter_1 = require("../../util/converter");
exports.default = designer_1.default.extend({
    ctor() {
        this.set({
            view: 'elements/text/index'
        });
    }
}, {
    type: 'text',
    role: 'text',
    title: '__P',
    icon: '&#xe6bc;',
    getProps(x, y) {
        return {
            background: '',
            height: 25,
            alpha: 1,
            text: '',
            ls: 0,
            x,
            y,
            rotate: 0,
            width: 200,
            forecolor: '#000000',
            fontsize: 14,
            locked: false,
            style: {
                bold: false,
                underline: false,
                italic: false
            },
            align: {
                h: 'flex-start',
                v: 'flex-start'
            }
        };
    },
    props: [{
            tip: '__Q',
            type: props_1.default["__Z"],
            key: 'x',
            read: converter_1.default["__aZ"],
            write: converter_1.default["__b_"]
        }, {
            tip: '__R',
            type: props_1.default["__Z"],
            key: 'y',
            read: converter_1.default["__aZ"],
            write: converter_1.default["__b_"]
        }, {
            tip: '__C',
            type: props_1.default["__Z"],
            key: 'width',
            min: 0,
            read: converter_1.default["__aZ"],
            write: converter_1.default["__b_"]
        }, {
            tip: '__D',
            key: 'height',
            type: props_1.default["__Z"],
            min: 0,
            read: converter_1.default["__aZ"],
            write: converter_1.default["__b_"]
        }, {
            tip: '__S',
            type: props_1.default["__Z"],
            key: 'rotate',
            min: -360,
            max: 360
        }, {
            type: props_1.default["__aa"]
        }, {
            tip: '__T',
            key: 'fontsize',
            type: props_1.default["__Z"],
            min: 0
        }, {
            tip: '__U',
            key: 'alpha',
            type: props_1.default["__Z"],
            step: 0.1,
            fixed: 1,
            min: 0,
            max: 1
        }, {
            tip: '__V',
            key: 'ls',
            type: props_1.default["__Z"],
            min: 0
        }, {
            tip: '__H',
            key: 'background',
            clear: true,
            alpha: true,
            type: props_1.default["__a_"]
        }, {
            tip: '__W',
            key: 'forecolor',
            type: props_1.default["__a_"]
        }, {
            tip: '__X',
            key: 'style',
            type: props_1.default["__ac"]
        }, {
            tip: '__Y',
            key: 'align',
            type: props_1.default["__ad"]
        }, {
            tip: '__Z',
            key: 'text',
            type: props_1.default["__ae"],
            dockTop: true
        }, {
            type: props_1.default["__aa"]
        }, {
            tip: '__a_',
            key: 'locked',
            type: props_1.default["__ab"],
            refresh: true,
            free: true
        }]
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("elements/text/index",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	props,
	scale,}=$$,
$$_style,
$vnode_1,
$text; 
 $text='';if(props.text){;$text+=' '+(props.text)+' ';}else{;$text+=' 请输入文字 ';};$vnode_1=[$_create(0,0,$text)];;$$_style='position:absolute;left:'+$n(props.x)+'px;top:'+$n(props.y)+'px;display:flex;color:'+$n(props.forecolor)+';';if(props.background){;$$_style+='background:'+$n(props.background)+';';};$$_style+='font-size:'+$n(props.fontsize*scale)+'px;height:'+$n(props.height)+'px;letter-spacing:'+$n(props.ls*scale)+'px;opacity:'+$n(props.alpha)+';';if(props.style.bold){;$$_style+='font-weight:bold;';};if(props.style.italic){;$$_style+='font-style:italic;';};if(props.style.underline){;$$_style+='text-decoration:underline;';};$$_style+='align-items:'+$n(props.align.v)+';justify-content:'+$n(props.align.h)+';overflow:hidden;width:'+$n(props.width)+'px;transform:rotate('+$n(props.rotate)+'deg);';$vnode_0.push($_create('div',{'style': $$_style,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        this.assign(data);
    },
    assign(data) {
        this.set(data);
        return true;
    },
    render() {
        this.digest();
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/axis",["magix","../gallery/mx-dragdrop/index","../gallery/mx-pointer/cursor","./history"],(require,exports,module)=>{
/*magix_1,index_1,cursor_1,history_1*/
let $_quick_static_node_2;
let $_quick_vnode_attr_static_0={'class': 'pU',};
let $_quick_vnode_attr_static_1={'class': 'pS',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../gallery/mx-dragdrop/index");
const cursor_1 = require("../gallery/mx-pointer/cursor");
const history_1 = require("./history");
magix_1.default.applyStyle("pa",".pG{height:20px;border-bottom:1px solid #ccc;overflow:hidden;width:100%;background:#fff;z-index:200;position:relative}.pH{top:0;width:1px}.pH,.pI{position:absolute;background:#fa742b;z-index:200;display:none;pointer-events:none}.pI{left:0;height:1px}.pJ{float:left;overflow:hidden;z-index:200;position:relative}.pK,.pJ{width:20px;border-right:1px solid #ccc;background:#fff}.pK{position:absolute;left:0;top:0;height:20px;border-bottom:1px solid #ccc;z-index:201}.pL{left:5px;top:22px}.pL,.pM{cursor:default;position:absolute;font-size:10px}.pM{top:2px;left:24px}.pN,.pO{position:relative;z-index:100}.pN{top:20px}.pO{left:20px}.pP{width:4px;border-left:1px solid #fa742b}.pP,.pQ{position:absolute;pointer-events:none}.pQ{height:1px;background:#fa742b}.pR{position:absolute;left:-15px;top:4px;font-size:10px;color:#666;cursor:pointer;pointer-events:all}.pS{top:2px;cursor:default}.pS,.pT{position:absolute;left:4px;font-size:10px;color:#666}.pT{top:-15px;cursor:pointer;pointer-events:all}.pU{position:absolute;left:4px;top:2px;font-size:10px;color:#666;cursor:default}.pV{width:25px;top:-1px;height:3px;left:30px;cursor:ns-resize}.pW,.pV{position:absolute;overflow:hidden;background:#fa742b;pointer-events:all}.pW{width:3px;left:-2px;height:25px;top:20px;cursor:ew-resize}");
let ScalesMap = {
    '0.5': {
        space: 200,
        step: 10
    },
    '1': {
        space: 100,
        step: 10
    },
    '1.5': {
        space: 80,
        step: 10
    },
    '2': {
        space: 60,
        step: 10
    },
    '2.5': {
        space: 48,
        step: 8
    },
    '3': {
        space: 40,
        step: 8
    },
    '3.5': {
        space: 32,
        step: 8
    },
    '4': {
        space: 24,
        step: 8
    },
    '4.5': {
        space: 16,
        step: 8
    },
    '5': {
        space: 16,
        step: 8
    }
};
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i,$eq)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	sTop,
	id,
	yHelpers,
	yStart,
	scale,
	vWidth,
	i18n,
	sLeft,
	xHelpers,
	xStart,
	vHeight,
	width,
	step,
	space,
	hbar,
	barColor,
	bar,
	xEnd,
	height,
	yEnd,}=$$,
$text,
$vnode_1,
$vnode_2,
$vnode_3,
$vnode_4,
$vnode_5,
$vnode_6,
$vnode_7,
$vnode_8; 
let temp,current; $vnode_1=[]; for(let $q_key_cllrebmvs=0,$q_a_llwjpgf=yHelpers,$q_c_eznfuqu=$q_a_llwjpgf.length;$q_key_cllrebmvs<$q_c_eznfuqu;$q_key_cllrebmvs++){let yHelp=$q_a_llwjpgf[$q_key_cllrebmvs]; current=Math.abs(yStart)+yHelp.mm*scale+20;  $vnode_4=[$_create(0,0,'')];;$vnode_3=[$_create('i',{'class': 'px pT', 'title': $n(i18n('__')), 'mx-click': $_viewId+'__w({type:\'y\',id:\''+($eq(yHelp.id))+'\'})',},$vnode_4 )];  $vnode_4=[$_create(0,0,(yHelp.mm))];;$vnode_3.push($_create('span',$_quick_vnode_attr_static_0,$vnode_4 ));  ;$vnode_3.push($_create('span',{'class': 'pV', 'mx-mousedown': $_viewId+'__A({type:\'y\',id:\''+($eq(yHelp.id))+'\',c:'+$n(current)+'})', 'title': $n(i18n('_a')),})); ;$vnode_2=[$_create('div',{'class': 'pQ', 'style': 'width:'+$n(vWidth)+'px;top:'+$n(current)+'px;',},$vnode_3 )]; $vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',{'class': 'pO', 'style': 'top:-'+$n(sTop)+'px', 'id': $n(id)+'_y_help', 'mx-contextmenu': $_viewId+'__B()',},$vnode_1 ));  $vnode_1=[]; for(let $q_key_rrilqhya=0,$q_a_vzsoxte=xHelpers,$q_c_hafghgsxgi=$q_a_vzsoxte.length;$q_key_rrilqhya<$q_c_hafghgsxgi;$q_key_rrilqhya++){let xHelp=$q_a_vzsoxte[$q_key_rrilqhya]; current=Math.abs(xStart)+xHelp.mm*scale;  $vnode_4=[$_create(0,0,'')];;$vnode_3=[$_create('i',{'class': 'px pR', 'title': $n(i18n('__')), 'mx-click': $_viewId+'__w({type:\'x\',id:\''+($eq(xHelp.id))+'\'})',},$vnode_4 )];  $vnode_4=[$_create(0,0,(xHelp.mm))];;$vnode_3.push($_create('span',$_quick_vnode_attr_static_1,$vnode_4 ));  ;$vnode_3.push($_create('span',{'class': 'pW', 'mx-mousedown': $_viewId+'__A({type:\'x\',id:\''+($eq(xHelp.id))+'\',c:'+$n(current)+'})', 'title': $n(i18n('_a')),})); ;$vnode_2=[$_create('div',{'class': 'pP', 'style': 'height:'+$n(vHeight)+'px;left:'+$n(current)+'px;',},$vnode_3 )]; $vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',{'class': 'pN', 'style': 'left:-'+$n(sLeft)+'px', 'id': $n(id)+'_x_help', 'mx-contextmenu': $_viewId+'__B()',},$vnode_1 ));     $vnode_4=[]; for(let i=0;i<xStart;i+=step){ $vnode_5=[]; if(i){ $vnode_6=[]; temp=i/scale;if(temp%space===0){  ;$vnode_7=[$_create('rect',{'width': '1', 'height': $n(hbar), 'x': $n(xStart-i), 'y': $n(20-hbar-1), 'style': 'fill:'+$n(barColor)+';',},0,1)];  $vnode_8=[$_create(0,0,(-temp))];;$vnode_7.push($_create('text',{'x': $n(xStart-i+2), 'y': '14', 'style': 'font-size:10px;fill:#999;',},$vnode_8 )); $vnode_6.push(...$vnode_7); }else{  ;$vnode_7=[$_create('rect',{'width': '1', 'height': $n(bar), 'x': $n(xStart-i), 'y': $n(20-bar-1), 'style': 'fill:'+$n(barColor)+';',},0,1)]; $vnode_6.push(...$vnode_7); }$vnode_5.push(...$vnode_6); }$vnode_4.push(...$vnode_5); }for(let i=0;i<xEnd;i+=step){ $vnode_5=[]; temp=i/scale;if(temp%space===0){  ;$vnode_6=[$_create('rect',{'width': '1', 'height': $n(hbar), 'x': $n(xStart+i), 'y': $n(20-hbar-1), 'style': 'fill:'+$n(barColor)+';',},0,1)];  $vnode_7=[$_create(0,0,(temp))];;$vnode_6.push($_create('text',{'x': $n(xStart+i+2), 'y': '14', 'style': 'font-size:10px;fill:#999;',},$vnode_7 )); $vnode_5.push(...$vnode_6); }else{  ;$vnode_6=[$_create('rect',{'width': '1', 'height': $n(bar), 'x': $n(xStart+i), 'y': $n(20-bar-1), 'style': 'fill:'+$n(barColor)+';',},0,1)]; $vnode_5.push(...$vnode_6); }$vnode_4.push(...$vnode_5); };$vnode_3=[$_create('svg',{'xmlns': 'http://www.w3.org/2000/svg', 'viewBox': '0 0 '+$n(width)+' 19', 'style': 'cursor:default;',},$vnode_4 )]; ;$vnode_2=[$_create('div',{'style': 'width:'+$n(width)+'px;height:100%',},$vnode_3 )]; ;$vnode_1=[$_create('div',{'class': 'pG', 'id': $n(id)+'_x',},$vnode_2 )];   $vnode_3=[$_create(0,0,'-')];;$vnode_2=[$_create('span',{'class': 'pL', 'id': $n(id)+'_x_tip',},$vnode_3 )]; ;$vnode_1.push($_create('div',{'class': 'pH', 'id': $n(id)+'_x_line', 'style': 'height:'+$n(vHeight+20)+'px',},$vnode_2 )); ;$vnode_0.push($_create('div',{'mx-mousemove': $_viewId+'__p()', 'mx-mouseout': $_viewId+'__q()', 'mx-click': $_viewId+'__u()',},$vnode_1 ));     $vnode_4=[]; for(let i=0;i<yStart;i+=step){ $vnode_5=[]; if(i){ $vnode_6=[]; temp=i/scale;if(temp%space===0){  ;$vnode_7=[$_create('rect',{'width': $n(hbar), 'height': '1', 'x': $n(20-hbar), 'y': $n(yStart-i), 'style': 'fill:'+$n(barColor)+';',},0,1)];  $vnode_8=[$_create(0,0,(-temp))];;$vnode_7.push($_create('text',{'x': '14', 'y': $n(yStart-i+2), 'style': 'font-size:10px;fill:#999;', 'transform': 'rotate(-90,13,'+$n(yStart-i)+')',},$vnode_8 )); $vnode_6.push(...$vnode_7); }else{  ;$vnode_7=[$_create('rect',{'width': $n(bar), 'height': '1', 'x': $n(20-bar), 'y': $n(yStart-i), 'style': 'fill:'+$n(barColor)+';',},0,1)]; $vnode_6.push(...$vnode_7); }$vnode_5.push(...$vnode_6); }$vnode_4.push(...$vnode_5); }for(let i=0;i<yEnd;i+=step){ $vnode_5=[]; temp=i/scale;if(temp%space===0){  ;$vnode_6=[$_create('rect',{'width': $n(hbar), 'height': '1', 'x': $n(20-hbar), 'y': $n(yStart+i), 'style': 'fill:'+$n(barColor)+';',},0,1)];  $vnode_7=[$_create(0,0,(temp))];;$vnode_6.push($_create('text',{'x': '14', 'y': $n(yStart+i), 'style': 'font-size:10px;fill:#999;;', 'transform': 'rotate(-90,13,'+$n(yStart+i-2)+')',},$vnode_7 )); $vnode_5.push(...$vnode_6); }else{  ;$vnode_6=[$_create('rect',{'width': $n(bar), 'height': '1', 'x': $n(20-bar), 'y': $n(yStart+i), 'style': 'fill:'+$n(barColor)+';',},0,1)]; $vnode_5.push(...$vnode_6); }$vnode_4.push(...$vnode_5); };$vnode_3=[$_create('svg',{'xmlns': 'http://www.w3.org/2000/svg', 'viewBox': '0 0 19 '+$n(height), 'style': 'cursor:default',},$vnode_4 )]; ;$vnode_2=[$_create('div',{'style': 'height:'+$n(height)+'px;',},$vnode_3 )]; ;$vnode_1=[$_create('div',{'class': 'pJ', 'style': 'height:'+$n(vHeight)+'px;', 'id': $n(id)+'_y',},$vnode_2 )];   $vnode_3=[$_create(0,0,'-')];;$vnode_2=[$_create('span',{'class': 'pM', 'id': $n(id)+'_y_tip',},$vnode_3 )]; ;$vnode_1.push($_create('div',{'class': 'pI', 'id': $n(id)+'_y_line', 'style': 'width:'+$n(vWidth+20)+'px',},$vnode_2 )); ;$vnode_0.push($_create('div',{'mx-mousemove': $_viewId+'__r()', 'mx-mouseout': $_viewId+'__s()', 'mx-click': $_viewId+'__v()',},$vnode_1 ));  if ($_quick_static_node_2) {
                                $vnode_0.push($_quick_static_node_2); }else{;$vnode_0.push($_quick_static_node_2=$_create('div',{'mxs': 'p_:_', 'class': 'pK',})); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    init(data) {
        let n = magix_1.node(data.scroll);
        n.addEventListener('scroll', () => {
            this['___']();
        }, {
            passive: true
        });
        this['__a'] = n;
        this.set({
            bar: 4,
            hbar: 12,
            barColor: '#aaa' //颜色
        });
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
        magix_1.State.on('__a', update);
        magix_1.State.on('__b', update);
    },
    '__m'() {
        if (this['__b']) {
            let n = this['__a'];
            let sa = magix_1.State.get('__c');
            let page = magix_1.State.get('__d');
            let { width: sWidth, height: sHeight } = page;
            let width = Math.max(sWidth * sa, window.innerWidth) + 500;
            let height = Math.max(sHeight * sa, window.innerHeight) + 300;
            let xStart = 0;
            let xEnd = 0;
            let axisWidth = 20;
            let yStart = 0;
            let yEnd = 0;
            let vHeight = 10;
            let vWidth = 10;
            let stage = magix_1.node('stage_canvas');
            let outer = magix_1.node('stage_outer');
            let offset = stage.getBoundingClientRect();
            let outerOffset = outer.getBoundingClientRect();
            let left = Math.round(offset.left - outerOffset.left);
            xStart = left + axisWidth;
            xEnd = width - xStart;
            yStart = Math.round(offset.top - outerOffset.top /*- (page.header || 0)*/);
            yEnd = height - yStart;
            vHeight = n.offsetHeight;
            vWidth = n.offsetWidth;
            let si = ScalesMap[sa];
            this.digest({
                sTop: n.scrollTop,
                sLeft: n.scrollLeft,
                width,
                scale: sa,
                space: si.space,
                step: si.step,
                height,
                xStart,
                xEnd,
                yStart,
                vHeight,
                vWidth,
                yEnd
            }, null, () => {
                this['__e'] = magix_1.node(this.id + '_x');
                this['__f'] = magix_1.node(this.id + '_y');
                this['__g'] = magix_1.node(this.id + '_x_line');
                this['__h'] = magix_1.node(this.id + '_y_line');
                this['__i'] = magix_1.node(this.id + '_x_tip');
                this['__j'] = magix_1.node(this.id + '_y_tip');
                this['__k'] = magix_1.node(this.id + '_x_help');
                this['__l'] = magix_1.node(this.id + '_y_help');
            });
        }
    },
    '___'() {
        let xNode = this['__e'];
        let yNode = this['__f'];
        let yHelpNode = this['__l'];
        let xHelpNode = this['__k'];
        let scroll = this['__a'];
        let top = scroll.scrollTop;
        let left = scroll.scrollLeft;
        if (xNode) {
            xNode.scrollLeft = left;
        }
        if (yNode) {
            yNode.scrollTop = top;
        }
        if (xHelpNode) {
            xHelpNode.style.left = -left + 'px';
        }
        if (yHelpNode) {
            yHelpNode.style.top = -top + 'px';
        }
        this.set({
            sLeft: left,
            sTop: top
        });
    },
    render() {
        this.set({
            xHelpers: magix_1.State.get('__n'),
            yHelpers: magix_1.State.get('__o')
        });
        let test = () => {
            let n = magix_1.node('stage_canvas');
            if (n) {
                this['__b'] = 1;
                this['__m']();
            }
            else {
                setTimeout(test, 30);
            }
        };
        setTimeout(test, 0);
    },
    '__p<mousemove>'(e) {
        let xNode = this['__e'];
        let v = e.pageX;
        let start = this.get('xStart');
        let styles = this['__g'].style;
        styles.display = 'block';
        styles.left = v + 'px';
        let mm = v - start + xNode.scrollLeft;
        let scale = this.get('scale');
        this['__i'].innerHTML = (mm / scale).toFixed(0);
    },
    '__q<mouseout>'(e) {
        if (!magix_1.default.inside(e.relatedTarget, e.eventTarget)) {
            this['__g'].style.display = 'none';
        }
    },
    '__r<mousemove>'(e) {
        let sTop = this.root.getBoundingClientRect();
        let v = e.pageY - sTop.top;
        let start = this.get('yStart');
        let yNode = this['__f'];
        let styles = this['__h'].style;
        styles.display = 'block';
        styles.top = v + 'px';
        let mm = v - start - 20 + yNode.scrollTop;
        let scale = this.get('scale');
        this['__j'].innerHTML = (mm / scale).toFixed(0);
    },
    '__s<mouseout>'(e) {
        if (!magix_1.default.inside(e.relatedTarget, e.eventTarget)) {
            this['__h'].style.display = 'none';
        }
    },
    '__u<click>'(e) {
        let v = e.pageX;
        let start = this.get('xStart');
        let xNode = this['__e'];
        let mm = ((v - start + xNode.scrollLeft) / this.get('scale')) | 0;
        let xHelpers = this.get('xHelpers');
        xHelpers.push({
            mm,
            id: magix_1.default.guid('x_')
        });
        this.digest({
            xHelpers
        });
        history_1.default["__t"]();
    },
    '__v<click>'(e) {
        let offset = this.root.getBoundingClientRect();
        let v = e.pageY - offset.top;
        let start = this.get('yStart');
        let yNode = this['__f'];
        let mm = ((v - start - 20 + yNode.scrollTop) / this.get('scale')) | 0;
        let yHelpers = this.get('yHelpers');
        yHelpers.push({
            mm,
            id: magix_1.default.guid('x_')
        });
        this.digest({
            yHelpers
        });
        history_1.default["__t"]();
    },
    '__w<click>'(e) {
        let { type, id } = e.params;
        let key = type + 'Helpers';
        let list = this.get(key);
        for (let i = list.length; i--;) {
            let e = list[i];
            if (e.id == id) {
                list.splice(i, 1);
                break;
            }
        }
        this.digest({
            [key]: list
        });
        history_1.default["__t"]();
    },
    '__A<mousedown>'(e) {
        if (e.target != e.eventTarget) {
            return;
        }
        let { type, id, c: current } = e.params;
        let key = type + 'Helpers';
        let list = this.get(key);
        let item;
        for (let i of list) {
            if (i.id == id) {
                item = i;
                break;
            }
        }
        if (item) {
            let start = this.get(type + 'Start');
            let showedCursor = 0;
            this['__x'](e, (evt) => {
                if (!showedCursor) {
                    showedCursor = 1;
                    cursor_1.default["__y"](e.eventTarget);
                }
                let oft;
                if (type == 'x') {
                    oft = evt.pageX - e.pageX + current;
                }
                else {
                    oft = evt.pageY - e.pageY + current - 20;
                }
                item.mm = ((oft - start) / this.get('scale')) | 0;
                this.digest({
                    [key]: list
                });
            }, () => {
                if (showedCursor) {
                    cursor_1.default["__z"]();
                    history_1.default["__t"]();
                }
            });
        }
    },
    '__B<contextmenu>'(e) {
        e.preventDefault();
    },
    '$win<resize>'() {
        setTimeout(() => {
            this['__m']();
        }, 0);
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/const",[],(require,exports,module)=>{
/**/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    '__C': 50,
    '__c': 1,
    '__D': 900,
    '__E': 500
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/contextmenu",["magix","../i18n/index"],(require,exports,module)=>{
/*magix_1,index_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const index_1 = require("../i18n/index");
let MenuSpliter = {
    spliter: true
};
let MenuAll = {
    id: 0,
    text: '__b',
    short: ' (Ctrl+A)'
};
let MenuCopy = {
    id: 1,
    text: '__c',
    short: ' (Ctrl+C)'
};
let MenuCut = {
    id: 14,
    text: '__d',
    short: ' (Ctrl+X)'
};
let MenuPaste = {
    id: 2,
    text: '__e',
    short: ' (Ctrl+V)'
};
let MenuUp = {
    id: 5,
    text: '__f'
};
let MenuDown = {
    id: 6,
    text: '__g'
};
let MenuTop = {
    id: 3,
    text: '__h'
};
let MenuBottom = {
    id: 4,
    text: '__i'
};
let MenuDelete = {
    id: 7,
    text: '__j',
    short: ' (Delete)'
};
let Cache = {};
let TranslateMenu = menus => {
    return (lang) => {
        if (!menus['@{menu@u.id}']) {
            menus['@{menu@u.id}'] = magix_1.default.guid('_m');
        }
        let key = lang + menus['@{menu@u.id}'];
        if (!Cache[key]) {
            let a = [];
            for (let m of menus) {
                if (m.spliter) {
                    a.push(m);
                }
                else {
                    a.push({
                        id: m.id,
                        text: index_1.default(m.text) + (m.short || '')
                    });
                }
            }
            Cache[key] = a;
        }
        return Cache[key];
    };
};
exports.default = {
    allId: MenuAll.id,
    pasteId: MenuPaste.id,
    topId: MenuTop.id,
    upId: MenuUp.id,
    bottomId: MenuBottom.id,
    downId: MenuDown.id,
    cutId: MenuCut.id,
    copyId: MenuCopy.id,
    deleteId: MenuDelete.id,
    singleElement: TranslateMenu([MenuCopy, MenuCut, MenuDelete, MenuSpliter, MenuUp, MenuTop, MenuSpliter, MenuDown, MenuBottom]),
    multipleElement: TranslateMenu([MenuCopy, MenuCut, MenuDelete]),
    stage: TranslateMenu([MenuAll, MenuPaste])
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/header",["magix","../elements/index","../gallery/mx-dragdrop/index","../gallery/mx-pointer/select","../gallery/mx-pointer/cursor"],(require,exports,module)=>{
/*magix_1,index_1,index_2,select_1,cursor_1*/
let $_quick_static_node_1;
let $_quick_static_node_3;
let $_quick_static_node_7;
let $_quick_static_node_9;
let $_quick_static_node_10;
let $_quick_static_node_11;
let $_quick_vnode_attr_static_0={'class': 'pE pd',};
let $_quick_vnode_attr_static_2={'class': 'pE pd pC pk',};
let $_quick_vnode_attr_static_4={'class': 'pX pZ ph',};
let $_quick_vnode_attr_static_5={'class': 'px paa',};
let $_quick_vnode_attr_static_6={'class': 'pab',};
let $_quick_vnode_attr_static_8={'class': 'pa_',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../elements/index");
const index_2 = require("../gallery/mx-dragdrop/index");
const select_1 = require("../gallery/mx-pointer/select");
const cursor_1 = require("../gallery/mx-pointer/cursor");
magix_1.default.applyStyle("pb",".pX,.pY{width:60px;height:40px;display:grid;grid-template-rows:20px 20px;justify-items:center;align-items:center;cursor:pointer;margin:0 2px}.pZ{grid-template-columns:50px 10px}.pY{float:left;border-radius:2px}.pY:hover{background:#bd361b}.pa_{display:none;position:absolute;cursor:default;top:100%;left:0;width:264px;padding:4px}.pa_,.pX:hover{background:#e64e30}.pX:hover .pa_{display:block}.paa{grid-column:1/2;grid-row:1/2;align-self:flex-end}.pab{font-size:12px;font-weight:400;line-height:12px;grid-column:1/2;grid-row:2/3}.pac{font-size:10px;margin-left:-10px;grid-row:1/3;grid-column:2/3}.pad{height:30px;width:1px;background:-webkit-gradient(linear,left top,left bottom,from(hsla(0,0%,100%,.27)),color-stop(.3,#fff),color-stop(.7,#fff),to(hsla(0,0%,100%,.27)));margin:2px 12px;float:left}");
let Fullscreens = ['requestFullscreen',
    'webkitRequestFullScreen',
    'webkitRequestFullscreen',
    'mozRequestFullScreen',
    'msRequestFullscreen'];
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	i18n,
	elements,}=$$,
$vnode_1,
$vnode_2,
$text,
$vnode_3,
$vnode_4,
$vnode_5,
$vnode_6,
$vnode_7,
$vnode_8,
$vnode_9; 
  if ($_quick_static_node_1) {
                                $vnode_1=[$_quick_static_node_1]; }else{$vnode_2=[$_create(0,0,'')];;$vnode_1=[$_quick_static_node_1=$_create('i',{'mxs': 'pa:_', 'class': 'px pa',},$vnode_2 )]; }$vnode_1.push($_create(0,0,(i18n('_k'))+'™'));;$vnode_0.push($_create('div',$_quick_vnode_attr_static_0,$vnode_1 ));  $vnode_1=[]; for(let $q_key_vznbufpa=0,$q_a_yuczlvhf=elements,$q_c_oeegsyccc=$q_a_yuczlvhf.length;$q_key_vznbufpa<$q_c_oeegsyccc;$q_key_vznbufpa++){let e=$q_a_yuczlvhf[$q_key_vznbufpa]; $vnode_2=[]; if(e.spliter){  if ($_quick_static_node_3) {
                                $vnode_3=[$_quick_static_node_3]; }else{;$vnode_3=[$_quick_static_node_3=$_create('div',{'mxs': 'pa:a', 'class': 'pad',})]; }$vnode_2.push(...$vnode_3); }else{ $vnode_3=[]; if(e.subs){   $vnode_6=[$_create(0,1,(e.icon))];;$vnode_5=[$_create('i',$_quick_vnode_attr_static_5,$vnode_6 )];  $vnode_6=[$_create(0,0,(i18n(e.title)))];;$vnode_5.push($_create('b',$_quick_vnode_attr_static_6,$vnode_6 ));  if ($_quick_static_node_7) {
                                $vnode_5.push($_quick_static_node_7); }else{$vnode_6=[$_create(0,0,'')];;$vnode_5.push($_quick_static_node_7=$_create('i',{'mxs': 'pa:b', 'class': 'pac px',},$vnode_6 )); } $vnode_6=[]; for(let $q_key_ohcmc=0,$q_a_eqeqmnznn=e.subs,$q_c_dwtdbzhxn=$q_a_eqeqmnznn.length;$q_key_ohcmc<$q_c_dwtdbzhxn;$q_key_ohcmc++){let es=$q_a_eqeqmnznn[$q_key_ohcmc];   $vnode_9=[$_create(0,1,(es.icon))];;$vnode_8=[$_create('i',$_quick_vnode_attr_static_5,$vnode_9 )];  $vnode_9=[$_create(0,0,(i18n(es.title)))];;$vnode_8.push($_create('b',$_quick_vnode_attr_static_6,$vnode_9 )); ;$vnode_7=[$_create('div',{'class': 'pY', 'mx-mousedown': $_viewId+'__L({ctrl:\''+$i($_ref,es)+'\',hide:true})',},$vnode_8 )]; $vnode_6.push(...$vnode_7); };$vnode_5.push($_create('div',$_quick_vnode_attr_static_8,$vnode_6 )); ;$vnode_4=[$_create('div',$_quick_vnode_attr_static_4,$vnode_5 )]; $vnode_3.push(...$vnode_4); }else{   $vnode_6=[$_create(0,1,(e.icon))];;$vnode_5=[$_create('i',$_quick_vnode_attr_static_5,$vnode_6 )];  $vnode_6=[$_create(0,0,(i18n(e.title)))];;$vnode_5.push($_create('b',$_quick_vnode_attr_static_6,$vnode_6 )); ;$vnode_4=[$_create('div',{'class': 'pX ph', 'mx-mousedown': $_viewId+'__L({ctrl:\''+$i($_ref,e)+'\'})',},$vnode_5 )]; $vnode_3.push(...$vnode_4); }$vnode_2.push(...$vnode_3); }$vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',$_quick_vnode_attr_static_2,$vnode_1 ));  if ($_quick_static_node_9) {
                                $vnode_0.push($_quick_static_node_9); }else{  if ($_quick_static_node_10) {
                                $vnode_2=[$_quick_static_node_10]; }else{$vnode_3=[$_create(0,0,'')];;$vnode_2=[$_quick_static_node_10=$_create('i',{'class': 'px',},$vnode_3 )]; } if ($_quick_static_node_11) {
                                $vnode_2.push($_quick_static_node_11); }else{$vnode_3=[$_create(0,0,'预览')];;$vnode_2.push($_quick_static_node_11=$_create('b',{'class': 'pab',},$vnode_3 )); };$vnode_1=[$_create('div',{'class': 'pX', 'mx-click': $_viewId+'__M()',},$vnode_2 )];   $vnode_3=[$_create(0,0,'')];;$vnode_2=[$_create('i',{'class': 'px',},$vnode_3 )];  $vnode_3=[$_create(0,0,'保存')];;$vnode_2.push($_create('b',$_quick_vnode_attr_static_6,$vnode_3 )); ;$vnode_1.push($_create('div',{'class': 'pX',},$vnode_2 )); ;$vnode_0.push($_quick_static_node_9=$_create('div',{'mxs': 'pa:c', 'class': 'pE pe pD pk',},$vnode_1 )); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_2.default],
    render() {
        this.digest({
            elements: index_1.default["__F"]()
        });
    },
    '__L<mousedown>'(e) {
        let { ctrl, hide } = e.params;
        let moreNode = e.eventTarget.parentNode;
        //Follower["@{update}"](ctrl.icon);
        let moved = false, hoverNode = null;
        magix_1.State.set({
            '__G': ctrl
        });
        let props = ctrl.getProps(0, 0);
        let { width, height } = props;
        let scale = magix_1.State.get('__c');
        width *= scale;
        height *= scale;
        select_1.default["__H"]();
        cursor_1.default["__I"]('move');
        this['__x'](e, ex => {
            if (!moved) {
                if (hide) {
                    moreNode.style.display = 'none';
                }
            }
            //Follower["@{show}"](ex);
            magix_1.State.fire('__c', {
                width,
                height,
                node: index_2.default["__J"](ex.clientX, ex.clientY),
                pageX: ex.pageX - width / 2,
                pageY: ex.pageY - height / 2
            });
            moved = true;
        }, (ex) => {
            //Follower["@{hide}"]();
            if (hide) {
                moreNode.style.display = '';
            }
            select_1.default["__z"]();
            cursor_1.default["__K"]();
            if (!moved) {
                magix_1.State.fire('__d', {
                    pageX: (Math.random() * 50) | 0,
                    pageY: (Math.random() * 50) | 0
                });
                return;
            }
            if (ex) {
                hoverNode = index_2.default["__J"](ex.clientX, ex.clientY);
                magix_1.State.fire('__e', {
                    node: hoverNode,
                    pageX: ex.pageX - width / 2,
                    pageY: ex.pageY - height / 2
                });
            }
        });
    },
    '__M<click>'() {
        let cavans = magix_1.node('stage_outer');
        for (let fs of Fullscreens) {
            if (cavans[fs]) {
                cavans[fs]();
                break;
            }
        }
    },
    '$doc<webkitfullscreenchange,mozfullscreenchange,fullscreenchange>'(e) {
        let doc = document;
        let element = doc.fullscreenElement ||
            doc.webkitCurrentFullScreenElement ||
            doc.mozFullScreenElement || null;
        magix_1.State.fire('__f', {
            fullscreen: true,
            full: !!element
        });
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/history",["magix","./const"],(require,exports,module)=>{
/*magix_1,const_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const const_1 = require("./const");
let UndoList = [];
let RedoList = [];
let BuferStage = null;
let BuferTimer = -1;
let LastType = '';
//历史记录只能还原到的编辑区状态
let DefaultStage = null;
let GetSnapshot = () => {
    return JSON.stringify({
        page: magix_1.State.get('__d'),
        scale: magix_1.State.get('__c'),
        elements: magix_1.State.get('__N'),
        select: magix_1.State.get('__O'),
        xLines: magix_1.State.get('__n'),
        yLines: magix_1.State.get('__o')
    });
};
let UpdateStage = jsonStr => {
    let json = JSON.parse(jsonStr);
    let c = magix_1.State.get('__c');
    let s = json.scale || c;
    magix_1.State.fire('__g', {
        json
    });
    magix_1.State.fire('___', {
        scale: c !== s
    });
};
exports.default = {
    '__P'() {
        if (!DefaultStage) {
            DefaultStage = GetSnapshot();
        }
    },
    '__Q'() {
        return {
            canRedo: RedoList.length,
            canUndo: UndoList.length
        };
    },
    '__R'() {
        UndoList.length = 0;
        RedoList.length = 0;
    },
    '__S'() {
        let c = UndoList.length;
        //当有历史记录时我们才进行还原操作
        if (c > 0) {
            let last = UndoList.pop();
            RedoList.push(last);
            let current = UndoList[UndoList.length - 1] || DefaultStage;
            UpdateStage(current);
        }
    },
    '__T'() {
        let current = RedoList.pop();
        if (current) {
            UndoList.push(current);
            UpdateStage(current);
        }
    },
    '__t'(type = '_save', waiting = 0) {
        let stage = GetSnapshot();
        if (type != LastType) {
            if (BuferStage) {
                UndoList.push(BuferStage);
                BuferStage = null;
            }
            LastType = type;
        }
        RedoList.length = 0;
        let pushUndo = status => {
            UndoList.push(status);
            if (UndoList.length > const_1.default["__C"]) {
                DefaultStage = UndoList.shift();
            }
            magix_1.State.fire('__h');
        };
        if (waiting) {
            BuferStage = stage;
            clearTimeout(BuferTimer);
            BuferTimer = setTimeout(() => {
                pushUndo(BuferStage);
                BuferStage = null;
            }, waiting);
        }
        else {
            pushUndo(stage);
        }
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/index",["magix","../elements/index","../gallery/mx-dialog/index","./const","./history","../panels/index","./header","./toolbar","./axis","./stage"],(require,exports,module)=>{
/*magix_1,index_1,index_2,const_1,history_1,index_3*/
require("./header");
require("./toolbar");
require("./axis");
require("./stage");
let $_quick_static_node_0;
let $_quick_static_node_1;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../elements/index");
const index_2 = require("../gallery/mx-dialog/index");
const const_1 = require("./const");
const history_1 = require("./history");
const index_3 = require("../panels/index");
let PageCtrl = index_1.default["__U"]();
magix_1.default.applyStyle("pc",".pae{background:#fa742b;height:40px;line-height:40px;font-size:16px;padding:0 10px;color:#fff;z-index:202}.pae,.paf{position:relative}.paf{padding:0 26px;background:#fafafa;color:#333;height:26px;z-index:201;border-bottom:1px solid #eee}.pag{width:calc(100% - 20px);overflow:scroll;height:calc(100% - 85px);background-color:#edeef3;transition:all .3s;margin-left:20px}.pah{box-shadow:inset 1px 1px 6px 2px #dadada}");
let ApplyState = json => {
    let page = magix_1.State.get('__d');
    let elements = magix_1.State.get('__N');
    let select = magix_1.State.get('__O');
    let xLines = magix_1.State.get('__n');
    let yLines = magix_1.State.get('__o');
    let { elements: lElements, map } = index_1.default["__V"](json.elements);
    elements.length = 0;
    elements.push(...lElements);
    xLines.length = 0;
    if (json.xLines) {
        xLines.push(...json.xLines);
    }
    yLines.length = 0;
    if (json.yLines) {
        yLines.push(...json.yLines);
    }
    let sMap = {};
    select.length = 0;
    if (json.select) {
        for (let s of json.select) {
            let e = map[s.id];
            if (e) {
                sMap[e.id] = 1;
                select.push(e);
            }
        }
    }
    magix_1.default.mix(page, json.page);
    magix_1.State.set({
        '__c': json.scale || 1,
        '__W': sMap
    });
};
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	id,}=$$; 
 if ($_quick_static_node_0) {
                                $vnode_0.push($_quick_static_node_0); }else{;$vnode_0.push($_quick_static_node_0=$_create('div',{'mxs': 'pb:_', 'mx-view': 'designer/header', 'class': 'pae',})); } if ($_quick_static_node_1) {
                                $vnode_0.push($_quick_static_node_1); }else{;$vnode_0.push($_quick_static_node_1=$_create('div',{'mxs': 'pb:a', 'mx-view': 'designer/toolbar', 'class': 'paf pk',})); } ;$vnode_0.push($_create('div',{'mx-view': 'designer/axis?scroll=s_'+($eu(id)), 'class': 'pk ph',}));  ;$vnode_0.push($_create('div',{'mx-view': 'designer/stage', 'id': 's_'+$n(id), 'class': 'pag pl pah',}));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_2.default],
    init() {
        magix_1.State.on('__g', (e) => {
            ApplyState(e.json);
        });
        magix_1.State.set({
            '__X': PageCtrl,
            '__d': PageCtrl.getProps(),
            '__c': const_1.default["__c"],
            '__N': [],
            '__O': [],
            '__W': {},
            '__n': [],
            '__o': []
        });
        history_1.default["__P"]();
    },
    render() {
        this.digest(null, null, () => {
            index_3.default["__Y"]();
        });
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/keys",[],(require,exports,module)=>{
/**/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    DELETE: 8,
    TAB: 9,
    C: 67,
    V: 86,
    A: 65,
    N: 78,
    X: 88,
    Z: 90,
    Y: 89
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/props",[],(require,exports,module)=>{
/**/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    '__Z': 2 << 0,
    '__a_': 2 << 1,
    '__aa': 2 << 2,
    '__ab': 2 << 3,
    '__ac': 2 << 4,
    '__ad': 2 << 5,
    '__ae': 2 << 6,
    '__af': 2 << 7,
    '__ag': 2 << 8
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/service",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
let Service = magix_1.default.Service.extend((bag, callback) => {
    let method = bag.get('method') || 'GET';
    fetch(bag.get('url'), {
        method,
        credentials: 'include'
    }).then(res => {
        if (res.ok) {
            return res.json();
        }
        throw new Error('Network response error');
    }).then(res => {
        bag.set('data', res.data);
        callback();
    }).catch(ex => {
        callback({ msg: ex.message });
    });
});
Service.add([{
        name: '__ah',
        url: magix_1.default.config('getBackgroundImageUrl')
    }]);
exports.default = {
    ctor() {
        let me = this;
        me.on('rendercall', () => {
            delete me['__ai'];
        });
    },
    request(key) {
        key = key || magix_1.default.guid('r');
        let r = new Service();
        this.capture(key, r, true);
        return r;
    },
    fetch(models, callback) {
        let key = JSON.stringify(models);
        let r = this.request(key);
        r.all(models, callback);
    },
    /**
     * 保存数据到服务器
     * 默认保存时同样的数据不能多次提交
     * @param  {Array} models meta信息数组
     * @param  {Function} callback
     */
    save(models, callback) {
        let me = this;
        let key = JSON.stringify(models);
        me.lock(key, () => {
            me.request(key + '_request').save(models, callback);
        });
    },
    /**
     * 锁定方法调用，在解锁前不能调用第二次，常用于反复提交
     * @param  {String} key 锁定的key
     * @param  {Function} fn 回调方法
     */
    lock(key, fn) {
        let me = this;
        if (!me['__ai'])
            me['__ai'] = {};
        let locker = me['__ai'];
        if (!locker[key]) {
            locker[key] = fn;
            fn();
        }
    },
    /**
     * 解锁
     * @param  {String} key 锁定的key
     */
    unlock(key) {
        let locker = this['__ai'];
        if (locker) {
            delete locker[key];
        }
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/stage-clipboard",["magix","./stage-elements","./stage-select"],(require,exports,module)=>{
/*magix_1,stage_elements_1,stage_select_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const stage_elements_1 = require("./stage-elements");
const stage_select_1 = require("./stage-select");
let Clone = a => {
    if (Array.isArray(a)) {
        let c = [];
        for (let b of a) {
            c.push(Clone(b));
        }
        a = c;
    }
    else if (magix_1.default.type(a) == 'Object') {
        let c = {};
        for (let b in a) {
            c[b] = Clone(a[b]);
        }
        a = c;
    }
    return a;
};
exports.default = {
    '__ak'() {
        let list = this['__aj'] || [];
        return list.length;
    },
    '__al'() {
        let list = this['__aj'] || [];
        return list;
    },
    '__am'() {
        let me = this;
        let list = [];
        let elements = magix_1.State.get('__O');
        for (let m of elements) {
            list.push(m);
        }
        me['__aj'] = list;
    },
    '__ao'() {
        //编辑锁定的不能剪切
        let elements = magix_1.State.get('__O');
        if (elements.length == 1 && elements[0].props.locked) {
            return;
        }
        this['__am']();
        this['__an'] = true;
    },
    '__ar'(xy) {
        let me = this;
        let list = me['__aj'];
        let elements = magix_1.State.get('__N');
        let update = false;
        if (list) {
            update = true;
            let selected = [];
            let index = 0, diffX = 0, diffY = 0;
            let hasSameXY = props => {
                for (let c of elements) {
                    if (c.props.x == props.x && c.props.y == props.y) {
                        return 1;
                    }
                }
                return 0;
            };
            let setXY = props => {
                if (index === 0) {
                    if (xy) {
                        diffX = props.x - xy.x;
                        diffY = props.y - xy.y;
                        props.x = xy.x;
                        props.y = xy.y;
                    }
                    else {
                        let oldX = props.x;
                        let oldY = props.y;
                        while (hasSameXY(props)) {
                            props.x += 20;
                            props.y += 20;
                        }
                        if ((props.x + props.width) < 0) {
                            props.x = -props.width / 2;
                        }
                        if ((props.y + props.height) < 0) {
                            props.y = -props.height / 2;
                        }
                        while (hasSameXY(props)) {
                            props.x -= 4;
                            props.y -= 4;
                        }
                        diffX = oldX - props.x;
                        diffY = oldY - props.y;
                    }
                }
                else {
                    props.x -= diffX;
                    props.y -= diffY;
                }
            };
            for (let m of list) {
                let nm = Clone(m);
                let props = nm.props;
                setXY(props);
                props.locked = false;
                index++;
                nm.id = magix_1.default.guid('e_');
                elements.push(nm);
                selected.push(nm);
                if (me['__an']) {
                    stage_elements_1.default["__ap"](m.id, true);
                }
            }
            if (me['__an']) {
                delete me['__an'];
                delete me['__aj'];
            }
            magix_1.State.fire('__i');
            stage_select_1.default['__aq'](selected);
        }
        return update;
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/stage-elements",["magix","./stage-select","./history","../gallery/mx-pointer/cursor","../util/transform"],(require,exports,module)=>{
/*magix_1,stage_select_1,history_1,cursor_1,transform_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const stage_select_1 = require("./stage-select");
const history_1 = require("./history");
const cursor_1 = require("../gallery/mx-pointer/cursor");
const transform_1 = require("../util/transform");
let IsLineCross = (line1, line2) => {
    let s1 = line1.start, e1 = line1.end, s2 = line2.start, e2 = line2.end;
    let d1 = ((e1.x - s1.x) * (s2.y - s1.y) - (e1.y - s1.y) * (s2.x - s1.x)) * ((e1.x - s1.x) * (e2.y - s1.y) - (e1.y - s1.y) * (e2.x - s1.x));
    let d2 = ((e2.x - s2.x) * (s1.y - s2.y) - (e2.y - s2.y) * (s1.x - s2.x)) * ((e2.x - s2.x) * (e1.y - s2.y) - (e2.y - s2.y) * (e1.x - s2.x));
    return d1 < 0 && d2 < 0;
};
exports.default = {
    '__L'(e, focus) {
        let ctrl = magix_1.State.get('__G');
        if (ctrl) {
            let elements = magix_1.State.get('__N');
            let props = ctrl.getProps(e.pageX, e.pageY);
            let scale = magix_1.State.get('__c');
            props.width *= scale;
            props.height *= scale;
            let em = {
                id: magix_1.default.guid('e_'),
                ctrl,
                type: ctrl.type,
                props
            };
            elements.push(em);
            if (focus) {
                stage_select_1.default["__as"](em);
            }
            return elements;
        }
    },
    '__av'(e, element) {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            if (!element.props.locked) {
                let elements = magix_1.State.get('__O');
                let exists = false;
                for (let i = elements.length; i--;) {
                    let m = elements[i];
                    if (m.id == element.id) {
                        exists = true;
                    }
                    if (m.props.locked) {
                        elements.splice(i, 1);
                    }
                }
                if (exists && elements.length > 1) {
                    if (stage_select_1.default["__at"](element)) {
                        history_1.default["__t"]();
                    }
                    return;
                }
                if (stage_select_1.default['__au'](element)) {
                    history_1.default["__t"]();
                }
            }
        }
        else {
            if (stage_select_1.default['__as'](element)) {
                history_1.default["__t"]();
            }
        }
    },
    '__ax'(event, view) {
        let { element } = event.params;
        let elements = magix_1.State.get('__O');
        if (event.button !== undefined && event.button != 0) { //如果不是左键
            let exist = false;
            for (let m of elements) {
                if (m.id === element.id) {
                    exist = true;
                    break;
                }
            }
            if (!exist) { //如果在当前选中的元素内找不到当前的，则激活当前
                if (stage_select_1.default['__as'](element)) {
                    history_1.default["__t"]();
                }
            }
            return;
        }
        if (event.shiftKey || event.ctrlKey || event.metaKey) { //多选
            this["__av"](event, element);
        }
        else {
            cursor_1.default["__aw"]('move');
            let startInfos = [], exist = false;
            for (let e of elements) {
                if (element.id == e.id) {
                    exist = true;
                }
                startInfos.push({
                    x: e.props.x,
                    y: e.props.y
                });
            }
            if (!exist) {
                if (stage_select_1.default['__as'](element)) {
                    history_1.default["__t"]();
                }
                startInfos.length = 0;
                startInfos.push({
                    x: element.props.x,
                    y: element.props.y
                });
                elements.length = 0;
                elements.push(element);
            }
            let elementMoved = false;
            magix_1.State.fire('__j', {
                show: 1
            });
            view['__x'](event, evt => {
                let offsetX = evt.pageX - event.pageX;
                let offsetY = evt.pageY - event.pageY;
                let index = 0;
                for (let e of elements) {
                    let s = startInfos[index++];
                    if (!e.props.locked) {
                        elementMoved = true;
                        e.props.x = s.x + offsetX;
                        e.props.y = s.y + offsetY;
                        let vf = magix_1.Vframe.byNode(magix_1.node(e.id));
                        if (vf) {
                            if (vf.invoke('assign', [{ element: e }])) {
                                vf.invoke('render');
                            }
                        }
                    }
                }
                magix_1.State.fire('__k');
            }, () => {
                if (elementMoved) {
                    history_1.default["__t"]();
                }
                cursor_1.default["__z"]();
                magix_1.State.fire('__j');
            });
        }
    },
    '__ay'() {
        let selectElements = magix_1.State.get('__O');
        let stageElements = magix_1.State.get('__N');
        let update = false;
        if (selectElements.length) {
            let map = magix_1.toMap(selectElements, 'id');
            for (let i = stageElements.length; i--;) {
                if (map[stageElements[i].id]) {
                    update = true;
                    stageElements.splice(i, 1);
                }
            }
            if (update) {
                stage_select_1.default["__as"]();
            }
        }
        return update;
    },
    '__aA'() {
        let elements = magix_1.State.get('__N');
        let locations = [], props, rotate;
        for (let e of elements) {
            props = e.props;
            if (props.locked)
                continue;
            rotate = props.rotate || 0;
            let rect = {
                x: props.x,
                y: props.y,
                width: props.width,
                height: props.height
            };
            let tsed = transform_1.default["__az"](rect, rotate);
            let lt = tsed.point[0];
            let rt = tsed.point[2];
            let lb = tsed.point[6];
            let rb = tsed.point[4];
            let tl = lt, tt = lt, tr = lt, tb = lt;
            for (let p of [rt, lb, rb]) {
                if (p.x < tl.x) {
                    tl = p;
                }
                if (p.x > tr.x) {
                    tr = p;
                }
                if (p.y < tt.y) {
                    tt = p;
                }
                if (p.y > tb.y) {
                    tb = p;
                }
            }
            locations.push({
                element: e,
                left: tl,
                top: tt,
                right: tr,
                bottom: tb,
                points: [lt, rt, lb, rb],
                lines: [{
                        start: lt,
                        end: rt
                    }, {
                        start: rt,
                        end: rb
                    }, {
                        start: rb,
                        end: lb
                    }, {
                        start: lb,
                        end: lt
                    }]
            });
        }
        return locations;
    },
    '__aB'(elementLocations, rect, bak) {
        let selected = [], find, rectLines = [{
                start: {
                    x: rect.x,
                    y: rect.y
                },
                end: {
                    x: rect.x + rect.width,
                    y: rect.y
                }
            }, {
                start: {
                    x: rect.x + rect.width,
                    y: rect.y
                },
                end: {
                    x: rect.x + rect.width,
                    y: rect.y + rect.height
                }
            }, {
                start: {
                    x: rect.x + rect.width,
                    y: rect.y + rect.height
                },
                end: {
                    x: rect.x,
                    y: rect.y + rect.height
                }
            }, {
                start: {
                    x: rect.x,
                    y: rect.y + rect.height
                },
                end: {
                    x: rect.x,
                    y: rect.y
                }
            }];
        for (let e of elementLocations) {
            find = false;
            if (!bak || !bak[e.element.id]) {
                for (let p of e.points) {
                    if (p.x >= rect.x &&
                        p.y >= rect.y &&
                        p.x <= (rect.x + rect.width) &&
                        p.y <= (rect.y + rect.height)) {
                        selected.push(e.element);
                        find = true;
                        break;
                    }
                }
                if (!find) {
                    /*mc-uncheck*/
                    for (let l of e.lines) {
                        /*mc-uncheck*/
                        for (let rl of rectLines) {
                            if (IsLineCross(l, rl)) {
                                find = true;
                                selected.push(e.element);
                                break;
                            }
                        }
                        if (find) {
                            break;
                        }
                    }
                }
            }
            else if (bak) {
                selected.push(e.element);
            }
        }
        return selected;
    },
    '__ap'(id, silent) {
        let stageElements = magix_1.State.get('__N');
        for (let i = stageElements.length; i--;) {
            let e = stageElements[i];
            if (id == e.id) {
                stageElements.splice(i, 1);
            }
        }
        if (!silent) {
            stage_select_1.default["__aq"]();
        }
    },
    '__aD'() {
        let last = magix_1.State.get('__W');
        let elements = magix_1.State.get('__N');
        let added = [];
        for (let m of elements) {
            if (!m.props.locked) {
                added.push(m);
            }
        }
        stage_select_1.default["__aq"](added);
        if (stage_select_1.default["__aC"](last)) {
            history_1.default["__t"]();
        }
    },
    '__aE'(to, element) {
        //3 top 4 bottom 5 to up 6 to down
        let elements = magix_1.State.get('__N'), index = -1;
        for (let i = elements.length; i--;) {
            let e = elements[i];
            if (e.id === element.id) {
                elements.splice(index = i, 1);
                break;
            }
        }
        if (to == 3) {
            elements.push(element);
        }
        else if (to == 4) {
            elements.unshift(element);
        }
        else if (to == 5) {
            elements.splice(index + 1, 0, element);
        }
        else if (to == 6) {
            if (index === 0)
                index = 1;
            elements.splice(index - 1, 0, element);
        }
        return true;
    },
    '__aF'(e) {
        let selectElements = magix_1.State.get('__O');
        let stageElements = magix_1.State.get('__N');
        //多选2个以上的我们取消多选，然后从头选择一个
        let c = selectElements.length;
        let current = selectElements[0];
        if (c === 0 || c > 1) {
            current = stageElements[e.shiftKey ? 0 : stageElements.length - 1];
            stage_select_1.default["__as"](current);
        }
        else {
            let prev, next;
            for (let i = stageElements.length; i--;) {
                let m = stageElements[i];
                if (m.id == current.id) {
                    prev = stageElements[i - 1];
                    break;
                }
                next = m;
            }
            let select = null;
            if (e.shiftKey) {
                if (!prev) {
                    prev = stageElements[stageElements.length - 1];
                }
                select = prev;
            }
            else {
                if (!next) {
                    next = stageElements[0];
                }
                select = next;
            }
            if (select.id != current.id) {
                stage_select_1.default["__as"](select);
            }
        }
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/stage-select",["magix"],(require,exports,module)=>{
/*magix_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
exports.default = {
    '__as'(element) {
        let selectElements = magix_1.State.get('__O');
        let oldCount = selectElements.length;
        if (oldCount || element) {
            let first = oldCount > 1 ? null : selectElements[0];
            selectElements.length = 0;
            let fireEvent = false;
            if (element) {
                selectElements.push(element);
                fireEvent = element != first;
            }
            else if (oldCount) {
                fireEvent = true;
            }
            if (fireEvent) {
                magix_1.State.set({
                    '__W': magix_1.toMap(selectElements, 'id')
                });
                magix_1.State.fire('__l');
                return true;
            }
        }
    },
    '__au'(element) {
        let selectElements = magix_1.State.get('__O');
        let find = false;
        for (let e of selectElements) {
            if (e.id === element.id) {
                find = true;
                break;
            }
        }
        if (!find) {
            selectElements.push(element);
            magix_1.State.set({
                '__W': magix_1.toMap(selectElements, 'id')
            });
            magix_1.State.fire('__l');
            return true;
        }
    },
    '__at'(element) {
        let selectElements = magix_1.State.get('__O');
        let find = false, index = -1;
        for (let e of selectElements) {
            index++;
            if (e.id === element.id) {
                find = true;
                break;
            }
        }
        if (find) {
            selectElements.splice(index, 1);
            magix_1.State.set({
                '__W': magix_1.toMap(selectElements, 'id')
            });
            magix_1.State.fire('__l');
            return true;
        }
    },
    '__aq'(elements) {
        let selectElements = magix_1.State.get('__O');
        selectElements.length = 0;
        if (elements) {
            selectElements.push.apply(selectElements, elements);
        }
        magix_1.State.set({
            '__W': magix_1.toMap(selectElements, 'id')
        });
        magix_1.State.fire('__l');
    },
    '__aC'(last) {
        let now = magix_1.State.get('__W');
        let diff = 0;
        for (let p in last) {
            if (!now[p]) {
                diff = 1;
                break;
            }
        }
        if (!diff) {
            for (let p in now) {
                if (!last[p]) {
                    diff = 1;
                    break;
                }
            }
        }
        return diff;
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/stage",["magix","../gallery/mx-dragdrop/index","./history","./keys","./stage-elements","./stage-select","./stage-clipboard","../util/converter","../gallery/mx-pointer/select","../gallery/mx-pointer/cursor","../gallery/mx-menu/index","./contextmenu"],(require,exports,module)=>{
/*magix_1,index_1,history_1,keys_1,stage_elements_1,stage_select_1,stage_clipboard_1,converter_1,select_1,cursor_1,index_2,contextmenu_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../gallery/mx-dragdrop/index");
const history_1 = require("./history");
const keys_1 = require("./keys");
const stage_elements_1 = require("./stage-elements");
const stage_select_1 = require("./stage-select");
const stage_clipboard_1 = require("./stage-clipboard");
const converter_1 = require("../util/converter");
const select_1 = require("../gallery/mx-pointer/select");
const cursor_1 = require("../gallery/mx-pointer/cursor");
const index_2 = require("../gallery/mx-menu/index");
const contextmenu_1 = require("./contextmenu");
magix_1.default.applyStyle("pd",".pai{outline:0;display:flex;position:relative}.paj{padding:50px 240px 50px 120px}.pak .paj{padding:0}.pal{background:#fff;box-shadow:0 3px 6px 0 rgba(0,0,0,.3)}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	fullscreen,
	rx,
	ry,
	marginTop,
	marginLeft,
	page,
	scale,
	elements,
	id,}=$$,
$$_class,
$vnode_1,
$$_style,
$vnode_2,
$vnode_3,
$vnode_4; 
   $vnode_3=[]; for(let $q_key_erkfiub=0,$q_a_egaygn=elements,$q_c_uiztgyzr=$q_a_egaygn.length;$q_key_erkfiub<$q_c_uiztgyzr;$q_key_erkfiub++){let e=$q_a_egaygn[$q_key_erkfiub];  ;$vnode_4=[$_create('div',{'mxv': 'elements,scale,fullscreen', 'id': $n(e.id), 'mx-view': 'elements/'+$n(e.type)+'/designer?element='+$i($_ref,e)+'&scale='+$i($_ref,scale)+'&fullscreen='+$i($_ref,fullscreen), 'mx-mousedown': $_viewId+'__aI({element:\''+$i($_ref,e)+'\'})',})]; $vnode_3.push(...$vnode_4); };$$_style='width:'+$n(page.width*scale)+'px;height:'+$n(page.height*scale)+'px;background:'+$n(page.background)+';';if(page.backgroundImage){;$$_style+='background-image:url('+$n(page.backgroundImage)+');background-repeat:'+$n(page.backgroundRepeat=='full'?'no-repeat':page.backgroundRepeat)+';background-size:';if(page.backgroundRepeat=='full'){;$$_style+='100% 100%';}else{;$$_style+=''+$n(page.backgroundWidth*scale)+'px '+$n(page.backgroundHeight*scale)+'px;';};};$vnode_2=[$_create('div',{'class': 'pal ph', 'id': 'stage_canvas', 'style': $$_style,},$vnode_3 )]; ;$$_style='';if(fullscreen){;$$_style+='transform:scaleX('+$n(rx)+') scaleY('+$n(ry)+');transform-origin:0 0;margin:'+$n(marginTop)+'px 0 0 '+$n(marginLeft)+'px;';};$vnode_1=[$_create('div',{'class': 'paj', 'style': $$_style,},$vnode_2 )]; ;$$_class='pai';if(fullscreen){;$$_class+=' pak';};$vnode_0.push($_create('div',{'id': 'stage_outer', 'mx-contextmenu': $_viewId+'__B()', 'mx-mousedown': $_viewId+'__aK()', 'tabindex': '0', 'mx-focusin': $_viewId+'__aM()', 'mx-focusout': $_viewId+'__aN()', 'mx-keydown': $_viewId+'__aL()', 'class': $$_class,},$vnode_1 ));  ;$vnode_0.push($_create('div',{'id': 'pole_'+$n(id), 'style': 'margin-top:-'+$n(page.height*scale+100)+'px;display:none;',}));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    init() {
        let addElements = e => {
            if (e.node) {
                if (magix_1.default.inside(e.node, magix_1.node('stage_outer'))) {
                    let p = converter_1.default["__aG"]({
                        x: e.pageX,
                        y: e.pageY
                    });
                    e.pageX = p.x;
                    e.pageY = p.y;
                }
                else {
                    return;
                }
            }
            else {
                e.pageX += this.root.scrollLeft;
                e.pageY += this.root.scrollTop;
            }
            let elements = stage_elements_1.default["__L"](e, true);
            if (elements) {
                magix_1.State.fire('__i');
                history_1.default["__t"]();
            }
        };
        let updateElements = (e) => {
            let elements = magix_1.State.get('__N');
            if (e) {
                this.digest({
                    elements
                });
            }
            else {
                this.set({
                    elements
                });
            }
        };
        let bakScale = 0;
        let updateStage = e => {
            if (e.step || e.fullscreen) {
                let elements = magix_1.State.get('__N');
                if (e.fullscreen) {
                    let page = magix_1.State.get('__d');
                    if (e.full) {
                        let rwidth = screen.width / page.width;
                        let rheight = screen.height / page.height;
                        let rbest = Math.min(rwidth, rheight);
                        let rx = 0, ry = 0;
                        if (page.scaleType == 'auto') {
                            rx = rbest;
                            ry = rbest;
                        }
                        else {
                            rx = rwidth;
                            ry = rheight;
                        }
                        let marginTop = (screen.height - ry * page.height) / 2, marginLeft = (screen.width - rx * page.width) / 2;
                        let current = magix_1.State.get('__c');
                        if (current != 1) {
                            e.step = 1 / current;
                            bakScale = current;
                        }
                        else {
                            bakScale = 0;
                        }
                        magix_1.State.set({
                            '__c': 1
                        });
                        this.set({
                            rx,
                            ry,
                            marginTop,
                            marginLeft
                        });
                    }
                    else {
                        if (bakScale != 0) {
                            e.step = bakScale;
                            magix_1.State.set({
                                '__c': bakScale
                            });
                        }
                    }
                    this.set({
                        fullscreen: e.full
                    });
                }
                if (e.step) {
                    for (let { props } of elements) {
                        props.x *= e.step;
                        props.y *= e.step;
                        props.width *= e.step;
                        props.height *= e.step;
                    }
                }
                this.set({
                    elements
                });
            }
            this.render();
        };
        let togglePole = e => {
            let o = this.root;
            let p = magix_1.node('pole_' + this.id);
            let ps = p.style;
            if (e.show) {
                ps.width = o.scrollWidth + 'px';
                ps.height = o.scrollHeight + 'px';
                ps.display = 'block';
            }
            else {
                ps.display = 'none';
            }
        };
        magix_1.State.on('__f', updateStage);
        magix_1.State.on('___', updateStage);
        magix_1.State.on('__a', updateStage);
        magix_1.State.on('__b', updateStage);
        magix_1.State.on('__d', addElements);
        magix_1.State.on('__e', addElements);
        magix_1.State.on('__i', updateElements);
        magix_1.State.on('__j', togglePole);
        magix_1.State.on('__c', (e) => {
            if (magix_1.default.inside(e.node, magix_1.node('stage_outer'))) {
                select_1.default["__aH"](e.pageX, e.pageY, e.width, e.height);
            }
            else {
                select_1.default["__z"]();
            }
        });
        updateElements();
    },
    render() {
        let page = magix_1.State.get('__d');
        this.digest({
            scale: magix_1.State.get('__c'),
            page
        });
    },
    '__aI<mousedown>'(e) {
        let fs = this.get('fullscreen');
        if (fs)
            return;
        stage_elements_1.default["__ax"](e, this);
    },
    '__aK<mousedown>'(e) {
        let fs = this.get('fullscreen');
        if (fs)
            return;
        let target = e.target;
        if (target.id == 'stage_canvas' ||
            magix_1.default.inside(magix_1.node('stage_canvas'), target)) {
            let bak = null, count = 0;
            let last = magix_1.State.get('__W');
            if (!e.shiftKey) {
                stage_select_1.default["__as"]();
            }
            else {
                bak = {};
                let old = magix_1.State.get('__O');
                for (let e of old) {
                    bak[e.id] = 1;
                    count++;
                }
            }
            this['__aJ'] = count;
            select_1.default["__H"]();
            let showedCursor = 0;
            let elementLocations = stage_elements_1.default["__aA"]();
            this['__x'](e, ex => {
                if (!showedCursor) {
                    showedCursor = 1;
                    cursor_1.default["__aw"]('default');
                }
                let width = Math.abs(e.pageX - ex.pageX);
                let height = Math.abs(e.pageY - ex.pageY);
                let left = Math.min(e.pageX, ex.pageX);
                let top = Math.min(e.pageY, ex.pageY);
                select_1.default["__aH"](left, top, width, height);
                let rect = converter_1.default["__aG"]({
                    x: left,
                    y: top
                });
                rect.width = width;
                rect.height = height;
                if (elementLocations.length) {
                    let intersectElements = stage_elements_1.default["__aB"](elementLocations, rect, bak);
                    let count = intersectElements.length;
                    if (count !== this['__aJ']) {
                        this['__aJ'] = count;
                        stage_select_1.default["__aq"](intersectElements);
                    }
                }
            }, () => {
                if (showedCursor) {
                    select_1.default["__z"]();
                    cursor_1.default["__z"]();
                }
                if (stage_select_1.default["__aC"](last)) {
                    history_1.default["__t"]();
                }
            });
        }
    },
    '__aL<keydown>'(e) {
        let fs = this.get('fullscreen');
        if (fs)
            return;
        if (e.metaKey || e.ctrlKey) {
            if (e.keyCode == keys_1.default.Z) {
                e.preventDefault();
                if (e.shiftKey) {
                    history_1.default["__T"]();
                }
                else {
                    history_1.default["__S"]();
                }
            }
            else if (e.keyCode == keys_1.default.Y) {
                e.preventDefault();
                history_1.default["__T"]();
            }
            else if (e.keyCode == keys_1.default.A) {
                e.preventDefault();
                stage_elements_1.default["__aD"]();
            }
            else if (e.keyCode == keys_1.default.X) {
                e.preventDefault();
                stage_clipboard_1.default["__ao"]();
            }
            else if (e.keyCode == keys_1.default.C) {
                e.preventDefault();
                stage_clipboard_1.default["__am"]();
            }
            else if (e.keyCode == keys_1.default.V) {
                e.preventDefault();
                stage_clipboard_1.default["__ar"]();
            }
        }
        else {
            if (e.keyCode == keys_1.default.TAB) {
                e.preventDefault();
                stage_elements_1.default["__aF"](e);
            }
            else if (e.keyCode == keys_1.default.DELETE) {
                e.preventDefault();
                if (stage_elements_1.default["__ay"]()) {
                    magix_1.State.fire('__i');
                    history_1.default["__t"]();
                }
            }
            else {
                let step = e.shiftKey ? 10 : 1;
                step *= magix_1.State.get('__c');
                let selectElements = magix_1.State.get('__O');
                if (selectElements.length) {
                    let propsChanged = false;
                    for (let m of selectElements) {
                        if (!m.props.locked) {
                            if (e.keyCode == keys_1.default.UP) {
                                propsChanged = true;
                                m.props.y -= step;
                            }
                            else if (e.keyCode == keys_1.default.DOWN) {
                                propsChanged = true;
                                m.props.y += step;
                            }
                            else if (e.keyCode == keys_1.default.LEFT) {
                                propsChanged = true;
                                m.props.x -= step;
                            }
                            else if (e.keyCode == keys_1.default.RIGHT) {
                                propsChanged = true;
                                m.props.x += step;
                            }
                            if (propsChanged) {
                                let vf = magix_1.Vframe.byNode(magix_1.node(m.id));
                                if (vf) {
                                    if (vf.invoke('assign', [{ element: m }])) {
                                        vf.invoke('render');
                                    }
                                }
                            }
                        }
                    }
                    if (propsChanged) {
                        e.preventDefault();
                        magix_1.State.fire('__k');
                        history_1.default["__t"]('___', 500);
                    }
                }
            }
        }
    },
    '__B<contextmenu>'(e) {
        e.preventDefault();
        if (magix_1.default.inside(e.target, magix_1.node('stage_canvas'))) {
            let lang = magix_1.default.config('lang');
            let list = contextmenu_1.default.stage(lang);
            let disabled = {};
            let stageElements = magix_1.State.get('__N');
            let selectElements = magix_1.State.get('__O');
            let hasElements = stage_clipboard_1.default["__ak"]();
            disabled[contextmenu_1.default.allId] = !stageElements.length;
            disabled[contextmenu_1.default.pasteId] = !hasElements;
            let selectCount = selectElements.length;
            let element = selectElements[0];
            if (selectCount == 1) {
                list = contextmenu_1.default.singleElement(lang);
                let topElement = stageElements[stageElements.length - 1];
                let bottomElement = stageElements[0];
                let atTop = topElement.id == element.id;
                let atBottom = bottomElement.id == element.id;
                let locked = element.props.locked;
                disabled[contextmenu_1.default.cutId] = locked;
                disabled[contextmenu_1.default.upId] = locked || atTop;
                disabled[contextmenu_1.default.topId] = locked || atTop;
                disabled[contextmenu_1.default.bottomId] = locked || atBottom;
                disabled[contextmenu_1.default.downId] = locked || atBottom;
            }
            else if (selectCount > 1) {
                list = contextmenu_1.default.multipleElement(lang);
            }
            index_2.default.show(this, e, {
                list: list,
                disabled,
                picked(menu) {
                    if (menu.id == contextmenu_1.default.allId) {
                        stage_elements_1.default["__aD"]();
                    }
                    else if (menu.id == contextmenu_1.default.copyId) {
                        stage_clipboard_1.default["__am"]();
                    }
                    else if (menu.id == contextmenu_1.default.pasteId) {
                        let p = converter_1.default["__aG"]({
                            x: e.pageX,
                            y: e.pageY
                        });
                        if (stage_clipboard_1.default["__ar"](p)) {
                            history_1.default["__t"]();
                        }
                    }
                    else if (menu.id == contextmenu_1.default.cutId) {
                        stage_clipboard_1.default["__ao"]();
                    }
                    else if (menu.id == contextmenu_1.default.deleteId) {
                        if (stage_elements_1.default["__ay"]()) {
                            magix_1.State.fire('__i');
                            history_1.default["__t"]();
                        }
                    }
                    else if (menu.id >= 3 && menu.id <= 6) {
                        if (stage_elements_1.default["__aE"](menu.id, element)) {
                            magix_1.State.fire('__i');
                            history_1.default["__t"]();
                        }
                    }
                }
            });
        }
    },
    '__aM<focusin>'(e) {
        this.root.classList.remove('pah');
    },
    '__aN<focusout>'() {
        this.root.classList.add('pah');
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/toolbar-align",["magix","./history"],(require,exports,module)=>{
/*magix_1,history_1*/
let $_quick_static_node_0;
/*
    author:xinglie.lkf@alibaba-inc.com
*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const history_1 = require("./history");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	elements,
	i18n,}=$$,
$text,
$$_class,
$vnode_1; 
let c=elements.length;; if ($_quick_static_node_0) {
                                $vnode_0.push($_quick_static_node_0); }else{;$vnode_0.push($_quick_static_node_0=$_create('i',{'mxs': 'pd:_', 'class': 'pap',})); } $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(c<2){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('_l')), 'mx-click': $_viewId+'__aO({to:\'left\'})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(c<2){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('_m')), 'mx-click': $_viewId+'__aO({to:\'center\'})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(c<2){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('_n')), 'mx-click': $_viewId+'__aO({to:\'right\'})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(c<2){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('_o')), 'mx-click': $_viewId+'__aO({to:\'top\'})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(c<2){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('_p')), 'mx-click': $_viewId+'__aO({to:\'middle\'})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(c<2){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('_q')), 'mx-click': $_viewId+'__aO({to:\'bottom\'})', 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
        magix_1.State.on('__l', update);
    },
    render() {
        this.digest({
            elements: magix_1.State.get('__O')
        });
    },
    '__aO<click>'(e) {
        if (e.eventTarget.classList.contains('paq')) {
            return;
        }
        let { to } = e.params;
        let elements = magix_1.State.get('__O');
        let maxRight = -Number.MAX_SAFE_INTEGER;
        let minLeft = Number.MAX_SAFE_INTEGER;
        let minTop = Number.MAX_SAFE_INTEGER;
        let maxBottom = -Number.MAX_SAFE_INTEGER;
        let minVCenter = Number.MAX_SAFE_INTEGER;
        let minHCenter = Number.MAX_SAFE_INTEGER;
        for (let m of elements) {
            let n = magix_1.node("mask_" + m.id);
            let bound = n.getBoundingClientRect();
            if (to == 'right') {
                if (bound.right > maxRight) {
                    maxRight = bound.right;
                }
            }
            else if (to == 'left') {
                if (bound.left < minLeft) {
                    minLeft = bound.left;
                }
            }
            else if (to == 'top') {
                if (bound.top < minTop) {
                    minTop = bound.top;
                }
            }
            else if (to == 'bottom') {
                if (bound.bottom > maxBottom) {
                    maxBottom = bound.bottom;
                }
            }
            else if (to == 'middle') {
                let half = (bound.bottom - bound.top) / 2;
                if ((bound.top + half) < minVCenter) {
                    minVCenter = bound.top + half;
                }
            }
            else if (to == 'center') {
                let half = (bound.right - bound.left) / 2;
                if ((bound.left + half) < minHCenter) {
                    minHCenter = bound.left + half;
                }
            }
        }
        let changed = 0;
        for (let m of elements) {
            let n = magix_1.node('mask_' + m.id);
            let bound = n.getBoundingClientRect();
            let lChanged = 0;
            if (to == 'right') {
                let diff = maxRight - bound.right;
                if (diff != 0) {
                    changed = 1;
                    lChanged = 1;
                    m.props.x += diff;
                }
            }
            else if (to == 'left') {
                let diff = minLeft - bound.left;
                if (diff != 0) {
                    changed = 1;
                    lChanged = 1;
                    m.props.x += diff;
                }
            }
            else if (to == 'top') {
                let diff = minTop - bound.top;
                if (diff != 0) {
                    changed = 1;
                    lChanged = 1;
                    m.props.y += diff;
                }
            }
            else if (to == 'bottom') {
                let diff = maxBottom - bound.bottom;
                if (diff != 0) {
                    changed = 1;
                    lChanged = 1;
                    m.props.y += diff;
                }
            }
            else if (to == 'middle') {
                let diff = minVCenter - (bound.top + (bound.bottom - bound.top) / 2);
                if (diff != 0) {
                    changed = 1;
                    lChanged = 1;
                    m.props.y += diff;
                }
            }
            else if (to == 'center') {
                let diff = minHCenter - (bound.left + (bound.right - bound.left) / 2);
                if (diff != 0) {
                    changed = 1;
                    lChanged = 1;
                    m.props.x += diff;
                }
            }
            if (lChanged) {
                let vf = magix_1.Vframe.byNode(magix_1.node(m.id));
                if (vf) {
                    if (vf.invoke('assign', [{ element: m }])) {
                        vf.invoke('render');
                    }
                }
            }
        }
        if (changed) {
            magix_1.State.fire('__k');
            history_1.default["__t"]();
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/toolbar-del",["magix","./stage-elements","./history"],(require,exports,module)=>{
/*magix_1,stage_elements_1,history_1*/
let $_quick_static_node_0;
/*
    author:xinglie.lkf@alibaba-inc.com
*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const stage_elements_1 = require("./stage-elements");
const history_1 = require("./history");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	elements,
	i18n,}=$$,
$text,
$$_class,
$vnode_1; 
let c=elements.length;; if ($_quick_static_node_0) {
                                $vnode_0.push($_quick_static_node_0); }else{;$vnode_0.push($_quick_static_node_0=$_create('i',{'mxs': 'pe:_', 'class': 'pap',})); } $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(c<1){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('__j'))+'(Delete)', 'mx-click': $_viewId+'__aP()', 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
        magix_1.State.on('__l', update);
    },
    render() {
        this.digest({
            elements: magix_1.State.get('__O')
        });
    },
    '__aP<click>'(e) {
        if (e.eventTarget.classList.contains('paq')) {
            return;
        }
        if (stage_elements_1.default["__ay"]()) {
            magix_1.State.fire('__i');
            history_1.default["__t"]();
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/toolbar-do",["magix","./history"],(require,exports,module)=>{
/*magix_1,history_1*/

/*
    author:xinglie.lkf@alibaba-inc.com
*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const history_1 = require("./history");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	status,
	i18n,}=$$,
$$_class,
$vnode_1,
$text; 
 $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(!status.canUndo){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('_r')), 'mx-click': $_viewId+'__aQ({s:\'-\',b:'+$n(status.canUndo)+'})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='px pan pB';if(!status.canRedo){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('_s')), 'mx-click': $_viewId+'__aQ({s:\'+\',b:'+$n(status.canRedo)+'})', 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
        magix_1.State.on('__h', update);
    },
    render() {
        this.digest({
            status: history_1.default["__Q"]()
        });
    },
    '__aQ<click>'(e) {
        if (e.eventTarget.classList.contains('paq')) {
            return;
        }
        let { s, b } = e.params;
        if (b) {
            if (s == '-') {
                history_1.default["__S"]();
            }
            else {
                history_1.default["__T"]();
            }
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/toolbar-layer",["magix","./history","./stage-elements"],(require,exports,module)=>{
/*magix_1,history_1,stage_elements_1*/
let $_quick_static_node_0;
/*
    author:xinglie.lkf@alibaba-inc.com
*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const history_1 = require("./history");
const stage_elements_1 = require("./stage-elements");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	elements,
	top,
	i18n,
	bottom,}=$$,
$text,
$$_class,
$vnode_1; 
$text='';let c=elements.length;;$text+=' ';let e=elements[0];; if ($_quick_static_node_0) {
                                $vnode_0.push($_quick_static_node_0); }else{;$vnode_0.push($_quick_static_node_0=$_create('i',{'mxs': 'pg:_', 'class': 'pap',})); } $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(c!=1||e.props.locked||top.id==e.id){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('__f')), 'mx-click': $_viewId+'__aE({to:5})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='px pan';if(c!=1||e.props.locked||top.id==e.id){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('__h')), 'mx-click': $_viewId+'__aE({to:3})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='px pan pA';if(c!=1||e.props.locked||bottom.id==e.id){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('__g')), 'mx-click': $_viewId+'__aE({to:6})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='px pan pA';if(c!=1||e.props.locked||bottom.id==e.id){;$$_class+=' paq';};$vnode_0.push($_create('i',{'title': $n(i18n('__i')), 'mx-click': $_viewId+'__aE({to:4})', 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
        magix_1.State.on('__i', update);
        magix_1.State.on('__l', update);
        magix_1.State.on('__m', update);
    },
    render() {
        let stageElements = magix_1.State.get('__N');
        this.digest({
            top: stageElements[stageElements.length - 1],
            bottom: stageElements[0],
            elements: magix_1.State.get('__O')
        });
    },
    '__aE<click>'(e) {
        if (e.eventTarget.classList.contains('paq')) {
            return;
        }
        let { to } = e.params;
        let element = this.get('elements')[0];
        if (stage_elements_1.default["__aE"](to, element)) {
            magix_1.State.fire('__i');
            history_1.default["__t"]();
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/toolbar-panels",["magix","../panels/index"],(require,exports,module)=>{
/*magix_1,index_1*/

/*
    author:xinglie.lkf@alibaba-inc.com
*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const index_1 = require("../panels/index");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i,$eq)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	panels,
	i18n,}=$$,
$vnode_1,
$$_class,
$vnode_2,
$text; 
for(let $q_key_ljgkol=0,$q_a_uwfihzyrga=panels,$q_c_fbwims=$q_a_uwfihzyrga.length;$q_key_ljgkol<$q_c_fbwims;$q_key_ljgkol++){let p=$q_a_uwfihzyrga[$q_key_ljgkol];  $vnode_2=[$_create(0,1,(p.icon))];;$$_class='px pan';if(p.opened){;$$_class+=' pao';};$vnode_1=[$_create('i',{'mx-click': $_viewId+'__aS({id:\''+($eq(p.id))+'\'})', 'title': $n(i18n(p.opened?'_t':'_u',p.title)), 'class': $$_class,},$vnode_2 )]; $vnode_0.push(...$vnode_1); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        magix_1.State.on('__n', () => {
            console.log('change');
            this.render();
        });
    },
    render() {
        this.digest({
            panels: index_1.default["__aR"]()
        });
    },
    '__aS<click>'(e) {
        let { id } = e.params;
        index_1.default["__aS"](id);
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/toolbar-scale",["magix","./history"],(require,exports,module)=>{
/*magix_1,history_1*/
let $_quick_vnode_attr_static_0={'class': 'par',};
/*
    author:xinglie.lkf@alibaba-inc.com
*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const history_1 = require("./history");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	i18n,
	scale,}=$$,
$vnode_1,
$text; 
 $vnode_1=[$_create(0,0,'')];;$vnode_0.push($_create('i',{'class': 'px pan', 'mx-click': $_viewId+'__aT({s:\'-\'})', 'title': $n(i18n('_v')),},$vnode_1 ));  $vnode_1=[$_create(0,0,(scale*100)+'%')];;$vnode_0.push($_create('b',$_quick_vnode_attr_static_0,$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$vnode_0.push($_create('i',{'class': 'px pan', 'mx-click': $_viewId+'__aT({s:\'+\'})', 'title': $n(i18n('_w')),},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this.render.bind(this);
        magix_1.State.on('__a', update);
        magix_1.State.on('___', update);
    },
    render() {
        this.digest({
            scale: magix_1.State.get('__c')
        });
    },
    '__aT<click>'(e) {
        let { s } = e.params;
        let scale = this.get('scale'), old = scale;
        if (s == '+') {
            scale += 0.5;
            if (scale > 5)
                scale = 5;
        }
        else {
            scale -= 0.5;
            if (scale < 0.5)
                scale = 0.5;
        }
        if (old != scale) {
            magix_1.State.set({
                '__c': scale
            });
            //this.render();
            magix_1.State.fire('__a', {
                step: scale / old
            });
            history_1.default["__t"]();
        }
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/toolbar",["magix","./toolbar-do","./toolbar-align","./toolbar-layer","./toolbar-del","./toolbar-scale","./toolbar-panels"],(require,exports,module)=>{
/*magix_1*/
require("./toolbar-do");
require("./toolbar-align");
require("./toolbar-layer");
require("./toolbar-del");
require("./toolbar-scale");
require("./toolbar-panels");
let $_quick_static_node_0;
let $_quick_static_node_5;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
magix_1.default.applyStyle("pe",".pam{height:22px}.pan{cursor:pointer;height:22px;width:22px;margin:0 2px;display:inline-flex;align-items:center;justify-content:center;border-radius:2px}.pan:hover{background:#e6e6e6;color:#333}.pao,.pao:hover{background:#c4c4c4}.pap{height:16px;width:1px;background:#eee;margin:3px 12px;float:left}.paq{color:#aaa;cursor:not-allowed}.paq:hover{color:#aaa;background:transparent}.par{font-weight:400;font-size:14px;width:40px;display:inline-block;text-align:center}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
$vnode_1; 
 if ($_quick_static_node_0) {
                                $vnode_0.push($_quick_static_node_0); }else{ ;$vnode_1=[$_create('div',{'class': 'pam', 'mx-view': 'designer/toolbar-do',})];  ;$vnode_1.push($_create('div',{'class': 'pam', 'mx-view': 'designer/toolbar-align',}));  ;$vnode_1.push($_create('div',{'class': 'pam', 'mx-view': 'designer/toolbar-layer',}));  ;$vnode_1.push($_create('div',{'class': 'pam', 'mx-view': 'designer/toolbar-del',})); ;$vnode_0.push($_quick_static_node_0=$_create('div',{'mxs': 'pj:_', 'class': 'pd pE pb',},$vnode_1 )); } if ($_quick_static_node_5) {
                                $vnode_0.push($_quick_static_node_5); }else{ ;$vnode_1=[$_create('div',{'class': 'pam', 'mx-view': 'designer/toolbar-scale',})];  ;$vnode_1.push($_create('i',{'class': 'pap',}));  ;$vnode_1.push($_create('div',{'class': 'pam', 'mx-view': 'designer/toolbar-panels',})); ;$vnode_0.push($_quick_static_node_5=$_create('div',{'mxs': 'pj:a', 'class': 'pe pb pE',},$vnode_1 )); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    render() {
        this.digest();
    }
});

});