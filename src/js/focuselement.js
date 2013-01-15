(function($, UI){
    

    var eventregistred = false;


    function signElements(element) {
        
        $(document).find("[data-baseui='focuselement']").removeClass("baseui-focused");

        element.parents("[data-baseui='focuselement']").addClass("baseui-focused");

        if(element.is("[data-baseui='focuselement']")){
            element.addClass("baseui-focused");
        }
    }


    UI.fn.focuselement = function(){

        if (!eventregistred) {

            $(document).on("click focus", function(e){

                signElements($(e.target));
            });

            eventregistred = true;
        }
    };

})(jQuery, jQuery.baseui);