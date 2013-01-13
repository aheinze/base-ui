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

})(jQuery, jQuery.baseui || {});