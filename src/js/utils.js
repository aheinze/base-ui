(function($, UI) {

    var matchers    = {},
        win         = $(window),
        event       = 'resize orientationchange',

    MatchHeight = function(element, options) {

        var $this     = this;

        this.options  = $.extend({}, this.options, options);

        this.element  = $(element);
        this.columns  = this.element.children();
        this.elements = this.options.target ? this.element.find(this.options.target): this.columns;

        win.bind(event, (function(){
            var fn = function(){ $this.match(); };

            $(function(){
                fn();
                win.on("load", fn);
            });

            return UI.util.debounce(fn, 150);
        })());
    };

    $.extend(MatchHeight.prototype, {

        options: {
            "target": false
        },

        match: function() {

            this.revert();

            var stacked = Math.ceil(100 * parseFloat(this.columns.eq(0).css('width'))/parseFloat(this.columns.eq(0).parent().css('width'))) >= 100 ? true:false,
                max     = 0,
                $this   = this;

            if(stacked) {
                return;
            }

            this.elements.each(function() {
                max = Math.max(max, $(this).outerHeight());
            }).each(function(i) {

                var element   = $(this),
                    boxheight = element.css("box-sizing")=="border-box" ? "outerHeight" : "height",
                    box       = $this.columns.eq(i),
                    height    = (element.height() + (max - box[boxheight]()));

                element.css('min-height', height + 'px');
            });

            return this;
        },

        revert: function() {
            this.elements.css('min-height', '');
            return this;
        }

    });

    UI.fn["match-height"] = MatchHeight;

})(jQuery, jQuery.baseui);