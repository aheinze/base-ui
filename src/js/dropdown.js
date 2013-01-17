(function($, UI){


    var active   = false,
        Dropdown = function(element, options) {
        
        var $this = this;

        this.options = $.extend({}, this.options, options);
        this.element = $(element).on("click", ".dp-toggle", function(e){
            $this.toggle();
        });

        if (this.element.is(".dp-toggle")) {
            this.element.on("click", function(e){
                $this.toggle();
            });
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

    $(document).on("click", function() {
        $(".active[data-baseui^='dropdown']").not(active).removeClass("active");
        active = false;
    });

    UI.fn.dropdown = Dropdown;

})(jQuery, jQuery.baseui);