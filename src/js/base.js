(function($, win, doc){

    $.baseui = UI = {
        util: {},
        fn: {}
    };

    UI.bydata = function(context) {

        $(context || doc).find("[data-baseui]").each(function(){
            var element = $(this), 
                data    = element.attr("data-baseui"),
                fn      = data.split(" ")[0],
                options = UI.util.options(data);

            element.dataui(fn, options);
        });

    };

    UI.util.options = function(string) {

        var start = string.indexOf("{"), options = {};

        if (start != -1) {
            try {
                options = (new Function("", "var json = " + string.substr(start) + "; return JSON.parse(JSON.stringify(json));"))();
            } catch(e) {}
        }

        return options;
    };


    $.fn.dataui = function (fn, options) {

        if (!UI.fn[fn]) {
            $.error("Base UI component [" + fn + "] does not exist.");
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
        
        UI.bydata(doc);

        var target   = doc.body,
            MO       = win.MutationObserver || win.WebKitMutationObserver || function(callback) { 
                        this.observe = function(target, config){
                            setTimeout(function(){ 
                                UI.bydata(doc); 
                            }, 1000);
                        };
            },
            observer = new MO(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        UI.bydata(doc);
                    }
                });
            });

        observer.observe(target, { childList: true});
    });


})(jQuery, window, document);