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


    UI.supports.touch  = (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
    

    // util
    //---------------------------------------------------------
    
    UI.util.clickevent = UI.supports.touch ? 'click':'click';


    UI.util.parseOptions = function(string) {

        var options = {};

        if (string) {
            try {
                options = (new Function("", "var json = {" + string + "}; return JSON.parse(JSON.stringify(json));"))();
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


})(jQuery, window, document);