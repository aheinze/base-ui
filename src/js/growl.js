
(function($, UI){
  
  var growlContainer;

  /*
    Status object
  */

  function Status(message, options) {
      
    var $this = this,
        hover = false;

    this.settings = $.extend({
      "title": false,
      "message": message,
      "speed": 500,
      "timeout": 3000
    }, options);

    this.status = $('<div class="growlstatus" style="display:none;"><div class="growlstatus-close"></div>'+this.settings.message+'</div>');

    //append status
    growlContainer.prepend(this.status);

    //bind close button
    this.status.delegate(".growlstatus-close", UI.util.clickevent, function(){
      $this.close(true);
    });

    //show title
    if(this.settings.title!==false){
      this.status.prepend('<div class="growltitle">'+this.settings.title+'</div>');
    }

    this.status.hover(
      function(){
        hover = true;
      },
      function(){
        
        hover = false;

        if ($this.settings.timeout!==false) {
          window.setTimeout(function(){
            $this.close();
          }, $this.settings.timeout);
        }
      }
    ).fadeIn(this.settings.speed,function(){

      if($this.settings.timeout!==false){
        window.setTimeout(function(){
          $this.close();
        }, $this.settings.timeout);
      }
    });
    
    this.close = function(force){
    
      if(!hover || force){
        $this.status.animate({opacity:"0.0"}, $this.settings.speed).slideUp(function(){
              $this.status.remove();
        });
      }
    };
  }


  UI.growl = function(message, options) {
    
      var o = options || {};

      if(o.webnotification && window["webkitNotifications"]){
        
        if (webkitNotifications.checkPermission() === 0) {
          
          var title = o["title"] ? o.title:" ";

          return webkitNotifications.createNotification('data:image/gif;base64,R0lGODlhAQABAJEAAAAAAP///////wAAACH5BAEHAAIALAAAAAABAAEAAAICVAEAOw==', title, $('<div>'+message+'</div>').text()).show();
        }else{
          webkitNotifications.requestPermission();
        }
      }

      if (!growlContainer) {
        growlContainer = $('<div id="growlcontainer"></div>').appendTo("body");
      }

      return new Status(message, o);
  };

})(jQuery, jQuery.baseui);