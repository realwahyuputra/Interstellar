// Font Awesome Kit Configuration
window.FontAwesomeKitConfig = {
    asyncLoading: { enabled: false },
    autoA11y: { enabled: true },
    baseUrl: "https://ka-f.fontawesome.com",
    baseUrlKit: "https://kit.fontawesome.com",
    detectConflictsUntil: null,
    iconUploads: {},
    id: 0,
    license: "pro",
    method: "css",
    minify: { enabled: false },
    token: null,
    v4FontFaceShim: { enabled: true },
    v4shim: { enabled: true },
    v5FontFaceShim: { enabled: true },
    version: "6.1.1"
};

(function(moduleFactory) {
    "use strict";
    
    if (typeof define === "function" && define.amd) {
        define("kit-loader", moduleFactory);
    } else {
        moduleFactory();
    }
})(function() {
    "use strict";

    // Type checking utility
    function getType(obj) {
        return (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") 
            ? function(o) { return typeof o; }
            : function(o) { 
                return o && typeof Symbol === "function" && o.constructor === Symbol && o !== Symbol.prototype 
                    ? "symbol" 
                    : typeof o; 
            })(obj);
    }

    // Object property definition utility
    function defineProperty(obj, key, value) {
        if (key in obj) {
            Object.defineProperty(obj, key, {
                value: value,
                enumerable: true,
                configurable: true,
                writable: true
            });
        } else {
            obj[key] = value;
        }
        return obj;
    }

    // Get object keys including symbols
    function getObjectKeys(obj, includeSymbols) {
        var keys = Object.keys(obj);
        if (Object.getOwnPropertySymbols) {
            var symbols = Object.getOwnPropertySymbols(obj);
            if (includeSymbols) {
                symbols = symbols.filter(function(symbol) {
                    return Object.getOwnPropertyDescriptor(obj, symbol).enumerable;
                });
            }
            keys.push.apply(keys, symbols);
        }
        return keys;
    }

    // Object spreading utility
    function spreadObject(target) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            var sourceObj = source != null ? source : {};
            
            if (i % 2) {
                getObjectKeys(Object(sourceObj), true).forEach(function(key) {
                    defineProperty(target, key, sourceObj[key]);
                });
            } else {
                if (Object.getOwnPropertyDescriptors) {
                    Object.defineProperties(target, Object.getOwnPropertyDescriptors(sourceObj));
                } else {
                    getObjectKeys(Object(sourceObj)).forEach(function(key) {
                        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(sourceObj, key));
                    });
                }
            }
        }
        return target;
    }

    // Array destructuring utility
    function destructureArray(arr, count) {
        if (Array.isArray(arr)) return arr;
        
        if (typeof Symbol !== "undefined" && Symbol.iterator in Object(arr)) {
            var result = [];
            var isDone = true;
            var hasError = false;
            var error = void 0;
            
            try {
                var iterator = arr[Symbol.iterator]();
                var step;
                while (!(isDone = (step = iterator.next()).done)) {
                    result.push(step.value);
                    if (count && result.length === count) break;
                    isDone = true;
                }
            } catch (err) {
                hasError = true;
                error = err;
            } finally {
                try {
                    if (!isDone && iterator.return != null) iterator.return();
                } finally {
                    if (hasError) throw error;
                }
            }
            return result;
        }
        
        if (arr) {
            if (typeof arr === "string") return sliceArray(arr, count);
            var objName = Object.prototype.toString.call(arr).slice(8, -1);
            if (objName === "Object" && arr.constructor) objName = arr.constructor.name;
            if (objName === "Map" || objName === "Set") return Array.from(arr);
            if (objName === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(objName)) {
                return sliceArray(arr, count);
            }
        }
        
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    function sliceArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        var result = new Array(len);
        for (var i = 0; i < len; i++) result[i] = arr[i];
        return result;
    }

    // Build file URL for Font Awesome resources
    function buildFileUrl(config, options) {
        var addOn = options && options.addOn || "";
        var baseFilename = options && options.baseFilename || config.license + addOn;
        var minify = options && options.minify ? ".min" : "";
        var fileSuffix = options && options.fileSuffix || config.method;
        var subdir = options && options.subdir || config.method;
        
        return config.baseUrl + "/releases/" + 
               (config.version === "latest" ? "latest" : "v" + config.version) + 
               "/" + subdir + "/" + baseFilename + minify + "." + fileSuffix;
    }

    // Add accessibility attributes to Font Awesome icons
    function addAccessibilityAttributes(document, classNames) {
        var classes = classNames || ["fa"];
        var selector = "." + Array.prototype.join.call(classes, ",.");
        var icons = document.querySelectorAll(selector);
        
        Array.prototype.forEach.call(icons, function(icon) {
            var title = icon.getAttribute("title");
            icon.setAttribute("aria-hidden", "true");
            
            var hasScreenReaderText = !icon.nextElementSibling || 
                                    !icon.nextElementSibling.classList.contains("sr-only");
            
            if (title && hasScreenReaderText) {
                var srSpan = document.createElement("span");
                srSpan.innerHTML = title;
                srSpan.classList.add("sr-only");
                icon.parentNode.insertBefore(srSpan, icon.nextSibling);
            }
        });
    }

    // Promise implementation
    var promiseQueue = [];
    var isProcessingQueue = false;
    var hasGlobalProcess = typeof global !== "undefined" && 
                          global.process !== undefined && 
                          typeof global.process.emit === "function";
    var setImmediate = typeof setImmediate !== "undefined" ? setImmediate : setTimeout;

    function processQueue() {
        for (var i = 0; i < promiseQueue.length; i++) {
            promiseQueue[i][0](promiseQueue[i][1]);
        }
        promiseQueue = [];
        isProcessingQueue = false;
    }

    function enqueueTask(callback, arg) {
        promiseQueue.push([callback, arg]);
        if (!isProcessingQueue) {
            isProcessingQueue = true;
            setImmediate(processQueue, 0);
        }
    }

    function executePromiseCallback(promise) {
        var owner = promise.owner;
        var state = owner._state;
        var data = owner._data;
        var callback = promise[state];
        var nextPromise = promise.then;
        
        if (typeof callback === "function") {
            state = "fulfilled";
            try {
                data = callback(data);
            } catch (error) {
                rejectPromise(nextPromise, error);
            }
        }
        
        if (!resolvePromise(nextPromise, data)) {
            if (state === "fulfilled") fulfillPromise(nextPromise, data);
            if (state === "rejected") rejectPromise(nextPromise, data);
        }
    }

    function resolvePromise(promise, value) {
        var resolved;
        try {
            if (promise === value) {
                throw new TypeError("A promises callback cannot return that same promise.");
            }
            
            if (value && (typeof value === "function" || typeof value === "object")) {
                var then = value.then;
                if (typeof then === "function") {
                    then.call(value, function(val) {
                        if (!resolved) {
                            resolved = true;
                            if (value === val) {
                                settlePromise(promise, val);
                            } else {
                                fulfillPromise(promise, val);
                            }
                        }
                    }, function(reason) {
                        if (!resolved) {
                            resolved = true;
                            rejectPromise(promise, reason);
                        }
                    });
                    return true;
                }
            }
        } catch (error) {
            if (!resolved) rejectPromise(promise, error);
            return true;
        }
        return false;
    }

    function fulfillPromise(promise, value) {
        if (promise !== value && resolvePromise(promise, value)) return;
        settlePromise(promise, value);
    }

    function settlePromise(promise, value) {
        if (promise._state === "pending") {
            promise._state = "settled";
            promise._data = value;
            enqueueTask(fulfill, promise);
        }
    }

    function rejectPromise(promise, reason) {
        if (promise._state === "pending") {
            promise._state = "settled";
            promise._data = reason;
            enqueueTask(reject, promise);
        }
    }

    function processPromiseCallbacks(promise) {
        promise._then = promise._then.forEach(executePromiseCallback);
    }

    function fulfill(promise) {
        promise._state = "fulfilled";
        processPromiseCallbacks(promise);
    }

    function reject(promise) {
        promise._state = "rejected";
        processPromiseCallbacks(promise);
        if (!promise._handled && hasGlobalProcess) {
            global.process.emit("unhandledRejection", promise._data, promise);
        }
    }

    function handleRejection(promise) {
        global.process.emit("rejectionHandled", promise);
    }

    // Custom Promise constructor
    function CustomPromise(executor) {
        if (typeof executor !== "function") {
            throw new TypeError("Promise resolver " + executor + " is not a function");
        }
        if (!(this instanceof CustomPromise)) {
            throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
        }
        
        this._then = [];
        
        var self = this;
        function resolve(value) {
            fulfillPromise(self, value);
        }
        function reject(reason) {
            rejectPromise(self, reason);
        }
        
        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    CustomPromise.prototype = {
        constructor: CustomPromise,
        _state: "pending",
        _then: null,
        _data: undefined,
        _handled: false,
        
        then: function(onFulfilled, onRejected) {
            var promise = {
                owner: this,
                then: new this.constructor(function() {}),
                fulfilled: onFulfilled,
                rejected: onRejected
            };
            
            if ((onRejected || onFulfilled) && !this._handled) {
                this._handled = true;
                if (this._state === "rejected" && hasGlobalProcess) {
                    enqueueTask(handleRejection, this);
                }
            }
            
            if (this._state === "fulfilled" || this._state === "rejected") {
                enqueueTask(executePromiseCallback, promise);
            } else {
                this._then.push(promise);
            }
            
            return promise.then;
        },
        
        catch: function(onRejected) {
            return this.then(null, onRejected);
        }
    };

    CustomPromise.all = function(promises) {
        if (!Array.isArray(promises)) {
            throw new TypeError("You must pass an array to Promise.all().");
        }
        
        return new CustomPromise(function(resolve, reject) {
            var results = [];
            var remaining = 0;
            
            function createResolver(index) {
                remaining++;
                return function(value) {
                    results[index] = value;
                    if (--remaining === 0) resolve(results);
                };
            }
            
            for (var i = 0; i < promises.length; i++) {
                var promise = promises[i];
                if (promise && typeof promise.then === "function") {
                    promise.then(createResolver(i), reject);
                } else {
                    results[i] = promise;
                }
            }
            
            if (remaining === 0) resolve(results);
        });
    };

    CustomPromise.race = function(promises) {
        if (!Array.isArray(promises)) {
            throw new TypeError("You must pass an array to Promise.race().");
        }
        
        return new CustomPromise(function(resolve, reject) {
            for (var i = 0; i < promises.length; i++) {
                var promise = promises[i];
                if (promise && typeof promise.then === "function") {
                    promise.then(resolve, reject);
                } else {
                    resolve(promise);
                }
            }
        });
    };

    CustomPromise.resolve = function(value) {
        if (value && typeof value === "object" && value.constructor === CustomPromise) {
            return value;
        }
        return new CustomPromise(function(resolve) {
            resolve(value);
        });
    };

    CustomPromise.reject = function(reason) {
        return new CustomPromise(function(resolve, reject) {
            reject(reason);
        });
    };

    // Use native Promise if available, otherwise use custom implementation
    var PromiseImplementation = typeof Promise === "function" ? Promise : CustomPromise;

    // Fetch utility function
    function fetchResource(url, options) {
        var fetch = options.fetch;
        var XMLHttpRequest = options.XMLHttpRequest;
        var token = options.token;
        var requestUrl = url;
        
        if ("URLSearchParams" in window) {
            requestUrl = new URL(url);
        } else {
            requestUrl = requestUrl.toString();
        }
        
        return new PromiseImplementation(function(resolve, reject) {
            if (typeof fetch === "function") {
                fetch(requestUrl, {
                    mode: "cors",
                    cache: "default"
                }).then(function(response) {
                    if (response.ok) {
                        return response.text();
                    }
                    throw new Error("");
                }).then(function(text) {
                    resolve(text);
                }).catch(reject);
            } else if (typeof XMLHttpRequest === "function") {
                var xhr = new XMLHttpRequest();
                xhr.addEventListener("loadend", function() {
                    if (this.responseText) {
                        resolve(this.responseText);
                    } else {
                        reject(new Error(""));
                    }
                });
                
                ["abort", "error", "timeout"].map(function(event) {
                    xhr.addEventListener(event, function() {
                        reject(new Error(""));
                    });
                });
                
                xhr.open("GET", requestUrl);
                xhr.send();
            } else {
                reject(new Error(""));
            }
        });
    }

    // Transform CSS URLs
    function transformCssUrls(css, baseUrl, version) {
        var result = css;
        var transformations = [
            [/(url\("?)\.\.\/\.\.\/\.\./g, function(match, prefix) {
                return "" + prefix + baseUrl;
            }],
            [/(url\("?)\.\.\/webfonts/g, function(match, prefix) {
                return "" + prefix + baseUrl + "/releases/v" + version + "/webfonts";
            }],
            [/(url\("?)https:\/\/kit-free([^.])*\.fontawesome\.com/g, function(match, prefix) {
                return "" + prefix + baseUrl;
            }]
        ];
        
        transformations.forEach(function(transformation) {
            var pattern = destructureArray(transformation, 2);
            var regex = pattern[0];
            var replacer = pattern[1];
            result = result.replace(regex, replacer);
        });
        
        return result;
    }

    // Load CSS method
    function loadCssMethod(config, options, callback) {
        var cb = arguments.length > 2 && callback !== undefined ? callback : function() {};
        var document = options.document || document;
        var a11yFunction = addAccessibilityAttributes.bind(addAccessibilityAttributes, document, ["fa", "fab", "fas", "far", "fal", "fad", "fak"]);
        var hasUploads = Object.keys(config.iconUploads || {}).length > 0;
        
        if (config.autoA11y.enabled) cb(a11yFunction);
        
        var stylesheets = [{ id: "fa-main", addOn: undefined }];
        
        if (config.v4shim && config.v4shim.enabled) {
            stylesheets.push({ id: "fa-v4-shims", addOn: "-v4-shims" });
        }
        if (config.v5FontFaceShim && config.v5FontFaceShim.enabled) {
            stylesheets.push({ id: "fa-v5-font-face", addOn: "-v5-font-face" });
        }
        if (config.v4FontFaceShim && config.v4FontFaceShim.enabled) {
            stylesheets.push({ id: "fa-v4-font-face", addOn: "-v4-font-face" });
        }
        if (hasUploads) {
            stylesheets.push({ id: "fa-kit-upload", customCss: true });
        }
        
        var promises = stylesheets.map(function(stylesheet) {
            return new PromiseImplementation(function(resolve, reject) {
                var url = stylesheet.customCss 
                    ? function(cfg) { return cfg.baseUrlKit + "/" + cfg.token + "/" + cfg.id + "/kit-upload.css"; }(config)
                    : buildFileUrl(config, { addOn: stylesheet.addOn, minify: config.minify.enabled });
                
                fetchResource(url, options).then(function(css) {
                    resolve(function(cssText, opts) {
                        var contentFilter = opts.contentFilter || function(text, options) { return text; };
                        var style = document.createElement("style");
                        var textNode = document.createTextNode(contentFilter(cssText, opts));
                        
                        style.appendChild(textNode);
                        style.media = "all";
                        
                        if (opts.id) style.setAttribute("id", opts.id);
                        if (opts && opts.detectingConflicts && opts.detectionIgnoreAttr) {
                            style.setAttributeNode(document.createAttribute(opts.detectionIgnoreAttr));
                        }
                        
                        return style;
                    }(css, spreadObject(spreadObject({}, options), {}, {
                        baseUrl: config.baseUrl,
                        version: config.version,
                        id: stylesheet.id,
                        contentFilter: function(text, opts) {
                            return transformCssUrls(text, opts.baseUrl, opts.version);
                        }
                    })));
                }).catch(reject);
            });
        });
        
        return PromiseImplementation.all(promises);
    }

    // Create script element
    function createScript(content, options) {
        var script = document.createElement("SCRIPT");
        var textNode = document.createTextNode(content);
        
        script.appendChild(textNode);
        script.referrerPolicy = "strict-origin";
        
        if (options.id) script.setAttribute("id", options.id);
        if (options && options.detectingConflicts && options.detectionIgnoreAttr) {
            script.setAttributeNode(document.createAttribute(options.detectionIgnoreAttr));
        }
        
        return script;
    }

    // DOM ready utility
    function onDomReady(callback) {
        var callbacks = [];
        var isReady;
        var document = document;
        var readyState = (document.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(document.readyState);
        
        if (!readyState) {
            document.addEventListener("DOMContentLoaded", isReady = function() {
                document.removeEventListener("DOMContentLoaded", isReady);
                readyState = 1;
                while (isReady = callbacks.shift()) isReady();
            });
        }
        
        readyState ? setTimeout(callback, 0) : callbacks.push(callback);
    }

    // Main initialization
    try {
        if (window.FontAwesomeKitConfig) {
            var kitConfig = window.FontAwesomeKitConfig;
            var loadOptions = {
                detectingConflicts: kitConfig.detectConflictsUntil && new Date() <= new Date(kitConfig.detectConflictsUntil),
                detectionIgnoreAttr: "data-fa-detection-ignore",
                fetch: window.fetch,
                token: kitConfig.token,
                XMLHttpRequest: window.XMLHttpRequest,
                document: document
            };
            var currentScript = document.currentScript;
            var parentElement = currentScript ? currentScript.parentElement : document.head;
            
            // Load method factory
            (function() {
                var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
                var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                
                if (config.method === "js") {
                    // JavaScript method implementation
                    options.autoA11y = config.autoA11y.enabled;
                    if (config.license === "pro") {
                        options.autoFetchSvg = true;
                        options.fetchSvgFrom = config.baseUrl + "/releases/" + 
                            (config.version === "latest" ? "latest" : "v" + config.version) + "/svgs";
                        options.fetchUploadedSvgFrom = config.uploadsUrl;
                    }
                    
                    var promises = [];
                    
                    if (config.v4shim.enabled) {
                        promises.push(new PromiseImplementation(function(resolve, reject) {
                            fetchResource(buildFileUrl(config, {
                                addOn: "-v4-shims",
                                minify: config.minify.enabled
                            }), options).then(function(js) {
                                resolve(createScript(js, spreadObject(spreadObject({}, options), {}, { id: "fa-v4-shims" })));
                            }).catch(reject);
                        }));
                    }
                    
                    promises.push(new PromiseImplementation(function(resolve, reject) {
                        fetchResource(buildFileUrl(config, { minify: config.minify.enabled }), options).then(function(js) {
                            var script = createScript(js, spreadObject(spreadObject({}, options), {}, { id: "fa-main" }));
                            resolve(function(scriptElement, opts) {
                                var autoFetchSvg = opts && opts.autoFetchSvg !== undefined ? opts.autoFetchSvg : undefined;
                                var autoA11y = opts && opts.autoA11y !== undefined ? opts.autoA11y : undefined;
                                
                                if (autoA11y !== undefined) {
                                    scriptElement.setAttribute("data-auto-a11y", autoA11y ? "true" : "false");
                                }
                                if (autoFetchSvg) {
                                    scriptElement.setAttributeNode(document.createAttribute("data-auto-fetch-svg"));
                                    scriptElement.setAttribute("data-fetch-svg-from", opts.fetchSvgFrom);
                                    scriptElement.setAttribute("data-fetch-uploaded-svg-from", opts.fetchUploadedSvgFrom);
                                }
                                
                                return scriptElement;
                            }(script, options));
                        }).catch(reject);
                    }));
                    
                    return PromiseImplementation.all(promises);
                } else if (config.method === "css") {
                    return loadCssMethod(config, options, function(a11yCallback) {
                        onDomReady(a11yCallback);
                        if (typeof MutationObserver !== "undefined") {
                            new MutationObserver(a11yCallback).observe(document, {
                                childList: true,
                                subtree: true
                            });
                        }
                    });
                }
                
                return undefined;
            })(kitConfig, loadOptions).then(function(elements) {
                elements.map(function(element) {
                    try {
                        parentElement.insertBefore(element, currentScript ? currentScript.nextSibling : null);
                    } catch (error) {
                        parentElement.appendChild(element);
                    }
                });
                
                if (loadOptions.detectingConflicts && currentScript) {
                    onDomReady(function() {
                        currentScript.setAttributeNode(document.createAttribute(loadOptions.detectionIgnoreAttr));
                        var conflictDetectionScript = function(config, options) {
                            var script = document.createElement("script");
                            if (options && options.detectionIgnoreAttr) {
                                script.setAttributeNode(document.createAttribute(options.detectionIgnoreAttr));
                            }
                            script.src = buildFileUrl(config, {
                                baseFilename: "conflict-detection",
                                fileSuffix: "js",
                                subdir: "js",
                                minify: config.minify.enabled
                            });
                            return script;
                        }(kitConfig, loadOptions);
                        document.body.appendChild(conflictDetectionScript);
                    });
                }
            }).catch(function(error) {
                console.error("Font Awesome Kit: " + error);
            });
        }
    } catch (error) {
        console.error("Font Awesome Kit: " + error);
    }
});
