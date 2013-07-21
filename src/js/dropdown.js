(function($, UI){


    var active   = false,
        init     = false,
        Dropdown = function(element, options) {
        
            var $this = this;

            this.options = $.extend({}, this.options, options);
            this.element = $(element).on(UI.util.clickevent, ".dp-toggle", function(e){
                $this.toggle();
            });

            if (this.element.is(".dp-toggle")) {
                this.element.on("click", function(e){
                    $this.toggle();
                });
            }

        if(!init) {
            $(document).on(UI.util.clickevent, function() {

                $(".active[data-baseui-dropdown]").not(active).removeClass("active");
                active = false;
                
            });

            init = true;
        }
    };

    $.extend(Dropdown.prototype, {

        options: {

        },

        toggle: function() {
            this.element.toggleClass("active");
            active = this.element.hasClass("active") ? this.element : false;
        }

    });


    UI.fn.dropdown = Dropdown;


    $(document).on("click", "[data-baseui-dropdown]", function(e){

        var ele = $(this);

        if(!ele.data("dropdown")) {
            ele.data("dropdown", new Dropdown(ele, UI.util.parseOptions(ele.attr("data-baseui-dropdown"))));
            active = ele;
            $(e.target).trigger("click");

        }

    });

})(jQuery, jQuery.baseui);