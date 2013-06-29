(function($, win, doc){

    $.baseui = UI = {
        util: {},
        supports: {},
        fn: {}
    };

    // supports
    //---------------------------------------------------------
    UI.supports.transition = (function() {

        var transitionEnd = (function() {

            var element = doc.body || doc.documentElement,
                transEndEventNames = {
                    'WebkitTransition' : 'webkitTransitionEnd',
                    'MozTransition' : 'transitionend',
                    'OTransition' : 'oTransitionEnd otransitionend',
                    'transition' : 'transitionend'
                }, 
                transition = false;

            for (var name in transEndEventNames){
                if (element.style[name] !== undefined) {
                    transition = transEndEventNames[name];
                }
            }

            return transition;
        })();

        return transitionEnd && { end: transitionEnd };
    })();

    UI.supports.mutationObserver = (function() {
        return true && win.MutationObserver || win.WebKitMutationObserver;
    })();

    UI.supports.touch  = (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
    

    // util
    //---------------------------------------------------------
    
    UI.util.clickevent = UI.supports.touch ? 'click':'click';

    UI.util.initByDataAttr = function(context) {

        $(context || doc).find("[data-baseui]:not([data-baseui-skip])").each(function(){
            
            var element = $(this), 
                data    = element.attr("data-baseui"),
                fn      = $.trim(data.split(">")[0]),
                options = UI.util.parseOptions(data);

            element.baseui(fn, options);

        }).attr("data-baseui-skip", "true");

    };

    UI.util.parseOptions = function(string) {

        var start = string.indexOf(">"), options = {};

        if (start != -1) {
            try {
                options = (new Function("", "var json = {" + string.substr(start+1) + "}; return JSON.parse(JSON.stringify(json));"))();
            } catch(e) {
                $.error(e.message);
            }
        }

        return options;
    };

    UI.util.debounce = function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    // misc
    //---------------------------------------------------------
    $.fn.baseui = function (fn, options) {

        if (!UI.fn[fn]) {
            //$.error("Base UI component [" + fn + "] does not exist.");
            return this;
        }

        var args = arguments;

        return this.each(function() {
            var $this = $(this), 
                obj   = $this.data(fn);

            if (!obj) { 
                obj = new UI.fn[fn](this, options);
                $this.data(fn, obj);
            }

            if (obj && typeof(options) == 'string') {
                obj[options].apply(obj, Array.prototype.slice.call(args, 2));
            }
        });

    };

    // auto data ui on dom manipulation
    $(function(){
        
        UI.util.initByDataAttr(doc);

        var target   = doc.body,
            MO       = UI.supports.mutationObserver || function(callback) { 
                        this.observe = function(target, config){
                            setTimeout(function(){ 
                                UI.util.initByDataAttr(doc); 
                            }, 1000);
                        };
            },
            observer = new MO(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        UI.util.initByDataAttr(doc);
                    }
                });
            });

        observer.observe(target, { childList: true});
    });


})(jQuery, window, document);