(function($, UI){
    

    var eventregistred = false;


    function signElements(element) {
        
        $(document).find("[data-baseui='focuselement']").removeClass("baseui-focused").trigger("blur");

        element.parents("[data-baseui='focuselement']").addClass("baseui-focused");

        if(element.is("[data-baseui='focuselement']")){
            element.addClass("baseui-focused").trigger("focus");
        }
    }


    UI.fn.focuselement = function(){

        if (!eventregistred) {

            $(document).on(UI.util.clickevent, function(e){

                signElements($(e.target));
            });

            eventregistred = true;
        }
    };

})(jQuery, jQuery.baseui);