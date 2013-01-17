(function($, UI) {

    var $tooltip; // tooltip container


    var Tooltip = function(element, options) {
        
        var $this = this;

        this.options = $.extend({}, this.options, options);
        
        this.element = $(element).on({
            "mouseenter": function(e) { $this.show(); },
            "mouseleave": function(e) { $this.hide(); }
        });

        this.tip = typeof(this.options.src) === "function" ? this.options.src.call(this.element) : this.options.src;

        // disable title attribute
        this.element.attr("data-cached-title", this.element.attr("title")).attr("title", "");
    };

    $.extend(Tooltip.prototype, {

        tip: "",

        options: {
            "offset": 5,
            "pos": "b",
            "src": function() { return this.attr("title"); }
        },

        show: function() {

            if(!this.tip.length) return;

            $tooltip.css({"top": -2000, "visibility": "hidden"}).show();
            $tooltip.html('<div class="tooltip-inner">'+this.tip+'</div>');

            var pos      = $.extend({}, this.element.offset(), { width: this.element[0].offsetWidth, height: this.element[0].offsetHeight }),
                width    = $tooltip[0].offsetWidth,
                height   = $tooltip[0].offsetHeight,
                offset   = typeof(this.options.offset) === "function" ? this.options.offset.call(this.element) : this.options.offset,
                position = typeof(this.options.pos) === "function" ? this.options.pos.call(this.element) : this.options.pos,
                tcss     = {
                    "display":"none",
                    "visibility": "visible",
                    "top": (pos.top + pos.height + height),
                    "left": pos.left
                };

                switch (position[0]) {
                    case 'b':
                        $.extend(tcss, {top: pos.top + pos.height + offset, left: pos.left + pos.width / 2 - width / 2});
                        break;
                    case 't':
                        $.extend(tcss, {top: pos.top - height - offset, left: pos.left + pos.width / 2 - width / 2});
                        break;
                    case 'l':
                        $.extend(tcss, {top: pos.top + pos.height / 2 - height / 2, left: pos.left - width - offset});
                        break;
                    case 'r':
                        $.extend(tcss, {top: pos.top + pos.height / 2 - height / 2, left: pos.left + pos.width + offset});
                        break;
                }

            if (position.length == 2) {
                tcss.left = (position[1] == 'l') ? (pos.left):((pos.left + pos.width) - width);
            }

            $tooltip.css(tcss).attr("data-direction", position).show();

        },

        hide: function() {
            $tooltip.hide();
        },

        content: function() {
            return this.tip;
        }

    });

    UI["tip"] = Tooltip;

    $(function(){
        $tooltip = $('<div class="tooltip"></div>').appendTo("body");
    });

})(jQuery, jQuery.baseui);