(function($, UI){
    
    var body       = $("body"),
        ModalPanel = {

        show: function(element, movebody) {
            
            element = $(element);

            if (element.length) {
                
                var content = element.find(".modal-panel-content:first");
                
                element.show().addClass("active");

                if(movebody) {
                    var html = $("html");
                    html.css("width", $("body").width()).addClass("has-active-modal-panel").width();
                    html.css("margin-left", content.width() * (content.hasClass("panel-right") ? -1:1));
                }
            }
            
            $(document).on("swiperight.modal-panel swipeleft.modal-panel", '.modal-panel',function(e) {
                
                var target = $(e.target);

                if (target.hasClass("modal-panel-content") || target.parents(".modal-panel-content:first").length) {
                    if(!target.hasClass("close-modal-panel")) return;
                }

                ModalPanel.hide();

            }).on('keydown.modal-panel', function (e) {
                if (e.keyCode === 27) { // ESC
                    ModalPanel.hide();
                }
            });
        },

        hide: function() {
            
            var html = $("html");

            if(html.hasClass("has-active-modal-panel")) {
                html.css({"margin-left": "", "margin-right": "", "width": ""}).removeClass("has-active-modal-panel");
            }

            $(".modal-panel").hide().removeClass("active");

            $(document).off(".modal-panel");
        }
    };

    UI.modalpanel =  ModalPanel;

})(jQuery, jQuery.baseui);