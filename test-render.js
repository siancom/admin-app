var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/html-to-image/lib/util.js
var require_util = __commonJS({
  "node_modules/html-to-image/lib/util.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isInstanceOfElement = exports.nodeToDataURL = exports.svgToDataURL = exports.createImage = exports.canvasToBlob = exports.checkCanvasDimensions = exports.getPixelRatio = exports.getImageSize = exports.getStyleProperties = exports.toArray = exports.delay = exports.uuid = exports.resolveUrl = void 0;
    function resolveUrl(url, baseUrl) {
      if (url.match(/^[a-z]+:\/\//i)) {
        return url;
      }
      if (url.match(/^\/\//)) {
        return window.location.protocol + url;
      }
      if (url.match(/^[a-z]+:/i)) {
        return url;
      }
      var doc5 = document.implementation.createHTMLDocument();
      var base = doc5.createElement("base");
      var a = doc5.createElement("a");
      doc5.head.appendChild(base);
      doc5.body.appendChild(a);
      if (baseUrl) {
        base.href = baseUrl;
      }
      a.href = url;
      return a.href;
    }
    exports.resolveUrl = resolveUrl;
    exports.uuid = /* @__PURE__ */ (function() {
      var counter = 0;
      var random = function() {
        return "0000".concat((Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
      };
      return function() {
        counter += 1;
        return "u".concat(random()).concat(counter);
      };
    })();
    function delay(ms) {
      return function(args) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            return resolve(args);
          }, ms);
        });
      };
    }
    exports.delay = delay;
    function toArray(arrayLike) {
      var arr = [];
      for (var i = 0, l = arrayLike.length; i < l; i++) {
        arr.push(arrayLike[i]);
      }
      return arr;
    }
    exports.toArray = toArray;
    var styleProps = null;
    function getStyleProperties(options) {
      if (options === void 0) {
        options = {};
      }
      if (styleProps) {
        return styleProps;
      }
      if (options.includeStyleProperties) {
        styleProps = options.includeStyleProperties;
        return styleProps;
      }
      styleProps = toArray(window.getComputedStyle(document.documentElement));
      return styleProps;
    }
    exports.getStyleProperties = getStyleProperties;
    function px(node, styleProperty) {
      var win = node.ownerDocument.defaultView || window;
      var val = win.getComputedStyle(node).getPropertyValue(styleProperty);
      return val ? parseFloat(val.replace("px", "")) : 0;
    }
    function getNodeWidth(node) {
      var leftBorder = px(node, "border-left-width");
      var rightBorder = px(node, "border-right-width");
      return node.clientWidth + leftBorder + rightBorder;
    }
    function getNodeHeight(node) {
      var topBorder = px(node, "border-top-width");
      var bottomBorder = px(node, "border-bottom-width");
      return node.clientHeight + topBorder + bottomBorder;
    }
    function getImageSize(targetNode, options) {
      if (options === void 0) {
        options = {};
      }
      var width = options.width || getNodeWidth(targetNode);
      var height = options.height || getNodeHeight(targetNode);
      return { width, height };
    }
    exports.getImageSize = getImageSize;
    function getPixelRatio() {
      var ratio;
      var FINAL_PROCESS;
      try {
        FINAL_PROCESS = process;
      } catch (e) {
      }
      var val = FINAL_PROCESS && FINAL_PROCESS.env ? FINAL_PROCESS.env.devicePixelRatio : null;
      if (val) {
        ratio = parseInt(val, 10);
        if (Number.isNaN(ratio)) {
          ratio = 1;
        }
      }
      return ratio || window.devicePixelRatio || 1;
    }
    exports.getPixelRatio = getPixelRatio;
    var canvasDimensionLimit = 16384;
    function checkCanvasDimensions(canvas) {
      if (canvas.width > canvasDimensionLimit || canvas.height > canvasDimensionLimit) {
        if (canvas.width > canvasDimensionLimit && canvas.height > canvasDimensionLimit) {
          if (canvas.width > canvas.height) {
            canvas.height *= canvasDimensionLimit / canvas.width;
            canvas.width = canvasDimensionLimit;
          } else {
            canvas.width *= canvasDimensionLimit / canvas.height;
            canvas.height = canvasDimensionLimit;
          }
        } else if (canvas.width > canvasDimensionLimit) {
          canvas.height *= canvasDimensionLimit / canvas.width;
          canvas.width = canvasDimensionLimit;
        } else {
          canvas.width *= canvasDimensionLimit / canvas.height;
          canvas.height = canvasDimensionLimit;
        }
      }
    }
    exports.checkCanvasDimensions = checkCanvasDimensions;
    function canvasToBlob(canvas, options) {
      if (options === void 0) {
        options = {};
      }
      if (canvas.toBlob) {
        return new Promise(function(resolve) {
          canvas.toBlob(resolve, options.type ? options.type : "image/png", options.quality ? options.quality : 1);
        });
      }
      return new Promise(function(resolve) {
        var binaryString = window.atob(canvas.toDataURL(options.type ? options.type : void 0, options.quality ? options.quality : void 0).split(",")[1]);
        var len = binaryString.length;
        var binaryArray = new Uint8Array(len);
        for (var i = 0; i < len; i += 1) {
          binaryArray[i] = binaryString.charCodeAt(i);
        }
        resolve(new Blob([binaryArray], {
          type: options.type ? options.type : "image/png"
        }));
      });
    }
    exports.canvasToBlob = canvasToBlob;
    function createImage(url) {
      return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() {
          img.decode().then(function() {
            requestAnimationFrame(function() {
              return resolve(img);
            });
          });
        };
        img.onerror = reject;
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.src = url;
      });
    }
    exports.createImage = createImage;
    function svgToDataURL(svg) {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          return [2, Promise.resolve().then(function() {
            return new XMLSerializer().serializeToString(svg);
          }).then(encodeURIComponent).then(function(html) {
            return "data:image/svg+xml;charset=utf-8,".concat(html);
          })];
        });
      });
    }
    exports.svgToDataURL = svgToDataURL;
    function nodeToDataURL(node, width, height) {
      return __awaiter(this, void 0, void 0, function() {
        var xmlns, svg, foreignObject;
        return __generator(this, function(_a) {
          xmlns = "http://www.w3.org/2000/svg";
          svg = document.createElementNS(xmlns, "svg");
          foreignObject = document.createElementNS(xmlns, "foreignObject");
          svg.setAttribute("width", "".concat(width));
          svg.setAttribute("height", "".concat(height));
          svg.setAttribute("viewBox", "0 0 ".concat(width, " ").concat(height));
          foreignObject.setAttribute("width", "100%");
          foreignObject.setAttribute("height", "100%");
          foreignObject.setAttribute("x", "0");
          foreignObject.setAttribute("y", "0");
          foreignObject.setAttribute("externalResourcesRequired", "true");
          svg.appendChild(foreignObject);
          foreignObject.appendChild(node);
          return [2, svgToDataURL(svg)];
        });
      });
    }
    exports.nodeToDataURL = nodeToDataURL;
    var isInstanceOfElement = function(node, instance) {
      if (node instanceof instance)
        return true;
      var nodePrototype = Object.getPrototypeOf(node);
      if (nodePrototype === null)
        return false;
      return nodePrototype.constructor.name === instance.name || (0, exports.isInstanceOfElement)(nodePrototype, instance);
    };
    exports.isInstanceOfElement = isInstanceOfElement;
  }
});

// node_modules/html-to-image/lib/clone-pseudos.js
var require_clone_pseudos = __commonJS({
  "node_modules/html-to-image/lib/clone-pseudos.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.clonePseudoElements = void 0;
    var util_1 = require_util();
    function formatCSSText(style) {
      var content = style.getPropertyValue("content");
      return "".concat(style.cssText, " content: '").concat(content.replace(/'|"/g, ""), "';");
    }
    function formatCSSProperties(style, options) {
      return (0, util_1.getStyleProperties)(options).map(function(name5) {
        var value = style.getPropertyValue(name5);
        var priority = style.getPropertyPriority(name5);
        return "".concat(name5, ": ").concat(value).concat(priority ? " !important" : "", ";");
      }).join(" ");
    }
    function getPseudoElementStyle(className, pseudo, style, options) {
      var selector = ".".concat(className, ":").concat(pseudo);
      var cssText = style.cssText ? formatCSSText(style) : formatCSSProperties(style, options);
      return document.createTextNode("".concat(selector, "{").concat(cssText, "}"));
    }
    function clonePseudoElement(nativeNode, clonedNode, pseudo, options) {
      var style = window.getComputedStyle(nativeNode, pseudo);
      var content = style.getPropertyValue("content");
      if (content === "" || content === "none") {
        return;
      }
      var className = (0, util_1.uuid)();
      try {
        clonedNode.className = "".concat(clonedNode.className, " ").concat(className);
      } catch (err) {
        return;
      }
      var styleElement = document.createElement("style");
      styleElement.appendChild(getPseudoElementStyle(className, pseudo, style, options));
      clonedNode.appendChild(styleElement);
    }
    function clonePseudoElements(nativeNode, clonedNode, options) {
      clonePseudoElement(nativeNode, clonedNode, ":before", options);
      clonePseudoElement(nativeNode, clonedNode, ":after", options);
    }
    exports.clonePseudoElements = clonePseudoElements;
  }
});

// node_modules/html-to-image/lib/mimes.js
var require_mimes = __commonJS({
  "node_modules/html-to-image/lib/mimes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getMimeType = void 0;
    var WOFF = "application/font-woff";
    var JPEG = "image/jpeg";
    var mimes = {
      woff: WOFF,
      woff2: WOFF,
      ttf: "application/font-truetype",
      eot: "application/vnd.ms-fontobject",
      png: "image/png",
      jpg: JPEG,
      jpeg: JPEG,
      gif: "image/gif",
      tiff: "image/tiff",
      svg: "image/svg+xml",
      webp: "image/webp"
    };
    function getExtension(url) {
      var match = /\.([^./]*?)$/g.exec(url);
      return match ? match[1] : "";
    }
    function getMimeType(url) {
      var extension = getExtension(url).toLowerCase();
      return mimes[extension] || "";
    }
    exports.getMimeType = getMimeType;
  }
});

// node_modules/html-to-image/lib/dataurl.js
var require_dataurl = __commonJS({
  "node_modules/html-to-image/lib/dataurl.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resourceToDataURL = exports.fetchAsDataURL = exports.makeDataUrl = exports.isDataUrl = void 0;
    function getContentFromDataUrl(dataURL) {
      return dataURL.split(/,/)[1];
    }
    function isDataUrl(url) {
      return url.search(/^(data:)/) !== -1;
    }
    exports.isDataUrl = isDataUrl;
    function makeDataUrl(content, mimeType) {
      return "data:".concat(mimeType, ";base64,").concat(content);
    }
    exports.makeDataUrl = makeDataUrl;
    function fetchAsDataURL(url, init, process2) {
      return __awaiter(this, void 0, void 0, function() {
        var res, blob;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4, fetch(url, init)];
            case 1:
              res = _a.sent();
              if (res.status === 404) {
                throw new Error('Resource "'.concat(res.url, '" not found'));
              }
              return [4, res.blob()];
            case 2:
              blob = _a.sent();
              return [2, new Promise(function(resolve, reject) {
                var reader = new FileReader();
                reader.onerror = reject;
                reader.onloadend = function() {
                  try {
                    resolve(process2({ res, result: reader.result }));
                  } catch (error) {
                    reject(error);
                  }
                };
                reader.readAsDataURL(blob);
              })];
          }
        });
      });
    }
    exports.fetchAsDataURL = fetchAsDataURL;
    var cache = {};
    function getCacheKey(url, contentType, includeQueryParams) {
      var key = url.replace(/\?.*/, "");
      if (includeQueryParams) {
        key = url;
      }
      if (/ttf|otf|eot|woff2?/i.test(key)) {
        key = key.replace(/.*\//, "");
      }
      return contentType ? "[".concat(contentType, "]").concat(key) : key;
    }
    function resourceToDataURL(resourceUrl, contentType, options) {
      return __awaiter(this, void 0, void 0, function() {
        var cacheKey, dataURL, content, error_1, msg;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
              if (cache[cacheKey] != null) {
                return [2, cache[cacheKey]];
              }
              if (options.cacheBust) {
                resourceUrl += (/\?/.test(resourceUrl) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime();
              }
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              return [4, fetchAsDataURL(resourceUrl, options.fetchRequestInit, function(_a2) {
                var res = _a2.res, result = _a2.result;
                if (!contentType) {
                  contentType = res.headers.get("Content-Type") || "";
                }
                return getContentFromDataUrl(result);
              })];
            case 2:
              content = _a.sent();
              dataURL = makeDataUrl(content, contentType);
              return [3, 4];
            case 3:
              error_1 = _a.sent();
              dataURL = options.imagePlaceholder || "";
              msg = "Failed to fetch resource: ".concat(resourceUrl);
              if (error_1) {
                msg = typeof error_1 === "string" ? error_1 : error_1.message;
              }
              if (msg) {
                console.warn(msg);
              }
              return [3, 4];
            case 4:
              cache[cacheKey] = dataURL;
              return [2, dataURL];
          }
        });
      });
    }
    exports.resourceToDataURL = resourceToDataURL;
  }
});

// node_modules/html-to-image/lib/clone-node.js
var require_clone_node = __commonJS({
  "node_modules/html-to-image/lib/clone-node.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cloneNode = void 0;
    var clone_pseudos_1 = require_clone_pseudos();
    var util_1 = require_util();
    var mimes_1 = require_mimes();
    var dataurl_1 = require_dataurl();
    function cloneCanvasElement(canvas) {
      return __awaiter(this, void 0, void 0, function() {
        var dataURL;
        return __generator(this, function(_a) {
          dataURL = canvas.toDataURL();
          if (dataURL === "data:,") {
            return [2, canvas.cloneNode(false)];
          }
          return [2, (0, util_1.createImage)(dataURL)];
        });
      });
    }
    function cloneVideoElement(video, options) {
      return __awaiter(this, void 0, void 0, function() {
        var canvas, ctx, dataURL_1, poster, contentType, dataURL;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              if (video.currentSrc) {
                canvas = document.createElement("canvas");
                ctx = canvas.getContext("2d");
                canvas.width = video.clientWidth;
                canvas.height = video.clientHeight;
                ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                dataURL_1 = canvas.toDataURL();
                return [2, (0, util_1.createImage)(dataURL_1)];
              }
              poster = video.poster;
              contentType = (0, mimes_1.getMimeType)(poster);
              return [4, (0, dataurl_1.resourceToDataURL)(poster, contentType, options)];
            case 1:
              dataURL = _a.sent();
              return [2, (0, util_1.createImage)(dataURL)];
          }
        });
      });
    }
    function cloneIFrameElement(iframe, options) {
      var _a;
      return __awaiter(this, void 0, void 0, function() {
        var _b;
        return __generator(this, function(_c) {
          switch (_c.label) {
            case 0:
              _c.trys.push([0, 3, , 4]);
              if (!((_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) return [3, 2];
              return [4, cloneNode(iframe.contentDocument.body, options, true)];
            case 1:
              return [2, _c.sent()];
            case 2:
              return [3, 4];
            case 3:
              _b = _c.sent();
              return [3, 4];
            case 4:
              return [2, iframe.cloneNode(false)];
          }
        });
      });
    }
    function cloneSingleNode(node, options) {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          if ((0, util_1.isInstanceOfElement)(node, HTMLCanvasElement)) {
            return [2, cloneCanvasElement(node)];
          }
          if ((0, util_1.isInstanceOfElement)(node, HTMLVideoElement)) {
            return [2, cloneVideoElement(node, options)];
          }
          if ((0, util_1.isInstanceOfElement)(node, HTMLIFrameElement)) {
            return [2, cloneIFrameElement(node, options)];
          }
          return [2, node.cloneNode(isSVGElement(node))];
        });
      });
    }
    var isSlotElement = function(node) {
      return node.tagName != null && node.tagName.toUpperCase() === "SLOT";
    };
    var isSVGElement = function(node) {
      return node.tagName != null && node.tagName.toUpperCase() === "SVG";
    };
    function cloneChildren(nativeNode, clonedNode, options) {
      var _a, _b;
      return __awaiter(this, void 0, void 0, function() {
        var children;
        return __generator(this, function(_c) {
          switch (_c.label) {
            case 0:
              if (isSVGElement(clonedNode)) {
                return [2, clonedNode];
              }
              children = [];
              if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
                children = (0, util_1.toArray)(nativeNode.assignedNodes());
              } else if ((0, util_1.isInstanceOfElement)(nativeNode, HTMLIFrameElement) && ((_a = nativeNode.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) {
                children = (0, util_1.toArray)(nativeNode.contentDocument.body.childNodes);
              } else {
                children = (0, util_1.toArray)(((_b = nativeNode.shadowRoot) !== null && _b !== void 0 ? _b : nativeNode).childNodes);
              }
              if (children.length === 0 || (0, util_1.isInstanceOfElement)(nativeNode, HTMLVideoElement)) {
                return [2, clonedNode];
              }
              return [4, children.reduce(function(deferred, child) {
                return deferred.then(function() {
                  return cloneNode(child, options);
                }).then(function(clonedChild) {
                  if (clonedChild) {
                    clonedNode.appendChild(clonedChild);
                  }
                });
              }, Promise.resolve())];
            case 1:
              _c.sent();
              return [2, clonedNode];
          }
        });
      });
    }
    function cloneCSSStyle(nativeNode, clonedNode, options) {
      var targetStyle = clonedNode.style;
      if (!targetStyle) {
        return;
      }
      var sourceStyle = window.getComputedStyle(nativeNode);
      if (sourceStyle.cssText) {
        targetStyle.cssText = sourceStyle.cssText;
        targetStyle.transformOrigin = sourceStyle.transformOrigin;
      } else {
        (0, util_1.getStyleProperties)(options).forEach(function(name5) {
          var value = sourceStyle.getPropertyValue(name5);
          if (name5 === "font-size" && value.endsWith("px")) {
            var reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
            value = "".concat(reducedFont, "px");
          }
          if ((0, util_1.isInstanceOfElement)(nativeNode, HTMLIFrameElement) && name5 === "display" && value === "inline") {
            value = "block";
          }
          if (name5 === "d" && clonedNode.getAttribute("d")) {
            value = "path(".concat(clonedNode.getAttribute("d"), ")");
          }
          targetStyle.setProperty(name5, value, sourceStyle.getPropertyPriority(name5));
        });
      }
    }
    function cloneInputValue(nativeNode, clonedNode) {
      if ((0, util_1.isInstanceOfElement)(nativeNode, HTMLTextAreaElement)) {
        clonedNode.innerHTML = nativeNode.value;
      }
      if ((0, util_1.isInstanceOfElement)(nativeNode, HTMLInputElement)) {
        clonedNode.setAttribute("value", nativeNode.value);
      }
    }
    function cloneSelectValue(nativeNode, clonedNode) {
      if ((0, util_1.isInstanceOfElement)(nativeNode, HTMLSelectElement)) {
        var clonedSelect = clonedNode;
        var selectedOption = Array.from(clonedSelect.children).find(function(child) {
          return nativeNode.value === child.getAttribute("value");
        });
        if (selectedOption) {
          selectedOption.setAttribute("selected", "");
        }
      }
    }
    function decorate(nativeNode, clonedNode, options) {
      if ((0, util_1.isInstanceOfElement)(clonedNode, Element)) {
        cloneCSSStyle(nativeNode, clonedNode, options);
        (0, clone_pseudos_1.clonePseudoElements)(nativeNode, clonedNode, options);
        cloneInputValue(nativeNode, clonedNode);
        cloneSelectValue(nativeNode, clonedNode);
      }
      return clonedNode;
    }
    function ensureSVGSymbols(clone, options) {
      return __awaiter(this, void 0, void 0, function() {
        var uses, processedDefs, i, use, id, exist, definition, _a, _b, nodes, ns, svg, defs, i;
        return __generator(this, function(_c) {
          switch (_c.label) {
            case 0:
              uses = clone.querySelectorAll ? clone.querySelectorAll("use") : [];
              if (uses.length === 0) {
                return [2, clone];
              }
              processedDefs = {};
              i = 0;
              _c.label = 1;
            case 1:
              if (!(i < uses.length)) return [3, 4];
              use = uses[i];
              id = use.getAttribute("xlink:href");
              if (!id) return [3, 3];
              exist = clone.querySelector(id);
              definition = document.querySelector(id);
              if (!(!exist && definition && !processedDefs[id])) return [3, 3];
              _a = processedDefs;
              _b = id;
              return [4, cloneNode(definition, options, true)];
            case 2:
              _a[_b] = _c.sent();
              _c.label = 3;
            case 3:
              i++;
              return [3, 1];
            case 4:
              nodes = Object.values(processedDefs);
              if (nodes.length) {
                ns = "http://www.w3.org/1999/xhtml";
                svg = document.createElementNS(ns, "svg");
                svg.setAttribute("xmlns", ns);
                svg.style.position = "absolute";
                svg.style.width = "0";
                svg.style.height = "0";
                svg.style.overflow = "hidden";
                svg.style.display = "none";
                defs = document.createElementNS(ns, "defs");
                svg.appendChild(defs);
                for (i = 0; i < nodes.length; i++) {
                  defs.appendChild(nodes[i]);
                }
                clone.appendChild(svg);
              }
              return [2, clone];
          }
        });
      });
    }
    function cloneNode(node, options, isRoot) {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          if (!isRoot && options.filter && !options.filter(node)) {
            return [2, null];
          }
          return [2, Promise.resolve(node).then(function(clonedNode) {
            return cloneSingleNode(clonedNode, options);
          }).then(function(clonedNode) {
            return cloneChildren(node, clonedNode, options);
          }).then(function(clonedNode) {
            return decorate(node, clonedNode, options);
          }).then(function(clonedNode) {
            return ensureSVGSymbols(clonedNode, options);
          })];
        });
      });
    }
    exports.cloneNode = cloneNode;
  }
});

// node_modules/html-to-image/lib/embed-resources.js
var require_embed_resources = __commonJS({
  "node_modules/html-to-image/lib/embed-resources.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.embedResources = exports.shouldEmbed = exports.embed = exports.parseURLs = void 0;
    var util_1 = require_util();
    var mimes_1 = require_mimes();
    var dataurl_1 = require_dataurl();
    var URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
    var URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
    var FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
    function toRegex(url) {
      var escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
      return new RegExp(`(url\\(['"]?)(`.concat(escaped, `)(['"]?\\))`), "g");
    }
    function parseURLs(cssText) {
      var urls = [];
      cssText.replace(URL_REGEX, function(raw, quotation, url) {
        urls.push(url);
        return raw;
      });
      return urls.filter(function(url) {
        return !(0, dataurl_1.isDataUrl)(url);
      });
    }
    exports.parseURLs = parseURLs;
    function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
      return __awaiter(this, void 0, void 0, function() {
        var resolvedURL, contentType, dataURL, content, error_1;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 5, , 6]);
              resolvedURL = baseURL ? (0, util_1.resolveUrl)(resourceURL, baseURL) : resourceURL;
              contentType = (0, mimes_1.getMimeType)(resourceURL);
              dataURL = void 0;
              if (!getContentFromUrl) return [3, 2];
              return [4, getContentFromUrl(resolvedURL)];
            case 1:
              content = _a.sent();
              dataURL = (0, dataurl_1.makeDataUrl)(content, contentType);
              return [3, 4];
            case 2:
              return [4, (0, dataurl_1.resourceToDataURL)(resolvedURL, contentType, options)];
            case 3:
              dataURL = _a.sent();
              _a.label = 4;
            case 4:
              return [2, cssText.replace(toRegex(resourceURL), "$1".concat(dataURL, "$3"))];
            case 5:
              error_1 = _a.sent();
              return [3, 6];
            case 6:
              return [2, cssText];
          }
        });
      });
    }
    exports.embed = embed;
    function filterPreferredFontFormat(str, _a) {
      var preferredFontFormat = _a.preferredFontFormat;
      return !preferredFontFormat ? str : str.replace(FONT_SRC_REGEX, function(match) {
        while (true) {
          var _a2 = URL_WITH_FORMAT_REGEX.exec(match) || [], src = _a2[0], format = _a2[2];
          if (!format) {
            return "";
          }
          if (format === preferredFontFormat) {
            return "src: ".concat(src, ";");
          }
        }
      });
    }
    function shouldEmbed(url) {
      return url.search(URL_REGEX) !== -1;
    }
    exports.shouldEmbed = shouldEmbed;
    function embedResources(cssText, baseUrl, options) {
      return __awaiter(this, void 0, void 0, function() {
        var filteredCSSText, urls;
        return __generator(this, function(_a) {
          if (!shouldEmbed(cssText)) {
            return [2, cssText];
          }
          filteredCSSText = filterPreferredFontFormat(cssText, options);
          urls = parseURLs(filteredCSSText);
          return [2, urls.reduce(function(deferred, url) {
            return deferred.then(function(css) {
              return embed(css, url, baseUrl, options);
            });
          }, Promise.resolve(filteredCSSText))];
        });
      });
    }
    exports.embedResources = embedResources;
  }
});

// node_modules/html-to-image/lib/embed-images.js
var require_embed_images = __commonJS({
  "node_modules/html-to-image/lib/embed-images.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.embedImages = void 0;
    var embed_resources_1 = require_embed_resources();
    var util_1 = require_util();
    var dataurl_1 = require_dataurl();
    var mimes_1 = require_mimes();
    function embedProp(propName, node, options) {
      var _a;
      return __awaiter(this, void 0, void 0, function() {
        var propValue, cssString;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              propValue = (_a = node.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue(propName);
              if (!propValue) return [3, 2];
              return [4, (0, embed_resources_1.embedResources)(propValue, null, options)];
            case 1:
              cssString = _b.sent();
              node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
              return [2, true];
            case 2:
              return [2, false];
          }
        });
      });
    }
    function embedBackground(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function() {
        var _a, _b, _c, _d;
        return __generator(this, function(_e) {
          switch (_e.label) {
            case 0:
              ;
              return [4, embedProp("background", clonedNode, options)];
            case 1:
              _a = _e.sent();
              if (_a) return [3, 3];
              return [4, embedProp("background-image", clonedNode, options)];
            case 2:
              _a = _e.sent();
              _e.label = 3;
            case 3:
              _a;
              return [4, embedProp("mask", clonedNode, options)];
            case 4:
              _d = _e.sent();
              if (_d) return [3, 6];
              return [4, embedProp("-webkit-mask", clonedNode, options)];
            case 5:
              _d = _e.sent();
              _e.label = 6;
            case 6:
              _c = _d;
              if (_c) return [3, 8];
              return [4, embedProp("mask-image", clonedNode, options)];
            case 7:
              _c = _e.sent();
              _e.label = 8;
            case 8:
              _b = _c;
              if (_b) return [3, 10];
              return [4, embedProp("-webkit-mask-image", clonedNode, options)];
            case 9:
              _b = _e.sent();
              _e.label = 10;
            case 10:
              _b;
              return [
                2
                /*return*/
              ];
          }
        });
      });
    }
    function embedImageNode(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function() {
        var isImageElement, url, dataURL;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              isImageElement = (0, util_1.isInstanceOfElement)(clonedNode, HTMLImageElement);
              if (!(isImageElement && !(0, dataurl_1.isDataUrl)(clonedNode.src)) && !((0, util_1.isInstanceOfElement)(clonedNode, SVGImageElement) && !(0, dataurl_1.isDataUrl)(clonedNode.href.baseVal))) {
                return [
                  2
                  /*return*/
                ];
              }
              url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
              return [4, (0, dataurl_1.resourceToDataURL)(url, (0, mimes_1.getMimeType)(url), options)];
            case 1:
              dataURL = _a.sent();
              return [4, new Promise(function(resolve, reject) {
                clonedNode.onload = resolve;
                clonedNode.onerror = options.onImageErrorHandler ? function() {
                  var attributes = [];
                  for (var _i = 0; _i < arguments.length; _i++) {
                    attributes[_i] = arguments[_i];
                  }
                  try {
                    resolve(options.onImageErrorHandler.apply(options, attributes));
                  } catch (error) {
                    reject(error);
                  }
                } : reject;
                var image = clonedNode;
                if (image.decode) {
                  image.decode = resolve;
                }
                if (image.loading === "lazy") {
                  image.loading = "eager";
                }
                if (isImageElement) {
                  clonedNode.srcset = "";
                  clonedNode.src = dataURL;
                } else {
                  clonedNode.href.baseVal = dataURL;
                }
              })];
            case 2:
              _a.sent();
              return [
                2
                /*return*/
              ];
          }
        });
      });
    }
    function embedChildren(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function() {
        var children, deferreds;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              children = (0, util_1.toArray)(clonedNode.childNodes);
              deferreds = children.map(function(child) {
                return embedImages(child, options);
              });
              return [4, Promise.all(deferreds).then(function() {
                return clonedNode;
              })];
            case 1:
              _a.sent();
              return [
                2
                /*return*/
              ];
          }
        });
      });
    }
    function embedImages(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              if (!(0, util_1.isInstanceOfElement)(clonedNode, Element)) return [3, 4];
              return [4, embedBackground(clonedNode, options)];
            case 1:
              _a.sent();
              return [4, embedImageNode(clonedNode, options)];
            case 2:
              _a.sent();
              return [4, embedChildren(clonedNode, options)];
            case 3:
              _a.sent();
              _a.label = 4;
            case 4:
              return [
                2
                /*return*/
              ];
          }
        });
      });
    }
    exports.embedImages = embedImages;
  }
});

// node_modules/html-to-image/lib/apply-style.js
var require_apply_style = __commonJS({
  "node_modules/html-to-image/lib/apply-style.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyStyle = void 0;
    function applyStyle(node, options) {
      var style = node.style;
      if (options.backgroundColor) {
        style.backgroundColor = options.backgroundColor;
      }
      if (options.width) {
        style.width = "".concat(options.width, "px");
      }
      if (options.height) {
        style.height = "".concat(options.height, "px");
      }
      var manual = options.style;
      if (manual != null) {
        Object.keys(manual).forEach(function(key) {
          style[key] = manual[key];
        });
      }
      return node;
    }
    exports.applyStyle = applyStyle;
  }
});

// node_modules/html-to-image/lib/embed-webfonts.js
var require_embed_webfonts = __commonJS({
  "node_modules/html-to-image/lib/embed-webfonts.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.embedWebFonts = exports.getWebFontCSS = void 0;
    var util_1 = require_util();
    var dataurl_1 = require_dataurl();
    var embed_resources_1 = require_embed_resources();
    var cssFetchCache = {};
    function fetchCSS(url) {
      return __awaiter(this, void 0, void 0, function() {
        var cache, res, cssText;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              cache = cssFetchCache[url];
              if (cache != null) {
                return [2, cache];
              }
              return [4, fetch(url)];
            case 1:
              res = _a.sent();
              return [4, res.text()];
            case 2:
              cssText = _a.sent();
              cache = { url, cssText };
              cssFetchCache[url] = cache;
              return [2, cache];
          }
        });
      });
    }
    function embedFonts(data, options) {
      return __awaiter(this, void 0, void 0, function() {
        var cssText, regexUrl, fontLocs, loadFonts;
        var _this = this;
        return __generator(this, function(_a) {
          cssText = data.cssText;
          regexUrl = /url\(["']?([^"')]+)["']?\)/g;
          fontLocs = cssText.match(/url\([^)]+\)/g) || [];
          loadFonts = fontLocs.map(function(loc) {
            return __awaiter(_this, void 0, void 0, function() {
              var url;
              return __generator(this, function(_a2) {
                url = loc.replace(regexUrl, "$1");
                if (!url.startsWith("https://")) {
                  url = new URL(url, data.url).href;
                }
                return [2, (0, dataurl_1.fetchAsDataURL)(url, options.fetchRequestInit, function(_a3) {
                  var result = _a3.result;
                  cssText = cssText.replace(loc, "url(".concat(result, ")"));
                  return [loc, result];
                })];
              });
            });
          });
          return [2, Promise.all(loadFonts).then(function() {
            return cssText;
          })];
        });
      });
    }
    function parseCSS(source) {
      if (source == null) {
        return [];
      }
      var result = [];
      var commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
      var cssText = source.replace(commentsRegex, "");
      var keyframesRegex = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
      while (true) {
        var matches = keyframesRegex.exec(cssText);
        if (matches === null) {
          break;
        }
        result.push(matches[0]);
      }
      cssText = cssText.replace(keyframesRegex, "");
      var importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
      var combinedCSSRegex = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})";
      var unifiedRegex = new RegExp(combinedCSSRegex, "gi");
      while (true) {
        var matches = importRegex.exec(cssText);
        if (matches === null) {
          matches = unifiedRegex.exec(cssText);
          if (matches === null) {
            break;
          } else {
            importRegex.lastIndex = unifiedRegex.lastIndex;
          }
        } else {
          unifiedRegex.lastIndex = importRegex.lastIndex;
        }
        result.push(matches[0]);
      }
      return result;
    }
    function getCSSRules(styleSheets, options) {
      return __awaiter(this, void 0, void 0, function() {
        var ret, deferreds;
        return __generator(this, function(_a) {
          ret = [];
          deferreds = [];
          styleSheets.forEach(function(sheet) {
            if ("cssRules" in sheet) {
              try {
                (0, util_1.toArray)(sheet.cssRules || []).forEach(function(item, index) {
                  if (item.type === CSSRule.IMPORT_RULE) {
                    var importIndex_1 = index + 1;
                    var url = item.href;
                    var deferred = fetchCSS(url).then(function(metadata) {
                      return embedFonts(metadata, options);
                    }).then(function(cssText) {
                      return parseCSS(cssText).forEach(function(rule) {
                        try {
                          sheet.insertRule(rule, rule.startsWith("@import") ? importIndex_1 += 1 : sheet.cssRules.length);
                        } catch (error) {
                          console.error("Error inserting rule from remote css", {
                            rule,
                            error
                          });
                        }
                      });
                    }).catch(function(e) {
                      console.error("Error loading remote css", e.toString());
                    });
                    deferreds.push(deferred);
                  }
                });
              } catch (e) {
                var inline_1 = styleSheets.find(function(a) {
                  return a.href == null;
                }) || document.styleSheets[0];
                if (sheet.href != null) {
                  deferreds.push(fetchCSS(sheet.href).then(function(metadata) {
                    return embedFonts(metadata, options);
                  }).then(function(cssText) {
                    return parseCSS(cssText).forEach(function(rule) {
                      inline_1.insertRule(rule, inline_1.cssRules.length);
                    });
                  }).catch(function(err) {
                    console.error("Error loading remote stylesheet", err);
                  }));
                }
                console.error("Error inlining remote css file", e);
              }
            }
          });
          return [2, Promise.all(deferreds).then(function() {
            styleSheets.forEach(function(sheet) {
              if ("cssRules" in sheet) {
                try {
                  (0, util_1.toArray)(sheet.cssRules || []).forEach(function(item) {
                    ret.push(item);
                  });
                } catch (e) {
                  console.error("Error while reading CSS rules from ".concat(sheet.href), e);
                }
              }
            });
            return ret;
          })];
        });
      });
    }
    function getWebFontRules(cssRules) {
      return cssRules.filter(function(rule) {
        return rule.type === CSSRule.FONT_FACE_RULE;
      }).filter(function(rule) {
        return (0, embed_resources_1.shouldEmbed)(rule.style.getPropertyValue("src"));
      });
    }
    function parseWebFontRules(node, options) {
      return __awaiter(this, void 0, void 0, function() {
        var styleSheets, cssRules;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              if (node.ownerDocument == null) {
                throw new Error("Provided element is not within a Document");
              }
              styleSheets = (0, util_1.toArray)(node.ownerDocument.styleSheets);
              return [4, getCSSRules(styleSheets, options)];
            case 1:
              cssRules = _a.sent();
              return [2, getWebFontRules(cssRules)];
          }
        });
      });
    }
    function normalizeFontFamily(font) {
      return font.trim().replace(/["']/g, "");
    }
    function getUsedFonts(node) {
      var fonts = /* @__PURE__ */ new Set();
      function traverse(node2) {
        var fontFamily = node2.style.fontFamily || getComputedStyle(node2).fontFamily;
        fontFamily.split(",").forEach(function(font) {
          fonts.add(normalizeFontFamily(font));
        });
        Array.from(node2.children).forEach(function(child) {
          if (child instanceof HTMLElement) {
            traverse(child);
          }
        });
      }
      traverse(node);
      return fonts;
    }
    function getWebFontCSS(node, options) {
      return __awaiter(this, void 0, void 0, function() {
        var rules, usedFonts, cssTexts;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4, parseWebFontRules(node, options)];
            case 1:
              rules = _a.sent();
              usedFonts = getUsedFonts(node);
              return [4, Promise.all(rules.filter(function(rule) {
                return usedFonts.has(normalizeFontFamily(rule.style.fontFamily));
              }).map(function(rule) {
                var baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
                return (0, embed_resources_1.embedResources)(rule.cssText, baseUrl, options);
              }))];
            case 2:
              cssTexts = _a.sent();
              return [2, cssTexts.join("\n")];
          }
        });
      });
    }
    exports.getWebFontCSS = getWebFontCSS;
    function embedWebFonts(clonedNode, options) {
      return __awaiter(this, void 0, void 0, function() {
        var cssText, _a, _b, styleNode, sytleContent;
        return __generator(this, function(_c) {
          switch (_c.label) {
            case 0:
              if (!(options.fontEmbedCSS != null)) return [3, 1];
              _a = options.fontEmbedCSS;
              return [3, 5];
            case 1:
              if (!options.skipFonts) return [3, 2];
              _b = null;
              return [3, 4];
            case 2:
              return [4, getWebFontCSS(clonedNode, options)];
            case 3:
              _b = _c.sent();
              _c.label = 4;
            case 4:
              _a = _b;
              _c.label = 5;
            case 5:
              cssText = _a;
              if (cssText) {
                styleNode = document.createElement("style");
                sytleContent = document.createTextNode(cssText);
                styleNode.appendChild(sytleContent);
                if (clonedNode.firstChild) {
                  clonedNode.insertBefore(styleNode, clonedNode.firstChild);
                } else {
                  clonedNode.appendChild(styleNode);
                }
              }
              return [
                2
                /*return*/
              ];
          }
        });
      });
    }
    exports.embedWebFonts = embedWebFonts;
  }
});

// node_modules/html-to-image/lib/index.js
var require_lib = __commonJS({
  "node_modules/html-to-image/lib/index.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFontEmbedCSS = exports.toBlob = exports.toJpeg = exports.toPng = exports.toPixelData = exports.toCanvas = exports.toSvg = void 0;
    var clone_node_1 = require_clone_node();
    var embed_images_1 = require_embed_images();
    var apply_style_1 = require_apply_style();
    var embed_webfonts_1 = require_embed_webfonts();
    var util_1 = require_util();
    function toSvg(node, options) {
      if (options === void 0) {
        options = {};
      }
      return __awaiter(this, void 0, void 0, function() {
        var _a, width, height, clonedNode, datauri;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              _a = (0, util_1.getImageSize)(node, options), width = _a.width, height = _a.height;
              return [4, (0, clone_node_1.cloneNode)(node, options, true)];
            case 1:
              clonedNode = _b.sent();
              return [4, (0, embed_webfonts_1.embedWebFonts)(clonedNode, options)];
            case 2:
              _b.sent();
              return [4, (0, embed_images_1.embedImages)(clonedNode, options)];
            case 3:
              _b.sent();
              (0, apply_style_1.applyStyle)(clonedNode, options);
              return [4, (0, util_1.nodeToDataURL)(clonedNode, width, height)];
            case 4:
              datauri = _b.sent();
              return [2, datauri];
          }
        });
      });
    }
    exports.toSvg = toSvg;
    function toCanvas(node, options) {
      if (options === void 0) {
        options = {};
      }
      return __awaiter(this, void 0, void 0, function() {
        var _a, width, height, svg, img, canvas, context, ratio, canvasWidth, canvasHeight;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              _a = (0, util_1.getImageSize)(node, options), width = _a.width, height = _a.height;
              return [4, toSvg(node, options)];
            case 1:
              svg = _b.sent();
              return [4, (0, util_1.createImage)(svg)];
            case 2:
              img = _b.sent();
              canvas = document.createElement("canvas");
              context = canvas.getContext("2d");
              ratio = options.pixelRatio || (0, util_1.getPixelRatio)();
              canvasWidth = options.canvasWidth || width;
              canvasHeight = options.canvasHeight || height;
              canvas.width = canvasWidth * ratio;
              canvas.height = canvasHeight * ratio;
              if (!options.skipAutoScale) {
                (0, util_1.checkCanvasDimensions)(canvas);
              }
              canvas.style.width = "".concat(canvasWidth);
              canvas.style.height = "".concat(canvasHeight);
              if (options.backgroundColor) {
                context.fillStyle = options.backgroundColor;
                context.fillRect(0, 0, canvas.width, canvas.height);
              }
              context.drawImage(img, 0, 0, canvas.width, canvas.height);
              return [2, canvas];
          }
        });
      });
    }
    exports.toCanvas = toCanvas;
    function toPixelData(node, options) {
      if (options === void 0) {
        options = {};
      }
      return __awaiter(this, void 0, void 0, function() {
        var _a, width, height, canvas, ctx;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              _a = (0, util_1.getImageSize)(node, options), width = _a.width, height = _a.height;
              return [4, toCanvas(node, options)];
            case 1:
              canvas = _b.sent();
              ctx = canvas.getContext("2d");
              return [2, ctx.getImageData(0, 0, width, height).data];
          }
        });
      });
    }
    exports.toPixelData = toPixelData;
    function toPng2(node, options) {
      if (options === void 0) {
        options = {};
      }
      return __awaiter(this, void 0, void 0, function() {
        var canvas;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4, toCanvas(node, options)];
            case 1:
              canvas = _a.sent();
              return [2, canvas.toDataURL()];
          }
        });
      });
    }
    exports.toPng = toPng2;
    function toJpeg(node, options) {
      if (options === void 0) {
        options = {};
      }
      return __awaiter(this, void 0, void 0, function() {
        var canvas;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4, toCanvas(node, options)];
            case 1:
              canvas = _a.sent();
              return [2, canvas.toDataURL("image/jpeg", options.quality || 1)];
          }
        });
      });
    }
    exports.toJpeg = toJpeg;
    function toBlob(node, options) {
      if (options === void 0) {
        options = {};
      }
      return __awaiter(this, void 0, void 0, function() {
        var canvas, blob;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4, toCanvas(node, options)];
            case 1:
              canvas = _a.sent();
              return [4, (0, util_1.canvasToBlob)(canvas)];
            case 2:
              blob = _a.sent();
              return [2, blob];
          }
        });
      });
    }
    exports.toBlob = toBlob;
    function getFontEmbedCSS(node, options) {
      if (options === void 0) {
        options = {};
      }
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          return [2, (0, embed_webfonts_1.getWebFontCSS)(node, options)];
        });
      });
    }
    exports.getFontEmbedCSS = getFontEmbedCSS;
  }
});

// test-render.jsx
import React5 from "react";
import { renderToString } from "react-dom/server";

// src/components/EmployeeDashboard.jsx
import React4, { useState as useState2, useMemo as useMemo2 } from "react";
import { Users, Clock as Clock2, DollarSign as DollarSign2, Plus, Trash2 as Trash22, Edit, UserCheck as UserCheck2, UserMinus as UserMinus2, Calendar as Calendar3, Printer as Printer2, FileText, CheckCircle as CheckCircle3, History as History2, Wallet as Wallet2, XCircle as XCircle2, ShoppingCart as ShoppingCart2, Briefcase as Briefcase2, Download, ExternalLink as ExternalLink2, User as User3 } from "lucide-react";

// node_modules/@firebase/util/dist/postinstall.mjs
var getDefaultsFromPostinstall = () => void 0;

// node_modules/@firebase/util/dist/node-esm/index.node.esm.js
var CONSTANTS = {
  /**
   * @define {boolean} Whether this is the client Node.js SDK.
   */
  NODE_CLIENT: false,
  /**
   * @define {boolean} Whether this is the Admin Node.js SDK.
   */
  NODE_ADMIN: false,
  /**
   * Firebase SDK Version
   */
  SDK_VERSION: "${JSCORE_VERSION}"
};
var stringToByteArray$1 = function(str) {
  const out = [];
  let p = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = c >> 6 | 192;
      out[p++] = c & 63 | 128;
    } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
      c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
      out[p++] = c >> 18 | 240;
      out[p++] = c >> 12 & 63 | 128;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    } else {
      out[p++] = c >> 12 | 224;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    }
  }
  return out;
};
var byteArrayToString = function(bytes) {
  const out = [];
  let pos = 0, c = 0;
  while (pos < bytes.length) {
    const c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      const c2 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
    } else if (c1 > 239 && c1 < 365) {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      const c4 = bytes[pos++];
      const u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 65536;
      out[c++] = String.fromCharCode(55296 + (u >> 10));
      out[c++] = String.fromCharCode(56320 + (u & 1023));
    } else {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
    }
  }
  return out.join("");
};
var base64 = {
  /**
   * Maps bytes to characters.
   */
  byteToCharMap_: null,
  /**
   * Maps characters to bytes.
   */
  charToByteMap_: null,
  /**
   * Maps bytes to websafe characters.
   * @private
   */
  byteToCharMapWebSafe_: null,
  /**
   * Maps websafe characters to bytes.
   * @private
   */
  charToByteMapWebSafe_: null,
  /**
   * Our default alphabet, shared between
   * ENCODED_VALS and ENCODED_VALS_WEBSAFE
   */
  ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  /**
   * Our default alphabet. Value 64 (=) is special; it means "nothing."
   */
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/=";
  },
  /**
   * Our websafe alphabet.
   */
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_.";
  },
  /**
   * Whether this browser supports the atob and btoa functions. This extension
   * started at Mozilla but is now implemented by many browsers. We use the
   * ASSUME_* variables to avoid pulling in the full useragent detection library
   * but still allowing the standard per-browser compilations.
   *
   */
  HAS_NATIVE_SUPPORT: typeof atob === "function",
  /**
   * Base64-encode an array of bytes.
   *
   * @param input An array of bytes (numbers with
   *     value in [0, 255]) to encode.
   * @param webSafe Boolean indicating we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeByteArray(input, webSafe) {
    if (!Array.isArray(input)) {
      throw Error("encodeByteArray takes an array as a parameter");
    }
    this.init_();
    const byteToCharMap = webSafe ? this.byteToCharMapWebSafe_ : this.byteToCharMap_;
    const output = [];
    for (let i = 0; i < input.length; i += 3) {
      const byte1 = input[i];
      const haveByte2 = i + 1 < input.length;
      const byte2 = haveByte2 ? input[i + 1] : 0;
      const haveByte3 = i + 2 < input.length;
      const byte3 = haveByte3 ? input[i + 2] : 0;
      const outByte1 = byte1 >> 2;
      const outByte2 = (byte1 & 3) << 4 | byte2 >> 4;
      let outByte3 = (byte2 & 15) << 2 | byte3 >> 6;
      let outByte4 = byte3 & 63;
      if (!haveByte3) {
        outByte4 = 64;
        if (!haveByte2) {
          outByte3 = 64;
        }
      }
      output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
    }
    return output.join("");
  },
  /**
   * Base64-encode a string.
   *
   * @param input A string to encode.
   * @param webSafe If true, we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return btoa(input);
    }
    return this.encodeByteArray(stringToByteArray$1(input), webSafe);
  },
  /**
   * Base64-decode a string.
   *
   * @param input to decode.
   * @param webSafe True if we should use the
   *     alternative alphabet.
   * @return string representing the decoded value.
   */
  decodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return atob(input);
    }
    return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
  },
  /**
   * Base64-decode a string.
   *
   * In base-64 decoding, groups of four characters are converted into three
   * bytes.  If the encoder did not apply padding, the input length may not
   * be a multiple of 4.
   *
   * In this case, the last group will have fewer than 4 characters, and
   * padding will be inferred.  If the group has one or two characters, it decodes
   * to one byte.  If the group has three characters, it decodes to two bytes.
   *
   * @param input Input to decode.
   * @param webSafe True if we should use the web-safe alphabet.
   * @return bytes representing the decoded value.
   */
  decodeStringToByteArray(input, webSafe) {
    this.init_();
    const charToByteMap = webSafe ? this.charToByteMapWebSafe_ : this.charToByteMap_;
    const output = [];
    for (let i = 0; i < input.length; ) {
      const byte1 = charToByteMap[input.charAt(i++)];
      const haveByte2 = i < input.length;
      const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
      ++i;
      const haveByte3 = i < input.length;
      const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      const haveByte4 = i < input.length;
      const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
        throw new DecodeBase64StringError();
      }
      const outByte1 = byte1 << 2 | byte2 >> 4;
      output.push(outByte1);
      if (byte3 !== 64) {
        const outByte2 = byte2 << 4 & 240 | byte3 >> 2;
        output.push(outByte2);
        if (byte4 !== 64) {
          const outByte3 = byte3 << 6 & 192 | byte4;
          output.push(outByte3);
        }
      }
    }
    return output;
  },
  /**
   * Lazy static initialization function. Called before
   * accessing any of the static map variables.
   * @private
   */
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {};
      this.charToByteMap_ = {};
      this.byteToCharMapWebSafe_ = {};
      this.charToByteMapWebSafe_ = {};
      for (let i = 0; i < this.ENCODED_VALS.length; i++) {
        this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
        this.charToByteMap_[this.byteToCharMap_[i]] = i;
        this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
        this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
        if (i >= this.ENCODED_VALS_BASE.length) {
          this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
          this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
        }
      }
    }
  }
};
var DecodeBase64StringError = class extends Error {
  constructor() {
    super(...arguments);
    this.name = "DecodeBase64StringError";
  }
};
var base64Encode = function(str) {
  const utf8Bytes = stringToByteArray$1(str);
  return base64.encodeByteArray(utf8Bytes, true);
};
var base64urlEncodeWithoutPadding = function(str) {
  return base64Encode(str).replace(/\./g, "");
};
var base64Decode = function(str) {
  try {
    return base64.decodeString(str, true);
  } catch (e) {
    console.error("base64Decode failed: ", e);
  }
  return null;
};
function getGlobal() {
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("Unable to locate global object.");
}
var getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
var getDefaultsFromEnvVariable = () => {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return;
  }
  const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
  if (defaultsJsonString) {
    return JSON.parse(defaultsJsonString);
  }
};
var getDefaultsFromCookie = () => {
  if (typeof document === "undefined") {
    return;
  }
  let match;
  try {
    match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
  } catch (e) {
    return;
  }
  const decoded = match && base64Decode(match[1]);
  return decoded && JSON.parse(decoded);
};
var getDefaults = () => {
  try {
    return getDefaultsFromPostinstall() || getDefaultsFromGlobal() || getDefaultsFromEnvVariable() || getDefaultsFromCookie();
  } catch (e) {
    console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
    return;
  }
};
var getDefaultEmulatorHost = (productName) => getDefaults()?.emulatorHosts?.[productName];
var getDefaultEmulatorHostnameAndPort = (productName) => {
  const host = getDefaultEmulatorHost(productName);
  if (!host) {
    return void 0;
  }
  const separatorIndex = host.lastIndexOf(":");
  if (separatorIndex <= 0 || separatorIndex + 1 === host.length) {
    throw new Error(`Invalid host ${host} with no separate hostname and port!`);
  }
  const port = parseInt(host.substring(separatorIndex + 1), 10);
  if (host[0] === "[") {
    return [host.substring(1, separatorIndex - 1), port];
  } else {
    return [host.substring(0, separatorIndex), port];
  }
};
var getDefaultAppConfig = () => getDefaults()?.config;
var Deferred = class {
  constructor() {
    this.reject = () => {
    };
    this.resolve = () => {
    };
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
  /**
   * Our API internals are not promisified and cannot because our callback APIs have subtle expectations around
   * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
   * and returns a node-style callback which will resolve or reject the Deferred's promise.
   */
  wrapCallback(callback) {
    return (error, value) => {
      if (error) {
        this.reject(error);
      } else {
        this.resolve(value);
      }
      if (typeof callback === "function") {
        this.promise.catch(() => {
        });
        if (callback.length === 1) {
          callback(error);
        } else {
          callback(error, value);
        }
      }
    };
  }
};
function createMockUserToken(token, projectId) {
  if (token.uid) {
    throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');
  }
  const header = {
    alg: "none",
    type: "JWT"
  };
  const project = projectId || "demo-project";
  const iat = token.iat || 0;
  const sub = token.sub || token.user_id;
  if (!sub) {
    throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");
  }
  const payload = {
    // Set all required fields to decent defaults
    iss: `https://securetoken.google.com/${project}`,
    aud: project,
    iat,
    exp: iat + 3600,
    auth_time: iat,
    sub,
    user_id: sub,
    firebase: {
      sign_in_provider: "custom",
      identities: {}
    },
    // Override with user options
    ...token
  };
  const signature = "";
  return [
    base64urlEncodeWithoutPadding(JSON.stringify(header)),
    base64urlEncodeWithoutPadding(JSON.stringify(payload)),
    signature
  ].join(".");
}
function getUA() {
  if (typeof navigator !== "undefined" && typeof navigator["userAgent"] === "string") {
    return navigator["userAgent"];
  } else {
    return "";
  }
}
function isMobileCordova() {
  return typeof window !== "undefined" && // @ts-ignore Setting up an broadly applicable index signature for Window
  // just to deal with this case would probably be a bad idea.
  !!(window["cordova"] || window["phonegap"] || window["PhoneGap"]) && /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(getUA());
}
function isCloudflareWorker() {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}
function isBrowserExtension() {
  const runtime = typeof chrome === "object" ? chrome.runtime : typeof browser === "object" ? browser.runtime : void 0;
  return typeof runtime === "object" && runtime.id !== void 0;
}
function isReactNative() {
  return typeof navigator === "object" && navigator["product"] === "ReactNative";
}
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB === "object";
  } catch (e) {
    return false;
  }
}
function validateIndexedDBOpenable() {
  return new Promise((resolve, reject) => {
    try {
      let preExist = true;
      const DB_CHECK_NAME = "validate-browser-context-for-indexeddb-analytics-module";
      const request = self.indexedDB.open(DB_CHECK_NAME);
      request.onsuccess = () => {
        request.result.close();
        if (!preExist) {
          self.indexedDB.deleteDatabase(DB_CHECK_NAME);
        }
        resolve(true);
      };
      request.onupgradeneeded = () => {
        preExist = false;
      };
      request.onerror = () => {
        reject(request.error?.message || "");
      };
    } catch (error) {
      reject(error);
    }
  });
}
var ERROR_NAME = "FirebaseError";
var FirebaseError = class _FirebaseError extends Error {
  constructor(code, message, customData) {
    super(message);
    this.code = code;
    this.customData = customData;
    this.name = ERROR_NAME;
    Object.setPrototypeOf(this, _FirebaseError.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorFactory.prototype.create);
    }
  }
};
var ErrorFactory = class {
  constructor(service, serviceName, errors) {
    this.service = service;
    this.serviceName = serviceName;
    this.errors = errors;
  }
  create(code, ...data) {
    const customData = data[0] || {};
    const fullCode = `${this.service}/${code}`;
    const template = this.errors[code];
    const message = template ? replaceTemplate(template, customData) : "Error";
    const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
    const error = new FirebaseError(fullCode, fullMessage, customData);
    return error;
  }
};
function replaceTemplate(template, data) {
  return template.replace(PATTERN, (_, key) => {
    const value = data[key];
    return value != null ? String(value) : `<${key}?>`;
  });
}
var PATTERN = /\{\$([^}]+)}/g;
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  for (const k of aKeys) {
    if (!bKeys.includes(k)) {
      return false;
    }
    const aProp = a[k];
    const bProp = b[k];
    if (isObject(aProp) && isObject(bProp)) {
      if (!deepEqual(aProp, bProp)) {
        return false;
      }
    } else if (aProp !== bProp) {
      return false;
    }
  }
  for (const k of bKeys) {
    if (!aKeys.includes(k)) {
      return false;
    }
  }
  return true;
}
function isObject(thing) {
  return thing !== null && typeof thing === "object";
}
function querystring(querystringParams) {
  const params = [];
  for (const [key, value] of Object.entries(querystringParams)) {
    if (Array.isArray(value)) {
      value.forEach((arrayVal) => {
        params.push(encodeURIComponent(key) + "=" + encodeURIComponent(arrayVal));
      });
    } else {
      params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
  }
  return params.length ? "&" + params.join("&") : "";
}
function querystringDecode(querystring2) {
  const obj = {};
  const tokens = querystring2.replace(/^\?/, "").split("&");
  tokens.forEach((token) => {
    if (token) {
      const [key, value] = token.split("=");
      obj[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  return obj;
}
function extractQuerystring(url) {
  const queryStart = url.indexOf("?");
  if (!queryStart) {
    return "";
  }
  const fragmentStart = url.indexOf("#", queryStart);
  return url.substring(queryStart, fragmentStart > 0 ? fragmentStart : void 0);
}
function createSubscribe(executor, onNoObservers) {
  const proxy = new ObserverProxy(executor, onNoObservers);
  return proxy.subscribe.bind(proxy);
}
var ObserverProxy = class {
  /**
   * @param executor Function which can make calls to a single Observer
   *     as a proxy.
   * @param onNoObservers Callback when count of Observers goes to zero.
   */
  constructor(executor, onNoObservers) {
    this.observers = [];
    this.unsubscribes = [];
    this.observerCount = 0;
    this.task = Promise.resolve();
    this.finalized = false;
    this.onNoObservers = onNoObservers;
    this.task.then(() => {
      executor(this);
    }).catch((e) => {
      this.error(e);
    });
  }
  next(value) {
    this.forEachObserver((observer) => {
      observer.next(value);
    });
  }
  error(error) {
    this.forEachObserver((observer) => {
      observer.error(error);
    });
    this.close(error);
  }
  complete() {
    this.forEachObserver((observer) => {
      observer.complete();
    });
    this.close();
  }
  /**
   * Subscribe function that can be used to add an Observer to the fan-out list.
   *
   * - We require that no event is sent to a subscriber synchronously to their
   *   call to subscribe().
   */
  subscribe(nextOrObserver, error, complete) {
    let observer;
    if (nextOrObserver === void 0 && error === void 0 && complete === void 0) {
      throw new Error("Missing Observer.");
    }
    if (implementsAnyMethods(nextOrObserver, [
      "next",
      "error",
      "complete"
    ])) {
      observer = nextOrObserver;
    } else {
      observer = {
        next: nextOrObserver,
        error,
        complete
      };
    }
    if (observer.next === void 0) {
      observer.next = noop;
    }
    if (observer.error === void 0) {
      observer.error = noop;
    }
    if (observer.complete === void 0) {
      observer.complete = noop;
    }
    const unsub = this.unsubscribeOne.bind(this, this.observers.length);
    if (this.finalized) {
      this.task.then(() => {
        try {
          if (this.finalError) {
            observer.error(this.finalError);
          } else {
            observer.complete();
          }
        } catch (e) {
        }
        return;
      });
    }
    this.observers.push(observer);
    return unsub;
  }
  // Unsubscribe is synchronous - we guarantee that no events are sent to
  // any unsubscribed Observer.
  unsubscribeOne(i) {
    if (this.observers === void 0 || this.observers[i] === void 0) {
      return;
    }
    delete this.observers[i];
    this.observerCount -= 1;
    if (this.observerCount === 0 && this.onNoObservers !== void 0) {
      this.onNoObservers(this);
    }
  }
  forEachObserver(fn) {
    if (this.finalized) {
      return;
    }
    for (let i = 0; i < this.observers.length; i++) {
      this.sendOne(i, fn);
    }
  }
  // Call the Observer via one of it's callback function. We are careful to
  // confirm that the observe has not been unsubscribed since this asynchronous
  // function had been queued.
  sendOne(i, fn) {
    this.task.then(() => {
      if (this.observers !== void 0 && this.observers[i] !== void 0) {
        try {
          fn(this.observers[i]);
        } catch (e) {
          if (typeof console !== "undefined" && console.error) {
            console.error(e);
          }
        }
      }
    });
  }
  close(err) {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    if (err !== void 0) {
      this.finalError = err;
    }
    this.task.then(() => {
      this.observers = void 0;
      this.onNoObservers = void 0;
    });
  }
};
function implementsAnyMethods(obj, methods) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  for (const method of methods) {
    if (method in obj && typeof obj[method] === "function") {
      return true;
    }
  }
  return false;
}
function noop() {
}
var MAX_VALUE_MILLIS = 4 * 60 * 60 * 1e3;
function getModularInstance(service) {
  if (service && service._delegate) {
    return service._delegate;
  } else {
    return service;
  }
}
function isCloudWorkstation(url) {
  try {
    const host = url.startsWith("http://") || url.startsWith("https://") ? new URL(url).hostname : url;
    return host.endsWith(".cloudworkstations.dev");
  } catch {
    return false;
  }
}
async function pingServer(endpoint) {
  const result = await fetch(endpoint, {
    credentials: "include"
  });
  return result.ok;
}
CONSTANTS.NODE_CLIENT = true;

// node_modules/@firebase/component/dist/esm/index.esm.js
var Component = class {
  /**
   *
   * @param name The public service name, e.g. app, auth, firestore, database
   * @param instanceFactory Service factory responsible for creating the public interface
   * @param type whether the service provided by the component is public or private
   */
  constructor(name5, instanceFactory, type) {
    this.name = name5;
    this.instanceFactory = instanceFactory;
    this.type = type;
    this.multipleInstances = false;
    this.serviceProps = {};
    this.instantiationMode = "LAZY";
    this.onInstanceCreated = null;
  }
  setInstantiationMode(mode) {
    this.instantiationMode = mode;
    return this;
  }
  setMultipleInstances(multipleInstances) {
    this.multipleInstances = multipleInstances;
    return this;
  }
  setServiceProps(props) {
    this.serviceProps = props;
    return this;
  }
  setInstanceCreatedCallback(callback) {
    this.onInstanceCreated = callback;
    return this;
  }
};
var DEFAULT_ENTRY_NAME = "[DEFAULT]";
var Provider = class {
  constructor(name5, container) {
    this.name = name5;
    this.container = container;
    this.component = null;
    this.instances = /* @__PURE__ */ new Map();
    this.instancesDeferred = /* @__PURE__ */ new Map();
    this.instancesOptions = /* @__PURE__ */ new Map();
    this.onInitCallbacks = /* @__PURE__ */ new Map();
  }
  /**
   * @param identifier A provider can provide multiple instances of a service
   * if this.component.multipleInstances is true.
   */
  get(identifier) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    if (!this.instancesDeferred.has(normalizedIdentifier)) {
      const deferred = new Deferred();
      this.instancesDeferred.set(normalizedIdentifier, deferred);
      if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
        try {
          const instance = this.getOrInitializeService({
            instanceIdentifier: normalizedIdentifier
          });
          if (instance) {
            deferred.resolve(instance);
          }
        } catch (e) {
        }
      }
    }
    return this.instancesDeferred.get(normalizedIdentifier).promise;
  }
  getImmediate(options) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(options?.identifier);
    const optional = options?.optional ?? false;
    if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
      try {
        return this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier
        });
      } catch (e) {
        if (optional) {
          return null;
        } else {
          throw e;
        }
      }
    } else {
      if (optional) {
        return null;
      } else {
        throw Error(`Service ${this.name} is not available`);
      }
    }
  }
  getComponent() {
    return this.component;
  }
  setComponent(component) {
    if (component.name !== this.name) {
      throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
    }
    if (this.component) {
      throw Error(`Component for ${this.name} has already been provided`);
    }
    this.component = component;
    if (!this.shouldAutoInitialize()) {
      return;
    }
    if (isComponentEager(component)) {
      try {
        this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME });
      } catch (e) {
      }
    }
    for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
      const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
      try {
        const instance = this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier
        });
        instanceDeferred.resolve(instance);
      } catch (e) {
      }
    }
  }
  clearInstance(identifier = DEFAULT_ENTRY_NAME) {
    this.instancesDeferred.delete(identifier);
    this.instancesOptions.delete(identifier);
    this.instances.delete(identifier);
  }
  // app.delete() will call this method on every provider to delete the services
  // TODO: should we mark the provider as deleted?
  async delete() {
    const services = Array.from(this.instances.values());
    await Promise.all([
      ...services.filter((service) => "INTERNAL" in service).map((service) => service.INTERNAL.delete()),
      ...services.filter((service) => "_delete" in service).map((service) => service._delete())
    ]);
  }
  isComponentSet() {
    return this.component != null;
  }
  isInitialized(identifier = DEFAULT_ENTRY_NAME) {
    return this.instances.has(identifier);
  }
  getOptions(identifier = DEFAULT_ENTRY_NAME) {
    return this.instancesOptions.get(identifier) || {};
  }
  initialize(opts = {}) {
    const { options = {} } = opts;
    const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
    if (this.isInitialized(normalizedIdentifier)) {
      throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
    }
    if (!this.isComponentSet()) {
      throw Error(`Component ${this.name} has not been registered yet`);
    }
    const instance = this.getOrInitializeService({
      instanceIdentifier: normalizedIdentifier,
      options
    });
    for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
      const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
      if (normalizedIdentifier === normalizedDeferredIdentifier) {
        instanceDeferred.resolve(instance);
      }
    }
    return instance;
  }
  /**
   *
   * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
   * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
   *
   * @param identifier An optional instance identifier
   * @returns a function to unregister the callback
   */
  onInit(callback, identifier) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    const existingCallbacks = this.onInitCallbacks.get(normalizedIdentifier) ?? /* @__PURE__ */ new Set();
    existingCallbacks.add(callback);
    this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
    const existingInstance = this.instances.get(normalizedIdentifier);
    if (existingInstance) {
      callback(existingInstance, normalizedIdentifier);
    }
    return () => {
      existingCallbacks.delete(callback);
    };
  }
  /**
   * Invoke onInit callbacks synchronously
   * @param instance the service instance`
   */
  invokeOnInitCallbacks(instance, identifier) {
    const callbacks = this.onInitCallbacks.get(identifier);
    if (!callbacks) {
      return;
    }
    for (const callback of callbacks) {
      try {
        callback(instance, identifier);
      } catch {
      }
    }
  }
  getOrInitializeService({ instanceIdentifier, options = {} }) {
    let instance = this.instances.get(instanceIdentifier);
    if (!instance && this.component) {
      instance = this.component.instanceFactory(this.container, {
        instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
        options
      });
      this.instances.set(instanceIdentifier, instance);
      this.instancesOptions.set(instanceIdentifier, options);
      this.invokeOnInitCallbacks(instance, instanceIdentifier);
      if (this.component.onInstanceCreated) {
        try {
          this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
        } catch {
        }
      }
    }
    return instance || null;
  }
  normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME) {
    if (this.component) {
      return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME;
    } else {
      return identifier;
    }
  }
  shouldAutoInitialize() {
    return !!this.component && this.component.instantiationMode !== "EXPLICIT";
  }
};
function normalizeIdentifierForFactory(identifier) {
  return identifier === DEFAULT_ENTRY_NAME ? void 0 : identifier;
}
function isComponentEager(component) {
  return component.instantiationMode === "EAGER";
}
var ComponentContainer = class {
  constructor(name5) {
    this.name = name5;
    this.providers = /* @__PURE__ */ new Map();
  }
  /**
   *
   * @param component Component being added
   * @param overwrite When a component with the same name has already been registered,
   * if overwrite is true: overwrite the existing component with the new component and create a new
   * provider with the new component. It can be useful in tests where you want to use different mocks
   * for different tests.
   * if overwrite is false: throw an exception
   */
  addComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
    }
    provider.setComponent(component);
  }
  addOrOverwriteComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      this.providers.delete(component.name);
    }
    this.addComponent(component);
  }
  /**
   * getProvider provides a type safe interface where it can only be called with a field name
   * present in NameServiceMapping interface.
   *
   * Firebase SDKs providing services should extend NameServiceMapping interface to register
   * themselves.
   */
  getProvider(name5) {
    if (this.providers.has(name5)) {
      return this.providers.get(name5);
    }
    const provider = new Provider(name5, this);
    this.providers.set(name5, provider);
    return provider;
  }
  getProviders() {
    return Array.from(this.providers.values());
  }
};

// node_modules/@firebase/logger/dist/esm/index.esm.js
var instances = [];
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["VERBOSE"] = 1] = "VERBOSE";
  LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
  LogLevel2[LogLevel2["SILENT"] = 5] = "SILENT";
})(LogLevel || (LogLevel = {}));
var levelStringToEnum = {
  "debug": LogLevel.DEBUG,
  "verbose": LogLevel.VERBOSE,
  "info": LogLevel.INFO,
  "warn": LogLevel.WARN,
  "error": LogLevel.ERROR,
  "silent": LogLevel.SILENT
};
var defaultLogLevel = LogLevel.INFO;
var ConsoleMethod = {
  [LogLevel.DEBUG]: "log",
  [LogLevel.VERBOSE]: "log",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error"
};
var defaultLogHandler = (instance, logType, ...args) => {
  if (logType < instance.logLevel) {
    return;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const method = ConsoleMethod[logType];
  if (method) {
    console[method](`[${now}]  ${instance.name}:`, ...args);
  } else {
    throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
  }
};
var Logger = class {
  /**
   * Gives you an instance of a Logger to capture messages according to
   * Firebase's logging scheme.
   *
   * @param name The name that the logs will be associated with
   */
  constructor(name5) {
    this.name = name5;
    this._logLevel = defaultLogLevel;
    this._logHandler = defaultLogHandler;
    this._userLogHandler = null;
    instances.push(this);
  }
  get logLevel() {
    return this._logLevel;
  }
  set logLevel(val) {
    if (!(val in LogLevel)) {
      throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
    }
    this._logLevel = val;
  }
  // Workaround for setter/getter having to be the same type.
  setLogLevel(val) {
    this._logLevel = typeof val === "string" ? levelStringToEnum[val] : val;
  }
  get logHandler() {
    return this._logHandler;
  }
  set logHandler(val) {
    if (typeof val !== "function") {
      throw new TypeError("Value assigned to `logHandler` must be a function");
    }
    this._logHandler = val;
  }
  get userLogHandler() {
    return this._userLogHandler;
  }
  set userLogHandler(val) {
    this._userLogHandler = val;
  }
  /**
   * The functions below are all based on the `console` interface
   */
  debug(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
    this._logHandler(this, LogLevel.DEBUG, ...args);
  }
  log(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.VERBOSE, ...args);
    this._logHandler(this, LogLevel.VERBOSE, ...args);
  }
  info(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
    this._logHandler(this, LogLevel.INFO, ...args);
  }
  warn(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
    this._logHandler(this, LogLevel.WARN, ...args);
  }
  error(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
    this._logHandler(this, LogLevel.ERROR, ...args);
  }
};

// node_modules/idb/build/wrap-idb-value.js
var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
var idbProxyableTypes;
var cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
var cursorRequestMap = /* @__PURE__ */ new WeakMap();
var transactionDoneMap = /* @__PURE__ */ new WeakMap();
var transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
var transformCache = /* @__PURE__ */ new WeakMap();
var reverseTransformCache = /* @__PURE__ */ new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise.then((value) => {
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    }
  }).catch(() => {
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
var idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done")
        return transactionDoneMap.get(target);
      if (prop === "objectStoreNames") {
        return target.objectStoreNames || transactionStoreNamesMap.get(target);
      }
      if (prop === "store") {
        return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
      return true;
    }
    return prop in target;
  }
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
    return function(storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  }
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var unwrap = (value) => reverseTransformCache.get(value);

// node_modules/idb/build/index.js
function openDB(name5, version5, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name5, version5);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db2) => {
    if (terminated)
      db2.addEventListener("close", () => terminated());
    if (blocking) {
      db2.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = /* @__PURE__ */ new Map();
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
}));

// node_modules/@firebase/app/dist/esm/index.esm.js
var PlatformLoggerServiceImpl = class {
  constructor(container) {
    this.container = container;
  }
  // In initial implementation, this will be called by installations on
  // auth token refresh, and installations will send this string.
  getPlatformInfoString() {
    const providers = this.container.getProviders();
    return providers.map((provider) => {
      if (isVersionServiceProvider(provider)) {
        const service = provider.getImmediate();
        return `${service.library}/${service.version}`;
      } else {
        return null;
      }
    }).filter((logString) => logString).join(" ");
  }
};
function isVersionServiceProvider(provider) {
  const component = provider.getComponent();
  return component?.type === "VERSION";
}
var name$q = "@firebase/app";
var version$1 = "0.15.0";
var logger = new Logger("@firebase/app");
var name$p = "@firebase/app-compat";
var name$o = "@firebase/analytics-compat";
var name$n = "@firebase/analytics";
var name$m = "@firebase/app-check-compat";
var name$l = "@firebase/app-check";
var name$k = "@firebase/auth";
var name$j = "@firebase/auth-compat";
var name$i = "@firebase/database";
var name$h = "@firebase/data-connect";
var name$g = "@firebase/database-compat";
var name$f = "@firebase/functions";
var name$e = "@firebase/functions-compat";
var name$d = "@firebase/installations";
var name$c = "@firebase/installations-compat";
var name$b = "@firebase/messaging";
var name$a = "@firebase/messaging-compat";
var name$9 = "@firebase/performance";
var name$8 = "@firebase/performance-compat";
var name$7 = "@firebase/remote-config";
var name$6 = "@firebase/remote-config-compat";
var name$5 = "@firebase/storage";
var name$4 = "@firebase/storage-compat";
var name$3 = "@firebase/firestore";
var name$2 = "@firebase/ai";
var name$1 = "@firebase/firestore-compat";
var name = "firebase";
var version = "12.15.0";
var DEFAULT_ENTRY_NAME2 = "[DEFAULT]";
var PLATFORM_LOG_STRING = {
  [name$q]: "fire-core",
  [name$p]: "fire-core-compat",
  [name$n]: "fire-analytics",
  [name$o]: "fire-analytics-compat",
  [name$l]: "fire-app-check",
  [name$m]: "fire-app-check-compat",
  [name$k]: "fire-auth",
  [name$j]: "fire-auth-compat",
  [name$i]: "fire-rtdb",
  [name$h]: "fire-data-connect",
  [name$g]: "fire-rtdb-compat",
  [name$f]: "fire-fn",
  [name$e]: "fire-fn-compat",
  [name$d]: "fire-iid",
  [name$c]: "fire-iid-compat",
  [name$b]: "fire-fcm",
  [name$a]: "fire-fcm-compat",
  [name$9]: "fire-perf",
  [name$8]: "fire-perf-compat",
  [name$7]: "fire-rc",
  [name$6]: "fire-rc-compat",
  [name$5]: "fire-gcs",
  [name$4]: "fire-gcs-compat",
  [name$3]: "fire-fst",
  [name$1]: "fire-fst-compat",
  [name$2]: "fire-vertex",
  "fire-js": "fire-js",
  // Platform identifier for JS SDK.
  [name]: "fire-js-all"
};
var _apps = /* @__PURE__ */ new Map();
var _serverApps = /* @__PURE__ */ new Map();
var _components = /* @__PURE__ */ new Map();
function _addComponent(app2, component) {
  try {
    app2.container.addComponent(component);
  } catch (e) {
    logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app2.name}`, e);
  }
}
function _registerComponent(component) {
  const componentName = component.name;
  if (_components.has(componentName)) {
    logger.debug(`There were multiple attempts to register component ${componentName}.`);
    return false;
  }
  _components.set(componentName, component);
  for (const app2 of _apps.values()) {
    _addComponent(app2, component);
  }
  for (const serverApp of _serverApps.values()) {
    _addComponent(serverApp, component);
  }
  return true;
}
function _getProvider(app2, name5) {
  const heartbeatController = app2.container.getProvider("heartbeat").getImmediate({ optional: true });
  if (heartbeatController) {
    void heartbeatController.triggerHeartbeat();
  }
  return app2.container.getProvider(name5);
}
function _isFirebaseServerApp(obj) {
  if (obj === null || obj === void 0) {
    return false;
  }
  return obj.settings !== void 0;
}
var ERRORS = {
  [
    "no-app"
    /* AppError.NO_APP */
  ]: "No Firebase App '{$appName}' has been created - call initializeApp() first",
  [
    "bad-app-name"
    /* AppError.BAD_APP_NAME */
  ]: "Illegal App name: '{$appName}'",
  [
    "duplicate-app"
    /* AppError.DUPLICATE_APP */
  ]: "Firebase App named '{$appName}' already exists with different options or config",
  [
    "app-deleted"
    /* AppError.APP_DELETED */
  ]: "Firebase App named '{$appName}' already deleted",
  [
    "server-app-deleted"
    /* AppError.SERVER_APP_DELETED */
  ]: "Firebase Server App has been deleted",
  [
    "no-options"
    /* AppError.NO_OPTIONS */
  ]: "Need to provide options, when not being deployed to hosting via source.",
  [
    "invalid-app-argument"
    /* AppError.INVALID_APP_ARGUMENT */
  ]: "firebase.{$appName}() takes either no argument or a Firebase App instance.",
  [
    "invalid-log-argument"
    /* AppError.INVALID_LOG_ARGUMENT */
  ]: "First argument to `onLog` must be null or a function.",
  [
    "idb-open"
    /* AppError.IDB_OPEN */
  ]: "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
  [
    "idb-get"
    /* AppError.IDB_GET */
  ]: "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
  [
    "idb-set"
    /* AppError.IDB_WRITE */
  ]: "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
  [
    "idb-delete"
    /* AppError.IDB_DELETE */
  ]: "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
  [
    "finalization-registry-not-supported"
    /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */
  ]: "FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",
  [
    "invalid-server-app-environment"
    /* AppError.INVALID_SERVER_APP_ENVIRONMENT */
  ]: "FirebaseServerApp is not for use in browser environments."
};
var ERROR_FACTORY = new ErrorFactory("app", "Firebase", ERRORS);
var FirebaseAppImpl = class {
  constructor(options, config, container) {
    this._isDeleted = false;
    this._options = { ...options };
    this._config = { ...config };
    this._name = config.name;
    this._automaticDataCollectionEnabled = config.automaticDataCollectionEnabled;
    this._container = container;
    this.container.addComponent(new Component(
      "app",
      () => this,
      "PUBLIC"
      /* ComponentType.PUBLIC */
    ));
  }
  get automaticDataCollectionEnabled() {
    this.checkDestroyed();
    return this._automaticDataCollectionEnabled;
  }
  set automaticDataCollectionEnabled(val) {
    this.checkDestroyed();
    this._automaticDataCollectionEnabled = val;
  }
  get name() {
    this.checkDestroyed();
    return this._name;
  }
  get options() {
    this.checkDestroyed();
    return this._options;
  }
  get config() {
    this.checkDestroyed();
    return this._config;
  }
  get container() {
    return this._container;
  }
  get isDeleted() {
    return this._isDeleted;
  }
  set isDeleted(val) {
    this._isDeleted = val;
  }
  /**
   * This function will throw an Error if the App has already been deleted -
   * use before performing API actions on the App.
   */
  checkDestroyed() {
    if (this.isDeleted) {
      throw ERROR_FACTORY.create("app-deleted", { appName: this._name });
    }
  }
};
var SDK_VERSION = version;
function initializeApp(_options, rawConfig = {}) {
  let options = _options;
  if (typeof rawConfig !== "object") {
    const name6 = rawConfig;
    rawConfig = { name: name6 };
  }
  const config = {
    name: DEFAULT_ENTRY_NAME2,
    automaticDataCollectionEnabled: true,
    ...rawConfig
  };
  const name5 = config.name;
  if (typeof name5 !== "string" || !name5) {
    throw ERROR_FACTORY.create("bad-app-name", {
      appName: String(name5)
    });
  }
  options || (options = getDefaultAppConfig());
  if (!options) {
    throw ERROR_FACTORY.create(
      "no-options"
      /* AppError.NO_OPTIONS */
    );
  }
  const existingApp = _apps.get(name5);
  if (existingApp) {
    if (deepEqual(options, existingApp.options) && deepEqual(config, existingApp.config)) {
      return existingApp;
    } else {
      throw ERROR_FACTORY.create("duplicate-app", { appName: name5 });
    }
  }
  const container = new ComponentContainer(name5);
  for (const component of _components.values()) {
    container.addComponent(component);
  }
  const newApp = new FirebaseAppImpl(options, config, container);
  _apps.set(name5, newApp);
  return newApp;
}
function getApp(name5 = DEFAULT_ENTRY_NAME2) {
  const app2 = _apps.get(name5);
  if (!app2 && name5 === DEFAULT_ENTRY_NAME2 && getDefaultAppConfig()) {
    return initializeApp();
  }
  if (!app2) {
    throw ERROR_FACTORY.create("no-app", { appName: name5 });
  }
  return app2;
}
function registerVersion(libraryKeyOrName, version5, variant) {
  let library = PLATFORM_LOG_STRING[libraryKeyOrName] ?? libraryKeyOrName;
  if (variant) {
    library += `-${variant}`;
  }
  const libraryMismatch = library.match(/\s|\//);
  const versionMismatch = version5.match(/\s|\//);
  if (libraryMismatch || versionMismatch) {
    const warning = [
      `Unable to register library "${library}" with version "${version5}":`
    ];
    if (libraryMismatch) {
      warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
    }
    if (libraryMismatch && versionMismatch) {
      warning.push("and");
    }
    if (versionMismatch) {
      warning.push(`version name "${version5}" contains illegal characters (whitespace or "/")`);
    }
    logger.warn(warning.join(" "));
    return;
  }
  _registerComponent(new Component(
    `${library}-version`,
    () => ({ library, version: version5 }),
    "VERSION"
    /* ComponentType.VERSION */
  ));
}
var DB_NAME = "firebase-heartbeat-database";
var DB_VERSION = 1;
var STORE_NAME = "firebase-heartbeat-store";
var dbPromise = null;
function getDbPromise() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade: (db2, oldVersion) => {
        switch (oldVersion) {
          case 0:
            try {
              db2.createObjectStore(STORE_NAME);
            } catch (e) {
              console.warn(e);
            }
        }
      }
    }).catch((e) => {
      throw ERROR_FACTORY.create("idb-open", {
        originalErrorMessage: e.message
      });
    });
  }
  return dbPromise;
}
async function readHeartbeatsFromIndexedDB(app2) {
  try {
    const db2 = await getDbPromise();
    const tx = db2.transaction(STORE_NAME);
    const result = await tx.objectStore(STORE_NAME).get(computeKey(app2));
    await tx.done;
    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-get", {
        originalErrorMessage: e?.message
      });
      logger.warn(idbGetError.message);
    }
  }
}
async function writeHeartbeatsToIndexedDB(app2, heartbeatObject) {
  try {
    const db2 = await getDbPromise();
    const tx = db2.transaction(STORE_NAME, "readwrite");
    const objectStore = tx.objectStore(STORE_NAME);
    await objectStore.put(heartbeatObject, computeKey(app2));
    await tx.done;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-set", {
        originalErrorMessage: e?.message
      });
      logger.warn(idbGetError.message);
    }
  }
}
function computeKey(app2) {
  return `${app2.name}!${app2.options.appId}`;
}
var MAX_HEADER_BYTES = 1024;
var MAX_NUM_STORED_HEARTBEATS = 30;
var HeartbeatServiceImpl = class {
  constructor(container) {
    this.container = container;
    this._heartbeatsCache = null;
    const app2 = this.container.getProvider("app").getImmediate();
    this._storage = new HeartbeatStorageImpl(app2);
    this._heartbeatsCachePromise = this._storage.read().then((result) => {
      this._heartbeatsCache = result;
      return result;
    });
  }
  /**
   * Called to report a heartbeat. The function will generate
   * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
   * to IndexedDB.
   * Note that we only store one heartbeat per day. So if a heartbeat for today is
   * already logged, subsequent calls to this function in the same day will be ignored.
   */
  async triggerHeartbeat() {
    try {
      const platformLogger = this.container.getProvider("platform-logger").getImmediate();
      const agent = platformLogger.getPlatformInfoString();
      const date = getUTCDateString();
      if (this._heartbeatsCache?.heartbeats == null) {
        this._heartbeatsCache = await this._heartbeatsCachePromise;
        if (this._heartbeatsCache?.heartbeats == null) {
          return;
        }
      }
      if (this._heartbeatsCache.lastSentHeartbeatDate === date || this._heartbeatsCache.heartbeats.some((singleDateHeartbeat) => singleDateHeartbeat.date === date)) {
        return;
      } else {
        this._heartbeatsCache.heartbeats.push({ date, agent });
        if (this._heartbeatsCache.heartbeats.length > MAX_NUM_STORED_HEARTBEATS) {
          const earliestHeartbeatIdx = getEarliestHeartbeatIdx(this._heartbeatsCache.heartbeats);
          this._heartbeatsCache.heartbeats.splice(earliestHeartbeatIdx, 1);
        }
      }
      return this._storage.overwrite(this._heartbeatsCache);
    } catch (e) {
      logger.warn(e);
    }
  }
  /**
   * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
   * It also clears all heartbeats from memory as well as in IndexedDB.
   *
   * NOTE: Consuming product SDKs should not send the header if this method
   * returns an empty string.
   */
  async getHeartbeatsHeader() {
    try {
      if (this._heartbeatsCache === null) {
        await this._heartbeatsCachePromise;
      }
      if (this._heartbeatsCache?.heartbeats == null || this._heartbeatsCache.heartbeats.length === 0) {
        return "";
      }
      const date = getUTCDateString();
      const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
      const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
      this._heartbeatsCache.lastSentHeartbeatDate = date;
      if (unsentEntries.length > 0) {
        this._heartbeatsCache.heartbeats = unsentEntries;
        await this._storage.overwrite(this._heartbeatsCache);
      } else {
        this._heartbeatsCache.heartbeats = [];
        void this._storage.overwrite(this._heartbeatsCache);
      }
      return headerString;
    } catch (e) {
      logger.warn(e);
      return "";
    }
  }
};
function getUTCDateString() {
  const today = /* @__PURE__ */ new Date();
  return today.toISOString().substring(0, 10);
}
function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
  const heartbeatsToSend = [];
  let unsentEntries = heartbeatsCache.slice();
  for (const singleDateHeartbeat of heartbeatsCache) {
    const heartbeatEntry = heartbeatsToSend.find((hb) => hb.agent === singleDateHeartbeat.agent);
    if (!heartbeatEntry) {
      heartbeatsToSend.push({
        agent: singleDateHeartbeat.agent,
        dates: [singleDateHeartbeat.date]
      });
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatsToSend.pop();
        break;
      }
    } else {
      heartbeatEntry.dates.push(singleDateHeartbeat.date);
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatEntry.dates.pop();
        break;
      }
    }
    unsentEntries = unsentEntries.slice(1);
  }
  return {
    heartbeatsToSend,
    unsentEntries
  };
}
var HeartbeatStorageImpl = class {
  constructor(app2) {
    this.app = app2;
    this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
  }
  async runIndexedDBEnvironmentCheck() {
    if (!isIndexedDBAvailable()) {
      return false;
    } else {
      return validateIndexedDBOpenable().then(() => true).catch(() => false);
    }
  }
  /**
   * Read all heartbeats.
   */
  async read() {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return { heartbeats: [] };
    } else {
      const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
      if (idbHeartbeatObject?.heartbeats) {
        return idbHeartbeatObject;
      } else {
        return { heartbeats: [] };
      }
    }
  }
  // overwrite the storage with the provided heartbeats
  async overwrite(heartbeatsObject) {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ?? existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: heartbeatsObject.heartbeats
      });
    }
  }
  // add heartbeats
  async add(heartbeatsObject) {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ?? existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: [
          ...existingHeartbeatsObject.heartbeats,
          ...heartbeatsObject.heartbeats
        ]
      });
    }
  }
};
function countBytes(heartbeatsCache) {
  return base64urlEncodeWithoutPadding(
    // heartbeatsCache wrapper properties
    JSON.stringify({ version: 2, heartbeats: heartbeatsCache })
  ).length;
}
function getEarliestHeartbeatIdx(heartbeats) {
  if (heartbeats.length === 0) {
    return -1;
  }
  let earliestHeartbeatIdx = 0;
  let earliestHeartbeatDate = heartbeats[0].date;
  for (let i = 1; i < heartbeats.length; i++) {
    if (heartbeats[i].date < earliestHeartbeatDate) {
      earliestHeartbeatDate = heartbeats[i].date;
      earliestHeartbeatIdx = i;
    }
  }
  return earliestHeartbeatIdx;
}
function registerCoreComponents(variant) {
  _registerComponent(new Component(
    "platform-logger",
    (container) => new PlatformLoggerServiceImpl(container),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ));
  _registerComponent(new Component(
    "heartbeat",
    (container) => new HeartbeatServiceImpl(container),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ));
  registerVersion(name$q, version$1, variant);
  registerVersion(name$q, version$1, "esm2020");
  registerVersion("fire-js", "");
}
registerCoreComponents("");

// node_modules/firebase/app/dist/index.mjs
var name2 = "firebase";
var version2 = "12.15.0";
registerVersion(name2, version2, "app");

// node_modules/@firebase/auth/dist/node-esm/totp-65577477.js
function _prodErrorMap() {
  return {
    [
      "dependent-sdk-initialized-before-auth"
      /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
    ]: "Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."
  };
}
var prodErrorMap = _prodErrorMap;
var _DEFAULT_AUTH_ERROR_FACTORY = new ErrorFactory("auth", "Firebase", _prodErrorMap());
var logClient = new Logger("@firebase/auth");
function _logWarn(msg, ...args) {
  if (logClient.logLevel <= LogLevel.WARN) {
    logClient.warn(`Auth (${SDK_VERSION}): ${msg}`, ...args);
  }
}
function _logError(msg, ...args) {
  if (logClient.logLevel <= LogLevel.ERROR) {
    logClient.error(`Auth (${SDK_VERSION}): ${msg}`, ...args);
  }
}
function _fail(authOrCode, ...rest) {
  throw createErrorInternal(authOrCode, ...rest);
}
function _createError(authOrCode, ...rest) {
  return createErrorInternal(authOrCode, ...rest);
}
function _errorWithCustomMessage(auth2, code, message) {
  const errorMap = {
    ...prodErrorMap(),
    [code]: message
  };
  const factory2 = new ErrorFactory("auth", "Firebase", errorMap);
  return factory2.create(code, {
    appName: auth2.name
  });
}
function _serverAppCurrentUserOperationNotSupportedError(auth2) {
  return _errorWithCustomMessage(auth2, "operation-not-supported-in-this-environment", "Operations that alter the current user are not supported in conjunction with FirebaseServerApp");
}
function createErrorInternal(authOrCode, ...rest) {
  if (typeof authOrCode !== "string") {
    const code = rest[0];
    const fullParams = [...rest.slice(1)];
    if (fullParams[0]) {
      fullParams[0].appName = authOrCode.name;
    }
    return authOrCode._errorFactory.create(code, ...fullParams);
  }
  return _DEFAULT_AUTH_ERROR_FACTORY.create(authOrCode, ...rest);
}
function _assert(assertion, authOrCode, ...rest) {
  if (!assertion) {
    throw createErrorInternal(authOrCode, ...rest);
  }
}
function debugFail(failure) {
  const message = `INTERNAL ASSERTION FAILED: ` + failure;
  _logError(message);
  throw new Error(message);
}
function debugAssert(assertion, message) {
  if (!assertion) {
    debugFail(message);
  }
}
function _isHttpOrHttps() {
  return _getCurrentScheme() === "http:" || _getCurrentScheme() === "https:";
}
function _getCurrentScheme() {
  return typeof self !== "undefined" && self.location?.protocol || null;
}
function _isOnline() {
  if (typeof navigator !== "undefined" && navigator && "onLine" in navigator && typeof navigator.onLine === "boolean" && // Apply only for traditional web apps and Chrome extensions.
  // This is especially true for Cordova apps which have unreliable
  // navigator.onLine behavior unless cordova-plugin-network-information is
  // installed which overwrites the native navigator.onLine value and
  // defines navigator.connection.
  (_isHttpOrHttps() || isBrowserExtension() || "connection" in navigator)) {
    return navigator.onLine;
  }
  return true;
}
function _getUserLanguage() {
  if (typeof navigator === "undefined") {
    return null;
  }
  const navigatorLanguage = navigator;
  return (
    // Most reliable, but only supported in Chrome/Firefox.
    navigatorLanguage.languages && navigatorLanguage.languages[0] || // Supported in most browsers, but returns the language of the browser
    // UI, not the language set in browser settings.
    navigatorLanguage.language || // Couldn't determine language.
    null
  );
}
var Delay = class {
  constructor(shortDelay, longDelay) {
    this.shortDelay = shortDelay;
    this.longDelay = longDelay;
    debugAssert(longDelay > shortDelay, "Short delay should be less than long delay!");
    this.isMobile = isMobileCordova() || isReactNative();
  }
  get() {
    if (!_isOnline()) {
      return Math.min(5e3, this.shortDelay);
    }
    return this.isMobile ? this.longDelay : this.shortDelay;
  }
};
function _emulatorUrl(config, path) {
  debugAssert(config.emulator, "Emulator should always be set here");
  const { url } = config.emulator;
  if (!path) {
    return url;
  }
  return `${url}${path.startsWith("/") ? path.slice(1) : path}`;
}
var FetchProvider = class {
  static initialize(fetchImpl, headersImpl, responseImpl) {
    this.fetchImpl = fetchImpl;
    if (headersImpl) {
      this.headersImpl = headersImpl;
    }
    if (responseImpl) {
      this.responseImpl = responseImpl;
    }
  }
  static fetch() {
    if (this.fetchImpl) {
      return this.fetchImpl;
    }
    if (typeof self !== "undefined" && "fetch" in self) {
      return self.fetch;
    }
    if (typeof globalThis !== "undefined" && globalThis.fetch) {
      return globalThis.fetch;
    }
    if (typeof fetch !== "undefined") {
      return fetch;
    }
    debugFail("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
  }
  static headers() {
    if (this.headersImpl) {
      return this.headersImpl;
    }
    if (typeof self !== "undefined" && "Headers" in self) {
      return self.Headers;
    }
    if (typeof globalThis !== "undefined" && globalThis.Headers) {
      return globalThis.Headers;
    }
    if (typeof Headers !== "undefined") {
      return Headers;
    }
    debugFail("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
  }
  static response() {
    if (this.responseImpl) {
      return this.responseImpl;
    }
    if (typeof self !== "undefined" && "Response" in self) {
      return self.Response;
    }
    if (typeof globalThis !== "undefined" && globalThis.Response) {
      return globalThis.Response;
    }
    if (typeof Response !== "undefined") {
      return Response;
    }
    debugFail("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
  }
};
var SERVER_ERROR_MAP = {
  // Custom token errors.
  [
    "CREDENTIAL_MISMATCH"
    /* ServerError.CREDENTIAL_MISMATCH */
  ]: "custom-token-mismatch",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_CUSTOM_TOKEN"
    /* ServerError.MISSING_CUSTOM_TOKEN */
  ]: "internal-error",
  // Create Auth URI errors.
  [
    "INVALID_IDENTIFIER"
    /* ServerError.INVALID_IDENTIFIER */
  ]: "invalid-email",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_CONTINUE_URI"
    /* ServerError.MISSING_CONTINUE_URI */
  ]: "internal-error",
  // Sign in with email and password errors (some apply to sign up too).
  [
    "INVALID_PASSWORD"
    /* ServerError.INVALID_PASSWORD */
  ]: "wrong-password",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_PASSWORD"
    /* ServerError.MISSING_PASSWORD */
  ]: "missing-password",
  // Thrown if Email Enumeration Protection is enabled in the project and the email or password is
  // invalid.
  [
    "INVALID_LOGIN_CREDENTIALS"
    /* ServerError.INVALID_LOGIN_CREDENTIALS */
  ]: "invalid-credential",
  // Sign up with email and password errors.
  [
    "EMAIL_EXISTS"
    /* ServerError.EMAIL_EXISTS */
  ]: "email-already-in-use",
  [
    "PASSWORD_LOGIN_DISABLED"
    /* ServerError.PASSWORD_LOGIN_DISABLED */
  ]: "operation-not-allowed",
  // Verify assertion for sign in with credential errors:
  [
    "INVALID_IDP_RESPONSE"
    /* ServerError.INVALID_IDP_RESPONSE */
  ]: "invalid-credential",
  [
    "INVALID_PENDING_TOKEN"
    /* ServerError.INVALID_PENDING_TOKEN */
  ]: "invalid-credential",
  [
    "FEDERATED_USER_ID_ALREADY_LINKED"
    /* ServerError.FEDERATED_USER_ID_ALREADY_LINKED */
  ]: "credential-already-in-use",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_REQ_TYPE"
    /* ServerError.MISSING_REQ_TYPE */
  ]: "internal-error",
  // Send Password reset email errors:
  [
    "EMAIL_NOT_FOUND"
    /* ServerError.EMAIL_NOT_FOUND */
  ]: "user-not-found",
  [
    "RESET_PASSWORD_EXCEED_LIMIT"
    /* ServerError.RESET_PASSWORD_EXCEED_LIMIT */
  ]: "too-many-requests",
  [
    "EXPIRED_OOB_CODE"
    /* ServerError.EXPIRED_OOB_CODE */
  ]: "expired-action-code",
  [
    "INVALID_OOB_CODE"
    /* ServerError.INVALID_OOB_CODE */
  ]: "invalid-action-code",
  // This can only happen if the SDK sends a bad request.
  [
    "MISSING_OOB_CODE"
    /* ServerError.MISSING_OOB_CODE */
  ]: "internal-error",
  // Operations that require ID token in request:
  [
    "CREDENTIAL_TOO_OLD_LOGIN_AGAIN"
    /* ServerError.CREDENTIAL_TOO_OLD_LOGIN_AGAIN */
  ]: "requires-recent-login",
  [
    "INVALID_ID_TOKEN"
    /* ServerError.INVALID_ID_TOKEN */
  ]: "invalid-user-token",
  [
    "TOKEN_EXPIRED"
    /* ServerError.TOKEN_EXPIRED */
  ]: "user-token-expired",
  [
    "USER_NOT_FOUND"
    /* ServerError.USER_NOT_FOUND */
  ]: "user-token-expired",
  // Other errors.
  [
    "TOO_MANY_ATTEMPTS_TRY_LATER"
    /* ServerError.TOO_MANY_ATTEMPTS_TRY_LATER */
  ]: "too-many-requests",
  [
    "PASSWORD_DOES_NOT_MEET_REQUIREMENTS"
    /* ServerError.PASSWORD_DOES_NOT_MEET_REQUIREMENTS */
  ]: "password-does-not-meet-requirements",
  // Phone Auth related errors.
  [
    "INVALID_CODE"
    /* ServerError.INVALID_CODE */
  ]: "invalid-verification-code",
  [
    "INVALID_SESSION_INFO"
    /* ServerError.INVALID_SESSION_INFO */
  ]: "invalid-verification-id",
  [
    "INVALID_TEMPORARY_PROOF"
    /* ServerError.INVALID_TEMPORARY_PROOF */
  ]: "invalid-credential",
  [
    "MISSING_SESSION_INFO"
    /* ServerError.MISSING_SESSION_INFO */
  ]: "missing-verification-id",
  [
    "SESSION_EXPIRED"
    /* ServerError.SESSION_EXPIRED */
  ]: "code-expired",
  // Other action code errors when additional settings passed.
  // MISSING_CONTINUE_URI is getting mapped to INTERNAL_ERROR above.
  // This is OK as this error will be caught by client side validation.
  [
    "MISSING_ANDROID_PACKAGE_NAME"
    /* ServerError.MISSING_ANDROID_PACKAGE_NAME */
  ]: "missing-android-pkg-name",
  [
    "UNAUTHORIZED_DOMAIN"
    /* ServerError.UNAUTHORIZED_DOMAIN */
  ]: "unauthorized-continue-uri",
  // getProjectConfig errors when clientId is passed.
  [
    "INVALID_OAUTH_CLIENT_ID"
    /* ServerError.INVALID_OAUTH_CLIENT_ID */
  ]: "invalid-oauth-client-id",
  // User actions (sign-up or deletion) disabled errors.
  [
    "ADMIN_ONLY_OPERATION"
    /* ServerError.ADMIN_ONLY_OPERATION */
  ]: "admin-restricted-operation",
  // Multi factor related errors.
  [
    "INVALID_MFA_PENDING_CREDENTIAL"
    /* ServerError.INVALID_MFA_PENDING_CREDENTIAL */
  ]: "invalid-multi-factor-session",
  [
    "MFA_ENROLLMENT_NOT_FOUND"
    /* ServerError.MFA_ENROLLMENT_NOT_FOUND */
  ]: "multi-factor-info-not-found",
  [
    "MISSING_MFA_ENROLLMENT_ID"
    /* ServerError.MISSING_MFA_ENROLLMENT_ID */
  ]: "missing-multi-factor-info",
  [
    "MISSING_MFA_PENDING_CREDENTIAL"
    /* ServerError.MISSING_MFA_PENDING_CREDENTIAL */
  ]: "missing-multi-factor-session",
  [
    "SECOND_FACTOR_EXISTS"
    /* ServerError.SECOND_FACTOR_EXISTS */
  ]: "second-factor-already-in-use",
  [
    "SECOND_FACTOR_LIMIT_EXCEEDED"
    /* ServerError.SECOND_FACTOR_LIMIT_EXCEEDED */
  ]: "maximum-second-factor-count-exceeded",
  // Blocking functions related errors.
  [
    "BLOCKING_FUNCTION_ERROR_RESPONSE"
    /* ServerError.BLOCKING_FUNCTION_ERROR_RESPONSE */
  ]: "internal-error",
  // Recaptcha related errors.
  [
    "RECAPTCHA_NOT_ENABLED"
    /* ServerError.RECAPTCHA_NOT_ENABLED */
  ]: "recaptcha-not-enabled",
  [
    "MISSING_RECAPTCHA_TOKEN"
    /* ServerError.MISSING_RECAPTCHA_TOKEN */
  ]: "missing-recaptcha-token",
  [
    "INVALID_RECAPTCHA_TOKEN"
    /* ServerError.INVALID_RECAPTCHA_TOKEN */
  ]: "invalid-recaptcha-token",
  [
    "INVALID_RECAPTCHA_ACTION"
    /* ServerError.INVALID_RECAPTCHA_ACTION */
  ]: "invalid-recaptcha-action",
  [
    "MISSING_CLIENT_TYPE"
    /* ServerError.MISSING_CLIENT_TYPE */
  ]: "missing-client-type",
  [
    "MISSING_RECAPTCHA_VERSION"
    /* ServerError.MISSING_RECAPTCHA_VERSION */
  ]: "missing-recaptcha-version",
  [
    "INVALID_RECAPTCHA_VERSION"
    /* ServerError.INVALID_RECAPTCHA_VERSION */
  ]: "invalid-recaptcha-version",
  [
    "INVALID_REQ_TYPE"
    /* ServerError.INVALID_REQ_TYPE */
  ]: "invalid-req-type"
  /* AuthErrorCode.INVALID_REQ_TYPE */
};
var CookieAuthProxiedEndpoints = [
  "/v1/accounts:signInWithCustomToken",
  "/v1/accounts:signInWithEmailLink",
  "/v1/accounts:signInWithIdp",
  "/v1/accounts:signInWithPassword",
  "/v1/accounts:signInWithPhoneNumber",
  "/v1/token"
  /* Endpoint.TOKEN */
];
var DEFAULT_API_TIMEOUT_MS = new Delay(3e4, 6e4);
function _addTidIfNecessary(auth2, request) {
  if (auth2.tenantId && !request.tenantId) {
    return {
      ...request,
      tenantId: auth2.tenantId
    };
  }
  return request;
}
async function _performApiRequest(auth2, method, path, request, customErrorMap = {}) {
  return _performFetchWithErrorHandling(auth2, customErrorMap, async () => {
    let body = {};
    let params = {};
    if (request) {
      if (method === "GET") {
        params = request;
      } else {
        body = {
          body: JSON.stringify(request)
        };
      }
    }
    const query = querystring({
      ...params,
      key: auth2.config.apiKey
    }).slice(1);
    const headers = await auth2._getAdditionalHeaders();
    headers[
      "Content-Type"
      /* HttpHeader.CONTENT_TYPE */
    ] = "application/json";
    if (auth2.languageCode) {
      headers[
        "X-Firebase-Locale"
        /* HttpHeader.X_FIREBASE_LOCALE */
      ] = auth2.languageCode;
    }
    const fetchArgs = {
      method,
      headers,
      ...body
    };
    if (!isCloudflareWorker()) {
      fetchArgs.referrerPolicy = "strict-origin-when-cross-origin";
    }
    if (auth2.emulatorConfig && isCloudWorkstation(auth2.emulatorConfig.host)) {
      fetchArgs.credentials = "include";
    }
    return FetchProvider.fetch()(await _getFinalTarget(auth2, auth2.config.apiHost, path, query), fetchArgs);
  });
}
async function _performFetchWithErrorHandling(auth2, customErrorMap, fetchFn) {
  auth2._canInitEmulator = false;
  const errorMap = { ...SERVER_ERROR_MAP, ...customErrorMap };
  try {
    const networkTimeout = new NetworkTimeout(auth2);
    const response = await Promise.race([
      fetchFn(),
      networkTimeout.promise
    ]);
    networkTimeout.clearNetworkTimeout();
    const json = await response.json();
    if ("needConfirmation" in json) {
      throw _makeTaggedError(auth2, "account-exists-with-different-credential", json);
    }
    if (response.ok && !("errorMessage" in json)) {
      return json;
    } else {
      const errorMessage = response.ok ? json.errorMessage : json.error.message;
      const [serverErrorCode, serverErrorMessage] = errorMessage.split(" : ");
      if (serverErrorCode === "FEDERATED_USER_ID_ALREADY_LINKED") {
        throw _makeTaggedError(auth2, "credential-already-in-use", json);
      } else if (serverErrorCode === "EMAIL_EXISTS") {
        throw _makeTaggedError(auth2, "email-already-in-use", json);
      } else if (serverErrorCode === "USER_DISABLED") {
        throw _makeTaggedError(auth2, "user-disabled", json);
      }
      const authError = errorMap[serverErrorCode] || serverErrorCode.toLowerCase().replace(/[_\s]+/g, "-");
      if (serverErrorMessage) {
        throw _errorWithCustomMessage(auth2, authError, serverErrorMessage);
      } else {
        _fail(auth2, authError);
      }
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      throw e;
    }
    _fail(auth2, "network-request-failed", { "message": String(e) });
  }
}
async function _performSignInRequest(auth2, method, path, request, customErrorMap = {}) {
  const serverResponse = await _performApiRequest(auth2, method, path, request, customErrorMap);
  if ("mfaPendingCredential" in serverResponse) {
    _fail(auth2, "multi-factor-auth-required", {
      _serverResponse: serverResponse
    });
  }
  return serverResponse;
}
async function _getFinalTarget(auth2, host, path, query) {
  const base = `${host}${path}?${query}`;
  const authInternal = auth2;
  const finalTarget = authInternal.config.emulator ? _emulatorUrl(auth2.config, base) : `${auth2.config.apiScheme}://${base}`;
  if (CookieAuthProxiedEndpoints.includes(path)) {
    await authInternal._persistenceManagerAvailable;
    if (authInternal._getPersistenceType() === "COOKIE") {
      const cookiePersistence = authInternal._getPersistence();
      return cookiePersistence._getFinalTarget(finalTarget).toString();
    }
  }
  return finalTarget;
}
function _parseEnforcementState(enforcementStateStr) {
  switch (enforcementStateStr) {
    case "ENFORCE":
      return "ENFORCE";
    case "AUDIT":
      return "AUDIT";
    case "OFF":
      return "OFF";
    default:
      return "ENFORCEMENT_STATE_UNSPECIFIED";
  }
}
var NetworkTimeout = class {
  clearNetworkTimeout() {
    clearTimeout(this.timer);
  }
  constructor(auth2) {
    this.auth = auth2;
    this.timer = null;
    this.promise = new Promise((_, reject) => {
      this.timer = setTimeout(() => {
        return reject(_createError(
          this.auth,
          "network-request-failed"
          /* AuthErrorCode.NETWORK_REQUEST_FAILED */
        ));
      }, DEFAULT_API_TIMEOUT_MS.get());
    });
  }
};
function _makeTaggedError(auth2, code, response) {
  const errorParams = {
    appName: auth2.name
  };
  if (response.email) {
    errorParams.email = response.email;
  }
  if (response.phoneNumber) {
    errorParams.phoneNumber = response.phoneNumber;
  }
  const error = _createError(auth2, code, errorParams);
  error.customData._tokenResponse = response;
  return error;
}
function isEnterprise(grecaptcha) {
  return grecaptcha !== void 0 && grecaptcha.enterprise !== void 0;
}
var RecaptchaConfig = class {
  constructor(response) {
    this.siteKey = "";
    this.recaptchaEnforcementState = [];
    if (response.recaptchaKey === void 0) {
      throw new Error("recaptchaKey undefined");
    }
    this.siteKey = response.recaptchaKey.split("/")[3];
    this.recaptchaEnforcementState = response.recaptchaEnforcementState;
  }
  /**
   * Returns the reCAPTCHA Enterprise enforcement state for the given provider.
   *
   * @param providerStr - The provider whose enforcement state is to be returned.
   * @returns The reCAPTCHA Enterprise enforcement state for the given provider.
   */
  getProviderEnforcementState(providerStr) {
    if (!this.recaptchaEnforcementState || this.recaptchaEnforcementState.length === 0) {
      return null;
    }
    for (const recaptchaEnforcementState of this.recaptchaEnforcementState) {
      if (recaptchaEnforcementState.provider && recaptchaEnforcementState.provider === providerStr) {
        return _parseEnforcementState(recaptchaEnforcementState.enforcementState);
      }
    }
    return null;
  }
  /**
   * Returns true if the reCAPTCHA Enterprise enforcement state for the provider is set to ENFORCE or AUDIT.
   *
   * @param providerStr - The provider whose enablement state is to be returned.
   * @returns Whether or not reCAPTCHA Enterprise protection is enabled for the given provider.
   */
  isProviderEnabled(providerStr) {
    return this.getProviderEnforcementState(providerStr) === "ENFORCE" || this.getProviderEnforcementState(providerStr) === "AUDIT";
  }
  /**
   * Returns true if reCAPTCHA Enterprise protection is enabled in at least one provider, otherwise
   * returns false.
   *
   * @returns Whether or not reCAPTCHA Enterprise protection is enabled for at least one provider.
   */
  isAnyProviderEnabled() {
    return this.isProviderEnabled(
      "EMAIL_PASSWORD_PROVIDER"
      /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
    ) || this.isProviderEnabled(
      "PHONE_PROVIDER"
      /* RecaptchaAuthProvider.PHONE_PROVIDER */
    );
  }
};
async function getRecaptchaConfig(auth2, request) {
  return _performApiRequest(auth2, "GET", "/v2/recaptchaConfig", _addTidIfNecessary(auth2, request));
}
async function deleteAccount(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:delete", request);
}
async function getAccountInfo(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:lookup", request);
}
function utcTimestampToDateString(utcTimestamp) {
  if (!utcTimestamp) {
    return void 0;
  }
  try {
    const date = new Date(Number(utcTimestamp));
    if (!isNaN(date.getTime())) {
      return date.toUTCString();
    }
  } catch (e) {
  }
  return void 0;
}
async function getIdTokenResult(user, forceRefresh = false) {
  const userInternal = getModularInstance(user);
  const token = await userInternal.getIdToken(forceRefresh);
  const claims = _parseToken(token);
  _assert(
    claims && claims.exp && claims.auth_time && claims.iat,
    userInternal.auth,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  const firebase = typeof claims.firebase === "object" ? claims.firebase : void 0;
  const signInProvider = firebase?.["sign_in_provider"];
  return {
    claims,
    token,
    authTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.auth_time)),
    issuedAtTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.iat)),
    expirationTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.exp)),
    signInProvider: signInProvider || null,
    signInSecondFactor: firebase?.["sign_in_second_factor"] || null
  };
}
function secondsStringToMilliseconds(seconds) {
  return Number(seconds) * 1e3;
}
function _parseToken(token) {
  const [algorithm, payload, signature] = token.split(".");
  if (algorithm === void 0 || payload === void 0 || signature === void 0) {
    _logError("JWT malformed, contained fewer than 3 sections");
    return null;
  }
  try {
    const decoded = base64Decode(payload);
    if (!decoded) {
      _logError("Failed to decode base64 JWT payload");
      return null;
    }
    return JSON.parse(decoded);
  } catch (e) {
    _logError("Caught error parsing JWT payload as JSON", e?.toString());
    return null;
  }
}
function _tokenExpiresIn(token) {
  const parsedToken = _parseToken(token);
  _assert(
    parsedToken,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  _assert(
    typeof parsedToken.exp !== "undefined",
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  _assert(
    typeof parsedToken.iat !== "undefined",
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return Number(parsedToken.exp) - Number(parsedToken.iat);
}
async function _logoutIfInvalidated(user, promise, bypassAuthState = false) {
  if (bypassAuthState) {
    return promise;
  }
  try {
    return await promise;
  } catch (e) {
    if (e instanceof FirebaseError && isUserInvalidated(e)) {
      if (user.auth.currentUser === user) {
        await user.auth.signOut();
      }
    }
    throw e;
  }
}
function isUserInvalidated({ code }) {
  return code === `auth/${"user-disabled"}` || code === `auth/${"user-token-expired"}`;
}
var ProactiveRefresh = class {
  constructor(user) {
    this.user = user;
    this.isRunning = false;
    this.timerId = null;
    this.errorBackoff = 3e4;
  }
  _start() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.schedule();
  }
  _stop() {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
  }
  getInterval(wasError) {
    if (wasError) {
      const interval = this.errorBackoff;
      this.errorBackoff = Math.min(
        this.errorBackoff * 2,
        96e4
        /* Duration.RETRY_BACKOFF_MAX */
      );
      return interval;
    } else {
      this.errorBackoff = 3e4;
      const expTime = this.user.stsTokenManager.expirationTime ?? 0;
      const interval = expTime - Date.now() - 3e5;
      return Math.max(0, interval);
    }
  }
  schedule(wasError = false) {
    if (!this.isRunning) {
      return;
    }
    const interval = this.getInterval(wasError);
    this.timerId = setTimeout(async () => {
      await this.iteration();
    }, interval);
  }
  async iteration() {
    try {
      await this.user.getIdToken(true);
    } catch (e) {
      if (e?.code === `auth/${"network-request-failed"}`) {
        this.schedule(
          /* wasError */
          true
        );
      }
      return;
    }
    this.schedule();
  }
};
var UserMetadata = class {
  constructor(createdAt, lastLoginAt) {
    this.createdAt = createdAt;
    this.lastLoginAt = lastLoginAt;
    this._initializeTime();
  }
  _initializeTime() {
    this.lastSignInTime = utcTimestampToDateString(this.lastLoginAt);
    this.creationTime = utcTimestampToDateString(this.createdAt);
  }
  _copy(metadata) {
    this.createdAt = metadata.createdAt;
    this.lastLoginAt = metadata.lastLoginAt;
    this._initializeTime();
  }
  toJSON() {
    return {
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt
    };
  }
};
async function _reloadWithoutSaving(user) {
  const auth2 = user.auth;
  const idToken = await user.getIdToken();
  const response = await _logoutIfInvalidated(user, getAccountInfo(auth2, { idToken }));
  _assert(
    response?.users.length,
    auth2,
    "internal-error"
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  const coreAccount = response.users[0];
  user._notifyReloadListener(coreAccount);
  const newProviderData = coreAccount.providerUserInfo?.length ? extractProviderData(coreAccount.providerUserInfo) : [];
  const providerData = mergeProviderData(user.providerData, newProviderData);
  const oldIsAnonymous = user.isAnonymous;
  const newIsAnonymous = !(user.email && coreAccount.passwordHash) && !providerData?.length;
  const isAnonymous = !oldIsAnonymous ? false : newIsAnonymous;
  const updates = {
    uid: coreAccount.localId,
    displayName: coreAccount.displayName || null,
    photoURL: coreAccount.photoUrl || null,
    email: coreAccount.email || null,
    emailVerified: coreAccount.emailVerified || false,
    phoneNumber: coreAccount.phoneNumber || null,
    tenantId: coreAccount.tenantId || null,
    providerData,
    metadata: new UserMetadata(coreAccount.createdAt, coreAccount.lastLoginAt),
    isAnonymous
  };
  Object.assign(user, updates);
}
async function reload(user) {
  const userInternal = getModularInstance(user);
  await _reloadWithoutSaving(userInternal);
  await userInternal.auth._persistUserIfCurrent(userInternal);
  userInternal.auth._notifyListenersIfCurrent(userInternal);
}
function mergeProviderData(original, newData) {
  const deduped = original.filter((o) => !newData.some((n) => n.providerId === o.providerId));
  return [...deduped, ...newData];
}
function extractProviderData(providers) {
  return providers.map(({ providerId, ...provider }) => {
    return {
      providerId,
      uid: provider.rawId || "",
      displayName: provider.displayName || null,
      email: provider.email || null,
      phoneNumber: provider.phoneNumber || null,
      photoURL: provider.photoUrl || null
    };
  });
}
async function requestStsToken(auth2, refreshToken) {
  const response = await _performFetchWithErrorHandling(auth2, {}, async () => {
    const body = querystring({
      "grant_type": "refresh_token",
      "refresh_token": refreshToken
    }).slice(1);
    const { tokenApiHost, apiKey } = auth2.config;
    const url = await _getFinalTarget(auth2, tokenApiHost, "/v1/token", `key=${apiKey}`);
    const headers = await auth2._getAdditionalHeaders();
    headers[
      "Content-Type"
      /* HttpHeader.CONTENT_TYPE */
    ] = "application/x-www-form-urlencoded";
    const options = {
      method: "POST",
      headers,
      body
    };
    if (auth2.emulatorConfig && isCloudWorkstation(auth2.emulatorConfig.host)) {
      options.credentials = "include";
    }
    return FetchProvider.fetch()(url, options);
  });
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    refreshToken: response.refresh_token
  };
}
async function revokeToken(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts:revokeToken", _addTidIfNecessary(auth2, request));
}
var StsTokenManager = class _StsTokenManager {
  constructor() {
    this.refreshToken = null;
    this.accessToken = null;
    this.expirationTime = null;
  }
  get isExpired() {
    return !this.expirationTime || Date.now() > this.expirationTime - 3e4;
  }
  updateFromServerResponse(response) {
    _assert(
      response.idToken,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof response.idToken !== "undefined",
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof response.refreshToken !== "undefined",
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const expiresIn = "expiresIn" in response && typeof response.expiresIn !== "undefined" ? Number(response.expiresIn) : _tokenExpiresIn(response.idToken);
    this.updateTokensAndExpiration(response.idToken, response.refreshToken, expiresIn);
  }
  updateFromIdToken(idToken) {
    _assert(
      idToken.length !== 0,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const expiresIn = _tokenExpiresIn(idToken);
    this.updateTokensAndExpiration(idToken, null, expiresIn);
  }
  async getToken(auth2, forceRefresh = false) {
    if (!forceRefresh && this.accessToken && !this.isExpired) {
      return this.accessToken;
    }
    _assert(
      this.refreshToken,
      auth2,
      "user-token-expired"
      /* AuthErrorCode.TOKEN_EXPIRED */
    );
    if (this.refreshToken) {
      await this.refresh(auth2, this.refreshToken);
      return this.accessToken;
    }
    return null;
  }
  clearRefreshToken() {
    this.refreshToken = null;
  }
  async refresh(auth2, oldToken) {
    const { accessToken, refreshToken, expiresIn } = await requestStsToken(auth2, oldToken);
    this.updateTokensAndExpiration(accessToken, refreshToken, Number(expiresIn));
  }
  updateTokensAndExpiration(accessToken, refreshToken, expiresInSec) {
    this.refreshToken = refreshToken || null;
    this.accessToken = accessToken || null;
    this.expirationTime = Date.now() + expiresInSec * 1e3;
  }
  static fromJSON(appName, object) {
    const { refreshToken, accessToken, expirationTime } = object;
    const manager = new _StsTokenManager();
    if (refreshToken) {
      _assert(typeof refreshToken === "string", "internal-error", {
        appName
      });
      manager.refreshToken = refreshToken;
    }
    if (accessToken) {
      _assert(typeof accessToken === "string", "internal-error", {
        appName
      });
      manager.accessToken = accessToken;
    }
    if (expirationTime) {
      _assert(typeof expirationTime === "number", "internal-error", {
        appName
      });
      manager.expirationTime = expirationTime;
    }
    return manager;
  }
  toJSON() {
    return {
      refreshToken: this.refreshToken,
      accessToken: this.accessToken,
      expirationTime: this.expirationTime
    };
  }
  _assign(stsTokenManager) {
    this.accessToken = stsTokenManager.accessToken;
    this.refreshToken = stsTokenManager.refreshToken;
    this.expirationTime = stsTokenManager.expirationTime;
  }
  _clone() {
    return Object.assign(new _StsTokenManager(), this.toJSON());
  }
  _performRefresh() {
    return debugFail("not implemented");
  }
};
function assertStringOrUndefined(assertion, appName) {
  _assert(typeof assertion === "string" || typeof assertion === "undefined", "internal-error", { appName });
}
var UserImpl = class _UserImpl {
  constructor({ uid, auth: auth2, stsTokenManager, ...opt }) {
    this.providerId = "firebase";
    this.proactiveRefresh = new ProactiveRefresh(this);
    this.reloadUserInfo = null;
    this.reloadListener = null;
    this.uid = uid;
    this.auth = auth2;
    this.stsTokenManager = stsTokenManager;
    this.accessToken = stsTokenManager.accessToken;
    this.displayName = opt.displayName || null;
    this.email = opt.email || null;
    this.emailVerified = opt.emailVerified || false;
    this.phoneNumber = opt.phoneNumber || null;
    this.photoURL = opt.photoURL || null;
    this.isAnonymous = opt.isAnonymous || false;
    this.tenantId = opt.tenantId || null;
    this.providerData = opt.providerData ? [...opt.providerData] : [];
    this.metadata = new UserMetadata(opt.createdAt || void 0, opt.lastLoginAt || void 0);
  }
  async getIdToken(forceRefresh) {
    const accessToken = await _logoutIfInvalidated(this, this.stsTokenManager.getToken(this.auth, forceRefresh));
    _assert(
      accessToken,
      this.auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    if (this.accessToken !== accessToken) {
      this.accessToken = accessToken;
      await this.auth._persistUserIfCurrent(this);
      this.auth._notifyListenersIfCurrent(this);
    }
    return accessToken;
  }
  getIdTokenResult(forceRefresh) {
    return getIdTokenResult(this, forceRefresh);
  }
  reload() {
    return reload(this);
  }
  _assign(user) {
    if (this === user) {
      return;
    }
    _assert(
      this.uid === user.uid,
      this.auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    this.displayName = user.displayName;
    this.photoURL = user.photoURL;
    this.email = user.email;
    this.emailVerified = user.emailVerified;
    this.phoneNumber = user.phoneNumber;
    this.isAnonymous = user.isAnonymous;
    this.tenantId = user.tenantId;
    this.providerData = user.providerData.map((userInfo) => ({ ...userInfo }));
    this.metadata._copy(user.metadata);
    this.stsTokenManager._assign(user.stsTokenManager);
  }
  _clone(auth2) {
    const newUser = new _UserImpl({
      ...this,
      auth: auth2,
      stsTokenManager: this.stsTokenManager._clone()
    });
    newUser.metadata._copy(this.metadata);
    return newUser;
  }
  _onReload(callback) {
    _assert(
      !this.reloadListener,
      this.auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    this.reloadListener = callback;
    if (this.reloadUserInfo) {
      this._notifyReloadListener(this.reloadUserInfo);
      this.reloadUserInfo = null;
    }
  }
  _notifyReloadListener(userInfo) {
    if (this.reloadListener) {
      this.reloadListener(userInfo);
    } else {
      this.reloadUserInfo = userInfo;
    }
  }
  _startProactiveRefresh() {
    this.proactiveRefresh._start();
  }
  _stopProactiveRefresh() {
    this.proactiveRefresh._stop();
  }
  async _updateTokensIfNecessary(response, reload2 = false) {
    let tokensRefreshed = false;
    if (response.idToken && response.idToken !== this.stsTokenManager.accessToken) {
      this.stsTokenManager.updateFromServerResponse(response);
      tokensRefreshed = true;
    }
    if (reload2) {
      await _reloadWithoutSaving(this);
    }
    await this.auth._persistUserIfCurrent(this);
    if (tokensRefreshed) {
      this.auth._notifyListenersIfCurrent(this);
    }
  }
  async delete() {
    if (_isFirebaseServerApp(this.auth.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this.auth));
    }
    const idToken = await this.getIdToken();
    await _logoutIfInvalidated(this, deleteAccount(this.auth, { idToken }));
    this.stsTokenManager.clearRefreshToken();
    return this.auth.signOut();
  }
  toJSON() {
    return {
      uid: this.uid,
      email: this.email || void 0,
      emailVerified: this.emailVerified,
      displayName: this.displayName || void 0,
      isAnonymous: this.isAnonymous,
      photoURL: this.photoURL || void 0,
      phoneNumber: this.phoneNumber || void 0,
      tenantId: this.tenantId || void 0,
      providerData: this.providerData.map((userInfo) => ({ ...userInfo })),
      stsTokenManager: this.stsTokenManager.toJSON(),
      // Redirect event ID must be maintained in case there is a pending
      // redirect event.
      _redirectEventId: this._redirectEventId,
      ...this.metadata.toJSON(),
      // Required for compatibility with the legacy SDK (go/firebase-auth-sdk-persistence-parsing):
      apiKey: this.auth.config.apiKey,
      appName: this.auth.name
      // Missing authDomain will be tolerated by the legacy SDK.
      // stsTokenManager.apiKey isn't actually required (despite the legacy SDK persisting it).
    };
  }
  get refreshToken() {
    return this.stsTokenManager.refreshToken || "";
  }
  static _fromJSON(auth2, object) {
    const displayName = object.displayName ?? void 0;
    const email = object.email ?? void 0;
    const phoneNumber = object.phoneNumber ?? void 0;
    const photoURL = object.photoURL ?? void 0;
    const tenantId = object.tenantId ?? void 0;
    const _redirectEventId = object._redirectEventId ?? void 0;
    const createdAt = object.createdAt ?? void 0;
    const lastLoginAt = object.lastLoginAt ?? void 0;
    const { uid, emailVerified, isAnonymous, providerData, stsTokenManager: plainObjectTokenManager } = object;
    _assert(
      uid && plainObjectTokenManager,
      auth2,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const stsTokenManager = StsTokenManager.fromJSON(this.name, plainObjectTokenManager);
    _assert(
      typeof uid === "string",
      auth2,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    assertStringOrUndefined(displayName, auth2.name);
    assertStringOrUndefined(email, auth2.name);
    _assert(
      typeof emailVerified === "boolean",
      auth2,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof isAnonymous === "boolean",
      auth2,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    assertStringOrUndefined(phoneNumber, auth2.name);
    assertStringOrUndefined(photoURL, auth2.name);
    assertStringOrUndefined(tenantId, auth2.name);
    assertStringOrUndefined(_redirectEventId, auth2.name);
    assertStringOrUndefined(createdAt, auth2.name);
    assertStringOrUndefined(lastLoginAt, auth2.name);
    const user = new _UserImpl({
      uid,
      auth: auth2,
      email,
      emailVerified,
      displayName,
      isAnonymous,
      photoURL,
      phoneNumber,
      tenantId,
      stsTokenManager,
      createdAt,
      lastLoginAt
    });
    if (providerData && Array.isArray(providerData)) {
      user.providerData = providerData.map((userInfo) => ({ ...userInfo }));
    }
    if (_redirectEventId) {
      user._redirectEventId = _redirectEventId;
    }
    return user;
  }
  /**
   * Initialize a User from an idToken server response
   * @param auth
   * @param idTokenResponse
   */
  static async _fromIdTokenResponse(auth2, idTokenResponse, isAnonymous = false) {
    const stsTokenManager = new StsTokenManager();
    stsTokenManager.updateFromServerResponse(idTokenResponse);
    const user = new _UserImpl({
      uid: idTokenResponse.localId,
      auth: auth2,
      stsTokenManager,
      isAnonymous
    });
    await _reloadWithoutSaving(user);
    return user;
  }
  /**
   * Initialize a User from an idToken server response
   * @param auth
   * @param idTokenResponse
   */
  static async _fromGetAccountInfoResponse(auth2, response, idToken) {
    const coreAccount = response.users[0];
    _assert(
      coreAccount.localId !== void 0,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const providerData = coreAccount.providerUserInfo !== void 0 ? extractProviderData(coreAccount.providerUserInfo) : [];
    const isAnonymous = !(coreAccount.email && coreAccount.passwordHash) && !providerData?.length;
    const stsTokenManager = new StsTokenManager();
    stsTokenManager.updateFromIdToken(idToken);
    const user = new _UserImpl({
      uid: coreAccount.localId,
      auth: auth2,
      stsTokenManager,
      isAnonymous
    });
    const updates = {
      uid: coreAccount.localId,
      displayName: coreAccount.displayName || null,
      photoURL: coreAccount.photoUrl || null,
      email: coreAccount.email || null,
      emailVerified: coreAccount.emailVerified || false,
      phoneNumber: coreAccount.phoneNumber || null,
      tenantId: coreAccount.tenantId || null,
      providerData,
      metadata: new UserMetadata(coreAccount.createdAt, coreAccount.lastLoginAt),
      isAnonymous: !(coreAccount.email && coreAccount.passwordHash) && !providerData?.length
    };
    Object.assign(user, updates);
    return user;
  }
};
var instanceCache = /* @__PURE__ */ new Map();
function _getInstance(cls) {
  debugAssert(cls instanceof Function, "Expected a class definition");
  let instance = instanceCache.get(cls);
  if (instance) {
    debugAssert(instance instanceof cls, "Instance stored in cache mismatched with class");
    return instance;
  }
  instance = new cls();
  instanceCache.set(cls, instance);
  return instance;
}
var InMemoryPersistence = class {
  constructor() {
    this.type = "NONE";
    this.storage = {};
  }
  async _isAvailable() {
    return true;
  }
  async _set(key, value) {
    this.storage[key] = value;
  }
  async _get(key) {
    const value = this.storage[key];
    return value === void 0 ? null : value;
  }
  async _remove(key) {
    delete this.storage[key];
  }
  _addListener(_key, _listener) {
    return;
  }
  _removeListener(_key, _listener) {
    return;
  }
};
InMemoryPersistence.type = "NONE";
var inMemoryPersistence = InMemoryPersistence;
function _persistenceKeyName(key, apiKey, appName) {
  return `${"firebase"}:${key}:${apiKey}:${appName}`;
}
var PersistenceUserManager = class _PersistenceUserManager {
  constructor(persistence, auth2, userKey) {
    this.persistence = persistence;
    this.auth = auth2;
    this.userKey = userKey;
    const { config, name: name5 } = this.auth;
    this.fullUserKey = _persistenceKeyName(this.userKey, config.apiKey, name5);
    this.fullPersistenceKey = _persistenceKeyName("persistence", config.apiKey, name5);
    this.boundEventHandler = auth2._onStorageEvent.bind(auth2);
    this.persistence._addListener(this.fullUserKey, this.boundEventHandler);
  }
  setCurrentUser(user) {
    return this.persistence._set(this.fullUserKey, user.toJSON());
  }
  async getCurrentUser() {
    const blob = await this.persistence._get(this.fullUserKey);
    if (!blob) {
      return null;
    }
    if (typeof blob === "string") {
      const response = await getAccountInfo(this.auth, { idToken: blob }).catch(() => void 0);
      if (!response) {
        return null;
      }
      return UserImpl._fromGetAccountInfoResponse(this.auth, response, blob);
    }
    return UserImpl._fromJSON(this.auth, blob);
  }
  removeCurrentUser() {
    return this.persistence._remove(this.fullUserKey);
  }
  savePersistenceForRedirect() {
    return this.persistence._set(this.fullPersistenceKey, this.persistence.type);
  }
  async setPersistence(newPersistence) {
    if (this.persistence === newPersistence) {
      return;
    }
    const currentUser = await this.getCurrentUser();
    await this.removeCurrentUser();
    this.persistence = newPersistence;
    if (currentUser) {
      return this.setCurrentUser(currentUser);
    }
  }
  delete() {
    this.persistence._removeListener(this.fullUserKey, this.boundEventHandler);
  }
  static async create(auth2, persistenceHierarchy, userKey = "authUser") {
    if (!persistenceHierarchy.length) {
      return new _PersistenceUserManager(_getInstance(inMemoryPersistence), auth2, userKey);
    }
    const availablePersistences = (await Promise.all(persistenceHierarchy.map(async (persistence) => {
      if (await persistence._isAvailable()) {
        return persistence;
      }
      return void 0;
    }))).filter((persistence) => persistence);
    let selectedPersistence = availablePersistences[0] || _getInstance(inMemoryPersistence);
    const key = _persistenceKeyName(userKey, auth2.config.apiKey, auth2.name);
    let userToMigrate = null;
    for (const persistence of persistenceHierarchy) {
      try {
        const blob = await persistence._get(key);
        if (blob) {
          let user;
          if (typeof blob === "string") {
            const response = await getAccountInfo(auth2, {
              idToken: blob
            }).catch(() => void 0);
            if (!response) {
              break;
            }
            user = await UserImpl._fromGetAccountInfoResponse(auth2, response, blob);
          } else {
            user = UserImpl._fromJSON(auth2, blob);
          }
          if (persistence !== selectedPersistence) {
            userToMigrate = user;
          }
          selectedPersistence = persistence;
          break;
        }
      } catch {
      }
    }
    const migrationHierarchy = availablePersistences.filter((p) => p._shouldAllowMigration);
    if (!selectedPersistence._shouldAllowMigration || !migrationHierarchy.length) {
      return new _PersistenceUserManager(selectedPersistence, auth2, userKey);
    }
    selectedPersistence = migrationHierarchy[0];
    if (userToMigrate) {
      await selectedPersistence._set(key, userToMigrate.toJSON());
    }
    await Promise.all(persistenceHierarchy.map(async (persistence) => {
      if (persistence !== selectedPersistence) {
        try {
          await persistence._remove(key);
        } catch {
        }
      }
    }));
    return new _PersistenceUserManager(selectedPersistence, auth2, userKey);
  }
};
function _getBrowserName(userAgent) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("opera/") || ua.includes("opr/") || ua.includes("opios/")) {
    return "Opera";
  } else if (_isIEMobile(ua)) {
    return "IEMobile";
  } else if (ua.includes("msie") || ua.includes("trident/")) {
    return "IE";
  } else if (ua.includes("edge/")) {
    return "Edge";
  } else if (_isFirefox(ua)) {
    return "Firefox";
  } else if (ua.includes("silk/")) {
    return "Silk";
  } else if (_isBlackBerry(ua)) {
    return "Blackberry";
  } else if (_isWebOS(ua)) {
    return "Webos";
  } else if (_isSafari(ua)) {
    return "Safari";
  } else if ((ua.includes("chrome/") || _isChromeIOS(ua)) && !ua.includes("edge/")) {
    return "Chrome";
  } else if (_isAndroid(ua)) {
    return "Android";
  } else {
    const re = /([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/;
    const matches = userAgent.match(re);
    if (matches?.length === 2) {
      return matches[1];
    }
  }
  return "Other";
}
function _isFirefox(ua = getUA()) {
  return /firefox\//i.test(ua);
}
function _isSafari(userAgent = getUA()) {
  const ua = userAgent.toLowerCase();
  return ua.includes("safari/") && !ua.includes("chrome/") && !ua.includes("crios/") && !ua.includes("android");
}
function _isChromeIOS(ua = getUA()) {
  return /crios\//i.test(ua);
}
function _isIEMobile(ua = getUA()) {
  return /iemobile/i.test(ua);
}
function _isAndroid(ua = getUA()) {
  return /android/i.test(ua);
}
function _isBlackBerry(ua = getUA()) {
  return /blackberry/i.test(ua);
}
function _isWebOS(ua = getUA()) {
  return /webos/i.test(ua);
}
function _getClientVersion(clientPlatform, frameworks = []) {
  let reportedPlatform;
  switch (clientPlatform) {
    case "Browser":
      reportedPlatform = _getBrowserName(getUA());
      break;
    case "Worker":
      reportedPlatform = `${_getBrowserName(getUA())}-${clientPlatform}`;
      break;
    default:
      reportedPlatform = clientPlatform;
  }
  const reportedFrameworks = frameworks.length ? frameworks.join(",") : "FirebaseCore-web";
  return `${reportedPlatform}/${"JsCore"}/${SDK_VERSION}/${reportedFrameworks}`;
}
var AuthMiddlewareQueue = class {
  constructor(auth2) {
    this.auth = auth2;
    this.queue = [];
  }
  pushCallback(callback, onAbort) {
    const wrappedCallback = (user) => new Promise((resolve, reject) => {
      try {
        const result = callback(user);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
    wrappedCallback.onAbort = onAbort;
    this.queue.push(wrappedCallback);
    const index = this.queue.length - 1;
    return () => {
      this.queue[index] = () => Promise.resolve();
    };
  }
  async runMiddleware(nextUser) {
    if (this.auth.currentUser === nextUser) {
      return;
    }
    const onAbortStack = [];
    try {
      for (const beforeStateCallback of this.queue) {
        await beforeStateCallback(nextUser);
        if (beforeStateCallback.onAbort) {
          onAbortStack.push(beforeStateCallback.onAbort);
        }
      }
    } catch (e) {
      onAbortStack.reverse();
      for (const onAbort of onAbortStack) {
        try {
          onAbort();
        } catch (_) {
        }
      }
      throw this.auth._errorFactory.create("login-blocked", {
        originalMessage: e?.message
      });
    }
  }
};
async function _getPasswordPolicy(auth2, request = {}) {
  return _performApiRequest(auth2, "GET", "/v2/passwordPolicy", _addTidIfNecessary(auth2, request));
}
var MINIMUM_MIN_PASSWORD_LENGTH = 6;
var PasswordPolicyImpl = class {
  constructor(response) {
    const responseOptions = response.customStrengthOptions;
    this.customStrengthOptions = {};
    this.customStrengthOptions.minPasswordLength = responseOptions.minPasswordLength ?? MINIMUM_MIN_PASSWORD_LENGTH;
    if (responseOptions.maxPasswordLength) {
      this.customStrengthOptions.maxPasswordLength = responseOptions.maxPasswordLength;
    }
    if (responseOptions.containsLowercaseCharacter !== void 0) {
      this.customStrengthOptions.containsLowercaseLetter = responseOptions.containsLowercaseCharacter;
    }
    if (responseOptions.containsUppercaseCharacter !== void 0) {
      this.customStrengthOptions.containsUppercaseLetter = responseOptions.containsUppercaseCharacter;
    }
    if (responseOptions.containsNumericCharacter !== void 0) {
      this.customStrengthOptions.containsNumericCharacter = responseOptions.containsNumericCharacter;
    }
    if (responseOptions.containsNonAlphanumericCharacter !== void 0) {
      this.customStrengthOptions.containsNonAlphanumericCharacter = responseOptions.containsNonAlphanumericCharacter;
    }
    this.enforcementState = response.enforcementState;
    if (this.enforcementState === "ENFORCEMENT_STATE_UNSPECIFIED") {
      this.enforcementState = "OFF";
    }
    this.allowedNonAlphanumericCharacters = response.allowedNonAlphanumericCharacters?.join("") ?? "";
    this.forceUpgradeOnSignin = response.forceUpgradeOnSignin ?? false;
    this.schemaVersion = response.schemaVersion;
  }
  validatePassword(password) {
    const status = {
      isValid: true,
      passwordPolicy: this
    };
    this.validatePasswordLengthOptions(password, status);
    this.validatePasswordCharacterOptions(password, status);
    status.isValid && (status.isValid = status.meetsMinPasswordLength ?? true);
    status.isValid && (status.isValid = status.meetsMaxPasswordLength ?? true);
    status.isValid && (status.isValid = status.containsLowercaseLetter ?? true);
    status.isValid && (status.isValid = status.containsUppercaseLetter ?? true);
    status.isValid && (status.isValid = status.containsNumericCharacter ?? true);
    status.isValid && (status.isValid = status.containsNonAlphanumericCharacter ?? true);
    return status;
  }
  /**
   * Validates that the password meets the length options for the policy.
   *
   * @param password Password to validate.
   * @param status Validation status.
   */
  validatePasswordLengthOptions(password, status) {
    const minPasswordLength = this.customStrengthOptions.minPasswordLength;
    const maxPasswordLength = this.customStrengthOptions.maxPasswordLength;
    if (minPasswordLength) {
      status.meetsMinPasswordLength = password.length >= minPasswordLength;
    }
    if (maxPasswordLength) {
      status.meetsMaxPasswordLength = password.length <= maxPasswordLength;
    }
  }
  /**
   * Validates that the password meets the character options for the policy.
   *
   * @param password Password to validate.
   * @param status Validation status.
   */
  validatePasswordCharacterOptions(password, status) {
    this.updatePasswordCharacterOptionsStatuses(
      status,
      /* containsLowercaseCharacter= */
      false,
      /* containsUppercaseCharacter= */
      false,
      /* containsNumericCharacter= */
      false,
      /* containsNonAlphanumericCharacter= */
      false
    );
    let passwordChar;
    for (let i = 0; i < password.length; i++) {
      passwordChar = password.charAt(i);
      this.updatePasswordCharacterOptionsStatuses(
        status,
        /* containsLowercaseCharacter= */
        passwordChar >= "a" && passwordChar <= "z",
        /* containsUppercaseCharacter= */
        passwordChar >= "A" && passwordChar <= "Z",
        /* containsNumericCharacter= */
        passwordChar >= "0" && passwordChar <= "9",
        /* containsNonAlphanumericCharacter= */
        this.allowedNonAlphanumericCharacters.includes(passwordChar)
      );
    }
  }
  /**
   * Updates the running validation status with the statuses for the character options.
   * Expected to be called each time a character is processed to update each option status
   * based on the current character.
   *
   * @param status Validation status.
   * @param containsLowercaseCharacter Whether the character is a lowercase letter.
   * @param containsUppercaseCharacter Whether the character is an uppercase letter.
   * @param containsNumericCharacter Whether the character is a numeric character.
   * @param containsNonAlphanumericCharacter Whether the character is a non-alphanumeric character.
   */
  updatePasswordCharacterOptionsStatuses(status, containsLowercaseCharacter, containsUppercaseCharacter, containsNumericCharacter, containsNonAlphanumericCharacter) {
    if (this.customStrengthOptions.containsLowercaseLetter) {
      status.containsLowercaseLetter || (status.containsLowercaseLetter = containsLowercaseCharacter);
    }
    if (this.customStrengthOptions.containsUppercaseLetter) {
      status.containsUppercaseLetter || (status.containsUppercaseLetter = containsUppercaseCharacter);
    }
    if (this.customStrengthOptions.containsNumericCharacter) {
      status.containsNumericCharacter || (status.containsNumericCharacter = containsNumericCharacter);
    }
    if (this.customStrengthOptions.containsNonAlphanumericCharacter) {
      status.containsNonAlphanumericCharacter || (status.containsNonAlphanumericCharacter = containsNonAlphanumericCharacter);
    }
  }
};
var AuthImpl = class {
  constructor(app2, heartbeatServiceProvider, appCheckServiceProvider, config) {
    this.app = app2;
    this.heartbeatServiceProvider = heartbeatServiceProvider;
    this.appCheckServiceProvider = appCheckServiceProvider;
    this.config = config;
    this.currentUser = null;
    this.emulatorConfig = null;
    this.operations = Promise.resolve();
    this.authStateSubscription = new Subscription(this);
    this.idTokenSubscription = new Subscription(this);
    this.beforeStateQueue = new AuthMiddlewareQueue(this);
    this.redirectUser = null;
    this.isProactiveRefreshEnabled = false;
    this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION = 1;
    this._canInitEmulator = true;
    this._isInitialized = false;
    this._deleted = false;
    this._initializationPromise = null;
    this._popupRedirectResolver = null;
    this._errorFactory = _DEFAULT_AUTH_ERROR_FACTORY;
    this._agentRecaptchaConfig = null;
    this._tenantRecaptchaConfigs = {};
    this._projectPasswordPolicy = null;
    this._tenantPasswordPolicies = {};
    this._resolvePersistenceManagerAvailable = void 0;
    this.lastNotifiedUid = void 0;
    this.languageCode = null;
    this.tenantId = null;
    this.settings = { appVerificationDisabledForTesting: false };
    this.frameworks = [];
    this.name = app2.name;
    this.clientVersion = config.sdkClientVersion;
    this._persistenceManagerAvailable = new Promise((resolve) => this._resolvePersistenceManagerAvailable = resolve);
  }
  _initializeWithPersistence(persistenceHierarchy, popupRedirectResolver) {
    if (popupRedirectResolver) {
      this._popupRedirectResolver = _getInstance(popupRedirectResolver);
    }
    this._initializationPromise = this.queue(async () => {
      if (this._deleted) {
        return;
      }
      this.persistenceManager = await PersistenceUserManager.create(this, persistenceHierarchy);
      this._resolvePersistenceManagerAvailable?.();
      if (this._deleted) {
        return;
      }
      if (this._popupRedirectResolver?._shouldInitProactively) {
        try {
          await this._popupRedirectResolver._initialize(this);
        } catch (e) {
        }
      }
      await this.initializeCurrentUser(popupRedirectResolver);
      this.lastNotifiedUid = this.currentUser?.uid || null;
      if (this._deleted) {
        return;
      }
      this._isInitialized = true;
    });
    return this._initializationPromise;
  }
  /**
   * If the persistence is changed in another window, the user manager will let us know
   */
  async _onStorageEvent() {
    if (this._deleted) {
      return;
    }
    const user = await this.assertedPersistence.getCurrentUser();
    if (!this.currentUser && !user) {
      return;
    }
    if (this.currentUser && user && this.currentUser.uid === user.uid) {
      this._currentUser._assign(user);
      await this.currentUser.getIdToken();
      return;
    }
    await this._updateCurrentUser(
      user,
      /* skipBeforeStateCallbacks */
      true
    );
  }
  async initializeCurrentUserFromIdToken(idToken) {
    try {
      const response = await getAccountInfo(this, { idToken });
      const user = await UserImpl._fromGetAccountInfoResponse(this, response, idToken);
      await this.directlySetCurrentUser(user);
    } catch (err) {
      console.warn("FirebaseServerApp could not login user with provided authIdToken: ", err);
      await this.directlySetCurrentUser(null);
    }
  }
  async initializeCurrentUser(popupRedirectResolver) {
    if (_isFirebaseServerApp(this.app)) {
      const idToken = this.app.settings.authIdToken;
      if (idToken) {
        return new Promise((resolve) => {
          setTimeout(() => this.initializeCurrentUserFromIdToken(idToken).then(resolve, resolve));
        });
      } else {
        return this.directlySetCurrentUser(null);
      }
    }
    const previouslyStoredUser = await this.assertedPersistence.getCurrentUser();
    let futureCurrentUser = previouslyStoredUser;
    let needsTocheckMiddleware = false;
    if (popupRedirectResolver && this.config.authDomain) {
      await this.getOrInitRedirectPersistenceManager();
      const redirectUserEventId = this.redirectUser?._redirectEventId;
      const storedUserEventId = futureCurrentUser?._redirectEventId;
      const result = await this.tryRedirectSignIn(popupRedirectResolver);
      if ((!redirectUserEventId || redirectUserEventId === storedUserEventId) && result?.user) {
        futureCurrentUser = result.user;
        needsTocheckMiddleware = true;
      }
    }
    if (!futureCurrentUser) {
      return this.directlySetCurrentUser(null);
    }
    if (!futureCurrentUser._redirectEventId) {
      if (needsTocheckMiddleware) {
        try {
          await this.beforeStateQueue.runMiddleware(futureCurrentUser);
        } catch (e) {
          futureCurrentUser = previouslyStoredUser;
          this._popupRedirectResolver._overrideRedirectResult(this, () => Promise.reject(e));
        }
      }
      if (futureCurrentUser) {
        return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
      } else {
        return this.directlySetCurrentUser(null);
      }
    }
    _assert(
      this._popupRedirectResolver,
      this,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    await this.getOrInitRedirectPersistenceManager();
    if (this.redirectUser && this.redirectUser._redirectEventId === futureCurrentUser._redirectEventId) {
      return this.directlySetCurrentUser(futureCurrentUser);
    }
    return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
  }
  async tryRedirectSignIn(redirectResolver) {
    let result = null;
    try {
      result = await this._popupRedirectResolver._completeRedirectFn(this, redirectResolver, true);
    } catch (e) {
      await this._setRedirectUser(null);
    }
    return result;
  }
  async reloadAndSetCurrentUserOrClear(user) {
    try {
      await _reloadWithoutSaving(user);
    } catch (e) {
      if (e?.code !== `auth/${"network-request-failed"}`) {
        return this.directlySetCurrentUser(null);
      }
    }
    return this.directlySetCurrentUser(user);
  }
  useDeviceLanguage() {
    this.languageCode = _getUserLanguage();
  }
  async _delete() {
    this._deleted = true;
  }
  async updateCurrentUser(userExtern) {
    if (_isFirebaseServerApp(this.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
    }
    const user = userExtern ? getModularInstance(userExtern) : null;
    if (user) {
      _assert(
        user.auth.config.apiKey === this.config.apiKey,
        this,
        "invalid-user-token"
        /* AuthErrorCode.INVALID_AUTH */
      );
    }
    return this._updateCurrentUser(user && user._clone(this));
  }
  async _updateCurrentUser(user, skipBeforeStateCallbacks = false) {
    if (this._deleted) {
      return;
    }
    if (user) {
      _assert(
        this.tenantId === user.tenantId,
        this,
        "tenant-id-mismatch"
        /* AuthErrorCode.TENANT_ID_MISMATCH */
      );
    }
    if (!skipBeforeStateCallbacks) {
      await this.beforeStateQueue.runMiddleware(user);
    }
    return this.queue(async () => {
      await this.directlySetCurrentUser(user);
      this.notifyAuthListeners();
    });
  }
  async signOut() {
    if (_isFirebaseServerApp(this.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
    }
    await this.beforeStateQueue.runMiddleware(null);
    if (this.redirectPersistenceManager || this._popupRedirectResolver) {
      await this._setRedirectUser(null);
    }
    return this._updateCurrentUser(
      null,
      /* skipBeforeStateCallbacks */
      true
    );
  }
  setPersistence(persistence) {
    if (_isFirebaseServerApp(this.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
    }
    return this.queue(async () => {
      await this.assertedPersistence.setPersistence(_getInstance(persistence));
    });
  }
  _getRecaptchaConfig() {
    if (this.tenantId == null) {
      return this._agentRecaptchaConfig;
    } else {
      return this._tenantRecaptchaConfigs[this.tenantId];
    }
  }
  async validatePassword(password) {
    if (!this._getPasswordPolicyInternal()) {
      await this._updatePasswordPolicy();
    }
    const passwordPolicy = this._getPasswordPolicyInternal();
    if (passwordPolicy.schemaVersion !== this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION) {
      return Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version", {}));
    }
    return passwordPolicy.validatePassword(password);
  }
  _getPasswordPolicyInternal() {
    if (this.tenantId === null) {
      return this._projectPasswordPolicy;
    } else {
      return this._tenantPasswordPolicies[this.tenantId];
    }
  }
  async _updatePasswordPolicy() {
    const response = await _getPasswordPolicy(this);
    const passwordPolicy = new PasswordPolicyImpl(response);
    if (this.tenantId === null) {
      this._projectPasswordPolicy = passwordPolicy;
    } else {
      this._tenantPasswordPolicies[this.tenantId] = passwordPolicy;
    }
  }
  _getPersistenceType() {
    return this.assertedPersistence.persistence.type;
  }
  _getPersistence() {
    return this.assertedPersistence.persistence;
  }
  _updateErrorMap(errorMap) {
    this._errorFactory = new ErrorFactory("auth", "Firebase", errorMap());
  }
  onAuthStateChanged(nextOrObserver, error, completed) {
    return this.registerStateListener(this.authStateSubscription, nextOrObserver, error, completed);
  }
  beforeAuthStateChanged(callback, onAbort) {
    return this.beforeStateQueue.pushCallback(callback, onAbort);
  }
  onIdTokenChanged(nextOrObserver, error, completed) {
    return this.registerStateListener(this.idTokenSubscription, nextOrObserver, error, completed);
  }
  authStateReady() {
    return new Promise((resolve, reject) => {
      if (this.currentUser) {
        resolve();
      } else {
        const unsubscribe = this.onAuthStateChanged(() => {
          unsubscribe();
          resolve();
        }, reject);
      }
    });
  }
  /**
   * Revokes the given access token. Currently only supports Apple OAuth access tokens.
   */
  async revokeAccessToken(token) {
    if (this.currentUser) {
      const idToken = await this.currentUser.getIdToken();
      const request = {
        providerId: "apple.com",
        tokenType: "ACCESS_TOKEN",
        token,
        idToken
      };
      if (this.tenantId != null) {
        request.tenantId = this.tenantId;
      }
      await revokeToken(this, request);
    }
  }
  toJSON() {
    return {
      apiKey: this.config.apiKey,
      authDomain: this.config.authDomain,
      appName: this.name,
      currentUser: this._currentUser?.toJSON()
    };
  }
  async _setRedirectUser(user, popupRedirectResolver) {
    const redirectManager = await this.getOrInitRedirectPersistenceManager(popupRedirectResolver);
    return user === null ? redirectManager.removeCurrentUser() : redirectManager.setCurrentUser(user);
  }
  async getOrInitRedirectPersistenceManager(popupRedirectResolver) {
    if (!this.redirectPersistenceManager) {
      const resolver = popupRedirectResolver && _getInstance(popupRedirectResolver) || this._popupRedirectResolver;
      _assert(
        resolver,
        this,
        "argument-error"
        /* AuthErrorCode.ARGUMENT_ERROR */
      );
      this.redirectPersistenceManager = await PersistenceUserManager.create(
        this,
        [_getInstance(resolver._redirectPersistence)],
        "redirectUser"
        /* KeyName.REDIRECT_USER */
      );
      this.redirectUser = await this.redirectPersistenceManager.getCurrentUser();
    }
    return this.redirectPersistenceManager;
  }
  async _redirectUserForId(id) {
    if (this._isInitialized) {
      await this.queue(async () => {
      });
    }
    if (this._currentUser?._redirectEventId === id) {
      return this._currentUser;
    }
    if (this.redirectUser?._redirectEventId === id) {
      return this.redirectUser;
    }
    return null;
  }
  async _persistUserIfCurrent(user) {
    if (user === this.currentUser) {
      return this.queue(async () => this.directlySetCurrentUser(user));
    }
  }
  /** Notifies listeners only if the user is current */
  _notifyListenersIfCurrent(user) {
    if (user === this.currentUser) {
      this.notifyAuthListeners();
    }
  }
  _key() {
    return `${this.config.authDomain}:${this.config.apiKey}:${this.name}`;
  }
  _startProactiveRefresh() {
    this.isProactiveRefreshEnabled = true;
    if (this.currentUser) {
      this._currentUser._startProactiveRefresh();
    }
  }
  _stopProactiveRefresh() {
    this.isProactiveRefreshEnabled = false;
    if (this.currentUser) {
      this._currentUser._stopProactiveRefresh();
    }
  }
  /** Returns the current user cast as the internal type */
  get _currentUser() {
    return this.currentUser;
  }
  notifyAuthListeners() {
    if (!this._isInitialized) {
      return;
    }
    this.idTokenSubscription.next(this.currentUser);
    const currentUid = this.currentUser?.uid ?? null;
    if (this.lastNotifiedUid !== currentUid) {
      this.lastNotifiedUid = currentUid;
      this.authStateSubscription.next(this.currentUser);
    }
  }
  registerStateListener(subscription, nextOrObserver, error, completed) {
    if (this._deleted) {
      return () => {
      };
    }
    const cb = typeof nextOrObserver === "function" ? nextOrObserver : nextOrObserver.next.bind(nextOrObserver);
    let isUnsubscribed = false;
    const promise = this._isInitialized ? Promise.resolve() : this._initializationPromise;
    _assert(
      promise,
      this,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    promise.then(() => {
      if (isUnsubscribed) {
        return;
      }
      cb(this.currentUser);
    });
    if (typeof nextOrObserver === "function") {
      const unsubscribe = subscription.addObserver(nextOrObserver, error, completed);
      return () => {
        isUnsubscribed = true;
        unsubscribe();
      };
    } else {
      const unsubscribe = subscription.addObserver(nextOrObserver);
      return () => {
        isUnsubscribed = true;
        unsubscribe();
      };
    }
  }
  /**
   * Unprotected (from race conditions) method to set the current user. This
   * should only be called from within a queued callback. This is necessary
   * because the queue shouldn't rely on another queued callback.
   */
  async directlySetCurrentUser(user) {
    if (this.currentUser && this.currentUser !== user) {
      this._currentUser._stopProactiveRefresh();
    }
    if (user && this.isProactiveRefreshEnabled) {
      user._startProactiveRefresh();
    }
    this.currentUser = user;
    if (user) {
      await this.assertedPersistence.setCurrentUser(user);
    } else {
      await this.assertedPersistence.removeCurrentUser();
    }
  }
  queue(action) {
    this.operations = this.operations.then(action, action);
    return this.operations;
  }
  get assertedPersistence() {
    _assert(
      this.persistenceManager,
      this,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return this.persistenceManager;
  }
  _logFramework(framework) {
    if (!framework || this.frameworks.includes(framework)) {
      return;
    }
    this.frameworks.push(framework);
    this.frameworks.sort();
    this.clientVersion = _getClientVersion(this.config.clientPlatform, this._getFrameworks());
  }
  _getFrameworks() {
    return this.frameworks;
  }
  async _getAdditionalHeaders() {
    const headers = {
      [
        "X-Client-Version"
        /* HttpHeader.X_CLIENT_VERSION */
      ]: this.clientVersion
    };
    if (this.app.options.appId) {
      headers[
        "X-Firebase-gmpid"
        /* HttpHeader.X_FIREBASE_GMPID */
      ] = this.app.options.appId;
    }
    const heartbeatsHeader = await this.heartbeatServiceProvider.getImmediate({
      optional: true
    })?.getHeartbeatsHeader();
    if (heartbeatsHeader) {
      headers[
        "X-Firebase-Client"
        /* HttpHeader.X_FIREBASE_CLIENT */
      ] = heartbeatsHeader;
    }
    const appCheckToken = await this._getAppCheckToken();
    if (appCheckToken) {
      headers[
        "X-Firebase-AppCheck"
        /* HttpHeader.X_FIREBASE_APP_CHECK */
      ] = appCheckToken;
    }
    return headers;
  }
  async _getAppCheckToken() {
    if (_isFirebaseServerApp(this.app) && this.app.settings.appCheckToken) {
      return this.app.settings.appCheckToken;
    }
    const appCheckTokenResult = await this.appCheckServiceProvider.getImmediate({ optional: true })?.getToken();
    if (appCheckTokenResult?.error) {
      _logWarn(`Error while retrieving App Check token: ${appCheckTokenResult.error}`);
    }
    return appCheckTokenResult?.token;
  }
};
function _castAuth(auth2) {
  return getModularInstance(auth2);
}
var Subscription = class {
  constructor(auth2) {
    this.auth = auth2;
    this.observer = null;
    this.addObserver = createSubscribe((observer) => this.observer = observer);
  }
  get next() {
    _assert(
      this.observer,
      this.auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return this.observer.next.bind(this.observer);
  }
};
var externalJSProvider = {
  async loadJS() {
    throw new Error("Unable to load external scripts");
  },
  recaptchaV2Script: "",
  recaptchaEnterpriseScript: "",
  gapiScript: ""
};
function _loadJS(url) {
  return externalJSProvider.loadJS(url);
}
function _recaptchaEnterpriseScriptUrl() {
  return externalJSProvider.recaptchaEnterpriseScript;
}
var MockGreCAPTCHATopLevel = class {
  constructor() {
    this.enterprise = new MockGreCAPTCHA();
  }
  ready(callback) {
    callback();
  }
  execute(_siteKey, _options) {
    return Promise.resolve("token");
  }
  render(_container, _parameters) {
    return "";
  }
};
var MockGreCAPTCHA = class {
  ready(callback) {
    callback();
  }
  execute(_siteKey, _options) {
    return Promise.resolve("token");
  }
  render(_container, _parameters) {
    return "";
  }
};
var RECAPTCHA_ENTERPRISE_VERIFIER_TYPE = "recaptcha-enterprise";
var FAKE_TOKEN = "NO_RECAPTCHA";
var RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME = "onFirebaseAuthREInstanceReady";
var RecaptchaEnterpriseVerifier = class _RecaptchaEnterpriseVerifier {
  /**
   *
   * @param authExtern - The corresponding Firebase {@link Auth} instance.
   *
   */
  constructor(authExtern) {
    this.type = RECAPTCHA_ENTERPRISE_VERIFIER_TYPE;
    this.auth = _castAuth(authExtern);
  }
  /**
   * Executes the verification process.
   *
   * @returns A Promise for a token that can be used to assert the validity of a request.
   */
  async verify(action = "verify", forceRefresh = false) {
    async function retrieveSiteKey(auth2) {
      if (!forceRefresh) {
        if (auth2.tenantId == null && auth2._agentRecaptchaConfig != null) {
          return auth2._agentRecaptchaConfig.siteKey;
        }
        if (auth2.tenantId != null && auth2._tenantRecaptchaConfigs[auth2.tenantId] !== void 0) {
          return auth2._tenantRecaptchaConfigs[auth2.tenantId].siteKey;
        }
      }
      return new Promise(async (resolve, reject) => {
        getRecaptchaConfig(auth2, {
          clientType: "CLIENT_TYPE_WEB",
          version: "RECAPTCHA_ENTERPRISE"
          /* RecaptchaVersion.ENTERPRISE */
        }).then((response) => {
          if (response.recaptchaKey === void 0) {
            reject(new Error("recaptcha Enterprise site key undefined"));
          } else {
            const config = new RecaptchaConfig(response);
            if (auth2.tenantId == null) {
              auth2._agentRecaptchaConfig = config;
            } else {
              auth2._tenantRecaptchaConfigs[auth2.tenantId] = config;
            }
            return resolve(config.siteKey);
          }
        }).catch((error) => {
          reject(error);
        });
      });
    }
    function retrieveRecaptchaToken(siteKey, resolve, reject) {
      const grecaptcha = window.grecaptcha;
      if (isEnterprise(grecaptcha)) {
        grecaptcha.enterprise.ready(() => {
          grecaptcha.enterprise.execute(siteKey, { action }).then((token) => {
            resolve(token);
          }).catch(() => {
            resolve(FAKE_TOKEN);
          });
        });
      } else {
        reject(Error("No reCAPTCHA enterprise script loaded."));
      }
    }
    if (this.auth.settings.appVerificationDisabledForTesting) {
      const mockRecaptcha = new MockGreCAPTCHATopLevel();
      return mockRecaptcha.execute("siteKey", { action: "verify" });
    }
    return new Promise((resolve, reject) => {
      retrieveSiteKey(this.auth).then(async (siteKey) => {
        if (!forceRefresh && isEnterprise(window.grecaptcha) && // If download has already been initiated, do not trigger another
        // download, await the promise here.
        _RecaptchaEnterpriseVerifier.scriptInjectionDeferred) {
          await _RecaptchaEnterpriseVerifier.scriptInjectionDeferred.promise;
          retrieveRecaptchaToken(siteKey, resolve, reject);
        } else {
          if (typeof window === "undefined") {
            reject(new Error("RecaptchaVerifier is only supported in browser"));
            return;
          }
          let url = _recaptchaEnterpriseScriptUrl();
          if (url.length !== 0) {
            url += siteKey + `&onload=${RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME}`;
          }
          _RecaptchaEnterpriseVerifier.scriptInjectionDeferred = new Deferred();
          window[RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME] = () => {
            _RecaptchaEnterpriseVerifier.scriptInjectionDeferred?.resolve();
          };
          _loadJS(url).then(() => _RecaptchaEnterpriseVerifier.scriptInjectionDeferred?.promise).then(() => {
            retrieveRecaptchaToken(siteKey, resolve, reject);
          }).catch((error) => {
            reject(error);
          });
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
RecaptchaEnterpriseVerifier.scriptInjectionDeferred = null;
async function injectRecaptchaFields(auth2, request, action, isCaptchaResp = false, isFakeToken = false) {
  const verifier = new RecaptchaEnterpriseVerifier(auth2);
  let captchaResponse;
  if (isFakeToken) {
    captchaResponse = FAKE_TOKEN;
  } else {
    try {
      captchaResponse = await verifier.verify(action);
    } catch (error) {
      captchaResponse = await verifier.verify(action, true);
    }
  }
  const newRequest = { ...request };
  if (action === "mfaSmsEnrollment" || action === "mfaSmsSignIn") {
    if ("phoneEnrollmentInfo" in newRequest) {
      const phoneNumber = newRequest.phoneEnrollmentInfo.phoneNumber;
      const recaptchaToken = newRequest.phoneEnrollmentInfo.recaptchaToken;
      Object.assign(newRequest, {
        "phoneEnrollmentInfo": {
          phoneNumber,
          recaptchaToken,
          captchaResponse,
          "clientType": "CLIENT_TYPE_WEB",
          "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
          /* RecaptchaVersion.ENTERPRISE */
        }
      });
    } else if ("phoneSignInInfo" in newRequest) {
      const recaptchaToken = newRequest.phoneSignInInfo.recaptchaToken;
      Object.assign(newRequest, {
        "phoneSignInInfo": {
          recaptchaToken,
          captchaResponse,
          "clientType": "CLIENT_TYPE_WEB",
          "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
          /* RecaptchaVersion.ENTERPRISE */
        }
      });
    }
    return newRequest;
  }
  if (!isCaptchaResp) {
    Object.assign(newRequest, { captchaResponse });
  } else {
    Object.assign(newRequest, { "captchaResp": captchaResponse });
  }
  Object.assign(newRequest, {
    "clientType": "CLIENT_TYPE_WEB"
    /* RecaptchaClientType.WEB */
  });
  Object.assign(newRequest, {
    "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
    /* RecaptchaVersion.ENTERPRISE */
  });
  return newRequest;
}
async function handleRecaptchaFlow(authInstance, request, actionName, actionMethod, recaptchaAuthProvider) {
  if (recaptchaAuthProvider === "EMAIL_PASSWORD_PROVIDER") {
    if (authInstance._getRecaptchaConfig()?.isProviderEnabled(
      "EMAIL_PASSWORD_PROVIDER"
      /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
    )) {
      const requestWithRecaptcha = await injectRecaptchaFields(
        authInstance,
        request,
        actionName,
        actionName === "getOobCode"
        /* RecaptchaActionName.GET_OOB_CODE */
      );
      return actionMethod(authInstance, requestWithRecaptcha);
    } else {
      return actionMethod(authInstance, request).catch(async (error) => {
        if (error.code === `auth/${"missing-recaptcha-token"}`) {
          console.log(`${actionName} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);
          const requestWithRecaptcha = await injectRecaptchaFields(
            authInstance,
            request,
            actionName,
            actionName === "getOobCode"
            /* RecaptchaActionName.GET_OOB_CODE */
          );
          return actionMethod(authInstance, requestWithRecaptcha);
        } else {
          return Promise.reject(error);
        }
      });
    }
  } else if (recaptchaAuthProvider === "PHONE_PROVIDER") {
    if (authInstance._getRecaptchaConfig()?.isProviderEnabled(
      "PHONE_PROVIDER"
      /* RecaptchaAuthProvider.PHONE_PROVIDER */
    )) {
      const requestWithRecaptcha = await injectRecaptchaFields(authInstance, request, actionName);
      return actionMethod(authInstance, requestWithRecaptcha).catch(async (error) => {
        if (authInstance._getRecaptchaConfig()?.getProviderEnforcementState(
          "PHONE_PROVIDER"
          /* RecaptchaAuthProvider.PHONE_PROVIDER */
        ) === "AUDIT") {
          if (error.code === `auth/${"missing-recaptcha-token"}` || error.code === `auth/${"invalid-app-credential"}`) {
            console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${actionName} flow.`);
            const requestWithRecaptchaFields = await injectRecaptchaFields(
              authInstance,
              request,
              actionName,
              false,
              // isCaptchaResp
              true
              // isFakeToken
            );
            return actionMethod(authInstance, requestWithRecaptchaFields);
          }
        }
        return Promise.reject(error);
      });
    } else {
      const requestWithRecaptchaFields = await injectRecaptchaFields(
        authInstance,
        request,
        actionName,
        false,
        // isCaptchaResp
        true
        // isFakeToken
      );
      return actionMethod(authInstance, requestWithRecaptchaFields);
    }
  } else {
    return Promise.reject(recaptchaAuthProvider + " provider is not supported.");
  }
}
function initializeAuth(app2, deps) {
  const provider = _getProvider(app2, "auth");
  if (provider.isInitialized()) {
    const auth3 = provider.getImmediate();
    const initialOptions = provider.getOptions();
    if (deepEqual(initialOptions, deps ?? {})) {
      return auth3;
    } else {
      _fail(
        auth3,
        "already-initialized"
        /* AuthErrorCode.ALREADY_INITIALIZED */
      );
    }
  }
  const auth2 = provider.initialize({ options: deps });
  return auth2;
}
function _initializeAuthInstance(auth2, deps) {
  const persistence = deps?.persistence || [];
  const hierarchy = (Array.isArray(persistence) ? persistence : [persistence]).map(_getInstance);
  if (deps?.errorMap) {
    auth2._updateErrorMap(deps.errorMap);
  }
  auth2._initializeWithPersistence(hierarchy, deps?.popupRedirectResolver);
}
function connectAuthEmulator(auth2, url, options) {
  const authInternal = _castAuth(auth2);
  _assert(
    /^https?:\/\//.test(url),
    authInternal,
    "invalid-emulator-scheme"
    /* AuthErrorCode.INVALID_EMULATOR_SCHEME */
  );
  const disableWarnings = !!options?.disableWarnings;
  const protocol = extractProtocol(url);
  const { host, port } = extractHostAndPort(url);
  const portStr = port === null ? "" : `:${port}`;
  const emulator = { url: `${protocol}//${host}${portStr}/` };
  const emulatorConfig = Object.freeze({
    host,
    port,
    protocol: protocol.replace(":", ""),
    options: Object.freeze({ disableWarnings })
  });
  if (!authInternal._canInitEmulator) {
    _assert(
      authInternal.config.emulator && authInternal.emulatorConfig,
      authInternal,
      "emulator-config-failed"
      /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
    );
    _assert(
      deepEqual(emulator, authInternal.config.emulator) && deepEqual(emulatorConfig, authInternal.emulatorConfig),
      authInternal,
      "emulator-config-failed"
      /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
    );
    return;
  }
  authInternal.config.emulator = emulator;
  authInternal.emulatorConfig = emulatorConfig;
  authInternal.settings.appVerificationDisabledForTesting = true;
  if (isCloudWorkstation(host)) {
    void pingServer(`${protocol}//${host}${portStr}`);
  } else if (!disableWarnings) {
    emitEmulatorWarning();
  }
}
function extractProtocol(url) {
  const protocolEnd = url.indexOf(":");
  return protocolEnd < 0 ? "" : url.substr(0, protocolEnd + 1);
}
function extractHostAndPort(url) {
  const protocol = extractProtocol(url);
  const authority = /(\/\/)?([^?#/]+)/.exec(url.substr(protocol.length));
  if (!authority) {
    return { host: "", port: null };
  }
  const hostAndPort = authority[2].split("@").pop() || "";
  const bracketedIPv6 = /^(\[[^\]]+\])(:|$)/.exec(hostAndPort);
  if (bracketedIPv6) {
    const host = bracketedIPv6[1];
    return { host, port: parsePort(hostAndPort.substr(host.length + 1)) };
  } else {
    const [host, port] = hostAndPort.split(":");
    return { host, port: parsePort(port) };
  }
}
function parsePort(portStr) {
  if (!portStr) {
    return null;
  }
  const port = Number(portStr);
  if (isNaN(port)) {
    return null;
  }
  return port;
}
function emitEmulatorWarning() {
  function attachBanner() {
    const el = document.createElement("p");
    const sty = el.style;
    el.innerText = "Running in emulator mode. Do not use with production credentials.";
    sty.position = "fixed";
    sty.width = "100%";
    sty.backgroundColor = "#ffffff";
    sty.border = ".1em solid #000000";
    sty.color = "#b50000";
    sty.bottom = "0px";
    sty.left = "0px";
    sty.margin = "0px";
    sty.zIndex = "10000";
    sty.textAlign = "center";
    el.classList.add("firebase-emulator-warning");
    document.body.appendChild(el);
  }
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials.");
  }
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", attachBanner);
    } else {
      attachBanner();
    }
  }
}
var AuthCredential = class {
  /** @internal */
  constructor(providerId, signInMethod) {
    this.providerId = providerId;
    this.signInMethod = signInMethod;
  }
  /**
   * Returns a JSON-serializable representation of this object.
   *
   * @returns a JSON-serializable representation of this object.
   */
  toJSON() {
    return debugFail("not implemented");
  }
  /** @internal */
  _getIdTokenResponse(_auth) {
    return debugFail("not implemented");
  }
  /** @internal */
  _linkToIdToken(_auth, _idToken) {
    return debugFail("not implemented");
  }
  /** @internal */
  _getReauthenticationResolver(_auth) {
    return debugFail("not implemented");
  }
};
async function linkEmailPassword(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v1/accounts:signUp", request);
}
async function signInWithPassword(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithPassword", _addTidIfNecessary(auth2, request));
}
async function signInWithEmailLink$1(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithEmailLink", _addTidIfNecessary(auth2, request));
}
async function signInWithEmailLinkForLinking(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithEmailLink", _addTidIfNecessary(auth2, request));
}
var EmailAuthCredential = class _EmailAuthCredential extends AuthCredential {
  /** @internal */
  constructor(_email, _password, signInMethod, _tenantId = null) {
    super("password", signInMethod);
    this._email = _email;
    this._password = _password;
    this._tenantId = _tenantId;
  }
  /** @internal */
  static _fromEmailAndPassword(email, password) {
    return new _EmailAuthCredential(
      email,
      password,
      "password"
      /* SignInMethod.EMAIL_PASSWORD */
    );
  }
  /** @internal */
  static _fromEmailAndCode(email, oobCode, tenantId = null) {
    return new _EmailAuthCredential(email, oobCode, "emailLink", tenantId);
  }
  /** {@inheritdoc AuthCredential.toJSON} */
  toJSON() {
    return {
      email: this._email,
      password: this._password,
      signInMethod: this.signInMethod,
      tenantId: this._tenantId
    };
  }
  /**
   * Static method to deserialize a JSON representation of an object into an {@link  AuthCredential}.
   *
   * @param json - Either `object` or the stringified representation of the object. When string is
   * provided, `JSON.parse` would be called first.
   *
   * @returns If the JSON input does not represent an {@link AuthCredential}, null is returned.
   */
  static fromJSON(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    if (obj?.email && obj?.password) {
      if (obj.signInMethod === "password") {
        return this._fromEmailAndPassword(obj.email, obj.password);
      } else if (obj.signInMethod === "emailLink") {
        return this._fromEmailAndCode(obj.email, obj.password, obj.tenantId);
      }
    }
    return null;
  }
  /** @internal */
  async _getIdTokenResponse(auth2) {
    switch (this.signInMethod) {
      case "password":
        const request = {
          returnSecureToken: true,
          email: this._email,
          password: this._password,
          clientType: "CLIENT_TYPE_WEB"
          /* RecaptchaClientType.WEB */
        };
        return handleRecaptchaFlow(
          auth2,
          request,
          "signInWithPassword",
          signInWithPassword,
          "EMAIL_PASSWORD_PROVIDER"
          /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
        );
      case "emailLink":
        return signInWithEmailLink$1(auth2, {
          email: this._email,
          oobCode: this._password
        });
      default:
        _fail(
          auth2,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
    }
  }
  /** @internal */
  async _linkToIdToken(auth2, idToken) {
    switch (this.signInMethod) {
      case "password":
        const request = {
          idToken,
          returnSecureToken: true,
          email: this._email,
          password: this._password,
          clientType: "CLIENT_TYPE_WEB"
          /* RecaptchaClientType.WEB */
        };
        return handleRecaptchaFlow(
          auth2,
          request,
          "signUpPassword",
          linkEmailPassword,
          "EMAIL_PASSWORD_PROVIDER"
          /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
        );
      case "emailLink":
        return signInWithEmailLinkForLinking(auth2, {
          idToken,
          email: this._email,
          oobCode: this._password
        });
      default:
        _fail(
          auth2,
          "internal-error"
          /* AuthErrorCode.INTERNAL_ERROR */
        );
    }
  }
  /** @internal */
  _getReauthenticationResolver(auth2) {
    return this._getIdTokenResponse(auth2);
  }
};
async function signInWithIdp(auth2, request) {
  return _performSignInRequest(auth2, "POST", "/v1/accounts:signInWithIdp", _addTidIfNecessary(auth2, request));
}
var IDP_REQUEST_URI$1 = "http://localhost";
var OAuthCredential = class _OAuthCredential extends AuthCredential {
  constructor() {
    super(...arguments);
    this.pendingToken = null;
  }
  /** @internal */
  static _fromParams(params) {
    const cred = new _OAuthCredential(params.providerId, params.signInMethod);
    if (params.idToken || params.accessToken) {
      if (params.idToken) {
        cred.idToken = params.idToken;
      }
      if (params.accessToken) {
        cred.accessToken = params.accessToken;
      }
      if (params.nonce && !params.pendingToken) {
        cred.nonce = params.nonce;
      }
      if (params.pendingToken) {
        cred.pendingToken = params.pendingToken;
      }
    } else if (params.oauthToken && params.oauthTokenSecret) {
      cred.accessToken = params.oauthToken;
      cred.secret = params.oauthTokenSecret;
    } else {
      _fail(
        "argument-error"
        /* AuthErrorCode.ARGUMENT_ERROR */
      );
    }
    return cred;
  }
  /** {@inheritdoc AuthCredential.toJSON}  */
  toJSON() {
    return {
      idToken: this.idToken,
      accessToken: this.accessToken,
      secret: this.secret,
      nonce: this.nonce,
      pendingToken: this.pendingToken,
      providerId: this.providerId,
      signInMethod: this.signInMethod
    };
  }
  /**
   * Static method to deserialize a JSON representation of an object into an
   * {@link  AuthCredential}.
   *
   * @param json - Input can be either Object or the stringified representation of the object.
   * When string is provided, JSON.parse would be called first.
   *
   * @returns If the JSON input does not represent an {@link  AuthCredential}, null is returned.
   */
  static fromJSON(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    const { providerId, signInMethod, ...rest } = obj;
    if (!providerId || !signInMethod) {
      return null;
    }
    const cred = new _OAuthCredential(providerId, signInMethod);
    cred.idToken = rest.idToken || void 0;
    cred.accessToken = rest.accessToken || void 0;
    cred.secret = rest.secret;
    cred.nonce = rest.nonce;
    cred.pendingToken = rest.pendingToken || null;
    return cred;
  }
  /** @internal */
  _getIdTokenResponse(auth2) {
    const request = this.buildRequest();
    return signInWithIdp(auth2, request);
  }
  /** @internal */
  _linkToIdToken(auth2, idToken) {
    const request = this.buildRequest();
    request.idToken = idToken;
    return signInWithIdp(auth2, request);
  }
  /** @internal */
  _getReauthenticationResolver(auth2) {
    const request = this.buildRequest();
    request.autoCreate = false;
    return signInWithIdp(auth2, request);
  }
  buildRequest() {
    const request = {
      requestUri: IDP_REQUEST_URI$1,
      returnSecureToken: true
    };
    if (this.pendingToken) {
      request.pendingToken = this.pendingToken;
    } else {
      const postBody = {};
      if (this.idToken) {
        postBody["id_token"] = this.idToken;
      }
      if (this.accessToken) {
        postBody["access_token"] = this.accessToken;
      }
      if (this.secret) {
        postBody["oauth_token_secret"] = this.secret;
      }
      postBody["providerId"] = this.providerId;
      if (this.nonce && !this.pendingToken) {
        postBody["nonce"] = this.nonce;
      }
      request.postBody = querystring(postBody);
    }
    return request;
  }
};
function parseMode(mode) {
  switch (mode) {
    case "recoverEmail":
      return "RECOVER_EMAIL";
    case "resetPassword":
      return "PASSWORD_RESET";
    case "signIn":
      return "EMAIL_SIGNIN";
    case "verifyEmail":
      return "VERIFY_EMAIL";
    case "verifyAndChangeEmail":
      return "VERIFY_AND_CHANGE_EMAIL";
    case "revertSecondFactorAddition":
      return "REVERT_SECOND_FACTOR_ADDITION";
    default:
      return null;
  }
}
function parseDeepLink(url) {
  const link = querystringDecode(extractQuerystring(url))["link"];
  const doubleDeepLink = link ? querystringDecode(extractQuerystring(link))["deep_link_id"] : null;
  const iOSDeepLink = querystringDecode(extractQuerystring(url))["deep_link_id"];
  const iOSDoubleDeepLink = iOSDeepLink ? querystringDecode(extractQuerystring(iOSDeepLink))["link"] : null;
  return iOSDoubleDeepLink || iOSDeepLink || doubleDeepLink || link || url;
}
var ActionCodeURL = class _ActionCodeURL {
  /**
   * @param actionLink - The link from which to extract the URL.
   * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
   *
   * @internal
   */
  constructor(actionLink) {
    const searchParams = querystringDecode(extractQuerystring(actionLink));
    const apiKey = searchParams[
      "apiKey"
      /* QueryField.API_KEY */
    ] ?? null;
    const code = searchParams[
      "oobCode"
      /* QueryField.CODE */
    ] ?? null;
    const operation = parseMode(searchParams[
      "mode"
      /* QueryField.MODE */
    ] ?? null);
    _assert(
      apiKey && code && operation,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    this.apiKey = apiKey;
    this.operation = operation;
    this.code = code;
    this.continueUrl = searchParams[
      "continueUrl"
      /* QueryField.CONTINUE_URL */
    ] ?? null;
    this.languageCode = searchParams[
      "lang"
      /* QueryField.LANGUAGE_CODE */
    ] ?? null;
    this.tenantId = searchParams[
      "tenantId"
      /* QueryField.TENANT_ID */
    ] ?? null;
  }
  /**
   * Parses the email action link string and returns an {@link ActionCodeURL} if the link is valid,
   * otherwise returns null.
   *
   * @param link  - The email action link string.
   * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
   *
   * @public
   */
  static parseLink(link) {
    const actionLink = parseDeepLink(link);
    try {
      return new _ActionCodeURL(actionLink);
    } catch {
      return null;
    }
  }
};
var EmailAuthProvider = class _EmailAuthProvider {
  constructor() {
    this.providerId = _EmailAuthProvider.PROVIDER_ID;
  }
  /**
   * Initialize an {@link AuthCredential} using an email and password.
   *
   * @example
   * ```javascript
   * const authCredential = EmailAuthProvider.credential(email, password);
   * const userCredential = await signInWithCredential(auth, authCredential);
   * ```
   *
   * @example
   * ```javascript
   * const userCredential = await signInWithEmailAndPassword(auth, email, password);
   * ```
   *
   * @param email - Email address.
   * @param password - User account password.
   * @returns The auth provider credential.
   */
  static credential(email, password) {
    return EmailAuthCredential._fromEmailAndPassword(email, password);
  }
  /**
   * Initialize an {@link AuthCredential} using an email and an email link after a sign in with
   * email link operation.
   *
   * @example
   * ```javascript
   * const authCredential = EmailAuthProvider.credentialWithLink(auth, email, emailLink);
   * const userCredential = await signInWithCredential(auth, authCredential);
   * ```
   *
   * @example
   * ```javascript
   * await sendSignInLinkToEmail(auth, email);
   * // Obtain emailLink from user.
   * const userCredential = await signInWithEmailLink(auth, email, emailLink);
   * ```
   *
   * @param auth - The {@link Auth} instance used to verify the link.
   * @param email - Email address.
   * @param emailLink - Sign-in email link.
   * @returns - The auth provider credential.
   */
  static credentialWithLink(email, emailLink) {
    const actionCodeUrl = ActionCodeURL.parseLink(emailLink);
    _assert(
      actionCodeUrl,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return EmailAuthCredential._fromEmailAndCode(email, actionCodeUrl.code, actionCodeUrl.tenantId);
  }
};
EmailAuthProvider.PROVIDER_ID = "password";
EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD = "password";
EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD = "emailLink";
var FederatedAuthProvider = class {
  /**
   * Constructor for generic OAuth providers.
   *
   * @param providerId - Provider for which credentials should be generated.
   */
  constructor(providerId) {
    this.providerId = providerId;
    this.defaultLanguageCode = null;
    this.customParameters = {};
  }
  /**
   * Set the language gode.
   *
   * @param languageCode - language code
   */
  setDefaultLanguage(languageCode) {
    this.defaultLanguageCode = languageCode;
  }
  /**
   * Sets the OAuth custom parameters to pass in an OAuth request for popup and redirect sign-in
   * operations.
   *
   * @remarks
   * For a detailed list, check the reserved required OAuth 2.0 parameters such as `client_id`,
   * `redirect_uri`, `scope`, `response_type`, and `state` are not allowed and will be ignored.
   *
   * @param customOAuthParameters - The custom OAuth parameters to pass in the OAuth request.
   */
  setCustomParameters(customOAuthParameters) {
    this.customParameters = customOAuthParameters;
    return this;
  }
  /**
   * Retrieve the current list of {@link CustomParameters}.
   */
  getCustomParameters() {
    return this.customParameters;
  }
};
var BaseOAuthProvider = class extends FederatedAuthProvider {
  constructor() {
    super(...arguments);
    this.scopes = [];
  }
  /**
   * Add an OAuth scope to the credential.
   *
   * @param scope - Provider OAuth scope to add.
   */
  addScope(scope) {
    if (!this.scopes.includes(scope)) {
      this.scopes.push(scope);
    }
    return this;
  }
  /**
   * Retrieve the current list of OAuth scopes.
   */
  getScopes() {
    return [...this.scopes];
  }
};
var FacebookAuthProvider = class _FacebookAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(
      "facebook.com"
      /* ProviderId.FACEBOOK */
    );
  }
  /**
   * Creates a credential for Facebook.
   *
   * @example
   * ```javascript
   * // `event` from the Facebook auth.authResponseChange callback.
   * const credential = FacebookAuthProvider.credential(event.authResponse.accessToken);
   * const result = await signInWithCredential(credential);
   * ```
   *
   * @param accessToken - Facebook access token.
   */
  static credential(accessToken) {
    return OAuthCredential._fromParams({
      providerId: _FacebookAuthProvider.PROVIDER_ID,
      signInMethod: _FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD,
      accessToken
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _FacebookAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _FacebookAuthProvider.credentialFromTaggedObject(error.customData || {});
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
      return null;
    }
    if (!tokenResponse.oauthAccessToken) {
      return null;
    }
    try {
      return _FacebookAuthProvider.credential(tokenResponse.oauthAccessToken);
    } catch {
      return null;
    }
  }
};
FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD = "facebook.com";
FacebookAuthProvider.PROVIDER_ID = "facebook.com";
var GoogleAuthProvider = class _GoogleAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(
      "google.com"
      /* ProviderId.GOOGLE */
    );
    this.addScope("profile");
  }
  /**
   * Creates a credential for Google. At least one of ID token and access token is required.
   *
   * @example
   * ```javascript
   * // \`googleUser\` from the onsuccess Google Sign In callback.
   * const credential = GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token);
   * const result = await signInWithCredential(credential);
   * ```
   *
   * @param idToken - Google ID token.
   * @param accessToken - Google access token.
   */
  static credential(idToken, accessToken) {
    return OAuthCredential._fromParams({
      providerId: _GoogleAuthProvider.PROVIDER_ID,
      signInMethod: _GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD,
      idToken,
      accessToken
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _GoogleAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _GoogleAuthProvider.credentialFromTaggedObject(error.customData || {});
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse) {
      return null;
    }
    const { oauthIdToken, oauthAccessToken } = tokenResponse;
    if (!oauthIdToken && !oauthAccessToken) {
      return null;
    }
    try {
      return _GoogleAuthProvider.credential(oauthIdToken, oauthAccessToken);
    } catch {
      return null;
    }
  }
};
GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD = "google.com";
GoogleAuthProvider.PROVIDER_ID = "google.com";
var GithubAuthProvider = class _GithubAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(
      "github.com"
      /* ProviderId.GITHUB */
    );
  }
  /**
   * Creates a credential for GitHub.
   *
   * @param accessToken - GitHub access token.
   */
  static credential(accessToken) {
    return OAuthCredential._fromParams({
      providerId: _GithubAuthProvider.PROVIDER_ID,
      signInMethod: _GithubAuthProvider.GITHUB_SIGN_IN_METHOD,
      accessToken
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _GithubAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _GithubAuthProvider.credentialFromTaggedObject(error.customData || {});
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
      return null;
    }
    if (!tokenResponse.oauthAccessToken) {
      return null;
    }
    try {
      return _GithubAuthProvider.credential(tokenResponse.oauthAccessToken);
    } catch {
      return null;
    }
  }
};
GithubAuthProvider.GITHUB_SIGN_IN_METHOD = "github.com";
GithubAuthProvider.PROVIDER_ID = "github.com";
var TwitterAuthProvider = class _TwitterAuthProvider extends BaseOAuthProvider {
  constructor() {
    super(
      "twitter.com"
      /* ProviderId.TWITTER */
    );
  }
  /**
   * Creates a credential for Twitter.
   *
   * @param token - Twitter access token.
   * @param secret - Twitter secret.
   */
  static credential(token, secret) {
    return OAuthCredential._fromParams({
      providerId: _TwitterAuthProvider.PROVIDER_ID,
      signInMethod: _TwitterAuthProvider.TWITTER_SIGN_IN_METHOD,
      oauthToken: token,
      oauthTokenSecret: secret
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _TwitterAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _TwitterAuthProvider.credentialFromTaggedObject(error.customData || {});
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse) {
      return null;
    }
    const { oauthAccessToken, oauthTokenSecret } = tokenResponse;
    if (!oauthAccessToken || !oauthTokenSecret) {
      return null;
    }
    try {
      return _TwitterAuthProvider.credential(oauthAccessToken, oauthTokenSecret);
    } catch {
      return null;
    }
  }
};
TwitterAuthProvider.TWITTER_SIGN_IN_METHOD = "twitter.com";
TwitterAuthProvider.PROVIDER_ID = "twitter.com";
function startEnrollTotpMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaEnrollment:start", _addTidIfNecessary(auth2, request));
}
function finalizeEnrollTotpMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaEnrollment:finalize", _addTidIfNecessary(auth2, request));
}
var name3 = "@firebase/auth";
var version3 = "1.13.3";
var AuthInterop = class {
  constructor(auth2) {
    this.auth = auth2;
    this.internalListeners = /* @__PURE__ */ new Map();
  }
  getUid() {
    this.assertAuthConfigured();
    return this.auth.currentUser?.uid || null;
  }
  async getToken(forceRefresh) {
    this.assertAuthConfigured();
    await this.auth._initializationPromise;
    if (!this.auth.currentUser) {
      return null;
    }
    const accessToken = await this.auth.currentUser.getIdToken(forceRefresh);
    return { accessToken };
  }
  addAuthTokenListener(listener) {
    this.assertAuthConfigured();
    if (this.internalListeners.has(listener)) {
      return;
    }
    const unsubscribe = this.auth.onIdTokenChanged((user) => {
      listener(user?.stsTokenManager.accessToken || null);
    });
    this.internalListeners.set(listener, unsubscribe);
    this.updateProactiveRefresh();
  }
  removeAuthTokenListener(listener) {
    this.assertAuthConfigured();
    const unsubscribe = this.internalListeners.get(listener);
    if (!unsubscribe) {
      return;
    }
    this.internalListeners.delete(listener);
    unsubscribe();
    this.updateProactiveRefresh();
  }
  assertAuthConfigured() {
    _assert(
      this.auth._initializationPromise,
      "dependent-sdk-initialized-before-auth"
      /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
    );
  }
  updateProactiveRefresh() {
    if (this.internalListeners.size > 0) {
      this.auth._startProactiveRefresh();
    } else {
      this.auth._stopProactiveRefresh();
    }
  }
};
function getVersionForPlatform(clientPlatform) {
  switch (clientPlatform) {
    case "Node":
      return "node";
    case "ReactNative":
      return "rn";
    case "Worker":
      return "webworker";
    case "Cordova":
      return "cordova";
    case "WebExtension":
      return "web-extension";
    default:
      return void 0;
  }
}
function registerAuth(clientPlatform) {
  _registerComponent(new Component(
    "auth",
    (container, { options: deps }) => {
      const app2 = container.getProvider("app").getImmediate();
      const heartbeatServiceProvider = container.getProvider("heartbeat");
      const appCheckServiceProvider = container.getProvider("app-check-internal");
      const { apiKey, authDomain } = app2.options;
      _assert(apiKey && !apiKey.includes(":"), "invalid-api-key", { appName: app2.name });
      const config = {
        apiKey,
        authDomain,
        clientPlatform,
        apiHost: "identitytoolkit.googleapis.com",
        tokenApiHost: "securetoken.googleapis.com",
        apiScheme: "https",
        sdkClientVersion: _getClientVersion(clientPlatform)
      };
      const authInstance = new AuthImpl(app2, heartbeatServiceProvider, appCheckServiceProvider, config);
      _initializeAuthInstance(authInstance, deps);
      return authInstance;
    },
    "PUBLIC"
    /* ComponentType.PUBLIC */
  ).setInstantiationMode(
    "EXPLICIT"
    /* InstantiationMode.EXPLICIT */
  ).setInstanceCreatedCallback((container, _instanceIdentifier, _instance) => {
    const authInternalProvider = container.getProvider(
      "auth-internal"
      /* _ComponentName.AUTH_INTERNAL */
    );
    authInternalProvider.initialize();
  }));
  _registerComponent(new Component(
    "auth-internal",
    (container) => {
      const auth2 = _castAuth(container.getProvider(
        "auth"
        /* _ComponentName.AUTH */
      ).getImmediate());
      return ((auth3) => new AuthInterop(auth3))(auth2);
    },
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ).setInstantiationMode(
    "EXPLICIT"
    /* InstantiationMode.EXPLICIT */
  ));
  registerVersion(name3, version3, getVersionForPlatform(clientPlatform));
  registerVersion(name3, version3, "esm2020");
}
FetchProvider.initialize(fetch, Headers, Response);
function getAuth(app2 = getApp()) {
  const provider = _getProvider(app2, "auth");
  if (provider.isInitialized()) {
    return provider.getImmediate();
  }
  const auth2 = initializeAuth(app2);
  const authEmulatorHost = getDefaultEmulatorHost("auth");
  if (authEmulatorHost) {
    connectAuthEmulator(auth2, `http://${authEmulatorHost}`);
  }
  return auth2;
}
registerAuth(
  "Node"
  /* ClientPlatform.NODE */
);
var NOT_AVAILABLE_ERROR = _createError(
  "operation-not-supported-in-this-environment"
  /* AuthErrorCode.OPERATION_NOT_SUPPORTED */
);
AuthImpl.prototype.setPersistence = async () => {
};
function finalizeSignInTotpMfa(auth2, request) {
  return _performApiRequest(auth2, "POST", "/v2/accounts/mfaSignIn:finalize", _addTidIfNecessary(auth2, request));
}
var MultiFactorAssertionImpl = class {
  constructor(factorId) {
    this.factorId = factorId;
  }
  _process(auth2, session, displayName) {
    switch (session.type) {
      case "enroll":
        return this._finalizeEnroll(auth2, session.credential, displayName);
      case "signin":
        return this._finalizeSignIn(auth2, session.credential);
      default:
        return debugFail("unexpected MultiFactorSessionType");
    }
  }
};
var TotpMultiFactorGenerator = class {
  /**
   * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of
   * the TOTP (time-based one-time password) second factor.
   * This assertion is used to complete enrollment in TOTP second factor.
   *
   * @param secret A {@link TotpSecret} containing the shared secret key and other TOTP parameters.
   * @param oneTimePassword One-time password from TOTP App.
   * @returns A {@link TotpMultiFactorAssertion} which can be used with
   * {@link MultiFactorUser.enroll}.
   */
  static assertionForEnrollment(secret, oneTimePassword) {
    return TotpMultiFactorAssertionImpl._fromSecret(secret, oneTimePassword);
  }
  /**
   * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of the TOTP second factor.
   * This assertion is used to complete signIn with TOTP as the second factor.
   *
   * @param enrollmentId identifies the enrolled TOTP second factor.
   * @param oneTimePassword One-time password from TOTP App.
   * @returns A {@link TotpMultiFactorAssertion} which can be used with
   * {@link MultiFactorResolver.resolveSignIn}.
   */
  static assertionForSignIn(enrollmentId, oneTimePassword) {
    return TotpMultiFactorAssertionImpl._fromEnrollmentId(enrollmentId, oneTimePassword);
  }
  /**
   * Returns a promise to {@link TotpSecret} which contains the TOTP shared secret key and other parameters.
   * Creates a TOTP secret as part of enrolling a TOTP second factor.
   * Used for generating a QR code URL or inputting into a TOTP app.
   * This method uses the auth instance corresponding to the user in the multiFactorSession.
   *
   * @param session The {@link MultiFactorSession} that the user is part of.
   * @returns A promise to {@link TotpSecret}.
   */
  static async generateSecret(session) {
    const mfaSession = session;
    _assert(
      typeof mfaSession.user?.auth !== "undefined",
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const response = await startEnrollTotpMfa(mfaSession.user.auth, {
      idToken: mfaSession.credential,
      totpEnrollmentInfo: {}
    });
    return TotpSecret._fromStartTotpMfaEnrollmentResponse(response, mfaSession.user.auth);
  }
};
TotpMultiFactorGenerator.FACTOR_ID = "totp";
var TotpMultiFactorAssertionImpl = class _TotpMultiFactorAssertionImpl extends MultiFactorAssertionImpl {
  constructor(otp, enrollmentId, secret) {
    super(
      "totp"
      /* FactorId.TOTP */
    );
    this.otp = otp;
    this.enrollmentId = enrollmentId;
    this.secret = secret;
  }
  /** @internal */
  static _fromSecret(secret, otp) {
    return new _TotpMultiFactorAssertionImpl(otp, void 0, secret);
  }
  /** @internal */
  static _fromEnrollmentId(enrollmentId, otp) {
    return new _TotpMultiFactorAssertionImpl(otp, enrollmentId);
  }
  /** @internal */
  async _finalizeEnroll(auth2, idToken, displayName) {
    _assert(
      typeof this.secret !== "undefined",
      auth2,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return finalizeEnrollTotpMfa(auth2, {
      idToken,
      displayName,
      totpVerificationInfo: this.secret._makeTotpVerificationInfo(this.otp)
    });
  }
  /** @internal */
  async _finalizeSignIn(auth2, mfaPendingCredential) {
    _assert(
      this.enrollmentId !== void 0 && this.otp !== void 0,
      auth2,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    const totpVerificationInfo = { verificationCode: this.otp };
    return finalizeSignInTotpMfa(auth2, {
      mfaPendingCredential,
      mfaEnrollmentId: this.enrollmentId,
      totpVerificationInfo
    });
  }
};
var TotpSecret = class _TotpSecret {
  // The public members are declared outside the constructor so the docs can be generated.
  constructor(secretKey, hashingAlgorithm, codeLength, codeIntervalSeconds, enrollmentCompletionDeadline, sessionInfo, auth2) {
    this.sessionInfo = sessionInfo;
    this.auth = auth2;
    this.secretKey = secretKey;
    this.hashingAlgorithm = hashingAlgorithm;
    this.codeLength = codeLength;
    this.codeIntervalSeconds = codeIntervalSeconds;
    this.enrollmentCompletionDeadline = enrollmentCompletionDeadline;
  }
  /** @internal */
  static _fromStartTotpMfaEnrollmentResponse(response, auth2) {
    return new _TotpSecret(response.totpSessionInfo.sharedSecretKey, response.totpSessionInfo.hashingAlgorithm, response.totpSessionInfo.verificationCodeLength, response.totpSessionInfo.periodSec, new Date(response.totpSessionInfo.finalizeEnrollmentTime).toUTCString(), response.totpSessionInfo.sessionInfo, auth2);
  }
  /** @internal */
  _makeTotpVerificationInfo(otp) {
    return { sessionInfo: this.sessionInfo, verificationCode: otp };
  }
  /**
   * Returns a QR code URL as described in
   * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
   * This can be displayed to the user as a QR code to be scanned into a TOTP app like Google Authenticator.
   * If the optional parameters are unspecified, an accountName of <userEmail> and issuer of <firebaseAppName> are used.
   *
   * @param accountName the name of the account/app along with a user identifier.
   * @param issuer issuer of the TOTP (likely the app name).
   * @returns A QR code URL string.
   */
  generateQrCodeUrl(accountName, issuer) {
    let useDefaults = false;
    if (_isEmptyString(accountName) || _isEmptyString(issuer)) {
      useDefaults = true;
    }
    if (useDefaults) {
      if (_isEmptyString(accountName)) {
        accountName = this.auth.currentUser?.email || "unknownuser";
      }
      if (_isEmptyString(issuer)) {
        issuer = this.auth.name;
      }
    }
    return `otpauth://totp/${issuer}:${accountName}?secret=${this.secretKey}&issuer=${issuer}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`;
  }
};
function _isEmptyString(input) {
  return typeof input === "undefined" || input?.length === 0;
}

// src/config/firebase.js
import { getFirestore, collection, doc } from "firebase/firestore";

// node_modules/@firebase/storage/dist/node-esm/index.node.esm.js
var DEFAULT_HOST = "firebasestorage.googleapis.com";
var CONFIG_STORAGE_BUCKET_KEY = "storageBucket";
var DEFAULT_MAX_OPERATION_RETRY_TIME = 2 * 60 * 1e3;
var DEFAULT_MAX_UPLOAD_RETRY_TIME = 10 * 60 * 1e3;
var StorageError = class _StorageError extends FirebaseError {
  /**
   * @param code - A `StorageErrorCode` string to be prefixed with 'storage/' and
   *  added to the end of the message.
   * @param message  - Error message.
   * @param status_ - Corresponding HTTP Status Code
   */
  constructor(code, message, status_ = 0) {
    super(prependCode(code), `Firebase Storage: ${message} (${prependCode(code)})`);
    this.status_ = status_;
    this.customData = { serverResponse: null };
    this._baseMessage = this.message;
    Object.setPrototypeOf(this, _StorageError.prototype);
  }
  get status() {
    return this.status_;
  }
  set status(status) {
    this.status_ = status;
  }
  /**
   * Compares a `StorageErrorCode` against this error's code, filtering out the prefix.
   */
  _codeEquals(code) {
    return prependCode(code) === this.code;
  }
  /**
   * Optional response message that was added by the server.
   */
  get serverResponse() {
    return this.customData.serverResponse;
  }
  set serverResponse(serverResponse) {
    this.customData.serverResponse = serverResponse;
    if (this.customData.serverResponse) {
      this.message = `${this._baseMessage}
${this.customData.serverResponse}`;
    } else {
      this.message = this._baseMessage;
    }
  }
};
var StorageErrorCode;
(function(StorageErrorCode2) {
  StorageErrorCode2["UNKNOWN"] = "unknown";
  StorageErrorCode2["OBJECT_NOT_FOUND"] = "object-not-found";
  StorageErrorCode2["BUCKET_NOT_FOUND"] = "bucket-not-found";
  StorageErrorCode2["PROJECT_NOT_FOUND"] = "project-not-found";
  StorageErrorCode2["QUOTA_EXCEEDED"] = "quota-exceeded";
  StorageErrorCode2["UNAUTHENTICATED"] = "unauthenticated";
  StorageErrorCode2["UNAUTHORIZED"] = "unauthorized";
  StorageErrorCode2["UNAUTHORIZED_APP"] = "unauthorized-app";
  StorageErrorCode2["RETRY_LIMIT_EXCEEDED"] = "retry-limit-exceeded";
  StorageErrorCode2["INVALID_CHECKSUM"] = "invalid-checksum";
  StorageErrorCode2["CANCELED"] = "canceled";
  StorageErrorCode2["INVALID_EVENT_NAME"] = "invalid-event-name";
  StorageErrorCode2["INVALID_URL"] = "invalid-url";
  StorageErrorCode2["INVALID_DEFAULT_BUCKET"] = "invalid-default-bucket";
  StorageErrorCode2["NO_DEFAULT_BUCKET"] = "no-default-bucket";
  StorageErrorCode2["CANNOT_SLICE_BLOB"] = "cannot-slice-blob";
  StorageErrorCode2["SERVER_FILE_WRONG_SIZE"] = "server-file-wrong-size";
  StorageErrorCode2["NO_DOWNLOAD_URL"] = "no-download-url";
  StorageErrorCode2["INVALID_ARGUMENT"] = "invalid-argument";
  StorageErrorCode2["INVALID_ARGUMENT_COUNT"] = "invalid-argument-count";
  StorageErrorCode2["APP_DELETED"] = "app-deleted";
  StorageErrorCode2["INVALID_ROOT_OPERATION"] = "invalid-root-operation";
  StorageErrorCode2["INVALID_FORMAT"] = "invalid-format";
  StorageErrorCode2["INTERNAL_ERROR"] = "internal-error";
  StorageErrorCode2["UNSUPPORTED_ENVIRONMENT"] = "unsupported-environment";
})(StorageErrorCode || (StorageErrorCode = {}));
function prependCode(code) {
  return "storage/" + code;
}
function unknown() {
  const message = "An unknown error occurred, please check the error payload for server response.";
  return new StorageError(StorageErrorCode.UNKNOWN, message);
}
function retryLimitExceeded() {
  return new StorageError(StorageErrorCode.RETRY_LIMIT_EXCEEDED, "Max retry time for operation exceeded, please try again.");
}
function canceled() {
  return new StorageError(StorageErrorCode.CANCELED, "User canceled the upload/download.");
}
function invalidUrl(url) {
  return new StorageError(StorageErrorCode.INVALID_URL, "Invalid URL '" + url + "'.");
}
function invalidDefaultBucket(bucket) {
  return new StorageError(StorageErrorCode.INVALID_DEFAULT_BUCKET, "Invalid default bucket '" + bucket + "'.");
}
function invalidArgument(message) {
  return new StorageError(StorageErrorCode.INVALID_ARGUMENT, message);
}
function appDeleted() {
  return new StorageError(StorageErrorCode.APP_DELETED, "The Firebase app was deleted.");
}
function invalidRootOperation(name5) {
  return new StorageError(StorageErrorCode.INVALID_ROOT_OPERATION, "The operation '" + name5 + "' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').");
}
var Location = class _Location {
  constructor(bucket, path) {
    this.bucket = bucket;
    this.path_ = path;
  }
  get path() {
    return this.path_;
  }
  get isRoot() {
    return this.path.length === 0;
  }
  fullServerUrl() {
    const encode = encodeURIComponent;
    return "/b/" + encode(this.bucket) + "/o/" + encode(this.path);
  }
  bucketOnlyServerUrl() {
    const encode = encodeURIComponent;
    return "/b/" + encode(this.bucket) + "/o";
  }
  static makeFromBucketSpec(bucketString, host) {
    let bucketLocation;
    try {
      bucketLocation = _Location.makeFromUrl(bucketString, host);
    } catch (e) {
      return new _Location(bucketString, "");
    }
    if (bucketLocation.path === "") {
      return bucketLocation;
    } else {
      throw invalidDefaultBucket(bucketString);
    }
  }
  static makeFromUrl(url, host) {
    let location = null;
    const bucketDomain = "([A-Za-z0-9.\\-_]+)";
    function gsModify(loc) {
      if (loc.path.charAt(loc.path.length - 1) === "/") {
        loc.path_ = loc.path_.slice(0, -1);
      }
    }
    const gsPath = "(/(.*))?$";
    const gsRegex = new RegExp("^gs://" + bucketDomain + gsPath, "i");
    const gsIndices = { bucket: 1, path: 3 };
    function httpModify(loc) {
      loc.path_ = decodeURIComponent(loc.path);
    }
    const version5 = "v[A-Za-z0-9_]+";
    const firebaseStorageHost = host.replace(/[.]/g, "\\.");
    const firebaseStoragePath = "(/([^?#]*).*)?$";
    const firebaseStorageRegExp = new RegExp(`^https?://${firebaseStorageHost}/${version5}/b/${bucketDomain}/o${firebaseStoragePath}`, "i");
    const firebaseStorageIndices = { bucket: 1, path: 3 };
    const cloudStorageHost = host === DEFAULT_HOST ? "(?:storage.googleapis.com|storage.cloud.google.com)" : host;
    const cloudStoragePath = "([^?#]*)";
    const cloudStorageRegExp = new RegExp(`^https?://${cloudStorageHost}/${bucketDomain}/${cloudStoragePath}`, "i");
    const cloudStorageIndices = { bucket: 1, path: 2 };
    const groups = [
      { regex: gsRegex, indices: gsIndices, postModify: gsModify },
      {
        regex: firebaseStorageRegExp,
        indices: firebaseStorageIndices,
        postModify: httpModify
      },
      {
        regex: cloudStorageRegExp,
        indices: cloudStorageIndices,
        postModify: httpModify
      }
    ];
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const captures = group.regex.exec(url);
      if (captures) {
        const bucketValue = captures[group.indices.bucket];
        let pathValue = captures[group.indices.path];
        if (!pathValue) {
          pathValue = "";
        }
        location = new _Location(bucketValue, pathValue);
        group.postModify(location);
        break;
      }
    }
    if (location == null) {
      throw invalidUrl(url);
    }
    return location;
  }
};
var FailRequest = class {
  constructor(error) {
    this.promise_ = Promise.reject(error);
  }
  /** @inheritDoc */
  getPromise() {
    return this.promise_;
  }
  /** @inheritDoc */
  cancel(_appDelete = false) {
  }
};
function start(doRequest, backoffCompleteCb, timeout) {
  let waitSeconds = 1;
  let retryTimeoutId = null;
  let globalTimeoutId = null;
  let hitTimeout = false;
  let cancelState = 0;
  function canceled2() {
    return cancelState === 2;
  }
  let triggeredCallback = false;
  function triggerCallback(...args) {
    if (!triggeredCallback) {
      triggeredCallback = true;
      backoffCompleteCb.apply(null, args);
    }
  }
  function callWithDelay(millis) {
    retryTimeoutId = setTimeout(() => {
      retryTimeoutId = null;
      doRequest(responseHandler, canceled2());
    }, millis);
  }
  function clearGlobalTimeout() {
    if (globalTimeoutId) {
      clearTimeout(globalTimeoutId);
    }
  }
  function responseHandler(success, ...args) {
    if (triggeredCallback) {
      clearGlobalTimeout();
      return;
    }
    if (success) {
      clearGlobalTimeout();
      triggerCallback.call(null, success, ...args);
      return;
    }
    const mustStop = canceled2() || hitTimeout;
    if (mustStop) {
      clearGlobalTimeout();
      triggerCallback.call(null, success, ...args);
      return;
    }
    if (waitSeconds < 64) {
      waitSeconds *= 2;
    }
    let waitMillis;
    if (cancelState === 1) {
      cancelState = 2;
      waitMillis = 0;
    } else {
      waitMillis = (waitSeconds + Math.random()) * 1e3;
    }
    callWithDelay(waitMillis);
  }
  let stopped = false;
  function stop2(wasTimeout) {
    if (stopped) {
      return;
    }
    stopped = true;
    clearGlobalTimeout();
    if (triggeredCallback) {
      return;
    }
    if (retryTimeoutId !== null) {
      if (!wasTimeout) {
        cancelState = 2;
      }
      clearTimeout(retryTimeoutId);
      callWithDelay(0);
    } else {
      if (!wasTimeout) {
        cancelState = 1;
      }
    }
  }
  callWithDelay(0);
  globalTimeoutId = setTimeout(() => {
    hitTimeout = true;
    stop2(true);
  }, timeout);
  return stop2;
}
function stop(id) {
  id(false);
}
function isJustDef(p) {
  return p !== void 0;
}
function validateNumber(argument, minValue, maxValue, value) {
  if (value < minValue) {
    throw invalidArgument(`Invalid value for '${argument}'. Expected ${minValue} or greater.`);
  }
  if (value > maxValue) {
    throw invalidArgument(`Invalid value for '${argument}'. Expected ${maxValue} or less.`);
  }
}
function makeQueryString(params) {
  const encode = encodeURIComponent;
  let queryPart = "?";
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const nextPart = encode(key) + "=" + encode(params[key]);
      queryPart = queryPart + nextPart + "&";
    }
  }
  queryPart = queryPart.slice(0, -1);
  return queryPart;
}
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2[ErrorCode2["NO_ERROR"] = 0] = "NO_ERROR";
  ErrorCode2[ErrorCode2["NETWORK_ERROR"] = 1] = "NETWORK_ERROR";
  ErrorCode2[ErrorCode2["ABORT"] = 2] = "ABORT";
})(ErrorCode || (ErrorCode = {}));
function isRetryStatusCode(status, additionalRetryCodes) {
  const isFiveHundredCode = status >= 500 && status < 600;
  const extraRetryCodes = [
    // Request Timeout: web server didn't receive full request in time.
    408,
    // Too Many Requests: you're getting rate-limited, basically.
    429
  ];
  const isExtraRetryCode = extraRetryCodes.indexOf(status) !== -1;
  const isAdditionalRetryCode = additionalRetryCodes.indexOf(status) !== -1;
  return isFiveHundredCode || isExtraRetryCode || isAdditionalRetryCode;
}
var NetworkRequest = class {
  constructor(url_, method_, headers_, body_, successCodes_, additionalRetryCodes_, callback_, errorCallback_, timeout_, progressCallback_, connectionFactory_, retry = true, isUsingEmulator = false) {
    this.url_ = url_;
    this.method_ = method_;
    this.headers_ = headers_;
    this.body_ = body_;
    this.successCodes_ = successCodes_;
    this.additionalRetryCodes_ = additionalRetryCodes_;
    this.callback_ = callback_;
    this.errorCallback_ = errorCallback_;
    this.timeout_ = timeout_;
    this.progressCallback_ = progressCallback_;
    this.connectionFactory_ = connectionFactory_;
    this.retry = retry;
    this.isUsingEmulator = isUsingEmulator;
    this.pendingConnection_ = null;
    this.backoffId_ = null;
    this.canceled_ = false;
    this.appDelete_ = false;
    this.promise_ = new Promise((resolve, reject) => {
      this.resolve_ = resolve;
      this.reject_ = reject;
      this.start_();
    });
  }
  /**
   * Actually starts the retry loop.
   */
  start_() {
    const doTheRequest = (backoffCallback, canceled2) => {
      if (canceled2) {
        backoffCallback(false, new RequestEndStatus(false, null, true));
        return;
      }
      const connection = this.connectionFactory_();
      this.pendingConnection_ = connection;
      const progressListener = (progressEvent) => {
        const loaded = progressEvent.loaded;
        const total = progressEvent.lengthComputable ? progressEvent.total : -1;
        if (this.progressCallback_ !== null) {
          this.progressCallback_(loaded, total);
        }
      };
      if (this.progressCallback_ !== null) {
        connection.addUploadProgressListener(progressListener);
      }
      connection.send(this.url_, this.method_, this.isUsingEmulator, this.body_, this.headers_).then(() => {
        if (this.progressCallback_ !== null) {
          connection.removeUploadProgressListener(progressListener);
        }
        this.pendingConnection_ = null;
        const hitServer = connection.getErrorCode() === ErrorCode.NO_ERROR;
        const status = connection.getStatus();
        if (!hitServer || isRetryStatusCode(status, this.additionalRetryCodes_) && this.retry) {
          const wasCanceled = connection.getErrorCode() === ErrorCode.ABORT;
          backoffCallback(false, new RequestEndStatus(false, null, wasCanceled));
          return;
        }
        const successCode = this.successCodes_.indexOf(status) !== -1;
        backoffCallback(true, new RequestEndStatus(successCode, connection));
      });
    };
    const backoffDone = (requestWentThrough, status) => {
      const resolve = this.resolve_;
      const reject = this.reject_;
      const connection = status.connection;
      if (status.wasSuccessCode) {
        try {
          const result = this.callback_(connection, connection.getResponse());
          if (isJustDef(result)) {
            resolve(result);
          } else {
            resolve();
          }
        } catch (e) {
          reject(e);
        }
      } else {
        if (connection !== null) {
          const err = unknown();
          err.serverResponse = connection.getErrorText();
          if (this.errorCallback_) {
            reject(this.errorCallback_(connection, err));
          } else {
            reject(err);
          }
        } else {
          if (status.canceled) {
            const err = this.appDelete_ ? appDeleted() : canceled();
            reject(err);
          } else {
            const err = retryLimitExceeded();
            reject(err);
          }
        }
      }
    };
    if (this.canceled_) {
      backoffDone(false, new RequestEndStatus(false, null, true));
    } else {
      this.backoffId_ = start(doTheRequest, backoffDone, this.timeout_);
    }
  }
  /** @inheritDoc */
  getPromise() {
    return this.promise_;
  }
  /** @inheritDoc */
  cancel(appDelete) {
    this.canceled_ = true;
    this.appDelete_ = appDelete || false;
    if (this.backoffId_ !== null) {
      stop(this.backoffId_);
    }
    if (this.pendingConnection_ !== null) {
      this.pendingConnection_.abort();
    }
  }
};
var RequestEndStatus = class {
  constructor(wasSuccessCode, connection, canceled2) {
    this.wasSuccessCode = wasSuccessCode;
    this.connection = connection;
    this.canceled = !!canceled2;
  }
};
function addAuthHeader_(headers, authToken) {
  if (authToken !== null && authToken.length > 0) {
    headers["Authorization"] = "Firebase " + authToken;
  }
}
function addVersionHeader_(headers, firebaseVersion) {
  headers["X-Firebase-Storage-Version"] = "webjs/" + (firebaseVersion ?? "AppManager");
}
function addGmpidHeader_(headers, appId) {
  if (appId) {
    headers["X-Firebase-GMPID"] = appId;
  }
}
function addAppCheckHeader_(headers, appCheckToken) {
  if (appCheckToken !== null) {
    headers["X-Firebase-AppCheck"] = appCheckToken;
  }
}
function makeRequest(requestInfo, appId, authToken, appCheckToken, requestFactory, firebaseVersion, retry = true, isUsingEmulator = false) {
  const queryPart = makeQueryString(requestInfo.urlParams);
  const url = requestInfo.url + queryPart;
  const headers = Object.assign({}, requestInfo.headers);
  addGmpidHeader_(headers, appId);
  addAuthHeader_(headers, authToken);
  addVersionHeader_(headers, firebaseVersion);
  addAppCheckHeader_(headers, appCheckToken);
  return new NetworkRequest(url, requestInfo.method, headers, requestInfo.body, requestInfo.successCodes, requestInfo.additionalRetryCodes, requestInfo.handler, requestInfo.errorHandler, requestInfo.timeout, requestInfo.progressCallback, requestFactory, retry, isUsingEmulator);
}
function parent(path) {
  if (path.length === 0) {
    return null;
  }
  const index = path.lastIndexOf("/");
  if (index === -1) {
    return "";
  }
  const newPath = path.slice(0, index);
  return newPath;
}
function lastComponent(path) {
  const index = path.lastIndexOf("/", path.length - 2);
  if (index === -1) {
    return path;
  } else {
    return path.slice(index + 1);
  }
}
var RESUMABLE_UPLOAD_CHUNK_SIZE = 256 * 1024;
var Reference = class _Reference {
  constructor(_service, location) {
    this._service = _service;
    if (location instanceof Location) {
      this._location = location;
    } else {
      this._location = Location.makeFromUrl(location, _service.host);
    }
  }
  /**
   * Returns the URL for the bucket and path this object references,
   *     in the form gs://<bucket>/<object-path>
   * @override
   */
  toString() {
    return "gs://" + this._location.bucket + "/" + this._location.path;
  }
  _newRef(service, location) {
    return new _Reference(service, location);
  }
  /**
   * A reference to the root of this object's bucket.
   */
  get root() {
    const location = new Location(this._location.bucket, "");
    return this._newRef(this._service, location);
  }
  /**
   * The name of the bucket containing this reference's object.
   */
  get bucket() {
    return this._location.bucket;
  }
  /**
   * The full path of this object.
   */
  get fullPath() {
    return this._location.path;
  }
  /**
   * The short name of this object, which is the last component of the full path.
   * For example, if fullPath is 'full/path/image.png', name is 'image.png'.
   */
  get name() {
    return lastComponent(this._location.path);
  }
  /**
   * The `StorageService` instance this `StorageReference` is associated with.
   */
  get storage() {
    return this._service;
  }
  /**
   * A `StorageReference` pointing to the parent location of this `StorageReference`, or null if
   * this reference is the root.
   */
  get parent() {
    const newPath = parent(this._location.path);
    if (newPath === null) {
      return null;
    }
    const location = new Location(this._location.bucket, newPath);
    return new _Reference(this._service, location);
  }
  /**
   * Utility function to throw an error in methods that do not accept a root reference.
   */
  _throwIfRoot(name5) {
    if (this._location.path === "") {
      throw invalidRootOperation(name5);
    }
  }
};
function extractBucket(host, config) {
  const bucketString = config?.[CONFIG_STORAGE_BUCKET_KEY];
  if (bucketString == null) {
    return null;
  }
  return Location.makeFromBucketSpec(bucketString, host);
}
function connectStorageEmulator$1(storage2, host, port, options = {}) {
  storage2.host = `${host}:${port}`;
  const useSsl = isCloudWorkstation(host);
  if (useSsl) {
    void pingServer(`https://${storage2.host}/b`);
  }
  storage2._isUsingEmulator = true;
  storage2._protocol = useSsl ? "https" : "http";
  const { mockUserToken } = options;
  if (mockUserToken) {
    storage2._overrideAuthToken = typeof mockUserToken === "string" ? mockUserToken : createMockUserToken(mockUserToken, storage2.app.options.projectId);
  }
}
var FirebaseStorageImpl = class {
  constructor(app2, _authProvider, _appCheckProvider, _url, _firebaseVersion, _isUsingEmulator = false) {
    this.app = app2;
    this._authProvider = _authProvider;
    this._appCheckProvider = _appCheckProvider;
    this._url = _url;
    this._firebaseVersion = _firebaseVersion;
    this._isUsingEmulator = _isUsingEmulator;
    this._bucket = null;
    this._host = DEFAULT_HOST;
    this._protocol = "https";
    this._appId = null;
    this._deleted = false;
    this._maxOperationRetryTime = DEFAULT_MAX_OPERATION_RETRY_TIME;
    this._maxUploadRetryTime = DEFAULT_MAX_UPLOAD_RETRY_TIME;
    this._requests = /* @__PURE__ */ new Set();
    if (_url != null) {
      this._bucket = Location.makeFromBucketSpec(_url, this._host);
    } else {
      this._bucket = extractBucket(this._host, this.app.options);
    }
  }
  /**
   * The host string for this service, in the form of `host` or
   * `host:port`.
   */
  get host() {
    return this._host;
  }
  set host(host) {
    this._host = host;
    if (this._url != null) {
      this._bucket = Location.makeFromBucketSpec(this._url, host);
    } else {
      this._bucket = extractBucket(host, this.app.options);
    }
  }
  /**
   * The maximum time to retry uploads in milliseconds.
   */
  get maxUploadRetryTime() {
    return this._maxUploadRetryTime;
  }
  set maxUploadRetryTime(time) {
    validateNumber(
      "time",
      /* minValue=*/
      0,
      /* maxValue= */
      Number.POSITIVE_INFINITY,
      time
    );
    this._maxUploadRetryTime = time;
  }
  /**
   * The maximum time to retry operations other than uploads or downloads in
   * milliseconds.
   */
  get maxOperationRetryTime() {
    return this._maxOperationRetryTime;
  }
  set maxOperationRetryTime(time) {
    validateNumber(
      "time",
      /* minValue=*/
      0,
      /* maxValue= */
      Number.POSITIVE_INFINITY,
      time
    );
    this._maxOperationRetryTime = time;
  }
  async _getAuthToken() {
    if (this._overrideAuthToken) {
      return this._overrideAuthToken;
    }
    const auth2 = this._authProvider.getImmediate({ optional: true });
    if (auth2) {
      const tokenData = await auth2.getToken();
      if (tokenData !== null) {
        return tokenData.accessToken;
      }
    }
    return null;
  }
  async _getAppCheckToken() {
    if (_isFirebaseServerApp(this.app) && this.app.settings.appCheckToken) {
      return this.app.settings.appCheckToken;
    }
    const appCheck = this._appCheckProvider.getImmediate({ optional: true });
    if (appCheck) {
      const result = await appCheck.getToken();
      return result.token;
    }
    return null;
  }
  /**
   * Stop running requests and prevent more from being created.
   */
  _delete() {
    if (!this._deleted) {
      this._deleted = true;
      this._requests.forEach((request) => request.cancel());
      this._requests.clear();
    }
    return Promise.resolve();
  }
  /**
   * Returns a new firebaseStorage.Reference object referencing this StorageService
   * at the given Location.
   */
  _makeStorageReference(loc) {
    return new Reference(this, loc);
  }
  /**
   * @param requestInfo - HTTP RequestInfo object
   * @param authToken - Firebase auth token
   */
  _makeRequest(requestInfo, requestFactory, authToken, appCheckToken, retry = true) {
    if (!this._deleted) {
      const request = makeRequest(requestInfo, this._appId, authToken, appCheckToken, requestFactory, this._firebaseVersion, retry, this._isUsingEmulator);
      this._requests.add(request);
      request.getPromise().then(() => this._requests.delete(request), () => this._requests.delete(request));
      return request;
    } else {
      return new FailRequest(appDeleted());
    }
  }
  async makeRequestWithTokens(requestInfo, requestFactory) {
    const [authToken, appCheckToken] = await Promise.all([
      this._getAuthToken(),
      this._getAppCheckToken()
    ]);
    return this._makeRequest(requestInfo, requestFactory, authToken, appCheckToken).getPromise();
  }
};
var name4 = "@firebase/storage";
var version4 = "0.14.3";
var STORAGE_TYPE = "storage";
function getStorage(app2 = getApp(), bucketUrl) {
  app2 = getModularInstance(app2);
  const storageProvider = _getProvider(app2, STORAGE_TYPE);
  const storageInstance = storageProvider.getImmediate({
    identifier: bucketUrl
  });
  const emulator = getDefaultEmulatorHostnameAndPort("storage");
  if (emulator) {
    connectStorageEmulator(storageInstance, ...emulator);
  }
  return storageInstance;
}
function connectStorageEmulator(storage2, host, port, options = {}) {
  connectStorageEmulator$1(storage2, host, port, options);
}
function factory(container, { instanceIdentifier: url }) {
  const app2 = container.getProvider("app").getImmediate();
  const authProvider = container.getProvider("auth-internal");
  const appCheckProvider = container.getProvider("app-check-internal");
  return new FirebaseStorageImpl(app2, authProvider, appCheckProvider, url, SDK_VERSION);
}
function registerStorage() {
  _registerComponent(new Component(
    STORAGE_TYPE,
    factory,
    "PUBLIC"
    /* ComponentType.PUBLIC */
  ).setMultipleInstances(true));
  registerVersion(name4, version4);
}
registerStorage();

// src/config/firebase.js
var firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app",
  storageBucket: "iris-clinic-app.firebasestorage.app",
  messagingSenderId: "372749467528",
  appId: "1:372749467528:web:1e90ecab74274ec965843d",
  measurementId: "G-BQW1W46XSH"
};
var app = initializeApp(firebaseConfig);
var auth = getAuth(app);
var db = getFirestore(app, "iris-care");
var storage = getStorage(app);
var getCol = (colName) => collection(db, colName);

// src/components/EmployeeDashboard.jsx
import { addDoc as addDoc3, updateDoc as updateDoc3, doc as doc4, deleteDoc as deleteDoc2 } from "firebase/firestore";

// src/utils/fuzzy.js
var fuzzyCache = /* @__PURE__ */ new WeakMap();
function getFuzzyKey(obj, targetKeys) {
  if (!obj) return void 0;
  let objCache = fuzzyCache.get(obj);
  if (!objCache) {
    objCache = /* @__PURE__ */ new Map();
    fuzzyCache.set(obj, objCache);
  }
  const cacheKey = Array.isArray(targetKeys) ? targetKeys.join(",") : targetKeys;
  if (objCache.has(cacheKey)) return objCache.get(cacheKey);
  const targets = Array.isArray(targetKeys) ? targetKeys : [targetKeys];
  let result = void 0;
  for (let target of targets) {
    if (obj[target] !== void 0 && obj[target] !== "") {
      result = obj[target];
      break;
    }
  }
  if (result === void 0) {
    for (let target of targets) {
      const cleanTarget = target.replace(new RegExp("[\\s\\u200B-\\u200D\\uFEFF]", "g"), "").toLowerCase();
      const exactKey = Object.keys(obj).find((k) => k.replace(new RegExp(`[\\s\\u200B-\\u200D\\uFEFF"'\\r\\n]`, "g"), "").toLowerCase() === cleanTarget);
      if (exactKey && obj[exactKey] !== "") {
        result = obj[exactKey];
        break;
      }
    }
  }
  if (result === void 0) {
    for (let target of targets) {
      const cleanTarget = target.replace(new RegExp("[\\s\\u200B-\\u200D\\uFEFF]", "g"), "").toLowerCase();
      if (["\u0E22\u0E2D\u0E14", "\u0E23\u0E32\u0E04\u0E32", "\u0E08\u0E33\u0E19\u0E27\u0E19"].includes(cleanTarget)) continue;
      const matchingKeys = Object.keys(obj).filter((k) => k.replace(new RegExp(`[\\s\\u200B-\\u200D\\uFEFF"'\\r\\n]`, "g"), "").toLowerCase().includes(cleanTarget));
      for (let mk of matchingKeys) {
        const cleanMK = mk.replace(new RegExp(`[\\s\\u200B-\\u200D\\uFEFF"'\\r\\n]`, "g"), "").toLowerCase();
        if (!cleanTarget.includes("\u0E04\u0E49\u0E32\u0E07") && cleanMK.includes("\u0E04\u0E49\u0E32\u0E07")) continue;
        if (["\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15", "\u0E27\u0E07\u0E40\u0E07\u0E34\u0E19", "\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A", "\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49", "\u0E22\u0E2D\u0E14\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15", "\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"].includes(cleanTarget) && (cleanMK.includes("\u0E2B\u0E31\u0E01") || cleanMK.includes("\u0E43\u0E0A\u0E49") || cleanMK.includes("\u0E40\u0E2B\u0E25\u0E37\u0E2D") || cleanMK.includes("\u0E40\u0E1A\u0E34\u0E01") || cleanMK.includes("\u0E40\u0E01\u0E48\u0E32"))) continue;
        if (["\u0E22\u0E2D\u0E14\u0E40\u0E1A\u0E34\u0E01\u0E14\u0E34\u0E1A", "\u0E40\u0E1A\u0E34\u0E01\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27", "\u0E22\u0E2D\u0E14\u0E40\u0E1A\u0E34\u0E01", "\u0E43\u0E0A\u0E49\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15", "\u0E22\u0E2D\u0E14\u0E2A\u0E30\u0E2A\u0E21\u0E14\u0E34\u0E1A", "\u0E2B\u0E31\u0E01\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15"].includes(cleanTarget) && (cleanMK.includes("\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A") || cleanMK.includes("\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14") || cleanMK.includes("\u0E40\u0E2B\u0E25\u0E37\u0E2D"))) continue;
        if (obj[mk] !== "") {
          result = obj[mk];
          break;
        }
      }
      if (result !== void 0) break;
    }
  }
  if (result !== void 0 && typeof result === "object" && result !== null) {
    if (result.toDate) result = result.toDate().toISOString();
    else if (result.seconds) result = new Date(result.seconds * 1e3).toISOString();
    else result = JSON.stringify(result);
  }
  objCache.set(cacheKey, result);
  return result;
}

// src/utils/parse.js
function parseNumber(val) {
  if (val === void 0 || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  const strVal = String(val).replace(new RegExp(",", "g"), "").trim();
  const match = strVal.match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

// src/components/EmployeeDashboard.jsx
var import_html_to_image = __toESM(require_lib(), 1);

// src/components/PayslipModal.jsx
import React from "react";
import { X, Printer } from "lucide-react";
function PayslipModal({ employee, payrollMonth, onClose }) {
  if (!employee) return null;
  const handlePrint = () => {
    window.print();
  };
  const monthNames = [
    "\u0E21\u0E01\u0E23\u0E32\u0E04\u0E21",
    "\u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C",
    "\u0E21\u0E35\u0E19\u0E32\u0E04\u0E21",
    "\u0E40\u0E21\u0E29\u0E32\u0E22\u0E19",
    "\u0E1E\u0E24\u0E29\u0E20\u0E32\u0E04\u0E21",
    "\u0E21\u0E34\u0E16\u0E38\u0E19\u0E32\u0E22\u0E19",
    "\u0E01\u0E23\u0E01\u0E0E\u0E32\u0E04\u0E21",
    "\u0E2A\u0E34\u0E07\u0E2B\u0E32\u0E04\u0E21",
    "\u0E01\u0E31\u0E19\u0E22\u0E32\u0E22\u0E19",
    "\u0E15\u0E38\u0E25\u0E32\u0E04\u0E21",
    "\u0E1E\u0E24\u0E28\u0E08\u0E34\u0E01\u0E32\u0E22\u0E19",
    "\u0E18\u0E31\u0E19\u0E27\u0E32\u0E04\u0E21"
  ];
  const [yearStr, monthStr] = payrollMonth.split("-");
  const displayMonth = `${monthNames[parseInt(monthStr, 10) - 1]} ${yearStr}`;
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative print:shadow-none print:max-h-none print:w-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center p-4 border-b border-slate-200 print:hidden" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-slate-800" }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2A\u0E25\u0E34\u0E1B\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handlePrint,
      className: "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Printer, { size: 18 }),
    " \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2A\u0E25\u0E34\u0E1B"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      className: "p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
    },
    /* @__PURE__ */ React.createElement(X, { size: 24 })
  ))), /* @__PURE__ */ React.createElement("div", { className: "p-8 print:p-0 print:m-0 w-full bg-white text-slate-800 font-sans", id: "payslip-content" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-8 border-b-2 border-slate-800 pb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-black uppercase tracking-wider mb-1" }, "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 (Payslip)"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 font-medium" }, "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19: ", displayMonth)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-x-12 gap-y-4 mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between border-b border-dashed border-slate-300 pb-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-600" }, "\u0E0A\u0E37\u0E48\u0E2D\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19:"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, employee.name)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between border-b border-dashed border-slate-300 pb-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-600" }, "\u0E2A\u0E32\u0E02\u0E32:"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, employee.branch)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between border-b border-dashed border-slate-300 pb-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-600" }, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C:"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, employee.phone || "-")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between border-b border-dashed border-slate-300 pb-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-600" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23:"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, (/* @__PURE__ */ new Date()).toLocaleDateString("th-TH")))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-8 mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "bg-slate-100 px-4 py-2 font-bold border border-slate-300 mb-2" }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A (Earnings)"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 px-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", null, "\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19 (Base Salary)"), /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, (employee.baseSalary || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", null, "\u0E04\u0E48\u0E32\u0E04\u0E2D\u0E21\u0E21\u0E34\u0E0A\u0E0A\u0E31\u0E48\u0E19 (Commission)"), /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, (employee.totalCommission || 0).toLocaleString())), employee.totalServiceFees > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", null, "\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D / \u0E04\u0E48\u0E32\u0E08\u0E35\u0E49\u0E44\u0E1D (Service Fees)"), /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, (employee.totalServiceFees || 0).toLocaleString())))), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "bg-slate-100 px-4 py-2 font-bold border border-slate-300 mb-2" }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01 (Deductions)"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 px-2" }, employee.totalAdvances > 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-rose-600" }, /* @__PURE__ */ React.createElement("span", null, "\u0E2B\u0E31\u0E01\u0E40\u0E1A\u0E34\u0E01\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32 (Advance Deductions)"), /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, (employee.totalAdvances || 0).toLocaleString())) : /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-slate-400" }, /* @__PURE__ */ React.createElement("span", null, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01"), /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, "0"))))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-t-2 border-b-2 border-slate-800 py-4 mb-12" }, /* @__PURE__ */ React.createElement("div", { className: "text-lg font-bold" }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A\u0E2A\u0E38\u0E17\u0E18\u0E34 (Net Pay)"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-black text-slate-800" }, "\u0E3F", (employee.totalIncome || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-12 mt-16 pt-8" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "border-b border-slate-400 w-48 mx-auto mb-2" }), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-sm text-slate-600" }, "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 (Employee)"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ____/____/____")), /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "border-b border-slate-400 w-48 mx-auto mb-2" }), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-sm text-slate-600" }, "\u0E1C\u0E39\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 (Authorized Manager)"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-1" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ____/____/____"))))), /* @__PURE__ */ React.createElement("style", null, `
        @media print {
          body * {
            visibility: hidden;
          }
          #payslip-content, #payslip-content * {
            visibility: visible;
          }
          #payslip-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `));
}

// src/components/EmployeePortal.jsx
import React2, { useState, useMemo, useEffect } from "react";
import { Clock, Calendar, CheckCircle, UserCheck, UserMinus, X as X2, User, LogOut, Send, Check, XCircle, History, DollarSign, Wallet, ShoppingCart, Lock, Trash2 } from "lucide-react";
import { addDoc, updateDoc, doc as doc2, deleteDoc } from "firebase/firestore";
function EmployeePortal({
  employee,
  attendance = [],
  leaves = [],
  advancePayments = [],
  requisitions = [],
  histories = [],
  branches = [],
  dailySales = [],
  serviceLogs = [],
  orders = [],
  appSettings = {},
  onClose,
  onClockIn,
  onClockOut,
  onGoToPOS,
  onChangePin,
  isAdmin,
  onDeleteServiceLog
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scheduleSubTab, setScheduleSubTab] = useState("schedule");
  const [requestsSubTab, setRequestsSubTab] = useState("leave");
  const [scheduleMonth, setScheduleMonth] = useState((/* @__PURE__ */ new Date()).toISOString().substring(0, 7));
  const [payrollMonth, setPayrollMonth] = useState((/* @__PURE__ */ new Date()).toISOString().substring(0, 7));
  const [calendarSelection, setCalendarSelection] = useState([]);
  const [showPayslip, setShowPayslip] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22", startDate: "", endDate: "", reason: "", dates: [], replacementDate: "" });
  const [advanceForm, setAdvanceForm] = useState({ amount: "", reason: "" });
  const [suppliesForm, setSuppliesForm] = useState({ itemName: "", quantity: "", reason: "" });
  const [serviceForm, setServiceForm] = useState({ date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], type: "\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D", amount: "", note: "" });
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          await updateDoc(doc2(db, "employees", employee.id), { profileImage: dataUrl });
          setIsUploadingImage(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E: " + err.message);
      setIsUploadingImage(false);
    }
  };
  const [currentTime, setCurrentTime] = useState(/* @__PURE__ */ new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(timer);
  }, []);
  const [pinForm, setPinForm] = useState({ oldPin: "", newPin: "", confirmPin: "" });
  const [pinFormMessage, setPinFormMessage] = useState({ type: "", text: "" });
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinFormMessage({ type: "", text: "" });
    const { oldPin, newPin, confirmPin } = pinForm;
    const currentPin = String(employee.pin || "1234");
    if (oldPin !== currentPin) {
      setPinFormMessage({ type: "error", text: "PIN \u0E40\u0E14\u0E34\u0E21\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07" });
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinFormMessage({ type: "error", text: "PIN \u0E43\u0E2B\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 4 \u0E2B\u0E25\u0E31\u0E01" });
      return;
    }
    if (newPin !== confirmPin) {
      setPinFormMessage({ type: "error", text: "PIN \u0E43\u0E2B\u0E21\u0E48\u0E41\u0E25\u0E30\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19 PIN \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19" });
      return;
    }
    if (newPin === oldPin) {
      setPinFormMessage({ type: "error", text: "PIN \u0E43\u0E2B\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E0B\u0E49\u0E33\u0E01\u0E31\u0E1A PIN \u0E40\u0E14\u0E34\u0E21" });
      return;
    }
    setIsSubmittingPin(true);
    try {
      if (typeof onChangePin === "function") {
        const res = await onChangePin(newPin);
        if (res && res.ok === false) throw new Error(res.error || "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      } else {
        await updateDoc(doc2(db, "employees", employee.id), { pin: String(newPin) });
      }
      setPinFormMessage({ type: "success", text: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19 PIN \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08" });
      setPinForm({ oldPin: "", newPin: "", confirmPin: "" });
    } catch (err) {
      setPinFormMessage({ type: "error", text: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message });
    }
    setIsSubmittingPin(false);
  };
  const myLeaves = useMemo(() => leaves.filter((l) => l.employeeId === employee.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [leaves, employee.id]);
  const myAttendance = useMemo(() => attendance.filter((a) => a.employeeId === employee.id).sort((a, b) => new Date(b.date) - new Date(a.date)), [attendance, employee.id]);
  const myAdvances = useMemo(() => advancePayments.filter((a) => a.employeeId === employee.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [advancePayments, employee.id]);
  const myRequisitions = useMemo(() => requisitions.filter((r) => r.employeeId === employee.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [requisitions, employee.id]);
  const isInPayrollMonth = (item, monthPrefix) => {
    if (item.createdAt && item.createdAt.includes("T")) return item.createdAt.startsWith(monthPrefix);
    if (item.date && String(item.date).match(/^\d{4}-\d{2}-\d{2}/)) return String(item.date).startsWith(monthPrefix);
    const dStr = item.\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 || item.date;
    if (dStr && typeof dStr === "string" && dStr.includes("/")) {
      const parts = dStr.split("/");
      if (parts.length === 3) {
        let year = parseInt(parts[2], 10);
        if (year > 2500) year -= 543;
        return `${year}-${parts[1].padStart(2, "0")}` === monthPrefix;
      }
    }
    return false;
  };
  const payrollEmployee = useMemo(() => {
    const empHistories = histories.filter((h) => {
      if (!isInPayrollMonth(h, payrollMonth)) return false;
      const sName = String(getFuzzyKey(h, ["\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E08\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48", "\u0E0A\u0E37\u0E48\u0E2D\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19", "staffName", "\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23", "\u0E40\u0E08\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48"]) || "");
      return sName === employee.name;
    });
    let totalCommission = 0;
    empHistories.forEach((h) => {
      const price = parseNumber(getFuzzyKey(h, ["\u0E23\u0E32\u0E04\u0E32", "price", "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"]) || 0);
      totalCommission += price * ((employee.commissionRate || 0) / 100);
    });
    const empServiceLogs = serviceLogs.filter((s) => s.employeeId === employee.id && isInPayrollMonth(s, payrollMonth));
    let totalServiceFees = 0;
    empServiceLogs.forEach((s) => {
      const isPOS = typeof s.note === "string" && s.note.startsWith("POS:");
      totalServiceFees += isPOS ? parseNumber(s.amount) * 0.1 : parseNumber(s.amount);
    });
    const empAdvances = advancePayments.filter((a) => a.employeeId === employee.id && (a.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" || a.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27") && isInPayrollMonth(a, payrollMonth));
    let totalAdvances = 0;
    empAdvances.forEach((a) => totalAdvances += parseNumber(a.amount));
    const baseSalary = parseNumber(employee.baseSalary || 0);
    const totalIncome = baseSalary + totalCommission + totalServiceFees - totalAdvances;
    return {
      ...employee,
      totalCommission,
      totalServiceFees,
      totalAdvances,
      netSalary: totalIncome,
      // Keep netSalary for UI compatibility if needed elsewhere
      totalIncome,
      // For PayslipModal
      serviceCount: empHistories.length,
      serviceLogCount: empServiceLogs.length
    };
  }, [histories, serviceLogs, advancePayments, employee, payrollMonth]);
  const branchTargetStats = useMemo(() => {
    const currentMonth = (/* @__PURE__ */ new Date()).toISOString().substring(0, 7);
    const empBranch = employee.branch || "";
    const altBranch = empBranch.startsWith("\u0E2A\u0E32\u0E02\u0E32") ? empBranch.replace("\u0E2A\u0E32\u0E02\u0E32", "").trim() : "\u0E2A\u0E32\u0E02\u0E32" + empBranch;
    let branchSales = 0;
    orders.forEach((o) => {
      const isSameMonth = o.createdAt && o.createdAt.startsWith(currentMonth);
      const isSameBranch = o.branch === empBranch || o.branch === altBranch;
      if (isSameMonth && isSameBranch && (!o.status || o.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27")) {
        const isPO = o.transactionType === "owner_purchase" || (o.courseName || "").includes("[\u0E0B\u0E37\u0E49\u0E2D\u0E40\u0E02\u0E49\u0E32");
        const isReq = o.transactionType === "branch_requisition" || (o.courseName || "").includes("[\u0E40\u0E1A\u0E34\u0E01\u0E08\u0E32\u0E01");
        if (!isPO && !isReq) {
          branchSales += parseNumber(o.price);
        }
      }
    });
    let target = parseNumber(appSettings?.branchTargets?.[empBranch] || 0);
    if (!target) {
      target = parseNumber(appSettings?.branchTargets?.[altBranch] || 0);
    }
    const percent = target > 0 ? Math.min(100, branchSales / target * 100) : 0;
    return { branchSales, target, percent };
  }, [orders, appSettings, employee.branch]);
  const handleSubmitService = async (e) => {
    e.preventDefault();
    if (!serviceForm.amount || !serviceForm.date) {
      alert("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19");
      return;
    }
    setIsSubmittingService(true);
    try {
      await addDoc(getCol("service_logs"), {
        ...serviceForm,
        amount: parseNumber(serviceForm.amount),
        employeeId: employee.id,
        employeeName: employee.name,
        branch: employee.branch,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      alert("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27");
      setServiceForm({ ...serviceForm, amount: "", note: "" });
    } catch (err) {
      console.error(err);
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14");
    }
    setIsSubmittingService(false);
  };
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const todayAtt = myAttendance.find((a) => a.date === today);
  const handleSaveLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.dates || leaveForm.dates.length === 0) {
      alert("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E32\u0E1A\u0E19\u0E1B\u0E0F\u0E34\u0E17\u0E34\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E04\u0E23\u0E31\u0E1A");
      return;
    }
    setIsSubmittingLeave(true);
    try {
      const batchPromises = leaveForm.dates.map((dateStr) => {
        const finalReason = leaveForm.leaveType === "\u0E2A\u0E25\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14" ? `\u0E02\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 \u0E42\u0E14\u0E22\u0E08\u0E30\u0E21\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19\u0E0A\u0E14\u0E40\u0E0A\u0E22\u0E43\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${new Date(leaveForm.replacementDate).toLocaleDateString("th-TH")} (\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25: ${leaveForm.reason})` : leaveForm.reason;
        const data = {
          employeeId: employee.id,
          employeeName: employee.name,
          leaveType: leaveForm.leaveType,
          startDate: dateStr,
          endDate: dateStr,
          reason: finalReason,
          replacementDate: leaveForm.leaveType === "\u0E2A\u0E25\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14" ? leaveForm.replacementDate : null,
          status: "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        return addDoc(getCol("employee_leaves"), data);
      });
      await Promise.all(batchPromises);
      alert("\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E25\u0E32\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E2D\u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34");
      setLeaveForm({ leaveType: "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22", startDate: "", endDate: "", reason: "", dates: [], replacementDate: "" });
      setCalendarSelection([]);
      setActiveTab("dashboard");
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
    setIsSubmittingLeave(false);
  };
  const internalDeleteServiceLog = async (logId) => {
    if (onDeleteServiceLog) {
      onDeleteServiceLog(logId);
      return;
    }
    try {
      await deleteDoc(doc2(db, "service_logs", logId));
      alert("\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27");
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    if (isNaN(advanceForm.amount) || advanceForm.amount <= 0) {
      alert("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07");
      return;
    }
    setIsSubmittingAdvance(true);
    try {
      const data = {
        employeeId: employee.id,
        employeeName: employee.name,
        amount: Number(advanceForm.amount),
        reason: advanceForm.reason,
        status: "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await addDoc(getCol("advance_payments"), data);
      alert("\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E2D\u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34");
      setAdvanceForm({ amount: "", reason: "" });
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
    setIsSubmittingAdvance(false);
  };
  const [isSubmittingSupplies, setIsSubmittingSupplies] = useState(false);
  const handleSaveSupplies = async (e) => {
    e.preventDefault();
    if (!suppliesForm.itemName || !suppliesForm.quantity) {
      alert("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E30\u0E08\u0E33\u0E19\u0E27\u0E19");
      return;
    }
    setIsSubmittingSupplies(true);
    try {
      const data = {
        employeeId: employee.id,
        employeeName: employee.name,
        itemName: suppliesForm.itemName,
        quantity: suppliesForm.quantity,
        reason: suppliesForm.reason,
        status: "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await addDoc(getCol("employee_requisitions"), data);
      alert("\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E2D\u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34");
      setSuppliesForm({ itemName: "", quantity: "", reason: "" });
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
    setIsSubmittingSupplies(false);
  };
  return /* @__PURE__ */ React2.createElement("div", { className: "fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex flex-col animate-in fade-in duration-300" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-white px-4 md:px-6 py-4 border-b border-slate-200 flex items-center shadow-sm" }, /* @__PURE__ */ React2.createElement("div", { className: "flex items-center gap-3 md:gap-4" }, /* @__PURE__ */ React2.createElement("label", { className: "relative w-10 h-10 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-200 overflow-hidden shadow-sm transition-colors shrink-0" }, employee.profileImage ? /* @__PURE__ */ React2.createElement("img", { src: employee.profileImage, alt: "Profile", className: "w-full h-full object-cover" }) : /* @__PURE__ */ React2.createElement(User, { size: 24 }), isUploadingImage && /* @__PURE__ */ React2.createElement("div", { className: "absolute inset-0 bg-black/30 flex items-center justify-center" }, /* @__PURE__ */ React2.createElement("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })), /* @__PURE__ */ React2.createElement("input", { type: "file", accept: "image/*", className: "hidden", onChange: handleImageUpload, disabled: isUploadingImage })), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("h2", { className: "text-lg md:text-xl font-black text-slate-800 leading-tight" }, employee.name), /* @__PURE__ */ React2.createElement("p", { className: "text-xs md:text-sm font-bold text-slate-500" }, "\u0E2A\u0E32\u0E02\u0E32\u0E1B\u0E23\u0E30\u0E08\u0E33: ", employee.branch))), /* @__PURE__ */ React2.createElement("div", { className: "flex-1 flex justify-center" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: () => {
        onClose();
        if (onGoToPOS) onGoToPOS();
      },
      className: "flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/40 active:scale-[0.98]",
      title: "\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E2B\u0E19\u0E49\u0E32 POS"
    },
    /* @__PURE__ */ React2.createElement(ShoppingCart, { size: 20 }),
    /* @__PURE__ */ React2.createElement("span", null, "POS")
  )), /* @__PURE__ */ React2.createElement("button", { onClick: onClose, className: "p-2 md:py-2 md:px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 transition-colors" }, /* @__PURE__ */ React2.createElement(LogOut, { size: 18 }), " ", /* @__PURE__ */ React2.createElement("span", { className: "hidden md:inline" }, "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A"))), /* @__PURE__ */ React2.createElement("div", { className: "flex-1 overflow-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto w-full" }, /* @__PURE__ */ React2.createElement("div", { className: "hidden md:flex flex-col w-64 gap-2 shrink-0" }, [
    { id: "dashboard", icon: Clock, label: "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32" },
    { id: "service", icon: UserCheck, label: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D" },
    { id: "schedule_group", icon: Calendar, label: "\u0E15\u0E32\u0E23\u0E32\u0E07 & \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34" },
    { id: "requests_group", icon: Send, label: "\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07 (\u0E25\u0E32/\u0E40\u0E1A\u0E34\u0E01)" },
    { id: "settings", icon: Lock, label: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32" }
  ].map((tab) => /* @__PURE__ */ React2.createElement(
    "button",
    {
      key: tab.id,
      onClick: () => setActiveTab(tab.id),
      className: `p-4 rounded-2xl font-bold flex items-center gap-2 transition-colors ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`
    },
    /* @__PURE__ */ React2.createElement(tab.icon, { size: 18 }),
    " ",
    tab.label
  ))), /* @__PURE__ */ React2.createElement("div", { className: "flex-1 min-w-0 flex flex-col gap-6 pb-32 md:pb-0" }, activeTab === "dashboard" && /* @__PURE__ */ React2.createElement("div", { className: "flex flex-col gap-6" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg font-black text-slate-800 mb-3 text-center md:text-left" }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E27\u0E25\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), /* @__PURE__ */ React2.createElement("div", { className: "flex-1 flex flex-col items-center justify-center py-2" }, todayAtt ? /* @__PURE__ */ React2.createElement("div", { className: "w-full grid grid-cols-2 gap-3" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-emerald-50 text-emerald-700 p-3 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center h-full" }, /* @__PURE__ */ React2.createElement(CheckCircle, { size: 24, className: "mb-1 text-emerald-500" }), /* @__PURE__ */ React2.createElement("h4", { className: "text-sm font-black mb-0.5" }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19"), /* @__PURE__ */ React2.createElement("p", { className: "text-xs font-bold text-slate-600" }, new Date(todayAtt.clockIn).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }), " \u0E19."), (() => {
    if (todayAtt.clockOut) return null;
    const diffMs = currentTime.getTime() - new Date(todayAtt.clockIn).getTime();
    const hours = Math.floor(diffMs / (1e3 * 60 * 60));
    const mins = Math.floor(diffMs % (1e3 * 60 * 60) / (1e3 * 60));
    return /* @__PURE__ */ React2.createElement("p", { className: "text-[10px] font-bold text-emerald-600 mt-0.5" }, hours, " \u0E0A\u0E21. ", mins, " \u0E19.");
  })(), todayAtt.branch && /* @__PURE__ */ React2.createElement("p", { className: "text-[9px] md:text-[10px] font-bold mt-1 opacity-70" }, "\u0E2A\u0E32\u0E02\u0E32: ", todayAtt.branch)), todayAtt.clockOut ? /* @__PURE__ */ React2.createElement("div", { className: "bg-slate-100 text-slate-600 p-3 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center h-full" }, /* @__PURE__ */ React2.createElement(XCircle, { size: 24, className: "mb-1 text-slate-400" }), /* @__PURE__ */ React2.createElement("h4", { className: "text-sm font-black mb-0.5" }, "\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React2.createElement("p", { className: "text-xs md:text-sm font-bold" }, new Date(todayAtt.clockOut).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }), " \u0E19."), (() => {
    const diffMs = new Date(todayAtt.clockOut).getTime() - new Date(todayAtt.clockIn).getTime();
    const hours = Math.floor(diffMs / (1e3 * 60 * 60));
    const mins = Math.floor(diffMs % (1e3 * 60 * 60) / (1e3 * 60));
    return /* @__PURE__ */ React2.createElement("p", { className: "text-[10px] md:text-xs font-bold text-slate-500 mt-1" }, "\u0E23\u0E27\u0E21: ", hours, " \u0E0A\u0E21. ", mins, " \u0E19.");
  })()) : /* @__PURE__ */ React2.createElement("button", { onClick: () => onClockOut(todayAtt), className: "h-full w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-sm md:text-base shadow-lg shadow-rose-500/30 transition-transform active:scale-95 flex flex-col items-center justify-center gap-2" }, /* @__PURE__ */ React2.createElement(UserMinus, { size: 28 }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19")) : /* @__PURE__ */ React2.createElement("div", { className: "w-full max-w-md flex flex-col gap-3" }, /* @__PURE__ */ React2.createElement("button", { onClick: () => onClockIn(employee), className: "w-full py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-3" }, /* @__PURE__ */ React2.createElement(UserCheck, { size: 24 }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19"), /* @__PURE__ */ React2.createElement("p", { className: "text-[10px] md:text-xs text-center text-slate-400 font-bold" }, "* \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E1E\u0E34\u0E01\u0E31\u0E14 GPS \u0E23\u0E30\u0E22\u0E30 10 \u0E40\u0E21\u0E15\u0E23\u0E08\u0E32\u0E01\u0E2A\u0E32\u0E02\u0E32")))), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group" }, /* @__PURE__ */ React2.createElement("div", { className: "absolute -right-4 -bottom-4 text-indigo-200 opacity-50 group-hover:scale-110 transition-transform duration-500" }, /* @__PURE__ */ React2.createElement(CheckCircle, { size: 80 })), /* @__PURE__ */ React2.createElement("div", { className: "relative z-10" }, /* @__PURE__ */ React2.createElement("div", { className: "text-indigo-800 font-bold mb-1 text-xs md:text-sm flex items-center gap-2" }, "\u0E22\u0E2D\u0E14\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 (\u0E04\u0E23\u0E31\u0E49\u0E07)"), /* @__PURE__ */ React2.createElement("div", { className: "text-xl md:text-2xl font-black text-indigo-900" }, payrollEmployee.serviceCount + payrollEmployee.serviceLogCount))), /* @__PURE__ */ React2.createElement("div", { className: "bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group" }, /* @__PURE__ */ React2.createElement("div", { className: "absolute -right-4 -bottom-4 text-emerald-200 opacity-50 group-hover:scale-110 transition-transform duration-500" }, /* @__PURE__ */ React2.createElement(DollarSign, { size: 80 })), /* @__PURE__ */ React2.createElement("div", { className: "relative z-10" }, /* @__PURE__ */ React2.createElement("div", { className: "text-emerald-800 font-bold mb-1 text-xs md:text-sm flex items-center gap-2" }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A\u0E2A\u0E38\u0E17\u0E18\u0E34 (\u0E23\u0E27\u0E21\u0E2B\u0E31\u0E01\u0E25\u0E1A)"), /* @__PURE__ */ React2.createElement("div", { className: "text-xl md:text-2xl font-black text-emerald-900" }, "\u0E3F", payrollEmployee.netSalary.toLocaleString())))), /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm" }, /* @__PURE__ */ React2.createElement("div", { className: "text-sm font-bold text-slate-800 mb-3 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(DollarSign, { size: 16, className: "text-emerald-500" }), " \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E01\u0E32\u0E23\u0E04\u0E33\u0E19\u0E27\u0E13\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19"), /* @__PURE__ */ React2.createElement("div", { className: "space-y-2 text-xs md:text-sm" }, /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between items-center text-slate-600" }, /* @__PURE__ */ React2.createElement("span", null, "\u0E10\u0E32\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19"), /* @__PURE__ */ React2.createElement("span", { className: "font-bold" }, "\u0E3F", (Number(employee.baseSalary) || 0).toLocaleString())), /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between items-center text-slate-600" }, /* @__PURE__ */ React2.createElement("span", null, "\u0E04\u0E48\u0E32\u0E04\u0E2D\u0E21\u0E21\u0E34\u0E0A\u0E0A\u0E31\u0E19 (\u0E08\u0E32\u0E01\u0E22\u0E2D\u0E14\u0E02\u0E32\u0E22)"), /* @__PURE__ */ React2.createElement("span", { className: "font-bold text-emerald-600" }, "+ \u0E3F", payrollEmployee.totalCommission.toLocaleString())), /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between items-center text-slate-600" }, /* @__PURE__ */ React2.createElement("span", null, "\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D / \u0E04\u0E48\u0E32\u0E08\u0E35\u0E49\u0E44\u0E1D"), /* @__PURE__ */ React2.createElement("span", { className: "font-bold text-emerald-600" }, "+ \u0E3F", payrollEmployee.totalServiceFees.toLocaleString())), /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between items-center text-slate-600" }, /* @__PURE__ */ React2.createElement("span", null, "\u0E2B\u0E31\u0E01\u0E40\u0E1A\u0E34\u0E01\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32"), /* @__PURE__ */ React2.createElement("span", { className: "font-bold text-rose-500" }, "- \u0E3F", payrollEmployee.totalAdvances.toLocaleString())), /* @__PURE__ */ React2.createElement("div", { className: "border-t border-dashed border-slate-200 pt-2 mt-2 flex justify-between items-center" }, /* @__PURE__ */ React2.createElement("span", { className: "font-black text-slate-800" }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A\u0E2A\u0E38\u0E17\u0E18\u0E34"), /* @__PURE__ */ React2.createElement("span", { className: "font-black text-emerald-600 text-base" }, "\u0E3F", payrollEmployee.netSalary.toLocaleString())))), /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm" }, /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between items-center mb-2" }, /* @__PURE__ */ React2.createElement("div", { className: "text-sm font-bold text-slate-700 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(ShoppingCart, { size: 16, className: "text-pink-500" }), " \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E22\u0E2D\u0E14\u0E02\u0E32\u0E22\u0E2A\u0E32\u0E02\u0E32 ", employee.branch), branchTargetStats.target > 0 ? /* @__PURE__ */ React2.createElement("div", { className: "text-xs font-bold text-slate-500" }, branchTargetStats.percent.toFixed(1), "%") : /* @__PURE__ */ React2.createElement("div", { className: "text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200" }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E15\u0E31\u0E49\u0E07\u0E40\u0E1B\u0E49\u0E32")), /* @__PURE__ */ React2.createElement("div", { className: "w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full transition-all duration-1000", style: { width: `${branchTargetStats.percent}%` } })), /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between text-xs font-bold text-slate-400" }, /* @__PURE__ */ React2.createElement("span", null, "\u0E17\u0E33\u0E44\u0E14\u0E49 \u0E3F", branchTargetStats.branchSales.toLocaleString()), /* @__PURE__ */ React2.createElement("span", null, "\u0E40\u0E1B\u0E49\u0E32 \u0E3F", branchTargetStats.target.toLocaleString()))), /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm mb-4" }, /* @__PURE__ */ React2.createElement("div", { className: "text-sm font-bold text-slate-800 mb-4 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(Send, { size: 16, className: "text-indigo-500" }), " \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49"), /* @__PURE__ */ React2.createElement("div", { className: "space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2" }, (() => {
    const currentMonthPrefix = (/* @__PURE__ */ new Date()).toISOString().substring(0, 7);
    const empLeaves = leaves.filter((l) => l.employeeId === employee.id && (l.createdAt || "").startsWith(currentMonthPrefix)).map((l) => ({ ...l, reqType: "leave", title: l.leaveType, amount: null }));
    const empAdvances = advancePayments.filter((a) => a.employeeId === employee.id && (a.createdAt || "").startsWith(currentMonthPrefix)).map((a) => ({ ...a, reqType: "advance", title: "\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32", amount: a.amount }));
    const empRequisitions = requisitions.filter((r) => r.employeeId === employee.id && (r.createdAt || "").startsWith(currentMonthPrefix)).map((r) => ({ ...r, reqType: "requisition", title: "\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49: " + r.itemName, amount: r.quantity }));
    const allMyRequests = [...empLeaves, ...empAdvances, ...empRequisitions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (allMyRequests.length === 0) {
      return /* @__PURE__ */ React2.createElement("div", { className: "text-center text-slate-400 font-bold py-6 bg-slate-50 rounded-2xl text-xs border border-slate-100" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07\u0E43\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49");
    }
    return allMyRequests.map((req, idx) => /* @__PURE__ */ React2.createElement("div", { key: idx, className: "flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("div", { className: "font-bold text-xs text-slate-800 flex items-center gap-1.5" }, /* @__PURE__ */ React2.createElement("div", { className: `w-2 h-2 rounded-full ${req.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" || req.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27" ? "bg-emerald-500" : req.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-rose-500" : "bg-amber-400"}` }), req.title), /* @__PURE__ */ React2.createElement("div", { className: "text-[10px] text-slate-500 font-medium mt-1" }, new Date(req.createdAt).toLocaleDateString("th-TH"), req.reqType === "leave" && req.startDate && ` (${new Date(req.startDate).toLocaleDateString("th-TH")})`, req.reqType === "advance" && ` - \u0E3F${Number(req.amount).toLocaleString()}`, req.reqType === "requisition" && ` - \u0E08\u0E33\u0E19\u0E27\u0E19: ${req.amount}`)), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("span", { className: `text-[10px] font-bold px-2 py-1 rounded-lg ${req.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" || req.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27" ? "bg-emerald-100 text-emerald-700" : req.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}` }, req.status || "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"))));
  })()))), activeTab === "history" && /* @__PURE__ */ React2.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[70vh]" }, /* @__PURE__ */ React2.createElement("div", { className: "p-4 md:p-6 border-b border-slate-200" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg md:text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(History, { className: "text-indigo-500" }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32")), /* @__PURE__ */ React2.createElement("div", { className: "overflow-auto p-2" }, /* @__PURE__ */ React2.createElement("div", { className: "space-y-2" }, myAttendance.length === 0 ? /* @__PURE__ */ React2.createElement("div", { className: "py-8 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32") : myAttendance.map((att) => /* @__PURE__ */ React2.createElement("div", { key: att.id, className: "bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("p", { className: "font-bold text-slate-800" }, new Date(att.date).toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })), /* @__PURE__ */ React2.createElement("p", { className: "text-xs font-bold text-slate-500 mt-1" }, "\u0E2A\u0E32\u0E02\u0E32: ", att.branch)), /* @__PURE__ */ React2.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold" }, "\u0E40\u0E02\u0E49\u0E32: ", new Date(att.clockIn).toLocaleTimeString("th-TH")), /* @__PURE__ */ React2.createElement("div", { className: "bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold" }, "\u0E2D\u0E2D\u0E01: ", att.clockOut ? new Date(att.clockOut).toLocaleTimeString("th-TH") : "-"))))))), activeTab === "service" && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg md:text-xl font-black text-slate-800 mb-6 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(UserCheck, { className: "text-pink-500" }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D / \u0E04\u0E48\u0E32\u0E08\u0E35\u0E49\u0E44\u0E1D"), /* @__PURE__ */ React2.createElement("form", { onSubmit: handleSubmitService, className: "space-y-4" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E07\u0E32\u0E19"), /* @__PURE__ */ React2.createElement("input", { required: true, type: "date", value: serviceForm.date, onChange: (e) => setServiceForm({ ...serviceForm, date: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" })), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), /* @__PURE__ */ React2.createElement("select", { required: true, value: serviceForm.type, onChange: (e) => setServiceForm({ ...serviceForm, type: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" }, /* @__PURE__ */ React2.createElement("option", { value: "\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D" }, "\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D"), /* @__PURE__ */ React2.createElement("option", { value: "\u0E04\u0E48\u0E32\u0E08\u0E35\u0E49\u0E44\u0E1D" }, "\u0E04\u0E48\u0E32\u0E08\u0E35\u0E49\u0E44\u0E1D"))), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17)"), /* @__PURE__ */ React2.createElement("input", { required: true, type: "number", min: "0", step: "any", value: serviceForm.amount, onChange: (e) => setServiceForm({ ...serviceForm, amount: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700 text-lg", placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19..." })), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)"), /* @__PURE__ */ React2.createElement("textarea", { rows: "2", value: serviceForm.note, onChange: (e) => setServiceForm({ ...serviceForm, note: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700", placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21..." })), /* @__PURE__ */ React2.createElement("button", { type: "submit", disabled: isSubmittingService, className: "w-full py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black shadow-xl shadow-pink-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-4" }, /* @__PURE__ */ React2.createElement(Check, { size: 18 }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E22\u0E2D\u0E14"))), /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg md:text-xl font-black text-slate-800 mb-6" }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D"), /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, serviceLogs.filter((s) => s.employeeId === employee.id).length === 0 ? /* @__PURE__ */ React2.createElement("div", { className: "py-8 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D") : serviceLogs.filter((s) => s.employeeId === employee.id).sort((a, b) => new Date(b.date) - new Date(a.date)).map((log) => /* @__PURE__ */ React2.createElement("div", { key: log.id, className: "p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col gap-2" }, /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between items-start" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("h4", { className: "font-black text-pink-600 text-lg" }, "\u0E3F", Number(log.amount).toLocaleString(), /* @__PURE__ */ React2.createElement("span", { className: "text-sm font-bold text-emerald-500 ml-2" }, "(\u0E44\u0E14\u0E49 ", typeof log.note === "string" && log.note.startsWith("POS:") ? `\u0E3F${(Number(log.amount) * 0.1).toLocaleString()}` : `\u0E40\u0E15\u0E47\u0E21 \u0E3F${Number(log.amount).toLocaleString()}`, ")")), /* @__PURE__ */ React2.createElement("p", { className: "text-xs font-bold text-slate-500 mt-0.5" }, new Date(log.date).toLocaleDateString("th-TH"), " - ", log.type)), /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: () => {
        if (window.confirm("\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")) {
          internalDeleteServiceLog(log.id);
        }
      },
      className: "p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 ml-2",
      title: "\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"
    },
    /* @__PURE__ */ React2.createElement(Trash2, { size: 16 })
  )), log.note && /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-slate-600 bg-white p-2 rounded-xl border border-slate-100" }, log.note)))))), activeTab === "requests_group" && /* @__PURE__ */ React2.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[80vh]" }, /* @__PURE__ */ React2.createElement("div", { className: "flex bg-slate-50 border-b border-slate-200" }, /* @__PURE__ */ React2.createElement("button", { onClick: () => setRequestsSubTab("leave"), className: `flex-1 py-4 font-bold text-sm transition-colors ${requestsSubTab === "leave" ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:bg-slate-100"}` }, "\u0E22\u0E37\u0E48\u0E19\u0E02\u0E2D\u0E25\u0E32"), /* @__PURE__ */ React2.createElement("button", { onClick: () => setRequestsSubTab("finance"), className: `flex-1 py-4 font-bold text-sm transition-colors ${requestsSubTab === "finance" ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:bg-slate-100"}` }, "\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32"), /* @__PURE__ */ React2.createElement("button", { onClick: () => setRequestsSubTab("supplies"), className: `flex-1 py-4 font-bold text-sm transition-colors ${requestsSubTab === "supplies" ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:bg-slate-100"}` }, "\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49")), /* @__PURE__ */ React2.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar p-0" }, requestsSubTab === "leave" && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg md:text-xl font-black text-slate-800 mb-2 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(Send, { className: "text-indigo-500" }), " \u0E22\u0E37\u0E48\u0E19\u0E04\u0E33\u0E02\u0E2D\u0E25\u0E32"), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-slate-500 font-bold mb-6" }, "\u0E2A\u0E48\u0E07\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E02\u0E2D\u0E25\u0E32\u0E2B\u0E22\u0E38\u0E14\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E08\u0E32\u0E23\u0E13\u0E32"), /* @__PURE__ */ React2.createElement("form", { onSubmit: handleSaveLeave, className: "space-y-4" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E25\u0E32"), /* @__PURE__ */ React2.createElement("select", { required: true, value: leaveForm.leaveType, onChange: (e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" }, /* @__PURE__ */ React2.createElement("option", { value: "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22" }, "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22"), /* @__PURE__ */ React2.createElement("option", { value: "\u0E25\u0E32\u0E01\u0E34\u0E08" }, "\u0E25\u0E32\u0E01\u0E34\u0E08"), /* @__PURE__ */ React2.createElement("option", { value: "\u0E25\u0E32\u0E1E\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19" }, "\u0E25\u0E32\u0E1E\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19"), /* @__PURE__ */ React2.createElement("option", { value: "\u0E2A\u0E25\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14" }, "\u0E2A\u0E25\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14"), /* @__PURE__ */ React2.createElement("option", { value: "\u0E2D\u0E37\u0E48\u0E19\u0E46" }, "\u0E2D\u0E37\u0E48\u0E19\u0E46"))), /* @__PURE__ */ React2.createElement("div", { className: "mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl" }, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-indigo-800 mb-2" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 (", leaveForm.dates?.length || 0, " \u0E27\u0E31\u0E19):"), /* @__PURE__ */ React2.createElement("div", { className: "flex flex-wrap gap-2" }, leaveForm.dates && leaveForm.dates.length > 0 ? leaveForm.dates.map((d) => /* @__PURE__ */ React2.createElement("span", { key: d, className: "px-3 py-1 bg-white text-indigo-700 rounded-lg text-sm font-bold shadow-sm border border-indigo-200" }, new Date(d).toLocaleDateString("th-TH"))) : /* @__PURE__ */ React2.createElement("span", { className: "text-sm text-slate-500 font-bold" }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E31\u0E19 (\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E35\u0E48\u0E1B\u0E0F\u0E34\u0E17\u0E34\u0E19)"))), leaveForm.leaveType === "\u0E2A\u0E25\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14" && /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E21\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19\u0E0A\u0E14\u0E40\u0E0A\u0E22"), /* @__PURE__ */ React2.createElement("input", { required: true, type: "date", value: leaveForm.replacementDate, onChange: (e) => setLeaveForm({ ...leaveForm, replacementDate: e.target.value }), className: "w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-bold focus:border-amber-500 outline-none text-amber-700 text-sm" })), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E25\u0E32"), /* @__PURE__ */ React2.createElement("textarea", { required: true, rows: "3", value: leaveForm.reason, onChange: (e) => setLeaveForm({ ...leaveForm, reason: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700", placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25..." })), /* @__PURE__ */ React2.createElement("button", { type: "submit", disabled: isSubmittingLeave, className: "w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50" }, /* @__PURE__ */ React2.createElement(Send, { size: 18 }), " \u0E2A\u0E48\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E25\u0E32"))), /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg md:text-xl font-black text-slate-800 mb-6" }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E25\u0E32"), /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, myLeaves.length === 0 ? /* @__PURE__ */ React2.createElement("div", { className: "py-8 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E25\u0E32") : myLeaves.map((leave) => /* @__PURE__ */ React2.createElement("div", { key: leave.id, className: "p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col gap-2" }, /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between items-start" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("h4", { className: "font-bold text-slate-700 text-sm" }, leave.leaveType), /* @__PURE__ */ React2.createElement("p", { className: "text-xs font-bold text-slate-500 mt-0.5" }, new Date(leave.startDate).toLocaleDateString("th-TH"), " - ", new Date(leave.endDate).toLocaleDateString("th-TH"))), /* @__PURE__ */ React2.createElement("span", { className: `px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${leave.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-emerald-100 text-emerald-700" : leave.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}` }, leave.status)), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-slate-600 bg-white p-2 rounded-xl border border-slate-100" }, leave.reason || "-")))))), requestsSubTab === "finance" && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg md:text-xl font-black text-slate-800 mb-2 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(Wallet, { className: "text-emerald-500" }), " \u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32"), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-slate-500 font-bold mb-6" }, "\u0E01\u0E23\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E08\u0E32\u0E23\u0E13\u0E32"), /* @__PURE__ */ React2.createElement("div", { className: "bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("div", { className: "text-xs font-bold text-emerald-600 mb-1" }, "\u0E10\u0E32\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13"), /* @__PURE__ */ React2.createElement("div", { className: "text-2xl font-black text-emerald-700 flex items-center gap-1" }, /* @__PURE__ */ React2.createElement(DollarSign, { size: 20 }), employee.baseSalary ? Number(employee.baseSalary).toLocaleString() : "0", " ", /* @__PURE__ */ React2.createElement("span", { className: "text-sm font-bold" }, "\u0E1A\u0E32\u0E17"))), /* @__PURE__ */ React2.createElement("div", { className: "flex flex-col sm:flex-row gap-2" }, /* @__PURE__ */ React2.createElement(
    "input",
    {
      type: "month",
      value: payrollMonth,
      onChange: (e) => setPayrollMonth(e.target.value),
      className: "bg-white border border-emerald-200 px-3 py-2 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-emerald-700 w-full sm:w-auto"
    }
  ), /* @__PURE__ */ React2.createElement("button", { onClick: () => setShowPayslip(true), className: "py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors text-sm whitespace-nowrap" }, "\u0E14\u0E39\u0E2A\u0E25\u0E34\u0E1B\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19"))), /* @__PURE__ */ React2.createElement("form", { onSubmit: handleSaveAdvance, className: "space-y-4" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E1A\u0E34\u0E01 (\u0E1A\u0E32\u0E17)"), /* @__PURE__ */ React2.createElement("input", { required: true, type: "number", min: "1", value: advanceForm.amount, onChange: (e) => setAdvanceForm({ ...advanceForm, amount: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700 text-lg", placeholder: "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07: 1000" })), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E04\u0E27\u0E32\u0E21\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19"), /* @__PURE__ */ React2.createElement("textarea", { required: true, rows: "3", value: advanceForm.reason, onChange: (e) => setAdvanceForm({ ...advanceForm, reason: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700", placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25..." })), /* @__PURE__ */ React2.createElement("button", { type: "submit", disabled: isSubmittingAdvance, className: "w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50" }, /* @__PURE__ */ React2.createElement(Send, { size: 18 }), " \u0E2A\u0E48\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19"))), /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg md:text-xl font-black text-slate-800 mb-6" }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19"), /* @__PURE__ */ React2.createElement("div", { className: "space-y-3" }, myAdvances.length === 0 ? /* @__PURE__ */ React2.createElement("div", { className: "py-8 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32") : myAdvances.map((adv) => /* @__PURE__ */ React2.createElement("div", { key: adv.id, className: "p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col gap-2" }, /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between items-start" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("h4", { className: "font-black text-emerald-600 text-lg" }, "\u0E3F", Number(adv.amount).toLocaleString()), /* @__PURE__ */ React2.createElement("p", { className: "text-xs font-bold text-slate-500 mt-0.5" }, new Date(adv.createdAt).toLocaleDateString("th-TH"))), /* @__PURE__ */ React2.createElement("span", { className: `px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${adv.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-emerald-100 text-emerald-700" : adv.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}` }, adv.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" && /* @__PURE__ */ React2.createElement(Check, { size: 14 }), adv.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" && /* @__PURE__ */ React2.createElement(XCircle, { size: 14 }), adv.status)), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-slate-600 bg-white p-2 rounded-xl border border-slate-100" }, adv.reason || "-")))))))), requestsSubTab === "supplies" && /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg md:text-xl font-black text-slate-800 mb-2 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(ShoppingCart, { className: "text-indigo-500" }), " \u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E43\u0E19\u0E23\u0E49\u0E32\u0E19"), /* @__PURE__ */ React2.createElement("p", { className: "text-sm text-slate-500 font-bold mb-6" }, "\u0E23\u0E30\u0E1A\u0E38\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E0A\u0E49\u0E43\u0E19\u0E07\u0E32\u0E19"), /* @__PURE__ */ React2.createElement("form", { onSubmit: handleSaveSupplies, className: "space-y-4" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49"), /* @__PURE__ */ React2.createElement("input", { required: true, type: "text", value: suppliesForm.itemName, onChange: (e) => setSuppliesForm({ ...suppliesForm, itemName: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700", placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E01\u0E23\u0E30\u0E14\u0E32\u0E29\u0E17\u0E34\u0E0A\u0E0A\u0E39\u0E48, \u0E19\u0E49\u0E33\u0E22\u0E32\u0E17\u0E33\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E30\u0E2D\u0E32\u0E14..." })), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23"), /* @__PURE__ */ React2.createElement("input", { required: true, type: "text", value: suppliesForm.quantity, onChange: (e) => setSuppliesForm({ ...suppliesForm, quantity: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700", placeholder: "\u0E40\u0E0A\u0E48\u0E19 2 \u0E41\u0E1E\u0E47\u0E04, 1 \u0E02\u0E27\u0E14" })), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25/\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 (\u0E16\u0E49\u0E32\u0E21\u0E35)"), /* @__PURE__ */ React2.createElement("textarea", { rows: "3", value: suppliesForm.reason, onChange: (e) => setSuppliesForm({ ...suppliesForm, reason: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700", placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E40\u0E1A\u0E34\u0E01..." })), /* @__PURE__ */ React2.createElement("button", { type: "submit", disabled: isSubmittingSupplies, className: "w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50" }, /* @__PURE__ */ React2.createElement(Send, { size: 18 }), " \u0E2A\u0E48\u0E07\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07"))), /* @__PURE__ */ React2.createElement("div", { className: "bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg font-black text-slate-800 mb-4 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(Clock, { className: "text-slate-500" }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49"), /* @__PURE__ */ React2.createElement("div", { className: "space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2" }, myRequisitions.length === 0 ? /* @__PURE__ */ React2.createElement("div", { className: "text-center text-slate-500 text-sm font-bold mt-10" }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49") : myRequisitions.map((req) => /* @__PURE__ */ React2.createElement("div", { key: req.id, className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm" }, /* @__PURE__ */ React2.createElement("div", { className: "flex justify-between items-start mb-2" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("div", { className: "font-bold text-slate-800" }, req.itemName), /* @__PURE__ */ React2.createElement("div", { className: "text-xs text-slate-500" }, new Date(req.createdAt).toLocaleDateString("th-TH"), " - \u0E08\u0E33\u0E19\u0E27\u0E19 ", req.quantity)), /* @__PURE__ */ React2.createElement("span", { className: `text-xs font-bold px-3 py-1 rounded-full ${req.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27" ? "bg-emerald-100 text-emerald-700" : req.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}` }, req.status)), req.reason && /* @__PURE__ */ React2.createElement("p", { className: "text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100" }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25: ", req.reason), req.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" && req.note && /* @__PURE__ */ React2.createElement("p", { className: "text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-100" }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38: ", req.note)))))), activeTab === "schedule_group" && /* @__PURE__ */ React2.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[80vh]" }, /* @__PURE__ */ React2.createElement("div", { className: "flex bg-slate-50 border-b border-slate-200" }, /* @__PURE__ */ React2.createElement("button", { onClick: () => setScheduleSubTab("schedule"), className: `flex-1 py-4 font-bold text-sm transition-colors ${scheduleSubTab === "schedule" ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:bg-slate-100"}` }, "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E07\u0E32\u0E19"), /* @__PURE__ */ React2.createElement("button", { onClick: () => setScheduleSubTab("history"), className: `flex-1 py-4 font-bold text-sm transition-colors ${scheduleSubTab === "history" ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:bg-slate-100"}` }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32")), /* @__PURE__ */ React2.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6" }, scheduleSubTab === "schedule" && /* @__PURE__ */ React2.createElement("div", { className: "space-y-4 flex flex-col h-full" }, /* @__PURE__ */ React2.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4" }, /* @__PURE__ */ React2.createElement("h3", { className: "text-lg md:text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React2.createElement(Calendar, { className: "text-indigo-500" }), " \u0E15\u0E32\u0E23\u0E32\u0E07\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19"), /* @__PURE__ */ React2.createElement(
    "input",
    {
      type: "month",
      value: scheduleMonth,
      onChange: (e) => setScheduleMonth(e.target.value),
      className: "bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto text-slate-600"
    }
  )), /* @__PURE__ */ React2.createElement("div", { className: "grid grid-cols-7 gap-1 md:gap-2" }, ["\u0E2D\u0E32.", "\u0E08.", "\u0E2D.", "\u0E1E.", "\u0E1E\u0E24.", "\u0E28.", "\u0E2A."].map((d) => /* @__PURE__ */ React2.createElement("div", { key: d, className: "text-center font-bold text-slate-500 text-xs md:text-sm py-2" }, d)), (() => {
    const year = parseInt(scheduleMonth.split("-")[0]);
    const month = parseInt(scheduleMonth.split("-")[1]) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => /* @__PURE__ */ React2.createElement("div", { key: `blank-${i}`, className: "p-1 md:p-2" }));
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isWeeklyOff = employee.weeklyDaysOff?.includes(dayOfWeek);
      const customLeave = myLeaves.find((l) => l.startDate <= dateStr && l.endDate >= dateStr);
      let bgColor = "bg-slate-50 border-slate-100";
      let textColor = "text-slate-700";
      let label = "";
      if (isWeeklyOff) {
        bgColor = "bg-red-50 border-red-100";
        textColor = "text-red-600";
        label = "\u0E2B\u0E22\u0E38\u0E14";
      } else if (customLeave) {
        if (customLeave.status === "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34") {
          bgColor = "bg-amber-50 border-amber-200 border-dashed";
          textColor = "text-amber-600";
          label = "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34";
        } else if (customLeave.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34") {
          bgColor = "bg-slate-50 border-slate-200";
          textColor = "text-slate-400";
          label = "\u0E17\u0E33\u0E07\u0E32\u0E19";
        } else {
          bgColor = "bg-orange-50 border-orange-100";
          textColor = "text-orange-600";
          label = customLeave.leaveType;
        }
      }
      const handleClick = async () => {
        if (customLeave) {
          if (window.confirm(`\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E04\u0E33\u0E02\u0E2D${customLeave.leaveType}\u0E43\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${new Date(customLeave.startDate).toLocaleDateString("th-TH")} \u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?`)) {
            try {
              await deleteDoc(doc2(db, "employee_leaves", customLeave.id));
              alert("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E25\u0E32\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27");
            } catch (err) {
              alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01: " + err.message);
            }
          }
          return;
        }
        let newSelection = [...calendarSelection || []];
        if (newSelection.includes(dateStr)) {
          newSelection = newSelection.filter((d) => d !== dateStr);
        } else {
          newSelection.push(dateStr);
          newSelection.sort();
        }
        setCalendarSelection(newSelection);
      };
      const isSelected = calendarSelection && calendarSelection.includes(dateStr);
      if (isSelected) {
        bgColor = "bg-indigo-500 border-indigo-600 shadow-md scale-105";
        textColor = "text-white";
        label = "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27";
      }
      return /* @__PURE__ */ React2.createElement("div", { key: day, onClick: handleClick, className: `p-1 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${bgColor} cursor-pointer hover:shadow-md` }, /* @__PURE__ */ React2.createElement("span", { className: `font-bold text-sm md:text-lg ${textColor}` }, day), label && /* @__PURE__ */ React2.createElement("span", { className: `text-[8px] md:text-[10px] font-bold px-1 py-0.5 rounded-md ${isSelected ? "bg-indigo-700/50 text-white" : "bg-white/50 " + textColor} truncate max-w-full` }, label));
    });
    return [...blanks, ...days];
  })()), calendarSelection && calendarSelection.length > 0 && /* @__PURE__ */ React2.createElement("div", { className: "mt-4 flex flex-col sm:flex-row items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2" }, /* @__PURE__ */ React2.createElement("div", { className: "text-indigo-800 font-bold mb-2 sm:mb-0" }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14: ", calendarSelection.length, " \u0E27\u0E31\u0E19"), /* @__PURE__ */ React2.createElement("div", { className: "flex gap-2 w-full sm:w-auto" }, /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: () => setCalendarSelection([]),
      className: "flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 transition-colors"
    },
    "\u0E25\u0E49\u0E32\u0E07"
  ), /* @__PURE__ */ React2.createElement(
    "button",
    {
      onClick: () => {
        setLeaveForm({ ...leaveForm, dates: [...calendarSelection] });
        setActiveTab("requests_group");
        setRequestsSubTab("leave");
      },
      className: "flex-1 sm:flex-none px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
    },
    "\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E25\u0E32 ",
    /* @__PURE__ */ React2.createElement(Send, { size: 18 })
  )))))))), /* @__PURE__ */ React2.createElement("div", { className: "md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[210] flex justify-around items-end pb-2 px-2 h-[75px] shadow-[0_-10px_20px_rgba(0,0,0,0.03)]" }, [
    { id: "service", icon: UserCheck, label: "\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D" },
    { id: "schedule_group", icon: Calendar, label: "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E07\u0E32\u0E19" },
    { id: "dashboard", icon: Clock, label: "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32" },
    { id: "requests_group", icon: Send, label: "\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07" },
    { id: "settings", icon: Lock, label: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32" }
  ].map((tab) => {
    const isMain = tab.id === "dashboard";
    const isActive = activeTab === tab.id;
    if (isMain) {
      return /* @__PURE__ */ React2.createElement(
        "button",
        {
          key: tab.id,
          onClick: () => setActiveTab(tab.id),
          className: "relative flex flex-col items-center justify-center w-[20%] h-full group"
        },
        /* @__PURE__ */ React2.createElement("div", { className: `absolute -top-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform duration-300 ${isActive ? "bg-indigo-600 scale-105 shadow-indigo-500/40" : "bg-indigo-500 scale-100"}` }, /* @__PURE__ */ React2.createElement(tab.icon, { size: 24, className: "text-white" })),
        /* @__PURE__ */ React2.createElement("span", { className: `text-[10px] font-black mt-8 ${isActive ? "text-indigo-600" : "text-slate-400"}` }, tab.label)
      );
    }
    return /* @__PURE__ */ React2.createElement(
      "button",
      {
        key: tab.id,
        onClick: () => setActiveTab(tab.id),
        className: `flex flex-col items-center justify-center w-[20%] h-[50px] space-y-1 ${isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`
      },
      /* @__PURE__ */ React2.createElement(tab.icon, { size: 20, className: isActive ? "stroke-[2.5px]" : "" }),
      /* @__PURE__ */ React2.createElement("span", { className: "text-[10px] font-bold" }, tab.label)
    );
  })), showPayslip && /* @__PURE__ */ React2.createElement(
    PayslipModal,
    {
      employee: payrollEmployee,
      payrollMonth,
      onClose: () => setShowPayslip(false)
    }
  ), activeTab === "settings" && /* @__PURE__ */ React2.createElement("div", { className: "fixed inset-0 z-[260] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 py-5 text-white relative" }, /* @__PURE__ */ React2.createElement("button", { onClick: () => setActiveTab("dashboard"), className: "absolute top-3 right-3 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors" }, /* @__PURE__ */ React2.createElement(X2, { size: 20 })), /* @__PURE__ */ React2.createElement("div", { className: "w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-2" }, /* @__PURE__ */ React2.createElement(Lock, { size: 28 })), /* @__PURE__ */ React2.createElement("h2", { className: "text-lg font-black" }, "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E2B\u0E31\u0E2A PIN"), /* @__PURE__ */ React2.createElement("p", { className: "text-xs text-white/80 mt-1" }, "PIN 4 \u0E2B\u0E25\u0E31\u0E01\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E02\u0E49\u0E32\u0E41\u0E14\u0E0A\u0E1A\u0E2D\u0E23\u0E4C\u0E14\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13")), /* @__PURE__ */ React2.createElement("form", { onSubmit: handleChangePin, className: "px-6 py-6 space-y-4" }, /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "PIN \u0E40\u0E14\u0E34\u0E21"), /* @__PURE__ */ React2.createElement(
    "input",
    {
      type: "password",
      inputMode: "numeric",
      pattern: "[0-9]*",
      maxLength: 4,
      value: pinForm.oldPin,
      onChange: (e) => setPinForm({ ...pinForm, oldPin: e.target.value.replace(/\D/g, "").slice(0, 4) }),
      className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-lg tracking-[0.3em] focus:border-indigo-500 outline-none",
      placeholder: "\u2022\u2022\u2022\u2022",
      autoFocus: true
    }
  )), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "PIN \u0E43\u0E2B\u0E21\u0E48 (4 \u0E2B\u0E25\u0E31\u0E01)"), /* @__PURE__ */ React2.createElement(
    "input",
    {
      type: "password",
      inputMode: "numeric",
      pattern: "[0-9]*",
      maxLength: 4,
      value: pinForm.newPin,
      onChange: (e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, "").slice(0, 4) }),
      className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-lg tracking-[0.3em] focus:border-indigo-500 outline-none",
      placeholder: "\u2022\u2022\u2022\u2022"
    }
  )), /* @__PURE__ */ React2.createElement("div", null, /* @__PURE__ */ React2.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19 PIN \u0E43\u0E2B\u0E21\u0E48"), /* @__PURE__ */ React2.createElement(
    "input",
    {
      type: "password",
      inputMode: "numeric",
      pattern: "[0-9]*",
      maxLength: 4,
      value: pinForm.confirmPin,
      onChange: (e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, "").slice(0, 4) }),
      className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-lg tracking-[0.3em] focus:border-indigo-500 outline-none",
      placeholder: "\u2022\u2022\u2022\u2022"
    }
  )), pinFormMessage.text && /* @__PURE__ */ React2.createElement("p", { className: `text-center text-sm font-bold ${pinFormMessage.type === "success" ? "text-emerald-600" : "text-rose-500"}` }, pinFormMessage.text), /* @__PURE__ */ React2.createElement("div", { className: "flex gap-3 pt-2" }, /* @__PURE__ */ React2.createElement("button", { type: "button", onClick: () => {
    setActiveTab("dashboard");
    setPinForm({ oldPin: "", newPin: "", confirmPin: "" });
    setPinFormMessage({ type: "", text: "" });
  }, className: "flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors" }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React2.createElement("button", { type: "submit", disabled: isSubmittingPin, className: "flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50" }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PIN \u0E43\u0E2B\u0E21\u0E48")), /* @__PURE__ */ React2.createElement("p", { className: "text-[11px] text-center text-slate-400 font-bold pt-1" }, "\u0E2B\u0E32\u0E01\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E15\u0E31\u0E49\u0E07 PIN \u0E23\u0E2B\u0E31\u0E2A\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E04\u0E37\u0E2D ", /* @__PURE__ */ React2.createElement("span", { className: "font-mono" }, "1234"))))));
}

// src/components/JobApplicationModal.jsx
import React3 from "react";
import { X as X3, User as User2, MapPin, Briefcase, Phone, Mail, GraduationCap, HeartPulse, ExternalLink, Calendar as Calendar2, CheckCircle as CheckCircle2 } from "lucide-react";
import { doc as doc3, updateDoc as updateDoc2, collection as collection2, addDoc as addDoc2 } from "firebase/firestore";
function JobApplicationModal({ application, onClose }) {
  if (!application) return null;
  const handleStatusChange = async (newStatus) => {
    try {
      await updateDoc2(doc3(db, "jobApplications", application.id), {
        status: newStatus
      });
      if (newStatus === "hired" && window.confirm("\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1C\u0E39\u0E49\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")) {
        const empData = {
          name: `${application.firstName} ${application.lastName}`.trim(),
          phone: application.phone || "",
          branch: application.preferredBranch || "\u0E40\u0E09\u0E27\u0E07",
          baseSalary: parseInt(application.expectedSalary) || 0,
          commissionRate: 0,
          weeklyDaysOff: [],
          profileImage: application.photoUrl || "",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          jobApplicationId: application.id
        };
        await addDoc2(collection2(db, "employees"), empData);
        alert("\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27 (\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E44\u0E1B\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19/\u0E04\u0E48\u0E32\u0E04\u0E2D\u0E21\u0E21\u0E34\u0E0A\u0E0A\u0E31\u0E48\u0E19 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19)");
      }
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30");
    }
  };
  return /* @__PURE__ */ React3.createElement("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans no-print" }, /* @__PURE__ */ React3.createElement("div", { className: "bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 print-section" }, /* @__PURE__ */ React3.createElement("div", { className: "bg-indigo-600 px-6 py-5 flex justify-between items-center text-white shrink-0" }, /* @__PURE__ */ React3.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React3.createElement(Briefcase, { size: 24, className: "text-indigo-200" }), /* @__PURE__ */ React3.createElement("div", null, /* @__PURE__ */ React3.createElement("h2", { className: "text-xl font-black" }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E07\u0E32\u0E19"), /* @__PURE__ */ React3.createElement("p", { className: "text-indigo-200 text-sm font-medium" }, application.position, " - \u0E2A\u0E32\u0E02\u0E32", application.preferredBranch))), /* @__PURE__ */ React3.createElement("button", { onClick: onClose, className: "p-2 hover:bg-white/20 rounded-full transition-colors no-print" }, /* @__PURE__ */ React3.createElement(X3, { size: 24 }))), /* @__PURE__ */ React3.createElement("div", { className: "bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center shrink-0 no-print" }, /* @__PURE__ */ React3.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-sm font-bold text-slate-600" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19:"), /* @__PURE__ */ React3.createElement(
    "select",
    {
      value: application.status || "new",
      onChange: (e) => handleStatusChange(e.target.value),
      className: `px-4 py-2 rounded-xl text-sm font-bold border-2 outline-none appearance-none cursor-pointer ${application.status === "new" ? "bg-blue-50 border-blue-200 text-blue-700" : application.status === "reviewed" ? "bg-amber-50 border-amber-200 text-amber-700" : application.status === "interviewed" ? "bg-purple-50 border-purple-200 text-purple-700" : application.status === "hired" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : application.status === "rejected" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-700"}`
    },
    /* @__PURE__ */ React3.createElement("option", { value: "new" }, "\u{1F31F} \u0E43\u0E1A\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E43\u0E2B\u0E21\u0E48"),
    /* @__PURE__ */ React3.createElement("option", { value: "reviewed" }, "\u{1F440} \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1E\u0E34\u0E08\u0E32\u0E23\u0E13\u0E32"),
    /* @__PURE__ */ React3.createElement("option", { value: "interviewed" }, "\u{1F5E3}\uFE0F \u0E19\u0E31\u0E14\u0E2A\u0E31\u0E21\u0E20\u0E32\u0E29\u0E13\u0E4C\u0E41\u0E25\u0E49\u0E27"),
    /* @__PURE__ */ React3.createElement("option", { value: "hired" }, "\u2705 \u0E23\u0E31\u0E1A\u0E40\u0E02\u0E49\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19"),
    /* @__PURE__ */ React3.createElement("option", { value: "rejected" }, "\u274C \u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E08\u0E32\u0E23\u0E13\u0E32")
  )), /* @__PURE__ */ React3.createElement("div", { className: "flex gap-2" }, application.photoUrl && /* @__PURE__ */ React3.createElement("a", { href: application.photoUrl, target: "_blank", rel: "noreferrer", className: "flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-colors text-sm border border-indigo-200 hover:border-indigo-600" }, /* @__PURE__ */ React3.createElement(ExternalLink, { size: 16 }), " \u0E14\u0E39\u0E23\u0E39\u0E1B\u0E16\u0E48\u0E32\u0E22"), application.resumeUrl && /* @__PURE__ */ React3.createElement("a", { href: application.resumeUrl, target: "_blank", rel: "noreferrer", className: "flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-colors text-sm border border-indigo-200 hover:border-indigo-600" }, /* @__PURE__ */ React3.createElement(ExternalLink, { size: 16 }), " \u0E14\u0E39 Resume"), application.certUrl && /* @__PURE__ */ React3.createElement("a", { href: application.certUrl, target: "_blank", rel: "noreferrer", className: "flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-colors text-sm border border-indigo-200 hover:border-indigo-600" }, /* @__PURE__ */ React3.createElement(ExternalLink, { size: 16 }), " \u0E14\u0E39\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07"))), /* @__PURE__ */ React3.createElement("div", { className: "p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6" }, /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, /* @__PURE__ */ React3.createElement("div", { className: "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" }, /* @__PURE__ */ React3.createElement("h3", { className: "font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2" }, /* @__PURE__ */ React3.createElement(User2, { className: "text-indigo-500", size: 20 }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27"), /* @__PURE__ */ React3.createElement("div", { className: "flex flex-col sm:flex-row gap-6" }, /* @__PURE__ */ React3.createElement("div", { className: "shrink-0 flex flex-col items-center sm:items-start mx-auto sm:mx-0" }, /* @__PURE__ */ React3.createElement("div", { className: "w-28 h-36 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 flex items-center justify-center shadow-sm" }, application.photoUrl ? /* @__PURE__ */ React3.createElement("img", { src: application.photoUrl, alt: "\u0E23\u0E39\u0E1B\u0E1C\u0E39\u0E49\u0E2A\u0E21\u0E31\u0E04\u0E23", className: "w-full h-full object-cover" }) : /* @__PURE__ */ React3.createElement(User2, { size: 48, className: "text-slate-300" })), !application.photoUrl && /* @__PURE__ */ React3.createElement("span", { className: "text-xs text-slate-400 font-bold mt-2" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B\u0E16\u0E48\u0E32\u0E22")), /* @__PURE__ */ React3.createElement("div", { className: "space-y-2 text-sm flex-1" }, /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.firstName, " ", application.lastName, " (", application.nickname || "-", ")")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E2D\u0E32\u0E22\u0E38:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.age || "-", " \u0E1B\u0E35 (\u0E40\u0E01\u0E34\u0E14 ", application.dobDay ? `${application.dobDay}/${application.dobMonth}/${application.dobYearBE}` : "-", ")")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01/\u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E39\u0E07:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.weight || "-", " \u0E01\u0E01. / ", application.height || "-", " \u0E0B\u0E21.")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E2A\u0E31\u0E0D\u0E0A\u0E32\u0E15\u0E34/\u0E28\u0E32\u0E2A\u0E19\u0E32:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.nationality || "-", " / ", application.religion || "-")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.idCardNumber || "-")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E2A\u0E16\u0E32\u0E19\u0E20\u0E32\u0E1E:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.maritalStatus || "-")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E42\u0E23\u0E04\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.healthCondition === "\u0E21\u0E35" ? /* @__PURE__ */ React3.createElement("span", { className: "text-rose-600" }, "\u0E21\u0E35: ", application.healthConditionDetail) : "\u0E44\u0E21\u0E48\u0E21\u0E35")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.currentAddress || "-"))))), /* @__PURE__ */ React3.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React3.createElement("div", { className: "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" }, /* @__PURE__ */ React3.createElement("h3", { className: "font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2" }, /* @__PURE__ */ React3.createElement(Phone, { className: "text-indigo-500", size: 20 }), " \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D"), /* @__PURE__ */ React3.createElement("div", { className: "space-y-2 text-sm" }, /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.phone || "-")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "Line ID:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.lineId || "-")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-rose-600" }, application.emergencyContactName, " (", application.emergencyContactRelation, ")", /* @__PURE__ */ React3.createElement("br", null), application.emergencyContactPhone)))), /* @__PURE__ */ React3.createElement("div", { className: "bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4" }, /* @__PURE__ */ React3.createElement("h3", { className: "font-black text-indigo-900 flex items-center gap-2 border-b border-indigo-200 pb-2" }, /* @__PURE__ */ React3.createElement(Briefcase, { className: "text-indigo-600", size: 20 }), " \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E21\u0E31\u0E04\u0E23"), /* @__PURE__ */ React3.createElement("div", { className: "space-y-2 text-sm" }, /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-indigo-700 font-bold" }, "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-black text-indigo-900" }, application.position)), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-indigo-700 font-bold" }, "\u0E2A\u0E32\u0E02\u0E32\u0E1B\u0E23\u0E30\u0E08\u0E33:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-bold text-indigo-900" }, application.preferredBranch)), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-indigo-700 font-bold" }, "\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-indigo-900" }, application.expectedSalary || "-")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-indigo-700 font-bold" }, "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E07\u0E32\u0E19\u0E44\u0E14\u0E49:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-indigo-900" }, application.startDateAvailability, " ", application.startDateDetail ? `(${application.startDateDetail})` : "")))))), /* @__PURE__ */ React3.createElement("div", { className: "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" }, /* @__PURE__ */ React3.createElement("h3", { className: "font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2" }, /* @__PURE__ */ React3.createElement(GraduationCap, { className: "text-indigo-500", size: 20 }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E2D\u0E1A\u0E23\u0E21"), /* @__PURE__ */ React3.createElement("div", { className: "space-y-2 text-sm" }, /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" }, /* @__PURE__ */ React3.createElement("div", null, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold block mb-1" }, "\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14"), /* @__PURE__ */ React3.createElement("p", { className: "font-medium text-slate-800" }, application.educationLevel || "-", " ", application.major ? `\u0E2A\u0E32\u0E02\u0E32 ${application.major}` : "", /* @__PURE__ */ React3.createElement("br", null), "\u0E2A\u0E16\u0E32\u0E1A\u0E31\u0E19: ", application.institution || "-", " (\u0E08\u0E1A\u0E1B\u0E35 ", application.graduationYear || "-", ")")), /* @__PURE__ */ React3.createElement("div", null, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold block mb-1" }, "\u0E2B\u0E25\u0E31\u0E01\u0E2A\u0E39\u0E15\u0E23\u0E2D\u0E1A\u0E23\u0E21\u0E23\u0E30\u0E22\u0E30\u0E2A\u0E31\u0E49\u0E19"), /* @__PURE__ */ React3.createElement("p", { className: "font-medium text-slate-800" }, application.shortCourses || "-"))))), /* @__PURE__ */ React3.createElement("div", { className: "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" }, /* @__PURE__ */ React3.createElement("h3", { className: "font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2" }, /* @__PURE__ */ React3.createElement(Briefcase, { className: "text-indigo-500", size: 20 }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19"), /* @__PURE__ */ React3.createElement("div", { className: "space-y-4" }, application.workExp1_company ? /* @__PURE__ */ React3.createElement("div", { className: "bg-slate-50 p-4 rounded-xl border border-slate-100" }, /* @__PURE__ */ React3.createElement("h4", { className: "font-bold text-slate-800 mb-2" }, "1. ", application.workExp1_company, " ", /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 text-xs font-normal" }, "(", application.workExp1_duration, ")")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm" }, /* @__PURE__ */ React3.createElement("p", null, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07:"), " ", application.workExp1_position), /* @__PURE__ */ React3.createElement("p", null, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19:"), " ", application.workExp1_salary), /* @__PURE__ */ React3.createElement("p", { className: "sm:col-span-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48:"), " ", application.workExp1_duties), /* @__PURE__ */ React3.createElement("p", { className: "sm:col-span-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38\u0E17\u0E35\u0E48\u0E25\u0E32\u0E2D\u0E2D\u0E01:"), " ", application.workExp1_reasonForLeaving))) : /* @__PURE__ */ React3.createElement("p", { className: "text-sm text-slate-500" }, "- \u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19 -"), application.workExp2_company && /* @__PURE__ */ React3.createElement("div", { className: "bg-slate-50 p-4 rounded-xl border border-slate-100" }, /* @__PURE__ */ React3.createElement("h4", { className: "font-bold text-slate-800 mb-2" }, "2. ", application.workExp2_company, " ", /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 text-xs font-normal" }, "(", application.workExp2_duration, ")")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm" }, /* @__PURE__ */ React3.createElement("p", null, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07:"), " ", application.workExp2_position), /* @__PURE__ */ React3.createElement("p", { className: "sm:col-span-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48:"), " ", application.workExp2_duties))))), /* @__PURE__ */ React3.createElement("div", { className: "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" }, /* @__PURE__ */ React3.createElement("h3", { className: "font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2" }, /* @__PURE__ */ React3.createElement(CheckCircle2, { className: "text-indigo-500", size: 20 }), " \u0E17\u0E31\u0E01\u0E29\u0E30\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16"), /* @__PURE__ */ React3.createElement("div", { className: "flex flex-wrap gap-2 text-sm" }, application.skills_facialMassage && /* @__PURE__ */ React3.createElement("span", { className: "px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold" }, "\u0E19\u0E27\u0E14\u0E2B\u0E19\u0E49\u0E32 / \u0E04\u0E25\u0E36\u0E07\u0E2B\u0E19\u0E49\u0E32"), application.skills_acneExtraction && /* @__PURE__ */ React3.createElement("span", { className: "px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold" }, "\u0E01\u0E14\u0E2A\u0E34\u0E27"), application.skills_treatmentMachine && /* @__PURE__ */ React3.createElement("span", { className: "px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold" }, "\u0E43\u0E0A\u0E49\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D\u0E17\u0E23\u0E35\u0E17\u0E40\u0E21\u0E49\u0E19\u0E17\u0E4C"), application.skills_bodyScrub && /* @__PURE__ */ React3.createElement("span", { className: "px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold" }, "\u0E17\u0E23\u0E35\u0E17\u0E40\u0E21\u0E49\u0E19\u0E17\u0E4C\u0E15\u0E31\u0E27 / \u0E2A\u0E04\u0E23\u0E31\u0E1A\u0E15\u0E31\u0E27"), application.skills_sales && /* @__PURE__ */ React3.createElement("span", { className: "px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold" }, "\u0E17\u0E31\u0E01\u0E29\u0E30\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22 (Sales)"), !application.skills_facialMassage && !application.skills_acneExtraction && !application.skills_treatmentMachine && !application.skills_bodyScrub && !application.skills_sales && /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500" }, "- \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E17\u0E31\u0E01\u0E29\u0E30\u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19 -")), application.skills_others && /* @__PURE__ */ React3.createElement("p", { className: "text-sm mt-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E17\u0E31\u0E01\u0E29\u0E30\u0E2D\u0E37\u0E48\u0E19\u0E46:"), " ", application.skills_others)), /* @__PURE__ */ React3.createElement("div", { className: "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" }, /* @__PURE__ */ React3.createElement("h3", { className: "font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2" }, /* @__PURE__ */ React3.createElement(CheckCircle2, { className: "text-indigo-500", size: 20 }), " \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21"), /* @__PURE__ */ React3.createElement("div", { className: "space-y-2 text-sm" }, /* @__PURE__ */ React3.createElement("p", null, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold block mb-1" }, "\u0E17\u0E35\u0E48\u0E1E\u0E31\u0E01\u0E1A\u0E19\u0E40\u0E01\u0E32\u0E30\u0E2A\u0E21\u0E38\u0E22:"), " ", application.accommodationOnSamui || "-"), /* @__PURE__ */ React3.createElement("p", null, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold block mb-1" }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E2D\u0E32\u0E0A\u0E0D\u0E32\u0E01\u0E23\u0E23\u0E21:"), " ", application.criminalRecord === "\u0E40\u0E04\u0E22" ? /* @__PURE__ */ React3.createElement("span", { className: "text-rose-600 font-bold" }, "\u0E40\u0E04\u0E22: ", application.criminalRecordDetail) : "\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22"))), /* @__PURE__ */ React3.createElement("div", { className: "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" }, /* @__PURE__ */ React3.createElement("h3", { className: "font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2" }, /* @__PURE__ */ React3.createElement(Phone, { className: "text-indigo-500", size: 20 }), " \u0E1A\u0E38\u0E04\u0E04\u0E25\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E44\u0E14\u0E49\u0E43\u0E19\u0E01\u0E23\u0E13\u0E35\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19"), /* @__PURE__ */ React3.createElement("div", { className: "space-y-2 text-sm" }, /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.emergencyContactName || "-")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.emergencyContactRelation || "-")), /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React3.createElement("span", { className: "text-slate-500 font-bold" }, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C:"), /* @__PURE__ */ React3.createElement("span", { className: "col-span-2 font-medium text-slate-800" }, application.emergencyContactPhone || "-")))), /* @__PURE__ */ React3.createElement("div", { className: "flex justify-end pt-4 no-print pb-6" }, /* @__PURE__ */ React3.createElement("button", { onClick: onClose, className: "px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm" }, "\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07")))));
}

// src/components/EmployeeDashboard.jsx
function EmployeeDashboard({ employees = [], attendance = [], histories = [], branches = [], leaves = [], advancePayments = [], dailySales = [], onGoToPOS, appSettings = {}, orders = [], serviceLogs = [], requisitions = [], jobApplications = [] }) {
  const [activeTab, setActiveTab] = useState2("attendance");
  const [branchFilter, setBranchFilter] = useState2("\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14");
  const [selectedApplication, setSelectedApplication] = useState2(null);
  const [isEditingEmployee, setIsEditingEmployee] = useState2(false);
  const [employeeForm, setEmployeeForm] = useState2({ id: null, name: "", phone: "", branch: "\u0E40\u0E09\u0E27\u0E07", baseSalary: "", commissionRate: "", weeklyDaysOff: [] });
  const [payrollMonth, setPayrollMonth] = useState2((/* @__PURE__ */ new Date()).toISOString().substring(0, 7));
  const [selectedPayslipEmployee, setSelectedPayslipEmployee] = useState2(null);
  const [isPrintingAction, setIsPrintingAction] = useState2(false);
  const [attendanceMonth, setAttendanceMonth] = useState2((/* @__PURE__ */ new Date()).toISOString().substring(0, 7));
  const [scheduleMonth, setScheduleMonth] = useState2((/* @__PURE__ */ new Date()).toISOString().substring(0, 7));
  const [editingAttendance, setEditingAttendance] = useState2(null);
  const [isAddingLeave, setIsAddingLeave] = useState2(false);
  const [leaveForm, setLeaveForm] = useState2({ id: null, employeeId: "", employeeName: "", leaveType: "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22", startDate: "", endDate: "", reason: "" });
  const [selectedEmployeeForPortal, setSelectedEmployeeForPortal] = useState2(null);
  const filteredEmployees = useMemo2(() => {
    return employees.filter((e) => branchFilter === "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14" || e.branch === branchFilter);
  }, [employees, branchFilter]);
  const allRequests = useMemo2(() => {
    const list = [];
    leaves.forEach((l) => list.push({ ...l, reqType: "leave", typeName: "\u0E02\u0E2D\u0E25\u0E32\u0E07\u0E32\u0E19", icon: "Calendar" }));
    advancePayments.forEach((a) => list.push({ ...a, reqType: "advance", typeName: "\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32", icon: "Wallet" }));
    (requisitions || []).forEach((r) => list.push({ ...r, reqType: "supplies", typeName: "\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49", icon: "ShoppingCart" }));
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leaves, advancePayments, requisitions]);
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: employeeForm.name.trim(),
        phone: employeeForm.phone.trim(),
        branch: employeeForm.branch,
        baseSalary: parseNumber(employeeForm.baseSalary),
        commissionRate: parseNumber(employeeForm.commissionRate),
        // Percentage
        weeklyDaysOff: employeeForm.weeklyDaysOff || [],
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (employeeForm.id) {
        await updateDoc3(doc4(db, "employees", employeeForm.id), data);
      } else {
        data.createdAt = (/* @__PURE__ */ new Date()).toISOString();
        await addDoc3(getCol("employees"), data);
      }
      setIsEditingEmployee(false);
      setEmployeeForm({ id: null, name: "", phone: "", branch: "\u0E40\u0E09\u0E27\u0E07", baseSalary: "", commissionRate: "" });
      alert("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
    } catch (err) {
      console.error(err);
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01: " + err.message);
    }
  };
  const handleDeleteEmployee = async (id, name5) => {
    if (window.confirm(`\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19 ${name5} \u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?`)) {
      try {
        await deleteDoc2(doc4(db, "employees", id));
      } catch (err) {
        alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
      }
    }
  };
  const getTodayAttendance = (empId) => {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return attendance.find((a) => a.employeeId === empId && a.date === today);
  };
  const handleClockIn = async (empId, empName) => {
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const time = (/* @__PURE__ */ new Date()).toISOString();
      await addDoc3(getCol("employee_attendance"), {
        employeeId: empId,
        employeeName: empName,
        date: today,
        clockIn: time,
        clockOut: null
      });
      alert(`\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19 ${empName} \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08`);
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const handleClockOut = async (attendanceId, attBranch, empBranch) => {
    const branchToCheck = attBranch || empBranch;
    if (branchToCheck !== "\u0E40\u0E09\u0E27\u0E07") {
      const todayStr = (/* @__PURE__ */ new Date()).toLocaleDateString("th-TH");
      const hasSubmittedEOD = dailySales.some((d) => d.date === todayStr && d.branch === branchToCheck);
      if (!hasSubmittedEOD) {
        alert(`\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E44\u0E14\u0E49 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E2A\u0E48\u0E07\u0E22\u0E2D\u0E14\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19 (EOD) \u0E02\u0E2D\u0E07\u0E2A\u0E32\u0E02\u0E32 ${branchToCheck} \u0E01\u0E48\u0E2D\u0E19\u0E04\u0E23\u0E31\u0E1A`);
        return;
      }
    }
    try {
      const time = (/* @__PURE__ */ new Date()).toISOString();
      await updateDoc3(doc4(db, "employee_attendance", attendanceId), { clockOut: time });
      alert("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const getAttendanceHistory = () => {
    return attendance.filter((a) => a.date && a.date.startsWith(attendanceMonth)).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  };
  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    if (!editingAttendance) return;
    try {
      await updateDoc3(doc4(db, "employee_attendance", editingAttendance.id), {
        clockIn: editingAttendance.clockIn,
        clockOut: editingAttendance.clockOut || null
      });
      alert("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      setEditingAttendance(null);
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const handleDeleteAttendance = async (id) => {
    if (window.confirm("\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")) {
      try {
        await deleteDoc2(doc4(db, "employee_attendance", id));
      } catch (err) {
        alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
      }
    }
  };
  const handleSaveLeave = async (e) => {
    e.preventDefault();
    try {
      const emp = employees.find((emp2) => emp2.id === leaveForm.employeeId);
      if (!emp) return alert("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19");
      const data = {
        employeeId: leaveForm.employeeId,
        employeeName: emp.name,
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
        status: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (leaveForm.id) {
        await updateDoc3(doc4(db, "employee_leaves", leaveForm.id), data);
      } else {
        data.createdAt = (/* @__PURE__ */ new Date()).toISOString();
        await addDoc3(getCol("employee_leaves"), data);
      }
      setIsAddingLeave(false);
      setLeaveForm({ id: null, employeeId: "", employeeName: "", leaveType: "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22", startDate: "", endDate: "", reason: "" });
      alert("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E25\u0E32\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const handleDeleteLeave = async (id) => {
    if (window.confirm("\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E25\u0E32\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")) {
      try {
        await deleteDoc2(doc4(db, "employee_leaves", id));
      } catch (err) {
        alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
      }
    }
  };
  const handleDeleteServiceLog = async (id) => {
    if (window.confirm("\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")) {
      try {
        await deleteDoc2(doc4(db, "service_logs", id));
      } catch (err) {
        alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
      }
    }
  };
  const handleDeleteJobApplication = async (id) => {
    if (window.confirm("\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E1A\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E19\u0E35\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")) {
      try {
        await deleteDoc2(doc4(db, "jobApplications", id));
      } catch (err) {
        alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
      }
    }
  };
  const handlePrintJobApplication = (app2) => {
    setSelectedApplication(app2);
    setTimeout(() => {
      window.print();
    }, 500);
  };
  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await updateDoc3(doc4(db, "employee_leaves", id), { status });
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const handleEditRequestDate = async (req) => {
    let currentIso = "";
    if (typeof req.createdAt === "string") currentIso = req.createdAt;
    else if (req.createdAt && req.createdAt.toDate) currentIso = req.createdAt.toDate().toISOString();
    else currentIso = (/* @__PURE__ */ new Date()).toISOString();
    const currentDateStr = currentIso.split("T")[0];
    const newDate = window.prompt("\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48 (YYYY-MM-DD):", currentDateStr);
    if (!newDate) return;
    if (newDate === currentDateStr) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      alert("\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E0A\u0E49 YYYY-MM-DD \u0E40\u0E0A\u0E48\u0E19 2026-08-01");
      return;
    }
    try {
      let colName = "";
      if (req.reqType === "leave") colName = "employee_leaves";
      else if (req.reqType === "advance") colName = "advance_payments";
      else if (req.reqType === "supplies") colName = "supplies_requisitions";
      if (colName) {
        const oldTime = currentIso.includes("T") ? currentIso.split("T")[1] : "12:00:00.000Z";
        const newIsoString = `${newDate}T${oldTime}`;
        await updateDoc3(doc4(db, colName, req.id), { createdAt: newIsoString });
        alert("\u0E41\u0E01\u0E49\u0E44\u0E02\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      }
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const handleUpdateRequisitionStatus = async (id, newStatus) => {
    try {
      await updateDoc3(doc4(db, "supplies_requisitions", id), { status: newStatus, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const handleUpdateAdvanceStatus = async (id, status) => {
    try {
      await updateDoc3(doc4(db, "advance_payments", id), { status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const handleToggleCustomLeave = async (emp, dateStr, existingLeave) => {
    try {
      if (existingLeave) {
        await deleteDoc2(doc4(db, "employee_leaves", existingLeave.id));
      } else {
        const data = {
          employeeId: emp.id,
          employeeName: emp.name,
          leaveType: "\u0E2B\u0E22\u0E38\u0E14\u0E1E\u0E34\u0E40\u0E28\u0E29",
          startDate: dateStr,
          endDate: dateStr,
          reason: "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E08\u0E32\u0E01\u0E15\u0E32\u0E23\u0E32\u0E07\u0E07\u0E32\u0E19\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19",
          status: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await addDoc3(getCol("employee_leaves"), data);
      }
    } catch (err) {
      alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
    }
  };
  const isInPayrollMonth = (item, monthPrefix) => {
    if (item.createdAt && item.createdAt.includes("T")) return item.createdAt.startsWith(monthPrefix);
    if (item.date && String(item.date).match(/^\d{4}-\d{2}-\d{2}/)) return String(item.date).startsWith(monthPrefix);
    const dStr = item.\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 || item.date;
    if (dStr && typeof dStr === "string" && dStr.includes("/")) {
      const parts = dStr.split("/");
      if (parts.length === 3) {
        let year = parseInt(parts[2], 10);
        if (year > 2500) year -= 543;
        return `${year}-${parts[1].padStart(2, "0")}` === monthPrefix;
      }
    }
    return false;
  };
  const getPayrollData = () => {
    const monthHistories = histories.filter((h) => isInPayrollMonth(h, payrollMonth));
    return filteredEmployees.map((emp) => {
      const empHistories = monthHistories.filter((h) => {
        const sName = String(getFuzzyKey(h, ["\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E08\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48", "\u0E0A\u0E37\u0E48\u0E2D\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19", "staffName", "\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23", "\u0E40\u0E08\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48"]) || "");
        return sName === emp.name;
      });
      let totalCommission = 0;
      empHistories.forEach((h) => {
        const price = parseNumber(getFuzzyKey(h, ["\u0E23\u0E32\u0E04\u0E32", "price", "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"]) || 0);
        totalCommission += price * ((emp.commissionRate || 0) / 100);
      });
      const empServiceLogs = (serviceLogs || []).filter((s) => s.employeeId === emp.id && isInPayrollMonth(s, payrollMonth));
      let totalServiceFees = 0;
      empServiceLogs.forEach((s) => {
        const isPOS = typeof s.note === "string" && s.note.startsWith("POS:");
        totalServiceFees += isPOS ? parseNumber(s.amount) * 0.1 : parseNumber(s.amount);
      });
      const empAdvances = (advancePayments || []).filter((a) => a.employeeId === emp.id && (a.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" || a.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27") && isInPayrollMonth(a, payrollMonth));
      let totalAdvances = 0;
      empAdvances.forEach((a) => totalAdvances += parseNumber(a.amount));
      const baseSalary = parseNumber(emp.baseSalary || 0);
      const totalIncome = baseSalary + totalCommission + totalServiceFees - totalAdvances;
      return {
        ...emp,
        totalCommission,
        totalServiceFees,
        totalAdvances,
        totalIncome,
        serviceCount: empHistories.length,
        serviceLogCount: empServiceLogs.length
      };
    });
  };
  const payrollData = getPayrollData();
  const attendanceHistoryData = getAttendanceHistory();
  return /* @__PURE__ */ React4.createElement("div", { className: "flex flex-col h-full bg-slate-50 relative" }, /* @__PURE__ */ React4.createElement("div", { className: "bg-white px-6 py-5 border-b border-slate-200 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center" }, /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("h1", { className: "text-2xl font-bold text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React4.createElement(Users, { className: "text-indigo-600" }), " \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("p", { className: "text-sm text-slate-500 mt-1" }, "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19 \u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 \u0E27\u0E31\u0E19\u0E25\u0E32 \u0E41\u0E25\u0E30\u0E04\u0E48\u0E32\u0E04\u0E2D\u0E21\u0E21\u0E34\u0E0A\u0E0A\u0E31\u0E48\u0E19")), /* @__PURE__ */ React4.createElement("div", { className: "flex gap-2 flex-wrap" }, /* @__PURE__ */ React4.createElement("button", { onClick: () => setActiveTab("attendance"), className: `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "attendance" ? "bg-indigo-100 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-100"}` }, /* @__PURE__ */ React4.createElement(Clock2, { size: 16 }), " \u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("button", { onClick: () => setActiveTab("history"), className: `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "history" ? "bg-indigo-100 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-100"}` }, /* @__PURE__ */ React4.createElement(History2, { size: 16 }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32"), /* @__PURE__ */ React4.createElement("button", { onClick: () => setActiveTab("requests"), className: `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "requests" ? "bg-indigo-100 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-100"}` }, /* @__PURE__ */ React4.createElement(FileText, { size: 16 }), " \u0E23\u0E27\u0E21\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07"), /* @__PURE__ */ React4.createElement("button", { onClick: () => setActiveTab("service_logs"), className: `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "service_logs" ? "bg-indigo-100 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-100"}` }, /* @__PURE__ */ React4.createElement(UserCheck2, { size: 16 }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D"), /* @__PURE__ */ React4.createElement("button", { onClick: () => setActiveTab("payroll"), className: `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "payroll" ? "bg-indigo-100 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-100"}` }, /* @__PURE__ */ React4.createElement(DollarSign2, { size: 16 }), " \u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19/\u0E23\u0E32\u0E22\u0E44\u0E14\u0E49"), /* @__PURE__ */ React4.createElement("button", { onClick: () => setActiveTab("schedule"), className: `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "schedule" ? "bg-indigo-100 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-100"}` }, /* @__PURE__ */ React4.createElement(Calendar3, { size: 16 }), " \u0E15\u0E32\u0E23\u0E32\u0E07\u0E07\u0E32\u0E19 (\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19)"), /* @__PURE__ */ React4.createElement("button", { onClick: () => setActiveTab("manage"), className: `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "manage" ? "bg-indigo-100 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-100"}` }, /* @__PURE__ */ React4.createElement(Users, { size: 16 }), " \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("button", { onClick: () => setActiveTab("applications"), className: `px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "applications" ? "bg-indigo-100 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-100"}` }, /* @__PURE__ */ React4.createElement(Briefcase2, { size: 16 }), " \u0E43\u0E1A\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E07\u0E32\u0E19"))), /* @__PURE__ */ React4.createElement("div", { className: "flex-1 overflow-auto p-6" }, (activeTab === "attendance" || activeTab === "payroll" || activeTab === "manage") && /* @__PURE__ */ React4.createElement("div", { className: "mb-6 flex gap-2" }, /* @__PURE__ */ React4.createElement(
    "select",
    {
      value: branchFilter,
      onChange: (e) => setBranchFilter(e.target.value),
      className: "bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-indigo-500"
    },
    /* @__PURE__ */ React4.createElement("option", { value: "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14" }, "\u0E17\u0E38\u0E01\u0E2A\u0E32\u0E02\u0E32"),
    branches.map((b) => /* @__PURE__ */ React4.createElement("option", { key: b.id, value: b.name }, b.name))
  )), activeTab === "attendance" && /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" }, filteredEmployees.map((emp) => {
    const todayAtt = getTodayAttendance(emp.id);
    const handleClick = () => {
      setSelectedEmployeeForPortal(emp);
    };
    return /* @__PURE__ */ React4.createElement(
      "div",
      {
        key: emp.id,
        onClick: handleClick,
        className: "bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center cursor-pointer hover:bg-slate-50 hover:shadow-md transition-all active:scale-[0.98]"
      },
      /* @__PURE__ */ React4.createElement("div", { className: "w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 overflow-hidden border border-slate-200" }, emp.profileImage ? /* @__PURE__ */ React4.createElement("img", { src: emp.profileImage, alt: "Profile", className: "w-full h-full object-cover" }) : /* @__PURE__ */ React4.createElement(Users, { size: 28, className: "text-slate-400" })),
      /* @__PURE__ */ React4.createElement("h3", { className: "text-lg font-black text-slate-800" }, emp.name),
      /* @__PURE__ */ React4.createElement("p", { className: "text-xs text-slate-500 mb-4" }, emp.branch),
      todayAtt ? /* @__PURE__ */ React4.createElement("div", { className: "w-full text-center space-y-2" }, /* @__PURE__ */ React4.createElement("div", { className: "bg-emerald-50 text-emerald-700 text-xs font-bold py-1.5 px-3 rounded-lg border border-emerald-100 flex flex-col gap-1" }, /* @__PURE__ */ React4.createElement("span", null, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19: ", new Date(todayAtt.clockIn).toLocaleTimeString("th-TH"))), todayAtt.clockOut ? /* @__PURE__ */ React4.createElement("div", { className: "bg-slate-100 text-slate-600 text-xs font-bold py-1.5 px-3 rounded-lg flex flex-col gap-1" }, /* @__PURE__ */ React4.createElement("span", null, "\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19: ", new Date(todayAtt.clockOut).toLocaleTimeString("th-TH"))) : /* @__PURE__ */ React4.createElement("button", { onClick: (e) => {
        e.stopPropagation();
        handleClockOut(todayAtt.id, todayAtt.branch, emp.branch);
      }, className: "w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95" }, /* @__PURE__ */ React4.createElement(UserMinus2, { size: 16 }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19")) : /* @__PURE__ */ React4.createElement("button", { onClick: (e) => {
        e.stopPropagation();
        handleClockIn(emp.id, emp.name);
      }, className: "w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95" }, /* @__PURE__ */ React4.createElement(UserCheck2, { size: 16 }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19")
    );
  }), filteredEmployees.length === 0 && /* @__PURE__ */ React4.createElement("div", { className: "col-span-full py-12 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19")), activeTab === "history" && /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" }, /* @__PURE__ */ React4.createElement("div", { className: "p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React4.createElement(History2, { className: "text-indigo-500" }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32"), /* @__PURE__ */ React4.createElement(
    "input",
    {
      type: "month",
      value: attendanceMonth,
      onChange: (e) => setAttendanceMonth(e.target.value),
      className: "bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold outline-none"
    }
  )), editingAttendance && /* @__PURE__ */ React4.createElement("div", { className: "p-6 bg-indigo-50 border-b border-indigo-100 flex flex-col gap-4" }, /* @__PURE__ */ React4.createElement("h3", { className: "font-bold text-indigo-800" }, "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E27\u0E25\u0E32\u0E02\u0E2D\u0E07 ", editingAttendance.employeeName, " (\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ", editingAttendance.date, ")"), /* @__PURE__ */ React4.createElement("form", { onSubmit: handleUpdateAttendance, className: "flex flex-wrap gap-4 items-end" }, /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("input", { type: "datetime-local", step: "1", required: true, value: editingAttendance.clockIn ? editingAttendance.clockIn.slice(0, 19) : "", onChange: (e) => setEditingAttendance({ ...editingAttendance, clockIn: new Date(e.target.value).toISOString() }), className: "bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm" })), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("input", { type: "datetime-local", step: "1", value: editingAttendance.clockOut ? editingAttendance.clockOut.slice(0, 19) : "", onChange: (e) => setEditingAttendance({ ...editingAttendance, clockOut: e.target.value ? new Date(e.target.value).toISOString() : null }), className: "bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm" })), /* @__PURE__ */ React4.createElement("button", { type: "submit", className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors" }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), /* @__PURE__ */ React4.createElement("button", { type: "button", onClick: () => setEditingAttendance(null), className: "px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors" }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"))), /* @__PURE__ */ React4.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React4.createElement("table", { className: "w-full text-left text-sm" }, /* @__PURE__ */ React4.createElement("thead", { className: "bg-slate-50 text-slate-500 font-bold" }, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-slate-100" }, attendanceHistoryData.map((att) => /* @__PURE__ */ React4.createElement("tr", { key: att.id, className: "hover:bg-slate-50" }, /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-700" }, att.date), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-800" }, att.employeeName), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-emerald-600 font-medium" }, att.clockIn ? new Date(att.clockIn).toLocaleTimeString("th-TH") : "-"), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-rose-600 font-medium" }, att.clockOut ? new Date(att.clockOut).toLocaleTimeString("th-TH") : "-"), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right" }, /* @__PURE__ */ React4.createElement("button", { onClick: () => setEditingAttendance(att), className: "p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2 transition-colors" }, /* @__PURE__ */ React4.createElement(Edit, { size: 16 })), /* @__PURE__ */ React4.createElement("button", { onClick: () => handleDeleteAttendance(att.id), className: "p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" }, /* @__PURE__ */ React4.createElement(Trash22, { size: 16 }))))), attendanceHistoryData.length === 0 && /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("td", { colSpan: 5, className: "px-6 py-8 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49")))))), activeTab === "leave" && /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6" }, /* @__PURE__ */ React4.createElement("div", { className: "xl:col-span-1" }, /* @__PURE__ */ React4.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 mb-6" }, isAddingLeave ? "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E01\u0E32\u0E23\u0E25\u0E32" : "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E25\u0E32"), /* @__PURE__ */ React4.createElement("form", { onSubmit: handleSaveLeave, className: "space-y-4" }, /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("select", { required: true, value: leaveForm.employeeId, onChange: (e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" }, /* @__PURE__ */ React4.createElement("option", { value: "", disabled: true }, "-- \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19 --"), employees.map((emp) => /* @__PURE__ */ React4.createElement("option", { key: emp.id, value: emp.id }, emp.name)))), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E25\u0E32"), /* @__PURE__ */ React4.createElement("select", { required: true, value: leaveForm.leaveType, onChange: (e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" }, /* @__PURE__ */ React4.createElement("option", { value: "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22" }, "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22"), /* @__PURE__ */ React4.createElement("option", { value: "\u0E25\u0E32\u0E01\u0E34\u0E08" }, "\u0E25\u0E32\u0E01\u0E34\u0E08"), /* @__PURE__ */ React4.createElement("option", { value: "\u0E25\u0E32\u0E1E\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19" }, "\u0E25\u0E32\u0E1E\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19"), /* @__PURE__ */ React4.createElement("option", { value: "\u0E2D\u0E37\u0E48\u0E19\u0E46" }, "\u0E2D\u0E37\u0E48\u0E19\u0E46"))), /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React4.createElement("input", { required: true, type: "date", value: leaveForm.startDate, onChange: (e) => setLeaveForm({ ...leaveForm, startDate: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:border-indigo-500 outline-none text-sm" })), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React4.createElement("input", { required: true, type: "date", value: leaveForm.endDate, onChange: (e) => setLeaveForm({ ...leaveForm, endDate: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:border-indigo-500 outline-none text-sm" }))), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25"), /* @__PURE__ */ React4.createElement("textarea", { rows: "2", value: leaveForm.reason, onChange: (e) => setLeaveForm({ ...leaveForm, reason: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" })), /* @__PURE__ */ React4.createElement("div", { className: "pt-4 flex gap-2" }, isAddingLeave && /* @__PURE__ */ React4.createElement("button", { type: "button", onClick: () => {
    setIsAddingLeave(false);
    setLeaveForm({ id: null, employeeId: "", employeeName: "", leaveType: "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22", startDate: "", endDate: "", reason: "" });
  }, className: "flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors" }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React4.createElement("button", { type: "submit", className: "flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2" }, /* @__PURE__ */ React4.createElement(Plus, { size: 18 }), " ", isAddingLeave ? "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02" : "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E25\u0E32"))))), /* @__PURE__ */ React4.createElement("div", { className: "xl:col-span-2" }, /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" }, /* @__PURE__ */ React4.createElement("table", { className: "w-full text-left text-sm" }, /* @__PURE__ */ React4.createElement("thead", { className: "bg-slate-50 text-slate-500 font-bold border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-slate-100" }, leaves.map((lv) => /* @__PURE__ */ React4.createElement("tr", { key: lv.id, className: "hover:bg-slate-50" }, /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-800" }, lv.employeeName, /* @__PURE__ */ React4.createElement("div", { className: "text-xs font-normal text-slate-500 mt-0.5 max-w-[150px] truncate" }, lv.reason || "-")), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-600 font-medium" }, /* @__PURE__ */ React4.createElement("span", { className: `px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${lv.leaveType === "\u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22" ? "bg-amber-100 text-amber-700" : lv.leaveType === "\u0E25\u0E32\u0E1E\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}` }, lv.leaveType)), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500 font-medium" }, new Date(lv.startDate).toLocaleDateString("th-TH"), " - ", new Date(lv.endDate).toLocaleDateString("th-TH")), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React4.createElement("span", { className: `px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${lv.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-emerald-100 text-emerald-700" : lv.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}` }, lv.status || "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34")), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right" }, (!lv.status || lv.status === "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34") && /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement("button", { onClick: () => handleUpdateLeaveStatus(lv.id, "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), className: "p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg mr-1 transition-colors", title: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" }, /* @__PURE__ */ React4.createElement(CheckCircle3, { size: 16 })), /* @__PURE__ */ React4.createElement("button", { onClick: () => handleUpdateLeaveStatus(lv.id, "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), className: "p-2 text-rose-500 hover:bg-rose-50 rounded-lg mr-2 transition-colors", title: "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" }, /* @__PURE__ */ React4.createElement(XCircle2, { size: 16 }))), /* @__PURE__ */ React4.createElement("button", { onClick: () => {
    setIsAddingLeave(true);
    setLeaveForm(lv);
  }, className: "p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2 transition-colors", title: "\u0E41\u0E01\u0E49\u0E44\u0E02" }, /* @__PURE__ */ React4.createElement(Edit, { size: 16 })), /* @__PURE__ */ React4.createElement("button", { onClick: () => handleDeleteLeave(lv.id), className: "p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors", title: "\u0E25\u0E1A" }, /* @__PURE__ */ React4.createElement(Trash22, { size: 16 }))))), leaves.length === 0 && /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("td", { colSpan: 4, className: "px-6 py-8 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E25\u0E32\u0E07\u0E32\u0E19"))))))), activeTab === "advance" && /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" }, /* @__PURE__ */ React4.createElement("div", { className: "p-6 border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React4.createElement(Wallet2, { className: "text-emerald-500" }), " \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32")), /* @__PURE__ */ React4.createElement("table", { className: "w-full text-left text-sm" }, /* @__PURE__ */ React4.createElement("thead", { className: "bg-slate-50 text-slate-500 font-bold border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E02\u0E2D"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-slate-100" }, [...advancePayments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((adv) => /* @__PURE__ */ React4.createElement("tr", { key: adv.id, className: "hover:bg-slate-50" }, /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500 font-bold" }, new Date(adv.createdAt).toLocaleDateString("th-TH")), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-800" }, adv.employeeName, /* @__PURE__ */ React4.createElement("div", { className: "text-xs font-normal text-slate-500 mt-0.5" }, adv.reason)), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-black text-emerald-600 text-lg" }, "\u0E3F", Number(adv.amount).toLocaleString()), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React4.createElement("span", { className: `px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${adv.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-emerald-100 text-emerald-700" : adv.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}` }, adv.status || "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34")), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right" }, (!adv.status || adv.status === "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34") && /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement("button", { onClick: () => handleUpdateAdvanceStatus(adv.id, "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), className: "p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg mr-1 transition-colors", title: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" }, /* @__PURE__ */ React4.createElement(CheckCircle3, { size: 18 })), /* @__PURE__ */ React4.createElement("button", { onClick: () => handleUpdateAdvanceStatus(adv.id, "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), className: "p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors", title: "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" }, /* @__PURE__ */ React4.createElement(XCircle2, { size: 18 })))))), advancePayments.length === 0 && /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("td", { colSpan: 5, className: "px-6 py-8 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32"))))), activeTab === "applications" && /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4" }, /* @__PURE__ */ React4.createElement("div", { className: "p-6 border-b border-slate-200 flex justify-between items-center" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React4.createElement(Briefcase2, { className: "text-blue-500" }), " \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("div", { className: "text-sm font-bold text-slate-500" }, /* @__PURE__ */ React4.createElement("span", { className: "text-blue-600 bg-blue-50 px-2 py-1 rounded-lg" }, "\u0E41\u0E0A\u0E23\u0E4C\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E23\u0E31\u0E1A\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E07\u0E32\u0E19: ", window.location.origin, "/?mode=job_application"))), /* @__PURE__ */ React4.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React4.createElement("table", { className: "w-full text-left text-sm" }, /* @__PURE__ */ React4.createElement("thead", { className: "bg-slate-50 text-slate-500 font-bold border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E21\u0E31\u0E04\u0E23"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E0A\u0E37\u0E48\u0E2D - \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-center" }, "Resume / \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E22\u0E48\u0E2D"))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-slate-100" }, [...jobApplications].sort((a, b) => new Date(b.createdAt || b.appliedAt?.toDate?.() || 0) - new Date(a.createdAt || a.appliedAt?.toDate?.() || 0)).map((app2) => /* @__PURE__ */ React4.createElement("tr", { key: app2.id, className: "hover:bg-slate-50 transition-colors" }, /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500 font-bold" }, app2.appliedAt ? app2.appliedAt.toDate ? app2.appliedAt.toDate().toLocaleDateString("th-TH") : new Date(app2.appliedAt).toLocaleDateString("th-TH") : "-"), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-800" }, app2.firstName, " ", app2.lastName, /* @__PURE__ */ React4.createElement("div", { className: "text-xs font-normal text-slate-500 mt-1" }, "\u0E2D\u0E32\u0E22\u0E38: ", app2.age || "-", " \u0E1B\u0E35 | \u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E04\u0E32\u0E14\u0E2B\u0E27\u0E31\u0E07: ", app2.expectedSalary || "-")), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-indigo-600" }, app2.position, app2.preferredBranch && /* @__PURE__ */ React4.createElement("div", { className: "text-xs font-normal text-slate-500 mt-1" }, "\u0E2A\u0E32\u0E02\u0E32: ", /* @__PURE__ */ React4.createElement("span", { className: "font-bold text-slate-700" }, app2.preferredBranch))), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React4.createElement("div", { className: "text-sm text-slate-700 font-medium" }, app2.phone), app2.email && /* @__PURE__ */ React4.createElement("div", { className: "text-xs text-slate-500" }, app2.email)), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React4.createElement("div", { className: "flex flex-col gap-2 items-center" }, /* @__PURE__ */ React4.createElement("button", { onClick: () => setSelectedApplication(app2), className: "w-full inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg font-bold transition-all text-xs border border-indigo-200 hover:border-indigo-600" }, /* @__PURE__ */ React4.createElement(User3, { size: 14 }), " \u0E14\u0E39\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), /* @__PURE__ */ React4.createElement("div", { className: "flex gap-2 w-full" }, /* @__PURE__ */ React4.createElement("button", { onClick: () => handlePrintJobApplication(app2), className: "flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white rounded-lg font-bold transition-all text-xs border border-slate-200 hover:border-slate-600" }, /* @__PURE__ */ React4.createElement(Printer2, { size: 14 }), " \u0E1E\u0E34\u0E21\u0E1E\u0E4C"), /* @__PURE__ */ React4.createElement("button", { onClick: () => handleDeleteJobApplication(app2.id), className: "flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg font-bold transition-all text-xs border border-rose-200 hover:border-rose-600" }, /* @__PURE__ */ React4.createElement(Trash22, { size: 14 }), " \u0E25\u0E1A")))))), jobApplications.length === 0 && /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("td", { colSpan: 5, className: "px-6 py-12 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E07\u0E32\u0E19")))))), activeTab === "supplies" && /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4" }, /* @__PURE__ */ React4.createElement("div", { className: "p-6 border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React4.createElement(ShoppingCart2, { className: "text-indigo-500" }), " \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49")), /* @__PURE__ */ React4.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React4.createElement("table", { className: "w-full text-left text-sm" }, /* @__PURE__ */ React4.createElement("thead", { className: "bg-slate-50 text-slate-500 font-bold border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E02\u0E2D"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E1A\u0E34\u0E01"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-slate-100" }, [...requisitions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((req) => /* @__PURE__ */ React4.createElement("tr", { key: req.id, className: "hover:bg-slate-50 transition-colors" }, /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500 font-bold" }, new Date(req.createdAt).toLocaleDateString("th-TH")), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-800" }, req.employeeName), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React4.createElement("div", { className: "font-bold text-slate-800" }, req.itemName, " ", /* @__PURE__ */ React4.createElement("span", { className: "text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs" }, req.quantity)), req.reason && /* @__PURE__ */ React4.createElement("div", { className: "text-xs font-normal text-slate-500 mt-1" }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25: ", req.reason)), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React4.createElement("span", { className: `px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${req.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27" ? "bg-emerald-100 text-emerald-700" : req.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}` }, req.status || "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), req.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" && req.note && /* @__PURE__ */ React4.createElement("div", { className: "text-[10px] text-rose-600 mt-1 max-w-[150px] truncate", title: req.note }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38: ", req.note)), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right" }, (!req.status || req.status === "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34") && /* @__PURE__ */ React4.createElement("div", { className: "flex justify-end gap-2" }, /* @__PURE__ */ React4.createElement("button", { onClick: () => handleUpdateRequisitionStatus(req.id, "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27"), className: "px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-emerald-200 hover:border-emerald-500 flex items-center gap-1" }, /* @__PURE__ */ React4.createElement(CheckCircle3, { size: 14 }), " \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), /* @__PURE__ */ React4.createElement("button", { onClick: () => handleUpdateRequisitionStatus(req.id, "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), className: "px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-rose-200 hover:border-rose-500 flex items-center gap-1" }, /* @__PURE__ */ React4.createElement(XCircle2, { size: 14 }), " \u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"))))), requisitions.length === 0 && /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("td", { colSpan: "5", className: "px-6 py-8 text-center text-slate-500 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E43\u0E0A\u0E49")))))), activeTab === "service_logs" && /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4" }, /* @__PURE__ */ React4.createElement("div", { className: "p-6 border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React4.createElement(UserCheck2, { className: "text-pink-500" }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D / \u0E04\u0E48\u0E32\u0E08\u0E35\u0E49\u0E44\u0E1D")), /* @__PURE__ */ React4.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React4.createElement("table", { className: "w-full text-left text-sm" }, /* @__PURE__ */ React4.createElement("thead", { className: "bg-slate-50 text-slate-500 font-bold border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-slate-100" }, [...serviceLogs || []].sort((a, b) => new Date(b.date) - new Date(a.date)).map((log) => /* @__PURE__ */ React4.createElement("tr", { key: log.id, className: "hover:bg-slate-50 transition-colors" }, /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500 font-bold" }, new Date(log.date).toLocaleDateString("th-TH")), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-800" }, log.employeeName), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-600 font-medium" }, /* @__PURE__ */ React4.createElement("span", { className: "bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs" }, log.type)), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-black text-pink-600 text-lg" }, "\u0E3F", Number(log.amount).toLocaleString()), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500" }, log.note || "-"), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right" }, /* @__PURE__ */ React4.createElement("button", { onClick: () => handleDeleteServiceLog(log.id), className: "p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors", title: "\u0E25\u0E1A" }, /* @__PURE__ */ React4.createElement(Trash22, { size: 16 }))))), (!serviceLogs || serviceLogs.length === 0) && /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("td", { colSpan: "6", className: "px-6 py-8 text-center text-slate-500 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E48\u0E32\u0E21\u0E37\u0E2D")))))), activeTab === "requests" && /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4" }, /* @__PURE__ */ React4.createElement("div", { className: "p-6 border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React4.createElement(FileText, { className: "text-indigo-500" }), " \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")), /* @__PURE__ */ React4.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React4.createElement("table", { className: "w-full text-left text-sm" }, /* @__PURE__ */ React4.createElement("thead", { className: "bg-slate-50 text-slate-500 font-bold border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17/\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-slate-100" }, allRequests.map((req) => /* @__PURE__ */ React4.createElement("tr", { key: req.id, className: "hover:bg-slate-50 transition-colors" }, /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500 font-bold" }, /* @__PURE__ */ React4.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React4.createElement("span", null, new Date(req.createdAt).toLocaleDateString("th-TH")), /* @__PURE__ */ React4.createElement(
    "button",
    {
      onClick: () => handleEditRequestDate(req),
      className: "p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors",
      title: "\u0E41\u0E01\u0E49\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07"
    },
    /* @__PURE__ */ React4.createElement(Edit, { size: 14 })
  ))), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-800" }, req.employeeName), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React4.createElement("div", { className: "font-bold flex items-center gap-2" }, /* @__PURE__ */ React4.createElement("span", { className: `px-2 py-0.5 rounded text-xs ${req.reqType === "leave" ? "bg-orange-100 text-orange-700" : req.reqType === "advance" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}` }, req.typeName)), /* @__PURE__ */ React4.createElement("div", { className: "text-slate-700 font-medium mt-2" }, req.reqType === "leave" && /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement("span", null, req.leaveType), /* @__PURE__ */ React4.createElement("span", { className: "mx-2 text-slate-300" }, "|"), /* @__PURE__ */ React4.createElement("span", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ", new Date(req.startDate).toLocaleDateString("th-TH"), " ", req.startDate !== req.endDate ? ` - ${new Date(req.endDate).toLocaleDateString("th-TH")}` : "")), req.reqType === "advance" && /* @__PURE__ */ React4.createElement("span", { className: "font-black text-emerald-600" }, "\u0E3F", Number(req.amount).toLocaleString()), req.reqType === "supplies" && /* @__PURE__ */ React4.createElement(React4.Fragment, null, /* @__PURE__ */ React4.createElement("span", null, req.itemName), /* @__PURE__ */ React4.createElement("span", { className: "ml-2 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-xs" }, req.quantity))), req.reason && /* @__PURE__ */ React4.createElement("div", { className: "text-xs font-normal text-slate-500 mt-1" }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25: ", req.reason)), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React4.createElement("span", { className: `px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${req.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" || req.status === "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27" ? "bg-emerald-100 text-emerald-700" : req.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}` }, req.status || "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), req.status === "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34" && req.note && /* @__PURE__ */ React4.createElement("div", { className: "text-[10px] text-rose-600 mt-1 max-w-[150px] truncate", title: req.note }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38: ", req.note)), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right" }, (!req.status || req.status === "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34") && /* @__PURE__ */ React4.createElement("div", { className: "flex justify-end gap-2" }, /* @__PURE__ */ React4.createElement(
    "button",
    {
      onClick: () => {
        if (req.reqType === "leave") handleUpdateLeaveStatus(req.id, "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34");
        else if (req.reqType === "advance") handleUpdateAdvanceStatus(req.id, "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34");
        else if (req.reqType === "supplies") handleUpdateRequisitionStatus(req.id, "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27");
      },
      className: "px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-emerald-200 hover:border-emerald-500 flex items-center gap-1"
    },
    /* @__PURE__ */ React4.createElement(CheckCircle3, { size: 14 }),
    " \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"
  ), /* @__PURE__ */ React4.createElement(
    "button",
    {
      onClick: () => {
        if (req.reqType === "leave") handleUpdateLeaveStatus(req.id, "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34");
        else if (req.reqType === "advance") handleUpdateAdvanceStatus(req.id, "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34");
        else if (req.reqType === "supplies") handleUpdateRequisitionStatus(req.id, "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34");
      },
      className: "px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-rose-200 hover:border-rose-500 flex items-center gap-1"
    },
    /* @__PURE__ */ React4.createElement(XCircle2, { size: 14 }),
    " \u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"
  ))))), allRequests.length === 0 && /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("td", { colSpan: "5", className: "px-6 py-8 text-center text-slate-500 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07")))))), activeTab === "payroll" && /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" }, /* @__PURE__ */ React4.createElement("div", { className: "p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React4.createElement(DollarSign2, { className: "text-emerald-500" }), " \u0E2A\u0E23\u0E38\u0E1B\u0E23\u0E32\u0E22\u0E44\u0E14\u0E49\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement(
    "input",
    {
      type: "month",
      value: payrollMonth,
      onChange: (e) => setPayrollMonth(e.target.value),
      className: "bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold outline-none"
    }
  )), /* @__PURE__ */ React4.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React4.createElement("table", { className: "w-full text-left text-sm" }, /* @__PURE__ */ React4.createElement("thead", { className: "bg-slate-50 text-slate-500 font-bold" }, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E2A\u0E32\u0E02\u0E32"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E04\u0E48\u0E32\u0E04\u0E2D\u0E21\u0E21\u0E34\u0E0A\u0E0A\u0E31\u0E48\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 (\u0E04\u0E23\u0E31\u0E49\u0E07)"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E23\u0E32\u0E22\u0E44\u0E14\u0E49\u0E23\u0E27\u0E21\u0E2A\u0E38\u0E17\u0E18\u0E34"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-center" }, "\u0E2A\u0E25\u0E34\u0E1B"))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-slate-100" }, payrollData.map((emp) => /* @__PURE__ */ React4.createElement("tr", { key: emp.id, className: "hover:bg-slate-50" }, /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-800" }, emp.name), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500" }, emp.branch), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right font-medium" }, "\u0E3F", (emp.baseSalary || 0).toLocaleString()), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right font-medium text-indigo-600" }, "\u0E3F", emp.totalCommission.toLocaleString()), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right text-slate-500" }, emp.serviceCount), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right font-black text-emerald-600 text-base" }, "\u0E3F", emp.totalIncome.toLocaleString()), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-center" }, /* @__PURE__ */ React4.createElement(
    "button",
    {
      onClick: () => setSelectedPayslipEmployee(emp),
      className: "p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center justify-center",
      title: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2A\u0E25\u0E34\u0E1B\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19"
    },
    /* @__PURE__ */ React4.createElement(Printer2, { size: 18 })
  )))), payrollData.length === 0 && /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("td", { colSpan: 7, className: "px-6 py-8 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"))))), selectedPayslipEmployee && /* @__PURE__ */ React4.createElement(
    PayslipModal,
    {
      employee: selectedPayslipEmployee,
      payrollMonth,
      onClose: () => setSelectedPayslipEmployee(null)
    }
  )), activeTab === "manage" && /* @__PURE__ */ React4.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6" }, /* @__PURE__ */ React4.createElement("div", { className: "xl:col-span-1" }, /* @__PURE__ */ React4.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 mb-6" }, isEditingEmployee ? "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19" : "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48"), /* @__PURE__ */ React4.createElement("form", { onSubmit: handleSaveEmployee, className: "space-y-4" }, /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25"), /* @__PURE__ */ React4.createElement("input", { required: true, type: "text", value: employeeForm.name, onChange: (e) => setEmployeeForm({ ...employeeForm, name: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" })), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C (\u0E17\u0E32\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01)"), /* @__PURE__ */ React4.createElement("input", { type: "text", value: employeeForm.phone, onChange: (e) => setEmployeeForm({ ...employeeForm, phone: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" })), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E2A\u0E32\u0E02\u0E32\u0E1B\u0E23\u0E30\u0E08\u0E33"), /* @__PURE__ */ React4.createElement("select", { value: employeeForm.branch, onChange: (e) => setEmployeeForm({ ...employeeForm, branch: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" }, /* @__PURE__ */ React4.createElement("option", { value: "\u0E40\u0E09\u0E27\u0E07" }, "\u0E40\u0E09\u0E27\u0E07"), branches.map((b) => /* @__PURE__ */ React4.createElement("option", { key: b.id, value: b.name }, b.name)))), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 (\u0E1A\u0E32\u0E17/\u0E40\u0E14\u0E37\u0E2D\u0E19)"), /* @__PURE__ */ React4.createElement("input", { type: "number", value: employeeForm.baseSalary, onChange: (e) => setEmployeeForm({ ...employeeForm, baseSalary: e.target.value }), className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" })), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-1" }, "\u0E40\u0E1B\u0E2D\u0E23\u0E4C\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C\u0E04\u0E48\u0E32\u0E04\u0E2D\u0E21\u0E21\u0E34\u0E0A\u0E0A\u0E31\u0E48\u0E19 (%)"), /* @__PURE__ */ React4.createElement("input", { type: "number", value: employeeForm.commissionRate, onChange: (e) => setEmployeeForm({ ...employeeForm, commissionRate: e.target.value }), placeholder: "\u0E40\u0E0A\u0E48\u0E19 5 \u0E2B\u0E23\u0E37\u0E2D 10", className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" })), /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement("label", { className: "block text-xs font-bold text-slate-500 mb-2" }, "\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C"), /* @__PURE__ */ React4.createElement("div", { className: "flex flex-wrap gap-2" }, ["\u0E2D\u0E32.", "\u0E08.", "\u0E2D.", "\u0E1E.", "\u0E1E\u0E24.", "\u0E28.", "\u0E2A."].map((day, idx) => {
    const isSelected = employeeForm.weeklyDaysOff?.includes(idx);
    return /* @__PURE__ */ React4.createElement(
      "button",
      {
        key: idx,
        type: "button",
        onClick: () => {
          let arr = employeeForm.weeklyDaysOff || [];
          if (isSelected) arr = arr.filter((d) => d !== idx);
          else arr = [...arr, idx];
          setEmployeeForm({ ...employeeForm, weeklyDaysOff: arr });
        },
        className: `w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-colors ${isSelected ? "bg-indigo-600 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`
      },
      day
    );
  }))), /* @__PURE__ */ React4.createElement("div", { className: "pt-4 flex gap-2" }, isEditingEmployee && /* @__PURE__ */ React4.createElement("button", { type: "button", onClick: () => {
    setIsEditingEmployee(false);
    setEmployeeForm({ id: null, name: "", phone: "", branch: "\u0E40\u0E09\u0E27\u0E07", baseSalary: "", commissionRate: "", weeklyDaysOff: [] });
  }, className: "flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors" }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React4.createElement("button", { type: "submit", className: "flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2" }, /* @__PURE__ */ React4.createElement(Plus, { size: 18 }), " ", isEditingEmployee ? "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02" : "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"))))), /* @__PURE__ */ React4.createElement("div", { className: "xl:col-span-2" }, /* @__PURE__ */ React4.createElement("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" }, /* @__PURE__ */ React4.createElement("table", { className: "w-full text-left text-sm" }, /* @__PURE__ */ React4.createElement("thead", { className: "bg-slate-50 text-slate-500 font-bold border-b border-slate-200" }, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E2A\u0E32\u0E02\u0E32"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4" }, "\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 / \u0E04\u0E2D\u0E21\u0E21\u0E34\u0E0A\u0E0A\u0E31\u0E48\u0E19"), /* @__PURE__ */ React4.createElement("th", { className: "px-6 py-4 text-right" }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-slate-100" }, filteredEmployees.map((emp) => /* @__PURE__ */ React4.createElement("tr", { key: emp.id, className: "hover:bg-slate-50" }, /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 font-bold text-slate-800 flex items-center gap-3" }, /* @__PURE__ */ React4.createElement("div", { className: "w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0" }, emp.profileImage ? /* @__PURE__ */ React4.createElement("img", { src: emp.profileImage, alt: emp.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ React4.createElement(User3, { size: 20, className: "text-slate-400" })), emp.name), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500" }, emp.branch), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-slate-500" }, "\u0E3F", (emp.baseSalary || 0).toLocaleString(), " / ", emp.commissionRate || 0, "%"), /* @__PURE__ */ React4.createElement("td", { className: "px-6 py-4 text-right" }, /* @__PURE__ */ React4.createElement(
    "button",
    {
      onClick: () => {
        setIsEditingEmployee(true);
        setEmployeeForm(emp);
      },
      className: "p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
    },
    /* @__PURE__ */ React4.createElement(Edit, { size: 16 })
  ), /* @__PURE__ */ React4.createElement(
    "button",
    {
      onClick: () => handleDeleteEmployee(emp.id, emp.name),
      className: "p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
    },
    /* @__PURE__ */ React4.createElement(Trash22, { size: 16 })
  )))), filteredEmployees.length === 0 && /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("td", { colSpan: 4, className: "px-6 py-8 text-center text-slate-400 font-bold" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"))))))), activeTab === "schedule" && /* @__PURE__ */ React4.createElement("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" }, /* @__PURE__ */ React4.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 no-print" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-xl font-black text-slate-800 flex items-center gap-2" }, /* @__PURE__ */ React4.createElement(Calendar3, { className: "text-indigo-600" }), " \u0E15\u0E32\u0E23\u0E32\u0E07\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19"), /* @__PURE__ */ React4.createElement("div", { className: "flex gap-2 items-center" }, /* @__PURE__ */ React4.createElement(
    "button",
    {
      disabled: isPrintingAction,
      onClick: async () => {
        setIsPrintingAction(true);
        try {
          const el = document.getElementById("schedule-table-container");
          if (el) {
            const dataUrl = await (0, import_html_to_image.toPng)(el, {
              backgroundColor: "#ffffff",
              pixelRatio: 2,
              width: el.scrollWidth,
              style: { overflow: "visible", width: el.scrollWidth + "px" }
            });
            const printWindow = window.open("", "_blank");
            if (printWindow) {
              printWindow.document.write(`
                                     <html>
                                       <head>
                                         <title>\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E15\u0E32\u0E23\u0E32\u0E07\u0E07\u0E32\u0E19</title>
                                         <style>
                                           @page { size: A4 landscape; margin: 10mm; }
                                           body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: flex-start; background-color: #fff; }
                                           img { max-width: 100%; max-height: 90vh; object-fit: contain; }
                                         </style>
                                       </head>
                                       <body>
                                         <img src="${dataUrl}" onload="setTimeout(function(){ window.print(); window.close(); }, 500);" />
                                       </body>
                                     </html>
                                   `);
              printWindow.document.close();
            } else {
              alert("\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E1A\u0E25\u0E47\u0E2D\u0E04\u0E1B\u0E4A\u0E2D\u0E1B\u0E2D\u0E31\u0E1B \u0E01\u0E23\u0E38\u0E13\u0E32\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E4A\u0E2D\u0E1B\u0E2D\u0E31\u0E1B\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E27\u0E47\u0E1A\u0E19\u0E35\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1E\u0E34\u0E21\u0E1E\u0E4C");
            }
          }
        } catch (err) {
          console.error(err);
          alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
        } finally {
          setIsPrintingAction(false);
        }
      },
      className: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
    },
    /* @__PURE__ */ React4.createElement(Printer2, { size: 18 }),
    " \u0E1E\u0E34\u0E21\u0E1E\u0E4C (A4)"
  ), /* @__PURE__ */ React4.createElement(
    "button",
    {
      disabled: isPrintingAction,
      onClick: async () => {
        setIsPrintingAction(true);
        try {
          const el = document.getElementById("schedule-table-container");
          if (el) {
            const dataUrl = await (0, import_html_to_image.toPng)(el, {
              backgroundColor: "#ffffff",
              pixelRatio: 2,
              width: el.scrollWidth,
              style: { overflow: "visible", width: el.scrollWidth + "px" }
            });
            const link = document.createElement("a");
            link.download = `schedule_${scheduleMonth}.png`;
            link.href = dataUrl;
            link.click();
          }
        } catch (err) {
          console.error(err);
          alert("\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: " + err.message);
        } finally {
          setIsPrintingAction(false);
        }
      },
      className: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
    },
    /* @__PURE__ */ React4.createElement(FileText, { size: 18 }),
    " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E39\u0E1B (A4)"
  ), /* @__PURE__ */ React4.createElement(
    "input",
    {
      type: "month",
      value: scheduleMonth,
      onChange: (e) => setScheduleMonth(e.target.value),
      className: "bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }
  ))), (() => {
    const year = parseInt(scheduleMonth.split("-")[0]);
    const month = parseInt(scheduleMonth.split("-")[1]) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return /* @__PURE__ */ React4.createElement("div", { id: "schedule-table-container", className: "overflow-x-auto pb-4 bg-white p-4 rounded-xl" }, /* @__PURE__ */ React4.createElement("div", { className: "mb-4 text-center" }, /* @__PURE__ */ React4.createElement("h2", { className: "text-2xl font-black text-slate-800" }, "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19 ", scheduleMonth)), /* @__PURE__ */ React4.createElement("table", { className: "w-full text-center border-collapse min-w-max border-2 border-black" }, /* @__PURE__ */ React4.createElement("thead", null, /* @__PURE__ */ React4.createElement("tr", null, /* @__PURE__ */ React4.createElement("th", { className: "sticky left-0 bg-slate-100 z-10 px-4 py-3 text-left font-bold text-slate-700 border-b-2 border-r-2 border-black min-w-[200px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]" }, "\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), daysArray.map((day) => {
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      return /* @__PURE__ */ React4.createElement("th", { key: day, className: `px-2 py-3 text-xs border border-black ${isWeekend ? "bg-rose-100 text-rose-700" : "bg-slate-50 text-slate-700"} font-bold min-w-[40px]` }, /* @__PURE__ */ React4.createElement("div", null, ["\u0E2D\u0E32.", "\u0E08.", "\u0E2D.", "\u0E1E.", "\u0E1E\u0E24.", "\u0E28.", "\u0E2A."][dayOfWeek]), /* @__PURE__ */ React4.createElement("div", { className: "text-base" }, day));
    }))), /* @__PURE__ */ React4.createElement("tbody", { className: "divide-y divide-black" }, filteredEmployees.map((emp) => /* @__PURE__ */ React4.createElement("tr", { key: emp.id, className: "hover:bg-slate-100 transition-colors" }, /* @__PURE__ */ React4.createElement("td", { className: "sticky left-0 bg-slate-50 z-10 px-4 py-3 text-left font-bold text-slate-800 border-r-2 border-black shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]" }, emp.name, " ", /* @__PURE__ */ React4.createElement("span", { className: "block text-xs text-slate-400 font-normal" }, emp.branch)), daysArray.map((day) => {
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      const isWeeklyOff = emp.weeklyDaysOff?.includes(dayOfWeek);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const customLeave = leaves.find((l) => l.employeeId === emp.id && l.startDate <= dateStr && l.endDate >= dateStr);
      const isOff = isWeeklyOff || !!customLeave;
      return /* @__PURE__ */ React4.createElement("td", { key: day, className: `px-1 py-3 text-xs font-bold border border-black ${isOff ? "bg-red-50/50" : "bg-white"}` }, isWeeklyOff ? /* @__PURE__ */ React4.createElement("div", { className: "mx-auto w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center", title: "\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C" }, "\u0E2B\u0E22\u0E38\u0E14") : customLeave ? /* @__PURE__ */ React4.createElement("div", { onClick: () => handleToggleCustomLeave(emp, dateStr, customLeave), className: "mx-auto w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center cursor-pointer hover:bg-orange-200", title: `\u0E27\u0E31\u0E19\u0E25\u0E32: ${customLeave.leaveType}` }, "\u0E25\u0E32") : /* @__PURE__ */ React4.createElement("div", { onClick: () => handleToggleCustomLeave(emp, dateStr, null), className: "mx-auto w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 cursor-pointer transition-colors", title: "\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E15\u0E31\u0E49\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14" }, /* @__PURE__ */ React4.createElement(CheckCircle3, { size: 16, strokeWidth: 3 })));
    }))))), /* @__PURE__ */ React4.createElement("div", { className: "mt-6 flex flex-wrap items-center gap-6 justify-center text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200" }, /* @__PURE__ */ React4.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React4.createElement("div", { className: "w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-sm" }, /* @__PURE__ */ React4.createElement(CheckCircle3, { size: 18, strokeWidth: 3 })), /* @__PURE__ */ React4.createElement("span", null, "\u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19\u0E1B\u0E01\u0E15\u0E34")), /* @__PURE__ */ React4.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React4.createElement("div", { className: "w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center border border-red-200 shadow-sm" }, "\u0E2B\u0E22\u0E38\u0E14"), /* @__PURE__ */ React4.createElement("span", null, "\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C")), /* @__PURE__ */ React4.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React4.createElement("div", { className: "w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200 shadow-sm" }, "\u0E25\u0E32"), /* @__PURE__ */ React4.createElement("span", null, "\u0E27\u0E31\u0E19\u0E25\u0E32 (\u0E40\u0E0A\u0E48\u0E19 \u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22/\u0E25\u0E32\u0E01\u0E34\u0E08)"))));
  })())), selectedEmployeeForPortal && /* @__PURE__ */ React4.createElement(
    EmployeePortal,
    {
      employee: selectedEmployeeForPortal,
      attendance,
      leaves,
      advancePayments,
      histories,
      branches,
      dailySales,
      appSettings,
      orders,
      serviceLogs,
      onClose: () => setSelectedEmployeeForPortal(null),
      onClockIn: (emp) => handleClockIn(emp.id, emp.name),
      onClockOut: (att) => handleClockOut(att.id, att.branch, selectedEmployeeForPortal.branch),
      onGoToPOS,
      isAdmin: true,
      onDeleteServiceLog: handleDeleteServiceLog
    }
  ), selectedApplication && /* @__PURE__ */ React4.createElement(JobApplicationModal, { application: selectedApplication, onClose: () => setSelectedApplication(null) }));
}

// test-render.jsx
try {
  const html = renderToString(React5.createElement(EmployeeDashboard, {
    employees: [{ id: "1", name: "Test", branch: "\u0E40\u0E09\u0E27\u0E07" }]
  }));
  console.log("SUCCESS");
} catch (e) {
  console.error("ERROR", e);
}
/*! Bundled license information:

@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/logger/dist/esm/index.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/util/dist/node-esm/index.node.esm.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/node-esm/index.node.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/node-esm/index.node.esm.js:
@firebase/component/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/node-esm/index.node.esm.js:
firebase/app/dist/index.mjs:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/node-esm/index.node.esm.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
@firebase/storage/dist/node-esm/index.node.esm.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/node-esm/totp-65577477.js:
@firebase/auth/dist/node-esm/totp-65577477.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/node-esm/totp-65577477.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/node-esm/totp-65577477.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/storage/dist/node-esm/index.node.esm.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
