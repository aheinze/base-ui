(function($, UI){
	

	var tpl = '<div class="modal-win animated fadeInDown"><div></div><div class="modal-close"></div></div>',
		current = false,
		overlay = false,
		persist = false,
		$win = $(window),
		$doc = $(document);

	UI.modal = function(content, options){
		
		var o = $.extend({
                'title'     : false,
                'closeOnEsc': true,
                'height'    : 'auto',
                'width'     : 'auto',

                //events
                'beforeShow'  : function(){},
                'beforeClose' : function(){},
				'onClose'     : function(){}
        }, options);

        if(current){
            UI.modal.close();
        }

        current = $(tpl);

        var container = current.children().eq(0);

		if(o.height != 'auto'){
		    container.css({
		      'height'    : o.height,
		      'overflow-y': 'auto'
		    });
		}

		if(o.width != 'auto'){
		    container.css({
		      'width'     : o.width,
		      'overflow-x': 'auto'
		    });
		}

		if (typeof content === 'object') {
			// convert DOM object to a jQuery object
			content = content instanceof jQuery ? content : $(content);
            
            if(content.parent().length) {
                persist = content;
                persist.data("sb-persist-parent", content.parent());
            }
		} else if (typeof content === 'string' || typeof content === 'number') {
			// just insert the data as innerHTML
			content = $('<div></div>').html(content);
		} else {
			// unsupported data type!
			content = $('<div></div>').html('Modal Error: Unsupported data type: ' + typeof content);
		}
      
        container.append(content);

        overlay = $("<div>").addClass('modal-overlay').css({
			top: 0,	left: 0, position: 'absolute', opacity:0.6
		}).prependTo('body');

		UI.modal.fit();

	};

	UI.modal.close = function(){
		
		if(!current) return;

        if (persist) {
	        persist.appendTo(persist.data("sb-persist-parent"));
	        persist = false;
        }

        current.remove();
        overlay.remove();

        current = false;
	};

	UI.modal.fit = function(){
        current.appendTo("body").css({
	        'left' : ($win.width()/2-current.outerWidth()/2),
	        'top'  : ($win.height()/2-current.outerHeight()/2),
	        'visibility': "visible"
        });

        overlay.css({
            width: $doc.width(),
            height: $doc.height()
        });
	};

	$(document).bind('keydown.modal', function (e) {
        if (current && e.keyCode === 27) { // ESC
            e.preventDefault();
            UI.modal.close();
        }
    }).delegate(".modal-close", "click", function(){
        UI.modal.close();
    });

	$win.bind('resize.modal', function(){
        
        if(!current) return;

        UI.modal.fit();
    });

})(jQuery, jQuery.baseui || {});