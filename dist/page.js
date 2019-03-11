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
            if ((ignore = target['d']) && ignore[type]) {
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
            if (domEvent.cancelBubble) { //避免使用停止事件冒泡，比如别处有一个下拉框，弹开，点击到阻止冒泡的元素上，弹出框不隐藏
                break;
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
        let src = node.src.replace(/\/[^/]+$/, '/');
        seajs.config({
            paths: {
                designer: src + 'designer',
                elements: src + 'elements',
                gallery: src + 'gallery',
                i18n: src + 'i18n',
                panels: src + 'panels'
            },
            alias: {
                magix: 'magix5'
            }
        });
        seajs.use([
            'magix',
            'i18n/index'
        ], (Magix, I18n) => {
            Magix.applyStyle("d_","body,figure,h5,input,p,textarea,ul{margin:0;padding:0}ul{list-style-type:none;list-style-image:none}a{background-color:transparent}a:active,a:hover{outline-width:0}a:focus{outline:1px dotted}html{-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%;-ms-text-size-adjust:100%;text-size-adjust:100%;font-size:62.5%}body{font-size:14px;line-height:1.5}body,button,input,textarea{font-family:helvetica neue,arial,hiragino sans gb,stheiti,wenquanyi micro hei,sans-serif;-ms-text-autospace:ideograph-alpha ideograph-numeric ideograph-parenthesis;-ms-text-spacing:ideograph-alpha ideograph-numeric ideograph-parenthesis;text-spacing:ideograph-alpha ideograph-numeric ideograph-parenthesis}h5{font-size:14px}img{border-style:none;width:auto\\9;height:auto;max-width:100%;vertical-align:top;-ms-interpolation-mode:bicubic}svg:not(:root){overflow:hidden}button,input,textarea{font-family:inherit;font-size:100%;margin:0;vertical-align:middle;*vertical-align:middle}button,input{*overflow:visible}button{text-transform:none}button,html input[type=button],input[type=reset],input[type=submit]{-webkit-appearance:button;-moz-appearance:button;appearance:button;cursor:pointer}button[disabled],input[disabled]{cursor:not-allowed}input[type=checkbox],input[type=radio]{box-sizing:border-box;padding:0;*height:13px;*width:13px}button::-moz-focus-inner,input::-moz-focus-inner{border-style:none;padding:0}textarea{overflow:auto;resize:vertical}@media screen and (-webkit-min-device-pixel-ratio:0){input{line-height:normal!important}}input::-moz-placeholder,textarea::-moz-placeholder{color:#a9a9a9;opacity:1}label{cursor:pointer}html{box-sizing:border-box}*,:after,:before{box-sizing:inherit}a:focus,button:focus,input:focus,textarea:focus{outline:none;resize:none}a{color:#fa742b;text-decoration:none}a:focus,a:hover{color:#bd361b}a:active,a:focus,a:hover,a:visited{outline:0;text-decoration:none}label{cursor:default;display:inline-block;max-width:100%;font-weight:400}::-ms-clear{display:none}@font-face{font-family:da;src:url(\"data:application/x-font-woff;charset=utf-8;base64,d09GRgABAAAAAAcsAAsAAAAACqQAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAADMAAABCsP6z7U9TLzIAAAE8AAAARAAAAFZXOEjOY21hcAAAAYAAAACWAAACCs4hbhBnbHlmAAACGAAAAugAAAO0BG1azWhlYWQAAAUAAAAALwAAADYPpP4TaGhlYQAABTAAAAAcAAAAJAfeA4pobXR4AAAFTAAAABQAAAAkI+kAAGxvY2EAAAVgAAAAFAAAABQEcAVsbWF4cAAABXQAAAAfAAAAIAEYAF1uYW1lAAAFlAAAAUUAAAJtPlT+fXBvc3QAAAbcAAAATwAAAGizaRo4eJxjYGRgYOBikGPQYWB0cfMJYeBgYGGAAJAMY05meiJQDMoDyrGAaQ4gZoOIAgCKIwNPAHicY2Bk/ss4gYGVgYOpk+kMAwNDP4RmfM1gxMjBwMDEwMrMgBUEpLmmMDgwVDy7z9zwv4EhhrmB4RRQmBEkBwA4Ig2aeJzFkbsNwzAMRE+RP0IQwEEG8AReyl1Kl+68g5Eqy7m7NZyj6EZI6viEJ4AnkRJIADWAKAZRAeGNANNLbsh+xDX7FZ6KH7jLuWBmYseeIxeu3PZdZ7+8UkH55TIvIql6raoNWhnNV97fFM57utQt79MRJTEf6ItMjk2OnWN32Ds2SY6OTZiLow6Dq6Neg5uD9gPbdC1VAAB4nH1SO2sUURi9370zd3Zmd+48dh77yr4mO7MmutlsxkkR3DQ2GgtBCAhaCBY2SrAwjUUw5CEo+A/EoAgR1LBpArEUQVBs3MrCYEAbY+xsMnpHV0ghDsM9936cj+9xDhIR+rlDtkkOZVETjaOT6CxCQEehzvAQ1IKwhUfBrom2azESeEFN8uotcgLcOrWcThT6LpWoBgzKMFHrREELB3A87OIp6DhDAPli4ZzZKJnkHii5oLwUn8ZrYFe8ktY9Fp86Om11qtnUfMY086Z5J0VFMYWxoDG46jqyKCs0fihqBXu7cgRXIJMPCmfOq9WieWk1vDbUcGWAhQXIFqvs8bRRMPh/s+Bkzbykq6lcQfWGLZjfTeeymSH/E+If5rNG5AfxURpNJVMiyUFuhCZ9RFzH0oDWx8CvDzCchigcYKcCTmeACc/CqB/vUgqlfh9KlMa7ZxYZa2gNbZH5bJFjg7FFVf1XkPic3j+UfrD3/4RDwT8z3CIH5AbKowZCYuAHXTjegoCBVAa3E006Sa9R2OCxLkzyGAPy9aMkj7bFvc3NPZGfM0uRIH00RqoHmys9Qnorv09vRxKipZneN0H41uPE9qgs7WjVkZecsNwThN7ySg8Br79AhskC9wuSsWPRegCuH062x/l6HIvY8Syss3JTizWPMXirNctkJJ6NZ/mFwXdPa+rwRis3uR6QiEIu4s9cDwQ1wzNqds2YMGrkQry/Gu+Dvgo69EEfvNDfHPwS9pL6v8UKfG7FSuK/KFEMvxBNae0+NTPicyKTtLghwhdRXFsTlaz0jAhAN4j5t/YsbCGCUJbXfYLXD/jz+sAn78lrMoJaaIxTJcpXym3uJbbg6rcwLzQGLegCv0xz6CRL5z1gKpGtR7oQYJpWtUz6nW2/UosOg7agP1Uk2WKfnPQV6pZcejntfGaWLCnw4K7h7Kp2SqZzijInYd1Wv7j6baVQNHBTsD5kNC3zwRKa2CgWFN7eL0lutBh4nGNgZGBgAGLnEJdv8fw2Xxm4WRhA4JrTXQME/d+MhYG5AcjlYGACiQIAFvYJkgB4nGNgZGBgbvjfwBDDwgACQJKRARVwAgBHDwJyeJxjYWBgYH7JwMDCgBsDAB8LAQ0AAAAAAHYA2AEYAT4BWAF8AYoB2nicY2BkYGDgZAhkYGUAASYg5gJCBob/YD4DABGZAXYAeJxlj01OwzAQhV/6B6QSqqhgh+QFYgEo/RGrblhUavdddN+mTpsqiSPHrdQDcB6OwAk4AtyAO/BIJ5s2lsffvHljTwDc4Acejt8t95E9XDI7cg0XuBeuU38QbpBfhJto41W4Rf1N2MczpsJtdGF5g9e4YvaEd2EPHXwI13CNT+E69S/hBvlbuIk7/Aq30PHqwj7mXle4jUcv9sdWL5xeqeVBxaHJIpM5v4KZXu+Sha3S6pxrW8QmU4OgX0lTnWlb3VPs10PnIhVZk6oJqzpJjMqt2erQBRvn8lGvF4kehCblWGP+tsYCjnEFhSUOjDFCGGSIyujoO1Vm9K+xQ8Jee1Y9zed0WxTU/3OFAQL0z1xTurLSeTpPgT1fG1J1dCtuy56UNJFezUkSskJe1rZUQuoBNmVXjhF6XNGJPyhnSP8ACVpuyAAAAHicbccxDoAgDAXQfkQEbsOR6gLVpAykCeH0xrj6tkeOPpn+JThs8NgRcCAiIRNmqMZ6ShjdhvU4hbUu6/4SLnE11pulvFM/RSvRA98yEWMA\") format(\"woff\")}.d_{font-family:da;line-height:1;font-size:16px;font-style:normal;font-weight:400;font-variant:normal;display:inline-block;speak:none;position:relative;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.da{margin-right:10px}.db{height:100%}.dc{text-align:center}.dd{float:left}.de{float:right}html .df{display:inline-block}.dg{position:absolute}.dh{position:relative}html .di{display:none}.dj:after,.dj:before{content:\" \";display:table}.dj:after{clear:both}.dk{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.dl::-webkit-scrollbar,.dl::-webkit-scrollbar-corner{height:8px;width:8px;background:#fafafa}.dl::-webkit-scrollbar-thumb{background:silver}.dl::-webkit-scrollbar-thumb:hover{background:#949494}.dm{word-wrap:normal;overflow:hidden;text-overflow:ellipsis}.dm,.dn{white-space:nowrap}.dn{outline:none;display:inline-block;font-weight:400;text-align:center;vertical-align:middle;cursor:pointer;background-image:none;background-color:#ccc;padding:4px 14px;font-size:14px;line-height:1;border:0;color:#333;border-radius:2px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.dn:focus,.dn:hover{background-color:#a0a0a0;color:#333}.do{background-color:#fa742b;color:#fff}.do:focus,.do:hover{background-color:#bd361b;color:#fff}.dn[disabled]{background-color:#fbfbfb}.dn[disabled]:hover{border-color:#e6e6e6}.dp{padding:8px 25px;border-bottom:1px solid #e6e6e6;color:#333;margin:0;line-height:1.42857143;background:#fff}.dq{padding:18px 25px}.dr{padding:8px 25px;text-align:left;border-top:1px solid #e6e6e6;background:#fff}.ds{padding:150px 0;margin:0 auto;width:150px;text-align:center;line-height:0}.ds:after,.ds:before{content:\"\"}.ds:after,.ds:before,.dt{width:14px;height:14px;background-color:#ccc;border-radius:100%;display:inline-block;-webkit-animation:d_ 1s ease-in-out infinite both;animation:d_ 1s ease-in-out infinite both}.ds:before{-webkit-animation-delay:-.32s;animation-delay:-.32s}.dt{margin:0 10px;-webkit-animation-delay:-.16s;animation-delay:-.16s}@-webkit-keyframes d_{0%,80%,to{-webkit-transform:scale(0);transform:scale(0)}40%{-webkit-transform:scale(1);transform:scale(1)}}@keyframes d_{0%,80%,to{-webkit-transform:scale(0);transform:scale(0)}40%{-webkit-transform:scale(1);transform:scale(1)}}::-webkit-input-placeholder{color:#999}:-ms-input-placeholder{color:#999}::-ms-input-placeholder{color:#999}::placeholder{color:#999}::-moz-selection{background-color:rgba(243,123,99,.6)}::selection{background-color:rgba(243,123,99,.6)}.du,.dv{caret-color:#fa742b;display:inline-block;height:22px;padding:3px 4px;border-radius:2px;box-sizing:border-box;box-shadow:none;border:1px solid #e6e6e6;background-color:#fff;color:#333;width:140px;vertical-align:middle;max-width:100%;outline:none;transition:border-color .25s}.du:hover,.dv:hover{border-color:#ccc}.du:focus,.dv:focus,.dw,.dw:hover{border-color:#fa742b!important}.dv{height:auto}.du[disabled],.dv[disabled]{background-color:#fbfbfb}.du[disabled]:hover,.dv[disabled]:hover{cursor:not-allowed;border-color:#e6e6e6}@font-face{font-family:db;src:url(//at.alicdn.com/t/font_890516_hbs4agp4pw.eot);src:url(//at.alicdn.com/t/font_890516_hbs4agp4pw.eot#iefix) format(\"embedded-opentype\"),url(//at.alicdn.com/t/font_890516_hbs4agp4pw.woff) format(\"woff\"),url(//at.alicdn.com/t/font_890516_hbs4agp4pw.ttf) format(\"truetype\"),url(//at.alicdn.com/t/font_890516_hbs4agp4pw.svg#iconfont) format(\"svg\");font-display:swap}.dx{font-family:db;line-height:1;font-size:16px;font-style:normal;font-weight:400;font-variant:normal;display:inline-block;speak:none;position:relative;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}#app,body,html{height:100%;overflow:hidden}body{min-width:900px}.dy{font-size:12px}.dz{margin-right:2px}.dA{-webkit-transform:rotate(180deg);transform:rotate(180deg)}.dB{-webkit-transform:scaleX(-1);transform:scaleX(-1)}.dC{margin-left:100px}.dD{margin-right:50px}.dE{display:flex;align-items:center}.dF{position:-webkit-sticky;position:sticky;top:0}");
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
                '__cK'(fn, timespan) {
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
            document.title = i18n('_b');
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
let $_quick_vnode_attr_static_0={'class': 'daK',};
let $_quick_vnode_attr_static_1={'xmlns': 'http://www.w3.org/2000/svg', 'version': '1.1', 'width': '100%', 'height': '100%',};
let $_quick_vnode_attr_static_14={'class': 'daC dh',};
let $_quick_vnode_attr_static_15={'class': 'daP',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../mx-dragdrop/index");
const index_2 = require("../mx-monitor/index");
magix_1.default.applyStyle("dh",".daB{position:relative;height:22px;border:1px solid #e6e6e6;border-radius:2px;display:flex;align-items:center;cursor:pointer;padding:1px;transition:border-color .25s}.daB:hover{border-color:#ccc}.daC,.daD{background:#fff;background-image:linear-gradient(45deg,#eee 25%,transparent 0,transparent 75%,#eee 0),linear-gradient(45deg,#eee 25%,transparent 0,transparent 75%,#eee 0);background-position:0 0,6px 6px;background-size:12px 12px}.daD{min-width:18px;height:18px;text-indent:-100000em;border:1px solid #ccc;position:relative}.daE{padding:3px 4px}.daD:after{content:\" \";display:block;right:0;bottom:0;position:absolute;border-color:transparent #ccc;border-style:solid;border-width:6px 6px 0 0}.daF{position:absolute;border-radius:2px;z-index:300;border:1px solid #e6e6e6;background-color:#fff;display:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;padding:2px}.daG-bottom{top:100%;margin-top:4px}.daG-top{bottom:100%;margin-bottom:4px}.daH{width:176px}.daI{border:1px solid #000;float:left;width:12px;height:12px;margin:-1px 0 0 -1px;position:relative}.daJ:before{content:\" \";position:absolute;left:2px;top:2px;border:1px inset #e8e8e8;width:6px;height:6px}.daK{margin:5px 0;height:150px}.daL{position:relative;float:left;width:148px;height:148px}.daM{position:absolute;width:8px;height:8px;box-shadow:0 0 0 1.5px #fff,inset 0 0 1px 1px rgba(0,0,0,.3),0 0 1px 2px rgba(0,0,0,.4);border-radius:50%;left:-4px;top:-4px}.daN{width:18px;height:148px;position:relative;float:left;margin-left:10px}.daO{position:absolute;left:2px;top:-2px;height:4px;width:14px;box-shadow:0 0 0 1.5px #fff,inset 0 0 1px 1px rgba(0,0,0,.3),0 0 1px 2px rgba(0,0,0,.4);background:#fff}.daP{height:25px}.daQ{width:80px}.daR,.daQ{margin-right:5px;vertical-align:middle}.daR{width:30px;border-radius:2px;height:22px;display:inline-block;border:1px solid #ddd}.daS{position:absolute;right:5px;top:4px;font-size:12px;opacity:.2}.daS:hover{opacity:.5}.daC{width:174px;height:12px;margin-bottom:5px}.daT{height:100%}.daU{position:absolute;left:-2px;top:2px;height:8px;width:4px;box-shadow:0 0 0 1.5px #fff,inset 0 0 1px 1px rgba(0,0,0,.3),0 0 1px 2px rgba(0,0,0,.4);background:#fff}.daV{cursor:not-allowed;background-color:#fbfbfb}.daV:hover{border-color:#e6e6e6}.daV:hover .daS{opacity:.1}.daV .daD{opacity:.4}.daV .daS{opacity:.1}");
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
 $vnode_1=[]; if(text){  $vnode_3=[$_create(0,0,(text))];;$$_style='';if(textWidth){;$$_style+='width:'+$n(textWidth)+'px';};$vnode_2=[$_create('div',{'class': 'daE dk', 'mx-click': $_viewId+'__bd()', 'style': $$_style,},$vnode_3 )]; $vnode_1.push(...$vnode_2); } $vnode_2=[$_create(0,0,'picker')];;$$_style='';if(color){;$$_style+='background:'+$n(color)+';';};if(!text){;$$_style+='width:100%';};$vnode_1.push($_create('div',{'class': 'daD dk', 'mx-click': $_viewId+'__bd()', 'style': $$_style,},$vnode_2 )); if(clear&&color){  $vnode_3=[$_create(0,0,'')];;$vnode_2=[$_create('i',{'class': 'd_ daS', 'mx-click': $_viewId+'__be()', 'title': $n(i18n('_G')),},$vnode_3 )]; $vnode_1.push(...$vnode_2); } $vnode_2=[]; if(renderUI){ $vnode_3=[];  $vnode_4=[]; for(let $q_key_takfjriteg=0,$q_a_znpkctcl=shortcuts,$q_c_zjwhvtda=$q_a_znpkctcl.length;$q_key_takfjriteg<$q_c_zjwhvtda;$q_key_takfjriteg++){let sc=$q_a_znpkctcl[$q_key_takfjriteg];  ;$vnode_5=[$_create('li',{'class': 'daI', 'id': 'sc_'+$n(sc)+'_'+$n(id), 'style': 'background:#'+$n(sc), 'mx-click': $_viewId+'__b_({color:\'#'+($eq(sc))+'\'})',})]; $vnode_4.push(...$vnode_5); };$vnode_3.push($_create('ul',{'class': 'daH dj', 'id': 'scs_'+$n(id),},$vnode_4 ));       if ($_quick_static_node_2) {
                                $vnode_8=[$_quick_static_node_2]; }else{;$vnode_8=[$_quick_static_node_2=$_create('stop',{'mxs': 'dk:_', 'offset': '0%', 'stop-color': '#000000', 'stop-opacity': '1',})]; } if ($_quick_static_node_3) {
                                $vnode_8.push($_quick_static_node_3); }else{;$vnode_8.push($_quick_static_node_3=$_create('stop',{'mxs': 'dk:a', 'offset': '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0',})); };$vnode_7=[$_create('lineargradient',{'id': 'gb_'+$n(id), 'x1': '0%', 'y1': '100%', 'x2': '0%', 'y2': '0%',},$vnode_8 )];   if ($_quick_static_node_4) {
                                $vnode_8=[$_quick_static_node_4]; }else{;$vnode_8=[$_quick_static_node_4=$_create('stop',{'mxs': 'dk:b', 'offset': '0%', 'stop-color': '#FFFFFF', 'stop-opacity': '1',})]; } if ($_quick_static_node_3) {
                                $vnode_8.push($_quick_static_node_3); }else{;$vnode_8.push($_quick_static_node_3=$_create('stop',{'mxs': 'dk:a', 'offset': '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0',})); };$vnode_7.push($_create('lineargradient',{'id': 'gw_'+$n(id), 'x1': '0%', 'y1': '100%', 'x2': '100%', 'y2': '100%',},$vnode_8 )); ;$vnode_6=[$_create('defs',0,$vnode_7 )];  ;$vnode_6.push($_create('rect',{'x': '0', 'y': '0', 'width': '100%', 'height': '100%', 'fill': 'url(#gw_'+$n(id)+')',}));  ;$vnode_6.push($_create('rect',{'x': '0', 'y': '0', 'width': '100%', 'height': '100%', 'fill': 'url(#gb_'+$n(id)+')',})); ;$vnode_5=[$_create('svg',$_quick_vnode_attr_static_1,$vnode_6 )];  ;$vnode_5.push($_create('div',{'class': 'daM', 'id': 'ci_'+$n(id),})); ;$vnode_4=[$_create('div',{'class': 'daL', 'id': 'cz_'+$n(id), 'mx-mousedown': $_viewId+'__aW()',},$vnode_5 )];      if ($_quick_static_node_5) {
                                $vnode_8=[$_quick_static_node_5]; }else{;$vnode_8=[$_quick_static_node_5=$_create('stop',{'mxs': 'dk:c', 'offset': '0%', 'stop-color': '#FF0000', 'stop-opacity': '1',})]; } if ($_quick_static_node_6) {
                                $vnode_8.push($_quick_static_node_6); }else{;$vnode_8.push($_quick_static_node_6=$_create('stop',{'mxs': 'dk:d', 'offset': '13%', 'stop-color': '#FF00FF', 'stop-opacity': '1',})); } if ($_quick_static_node_7) {
                                $vnode_8.push($_quick_static_node_7); }else{;$vnode_8.push($_quick_static_node_7=$_create('stop',{'mxs': 'dk:e', 'offset': '25%', 'stop-color': '#8000FF', 'stop-opacity': '1',})); } if ($_quick_static_node_8) {
                                $vnode_8.push($_quick_static_node_8); }else{;$vnode_8.push($_quick_static_node_8=$_create('stop',{'mxs': 'dk:f', 'offset': '38%', 'stop-color': '#0040FF', 'stop-opacity': '1',})); } if ($_quick_static_node_9) {
                                $vnode_8.push($_quick_static_node_9); }else{;$vnode_8.push($_quick_static_node_9=$_create('stop',{'mxs': 'dk:g', 'offset': '50%', 'stop-color': '#00FFFF', 'stop-opacity': '1',})); } if ($_quick_static_node_10) {
                                $vnode_8.push($_quick_static_node_10); }else{;$vnode_8.push($_quick_static_node_10=$_create('stop',{'mxs': 'dk:h', 'offset': '63%', 'stop-color': '#00FF40', 'stop-opacity': '1',})); } if ($_quick_static_node_11) {
                                $vnode_8.push($_quick_static_node_11); }else{;$vnode_8.push($_quick_static_node_11=$_create('stop',{'mxs': 'dk:i', 'offset': '75%', 'stop-color': '#0BED00', 'stop-opacity': '1',})); } if ($_quick_static_node_12) {
                                $vnode_8.push($_quick_static_node_12); }else{;$vnode_8.push($_quick_static_node_12=$_create('stop',{'mxs': 'dk:j', 'offset': '88%', 'stop-color': '#FFFF00', 'stop-opacity': '1',})); } if ($_quick_static_node_13) {
                                $vnode_8.push($_quick_static_node_13); }else{;$vnode_8.push($_quick_static_node_13=$_create('stop',{'mxs': 'dk:k', 'offset': '100%', 'stop-color': '#FF0000', 'stop-opacity': '1',})); };$vnode_7=[$_create('lineargradient',{'id': 'ghsv_'+$n(id), 'x1': '0%', 'y1': '100%', 'x2': '0%', 'y2': '0%',},$vnode_8 )]; ;$vnode_6=[$_create('defs',0,$vnode_7 )];  ;$vnode_6.push($_create('rect',{'x': '0', 'y': '0', 'width': '100%', 'height': '100%', 'fill': 'url(#ghsv_'+$n(id)+')',})); ;$vnode_5=[$_create('svg',$_quick_vnode_attr_static_1,$vnode_6 )];  ;$vnode_5.push($_create('div',{'class': 'daO', 'id': 'si_'+$n(id),})); ;$vnode_4.push($_create('div',{'class': 'daN', 'mx-mousedown': $_viewId+'__aX()',},$vnode_5 )); ;$vnode_3.push($_create('div',$_quick_vnode_attr_static_0,$vnode_4 )); if(alpha){    ;$vnode_6=[$_create('div',{'class': 'daU', 'id': 'ai_'+$n(id),})]; ;$vnode_5=[$_create('div',{'class': 'daT dh', 'id': 'at_'+$n(id), 'mx-mousedown': $_viewId+'__aY()',},$vnode_6 )]; ;$vnode_4=[$_create('div',$_quick_vnode_attr_static_14,$vnode_5 )]; $vnode_3.push(...$vnode_4); }  ;$vnode_4=[$_create('span',{'class': 'daR', 'id': 'bc_'+$n(id),})];  ;$vnode_4.push($_create('input',{'class': 'du daQ', 'readonly': true, 'id': 'v_'+$n(id), 'value': $n(current),},0,1));  $vnode_5=[$_create(0,0,'确定')];;$vnode_4.push($_create('button',{'mxs': 'dk:l', 'class': 'dn do', 'type': 'button', 'mx-click': $_viewId+'__aZ();',},$vnode_5 )); ;$vnode_3.push($_create('div',$_quick_vnode_attr_static_15,$vnode_4 )); $vnode_2.push(...$vnode_3); };$vnode_1.push($_create('div',{'id': 'bd_'+$n(id), 'class': 'daF daG-'+$n(placement), 'style': $n(align)+':-1px',},$vnode_2 )); ;$$_class='daB';if(disabled){;$$_class+=' daV';};$vnode_0.push($_create('div',{'mx-contextmenu': $_viewId+'__A()', 'id': 'root_'+$n(id), 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    init(data) {
        this.set({
            shortcuts: ShortCuts
        });
        index_2.default["__aL"]();
        this.on('destroy', () => {
            index_2.default['__aM'](this);
            index_2.default['__aN']();
        });
        this.assign(data);
    },
    assign(data) {
        let me = this;
        me['__aa'] = data.color;
        me['__aO'] = (data.alpha + '') == 'true';
        me['__aP'] = {
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
            alpha: this['__aO'],
            color: this['__aa'],
            current: this['__aa']
        });
    },
    '__aS'(hsv, ignoreSyncUI) {
        let me = this;
        let selfHSV = me['__aP'];
        selfHSV.h = hsv.h;
        selfHSV.s = hsv.s;
        selfHSV.v = hsv.v;
        let rgb = HSV2RGB(hsv.h, hsv.s, hsv.v);
        let hex = rgb.hex;
        let cpickerNode = magix_1.default.node('cz_' + me.id);
        let pickerZone = cpickerNode.clientWidth;
        let colorZone = HSV2RGB(hsv.h, 1, 1);
        cpickerNode.style.background = colorZone.hex;
        me['__aQ'] = hex;
        me['__aR']();
        if (!ignoreSyncUI) {
            let selected = magix_1.node('scs_' + me.id).querySelector('li[class$="daJ"]');
            if (selected) {
                selected.classList.remove('daJ');
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
            sc.classList.add('daJ');
        }
    },
    '__aV'(hex) {
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
        me['__aT'] = ('0' + a.toString(16)).slice(-2);
        me['__aS'](hsv);
        if (me['__aO']) {
            me['__aU'](a);
        }
    },
    '__aU'(a) {
        let me = this;
        let ai = magix_1.node('ai_' + me.id);
        let alphaWidth = magix_1.node('at_' + me.id).clientWidth;
        let slider = ai.clientWidth / 2;
        a /= 255;
        a *= alphaWidth;
        a -= slider;
        ai.style.left = a + 'px';
    },
    '__aR'() {
        let me = this;
        let n = magix_1.node('bc_' + me.id);
        let hex = me['__aQ'];
        if (me['__aO']) {
            magix_1.node('at_' + me.id).style.background = 'linear-gradient(to right, ' + hex + '00 0%,' + hex + ' 100%)';
            hex += me['__aT'];
        }
        n.style.background = hex;
        let n1 = magix_1.node('v_' + me.id);
        n1.value = hex;
    },
    '__A<contextmenu>'(e) {
        e.preventDefault();
    },
    '__aW<mousedown>'(e) {
        let me = this, pickerZone = magix_1.node('cz_' + me.id).clientWidth, pickerIndicator = magix_1.node('ci_' + me.id).clientWidth / 2, offset = e.eventTarget.getBoundingClientRect(), left = e.pageX - offset.left - window.pageXOffset, top = e.pageY - offset.top - window.pageYOffset, s = left / pickerZone, v = (pickerZone - top) / pickerZone;
        me['__aS']({
            h: me['__aP'].h,
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
        me['__w'](e, (event) => {
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
            me['__aS']({
                h: me['__aP'].h,
                s: s,
                v: v
            });
        });
    },
    '__aX<mousedown>'(e) {
        let me = this;
        let current = e.eventTarget;
        let indicator = magix_1.node('si_' + me.id);
        let pickerZone = magix_1.node('cz_' + me.id).clientWidth;
        let slider = indicator.clientHeight / 2;
        let offset = current.getBoundingClientRect(), top = e.pageY - offset.top - window.scrollY, h = top / pickerZone * 360;
        me['__aS']({
            h: h,
            s: me['__aP'].s,
            v: me['__aP'].v
        });
        let startY = parseInt(getComputedStyle(indicator).top, 10);
        me['__w'](e, event => {
            let offsetY = event.pageY - e.pageY;
            offsetY += startY;
            if (offsetY <= -slider)
                offsetY = -slider;
            else if (offsetY >= (pickerZone - slider))
                offsetY = pickerZone - slider;
            indicator.style.top = offsetY + 'px';
            let h = (offsetY + slider) / pickerZone * 360;
            me['__aS']({
                h: h,
                s: me['__aP'].s,
                v: me['__aP'].v
            }, true);
        });
    },
    '__aY<mousedown>'(e) {
        let current = e.eventTarget;
        let me = this;
        let indicator = magix_1.node('ai_' + me.id);
        let alphaWidth = magix_1.node('at_' + me.id).clientWidth;
        let slider = indicator.clientWidth / 2;
        let offset = current.getBoundingClientRect(), left = e.pageX - offset.left, a = (left / alphaWidth * 255) | 0;
        me['__aT'] = ('0' + a.toString(16)).slice(-2);
        me['__aU'](a);
        me['__aR']();
        let styles = getComputedStyle(indicator);
        let startX = parseInt(styles.left, 10);
        me['__w'](e, (event) => {
            let offsetX = event.pageX - e.pageX;
            offsetX += startX;
            if (offsetX <= -slider)
                offsetX = -slider;
            else if (offsetX >= (alphaWidth - slider))
                offsetX = alphaWidth - slider;
            indicator.style.left = offsetX + 'px';
            let a = Math.round((offsetX + slider) / alphaWidth * 255);
            me['__aT'] = ('0' + a.toString(16)).slice(-2);
            me['__aR']();
        });
    },
    '__aZ<click>'() {
        let me = this;
        me['__y']();
        let n = magix_1.node('v_' + me.id);
        let c = n.value;
        if (c != me['__aa']) {
            me.digest({
                color: c,
                current: c
            });
            magix_1.default.dispatch(me.root, 'input', {
                color: me['__aa'] = c
            });
        }
    },
    '__b_<click>'(e) {
        this['__aV'](e.params.color);
        e.eventTarget.classList.add('daJ');
    },
    '__ba'(node) {
        return magix_1.default.inside(node, this.root);
    },
    '__x'() {
        let n = magix_1.node('bd_' + this.id);
        let d = getComputedStyle(n).display;
        if (d == 'none') {
            n.style.display = 'block';
            index_2.default["__bb"](this);
            magix_1.node('root_' + this.id).classList.add('dw');
            if (!this['__bc']) {
                this.digest({
                    renderUI: true
                }, null, () => {
                    this['__aV'](this['__aa']);
                });
                this['__bc'] = 1;
            }
        }
    },
    '__y'() {
        let n = magix_1.node('bd_' + this.id);
        let d = getComputedStyle(n).display;
        if (d != 'none') {
            magix_1.node('root_' + this.id).classList.remove('dw');
            n.style.display = 'none';
            index_2.default["__aM"](this);
        }
    },
    '__bd<click>'() {
        if (this.get('disabled'))
            return;
        let n = magix_1.node('bd_' + this.id);
        let d = getComputedStyle(n).display;
        if (d == 'none') {
            this['__x']();
        }
        else {
            this['__y']();
        }
    },
    '__be<click>'() {
        if (this.get('disabled'))
            return;
        let me = this, c = '';
        if (me['__bc']) {
            let cr = magix_1.node('v_' + me.id).value;
            me['__y']();
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
            color: me['__aa'] = c
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
let $_quick_vnode_attr_static_0={'class': 'dp',};
let $_quick_vnode_attr_static_1={'class': 'dq', 'style': 'word-break:break-all;',};
let $_quick_vnode_attr_static_2={'class': 'dr dj',};
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
  $vnode_2=[$_create(0,0,(title))];;$vnode_1=[$_create('h5',0,$vnode_2 )]; ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_0,$vnode_1 ));  $vnode_1=[$_create(0,0,(body))];;$vnode_0.push($_create('div',$_quick_vnode_attr_static_1,$vnode_1 ));   $vnode_2=[$_create(0,0,(i18n('_I')))];;$vnode_1=[$_create('button',{'mx-click': $_viewId+'__aZ();', 'class': 'dn do de', 'type': 'button',},$vnode_2 )]; ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_2,$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(extra) {
        let me = this;
        me['__bf'] = extra.dialog;
        me['__bg'] = extra.body;
        me['__bh'] = extra.title || index_1.default('__H');
        me['__bi'] = extra.enterCallback;
    },
    render() {
        let me = this;
        me.digest({
            body: me['__bg'],
            title: me['__bh']
        });
    },
    '__aZ<click>'() {
        let me = this;
        me['__bf'].close();
        if (me['__bi']) {
            magix_1.default.toTry(me['__bi']);
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
let $_quick_vnode_attr_static_0={'class': 'dp',};
let $_quick_vnode_attr_static_1={'class': 'dq', 'style': 'word-break:break-all;',};
let $_quick_vnode_attr_static_2={'class': 'dr dj',};
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
  $vnode_2=[$_create(0,0,(title))];;$vnode_1=[$_create('h5',0,$vnode_2 )]; ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_0,$vnode_1 ));  $vnode_1=[$_create(0,0,(body))];;$vnode_0.push($_create('div',$_quick_vnode_attr_static_1,$vnode_1 ));   $vnode_2=[$_create(0,0,(i18n('_J')))];;$vnode_1=[$_create('button',{'type': 'button', 'mx-click': $_viewId+'__bk()', 'class': 'dn de',},$vnode_2 )];  $vnode_2=[$_create(0,0,(i18n('_I')))];;$vnode_1.push($_create('button',{'type': 'button', 'mx-click': $_viewId+'__aZ()', 'class': 'dn do da de',},$vnode_2 )); ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_2,$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(extra) {
        let me = this;
        me['__bf'] = extra.dialog;
        me['__bg'] = extra.body;
        me['__bh'] = extra.title || index_1.default('__H');
        me['__bi'] = extra.enterCallback;
        me['__bj'] = extra.cancelCallback;
    },
    render() {
        let me = this;
        me.digest({
            body: me['__bg'],
            title: me['__bh']
        });
    },
    '__aZ<click>'() {
        let me = this;
        me['__bf'].close();
        if (me['__bi']) {
            magix_1.default.toTry(me['__bi']);
        }
    },
    '__bk<click>'() {
        let me = this;
        me['__bf'].close();
        if (me['__bj']) {
            magix_1.default.toTry(me['__bj']);
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
magix_1.default.applyStyle("di",".daW{position:absolute}.daX{position:relative;background-color:#fff;border-radius:2px;border:1px solid #e6e6e6}.daY{position:absolute;cursor:pointer;opacity:.2;z-index:1;top:7px;right:10px}.daY:focus,.daY:hover{opacity:.5}.daZ{position:fixed;top:0;right:0;left:0;bottom:0;background-color:#000;opacity:.2}.db_{-webkit-filter:blur(3px);filter:blur(3px)}.dba{-webkit-animation:dd .3s;animation:dd .3s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards}.dbb{position:absolute;right:10px;top:0;width:1px;height:0}.dbc{padding:80px 0}@-webkit-keyframes dd{0%{opacity:0}to{opacity:.2}}@keyframes dd{0%{opacity:0}to{opacity:.2}}.dbd{-webkit-animation:de .2s;animation:de .2s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards}@-webkit-keyframes de{0%{opacity:.2}to{opacity:0}}@keyframes de{0%{opacity:.2}to{opacity:0}}.dbe{margin-bottom:50px;min-height:60px}.dbf{position:fixed;width:100%;height:100%;overflow:auto;left:0;top:0}.dbg{-webkit-animation:df .3s;animation:df .3s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards}@-webkit-keyframes df{0%{margin-top:-50px;opacity:0}to{margin-top:0;opacity:1}}@keyframes df{0%{margin-top:-50px;opacity:0}to{margin-top:0;opacity:1}}.dbh{-webkit-animation:dg .2s;animation:dg .2s;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards}@-webkit-keyframes dg{0%{margin-top:0;opacity:1}to{margin-top:-50px;opacity:0}}@keyframes dg{0%{margin-top:0;opacity:1}to{margin-top:-50px;opacity:0}}");
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
 ;$$_class='daZ';if(!removeClass){;$$_class+=' dba';};$vnode_0.push($_create('div',{'style': 'z-index:'+$n(zIndex-1), 'id': 'mask_'+$n(id), 'class': $$_class,}));    ;$vnode_2=[$_create('input',{'id': 'focus_'+$n(id), 'class': 'dbb',},0,1)];  $vnode_3=[$_create(0,0,'')];;$vnode_2.push($_create('span',{'class': 'd_ daY '+$n( closable ? '' : 'di'), 'mx-click': $_viewId+'__bn()',},$vnode_3 ));   if ($_quick_static_node_0) {
                                $vnode_3=[$_quick_static_node_0]; }else{ ;$vnode_4=[$_create('span',{'class': 'dt',})]; ;$vnode_3=[$_quick_static_node_0=$_create('div',{'mxs': 'dn:_', 'class': 'ds dbc',},$vnode_4 )]; };$vnode_2.push($_create('div',{'class': 'daX dbe', 'id': 'cnt_'+$n(id),},$vnode_3 )); ;$$_class='daW';if(!removeClass){;$$_class+=' dbg';};$vnode_1=[$_create('div',{'id': 'body_'+$n(id), 'style': 'left:'+$n(left)+'px;top:'+$n(top)+'px;width:'+$n(width)+'px;', 'class': $$_class,},$vnode_2 )]; ;$vnode_0.push($_create('div',{'class': 'dbf', 'style': 'z-index:'+$n(zIndex)+';',},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(extra) {
        let me = this;
        let app = magix_1.default.node('app');
        let root = me.root;
        me.on('destroy', () => {
            RemoveCache(me);
            DialogZIndex -= 2;
            if (DialogZIndex == 500) {
                app.classList.remove('db_');
            }
            magix_1.default.dispatch(root, 'close');
            root.parentNode.removeChild(root);
        });
        if (!magix_1.default.has(extra, 'closable')) {
            extra.closable = true;
        }
        me.set(extra);
        if (DialogZIndex == 500) {
            app.classList.add('db_');
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
    '__bl'(e) {
        let n = magix_1.default.node('cnt_' + this.id);
        let vf = magix_1.default.Vframe.byNode(n);
        vf.invoke('fire', ['unload', e]);
    },
    '__bm'() {
        let id = this.id, node;
        node = magix_1.default.node('body_' + id);
        node.classList.add('dbh');
        node = magix_1.default.node('mask_' + id);
        node.classList.add('dbd');
    },
    '__bn<click>'() {
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
    '__bp'(view, options) {
        let id = magix_1.default.guid('dlg_');
        document.body.insertAdjacentHTML('beforeend', '<div id="' + id + '" style="display:none" />');
        let node = magix_1.default.node(id);
        let vf = view.owner.mountVframe(node, 'gallery/mx-dialog/index', options);
        let suspend;
        let whenClose = () => {
            if (!node['__bo'] && !suspend) {
                let resume = () => {
                    node['__bo'] = 1;
                    vf.invoke('__bm');
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
                vf.invoke('__bl', [e]);
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
            dlg = me['__bp'](me, dOptions);
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
    e.preventDefault();
};
let DragMoveEvent = ['mousemove', 'touchmove', 'pointermove'];
let DragEndEvent = ['mouseup', 'touchend', 'pointercancel', 'touchcancel'];
let DragPreventEvent = ['keydown', 'mousewheel', 'DOMMouseScroll', 'fullscreenchange'];
exports.default = {
    ctor() {
        let me = this;
        me.on('destroy', () => {
            me['__bq']();
        });
    },
    '__bq'(e) {
        let me = this;
        let info = me['__br'];
        if (info) {
            delete me['__br'];
            let fn;
            for (fn of DragMoveEvent) {
                document.removeEventListener(fn, me['__bs']);
            }
            for (fn of DragEndEvent) {
                document.removeEventListener(fn, me['__bt']);
            }
            for (fn of DragPreventEvent) {
                document.removeEventListener(fn, DragPrevent);
            }
            window.removeEventListener('blur', me['__bt']);
            //let node = info['@{dd&node}'];
            let stop = info['__bu'];
            let iStop = info['__bv'];
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
    '__w'(e, moveCallback, endCallback) {
        let me = this;
        me['__bq']();
        if (e) {
            ClearSelection();
            //let node = e.eventTarget || e.target;
            // if (node.setCapture) {
            //     //node.setCapture();
            // } else if (node.setPointerCapture && e.pointerId) {
            //     node.setPointerCapture(e.pointerId);
            // }
            me['__br'] = {
                '__bu': endCallback,
                //'@{dd&node}': node,
                '__bv': !!endCallback
            };
            let moveIsFunction = !!moveCallback;
            me['__bw'] = 0;
            me['__bt'] = e => {
                me['__bw'] = 1;
                me['__bq'](e);
            };
            me['__bs'] = e => {
                if (moveIsFunction) {
                    moveCallback(e);
                }
            };
            let fn;
            for (fn of DragMoveEvent) {
                document.addEventListener(fn, me['__bs']);
            }
            for (fn of DragEndEvent) {
                document.addEventListener(fn, me['__bt']);
            }
            for (fn of DragPreventEvent) {
                document.addEventListener(fn, DragPrevent, {
                    passive: false
                });
            }
            window.addEventListener('blur', me['__bt']);
        }
    },
    '__aq'(x, y) {
        let node = null;
        if (document.elementFromPoint) {
            if (!DragPrevent['__bx'] && IsW3C) {
                DragPrevent['__bx'] = true;
                DragPrevent['__by'] = document.elementFromPoint(-1, -1) !== null;
            }
            if (DragPrevent['__by']) {
                x += window.pageXOffset;
                y += window.pageYOffset;
            }
            node = document.elementFromPoint(x, y);
            while (node && node.nodeType == 3)
                node = node.parentNode;
        }
        return node;
    },
    '__bz': ClearSelection
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
let $_quick_vnode_attr_static_1={'class': 'dbp',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../mx-monitor/index");
magix_1.default.applyStyle("dj",".dbi{outline:0;position:relative;min-width:50px;width:100%;background-color:#fff;border:1px solid #e6e6e6;border-radius:2px;display:inline-block;vertical-align:middle;height:22px;transition:all .25s}.dbi:hover{border-color:#ccc}.dbj{color:#333;position:relative;width:100%;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;padding:0 20px 0 3px}.dbk{cursor:not-allowed;background-color:#fbfbfb}.dbk:hover{border-color:#e6e6e6}.dbk .dbj{cursor:not-allowed}.dbl{position:absolute;right:0;top:0;font-size:20px;color:#ccc;transition:all .25s}.dbm .dbl{-webkit-transform:rotate(180deg);transform:rotate(180deg);top:0}.dbi[tabindex=\"0\"]:focus,.dbm,.dbm:hover{border-color:#fa742b}.dbn{height:20px;line-height:21px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}.dbo{color:#999}.dbp{position:absolute;top:100%;left:-1px;right:-1px;margin-top:4px;border-radius:2px;z-index:300;border:1px solid #e6e6e6;background-color:#fff;display:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.dbm .dbp{display:block}.dbq{overflow:auto;max-height:196px;padding:2px 0}.dbr{padding:0 2px;margin:2px 0}.dbs{cursor:pointer;color:#666;display:block;width:100%;padding:0 5px;height:20px;line-height:20px;border-radius:2px}.dbs:hover{color:#333;background-color:#f0f0f0}.dbt,.dbt:active,.dbt:focus,.dbt:hover{color:#fff;background-color:#fa742b}");
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
 $vnode_1=[];   $vnode_3=[$_create(0,0,(selectedText))];;$$_class='dbn';if(selected===''||selected==emptyText){;$$_class+=' dbo';};$vnode_2=[$_create('span',{'class': $$_class,},$vnode_3 )];  if ($_quick_static_node_0) {
                                $vnode_2.push($_quick_static_node_0); }else{$vnode_3=[$_create(0,0,'')];;$vnode_2.push($_quick_static_node_0=$_create('span',{'mxs': 'do:_', 'class': 'd_ dbl',},$vnode_3 )); };$vnode_1.push($_create('div',{'class': 'dbj', 'mx-click': $_viewId+'__bd()', 'title': $n(selectedText),},$vnode_2 )); if(rList){   $vnode_4=[]; for(let $q_key_brvfkzjmjv=0,$q_a_gxwmuitlyu=list,$q_c_tywqoeqm=$q_a_gxwmuitlyu.length;$q_key_brvfkzjmjv<$q_c_tywqoeqm;$q_key_brvfkzjmjv++){let item=$q_a_gxwmuitlyu[$q_key_brvfkzjmjv]; $vnode_5=[]; let text=item,value=item;;if(textKey&&valueKey){ $text='';text=item[textKey];$text+=' ';value=item[valueKey];}let equal=(value+'')===(selected+'');;  $vnode_7=[$_create(0,0,(text))];;$$_class='dbs dm';if(equal){;$$_class+=' dbt';};$vnode_6=[$_create('span',{'mx-click': $_viewId+'__bA({item:\''+$i($_ref,item)+'\'})', 'class': $$_class,},$vnode_7 )]; ;$vnode_5.push($_create('li',{'title': $n(text), 'active': ($_temp=(equal))!=null&&$_temp, 'class': 'dbr',},$vnode_6 )); $vnode_4.push(...$vnode_5); };$vnode_3=[$_create('ul',{'class': 'dbq', 'id': 'list_'+$n(id),},$vnode_4 )]; ;$vnode_2=[$_create('div',$_quick_vnode_attr_static_1,$vnode_3 )]; $vnode_1.push(...$vnode_2); };$$_class='dbi';if(disabled){;$$_class+=' dbk';};$vnode_0.push($_create('div',{'id': 'dd_'+$n(id), 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        index_1.default["__aL"]();
        this.on('destroy', () => {
            index_1.default['__aM'](this);
            index_1.default['__aN']();
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
    '__ba'(node) {
        return magix_1.default.inside(node, this.root);
    },
    '__x'() {
        let me = this;
        let node = magix_1.default.node('dd_' + me.id);
        if (!node.classList.contains('dbm')) {
            node.classList.add('dbm');
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
            index_1.default['__bb'](me);
        }
    },
    '__y'() {
        let me = this;
        let node = magix_1.default.node('dd_' + me.id);
        if (node.classList.contains('dbm')) {
            node.classList.remove('dbm');
            index_1.default['__aM'](me);
        }
    },
    '__bd<click>'() {
        let me = this;
        let node = magix_1.default.node('dd_' + me.id);
        if (node.classList.contains('dbm')) {
            me['__y']();
        }
        else if (!node.classList.contains('dbk')) {
            me['__x']();
        }
    },
    '__bA<click>'(e) {
        let me = this;
        me['__y']();
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
magix_1.default.applyStyle("dk",".dbu{display:inline-block;height:25px;line-height:25px;vertical-align:bottom}.dbv{width:20px;margin:0 1px;text-align:center;height:20px;line-height:20px;cursor:pointer;background:#e0e0e0;border-radius:2px}.dbv:hover{background:#ccc}.dbw,.dbw:hover{background:#fa742b;color:#fff}.dbx,.dbx .dbv{cursor:not-allowed;opacity:.7}.dbx .dbv,.dbx .dbv:hover{background:#e9e9e9}.dbx .dbw,.dbx .dbw:hover{background:#fb955d}");
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
  $vnode_2=[$_create(0,0,'')];;$$_class='dd dbv dx';if(value.h=='flex-start'){;$$_class+=' dbw';};$vnode_1=[$_create('li',{'title': $n(i18n('_K')), 'mx-click': $_viewId+'__ax({type:\'h\',v:\'flex-start\'})', 'class': $$_class,},$vnode_2 )];  $vnode_2=[$_create(0,0,'')];;$$_class='dd dbv dx';if(value.h=='center'){;$$_class+=' dbw';};$vnode_1.push($_create('li',{'title': $n(i18n('_L')), 'mx-click': $_viewId+'__ax({type:\'h\',v:\'center\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='dd dbv dx';if(value.h=='flex-end'){;$$_class+=' dbw';};$vnode_1.push($_create('li',{'title': $n(i18n('_M')), 'mx-click': $_viewId+'__ax({type:\'h\',v:\'flex-end\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='dd dbv dx';if(value.v=='flex-start'){;$$_class+=' dbw';};$vnode_1.push($_create('li',{'title': $n(i18n('_N')), 'mx-click': $_viewId+'__ax({type:\'v\',v:\'flex-start\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='dd dbv dx';if(value.v=='center'){;$$_class+=' dbw';};$vnode_1.push($_create('li',{'title': $n(i18n('_O')), 'mx-click': $_viewId+'__ax({type:\'v\',v:\'center\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='dd dbv dx';if(value.v=='flex-end'){;$$_class+=' dbw';};$vnode_1.push($_create('li',{'title': $n(i18n('_P')), 'mx-click': $_viewId+'__ax({type:\'v\',v:\'flex-end\'})', 'class': $$_class,},$vnode_2 )); ;$$_class='dk dbu';if(disabled){;$$_class+=' dbx';};$vnode_0.push($_create('ul',{'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        this.assign(data);
    },
    assign(data) {
        this['__bB'] = data.value;
        this.set({
            value: data.value,
            disabled: data.disabled
        });
        return true;
    },
    render() {
        this.digest();
    },
    '__ax<click>'(e) {
        let me = this;
        if (me.get('disabled')) {
            return;
        }
        let value = me['__bB'];
        let { type, v } = e.params;
        value[type] = v;
        me['__bB'] = value;
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
magix_1.default.applyStyle("dk",".dbu{display:inline-block;height:25px;line-height:25px;vertical-align:bottom}.dbv{width:20px;margin:0 1px;text-align:center;height:20px;line-height:20px;cursor:pointer;background:#e0e0e0;border-radius:2px}.dbv:hover{background:#ccc}.dbw,.dbw:hover{background:#fa742b;color:#fff}.dbx,.dbx .dbv{cursor:not-allowed;opacity:.7}.dbx .dbv,.dbx .dbv:hover{background:#e9e9e9}.dbx .dbw,.dbx .dbw:hover{background:#fb955d}");
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
  $vnode_2=[$_create(0,0,'')];;$$_class='dd dbv dx';if(value.bold){;$$_class+=' dbw';};$vnode_1=[$_create('li',{'title': $n(i18n('_Q')), 'mx-click': $_viewId+'__ax({key:\'bold\'})', 'class': $$_class,},$vnode_2 )];  $vnode_2=[$_create(0,0,'')];;$$_class='dd dbv dx';if(value.italic){;$$_class+=' dbw';};$vnode_1.push($_create('li',{'title': $n(i18n('_R')), 'mx-click': $_viewId+'__ax({key:\'italic\'})', 'class': $$_class,},$vnode_2 ));  $vnode_2=[$_create(0,0,'')];;$$_class='dd dbv dx';if(value.underline){;$$_class+=' dbw';};$vnode_1.push($_create('li',{'title': $n(i18n('_S')), 'mx-click': $_viewId+'__ax({key:\'underline\'})', 'class': $$_class,},$vnode_2 )); ;$$_class='dk dbu';if(disabled){;$$_class+=' dbx';};$vnode_0.push($_create('ul',{'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        this.assign(data);
    },
    assign(data) {
        this['__bB'] = data.value;
        this.set({
            value: data.value,
            disabled: data.disabled
        });
        return true;
    },
    render() {
        this.digest();
    },
    '__ax<click>'(e) {
        let me = this;
        if (me.get('disabled')) {
            return;
        }
        let v = me['__bB'];
        let { key } = e.params;
        v[key] = !v[key];
        me['__bB'] = v;
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
define("gallery/mx-layout/column",["magix","../mx-number/index"],(require,exports,module)=>{
/*magix_1*/
require("../mx-number/index");
let $_quick_vnode_attr_static_0={'class': 'dby',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
magix_1.default.applyStyle("dl",".dby{display:flex;margin:5px 0;align-items:center}.dbz{flex-basis:24px;text-align:right;color:#333;font-size:12px}.dbA,.dbz{cursor:pointer}.dbB{cursor:not-allowed;color:#bbb}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	columns,
	disabled,
	i18n,}=$$,
$vnode_1,
$vnode_2,
$vnode_3,
$$_class,
$vnode_4,
$text; 
for(let index=0,$q_a_gkrcunrw=columns,$q_c_ahtethuo=$q_a_gkrcunrw.length;index<$q_c_ahtethuo;index++){let col=$q_a_gkrcunrw[index];  $vnode_2=[];  ;$vnode_2.push($_create('div',{'mxv': 'columns', 'disabled': ($_temp=(disabled))!=null&&$_temp, 'mx-input': $_viewId+'__bD({index:'+$n(index)+'})', 'mx-change': $_viewId+'__bC()', 'class': 'du dh', 'mx-view': 'gallery/mx-number/index?value='+$i($_ref,col.width)+'&max=1&min=0&fixed=2&step=0.01',})); if(columns.length>1){  $vnode_4=[$_create(0,0,'')];;$$_class='dx dbz';if(disabled){;$$_class+=' dbB';};$vnode_3=[$_create('i',{'title': $n(i18n('_T')), 'mx-click': $_viewId+'__bF({index:'+$n(index)+'})', 'class': $$_class,},$vnode_4 )]; $vnode_2.push(...$vnode_3); };$vnode_1=[$_create('div',$_quick_vnode_attr_static_0,$vnode_2 )]; $vnode_0.push(...$vnode_1); } $vnode_1=[$_create(0,0,'')];;$$_class='dx dbA';if(disabled){;$$_class+=' dbB';};$vnode_0.push($_create('i',{'title': $n(i18n('_U')), 'mx-click': $_viewId+'__bE()', 'class': $$_class,},$vnode_1 ));  
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
    },
    '__bC<change>'(e) {
        e.stopPropagation();
    },
    '__bD<input>'(e) {
        let columns = this.get('columns');
        let { index } = e.params;
        columns[index].width = e.value;
        magix_1.default.dispatch(this.root, 'change');
    },
    '__bE<click>'() {
        if (this.get('disabled'))
            return;
        let columns = this.get('columns');
        columns.push({
            width: 0,
            elements: []
        });
        this.digest({
            columns
        });
        magix_1.default.dispatch(this.root, 'change');
    },
    '__bF<click>'(e) {
        if (this.get('disabled'))
            return;
        let columns = this.get('columns');
        let { index } = e.params;
        columns.splice(index, 1);
        this.digest({
            columns
        });
        magix_1.default.dispatch(this.root, 'change');
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("gallery/mx-layout/guage",["magix","../mx-number/index"],(require,exports,module)=>{
/*magix_1*/
require("../mx-number/index");
let $_quick_vnode_attr_static_0={'class': 'dbC',};
let $_quick_vnode_attr_static_1={'class': 'dbD',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
magix_1.default.applyStyle("dm",".dbC{display:flex;align-items:center}.dbD{width:30px}");
let GuargeTitles = ['__V',
    '__W',
    '__X',
    '__Y'];
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	i18n,
	titles,
	disabled,
	guage,}=$$,
$vnode_1,
$vnode_2,
$vnode_3,
$text; 
for(let i=0;i<4;i++){   $vnode_3=[$_create(0,0,(i18n(titles[i])))];;$vnode_2=[$_create('div',$_quick_vnode_attr_static_1,$vnode_3 )];  ;$vnode_2.push($_create('div',{'mxv': 'guage', 'disabled': ($_temp=(disabled))!=null&&$_temp, 'mx-input': $_viewId+'__bD({index:'+$n(i)+'})', 'mx-change': $_viewId+'__bC()', 'class': 'du dh', 'mx-view': 'gallery/mx-number/index?max=500&min=0&value='+$i($_ref,guage[i]),})); ;$vnode_1=[$_create('div',$_quick_vnode_attr_static_0,$vnode_2 )]; $vnode_0.push(...$vnode_1); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        this.set({
            titles: GuargeTitles
        });
        this.assign(data);
    },
    assign(data) {
        let { guage, disabled } = data;
        let gs = guage.split(' ');
        let gts = [];
        for (let g of gs) {
            gts.push(parseInt(g, 10));
        }
        this.set({
            disabled,
            guage: gts
        });
        return true;
    },
    render() {
        this.digest();
    },
    '__bC<change>'(e) {
        e.stopPropagation();
    },
    '__bD<input>'(e) {
        e.stopPropagation();
        let guage = this.get('guage');
        let { index } = e.params;
        guage[index] = e.value;
        magix_1.default.dispatch(this.root, 'change', {
            value: guage.join('px ') + 'px'
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
let $_quick_vnode_attr_static_0={'class': 'dbF dk',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
 */
const magix_1 = require("magix");
const index_1 = require("../mx-monitor/index");
magix_1.default.applyStyle("dn",".dbE{z-index:400}.dbF{background-color:#fff;border:1px solid #e6e6e6;border-radius:2px;cursor:default;padding:2px 0;box-shadow:0 1px 3px 1px rgba(0,0,0,.06)}.dbG{height:22px;line-height:22px;cursor:default;border-radius:2px;padding:0 2px;margin:0 2px}.dbH{color:#fff;background-color:#fa742b}.dbI{height:1px;background:#eee;margin:4px 0}.dbJ{color:#ccc;cursor:not-allowed}");
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
  $vnode_2=[]; for(let $q_key_ymupjdzfg=0,$q_a_nwwfsdk=list,$q_c_unpfbhcon=$q_a_nwwfsdk.length;$q_key_ymupjdzfg<$q_c_unpfbhcon;$q_key_ymupjdzfg++){let one=$q_a_nwwfsdk[$q_key_ymupjdzfg]; $vnode_3=[]; if(one.spliter){  if ($_quick_static_node_1) {
                                $vnode_4=[$_quick_static_node_1]; }else{;$vnode_4=[$_quick_static_node_1=$_create('li',{'mxs': 'dt:_', 'class': 'dbI',})]; }$vnode_3.push(...$vnode_4); }else{  $vnode_5=[$_create(0,0,(one[textKey]))];;$$_class='dm dbG ';if(disabled[one.id]){;$$_class+=' dbJ';};$vnode_4=[$_create('li',{'mx-mouseover': $_viewId+'__bN({d:'+$n(disabled[one.id]||0)+'})', 'mx-mouseout': $_viewId+'__bN({d:'+$n(disabled[one.id]||0)+'});', 'mx-click': $_viewId+'__bA({item:\''+$i($_ref,one)+'\',d:'+$n(disabled[one.id]||0)+'})', 'title': $n(one[textKey]), 'class': $$_class,},$vnode_5 )]; $vnode_3.push(...$vnode_4); }$vnode_2.push(...$vnode_3); };$vnode_1=[$_create('ul',$_quick_vnode_attr_static_0,$vnode_2 )]; ;$vnode_0.push($_create('div',{'style': 'width:'+$n(width)+'px;position:absolute;left:-10000px;top:-10000px', 'class': 'dbE', 'id': 'cnt_'+$n(id), 'mx-contextmenu': $_viewId+'__A()',},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(extra) {
        let me = this;
        me.assign(extra);
        index_1.default['__aL']();
        me.on('destroy', () => {
            index_1.default['__aM'](me);
            index_1.default['__aN']();
        });
    },
    assign(ops) {
        let me = this;
        let width = ops.width || 140;
        let valueKey = ops.valueKey || 'id';
        let textKey = ops.textKey || 'text';
        me['__bG'] = ops.list;
        me['__bH'] = width;
        me['__bI'] = valueKey;
        me['__bJ'] = textKey;
        me['__bK'] = ops.disabled || {};
        me['__bL'] = ops.picked;
        return true;
    },
    render() {
        let me = this;
        me.digest({
            disabled: me['__bK'],
            list: me['__bG'],
            width: me['__bH'],
            valueKey: me['__bI'],
            textKey: me['__bJ']
        });
    },
    '__ba'(node) {
        return magix_1.default.inside(node, this.root);
    },
    '__x'(e) {
        let me = this;
        if (!me['__bM']) {
            me['__bM'] = 1;
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
            index_1.default['__bb'](me);
        }
    },
    '__y'() {
        let me = this;
        if (me['__bM']) {
            me['__bM'] = false;
            let n = magix_1.node('cnt_' + me.id);
            n.style.left = '-10000px';
            index_1.default['__aM'](me);
        }
    },
    '__bN<mouseover,mouseout>'(e) {
        if (e.params.d)
            return;
        let target = e.eventTarget;
        let flag = !magix_1.default.inside(e.relatedTarget, target);
        if (flag) {
            target.classList[e.type == 'mouseout' ? 'remove' : 'add']('dbH');
        }
    },
    '__bA<click>'(e) {
        if (e.params.d)
            return;
        let me = this;
        me['__y']();
        let fn = me['__bL'];
        if (fn) {
            fn(e.params.item);
        }
    },
    '__A<contextmenu>'(e) {
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
            vf.invoke('__x', [e]);
        }
        else {
            document.body.insertAdjacentHTML("beforeend", `<div id="${id}"></div>`);
            vf = view.owner.mountVframe(magix_1.node(id), 'gallery/mx-menu/index', ops);
            vf.invoke('__x', [e]);
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
        if (info['__bO']) {
            Instances.splice(i, 1);
        }
        else {
            let view = info['__bP'];
            if (e.type == 'resize' || !view['__ba'](e.target)) {
                view['__y']();
            }
        }
    }
};
let Remove = view => {
    let info = Instances[view.id];
    if (info) {
        info['__bO'] = true;
    }
    delete Instances[view.id];
};
exports.default = {
    '__bb'(view) {
        Remove(view);
        let a = [];
        a.concat;
        let info = {
            '__bP': view
        };
        Instances.push(info);
        Instances[view.id] = info;
    },
    '__aM': Remove,
    '__aL'() {
        if (!ICounter) {
            for (let e of DocumentEvents) {
                document.addEventListener(e, Watcher);
            }
            window.addEventListener('resize', Watcher);
        }
        ICounter++;
    },
    '__aN'() {
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
magix_1.default.applyStyle("do",".dbK{width:100%;border:none;height:100%;background-color:transparent;color:#333;display:block}.dbL,.dbM{width:20px;height:50%;position:absolute;right:1px;border:2px solid #fff;border-radius:2px;cursor:pointer}.dbL:hover,.dbM:hover{background-color:#f0f0f0}.dbM{top:1px}.dbL{bottom:1px}.dbN:after{width:0;height:0;position:absolute;top:0;right:0;bottom:0;left:0;border-left:4px solid transparent;border-right:4px solid transparent;content:\"\";display:block;margin:auto}.dbL:after{border-top:4px solid #ccc}.dbM:after{border-bottom:4px solid #ccc}.dbL.dbO,.dbM.dbO{cursor:not-allowed;border-color:transparent}.dbL.dbO:hover,.dbM.dbO:hover{background-color:transparent}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	id,
	disabled,}=$$,
$$_class; 
 ;$vnode_0.push($_create('input',{'class': 'dbK', 'id': 'ipt_'+$n(id), 'mx-focusin': $_viewId+'__ch()', 'mx-focusout': $_viewId+'__cj()', 'mx-change': $_viewId+'__cg()', 'mx-keydown': $_viewId+'__co()', 'disabled': (disabled), 'autocomplete': 'off', 'mx-input': $_viewId+'__cp()',},0,1));  ;$$_class='dbM dbN dk';if(disabled){;$$_class+=' dbO';};$vnode_0.push($_create('span',{'mx-click': $_viewId+'__cc({i:1})', 'mx-mousedown': $_viewId+'__cn({i:1})', 'mx-contextmenu': $_viewId+'__A()', 'class': $$_class,}));  ;$$_class='dbL dbN dk';if(disabled){;$$_class+=' dbO';};$vnode_0.push($_create('span',{'mx-click': $_viewId+'__cc()', 'mx-mousedown': $_viewId+'__cn()', 'mx-contextmenu': $_viewId+'__A()', 'class': $$_class,}));  
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
        let diff = me['__bQ'] !== v;
        let preDis = me['__bR'];
        me['__bQ'] = v;
        me['__bS'] = +ops.step || 1;
        me['__bT'] = (ops.empty + '') == 'true';
        me['__bU'] = (ops.format + '') == 'true';
        me['__bR'] = me.root.hasAttribute('disabled');
        me['__bV'] = magix_1.default.has(ops, 'max') ? +ops.max : Number.MAX_VALUE;
        me['__bW'] = magix_1.default.has(ops, 'min') ? +ops.min : -Number.MAX_VALUE;
        me['__bX'] = +ops.ratio || 10;
        me['__bY'] = ops.fixed || 0;
        return diff || preDis != me['__bR'];
    },
    render() {
        let me = this;
        me.digest({
            disabled: me['__bR']
        }, null, () => {
            me['__bZ']();
        });
    },
    '__bZ'() {
        let me = this;
        let v = me['__bQ'];
        if (v !== '') {
            v = me['__c_'](v); //.toFixed(me['@{tail.length}']);
            if (me['__bU']) {
                v = v.toFixed(me['__bY']);
            }
        }
        me['__ca'] = magix_1.node('ipt_' + me.id);
        me['__ca'].value = v;
    },
    '__c_'(v) {
        let me = this;
        v = +v;
        if (v || v === 0) {
            let max = me['__bV'];
            let min = me['__bW'];
            // let step = me['@{step}'];
            // v = step < 1 ? Math.round(v / step) * step : v;
            if (v > max) {
                v = max;
            }
            else if (v < min) {
                v = min;
            }
            v = +v.toFixed(me['__bY']);
        }
        return isNaN(v) ? (me['__bT'] ? '' : 0) : v;
    },
    '__cb'(v, ignoreFill) {
        let me = this;
        if (v === '' && me['__bT']) {
            magix_1.default.dispatch(me.root, 'input', {
                value: me['__bQ'] = v
            });
            return;
        }
        v = me['__c_'](v);
        if (v !== me['__bQ']) {
            if (!ignoreFill) {
                me['__ca'].value = v;
            }
            magix_1.default.dispatch(me.root, 'input', {
                value: me['__bQ'] = v
            });
        }
        return me['__bQ'];
    },
    '__cc'(increase, enlarge) {
        let me = this;
        console.log(increase);
        let value = me['__bQ'];
        if (value === '')
            value = 0; //for init
        let step = me['__bS'];
        let c = value;
        if (enlarge)
            step *= me['__bX'];
        if (increase) {
            c += step;
        }
        else {
            c -= step;
        }
        me['__cb'](c);
    },
    '__cd'() {
        let me = this;
        let ipt = me['__ca'];
        if (ipt) {
            ipt.focus();
            ipt.selectionStart = ipt.selectionEnd = ipt.value.length;
        }
    },
    '__cf'() {
        let me = this;
        me.root.classList.add('dw');
        if (!magix_1.default.has(me, '__ce')) {
            me['__ce'] = me['__bQ'];
        }
    },
    '__cg<change>'(e) {
        e.stopPropagation();
    },
    '__ch<focusin>'() {
        this['__cf']();
    },
    '__cj<focusout>'(e) {
        let me = this;
        if (!me['__ci']) {
            me.root.classList.remove('dw');
            me['__bZ']();
            if (me['__ce'] != me['__bQ']) {
                magix_1.default.dispatch(me.root, 'change', {
                    value: me['__bQ']
                });
            }
            delete me['__ce'];
        }
    },
    '__cc<click>'(e) {
        let me = this;
        if (!me['__bR'] && !me['__ck']) {
            me['__cc'](e.params.i, e.shiftKey);
            me['__cd']();
        }
    },
    '__cn<mousedown>'(e) {
        let me = this;
        if (!me['__bR']) {
            me['__ci'] = true;
            me['__cf']();
            let i = e.params.i;
            me['__cl'] = setTimeout(me.wrapAsync(() => {
                me['__cm'] = setInterval(me.wrapAsync(() => {
                    me['__ck'] = true;
                    me['__cc'](i);
                    me['__cd']();
                }), 50);
            }), 300);
        }
    },
    '__co<keydown>'(e) {
        if (e.keyCode == 38 || e.keyCode == 40) {
            e.preventDefault();
            let me = this;
            if (!me['__bR']) {
                let target = e.eventTarget;
                let value = target.value;
                if (value === '') {
                    me['__bQ'] = '';
                }
                else {
                    let v = Number(value);
                    if (v || v === 0) {
                        if (v != me['__bQ']) {
                            me['__bQ'] = v;
                        }
                    }
                }
                me['__cc'](e.keyCode == 38, e.shiftKey);
            }
        }
    },
    '__A<contextmenu>'(e) {
        e.preventDefault();
    },
    '__cp<input>'(e) {
        e.stopPropagation();
        let target = e.eventTarget;
        this['__cb'](target.value, true);
    },
    '$doc<mouseup>'() {
        let me = this;
        clearTimeout(me['__cl']);
        clearInterval(me['__cm']);
        delete me['__ci'];
        setTimeout(me.wrapAsync(() => {
            delete me['__ck'];
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
let $_quick_vnode_attr_static_0={'class': 'dbQ',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../mx-dialog/index");
magix_1.default.applyStyle("dp",".dbP{height:100px;padding:4px;border:1px solid #e6e6e6;background:#fff;cursor:pointer;margin:4px 0}.dbQ{line-height:92px;text-align:center;color:#999}.dbR{min-height:500px}.dbS{width:100px;height:100px;margin:4px;overflow:hidden;border:1px solid #e6e6e6;cursor:pointer;padding:4px}.dbS:hover{border-color:#999}.dbT{width:100%;height:100%;background-position:50%;background-repeat:no-repeat;background-size:contain}.dbU{width:100px;margin:0 5px;height:25px}.dbV{margin:30px 0}.dbW{font-size:16px}.dbX{position:absolute;right:3px;top:2px;opacity:.2}.dbX:hover{opacity:.5}");
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
 $vnode_1=[]; if(src){   $vnode_4=[$_create(0,0,'')];;$vnode_3=[$_create('i',{'class': 'd_ dbX', 'mx-click': $_viewId+'__cs()', 'title': $n(i18n('_Z')),},$vnode_4 )]; ;$vnode_2=[$_create('div',{'class': 'dbT', 'style': 'background-image:url(\''+$n(src)+'\')',},$vnode_3 )]; $vnode_1.push(...$vnode_2); }else{  $vnode_3=[$_create(0,0,(i18n('_a_')))];;$vnode_2=[$_create('div',$_quick_vnode_attr_static_0,$vnode_3 )]; $vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',{'class': 'dbP dh', 'mx-click': $_viewId+'__cr()',},$vnode_1 ));  
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
    '__cr<click>'() {
        let me = this;
        me.mxDialog('gallery/mx-picture/list', {
            width: 932,
            done(pic) {
                me.digest(pic);
                me['__cq'](pic);
            }
        });
    },
    '__cq'(pic) {
        magix_1.default.dispatch(this.root, 'change', pic);
    },
    '__cs<click>'(e) {
        e.stopPropagation();
        this.digest({
            src: ''
        });
        this['__cq']({
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
let $_quick_vnode_attr_static_0={'class': 'dp dF',};
let $_quick_vnode_attr_static_1={'class': 'dq dj dbR',};
let $_quick_vnode_attr_static_2={'class': 'dc dbV dbW',};
let $_quick_vnode_attr_static_3={'class': 'dc dbU dm',};
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
  $vnode_2=[$_create(0,0,(i18n('_ab')))];;$vnode_1=[$_create('h5',0,$vnode_2 )]; ;$vnode_0.push($_create('div',$_quick_vnode_attr_static_0,$vnode_1 ));  $vnode_1=[]; if(error){  $vnode_3=[$_create(0,0,(error.msg))];;$vnode_2=[$_create('div',$_quick_vnode_attr_static_2,$vnode_3 )]; $vnode_1.push(...$vnode_2); }else{ $vnode_2=[]; for(let $q_key_wvxflrxiogi=0,$q_a_lrxlloli=list,$q_c_ournetyv=$q_a_lrxlloli.length;$q_key_wvxflrxiogi<$q_c_ournetyv;$q_key_wvxflrxiogi++){let p=$q_a_lrxlloli[$q_key_wvxflrxiogi];    ;$vnode_5=[$_create('div',{'class': 'dbT', 'style': 'background-image:url(\''+$n(p.src)+'\')',})]; ;$vnode_4=[$_create('div',{'class': 'dbS', 'mx-click': $_viewId+'__cu({src:\''+($eq(p.src))+'\'})',},$vnode_5 )];  $vnode_5=[$_create(0,0,(p.title))];;$vnode_4.push($_create('div',$_quick_vnode_attr_static_3,$vnode_5 )); ;$vnode_3=[$_create('div',{'class': 'dd', 'title': $n(p.title),},$vnode_4 )]; $vnode_2.push(...$vnode_3); }$vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',$_quick_vnode_attr_static_1,$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init(data) {
        let me = this;
        me['__bf'] = data.dialog;
        me['__ct'] = data.done;
    },
    render() {
        this.fetch(['__ak'], (err, bag) => {
            this.digest({
                error: err,
                list: bag.get('data', [])
            });
        });
    },
    '__cu<click>'(e) {
        let me = this;
        let img = new Image();
        let done = me['__ct'];
        let src = e.params.src;
        img.onerror = me.wrapAsync(() => {
            me.alert(index_1.default('__aa'));
        });
        img.onload = me.wrapAsync(() => {
            let w = img.width;
            let h = img.height;
            me['__bf'].close();
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
magix_1.default.applyStyle("dq",".dbY{opacity:0;background:#fff;position:fixed;left:0;right:0;top:0;bottom:0;z-index:10000}");
exports.default = {
    '__x'(e) {
        let styles = getComputedStyle(e);
        this['__cv'](styles.cursor);
    },
    '__cv'(cursor) {
        let n = magix_1.node(CursorId);
        if (!n) {
            document.body.insertAdjacentHTML('beforeend', `<div class="dbY" id="${CursorId}"/>`);
            n = magix_1.node(CursorId);
        }
        n.style.cursor = cursor;
        n.style.display = 'block';
    },
    '__y'() {
        magix_1.node(CursorId).style.display = 'none';
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
magix_1.default.applyStyle("dr",".dbZ{background:#fa742b;position:absolute;opacity:.6;left:-1000px;top:-1000px;width:30px;height:30px;text-align:center;line-height:30px;color:#fff;border-radius:2px;z-index:5000;pointer-events:none}");
let DEId = magix_1.default.guid('de_');
exports.default = {
    '__K'(html) {
        let n = magix_1.node(DEId);
        if (!n) {
            document.body.insertAdjacentHTML('beforeend', `<div class="dbZ dx" id="${DEId}"/>`);
            n = magix_1.node(DEId);
        }
        n.innerHTML = html;
    },
    '__x'(e) {
        let s = magix_1.node(DEId).style;
        s.left = e.pageX + 10 + 'px';
        s.top = e.pageY + 18 + 'px';
    },
    '__y'() {
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
magix_1.default.applyStyle("ds",".dc_{position:absolute;border:1px dashed #fa742b;display:none;pointer-events:none}");
let SId = magix_1.default.guid('set_');
exports.default = {
    '__cw'() {
        let n = magix_1.node(SId);
        if (!n) {
            document.body.insertAdjacentHTML('beforeend', `<div id="${SId}" class="dc_"></div>`);
        }
    },
    '__K'(left, top, width, height) {
        let ns = magix_1.node(SId).style;
        ns.left = left + 'px';
        ns.top = top + 'px';
        ns.width = width + 'px';
        ns.height = height + 'px';
        ns.display = 'block';
    },
    '__y'() {
        magix_1.node(SId).style.display = 'none';
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
    '__cx': [],
    '__an'(interval, fn) {
        let me = this;
        me['__cx'].push({
            i: interval || 15,
            f: fn,
            n: Now()
        });
        me['__cy']();
    },
    '__ao'(fn) {
        let me = this;
        let q = me['__cx'];
        for (let o, i = 0; i < q.length; i++) {
            o = q[i];
            if (!o.r && o.f == fn) {
                o.r = 1;
                break;
            }
        }
    },
    '__cy'() {
        let me = this;
        if (!me['__cz']) {
            let run = () => {
                let q = me['__cx'];
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
                    cancelRAF(me['__cz']);
                    delete me['__cz'];
                }
                else {
                    me['__cz'] = setRAF(run);
                }
            };
            me['__cz'] = setRAF(run);
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
    '_b': '报表设计器',
    '__H': '提示',
    '_I': '确定',
    '_J': '取消',
    '__ac': '放大',
    '__ad': '缩小',
    '__': '删除辅助线',
    '_a': '按下拖动可移动辅助线',
    '_d': '撤销(Ctrl+Z)',
    '_e': '重做(Ctrl+Y,Ctrl+Shift+Z)',
    '__ae': '按下移动面板',
    '__af': '按下拖动改变面板宽度',
    '__ag': '按下拖动改变面板高度',
    '__ah': '属性',
    '__ai': '数据源',
    '_g': '打开{0}面板',
    '_f': '关闭{0}面板',
    '__aj': '展开{0}面板',
    '__ak': '折叠{0}面板',
    '__al': '类型：',
    '__p': '背景颜色：',
    '__C': '文字颜色：',
    '_c': '删除',
    '__aa': '获取图片尺寸失败，请重试～～',
    '_Z': '清除图片',
    '_a_': '点击选择图片',
    '_ab': '图片库',
    '_G': '清除颜色',
    '__z': '字号：',
    '__q': '背景图片：',
    '__r': '背景平铺：',
    '__s': '拉伸铺满',
    '__t': '原始尺寸',
    '__u': '横向平铺',
    '__v': '垂直平铺',
    '__w': '双向平铺',
    '__l': '锁定编辑：',
    '__n': '最小宽度：',
    '__o': '最小高度：',
    '__i': '列分配：',
    '__j': '外边距：',
    '__k': '内边距：',
    '__y': '高：',
    '__h': '布局',
    '__x': '文本',
    '__m': '页面',
    '_U': '点击添加列',
    '_T': '点击删除列',
    '__A': '透明度：',
    '__B': '字间距：',
    '__F': '内容：',
    '__D': '样式：',
    '__E': '排列：',
    '_Q': '加粗',
    '_R': '斜体',
    '_S': '下划线',
    '_K': '水平居左',
    '_L': '水平居中',
    '_M': '水平居右',
    '_N': '垂直居上',
    '_O': '垂直居中',
    '_P': '垂直居下',
    '__V': '上',
    '__W': '右',
    '__X': '下',
    '__Y': '左'
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
        title: '__ah',
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
        title: '__ai',
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
    '__Z'() {
        for (let p of Panels) {
            if (p.show) {
                this['__cA'](p.id, true);
            }
        }
        magix_1.State.fire('__j');
    },
    '__cA'(id, prevent) {
        let info = PanelsMap[id];
        if (!info.opened) {
            info.opened = 1;
            if (!info.eId) {
                info.eId = magix_1.default.guid('panel_');
                let app = magix_1.node(magix_1.default.config('rootId'));
                app.insertAdjacentHTML('beforeend', `<div id="${info.eId}"></div>`);
                let root = magix_1.Vframe.byNode(app);
                info.close = () => {
                    this['__cB'](info.id);
                };
                root.mountVframe(magix_1.node(info.eId), 'panels/panel', info);
            }
            else {
                magix_1.node(info.eId).style.display = 'block';
            }
            if (!prevent) {
                magix_1.State.fire('__j');
                let vf = magix_1.Vframe.byNode(magix_1.node(info.eId));
                vf.invoke('__x');
            }
        }
    },
    '__cB'(id) {
        let info = PanelsMap[id];
        if (info.opened) {
            info.opened = 0;
            let n = magix_1.node(info.eId);
            n.style.display = 'none';
            magix_1.State.fire('__j');
            let vf = magix_1.Vframe.byNode(n);
            vf.invoke('__y');
        }
    },
    '__aJ'(id) {
        let info = PanelsMap[id];
        if (info.opened) {
            this['__cB'](id);
        }
        else {
            this['__cA'](id);
        }
    },
    '__aI'() {
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
let $_quick_vnode_attr_static_0={'class': 'dcb dk dj',};
let $_quick_vnode_attr_static_1={'class': 'dx dy dz',};
let $_quick_vnode_attr_static_2={'class': 'de dE db',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const cursor_1 = require("../gallery/mx-pointer/cursor");
const index_1 = require("../gallery/mx-dragdrop/index");
magix_1.default.applyStyle("dt",".dca{background:hsla(0,0%,100%,.93);position:absolute;box-shadow:0 2px 4px 0 rgba(0,0,0,.3)}.dcb{font-size:12px;height:18px;line-height:18px;background:#fa742b;color:#fff}.dcc{padding:0 5px;cursor:move;width:calc(100% - 36px)}.dcd{width:16px;height:14px;margin:0 1px;font-size:11px;cursor:pointer;display:inline-flex;justify-content:center;align-items:center;border-radius:2px}.dcd:hover{background:#e64e30}.dce{overflow:hidden;transition:height .25s}.dcf{transition:none}.dcg{width:calc(100% - 2px);overflow:auto;float:left}.dch{width:2px;float:right;cursor:ew-resize}.dci,.dch{background:#fafafa}.dci{height:2px;cursor:ns-resize}.dcj{scroll-behavior:smooth}.dcj::-webkit-scrollbar,.dcj::-webkit-scrollbar-corner{height:2px;width:2px;background:#fafafa}");
let MinWidth = 100;
let ZIndex = 300;
let Panels = [];
let PanelsManager = {
    '__bb'(view) {
        Panels.push(view);
    },
    '__aM'(view) {
        for (let i = Panels.length; i--;) {
            if (Panels[i] == view) {
                Panels.splice(i, 1);
                break;
            }
        }
        this['__cC']();
    },
    '__cC'() {
        for (let i = Panels.length; i--;) {
            Panels[i]['__cD'](ZIndex + i);
        }
    },
    '__cE'(view) {
        if (Panels[Panels.length - 1] != view) {
            for (let i = Panels.length; i--;) {
                if (Panels[i] == view) {
                    Panels.splice(i, 1);
                    break;
                }
            }
            Panels.push(view);
            this['__cC']();
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
    $vnode_4=[$_create(0,1,(icon))];;$vnode_3=[$_create('i',$_quick_vnode_attr_static_1,$vnode_4 )]; $vnode_3.push($_create(0,0,(i18n(title))));;$vnode_2=[$_create('div',{'class': 'dcc dd', 'title': $n(i18n('__ae')), 'mx-mousedown': $_viewId+'__cG()',},$vnode_3 )];   $vnode_4=[$_create(0,0,'')];;$$_class='dx dcd';if(shrink){;$$_class+=' dA';};$vnode_3=[$_create('i',{'mx-click': $_viewId+'__cJ()', 'title': $n(i18n(shrink?'__aj':'__ak',title)), 'class': $$_class,},$vnode_4 )];  $vnode_4=[$_create(0,0,'')];;$vnode_3.push($_create('i',{'class': 'dx dcd', 'mx-click': $_viewId+'__bn()', 'title': $n(i18n('_f',title)),},$vnode_4 )); ;$vnode_2.push($_create('div',$_quick_vnode_attr_static_2,$vnode_3 )); ;$vnode_1=[$_create('div',$_quick_vnode_attr_static_0,$vnode_2 )];  $vnode_2=[];  ;$vnode_2.push($_create('div',{'style': 'width:'+$n(resizeX?'calc(100% - 2px)':'100%'), 'class': 'dcg dl dcj db', 'mx-view': $n(view),})); if(!resizeX){  ;$vnode_3=[$_create('div',{'class': 'dch dk db', 'title': $n(i18n('__af')), 'mx-mousedown': $_viewId+'__cH({w:1})',})]; $vnode_2.push(...$vnode_3); };$vnode_1.push($_create('div',{'class': 'dce', 'id': 'c_'+$n(id), 'style': 'height:'+$n((shrink?0:`calc(100vh - ${height}px)`)),},$vnode_2 ));  ;$$_class='dci dk';if(shrink||!resizeY){;$$_class+=' di';};$vnode_1.push($_create('div',{'title': $n(i18n('__ag')), 'mx-mousedown': $_viewId+'__cH({h:1})', 'class': $$_class,})); ;$$_style='width:'+$n(width)+'px;';if(left===0||left){;$$_style+='left:'+$n(left);}else{;$$_style+='right:'+$n(right);};$$_style+='px;top:'+$n(top)+'px;z-index:'+$n(zIndex)+';';$vnode_0.push($_create('div',{'class': 'dca', 'id': 'p_'+$n(id), 'mx-mousedown': $_viewId+'__cI()', 'style': $$_style,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    init(data) {
        PanelsManager["__bb"](this);
        this.on('destroy', () => {
            PanelsManager["__aM"](this);
        });
        this['__cF'] = data.close;
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
    '__cG<mousedown>'(e) {
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
        this['__w'](e, ex => {
            if (!showedCursor) {
                showedCursor = 1;
                cursor_1.default["__x"](target);
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
            cursor_1.default["__y"]();
        });
    },
    '__cH<mousedown>'(e) {
        let { w: resizeWidth } = e.params;
        let startWidth = this.get('width');
        let startHeight = this.get('height');
        let startRight = this.get('right');
        let cNode = magix_1.node('c_' + this.id);
        cNode.classList.add('dcf');
        let cStyles = cNode.style;
        let pStyles = magix_1.node('p_' + this.id).style;
        let showedCursor = 0;
        let target = e.eventTarget;
        this['__w'](e, ex => {
            if (!showedCursor) {
                showedCursor = 1;
                cursor_1.default["__x"](target);
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
            cursor_1.default["__y"]();
            cNode.classList.remove('dcf');
        });
    },
    '__cD'(z) {
        magix_1.node('p_' + this.id).style.zIndex = z;
    },
    '__cI<mousedown>'() {
        PanelsManager["__cE"](this);
    },
    '__x'() {
        PanelsManager["__cE"](this);
    },
    '__y'() {
    },
    '__cJ<click>'() {
        this.digest({
            shrink: !this.get('shrink')
        });
    },
    '__bn<click>'() {
        let c = this['__cF'];
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
define("panels/props/index",["magix","../../designer/props","../../designer/history","gallery/mx-number/index","gallery/mx-color/index","gallery/mx-layout/column","gallery/mx-layout/guage","gallery/mx-font/style","gallery/mx-font/align","./page"],(require,exports,module)=>{
/*magix_1,props_1,history_1*/
require("gallery/mx-number/index");
require("gallery/mx-color/index");
require("gallery/mx-layout/column");
require("gallery/mx-layout/guage");
require("gallery/mx-font/style");
require("gallery/mx-font/align");
require("./page");
let $_quick_static_node_3;
let $_quick_static_node_5;
let $_quick_static_node_6;
let $_quick_vnode_attr_static_0={'class': 'dck',};
let $_quick_vnode_attr_static_1={'class': 'dcl',};
let $_quick_vnode_attr_static_2={'class': 'dcm',};
let $_quick_vnode_attr_static_4={'class': 'dcr',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const props_1 = require("../../designer/props");
const history_1 = require("../../designer/history");
magix_1.default.applyStyle("du",".dck{padding:4px;min-width:200px}.dcl{line-height:28px;display:flex;align-items:center}.dcm{width:80px;text-align:right}.dcn{height:1px;line-height:1px;margin:5px 0;background:rgba(0,0,0,.2);background:-webkit-gradient(linear,left top,right top,from(rgba(165,69,243,0)),color-stop(.5,rgba(125,118,132,.33)),to(rgba(165,69,243,0)))}.dco{width:140px}.dcp{height:90px}.dcq{align-items:flex-start}.dcr{display:flex;align-items:center;cursor:pointer}.dcs{visibility:hidden;position:absolute}.dct{width:32px;height:16px;position:relative;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;display:inline-block;border-radius:22px;background:#ccc}.dct:before{content:\"\";width:12px;height:12px;position:absolute;left:0;margin:2px;border-radius:50%;background:#fff;transition:all .25s}.dcs:checked+.dct{background:#fa742b}.dcs:checked+.dct:before{left:100%;margin-left:-14px}.dcs:disabled+.dct{background:#e6e6e6;cursor:not-allowed}");
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
if(elements.length==1){ let e=elements[0];; $vnode_2=[];   $vnode_4=[$_create(0,0,(i18n('__al')))];;$vnode_3=[$_create('span',$_quick_vnode_attr_static_2,$vnode_4 )];  $vnode_4=[$_create(0,0,(i18n(e.ctrl.title)))];;$vnode_3.push($_create('span',0,$vnode_4 )); ;$vnode_2.push($_create('li',$_quick_vnode_attr_static_1,$vnode_3 )); for(let $q_key_bskxx=0,$q_a_xaghgoke=e.ctrl.props,$q_c_woaekcvcd=$q_a_xaghgoke.length;$q_key_bskxx<$q_c_woaekcvcd;$q_key_bskxx++){let p=$q_a_xaghgoke[$q_key_bskxx]; $vnode_3=[]; if(p.type==props['__ab']){  if ($_quick_static_node_3) {
                                $vnode_4=[$_quick_static_node_3]; }else{;$vnode_4=[$_quick_static_node_3=$_create('li',{'mxs': 'dz:_', 'class': 'dcn',})]; }$vnode_3.push(...$vnode_4); }else{ $vnode_4=[]; let data=e.props[p.key];;if(!p.ifShow||p.ifShow(e.props)){  $vnode_6=[];  $vnode_7=[$_create(0,0,(i18n(p.tip)))];;$vnode_6.push($_create('span',$_quick_vnode_attr_static_2,$vnode_7 )); if(p.type==props['__a_']){  ;$$_mx_view='gallery/mx-number/index?value='+$i($_ref,data);if(($_temp=p.max)!=null){;$$_mx_view+='&max='+($eu($_temp));};if(($_temp=p.step)!=null){;$$_mx_view+='&step='+($eu($_temp));};if(($_temp=p.fixed)!=null){;$$_mx_view+='&fixed='+($eu($_temp));};if(($_temp=p.min)!=null){;$$_mx_view+='&min='+($eu($_temp));};$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'dco du dh', 'disabled': ($_temp=(e.props.locked))!=null&&$_temp, 'mx-input': $_viewId+'__cL({key:\''+($eq(p.key))+'\',use:\'value\',element:\''+$i($_ref,e)+'\'})', 'mx-view': $$_mx_view,})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__aa']){  ;$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'dco', 'mx-input': $_viewId+'__cL({key:\''+($eq(p.key))+'\',use:\'color\',element:\''+$i($_ref,e)+'\'})', 'mx-view': 'gallery/mx-color/index?clear='+($eu(p.clear))+'&color='+$i($_ref,data)+'&align=right&disabled='+($eu(e.props.locked))+'&alpha='+($eu(p.alpha)),})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__ac']){   ;$vnode_8=[$_create('input',{'class': 'dcs', 'type': 'checkbox', 'checked': (e.props[p.key]), 'mx-change': $_viewId+'__cL({key:\''+($eq(p.key))+'\',bool:1,element:\''+$i($_ref,e)+'\',refresh:\''+$i($_ref,p.refresh)+'\'})',},0,1)];  if ($_quick_static_node_5) {
                                $vnode_8.push($_quick_static_node_5); }else{;$vnode_8.push($_quick_static_node_5=$_create('i',{'mxs': 'dz:a', 'class': 'dct',})); };$vnode_7=[$_create('label',$_quick_vnode_attr_static_4,$vnode_8 )]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__ad']){  ;$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'dco', 'mx-change': $_viewId+'__cL({key:\''+($eq(p.key))+'\',element:\''+$i($_ref,e)+'\'})', 'mx-view': 'gallery/mx-layout/column?columns='+$i($_ref,data)+'&disabled='+$i($_ref,e.props.locked),})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__ae']){  ;$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'dco', 'mx-change': $_viewId+'__cL({key:\''+($eq(p.key))+'\',use:\'value\',element:\''+$i($_ref,e)+'\'})', 'mx-view': 'gallery/mx-layout/guage?guage='+$i($_ref,data)+'&disabled='+$i($_ref,e.props.locked),})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__ah']){  ;$vnode_7=[$_create('textarea',{'class': 'dv dco dcp', 'disabled': (e.props.locked), 'mx-input': $_viewId+'__cL({key:\''+($eq(p.key))+'\',ta:1,element:\''+$i($_ref,e)+'\'})', 'value': $n(data),})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__af']){  ;$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'dco', 'mx-input': $_viewId+'__cL({key:\''+($eq(p.key))+'\',use:\'value\',element:\''+$i($_ref,e)+'\'})', 'mx-view': 'gallery/mx-font/style?disabled='+$i($_ref,e.props.locked)+'&value='+$i($_ref,data),})]; $vnode_6.push(...$vnode_7); }else if(p.type==props['__ag']){  ;$vnode_7=[$_create('div',{'mxv': 'elements', 'class': 'dco', 'mx-input': $_viewId+'__cL({key:\''+($eq(p.key))+'\',use:\'value\',element:\''+$i($_ref,e)+'\'})', 'mx-view': 'gallery/mx-font/align?disabled='+$i($_ref,e.props.locked)+'&value='+$i($_ref,data),})]; $vnode_6.push(...$vnode_7); };$$_class='dcl';if(p.dockTop){;$$_class+=' dcq';};$vnode_5=[$_create('li',{'class': $$_class,},$vnode_6 )]; $vnode_4.push(...$vnode_5); }$vnode_3.push(...$vnode_4); }$vnode_2.push(...$vnode_3); };$vnode_1=[$_create('ul',$_quick_vnode_attr_static_0,$vnode_2 )]; $vnode_0.push(...$vnode_1); }else{  if ($_quick_static_node_6) {
                                $vnode_1=[$_quick_static_node_6]; }else{;$vnode_1=[$_quick_static_node_6=$_create('div',{'mxs': 'dz:b', 'mx-view': 'panels/props/page',})]; }$vnode_0.push(...$vnode_1); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this['__cK'](this.render.bind(this), 100);
        magix_1.State.on('__h', update);
        magix_1.State.on('__k', update);
        magix_1.State.on('___', update);
    },
    render() {
        this.digest({
            scale: magix_1.State.get('__c'),
            props: props_1.default,
            elements: magix_1.State.get('__P')
        });
    },
    '__cL<input,change>'(e) {
        let { key, use, element, refresh, ta, bool } = e.params;
        if (use || bool || ta) {
            let props = element.props;
            let target = e.eventTarget;
            let v = ta ? target.value : (bool ? target.checked : e[use]);
            props[key] = v;
        }
        if (refresh) {
            this.render();
            magix_1.State.fire('__i');
        }
        let n = magix_1.node(element.id);
        let vf = magix_1.Vframe.byNode(n);
        if (vf) {
            vf.invoke('__K', [element]);
        }
        history_1.default["__s"]('___' + key, 500);
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
let $_quick_vnode_attr_static_0={'class': 'dck',};
let $_quick_vnode_attr_static_1={'class': 'dcl',};
let $_quick_vnode_attr_static_2={'class': 'dcm',};
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
 $vnode_1=[];   $vnode_3=[$_create(0,0,(i18n('__al')))];;$vnode_2=[$_create('span',$_quick_vnode_attr_static_2,$vnode_3 )];  $vnode_3=[$_create(0,0,(i18n(ctrl.title)))];;$vnode_2.push($_create('span',0,$vnode_3 )); ;$vnode_1.push($_create('li',$_quick_vnode_attr_static_1,$vnode_2 )); for(let $q_key_ddvukgb=0,$q_a_lynbxiinf=ctrl.props,$q_c_pzezuhgqo=$q_a_lynbxiinf.length;$q_key_ddvukgb<$q_c_pzezuhgqo;$q_key_ddvukgb++){let p=$q_a_lynbxiinf[$q_key_ddvukgb]; $vnode_2=[]; if(p.type==props['__ab']){  if ($_quick_static_node_3) {
                                $vnode_3=[$_quick_static_node_3]; }else{;$vnode_3=[$_quick_static_node_3=$_create('li',{'mxs': 'dA:_', 'class': 'dcn',})]; }$vnode_2.push(...$vnode_3); }else if(!p.ifShow||p.ifShow(page)){  $vnode_4=[];  $vnode_5=[$_create(0,0,(i18n(p.tip)))];;$vnode_4.push($_create('span',$_quick_vnode_attr_static_2,$vnode_5 )); if(p.type==props['__a_']){  ;$$_mx_view='gallery/mx-number/index?value='+$i($_ref,page[p.key]);if(($_temp=p.max)!=null){;$$_mx_view+='&max='+($eu($_temp));};if(($_temp=p.step)!=null){;$$_mx_view+='&step='+($eu($_temp));};if(($_temp=p.fixed)!=null){;$$_mx_view+='&fixed='+($eu($_temp));};if(($_temp=p.min)!=null){;$$_mx_view+='&min='+($eu($_temp));};$vnode_5=[$_create('div',{'mxv': 'page,ctrl', 'class': 'dco du dh', 'mx-input': $_viewId+'__cL({key:\''+($eq(p.key))+'\',use:\'value\'})', 'mx-view': $$_mx_view,})]; $vnode_4.push(...$vnode_5); }else if(p.type==props['__aa']){  ;$$_mx_view='gallery/mx-color/index?clear='+($eu(p.clear))+'&color='+$i($_ref,page[p.key])+'&align=right';if(($_temp=p.alpha)!=null){;$$_mx_view+='&alpha='+($eu($_temp));};$vnode_5=[$_create('div',{'mxv': 'page,ctrl', 'class': 'dco', 'mx-input': $_viewId+'__cL({key:\''+($eq(p.key))+'\',use:\'color\'})', 'mx-view': $$_mx_view,})]; $vnode_4.push(...$vnode_5); }else if(p.type==props['__ai']){  ;$vnode_5=[$_create('div',{'class': 'dco', 'mx-change': $_viewId+'__cL({key:\''+($eq(p.key))+'\',use:\'src\',refresh:\''+$i($_ref,p.refresh)+'\',write:\''+$i($_ref,p.write)+'\'})', 'mx-view': 'gallery/mx-picture/index?src='+($eu(page[p.key])),})]; $vnode_4.push(...$vnode_5); }else if(p.type==props['__aj']){  ;$vnode_5=[$_create('div',{'mxv': 'ctrl', 'class': 'dco', 'mx-change': $_viewId+'__cL({key:\''+($eq(p.key))+'\',use:\'value\'})', 'mx-view': 'gallery/mx-dropdown/index?selected='+($eu(page[p.key]))+'&list='+$i($_ref,p.items)+'&textKey=text&valueKey=value',})]; $vnode_4.push(...$vnode_5); };$$_class='dcl';if(p.dockTop){;$$_class+=' dcq';};$vnode_3=[$_create('li',{'class': $$_class,},$vnode_4 )]; $vnode_2.push(...$vnode_3); }$vnode_1.push(...$vnode_2); };$vnode_0.push($_create('ul',$_quick_vnode_attr_static_0,$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
    },
    render() {
        this.digest({
            props: props_1.default,
            ctrl: magix_1.State.get('__Y'),
            page: magix_1.State.get('__N')
        });
    },
    '__cL<input,change>'(e) {
        let { key, use, refresh, write } = e.params;
        let page = magix_1.State.get('__N');
        page[key] = e[use];
        if (write) {
            write(page, e);
        }
        history_1.default["__s"]('__a', 500);
        magix_1.State.fire('__a');
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
define("elements/designer",["magix","../gallery/mx-dragdrop/index"],(require,exports,module)=>{
/*magix_1,index_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../gallery/mx-dragdrop/index");
magix_1.default.applyStyle("df",".das{pointer-events:none}.dat{display:flex}.dau{position:absolute;left:0;top:0;right:0;bottom:0;background:transparent}.dav,.daw{border:1px solid #fa742b}.daw{border-color:#999}.dax{border:1px dotted #ddd;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.day{border-style:dashed}");
let WatchSelectElements = {};
let CheckStatus = () => {
    for (let p in WatchSelectElements) {
        let vf = magix_1.Vframe.byId(p);
        if (vf) {
            vf.invoke('__aK');
            vf.invoke('render');
        }
    }
};
magix_1.State.on('___', CheckStatus);
magix_1.State.on('__h', CheckStatus);
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	element,
	view,
	id,
	selected,}=$$,
$text,
$$_class; 
$text='';let props=element.props;;$text+=' ';let ctrl=element.ctrl;; ;$$_class='dax';if(props.locked){;$$_class+=' day';};if(ctrl.role=='layout'){;$$_class+=' dat';}else{;$$_class+=' das';};$vnode_0.push($_create('div',{'mxv': 'element', 'mx-view': $n(view)+'?element='+$i($_ref,element)+'&props='+$i($_ref,props), 'id': 'entity_'+$n(id), 'class': $$_class,}));  ;$$_class='dau';if(ctrl.role=='layout'){;$$_class+=' das';};if(selected){;if(props.locked){;$$_class+=' daw';}else{;$$_class+=' dav';};};$vnode_0.push($_create('div',{'class': $$_class,}));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    ctor(data) {
        this.assign(data);
        WatchSelectElements[this.id] = 1;
        this.on('destroy', () => {
            delete WatchSelectElements[this.id];
        });
    },
    '__aK'() {
        let map = magix_1.State.get('__X');
        let elements = magix_1.State.get('__P');
        let count = elements.length;
        let data = this.get();
        let id = data.element.id;
        this.set({
            selected: magix_1.has(map, id),
            count
        });
    },
    assign(data) {
        this.set(data);
        this['__aK']();
        return true;
    },
    render() {
        this.digest();
    },
    '__K'(element) {
        this.digest({
            element
        });
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("elements/index",["magix","./layout/designer","./text/designer","./page/designer"],(require,exports,module)=>{
/*magix_1,designer_1,designer_2,designer_3*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const designer_1 = require("./layout/designer");
const designer_2 = require("./text/designer");
const designer_3 = require("./page/designer");
let Elements = [designer_1.default, designer_2.default];
let ElementsMap = magix_1.toMap(Elements, 'type');
let Groups = [designer_1.default, { spliter: 1 }, designer_2.default, {
        icon: '&#xe629;',
        title: '图表',
        subs: [designer_2.default, designer_2.default, designer_2.default, designer_2.default, designer_2.default, designer_2.default, designer_2.default, designer_2.default]
    }];
exports.default = {
    '__J'() {
        return Groups;
    },
    '__V'() {
        return designer_3.default;
    },
    '__W'(elements) {
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
define("elements/layout/designer",["../designer","../../designer/props"],(require,exports,module)=>{
/*designer_1,props_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const designer_1 = require("../designer");
const props_1 = require("../../designer/props");
exports.default = designer_1.default.extend({
    ctor() {
        this.set({
            view: 'elements/layout/index'
        });
    }
}, {
    type: 'layout',
    role: 'layout',
    title: '__h',
    icon: '&#xe764;',
    getProps() {
        return {
            columns: [{
                    width: 1,
                    elements: []
                }],
            margin: '5px 5px 5px 5px',
            padding: '5px 5px 5px 5px',
            locked: false
        };
    },
    props: [{
            tip: '__i',
            key: 'columns',
            dockTop: true,
            type: props_1.default["__ad"]
        }, {
            tip: '__j',
            key: 'margin',
            dockTop: true,
            type: props_1.default["__ae"]
        }, {
            tip: '__k',
            key: 'padding',
            dockTop: true,
            type: props_1.default["__ae"]
        }, {
            type: props_1.default["__ab"]
        }, {
            tip: '__l',
            key: 'locked',
            type: props_1.default["__ac"],
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
define("elements/layout/index",["magix","../../designer/stage-elements","../../gallery/mx-dragdrop/index"],(require,exports,module)=>{
/*magix_1,stage_elements_1,index_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const stage_elements_1 = require("../../designer/stage-elements");
const index_1 = require("../../gallery/mx-dragdrop/index");
magix_1.default.applyStyle("dg",".daz{display:flex;width:100%;min-height:40px}.daA{flex-shrink:1;overflow:hidden;border:1px dashed #ccc}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	props,
	element,}=$$,
$vnode_1,
$vnode_2,
$vnode_3,
$vnode_4; 
 $vnode_1=[]; for(let index=0,$q_a_wcnoecawvo=props.columns,$q_c_lzovxhi=$q_a_wcnoecawvo.length;index<$q_c_lzovxhi;index++){let col=$q_a_wcnoecawvo[index];  $vnode_3=[]; for(let $q_key_ozsimr=0,$q_a_zqfbtwgecd=col.elements,$q_c_vdilgqq=$q_a_zqfbtwgecd.length;$q_key_ozsimr<$q_c_vdilgqq;$q_key_ozsimr++){let e=$q_a_zqfbtwgecd[$q_key_ozsimr];  ;$vnode_4=[$_create('div',{'mxv': 'props', 'class': 'dh', 'id': $n(e.id), 'eid': $n(e.id), 'mx-view': 'elements/'+$n(e.ctrl.role)+'/designer?element='+$i($_ref,e), 'mx-mousedown': $_viewId+'__aB({element:\''+$i($_ref,e)+'\'})', 'role': $n(e.ctrl.role),})]; $vnode_3.push(...$vnode_4); };$vnode_2=[$_create('div',{'style': 'flex-basis:'+$n(col.width*100)+'%;', 'class': 'daA', 'role': 'column', 'index': $n(index), 'pid': $n(element.id),},$vnode_3 )]; $vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',{'style': 'margin:'+$n(props.margin)+';padding:'+$n(props.padding)+';', 'class': 'daz',},$vnode_1 ));  
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
    '__aB<mousedown>'(e) {
        if (e.from != 'layout') {
            e.from = 'layout';
            stage_elements_1.default["__ay"](e, this);
        }
    }
});

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
    title: '__m',
    getProps() {
        return {
            width: 900,
            height: 500,
            background: '#ffffff',
            backgroundImage: '',
            backgroundRepeat: 'full',
            backgroundWidth: 0,
            backgroundHeight: 0
        };
    },
    props: [{
            tip: '__n',
            key: 'width',
            type: props_1.default["__a_"],
            min: 0
        }, {
            tip: '__o',
            key: 'height',
            type: props_1.default["__a_"],
            min: 0
        }, {
            type: props_1.default["__ab"]
        }, {
            tip: '__p',
            key: 'background',
            type: props_1.default["__aa"]
        }, {
            tip: '__q',
            dockTop: true,
            key: 'backgroundImage',
            type: props_1.default["__ai"],
            refresh: true,
            write(page, e) {
                page.backgroundWidth = e.width;
                page.backgroundHeight = e.height;
            }
        }, {
            tip: '__r',
            key: 'backgroundRepeat',
            type: props_1.default["__aj"],
            items: [{
                    text: index_1.default('__s'),
                    value: 'full'
                }, {
                    text: index_1.default('__t'),
                    value: 'no-repeat'
                }, {
                    text: index_1.default('__u'),
                    value: 'repeat-x'
                }, {
                    text: index_1.default('__v'),
                    value: 'repeat-y'
                }, {
                    text: index_1.default('__w'),
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
define("elements/text/designer",["../designer","../../designer/props"],(require,exports,module)=>{
/*designer_1,props_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const designer_1 = require("../designer");
const props_1 = require("../../designer/props");
exports.default = designer_1.default.extend({
    ctor() {
        this.set({
            view: 'elements/text/index'
        });
    }
}, {
    type: 'text',
    role: 'text',
    title: '__x',
    icon: '&#xe6bc;',
    getProps() {
        return {
            background: '',
            height: 50,
            alpha: 1,
            text: '',
            ls: 0,
            forecolor: '#000000',
            fontsize: 14,
            locked: false,
            style: {
                bold: false,
                underline: false,
                italic: false
            },
            margin: '0 0 0 0',
            padding: '0 0 0 0',
            align: {
                h: 'flex-start',
                v: 'flex-start'
            }
        };
    },
    props: [{
            tip: '__y',
            key: 'height',
            type: props_1.default["__a_"],
            min: 0
        }, {
            tip: '__z',
            key: 'fontsize',
            type: props_1.default["__a_"],
            min: 0
        }, {
            tip: '__A',
            key: 'alpha',
            type: props_1.default["__a_"],
            step: 0.1,
            fixed: 1,
            min: 0,
            max: 1
        }, {
            tip: '__B',
            key: 'ls',
            type: props_1.default["__a_"],
            min: 0
        }, {
            tip: '__p',
            key: 'background',
            clear: true,
            alpha: true,
            type: props_1.default["__aa"]
        }, {
            tip: '__C',
            key: 'forecolor',
            type: props_1.default["__aa"]
        }, {
            tip: '__D',
            key: 'style',
            type: props_1.default["__af"]
        }, {
            tip: '__E',
            key: 'align',
            type: props_1.default["__ag"]
        }, {
            tip: '__F',
            key: 'text',
            type: props_1.default["__ah"],
            dockTop: true
        }, {
            type: props_1.default["__ab"]
        }, {
            tip: '__j',
            key: 'margin',
            dockTop: true,
            type: props_1.default["__ae"]
        }, {
            tip: '__k',
            key: 'padding',
            dockTop: true,
            type: props_1.default["__ae"]
        }, {
            type: props_1.default["__ab"]
        }, {
            tip: '__l',
            key: 'locked',
            type: props_1.default["__ac"],
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
	props,}=$$,
$$_style,
$vnode_1,
$text; 
 $text='';if(props.text){;$text+=' '+(props.text)+' ';}else{;$text+=' 请输入文字 ';};$vnode_1=[$_create(0,0,$text)];;$$_style='display:flex;color:'+$n(props.forecolor)+';';if(props.background){;$$_style+='background:'+$n(props.background)+';';};$$_style+='font-size:'+$n(props.fontsize)+'px;height:'+$n(props.height)+'px;letter-spacing:'+$n(props.ls)+'px;opacity:'+$n(props.alpha)+';margin:'+$n(props.margin)+';padding:'+$n(props.padding)+';';if(props.style.bold){;$$_style+='font-weight:bold;';};if(props.style.italic){;$$_style+='font-style:italic;';};if(props.style.underline){;$$_style+='text-decoration:underline;';};$$_style+=';align-items:'+$n(props.align.v)+';justify-content:'+$n(props.align.h)+';overflow:hidden;';$vnode_0.push($_create('div',{'style': $$_style,},$vnode_1 ));  
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
let $_quick_vnode_attr_static_0={'class': 'dU',};
let $_quick_vnode_attr_static_1={'class': 'dS',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../gallery/mx-dragdrop/index");
const cursor_1 = require("../gallery/mx-pointer/cursor");
const history_1 = require("./history");
magix_1.default.applyStyle("da",".dG{height:20px;border-bottom:1px solid #ccc;overflow:hidden;width:100%;background:#fff;z-index:200;position:relative}.dH{top:0;width:1px}.dH,.dI{position:absolute;background:#fa742b;z-index:200;display:none;pointer-events:none}.dI{left:0;height:1px}.dJ{float:left;overflow:hidden;z-index:200;position:relative}.dK,.dJ{width:20px;border-right:1px solid #ccc;background:#fff}.dK{position:absolute;left:0;top:0;height:20px;border-bottom:1px solid #ccc;z-index:201}.dL{left:5px;top:22px}.dL,.dM{cursor:default;position:absolute;font-size:10px}.dM{top:2px;left:24px}.dN,.dO{position:relative;z-index:100}.dN{top:20px}.dO{left:20px}.dP{width:4px;border-left:1px solid #fa742b}.dP,.dQ{position:absolute;pointer-events:none}.dQ{height:1px;background:#fa742b}.dR{position:absolute;left:-15px;top:4px;font-size:10px;color:#666;cursor:pointer;pointer-events:all}.dS{top:2px;cursor:default}.dS,.dT{position:absolute;left:4px;font-size:10px;color:#666}.dT{top:-15px;cursor:pointer;pointer-events:all}.dU{position:absolute;left:4px;top:2px;font-size:10px;color:#666;cursor:default}.dV{width:25px;top:-1px;height:3px;left:30px;cursor:ns-resize}.dW,.dV{position:absolute;overflow:hidden;background:#fa742b;pointer-events:all}.dW{width:3px;left:-2px;height:25px;top:20px;cursor:ew-resize}");
let ScalesMap = {
    '1': {
        space: 100,
        step: 10
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
let temp,current; $vnode_1=[]; for(let $q_key_pmruet=0,$q_a_dthabivik=yHelpers,$q_c_wfzskjug=$q_a_dthabivik.length;$q_key_pmruet<$q_c_wfzskjug;$q_key_pmruet++){let yHelp=$q_a_dthabivik[$q_key_pmruet]; current=Math.abs(yStart)+yHelp.mm*scale+20;  $vnode_4=[$_create(0,0,'')];;$vnode_3=[$_create('i',{'class': 'dx dT', 'title': $n(i18n('__')), 'mx-click': $_viewId+'__v({type:\'y\',id:\''+($eq(yHelp.id))+'\'})',},$vnode_4 )];  $vnode_4=[$_create(0,0,(yHelp.mm))];;$vnode_3.push($_create('span',$_quick_vnode_attr_static_0,$vnode_4 ));  ;$vnode_3.push($_create('span',{'class': 'dV', 'mx-mousedown': $_viewId+'__z({type:\'y\',id:\''+($eq(yHelp.id))+'\',c:'+$n(current)+'})', 'title': $n(i18n('_a')),})); ;$vnode_2=[$_create('div',{'class': 'dQ', 'style': 'width:'+$n(vWidth)+'px;top:'+$n(current)+'px;',},$vnode_3 )]; $vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',{'class': 'dO', 'style': 'top:-'+$n(sTop)+'px', 'id': $n(id)+'_y_help', 'mx-contextmenu': $_viewId+'__A()',},$vnode_1 ));  $vnode_1=[]; for(let $q_key_nypnbuvg=0,$q_a_zijhzbd=xHelpers,$q_c_qcxhnui=$q_a_zijhzbd.length;$q_key_nypnbuvg<$q_c_qcxhnui;$q_key_nypnbuvg++){let xHelp=$q_a_zijhzbd[$q_key_nypnbuvg]; current=Math.abs(xStart)+xHelp.mm*scale;  $vnode_4=[$_create(0,0,'')];;$vnode_3=[$_create('i',{'class': 'dx dR', 'title': $n(i18n('__')), 'mx-click': $_viewId+'__v({type:\'x\',id:\''+($eq(xHelp.id))+'\'})',},$vnode_4 )];  $vnode_4=[$_create(0,0,(xHelp.mm))];;$vnode_3.push($_create('span',$_quick_vnode_attr_static_1,$vnode_4 ));  ;$vnode_3.push($_create('span',{'class': 'dW', 'mx-mousedown': $_viewId+'__z({type:\'x\',id:\''+($eq(xHelp.id))+'\',c:'+$n(current)+'})', 'title': $n(i18n('_a')),})); ;$vnode_2=[$_create('div',{'class': 'dP', 'style': 'height:'+$n(vHeight)+'px;left:'+$n(current)+'px;',},$vnode_3 )]; $vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',{'class': 'dN', 'style': 'left:-'+$n(sLeft)+'px', 'id': $n(id)+'_x_help', 'mx-contextmenu': $_viewId+'__A()',},$vnode_1 ));     $vnode_4=[]; for(let i=0;i<xStart;i+=step){ $vnode_5=[]; if(i){ $vnode_6=[]; temp=i/scale;if(temp%space===0){  ;$vnode_7=[$_create('rect',{'width': '1', 'height': $n(hbar), 'x': $n(xStart-i), 'y': $n(20-hbar-1), 'style': 'fill:'+$n(barColor)+';',},0,1)];  $vnode_8=[$_create(0,0,(-temp))];;$vnode_7.push($_create('text',{'x': $n(xStart-i+2), 'y': '14', 'style': 'font-size:10px;fill:#999;',},$vnode_8 )); $vnode_6.push(...$vnode_7); }else{  ;$vnode_7=[$_create('rect',{'width': '1', 'height': $n(bar), 'x': $n(xStart-i), 'y': $n(20-bar-1), 'style': 'fill:'+$n(barColor)+';',},0,1)]; $vnode_6.push(...$vnode_7); }$vnode_5.push(...$vnode_6); }$vnode_4.push(...$vnode_5); }for(let i=0;i<xEnd;i+=step){ $vnode_5=[]; temp=i/scale;if(temp%space===0){  ;$vnode_6=[$_create('rect',{'width': '1', 'height': $n(hbar), 'x': $n(xStart+i), 'y': $n(20-hbar-1), 'style': 'fill:'+$n(barColor)+';',},0,1)];  $vnode_7=[$_create(0,0,(temp))];;$vnode_6.push($_create('text',{'x': $n(xStart+i+2), 'y': '14', 'style': 'font-size:10px;fill:#999;',},$vnode_7 )); $vnode_5.push(...$vnode_6); }else{  ;$vnode_6=[$_create('rect',{'width': '1', 'height': $n(bar), 'x': $n(xStart+i), 'y': $n(20-bar-1), 'style': 'fill:'+$n(barColor)+';',},0,1)]; $vnode_5.push(...$vnode_6); }$vnode_4.push(...$vnode_5); };$vnode_3=[$_create('svg',{'xmlns': 'http://www.w3.org/2000/svg', 'viewBox': '0 0 '+$n(width)+' 19', 'style': 'cursor:default;',},$vnode_4 )]; ;$vnode_2=[$_create('div',{'style': 'width:'+$n(width)+'px;height:100%',},$vnode_3 )]; ;$vnode_1=[$_create('div',{'class': 'dG', 'id': $n(id)+'_x',},$vnode_2 )];   $vnode_3=[$_create(0,0,'-')];;$vnode_2=[$_create('span',{'class': 'dL', 'id': $n(id)+'_x_tip',},$vnode_3 )]; ;$vnode_1.push($_create('div',{'class': 'dH', 'id': $n(id)+'_x_line', 'style': 'height:'+$n(vHeight+20)+'px',},$vnode_2 )); ;$vnode_0.push($_create('div',{'mx-mousemove': $_viewId+'__o()', 'mx-mouseout': $_viewId+'__p()', 'mx-click': $_viewId+'__t()',},$vnode_1 ));     $vnode_4=[]; for(let i=0;i<yStart;i+=step){ $vnode_5=[]; if(i){ $vnode_6=[]; temp=i/scale;if(temp%space===0){  ;$vnode_7=[$_create('rect',{'width': $n(hbar), 'height': '1', 'x': $n(20-hbar), 'y': $n(yStart-i), 'style': 'fill:'+$n(barColor)+';',},0,1)];  $vnode_8=[$_create(0,0,(-temp))];;$vnode_7.push($_create('text',{'x': '14', 'y': $n(yStart-i+2), 'style': 'font-size:10px;fill:#999;', 'transform': 'rotate(-90,13,'+$n(yStart-i)+')',},$vnode_8 )); $vnode_6.push(...$vnode_7); }else{  ;$vnode_7=[$_create('rect',{'width': $n(bar), 'height': '1', 'x': $n(20-bar), 'y': $n(yStart-i), 'style': 'fill:'+$n(barColor)+';',},0,1)]; $vnode_6.push(...$vnode_7); }$vnode_5.push(...$vnode_6); }$vnode_4.push(...$vnode_5); }for(let i=0;i<yEnd;i+=step){ $vnode_5=[]; temp=i/scale;if(temp%space===0){  ;$vnode_6=[$_create('rect',{'width': $n(hbar), 'height': '1', 'x': $n(20-hbar), 'y': $n(yStart+i), 'style': 'fill:'+$n(barColor)+';',},0,1)];  $vnode_7=[$_create(0,0,(temp))];;$vnode_6.push($_create('text',{'x': '14', 'y': $n(yStart+i), 'style': 'font-size:10px;fill:#999;;', 'transform': 'rotate(-90,13,'+$n(yStart+i-2)+')',},$vnode_7 )); $vnode_5.push(...$vnode_6); }else{  ;$vnode_6=[$_create('rect',{'width': $n(bar), 'height': '1', 'x': $n(20-bar), 'y': $n(yStart+i), 'style': 'fill:'+$n(barColor)+';',},0,1)]; $vnode_5.push(...$vnode_6); }$vnode_4.push(...$vnode_5); };$vnode_3=[$_create('svg',{'xmlns': 'http://www.w3.org/2000/svg', 'viewBox': '0 0 19 '+$n(height), 'style': 'cursor:default',},$vnode_4 )]; ;$vnode_2=[$_create('div',{'style': 'height:'+$n(height)+'px;',},$vnode_3 )]; ;$vnode_1=[$_create('div',{'class': 'dJ', 'style': 'height:'+$n(vHeight)+'px;', 'id': $n(id)+'_y',},$vnode_2 )];   $vnode_3=[$_create(0,0,'-')];;$vnode_2=[$_create('span',{'class': 'dM', 'id': $n(id)+'_y_tip',},$vnode_3 )]; ;$vnode_1.push($_create('div',{'class': 'dI', 'id': $n(id)+'_y_line', 'style': 'width:'+$n(vWidth+20)+'px',},$vnode_2 )); ;$vnode_0.push($_create('div',{'mx-mousemove': $_viewId+'__q()', 'mx-mouseout': $_viewId+'__r()', 'mx-click': $_viewId+'__u()',},$vnode_1 ));  if ($_quick_static_node_2) {
                                $vnode_0.push($_quick_static_node_2); }else{;$vnode_0.push($_quick_static_node_2=$_create('div',{'mxs': 'd_:_', 'class': 'dK',})); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    init(data) {
        let n = magix_1.node(data.scroll);
        n.addEventListener('scroll', (e) => {
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
    '__l'() {
        if (this['__b']) {
            let n = this['__a'];
            let sa = magix_1.State.get('__c');
            let width = Math.max(n.scrollWidth, window.innerWidth) + 500;
            let height = Math.max(n.scrollHeight, window.innerHeight) + 300;
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
            yStart = Math.round(offset.top - outerOffset.top);
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
                this['__d'] = magix_1.node(this.id + '_x');
                this['__e'] = magix_1.node(this.id + '_y');
                this['__f'] = magix_1.node(this.id + '_x_line');
                this['__g'] = magix_1.node(this.id + '_y_line');
                this['__h'] = magix_1.node(this.id + '_x_tip');
                this['__i'] = magix_1.node(this.id + '_y_tip');
                this['__j'] = magix_1.node(this.id + '_x_help');
                this['__k'] = magix_1.node(this.id + '_y_help');
            });
        }
    },
    '___'() {
        let xNode = this['__d'];
        let yNode = this['__e'];
        let yHelpNode = this['__k'];
        let xHelpNode = this['__j'];
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
            xHelpers: magix_1.State.get('__m'),
            yHelpers: magix_1.State.get('__n')
        });
        let test = () => {
            let n = magix_1.node('stage_canvas');
            if (n) {
                this['__b'] = 1;
                this['__l']();
            }
            else {
                setTimeout(test, 30);
            }
        };
        setTimeout(test, 30);
    },
    '__o<mousemove>'(e) {
        let xNode = this['__d'];
        let v = e.pageX;
        let start = this.get('xStart');
        let styles = this['__f'].style;
        styles.display = 'block';
        styles.left = v + 'px';
        let mm = v - start + xNode.scrollLeft;
        let scale = this.get('scale');
        this['__h'].innerHTML = (mm / scale).toFixed(0);
    },
    '__p<mouseout>'(e) {
        if (!magix_1.default.inside(e.relatedTarget, e.eventTarget)) {
            this['__f'].style.display = 'none';
        }
    },
    '__q<mousemove>'(e) {
        let sTop = this.root.getBoundingClientRect();
        let v = e.pageY - sTop.top;
        let start = this.get('yStart');
        let yNode = this['__e'];
        let styles = this['__g'].style;
        styles.display = 'block';
        styles.top = v + 'px';
        let mm = v - start - 20 + yNode.scrollTop;
        let scale = this.get('scale');
        this['__i'].innerHTML = (mm / scale).toFixed(0);
    },
    '__r<mouseout>'(e) {
        if (!magix_1.default.inside(e.relatedTarget, e.eventTarget)) {
            this['__g'].style.display = 'none';
        }
    },
    '__t<click>'(e) {
        let v = e.pageX;
        let start = this.get('xStart');
        let xNode = this['__d'];
        let mm = ((v - start + xNode.scrollLeft) / this.get('scale')) | 0;
        let xHelpers = this.get('xHelpers');
        xHelpers.push({
            mm,
            id: magix_1.default.guid('x_')
        });
        this.digest({
            xHelpers
        });
        history_1.default["__s"]();
    },
    '__u<click>'(e) {
        let offset = this.root.getBoundingClientRect();
        let v = e.pageY - offset.top;
        let start = this.get('yStart');
        let yNode = this['__e'];
        let mm = ((v - start - 20 + yNode.scrollTop) / this.get('scale')) | 0;
        let yHelpers = this.get('yHelpers');
        yHelpers.push({
            mm,
            id: magix_1.default.guid('x_')
        });
        this.digest({
            yHelpers
        });
        history_1.default["__s"]();
    },
    '__v<click>'(e) {
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
        history_1.default["__s"]();
    },
    '__z<mousedown>'(e) {
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
            this['__w'](e, (evt) => {
                if (!showedCursor) {
                    showedCursor = 1;
                    cursor_1.default["__x"](e.eventTarget);
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
                    cursor_1.default["__y"]();
                    history_1.default["__s"]();
                }
            });
        }
    },
    '__A<contextmenu>'(e) {
        e.preventDefault();
    },
    '$win<resize>'() {
        this['__l']();
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
    '__B': 50,
    '__c': 1,
    '__C': 5,
    '__D': 150,
    '__E': 50,
    '__F': 20,
    '__G': 12,
    '__H': 5,
    '__I': 10
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/header",["magix","../elements/index","../gallery/mx-dragdrop/index","../gallery/mx-pointer/follower"],(require,exports,module)=>{
/*magix_1,index_1,index_2,follower_1*/
let $_quick_static_node_1;
let $_quick_static_node_3;
let $_quick_static_node_6;
let $_quick_static_node_9;
let $_quick_vnode_attr_static_0={'class': 'dE dd',};
let $_quick_vnode_attr_static_2={'class': 'dE dd dC dk',};
let $_quick_vnode_attr_static_4={'class': 'dX dZ dh',};
let $_quick_vnode_attr_static_5={'class': 'dx daa',};
let $_quick_vnode_attr_static_7={'class': 'da_',};
let $_quick_vnode_attr_static_8={'class': 'dab',};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
const index_1 = require("../elements/index");
const index_2 = require("../gallery/mx-dragdrop/index");
const follower_1 = require("../gallery/mx-pointer/follower");
magix_1.default.applyStyle("db",".dX,.dY{width:60px;height:40px;display:grid;grid-template-rows:20px 20px;justify-items:center;align-items:center;cursor:pointer;margin:0 2px}.dZ{grid-template-columns:50px 10px}.dY{float:left;border-radius:2px}.dY:hover{background:#bd361b}.da_{display:none;position:absolute;cursor:default;top:100%;left:0;width:264px;padding:4px}.da_,.dX:hover{background:#e64e30}.dX:hover .da_{display:block}.daa{grid-column:1/2;grid-row:1/2;align-self:flex-end}.dab{font-size:12px;font-weight:400;line-height:12px;grid-column:1/2;grid-row:2/3}.dac{font-size:10px;margin-left:-10px;grid-row:1/3;grid-column:2/3}.dad{height:30px;width:1px;background:-webkit-gradient(linear,left top,left bottom,from(hsla(0,0%,100%,.27)),color-stop(.3,#fff),color-stop(.7,#fff),to(hsla(0,0%,100%,.27)));margin:2px 12px;float:left}");
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
                                $vnode_1=[$_quick_static_node_1]; }else{$vnode_2=[$_create(0,0,'')];;$vnode_1=[$_quick_static_node_1=$_create('i',{'mxs': 'da:_', 'class': 'dx da',},$vnode_2 )]; }$vnode_1.push($_create(0,0,(i18n('_b'))+'™'));;$vnode_0.push($_create('div',$_quick_vnode_attr_static_0,$vnode_1 ));  $vnode_1=[]; for(let $q_key_xiwuldn=0,$q_a_zhg=elements,$q_c_frxtaagd=$q_a_zhg.length;$q_key_xiwuldn<$q_c_frxtaagd;$q_key_xiwuldn++){let e=$q_a_zhg[$q_key_xiwuldn]; $vnode_2=[]; if(e.spliter){  if ($_quick_static_node_3) {
                                $vnode_3=[$_quick_static_node_3]; }else{;$vnode_3=[$_quick_static_node_3=$_create('div',{'mxs': 'da:a', 'class': 'dad',})]; }$vnode_2.push(...$vnode_3); }else{ $vnode_3=[]; if(e.subs){   $vnode_6=[$_create(0,1,(e.icon))];;$vnode_5=[$_create('i',$_quick_vnode_attr_static_5,$vnode_6 )];  $vnode_6=[$_create(0,0,(i18n(e.title)))];;$vnode_5.push($_create('b',{'class': 'dab', 'title': $n(i18n(e.title)),},$vnode_6 ));  if ($_quick_static_node_6) {
                                $vnode_5.push($_quick_static_node_6); }else{$vnode_6=[$_create(0,0,'')];;$vnode_5.push($_quick_static_node_6=$_create('i',{'mxs': 'da:b', 'class': 'dac dx',},$vnode_6 )); } $vnode_6=[]; for(let $q_key_jmskudeml=0,$q_a_kfldllfxm=e.subs,$q_c_qtxhvojwf=$q_a_kfldllfxm.length;$q_key_jmskudeml<$q_c_qtxhvojwf;$q_key_jmskudeml++){let es=$q_a_kfldllfxm[$q_key_jmskudeml];   $vnode_9=[$_create(0,1,(es.icon))];;$vnode_8=[$_create('i',$_quick_vnode_attr_static_5,$vnode_9 )];  $vnode_9=[$_create(0,0,(i18n(es.title)))];;$vnode_8.push($_create('b',$_quick_vnode_attr_static_8,$vnode_9 )); ;$vnode_7=[$_create('div',{'class': 'dY', 'mx-mousedown': $_viewId+'__M({ctrl:\''+$i($_ref,es)+'\'})', 'title': $n(i18n(es.title)),},$vnode_8 )]; $vnode_6.push(...$vnode_7); };$vnode_5.push($_create('div',$_quick_vnode_attr_static_7,$vnode_6 )); ;$vnode_4=[$_create('div',$_quick_vnode_attr_static_4,$vnode_5 )]; $vnode_3.push(...$vnode_4); }else{   $vnode_6=[$_create(0,1,(e.icon))];;$vnode_5=[$_create('i',$_quick_vnode_attr_static_5,$vnode_6 )];  $vnode_6=[$_create(0,0,(i18n(e.title)))];;$vnode_5.push($_create('b',$_quick_vnode_attr_static_8,$vnode_6 )); ;$vnode_4=[$_create('div',{'class': 'dX dh', 'mx-mousedown': $_viewId+'__M({ctrl:\''+$i($_ref,e)+'\'})', 'title': $n(i18n(e.title)),},$vnode_5 )]; $vnode_3.push(...$vnode_4); }$vnode_2.push(...$vnode_3); }$vnode_1.push(...$vnode_2); };$vnode_0.push($_create('div',$_quick_vnode_attr_static_2,$vnode_1 ));  if ($_quick_static_node_9) {
                                $vnode_0.push($_quick_static_node_9); }else{  $vnode_3=[$_create(0,0,'')];;$vnode_2=[$_create('i',{'class': 'dx',},$vnode_3 )];  $vnode_3=[$_create(0,0,'保存')];;$vnode_2.push($_create('b',$_quick_vnode_attr_static_8,$vnode_3 )); ;$vnode_1=[$_create('div',{'class': 'dX',},$vnode_2 )]; ;$vnode_0.push($_quick_static_node_9=$_create('div',{'mxs': 'da:c', 'class': 'dE de dD dk',},$vnode_1 )); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_2.default],
    render() {
        this.digest({
            elements: index_1.default["__J"]()
        });
    },
    '__M<mousedown>'(e) {
        let { ctrl } = e.params, moved = 0;
        follower_1.default["__K"](ctrl.icon);
        magix_1.State.set({
            '__L': ctrl
        });
        this['__w'](e, ex => {
            if (moved) {
                follower_1.default["__x"](ex);
                magix_1.State.fire('__c', {
                    pageX: ex.pageX,
                    pageY: ex.pageY,
                    clientX: ex.clientX,
                    clientY: ex.clientY
                });
            }
            moved = 1;
        }, (ex) => {
            follower_1.default["__y"]();
            if (moved) {
                if (ex) {
                    magix_1.State.fire('__d');
                }
            }
            else {
                magix_1.State.fire('__e');
            }
            magix_1.State.set({
                '__L': null
            });
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
        page: magix_1.State.get('__N'),
        scale: magix_1.State.get('__c'),
        layouts: magix_1.State.get('__O'),
        select: magix_1.State.get('__P'),
        xLines: magix_1.State.get('__m'),
        yLines: magix_1.State.get('__n')
    });
};
let UpdateStage = jsonStr => {
    let json = JSON.parse(jsonStr);
    let c = magix_1.State.get('__c');
    let s = json.scale || c;
    magix_1.State.fire('__f', {
        json
    });
    magix_1.State.fire('___', {
        scale: c !== s
    });
};
exports.default = {
    '__Q'() {
        if (!DefaultStage) {
            DefaultStage = GetSnapshot();
        }
    },
    '__R'() {
        return {
            canRedo: RedoList.length,
            canUndo: UndoList.length
        };
    },
    '__S'() {
        UndoList.length = 0;
        RedoList.length = 0;
    },
    '__T'() {
        let c = UndoList.length;
        //当有历史记录时我们才进行还原操作
        if (c > 0) {
            let last = UndoList.pop();
            RedoList.push(last);
            let current = UndoList[UndoList.length - 1] || DefaultStage;
            UpdateStage(current);
        }
    },
    '__U'() {
        let current = RedoList.pop();
        if (current) {
            UndoList.push(current);
            UpdateStage(current);
        }
    },
    '__s'(type = '_save', waiting = 0) {
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
            if (UndoList.length > const_1.default["__B"]) {
                DefaultStage = UndoList.shift();
            }
            magix_1.State.fire('__g');
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
let PageCtrl = index_1.default["__V"]();
magix_1.default.applyStyle("dc",".dae{background:#fa742b;height:40px;line-height:40px;font-size:16px;padding:0 10px;color:#fff;z-index:202}.dae,.daf{position:relative}.daf{padding:0 26px;background:#fafafa;color:#333;height:26px;z-index:201;border-bottom:1px solid #eee}.dag{width:calc(100% - 20px);overflow:scroll;height:calc(100% - 85px);background-color:#edeef3;transition:all .3s;margin-left:20px}.dah{scroll-behavior:smooth}.dai{box-shadow:inset 1px 1px 6px 2px #dadada}");
let ApplyState = (json) => {
    let page = magix_1.State.get('__N');
    let layouts = magix_1.State.get('__O');
    let select = magix_1.State.get('__P');
    let xLines = magix_1.State.get('__m');
    let yLines = magix_1.State.get('__n');
    let { elements, map } = index_1.default["__W"](json.layouts);
    layouts.length = 0;
    layouts.push(...elements);
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
        '__X': sMap
    });
};
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	id,}=$$; 
 if ($_quick_static_node_0) {
                                $vnode_0.push($_quick_static_node_0); }else{;$vnode_0.push($_quick_static_node_0=$_create('div',{'mxs': 'db:_', 'mx-view': 'designer/header', 'class': 'dae',})); } if ($_quick_static_node_1) {
                                $vnode_0.push($_quick_static_node_1); }else{;$vnode_0.push($_quick_static_node_1=$_create('div',{'mxs': 'db:a', 'mx-view': 'designer/toolbar', 'class': 'daf dk',})); } ;$vnode_0.push($_create('div',{'mx-view': 'designer/axis?scroll=s_'+($eu(id)), 'class': 'dk dh',}));  ;$vnode_0.push($_create('div',{'mx-view': 'designer/stage', 'id': 's_'+$n(id), 'class': 'dag dl dai',}));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_2.default],
    init() {
        magix_1.State.on('__f', (e) => {
            ApplyState(e.json);
        });
        magix_1.State.set({
            '__Y': PageCtrl,
            '__N': PageCtrl.getProps(),
            '__c': const_1.default["__c"],
            '__O': [],
            '__P': [],
            '__X': {},
            '__m': [],
            '__n': []
        });
        history_1.default["__Q"]();
    },
    render() {
        this.digest(null, null, () => {
            index_3.default["__Z"]();
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
    DELETE: 8,
    TAB: 9,
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
    '__a_': 2 << 0,
    '__aa': 2 << 1,
    '__ab': 2 << 2,
    '__ac': 2 << 3,
    '__ad': 2 << 4,
    '__ae': 2 << 5,
    '__af': 2 << 6,
    '__ag': 2 << 7,
    '__ah': 2 << 8,
    '__ai': 2 << 9,
    '__aj': 2 << 10
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
        name: '__ak',
        url: magix_1.default.config('getBackgroundImageUrl')
    }]);
exports.default = {
    ctor() {
        let me = this;
        me.on('rendercall', () => {
            delete me['__al'];
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
        if (!me['__al'])
            me['__al'] = {};
        let locker = me['__al'];
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
        let locker = this['__al'];
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
define("designer/stage-dragdrop",["magix","../gallery/mx-dragdrop/index","../gallery/mx-runner/index","./const","./history","./stage-elements"],(require,exports,module)=>{
/*magix_1,index_1,index_2,const_1,history_1,stage_elements_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const index_1 = require("../gallery/mx-dragdrop/index");
const index_2 = require("../gallery/mx-runner/index");
const const_1 = require("./const");
const history_1 = require("./history");
const stage_elements_1 = require("./stage-elements");
exports.default = {
    '__av'(scrollNode, stageId) {
        let hoverInfo = null;
        let lastHoverNode = null;
        let barStyle = null;
        let outerBound = null;
        let lastPosition = null;
        let me = this;
        let stageScrolling = 0;
        let scrollListened = 0;
        let moveEvent = null;
        let elementsTree = null;
        let clearInfo = () => {
            lastHoverNode = null;
            outerBound = null;
            hoverInfo = null;
            lastPosition = null;
        };
        let scrollIfNeed = () => {
            let bound = scrollNode.getBoundingClientRect();
            let horScroll = scrollNode.scrollWidth > scrollNode.clientWidth + const_1.default["__F"];
            let verScroll = scrollNode.scrollHeight > scrollNode.clientHeight + const_1.default["__F"];
            let inScroll = moveEvent.pageY > bound.top &&
                moveEvent.pageY < bound.top + bound.height &&
                moveEvent.pageX > bound.left &&
                moveEvent.pageX < bound.left + bound.width;
            if (inScroll && (horScroll || verScroll)) {
                if ((bound.top + bound.height - const_1.default["__E"]) < moveEvent.pageY) {
                    if ((scrollNode.scrollTop + scrollNode.clientHeight + const_1.default["__F"]) < scrollNode.scrollHeight) {
                        stageScrolling++;
                        if (stageScrolling > const_1.default["__I"]) {
                            barStyle.display = 'none';
                            scrollNode.scrollTop += const_1.default["__H"];
                        }
                    }
                    else {
                        stageScrolling = 0;
                    }
                }
                else if (bound.top + const_1.default["__E"] > moveEvent.pageY) {
                    if (scrollNode.scrollTop < const_1.default["__F"]) {
                        stageScrolling = 0;
                    }
                    else {
                        stageScrolling++;
                        if (stageScrolling > const_1.default["__I"]) {
                            scrollNode.scrollTop -= const_1.default["__H"];
                            barStyle.display = 'none';
                        }
                    }
                }
                else if (bound.left + const_1.default["__D"] > moveEvent.pageX) {
                    if (scrollNode.scrollLeft < const_1.default["__F"]) {
                        stageScrolling = 0;
                    }
                    else {
                        stageScrolling++;
                        if (stageScrolling > const_1.default["__I"]) {
                            scrollNode.scrollLeft -= const_1.default["__H"];
                            barStyle.display = 'none';
                        }
                    }
                }
                else if ((bound.left + bound.width - const_1.default["__D"]) < moveEvent.pageX) {
                    if ((scrollNode.scrollLeft + scrollNode.clientWidth + const_1.default["__F"]) < scrollNode.scrollWidth) {
                        stageScrolling++;
                        if (stageScrolling > const_1.default["__I"]) {
                            barStyle.display = 'none';
                            scrollNode.scrollLeft += const_1.default["__H"];
                        }
                    }
                    else {
                        stageScrolling = 0;
                    }
                }
                else {
                    stageScrolling = 0;
                }
            }
            else {
                stageScrolling = 0;
            }
        };
        let startScroll = () => {
            if (!scrollListened) {
                scrollListened = 1;
                scrollNode.addEventListener('scroll', clearInfo);
                scrollNode.classList.remove('dah');
                elementsTree = stage_elements_1.default["__am"]();
                index_2.default["__an"](const_1.default["__G"], scrollIfNeed);
            }
        };
        let stopScroll = () => {
            stageScrolling = 0;
            if (scrollListened) {
                scrollListened = 0;
                scrollNode.removeEventListener('scroll', clearInfo);
                index_2.default["__ao"](scrollIfNeed);
            }
        };
        let addElements = e => {
            stopScroll();
            if (lastPosition) {
                barStyle.display = 'none';
                if (hoverInfo.moved) {
                    stage_elements_1.default["__ap"](lastPosition, hoverInfo.moved);
                }
                else {
                    stage_elements_1.default["__M"](lastPosition);
                }
                magix_1.State.fire('__b');
                history_1.default["__s"]();
            }
            clearInfo();
            elementsTree = null;
        };
        let findPlace = e => {
            moveEvent = e;
            startScroll();
            if (stageScrolling)
                return;
            let n = index_1.default["__aq"](e.clientX, e.clientY);
            if (n != lastHoverNode) {
                lastHoverNode = n;
                if (!barStyle) {
                    barStyle = magix_1.node(stageId + '_bar').style;
                }
                if (!outerBound) {
                    outerBound = magix_1.node('stage_outer').getBoundingClientRect();
                }
                let i = me["__ar"](elementsTree, n, e.moved);
                if (i) {
                    hoverInfo = i;
                }
                else {
                    hoverInfo = null;
                }
            }
            if (hoverInfo) {
                let pos = me["__as"](hoverInfo, e);
                if (pos) {
                    lastPosition = pos;
                    barStyle.left = pos.rect.left - outerBound.left + 'px';
                    barStyle.top = pos.rect.top - outerBound.top + 'px';
                    barStyle.width = pos.rect.width + 'px';
                    barStyle.display = 'block';
                }
                else {
                    lastPosition = null;
                    barStyle.display = 'none';
                }
            }
            else if (barStyle) {
                lastPosition = null;
                barStyle.display = 'none';
            }
        };
        let clickAddElement = () => {
            let { id } = stage_elements_1.default["__at"](magix_1.State.get('__L'));
            magix_1.State.fire('__b');
            history_1.default["__s"]();
            stage_elements_1.default["__au"](id);
        };
        magix_1.State.on('__c', findPlace);
        magix_1.State.on('__d', addElements);
        magix_1.State.on('__e', clickAddElement);
    },
    '__as'(info, { pageY }) {
        let isSub = false;
        let { entity, subIndex, ctrl, moved } = info;
        if (moved && info.role != 'stage') {
            let walk = e => {
                if (e.id == entity.id) {
                    isSub = true;
                }
                else {
                    if (e.role == 'layout') {
                        for (let c of e.props.columns) {
                            for (let x of c.elements) {
                                walk(x);
                                if (isSub) {
                                    break;
                                }
                            }
                            if (isSub) {
                                break;
                            }
                        }
                    }
                }
            };
            walk(moved);
        }
        if (isSub)
            return;
        let bound = (info.layout || info.node).getBoundingClientRect();
        let rect = {
            left: bound.left,
            top: bound.top,
            width: bound.width,
            height: bound.height
        };
        if (info.role == 'stage') {
            let count = info.elements.length;
            if (count) {
                rect.top += rect.height;
            }
            return {
                ctrl: info.ctrl,
                elements: info.elements,
                index: count,
                rect
            };
        }
        else if (info.role == 'layout') {
            let index = info.index, toIndex = index;
            if ((rect.top + rect.height / 2) < pageY) {
                rect.top += rect.height;
                index++;
                toIndex++;
            }
            else {
                toIndex--;
            }
            let to = info.ownerList[toIndex];
            if (to && moved && to.id == moved.id) {
                return null;
            }
            return {
                ctrl: info.ctrl,
                elements: info.ownerList,
                index,
                rect
            };
        }
        else if (info.role == 'column') {
            let index = info.index, toIndex = index;
            let nearTop = rect.top + const_1.default["__C"] >= pageY;
            let nearBottom = rect.top + rect.height - const_1.default["__C"] <= pageY;
            if (nearBottom) {
                index++;
                toIndex++;
                rect.top += rect.height;
            }
            else {
                toIndex--;
            }
            if (nearTop || nearBottom) {
                let to = info.ownerList[toIndex];
                if (to && moved && to.id == moved.id) {
                    return null;
                }
                return {
                    ctrl: info.ctrl,
                    elements: info.ownerList,
                    index,
                    rect
                };
            }
            bound = info.node.getBoundingClientRect();
            rect = {
                left: bound.left,
                top: bound.top,
                width: bound.width,
                height: bound.height
            };
            nearTop = rect.top + const_1.default["__C"] >= pageY;
            let col = entity.props.columns[subIndex];
            let elements = col.elements, count = elements.length, e;
            if (count) {
                if (nearTop) {
                    index = 0;
                    e = elements[0];
                }
                else {
                    index = count;
                    e = elements[count - 1];
                }
                if (moved && moved.id == e.id) {
                    return;
                }
                bound = magix_1.node(e.id).getBoundingClientRect();
                rect = {
                    left: bound.left,
                    top: bound.top + (nearTop ? 0 : bound.height),
                    width: bound.width,
                    height: bound.height
                };
            }
            else {
                index = 0;
            }
            return {
                elements,
                ctrl,
                index,
                rect
            };
        }
        else {
            let index = info.index, toIndex = index;
            if ((rect.top + rect.height / 2) < pageY) {
                rect.top += rect.height;
                index++;
                toIndex++;
            }
            else {
                toIndex--;
            }
            let to = info.ownerList[toIndex];
            if (to && moved && to.id == moved.id) {
                return null;
            }
            return {
                ctrl: info.ctrl,
                elements: info.ownerList,
                index,
                rect
            };
        }
    },
    '__ar'(elementsTree, hover, moved) {
        let ctrl = magix_1.State.get('__L');
        let stage = magix_1.node('stage_canvas');
        if ((ctrl || moved) && magix_1.default.inside(hover, stage)) {
            let layouts = magix_1.State.get('__O');
            if (hover == stage) {
                let last = layouts[layouts.length - 1], lastNode = stage;
                if (moved && last.id == moved.id) {
                    return;
                }
                if (last) {
                    lastNode = magix_1.node(last.id);
                }
                return {
                    moved,
                    elements: layouts,
                    ctrl,
                    role: 'stage',
                    node: lastNode
                };
            }
            else {
                let role = '';
                do {
                    role = hover.getAttribute('role');
                    if (role) {
                        break;
                    }
                    hover = hover.parentNode;
                } while (hover != stage);
                if (role) {
                    let entityId = hover.getAttribute(role == 'column' ? 'pid' : 'eid');
                    let { entity, pInfo } = stage_elements_1.default["__aw"](elementsTree, entityId);
                    if (moved && moved.id == entity.id) {
                        return;
                    }
                    if (entity.props.locked) {
                        hover = magix_1.node(entity.id);
                        role = hover.getAttribute('role');
                    }
                    let subIndex = -1, layout = null;
                    if (role == 'column') {
                        subIndex = hover.getAttribute('index') | 0;
                        layout = hover;
                        while (layout != stage) {
                            if (layout.getAttribute('role') == 'layout') {
                                break;
                            }
                            layout = layout.parentNode;
                        }
                    }
                    return {
                        ctrl,
                        role,
                        moved,
                        subIndex,
                        layout,
                        entity: entity,
                        index: pInfo.index,
                        ownerList: pInfo.elements,
                        node: hover
                    };
                }
            }
        }
        return null;
    }
};

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/stage-elements",["magix","../gallery/mx-pointer/follower","./history","./stage-select"],(require,exports,module)=>{
/*magix_1,follower_1,history_1,stage_select_1*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magix_1 = require("magix");
const follower_1 = require("../gallery/mx-pointer/follower");
const history_1 = require("./history");
const stage_select_1 = require("./stage-select");
let RectIntersect = (rect1, rect2) => {
    let half1Width = rect1.width / 2, half1Height = rect1.height / 2, half2Width = rect2.width / 2, half2Height = rect2.height / 2, cen1 = {
        x: rect1.x + half1Width,
        y: rect1.y + half1Height
    }, cen2 = {
        x: rect2.x + half2Width,
        y: rect2.y + half2Height
    };
    return Math.abs(cen2.x - cen1.x) <= half1Width + half2Width &&
        Math.abs(cen2.y - cen1.y) <= half1Height + half2Height;
};
let ScrollIntoView = id => {
    let scroller = magix_1.node('stage_outer').parentNode;
    let n = magix_1.node(id);
    let rect = scroller.getBoundingClientRect();
    let rect1 = {
        x: rect.left,
        y: rect.top,
        width: rect.width - 20,
        height: rect.height - 20
    };
    rect = n.getBoundingClientRect();
    let rect2 = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
    };
    if (!RectIntersect(rect1, rect2)) {
        let offset = scroller.clientHeight / 3;
        scroller.classList.add('dah');
        scroller.scrollTop = rect2.y + scroller.scrollTop - rect1.y - offset;
    }
};
exports.default = {
    '__M'(e) {
        let ctrl = e.ctrl;
        let props = ctrl.getProps();
        let em = {
            id: magix_1.default.guid('e_'),
            type: ctrl.type,
            role: ctrl.role,
            ctrl,
            props
        };
        e.elements.splice(e.index, 0, em);
        stage_select_1.default["__ax"](em);
    },
    '__at'(ctrl) {
        let props = ctrl.getProps();
        let em = {
            id: magix_1.default.guid('e_'),
            type: ctrl.type,
            role: ctrl.role,
            ctrl,
            props
        };
        let layouts = magix_1.State.get('__O');
        layouts.unshift(em);
        stage_select_1.default["__ax"](em);
        return em;
    },
    '__ap'(e, moved) {
        let ownerList = null;
        let walk = (elements) => {
            let i = 0, find = false;
            for (let e of elements) {
                if (e.id == moved.id) {
                    elements.splice(i, 1, null);
                    ownerList = elements;
                    find = true;
                    break;
                }
                else if (e.role == 'layout') {
                    for (let c of e.props.columns) {
                        walk(c.elements);
                        if (find)
                            break;
                    }
                }
                i++;
            }
        };
        let layouts = magix_1.State.get('__O');
        walk(layouts);
        e.elements.splice(e.index, 0, moved);
        for (let i = ownerList.length; i--;) {
            if (ownerList[i] === null) {
                ownerList.splice(i, 1);
                break;
            }
        }
    },
    '__am'() {
        let layouts = magix_1.State.get('__O');
        let idMap = {}, elements = {};
        let mapped = (es, pId, type) => {
            let i = 0;
            for (let e of es) {
                idMap[e.id] = {
                    pId,
                    index: i,
                    elements: es,
                    type
                };
                elements[e.id] = e;
                if (e.role == 'layout') {
                    for (let c of e.props.columns) {
                        mapped(c.elements, e.id, e.role);
                    }
                }
                i++;
            }
        };
        mapped(layouts, 0, 'stage');
        return {
            idMap,
            elements
        };
    },
    '__aw'(tree, elementId) {
        let { idMap, elements } = tree;
        let startId = elementId, locked = elementId;
        do {
            if (elements[startId].props.locked) {
                locked = startId;
            }
            startId = idMap[startId].pId;
        } while (magix_1.has(idMap, startId));
        let pInfo = idMap[locked];
        return {
            entity: elements[locked],
            pInfo
        };
    },
    '__ay'(event, view) {
        let { element } = event.params;
        let tree = this['__am']();
        let { entity } = this['__aw'](tree, element.id);
        let elements = magix_1.State.get('__P');
        if (event.button !== undefined && event.button != 0) { //如果不是左键
            let exist = false;
            for (let m of elements) {
                if (m.id === element.id) {
                    exist = true;
                    break;
                }
            }
            if (!exist) { //如果在当前选中的元素内找不到当前的，则激活当前
                if (stage_select_1.default['__ax'](entity)) {
                    history_1.default["__s"]();
                }
            }
            return;
        }
        let exist = false;
        for (let e of elements) {
            if (entity.id == e.id) {
                exist = true;
            }
        }
        if (!exist) {
            if (stage_select_1.default['__ax'](entity)) {
                history_1.default["__s"]();
            }
            elements.length = 0;
            elements.push(entity);
        }
        if (entity.props.locked)
            return;
        let ctrl = entity.ctrl;
        follower_1.default["__K"](ctrl.icon);
        view['__w'](event, evt => {
            follower_1.default["__x"](evt);
            magix_1.State.fire('__c', {
                pageX: evt.pageX,
                pageY: evt.pageY,
                clientX: evt.clientX,
                clientY: evt.clientY,
                moved: entity
            });
        }, (ex) => {
            follower_1.default["__y"]();
            if (ex) {
                let scroller = magix_1.node('stage_outer').parentNode;
                let sTop = scroller.scrollTop;
                ex.preventDefault();
                magix_1.State.fire('__d');
                if (sTop != scroller.scrollTop) {
                    scroller.scrollTop = sTop;
                }
            }
        });
    },
    '__az'() {
        let selectElements = magix_1.State.get('__P');
        let layouts = magix_1.State.get('__O');
        let update = false;
        if (selectElements.length) {
            let map = magix_1.toMap(selectElements, 'id');
            let walk = elements => {
                for (let i = elements.length, e; i--;) {
                    e = elements[i];
                    if (!e.props.locked) {
                        if (map[e.id]) {
                            update = true;
                            elements.splice(i, 1);
                        }
                        else {
                            if (e.role == 'layout') {
                                for (let c of e.props.columns) {
                                    walk(c.elements);
                                }
                            }
                        }
                    }
                }
            };
            walk(layouts);
            if (update) {
                stage_select_1.default["__ax"]();
            }
        }
        return update;
    },
    '__aA'(e) {
        let selectElements = magix_1.State.get('__P');
        let stageElements = magix_1.State.get('__O');
        if (stageElements.length) {
            //多选2个以上的我们取消多选，然后从头选择一个
            let c = selectElements.length;
            let current = selectElements[0];
            let select = null;
            if (c === 0 || c > 1) {
                select = stageElements[e.shiftKey ? stageElements.length - 1 : 0];
            }
            else {
                let findCurrent = null, findNext = null, findPrev = null, lastOne = null, lockPrev = false, id = current.id;
                let find = es => {
                    for (let e of es) {
                        if (e.id == id) {
                            lockPrev = true;
                            findCurrent = e;
                        }
                        else {
                            if (findCurrent && !findNext) {
                                findNext = e;
                            }
                            else if (!lockPrev) {
                                findPrev = e;
                            }
                            else {
                                lastOne = e;
                            }
                        }
                        if (e.role == 'layout' && !e.props.locked) {
                            for (let c of e.props.columns) {
                                find(c.elements);
                            }
                        }
                    }
                };
                find(stageElements);
                if (e.shiftKey) {
                    if (!findPrev) {
                        select = stageElements[stageElements.length - 1];
                        if (select.role == 'layout' && lastOne) {
                            select = lastOne;
                        }
                    }
                    else {
                        select = findPrev;
                    }
                }
                else {
                    if (!findNext) {
                        select = stageElements[0];
                    }
                    else {
                        select = findNext;
                    }
                }
            }
            if (!current || select.id != current.id) {
                stage_select_1.default["__ax"](select);
                history_1.default["__s"]();
                ScrollIntoView(select.id);
            }
        }
    },
    '__au': ScrollIntoView
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
    '__ax'(element) {
        let selectElements = magix_1.State.get('__P');
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
                    '__X': magix_1.toMap(selectElements, 'id')
                });
                magix_1.State.fire('__h');
                return true;
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
define("designer/stage",["magix","../gallery/mx-dragdrop/index","./history","./keys","./stage-elements","./stage-select","./stage-dragdrop"],(require,exports,module)=>{
/*magix_1,index_1,history_1,keys_1,stage_elements_1,stage_select_1,stage_dragdrop_1*/
let $_quick_vnode_attr_static_0={'class': 'dak',};
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
const stage_dragdrop_1 = require("./stage-dragdrop");
magix_1.default.applyStyle("dd",".daj{outline:0;display:flex;position:relative}.dak{padding:50px 240px 50px 120px}.dal{background:#fff;box-shadow:0 3px 6px 0 rgba(0,0,0,.3)}@-webkit-keyframes dc{0%{background-position:10px 0}to{background-position:0 0}}@keyframes dc{0%{background-position:10px 0}to{background-position:0 0}}.dam{height:2px;background:linear-gradient(45deg,#fa742b 25%,#fff 0,#fff 50%,#fa742b 0,#fa742b 75%,#fff 0,#fff);background-size:10px 10px;position:absolute;display:none;pointer-events:none;margin-top:-1px;transition:all .08333333s;animation:dc .4s linear infinite reverse}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId,$n,$eu,$_ref,$i)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
{
	page,
	scale,
	layouts,
	id,}=$$,
$vnode_1,
$vnode_2,
$$_style,
$vnode_3,
$vnode_4; 
   $vnode_3=[]; for(let $q_key_gnsxvaxsk=0,$q_a_azlaauq=layouts,$q_c_yxghkja=$q_a_azlaauq.length;$q_key_gnsxvaxsk<$q_c_yxghkja;$q_key_gnsxvaxsk++){let layout=$q_a_azlaauq[$q_key_gnsxvaxsk];  ;$vnode_4=[$_create('div',{'mxv': 'layouts', 'class': 'dh', 'id': $n(layout.id), 'mx-view': 'elements/'+$n(layout.ctrl.role)+'/designer?element='+$i($_ref,layout), 'mx-mousedown': $_viewId+'__aB({element:\''+$i($_ref,layout)+'\'})', 'role': 'layout', 'eid': $n(layout.id),})]; $vnode_3.push(...$vnode_4); };$$_style='min-width:'+$n(page.width*scale)+'px;min-height:'+$n(page.height*scale)+'px;background:'+$n(page.background)+';';if(page.backgroundImage){;$$_style+='background-image:url('+$n(page.backgroundImage)+');background-repeat:'+$n(page.backgroundRepeat=='full'?'no-repeat':page.backgroundRepeat)+';background-size:';if(page.backgroundRepeat=='full'){;$$_style+='100% 100%';}else{;$$_style+=''+$n(page.backgroundWidth*scale)+'px '+$n(page.backgroundHeight*scale)+'px;';};};$vnode_2=[$_create('div',{'class': 'dal', 'id': 'stage_canvas', 'style': $$_style,},$vnode_3 )]; ;$vnode_1=[$_create('div',$_quick_vnode_attr_static_0,$vnode_2 )];  ;$vnode_1.push($_create('div',{'class': 'dam', 'id': $n(id)+'_bar',})); ;$vnode_0.push($_create('div',{'class': 'daj', 'id': 'stage_outer', 'mx-contextmenu': $_viewId+'__A()', 'mx-mousedown': $_viewId+'__aC()', 'tabindex': '0', 'mx-focusin': $_viewId+'__aE()', 'mx-focusout': $_viewId+'__aF()', 'mx-keydown': $_viewId+'__aD()',},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    mixins: [index_1.default],
    init() {
        let updateElements = (e) => {
            let layouts = magix_1.State.get('__O');
            if (e) {
                this.digest({
                    layouts
                });
            }
            else {
                this.set({
                    layouts
                });
            }
        };
        let updateStage = this.render.bind(this);
        magix_1.State.on('___', updateStage);
        magix_1.State.on('__a', updateStage);
        magix_1.State.on('__b', updateElements);
        stage_dragdrop_1.default["__av"](this.root, this.id);
        updateElements();
    },
    render() {
        let page = magix_1.State.get('__N');
        this.digest({
            scale: magix_1.State.get('__c'),
            page
        });
    },
    '__aB<mousedown>'(e) {
        if (e.from != 'layout') {
            stage_elements_1.default["__ay"](e, this);
        }
    },
    '__aC<mousedown>'(e) {
        let target = e.target;
        if (magix_1.default.inside(magix_1.node('stage_canvas'), target)) {
            if (!(e.shiftKey || e.metaKey || e.ctrlKey)) {
                if (stage_select_1.default["__ax"]()) {
                    history_1.default["__s"]();
                }
            }
        }
    },
    '__aD<keydown>'(e) {
        if (e.metaKey || e.ctrlKey) {
            if (e.keyCode == keys_1.default.Z) {
                e.preventDefault();
                if (e.shiftKey) {
                    history_1.default["__U"]();
                }
                else {
                    history_1.default["__T"]();
                }
            }
            else if (e.keyCode == keys_1.default.Y) {
                e.preventDefault();
                history_1.default["__U"]();
            }
        }
        else {
            if (e.keyCode == keys_1.default.TAB) {
                e.preventDefault();
                stage_elements_1.default["__aA"](e);
            }
            else if (e.keyCode == keys_1.default.DELETE) {
                e.preventDefault();
                if (stage_elements_1.default["__az"]()) {
                    magix_1.State.fire('__b');
                    history_1.default["__s"]();
                }
            }
        }
    },
    '__A<contextmenu>'(e) {
        e.preventDefault();
    },
    '__aE<focusin>'() {
        this.root.classList.remove('dai');
    },
    '__aF<focusout>'() {
        this.root.classList.add('dai');
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
                                $vnode_0.push($_quick_static_node_0); }else{;$vnode_0.push($_quick_static_node_0=$_create('i',{'mxs': 'dd:_', 'class': 'daq',})); } $vnode_1=[$_create(0,0,'')];;$$_class='dx dao';if(c<1||elements[0].props.locked){;$$_class+=' dar';};$vnode_0.push($_create('i',{'title': $n(i18n('_c'))+'(Delete)', 'mx-click': $_viewId+'__aG()', 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
        magix_1.State.on('__h', update);
        magix_1.State.on('__i', update);
    },
    render() {
        this.digest({
            elements: magix_1.State.get('__P')
        });
    },
    '__aG<click>'(e) {
        if (e.eventTarget.classList.contains('dar')) {
            return;
        }
        if (stage_elements_1.default["__az"]()) {
            magix_1.State.fire('__b');
            history_1.default["__s"]();
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
 $vnode_1=[$_create(0,0,'')];;$$_class='dx dao';if(!status.canUndo){;$$_class+=' dar';};$vnode_0.push($_create('i',{'title': $n(i18n('_d')), 'mx-click': $_viewId+'__aH({s:\'-\',b:'+$n(status.canUndo)+'})', 'class': $$_class,},$vnode_1 ));  $vnode_1=[$_create(0,0,'')];;$$_class='dx dao dB';if(!status.canRedo){;$$_class+=' dar';};$vnode_0.push($_create('i',{'title': $n(i18n('_e')), 'mx-click': $_viewId+'__aH({s:\'+\',b:'+$n(status.canRedo)+'})', 'class': $$_class,},$vnode_1 ));  
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        let update = this.render.bind(this);
        magix_1.State.on('___', update);
        magix_1.State.on('__g', update);
    },
    render() {
        this.digest({
            status: history_1.default["__R"]()
        });
    },
    '__aH<click>'(e) {
        if (e.eventTarget.classList.contains('dar')) {
            return;
        }
        let { s, b } = e.params;
        if (b) {
            if (s == '-') {
                history_1.default["__T"]();
            }
            else {
                history_1.default["__U"]();
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
for(let $q_key_aslywsn=0,$q_a_eebtbllqyi=panels,$q_c_yojywtc=$q_a_eebtbllqyi.length;$q_key_aslywsn<$q_c_yojywtc;$q_key_aslywsn++){let p=$q_a_eebtbllqyi[$q_key_aslywsn];  $vnode_2=[$_create(0,1,(p.icon))];;$$_class='dx dao';if(p.opened){;$$_class+=' dap';};$vnode_1=[$_create('i',{'mx-click': $_viewId+'__aJ({id:\''+($eq(p.id))+'\'})', 'title': $n(i18n(p.opened?'_f':'_g',p.title)), 'class': $$_class,},$vnode_2 )]; $vnode_0.push(...$vnode_1); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    init() {
        magix_1.State.on('__j', () => {
            console.log('change');
            this.render();
        });
    },
    render() {
        this.digest({
            panels: index_1.default["__aI"]()
        });
    },
    '__aJ<click>'(e) {
        let { id } = e.params;
        index_1.default["__aJ"](id);
    }
});

});
/*
    generate by magix-combine@5.0.0: https://github.com/thx/magix-combine
    author: kooboy_li@163.com
    loader: cmd_es
 */
define("designer/toolbar",["magix","./toolbar-do","./toolbar-del","./toolbar-panels"],(require,exports,module)=>{
/*magix_1*/
require("./toolbar-do");
require("./toolbar-del");
require("./toolbar-panels");
let $_quick_static_node_0;
let $_quick_static_node_3;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    author:xinglie.lkf@alibaba-inc.com
*/
const magix_1 = require("magix");
magix_1.default.applyStyle("de",".dan{height:22px}.dao{cursor:pointer;height:22px;width:22px;margin:0 2px;display:inline-flex;align-items:center;justify-content:center;border-radius:2px}.dao:hover{background:#e6e6e6;color:#333}.dap,.dap:hover{background:#c4c4c4}.daq{height:16px;width:1px;background:#eee;margin:3px 12px;float:left}.dar{color:#aaa;cursor:not-allowed}.dar:hover{color:#aaa;background:transparent}");
exports.default = magix_1.default.View.extend({
    tmpl: ($$, $_create,$_viewId)=> { 
let $_temp,$vnode_0=[],$_empty_arr=[],
$vnode_1; 
 if ($_quick_static_node_0) {
                                $vnode_0.push($_quick_static_node_0); }else{ ;$vnode_1=[$_create('div',{'class': 'dan', 'mx-view': 'designer/toolbar-do',})];  ;$vnode_1.push($_create('div',{'class': 'dan', 'mx-view': 'designer/toolbar-del',})); ;$vnode_0.push($_quick_static_node_0=$_create('div',{'mxs': 'dg:_', 'class': 'dd dE db',},$vnode_1 )); } if ($_quick_static_node_3) {
                                $vnode_0.push($_quick_static_node_3); }else{ ;$vnode_1=[$_create('div',{'class': 'dan', 'mx-view': 'designer/toolbar-panels',})]; ;$vnode_0.push($_quick_static_node_3=$_create('div',{'mxs': 'dg:a', 'class': 'de db dE',},$vnode_1 )); } 
return $_create($_viewId, 0, $vnode_0);  } ,
    render() {
        this.digest();
    }
});

});