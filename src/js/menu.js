(function($, UI){
    

    function MobileMenu(element, options){

        var $this = this;

        this.element = $(element);
        this.options = $.extend({}, options);

        this.element.on("click", ">li", function(){
            $this.element.find("li.active").not(this).removeClass("active");
            $(this).toggleClass("active");
        });
    }

    $.extend(MobileMenu.prototype, {

    });

    UI.fn.mobilemenu = MobileMenu;


    $(document).on("click", "[data-baseui-mobilemenu]", function(e){

        var ele = $(this);

        if(!ele.data("mobilemenu")) {
            ele.data("mobilemenu", new MobileMenu(ele, UI.util.parseOptions(ele.attr("data-baseui-mobilemenu"))));
            $(e.target).trigger("click");
        }

    });

})(jQuery, jQuery.baseui);