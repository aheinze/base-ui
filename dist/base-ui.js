(function($, win, doc){

    $.baseui = UI = {
        util: {},
        supports: {},
        fn: {}
    };

    // supports
    //---------------------------------------------------------
    UI.supports.transition = (function() {

        var transitionEnd = (function() {

            var element = doc.body || doc.documentElement,
                transEndEventNames = {
                    'WebkitTransition' : 'webkitTransitionEnd',
                    'MozTransition' : 'transitionend',
                    'OTransition' : 'oTransitionEnd otransitionend',
                    'transition' : 'transitionend'
                }, 
                transition = false;

            for (var name in transEndEventNames){
                if (element.style[name] !== undefined) {
                    transition = transEndEventNames[name];
                }
            }

            return transition;
        })();

        return transitionEnd && { end: transitionEnd };
    })();

    UI.supports.mutationObserver = (function() {
        return true && win.MutationObserver || win.WebKitMutationObserver;
    })();

    UI.supports.touch  = (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
    

    // util
    //---------------------------------------------------------
    
    UI.util.clickevent = UI.supports.touch ? 'click':'click';

    UI.util.initByDataAttr = function(context) {

        $(context || doc).find("[data-baseui]:not([data-baseui-skip])").each(function(){
            
            var element = $(this), 
                data    = element.attr("data-baseui"),
                fn      = $.trim(data.split(">")[0]),
                options = UI.util.parseOptions(data);

            element.baseui(fn, options);

        }).attr("data-baseui-skip", "true");

    };

    UI.util.parseOptions = function(string) {

        var start = string.indexOf(">"), options = {};

        if (start != -1) {
            try {
                options = (new Function("", "var json = {" + string.substr(start+1) + "}; return JSON.parse(JSON.stringify(json));"))();
            } catch(e) {
                $.error(e.message);
            }
        }

        return options;
    };

    UI.util.debounce = function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    // misc
    //---------------------------------------------------------
    $.fn.baseui = function (fn, options) {

        if (!UI.fn[fn]) {
            //$.error("Base UI component [" + fn + "] does not exist.");
            return this;
        }

        var args = arguments;

        return this.each(function() {
            var $this = $(this), 
                obj   = $this.data(fn);

            if (!obj) { 
                obj = new UI.fn[fn](this, options);
                $this.data(fn, obj);
            }

            if (obj && typeof(options) == 'string') {
                obj[options].apply(obj, Array.prototype.slice.call(args, 2));
            }
        });

    };

    // auto data ui on dom manipulation
    $(function(){
        
        UI.util.initByDataAttr(doc);

        var target   = doc.body,
            MO       = UI.supports.mutationObserver || function(callback) { 
                        this.observe = function(target, config){
                            setTimeout(function(){ 
                                UI.util.initByDataAttr(doc); 
                            }, 1000);
                        };
            },
            observer = new MO(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        UI.util.initByDataAttr(doc);
                    }
                });
            });

        observer.observe(target, { childList: true});
    });


})(jQuery, window, document);

/*! Hammer.JS - v1.0.6dev - 2013-04-10
 * http://eightmedia.github.com/hammer.js
 *
 * Copyright (c) 2013 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window, undefined) {
    'use strict';

/**
 * Hammer
 * use this to create instances
 * @param   {HTMLElement}   element
 * @param   {Object}        options
 * @returns {Hammer.Instance}
 * @constructor
 */
var Hammer = function(element, options) {
    return new Hammer.Instance(element, options || {});
};

// default settings
Hammer.defaults = {
    // add styles and attributes to the element to prevent the browser from doing
    // its native behavior. this doesnt prevent the scrolling, but cancels
    // the contextmenu, tap highlighting etc
    // set to false to disable this
    stop_browser_behavior: {
        // this also triggers onselectstart=false for IE
        userSelect: 'none',
        // this makes the element blocking in IE10 >, you could experiment with the value
        // see for more options this issue; https://github.com/EightMedia/hammer.js/issues/241
        touchAction: 'none',
        touchCallout: 'none',
        contentZooming: 'none',
        userDrag: 'none',
        tapHighlightColor: 'rgba(0,0,0,0)'
    }

    // more settings are defined per gesture at gestures.js
};

// detect touchevents
Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

// dont use mouseevents on mobile devices
Hammer.MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
Hammer.NO_MOUSEEVENTS = Hammer.HAS_TOUCHEVENTS && navigator.userAgent.match(Hammer.MOBILE_REGEX);

// eventtypes per touchevent (start, move, end)
// are filled by Hammer.event.determineEventTypes on setup
Hammer.EVENT_TYPES = {};

// direction defines
Hammer.DIRECTION_DOWN = 'down';
Hammer.DIRECTION_LEFT = 'left';
Hammer.DIRECTION_UP = 'up';
Hammer.DIRECTION_RIGHT = 'right';

// pointer type
Hammer.POINTER_MOUSE = 'mouse';
Hammer.POINTER_TOUCH = 'touch';
Hammer.POINTER_PEN = 'pen';

// touch event defines
Hammer.EVENT_START = 'start';
Hammer.EVENT_MOVE = 'move';
Hammer.EVENT_END = 'end';

// hammer document where the base events are added at
Hammer.DOCUMENT = document;

// plugins namespace
Hammer.plugins = {};

// if the window events are set...
Hammer.READY = false;

/**
 * setup events to detect gestures on the document
 */
function setup() {
    if(Hammer.READY) {
        return;
    }

    // find what eventtypes we add listeners to
    Hammer.event.determineEventTypes();

    // Register all gestures inside Hammer.gestures
    for(var name in Hammer.gestures) {
        if(Hammer.gestures.hasOwnProperty(name)) {
            Hammer.detection.register(Hammer.gestures[name]);
        }
    }

    // Add touch events on the document
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);

    // Hammer is ready...!
    Hammer.READY = true;
}

/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 * @param   {HTMLElement}       element
 * @param   {Object}            [options={}]
 * @returns {Hammer.Instance}
 * @constructor
 */
Hammer.Instance = function(element, options) {
    var self = this;

    // setup HammerJS window events and register all gestures
    // this also sets up the default options
    setup();

    this.element = element;

    // start/stop detection option
    this.enabled = true;

    // merge options
    this.options = Hammer.utils.extend(
        Hammer.utils.extend({}, Hammer.defaults),
        options || {});

    // add some css to the element to prevent the browser from doing its native behavoir
    if(this.options.stop_browser_behavior) {
        Hammer.utils.stopDefaultBrowserBehavior(this.element, this.options.stop_browser_behavior);
    }

    // start detection on touchstart
    Hammer.event.onTouch(element, Hammer.EVENT_START, function(ev) {
        if(self.enabled) {
            Hammer.detection.startDetect(self, ev);
        }
    });

    // return instance
    return this;
};


Hammer.Instance.prototype = {
    /**
     * bind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    on: function onEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.addEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * unbind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    off: function offEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.removeEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * trigger gesture event
     * @param   {String}      gesture
     * @param   {Object}      eventData
     * @returns {Hammer.Instance}
     */
    trigger: function triggerEvent(gesture, eventData){
        // create DOM event
        var event = Hammer.DOCUMENT.createEvent('Event');
        event.initEvent(gesture, true, true);
        event.gesture = eventData;

        // trigger on the target if it is in the instance element,
        // this is for event delegation tricks
        var element = this.element;
        if(Hammer.utils.hasParent(eventData.target, element)) {
            element = eventData.target;
        }

        element.dispatchEvent(event);
        return this;
    },


    /**
     * enable of disable hammer.js detection
     * @param   {Boolean}   state
     * @returns {Hammer.Instance}
     */
    enable: function enable(state) {
        this.enabled = state;
        return this;
    }
};

/**
 * this holds the last move event,
 * used to fix empty touchend issue
 * see the onTouch event for an explanation
 * @type {Object}
 */
var last_move_event = null;


/**
 * when the mouse is hold down, this is true
 * @type {Boolean}
 */
var enable_detect = false;


/**
 * when touch events have been fired, this is true
 * @type {Boolean}
 */
var touch_triggered = false;


Hammer.event = {
    /**
     * simple addEventListener
     * @param   {HTMLElement}   element
     * @param   {String}        type
     * @param   {Function}      handler
     */
    bindDom: function(element, type, handler) {
        var types = type.split(' ');
        for(var t=0; t<types.length; t++) {
            element.addEventListener(types[t], handler, false);
        }
    },


    /**
     * touch events with mouse fallback
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Function}      handler
     */
    onTouch: function onTouch(element, eventType, handler) {
        var self = this;

        this.bindDom(element, Hammer.EVENT_TYPES[eventType], function bindDomOnTouch(ev) {
            var sourceEventType = ev.type.toLowerCase();

            // onmouseup, but when touchend has been fired we do nothing.
            // this is for touchdevices which also fire a mouseup on touchend
            if(sourceEventType.match(/mouse/) && touch_triggered) {
                return;
            }

            // mousebutton must be down or a touch event
            else if( sourceEventType.match(/touch/) ||   // touch events are always on screen
                sourceEventType.match(/pointerdown/) || // pointerevents touch
                (sourceEventType.match(/mouse/) && ev.which === 1)   // mouse is pressed
            ){
                enable_detect = true;
            }

            // mouse isn't pressed
            else if(sourceEventType.match(/mouse/) && ev.which !== 1) {
                enable_detect = false;
            }


            // we are in a touch event, set the touch triggered bool to true,
            // this for the conflicts that may occur on ios and android
            if(sourceEventType.match(/touch|pointer/)) {
                touch_triggered = true;
            }

            // count the total touches on the screen
            var count_touches = 0;

            // when touch has been triggered in this detection session
            // and we are now handling a mouse event, we stop that to prevent conflicts
            if(enable_detect) {
                // update pointerevent
                if(Hammer.HAS_POINTEREVENTS && eventType != Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
                // touch
                else if(sourceEventType.match(/touch/)) {
                    count_touches = ev.touches.length;
                }
                // mouse
                else if(!touch_triggered) {
                    count_touches = sourceEventType.match(/up/) ? 0 : 1;
                }

                // if we are in a end event, but when we remove one touch and
                // we still have enough, set eventType to move
                if(count_touches > 0 && eventType == Hammer.EVENT_END) {
                    eventType = Hammer.EVENT_MOVE;
                }
                // no touches, force the end event
                else if(!count_touches) {
                    eventType = Hammer.EVENT_END;
                }

                // because touchend has no touches, and we often want to use these in our gestures,
                // we send the last move event as our eventData in touchend
                if(!count_touches && last_move_event !== null) {
                    ev = last_move_event;
                }
                // store the last move event
                else {
                    last_move_event = ev;
                }

                // trigger the handler
                handler.call(Hammer.detection, self.collectEventData(element, eventType, ev));

                // remove pointerevent from list
                if(Hammer.HAS_POINTEREVENTS && eventType == Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
            }

            //debug(sourceEventType +" "+ eventType);

            // on the end we reset everything
            if(!count_touches) {
                last_move_event = null;
                enable_detect = false;
                touch_triggered = false;
                Hammer.PointerEvent.reset();
            }
        });
    },


    /**
     * we have different events for each device/browser
     * determine what we need and set them in the Hammer.EVENT_TYPES constant
     */
    determineEventTypes: function determineEventTypes() {
        // determine the eventtype we want to set
        var types;

        // pointerEvents magic
        if(Hammer.HAS_POINTEREVENTS) {
            types = Hammer.PointerEvent.getEvents();
        }
        // on Android, iOS, blackberry, windows mobile we dont want any mouseevents
        else if(Hammer.NO_MOUSEEVENTS) {
            types = [
                'touchstart',
                'touchmove',
                'touchend touchcancel'];
        }
        // for non pointer events browsers and mixed browsers,
        // like chrome on windows8 touch laptop
        else {
            types = [
                'touchstart mousedown',
                'touchmove mousemove',
                'touchend touchcancel mouseup'];
        }

        Hammer.EVENT_TYPES[Hammer.EVENT_START]  = types[0];
        Hammer.EVENT_TYPES[Hammer.EVENT_MOVE]   = types[1];
        Hammer.EVENT_TYPES[Hammer.EVENT_END]    = types[2];
    },


    /**
     * create touchlist depending on the event
     * @param   {Object}    ev
     * @param   {String}    eventType   used by the fakemultitouch plugin
     */
    getTouchList: function getTouchList(ev/*, eventType*/) {
        // get the fake pointerEvent touchlist
        if(Hammer.HAS_POINTEREVENTS) {
            return Hammer.PointerEvent.getTouchList();
        }
        // get the touchlist
        else if(ev.touches) {
            return ev.touches;
        }
        // make fake touchlist from mouse position
        else {
            return [{
                identifier: 1,
                pageX: ev.pageX,
                pageY: ev.pageY,
                target: ev.target
            }];
        }
    },


    /**
     * collect event data for Hammer js
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Object}        eventData
     */
    collectEventData: function collectEventData(element, eventType, ev) {
        var touches = this.getTouchList(ev, eventType);

        // find out pointerType
        var pointerType = Hammer.POINTER_TOUCH;
        if(ev.type.match(/mouse/) || Hammer.PointerEvent.matchType(Hammer.POINTER_MOUSE, ev)) {
            pointerType = Hammer.POINTER_MOUSE;
        }

        return {
            center      : Hammer.utils.getCenter(touches),
            timeStamp   : new Date().getTime(),
            target      : ev.target,
            touches     : touches,
            eventType   : eventType,
            pointerType : pointerType,
            srcEvent    : ev,

            /**
             * prevent the browser default actions
             * mostly used to disable scrolling of the browser
             */
            preventDefault: function() {
                if(this.srcEvent.preventManipulation) {
                    this.srcEvent.preventManipulation();
                }

                if(this.srcEvent.preventDefault) {
                    this.srcEvent.preventDefault();
                }
            },

            /**
             * stop bubbling the event up to its parents
             */
            stopPropagation: function() {
                this.srcEvent.stopPropagation();
            },

            /**
             * immediately stop gesture detection
             * might be useful after a swipe was detected
             * @return {*}
             */
            stopDetect: function() {
                return Hammer.detection.stopDetect();
            }
        };
    }
};

Hammer.PointerEvent = {
    /**
     * holds all pointers
     * @type {Object}
     */
    pointers: {},

    /**
     * get a list of pointers
     * @returns {Array}     touchlist
     */
    getTouchList: function() {
        var self = this;
        var touchlist = [];

        // we can use forEach since pointerEvents only is in IE10
        Object.keys(self.pointers).sort().forEach(function(id) {
            touchlist.push(self.pointers[id]);
        });
        return touchlist;
    },

    /**
     * update the position of a pointer
     * @param   {String}   type             Hammer.EVENT_END
     * @param   {Object}   pointerEvent
     */
    updatePointer: function(type, pointerEvent) {
        if(type == Hammer.EVENT_END) {
            this.pointers = {};
        }
        else {
            pointerEvent.identifier = pointerEvent.pointerId;
            this.pointers[pointerEvent.pointerId] = pointerEvent;
        }

        return Object.keys(this.pointers).length;
    },

    /**
     * check if ev matches pointertype
     * @param   {String}        pointerType     Hammer.POINTER_MOUSE
     * @param   {PointerEvent}  ev
     */
    matchType: function(pointerType, ev) {
        if(!ev.pointerType) {
            return false;
        }

        var types = {};
        types[Hammer.POINTER_MOUSE] = (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE || ev.pointerType == Hammer.POINTER_MOUSE);
        types[Hammer.POINTER_TOUCH] = (ev.pointerType == ev.MSPOINTER_TYPE_TOUCH || ev.pointerType == Hammer.POINTER_TOUCH);
        types[Hammer.POINTER_PEN] = (ev.pointerType == ev.MSPOINTER_TYPE_PEN || ev.pointerType == Hammer.POINTER_PEN);
        return types[pointerType];
    },


    /**
     * get events
     */
    getEvents: function() {
        return [
            'pointerdown MSPointerDown',
            'pointermove MSPointerMove',
            'pointerup pointercancel MSPointerUp MSPointerCancel'
        ];
    },

    /**
     * reset the list
     */
    reset: function() {
        this.pointers = {};
    }
};


Hammer.utils = {
    /**
     * extend method,
     * also used for cloning when dest is an empty object
     * @param   {Object}    dest
     * @param   {Object}    src
     * @parm    {Boolean}   merge       do a merge
     * @returns {Object}    dest
     */
    extend: function extend(dest, src, merge) {
        for (var key in src) {
            if(dest[key] !== undefined && merge) {
                continue;
            }
            dest[key] = src[key];
        }
        return dest;
    },


    /**
     * find if a node is in the given parent
     * used for event delegation tricks
     * @param   {HTMLElement}   node
     * @param   {HTMLElement}   parent
     * @returns {boolean}       has_parent
     */
    hasParent: function(node, parent) {
        while(node){
            if(node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    },


    /**
     * get the center of all the touches
     * @param   {Array}     touches
     * @returns {Object}    center
     */
    getCenter: function getCenter(touches) {
        var valuesX = [], valuesY = [];

        for(var t= 0,len=touches.length; t<len; t++) {
            valuesX.push(touches[t].pageX);
            valuesY.push(touches[t].pageY);
        }

        return {
            pageX: ((Math.min.apply(Math, valuesX) + Math.max.apply(Math, valuesX)) / 2),
            pageY: ((Math.min.apply(Math, valuesY) + Math.max.apply(Math, valuesY)) / 2)
        };
    },


    /**
     * calculate the velocity between two points
     * @param   {Number}    delta_time
     * @param   {Number}    delta_x
     * @param   {Number}    delta_y
     * @returns {Object}    velocity
     */
    getVelocity: function getVelocity(delta_time, delta_x, delta_y) {
        return {
            x: Math.abs(delta_x / delta_time) || 0,
            y: Math.abs(delta_y / delta_time) || 0
        };
    },


    /**
     * calculate the angle between two coordinates
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    angle
     */
    getAngle: function getAngle(touch1, touch2) {
        var y = touch2.pageY - touch1.pageY,
            x = touch2.pageX - touch1.pageX;
        return Math.atan2(y, x) * 180 / Math.PI;
    },


    /**
     * angle to direction define
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {String}    direction constant, like Hammer.DIRECTION_LEFT
     */
    getDirection: function getDirection(touch1, touch2) {
        var x = Math.abs(touch1.pageX - touch2.pageX),
            y = Math.abs(touch1.pageY - touch2.pageY);

        if(x >= y) {
            return touch1.pageX - touch2.pageX > 0 ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
        }
        else {
            return touch1.pageY - touch2.pageY > 0 ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
        }
    },


    /**
     * calculate the distance between two touches
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    distance
     */
    getDistance: function getDistance(touch1, touch2) {
        var x = touch2.pageX - touch1.pageX,
            y = touch2.pageY - touch1.pageY;
        return Math.sqrt((x*x) + (y*y));
    },


    /**
     * calculate the scale factor between two touchLists (fingers)
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    scale
     */
    getScale: function getScale(start, end) {
        // need two fingers...
        if(start.length >= 2 && end.length >= 2) {
            return this.getDistance(end[0], end[1]) /
                this.getDistance(start[0], start[1]);
        }
        return 1;
    },


    /**
     * calculate the rotation degrees between two touchLists (fingers)
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    rotation
     */
    getRotation: function getRotation(start, end) {
        // need two fingers
        if(start.length >= 2 && end.length >= 2) {
            return this.getAngle(end[1], end[0]) -
                this.getAngle(start[1], start[0]);
        }
        return 0;
    },


    /**
     * boolean if the direction is vertical
     * @param    {String}    direction
     * @returns  {Boolean}   is_vertical
     */
    isVertical: function isVertical(direction) {
        return (direction == Hammer.DIRECTION_UP || direction == Hammer.DIRECTION_DOWN);
    },


    /**
     * stop browser default behavior with css props
     * @param   {HtmlElement}   element
     * @param   {Object}        css_props
     */
    stopDefaultBrowserBehavior: function stopDefaultBrowserBehavior(element, css_props) {
        var prop,
            vendors = ['webkit','khtml','moz','ms','o',''];

        if(!css_props || !element.style) {
            return;
        }

        // with css properties for modern browsers
        for(var i = 0; i < vendors.length; i++) {
            for(var p in css_props) {
                if(css_props.hasOwnProperty(p)) {
                    prop = p;

                    // vender prefix at the property
                    if(vendors[i]) {
                        prop = vendors[i] + prop.substring(0, 1).toUpperCase() + prop.substring(1);
                    }

                    // set the style
                    element.style[prop] = css_props[p];
                }
            }
        }

        // also the disable onselectstart
        if(css_props.userSelect == 'none') {
            element.onselectstart = function() {
                return false;
            };
        }
    }
};

Hammer.detection = {
    // contains all registred Hammer.gestures in the correct order
    gestures: [],

    // data of the current Hammer.gesture detection session
    current: null,

    // the previous Hammer.gesture session data
    // is a full clone of the previous gesture.current object
    previous: null,

    // when this becomes true, no gestures are fired
    stopped: false,


    /**
     * start Hammer.gesture detection
     * @param   {Hammer.Instance}   inst
     * @param   {Object}            eventData
     */
    startDetect: function startDetect(inst, eventData) {
        // already busy with a Hammer.gesture detection on an element
        if(this.current) {
            return;
        }

        this.stopped = false;

        this.current = {
            inst        : inst, // reference to HammerInstance we're working for
            startEvent  : Hammer.utils.extend({}, eventData), // start eventData for distances, timing etc
            lastEvent   : false, // last eventData
            name        : '' // current gesture we're in/detected, can be 'tap', 'hold' etc
        };

        this.detect(eventData);
    },


    /**
     * Hammer.gesture detection
     * @param   {Object}    eventData
     * @param   {Object}    eventData
     */
    detect: function detect(eventData) {
        if(!this.current || this.stopped) {
            return;
        }

        // extend event data with calculations about scale, distance etc
        eventData = this.extendEventData(eventData);

        // instance options
        var inst_options = this.current.inst.options;

        // call Hammer.gesture handlers
        for(var g=0,len=this.gestures.length; g<len; g++) {
            var gesture = this.gestures[g];

            // only when the instance options have enabled this gesture
            if(!this.stopped && inst_options[gesture.name] !== false) {
                // if a handler returns false, we stop with the detection
                if(gesture.handler.call(gesture, eventData, this.current.inst) === false) {
                    this.stopDetect();
                    break;
                }
            }
        }

        // store as previous event event
        if(this.current) {
            this.current.lastEvent = eventData;
        }

        // endevent, but not the last touch, so dont stop
        if(eventData.eventType == Hammer.EVENT_END && !eventData.touches.length-1) {
            this.stopDetect();
        }

        return eventData;
    },


    /**
     * clear the Hammer.gesture vars
     * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
     * to stop other Hammer.gestures from being fired
     */
    stopDetect: function stopDetect() {
        // clone current data to the store as the previous gesture
        // used for the double tap gesture, since this is an other gesture detect session
        this.previous = Hammer.utils.extend({}, this.current);

        // reset the current
        this.current = null;

        // stopped!
        this.stopped = true;
    },


    /**
     * extend eventData for Hammer.gestures
     * @param   {Object}   ev
     * @returns {Object}   ev
     */
    extendEventData: function extendEventData(ev) {
        var startEv = this.current.startEvent;

        // if the touches change, set the new touches over the startEvent touches
        // this because touchevents don't have all the touches on touchstart, or the
        // user must place his fingers at the EXACT same time on the screen, which is not realistic
        // but, sometimes it happens that both fingers are touching at the EXACT same time
        if(startEv && (ev.touches.length != startEv.touches.length || ev.touches === startEv.touches)) {
            // extend 1 level deep to get the touchlist with the touch objects
            startEv.touches = [];
            for(var i=0,len=ev.touches.length; i<len; i++) {
                startEv.touches.push(Hammer.utils.extend({}, ev.touches[i]));
            }
        }

        var delta_time = ev.timeStamp - startEv.timeStamp,
            delta_x = ev.center.pageX - startEv.center.pageX,
            delta_y = ev.center.pageY - startEv.center.pageY,
            velocity = Hammer.utils.getVelocity(delta_time, delta_x, delta_y);

        Hammer.utils.extend(ev, {
            deltaTime   : delta_time,

            deltaX      : delta_x,
            deltaY      : delta_y,

            velocityX   : velocity.x,
            velocityY   : velocity.y,

            distance    : Hammer.utils.getDistance(startEv.center, ev.center),
            angle       : Hammer.utils.getAngle(startEv.center, ev.center),
            direction   : Hammer.utils.getDirection(startEv.center, ev.center),

            scale       : Hammer.utils.getScale(startEv.touches, ev.touches),
            rotation    : Hammer.utils.getRotation(startEv.touches, ev.touches),

            startEvent  : startEv
        });

        return ev;
    },


    /**
     * register new gesture
     * @param   {Object}    gesture object, see gestures.js for documentation
     * @returns {Array}     gestures
     */
    register: function register(gesture) {
        // add an enable gesture options if there is no given
        var options = gesture.defaults || {};
        if(options[gesture.name] === undefined) {
            options[gesture.name] = true;
        }

        // extend Hammer default options with the Hammer.gesture options
        Hammer.utils.extend(Hammer.defaults, options, true);

        // set its index
        gesture.index = gesture.index || 1000;

        // add Hammer.gesture to the list
        this.gestures.push(gesture);

        // sort the list by index
        this.gestures.sort(function(a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return this.gestures;
    }
};


Hammer.gestures = Hammer.gestures || {};

/**
 * Custom gestures
 * ==============================
 *
 * Gesture object
 * --------------------
 * The object structure of a gesture:
 *
 * { name: 'mygesture',
 *   index: 1337,
 *   defaults: {
 *     mygesture_option: true
 *   }
 *   handler: function(type, ev, inst) {
 *     // trigger gesture event
 *     inst.trigger(this.name, ev);
 *   }
 * }

 * @param   {String}    name
 * this should be the name of the gesture, lowercase
 * it is also being used to disable/enable the gesture per instance config.
 *
 * @param   {Number}    [index=1000]
 * the index of the gesture, where it is going to be in the stack of gestures detection
 * like when you build an gesture that depends on the drag gesture, it is a good
 * idea to place it after the index of the drag gesture.
 *
 * @param   {Object}    [defaults={}]
 * the default settings of the gesture. these are added to the instance settings,
 * and can be overruled per instance. you can also add the name of the gesture,
 * but this is also added by default (and set to true).
 *
 * @param   {Function}  handler
 * this handles the gesture detection of your custom gesture and receives the
 * following arguments:
 *
 *      @param  {Object}    eventData
 *      event data containing the following properties:
 *          timeStamp   {Number}        time the event occurred
 *          target      {HTMLElement}   target element
 *          touches     {Array}         touches (fingers, pointers, mouse) on the screen
 *          pointerType {String}        kind of pointer that was used. matches Hammer.POINTER_MOUSE|TOUCH
 *          center      {Object}        center position of the touches. contains pageX and pageY
 *          deltaTime   {Number}        the total time of the touches in the screen
 *          deltaX      {Number}        the delta on x axis we haved moved
 *          deltaY      {Number}        the delta on y axis we haved moved
 *          velocityX   {Number}        the velocity on the x
 *          velocityY   {Number}        the velocity on y
 *          angle       {Number}        the angle we are moving
 *          direction   {String}        the direction we are moving. matches Hammer.DIRECTION_UP|DOWN|LEFT|RIGHT
 *          distance    {Number}        the distance we haved moved
 *          scale       {Number}        scaling of the touches, needs 2 touches
 *          rotation    {Number}        rotation of the touches, needs 2 touches *
 *          eventType   {String}        matches Hammer.EVENT_START|MOVE|END
 *          srcEvent    {Object}        the source event, like TouchStart or MouseDown *
 *          startEvent  {Object}        contains the same properties as above,
 *                                      but from the first touch. this is used to calculate
 *                                      distances, deltaTime, scaling etc
 *
 *      @param  {Hammer.Instance}    inst
 *      the instance we are doing the detection for. you can get the options from
 *      the inst.options object and trigger the gesture event by calling inst.trigger
 *
 *
 * Handle gestures
 * --------------------
 * inside the handler you can get/set Hammer.detection.current. This is the current
 * detection session. It has the following properties
 *      @param  {String}    name
 *      contains the name of the gesture we have detected. it has not a real function,
 *      only to check in other gestures if something is detected.
 *      like in the drag gesture we set it to 'drag' and in the swipe gesture we can
 *      check if the current gesture is 'drag' by accessing Hammer.detection.current.name
 *
 *      @readonly
 *      @param  {Hammer.Instance}    inst
 *      the instance we do the detection for
 *
 *      @readonly
 *      @param  {Object}    startEvent
 *      contains the properties of the first gesture detection in this session.
 *      Used for calculations about timing, distance, etc.
 *
 *      @readonly
 *      @param  {Object}    lastEvent
 *      contains all the properties of the last gesture detect in this session.
 *
 * after the gesture detection session has been completed (user has released the screen)
 * the Hammer.detection.current object is copied into Hammer.detection.previous,
 * this is usefull for gestures like doubletap, where you need to know if the
 * previous gesture was a tap
 *
 * options that have been set by the instance can be received by calling inst.options
 *
 * You can trigger a gesture event by calling inst.trigger("mygesture", event).
 * The first param is the name of your gesture, the second the event argument
 *
 *
 * Register gestures
 * --------------------
 * When an gesture is added to the Hammer.gestures object, it is auto registered
 * at the setup of the first Hammer instance. You can also call Hammer.detection.register
 * manually and pass your gesture object as a param
 *
 */

/**
 * Hold
 * Touch stays at the same place for x time
 * @events  hold
 */
Hammer.gestures.Hold = {
    name: 'hold',
    index: 10,
    defaults: {
        hold_timeout    : 500,
        hold_threshold  : 1
    },
    timer: null,
    handler: function holdGesture(ev, inst) {
        switch(ev.eventType) {
            case Hammer.EVENT_START:
                // clear any running timers
                clearTimeout(this.timer);

                // set the gesture so we can check in the timeout if it still is
                Hammer.detection.current.name = this.name;

                // set timer and if after the timeout it still is hold,
                // we trigger the hold event
                this.timer = setTimeout(function() {
                    if(Hammer.detection.current.name == 'hold') {
                        inst.trigger('hold', ev);
                    }
                }, inst.options.hold_timeout);
                break;

            // when you move or end we clear the timer
            case Hammer.EVENT_MOVE:
                if(ev.distance > inst.options.hold_threshold) {
                    clearTimeout(this.timer);
                }
                break;

            case Hammer.EVENT_END:
                clearTimeout(this.timer);
                break;
        }
    }
};


/**
 * Tap/DoubleTap
 * Quick touch at a place or double at the same place
 * @events  tap, doubletap
 */
Hammer.gestures.Tap = {
    name: 'tap',
    index: 100,
    defaults: {
        tap_max_touchtime   : 250,
        tap_max_distance    : 10,
        tap_always          : true,
        doubletap_distance  : 20,
        doubletap_interval  : 300
    },
    handler: function tapGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // previous gesture, for the double tap since these are two different gesture detections
            var prev = Hammer.detection.previous,
                did_doubletap = false;

            // when the touchtime is higher then the max touch time
            // or when the moving distance is too much
            if(ev.deltaTime > inst.options.tap_max_touchtime ||
                ev.distance > inst.options.tap_max_distance) {
                return;
            }

            // check if double tap
            if(prev && prev.name == 'tap' &&
                (ev.timeStamp - prev.lastEvent.timeStamp) < inst.options.doubletap_interval &&
                ev.distance < inst.options.doubletap_distance) {
                inst.trigger('doubletap', ev);
                did_doubletap = true;
            }

            // do a single tap
            if(!did_doubletap || inst.options.tap_always) {
                Hammer.detection.current.name = 'tap';
                inst.trigger(Hammer.detection.current.name, ev);
            }
        }
    }
};


/**
 * Swipe
 * triggers swipe events when the end velocity is above the threshold
 * @events  swipe, swipeleft, swiperight, swipeup, swipedown
 */
Hammer.gestures.Swipe = {
    name: 'swipe',
    index: 40,
    defaults: {
        // set 0 for unlimited, but this can conflict with transform
        swipe_max_touches  : 1,
        swipe_velocity     : 0.7
    },
    handler: function swipeGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // max touches
            if(inst.options.swipe_max_touches > 0 &&
                ev.touches.length > inst.options.swipe_max_touches) {
                return;
            }

            // when the distance we moved is too small we skip this gesture
            // or we can be already in dragging
            if(ev.velocityX > inst.options.swipe_velocity ||
                ev.velocityY > inst.options.swipe_velocity) {
                // trigger swipe events
                inst.trigger(this.name, ev);
                inst.trigger(this.name + ev.direction, ev);
            }
        }
    }
};


/**
 * Drag
 * Move with x fingers (default 1) around on the page. Blocking the scrolling when
 * moving left and right is a good practice. When all the drag events are blocking
 * you disable scrolling on that area.
 * @events  drag, drapleft, dragright, dragup, dragdown
 */
Hammer.gestures.Drag = {
    name: 'drag',
    index: 50,
    defaults: {
        drag_min_distance : 10,
        // set 0 for unlimited, but this can conflict with transform
        drag_max_touches  : 1,
        // prevent default browser behavior when dragging occurs
        // be careful with it, it makes the element a blocking element
        // when you are using the drag gesture, it is a good practice to set this true
        drag_block_horizontal   : false,
        drag_block_vertical     : false,
        // drag_lock_to_axis keeps the drag gesture on the axis that it started on,
        // It disallows vertical directions if the initial direction was horizontal, and vice versa.
        drag_lock_to_axis       : false,
        // drag lock only kicks in when distance > drag_lock_min_distance
        // This way, locking occurs only when the distance has become large enough to reliably determine the direction
        drag_lock_min_distance : 25
    },
    triggered: false,
    handler: function dragGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // max touches
        if(inst.options.drag_max_touches > 0 &&
            ev.touches.length > inst.options.drag_max_touches) {
            return;
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.distance < inst.options.drag_min_distance &&
                    Hammer.detection.current.name != this.name) {
                    return;
                }

                // we are dragging!
                Hammer.detection.current.name = this.name;

                // lock drag to axis?
                if(Hammer.detection.current.lastEvent.drag_locked_to_axis || (inst.options.drag_lock_to_axis && inst.options.drag_lock_min_distance<=ev.distance)) {
                    ev.drag_locked_to_axis = true;
                }
                var last_direction = Hammer.detection.current.lastEvent.direction;
                if(ev.drag_locked_to_axis && last_direction !== ev.direction) {
                    // keep direction on the axis that the drag gesture started on
                    if(Hammer.utils.isVertical(last_direction)) {
                        ev.direction = (ev.deltaY < 0) ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
                    }
                    else {
                        ev.direction = (ev.deltaX < 0) ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
                    }
                }

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                // trigger normal event
                inst.trigger(this.name, ev);

                // direction event, like dragdown
                inst.trigger(this.name + ev.direction, ev);

                // block the browser events
                if( (inst.options.drag_block_vertical && Hammer.utils.isVertical(ev.direction)) ||
                    (inst.options.drag_block_horizontal && !Hammer.utils.isVertical(ev.direction))) {
                    ev.preventDefault();
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Transform
 * User want to scale or rotate with 2 fingers
 * @events  transform, pinch, pinchin, pinchout, rotate
 */
Hammer.gestures.Transform = {
    name: 'transform',
    index: 45,
    defaults: {
        // factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
        transform_min_scale     : 0.01,
        // rotation in degrees
        transform_min_rotation  : 1,
        // prevent default browser behavior when two touches are on the screen
        // but it makes the element a blocking element
        // when you are using the transform gesture, it is a good practice to set this true
        transform_always_block  : false
    },
    triggered: false,
    handler: function transformGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // atleast multitouch
        if(ev.touches.length < 2) {
            return;
        }

        // prevent default when two fingers are on the screen
        if(inst.options.transform_always_block) {
            ev.preventDefault();
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                var scale_threshold = Math.abs(1-ev.scale);
                var rotation_threshold = Math.abs(ev.rotation);

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(scale_threshold < inst.options.transform_min_scale &&
                    rotation_threshold < inst.options.transform_min_rotation) {
                    return;
                }

                // we are transforming!
                Hammer.detection.current.name = this.name;

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                inst.trigger(this.name, ev); // basic transform event

                // trigger rotate event
                if(rotation_threshold > inst.options.transform_min_rotation) {
                    inst.trigger('rotate', ev);
                }

                // trigger pinch event
                if(scale_threshold > inst.options.transform_min_scale) {
                    inst.trigger('pinch', ev);
                    inst.trigger('pinch'+ ((ev.scale < 1) ? 'in' : 'out'), ev);
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Touch
 * Called as first, tells the user has touched the screen
 * @events  touch
 */
Hammer.gestures.Touch = {
    name: 'touch',
    index: -Infinity,
    defaults: {
        // call preventDefault at touchstart, and makes the element blocking by
        // disabling the scrolling of the page, but it improves gestures like
        // transforming and dragging.
        // be careful with using this, it can be very annoying for users to be stuck
        // on the page
        prevent_default: false,

        // disable mouse events, so only touch (or pen!) input triggers events
        prevent_mouseevents: false
    },
    handler: function touchGesture(ev, inst) {
        if(inst.options.prevent_mouseevents && ev.pointerType == Hammer.POINTER_MOUSE) {
            ev.stopDetect();
            return;
        }

        if(inst.options.prevent_default) {
            ev.preventDefault();
        }

        if(ev.eventType ==  Hammer.EVENT_START) {
            inst.trigger(this.name, ev);
        }
    }
};


/**
 * Release
 * Called as last, tells the user has released the screen
 * @events  release
 */
Hammer.gestures.Release = {
    name: 'release',
    index: Infinity,
    handler: function releaseGesture(ev, inst) {
        if(ev.eventType ==  Hammer.EVENT_END) {
            inst.trigger(this.name, ev);
        }
    }
};

// node export
if( typeof module === 'object' && typeof module.exports === 'object'){
    module.exports = Hammer;
}
// just window export
else {
    window.Hammer = Hammer;

    // requireJS module definition
    if(typeof window.define === 'function' && window.define.amd) {
        window.define('hammer', [], function() {
            return Hammer;
        });
    }
}
})(this);

(function($) {
    /**
     * bind dom events
     * this overwrites addEventListener
     * @param el
     * @param types
     * @param handler
     */
    Hammer.event.bindDom = function(el, types, handler) {
        $(el).on(types, function(ev) {
            handler.call(this, ev.originalEvent);
        });
    };

    /**
     * the methods are called by the instance, but with the jquery plugin
     * we use the jquery event methods instead.
     * @this Hammer.Instance
     */
    Hammer.Instance.prototype.on = function(types, handler) {
        $(this.element).on(types, handler);
    };
    Hammer.Instance.prototype.off = function(types, handler) {
        $(this.element).off(types, handler);
    };


    /**
     * trigger events
     * this is called by the gestures to trigger an event like 'tap'
     * @this Hammer.Instance
     * @param gesture
     * @param data
     */
    Hammer.Instance.prototype.trigger = function(gesture, data){
        var event = jQuery.Event(gesture, data);
        event.type = gesture;
        $(this.element).trigger(event);
    };


    /**
     * jQuery plugin
     * @param   object  config
     * @return  jQuery
     */
    $.fn.hammer = function(config) {
        return this.each(function() {
            var el = $(this);
            if(!el.data("hammer")) {
                var inst = Hammer(this, config || {});
                el.data("hammer", inst);
            }
        });
    };

})(jQuery);

/*globals Hammer, jQuery */

/*
 * Hammer.js jQuery plugin based on Ha
 *
 * @author Łukasz Lipiński (uzza17@gmail.com)
 * @version 0.1
 * @license Released under the MIT license
 * @see https://github.com/lukaszlipinski/jquery.hammer
 */

(function($, Hammer) {
    "use strict";

    var event_names = [
            'hold', 'tap', 'doubletap', 
            'transformstart', 'transform', 'transformend', 
            'dragstart', 'drag', 'dragend', 
            'swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown',
            'release'
        ],
        event_name, i, l = event_names.length;

    $.each(event_names, function(i) {
        event_name = event_names[i];

        (function(event_name) {
            $.event.special[event_name] = {
                add : function(e) {
                    var $currentTarget = $(this),
                        $targets = e.selector ? $currentTarget.find(e.selector) : $currentTarget;

                    $targets.each(function(index, el) {
                        var hammer = new Hammer(el),
                            $el = $(el);

                        $el.data("hammer", hammer);

                        hammer['on' + event_name] = (function($el) {
                            return function(event) {
                                $el.trigger($.Event(event_name, event));
                            };
                        }($el));
                    });
                },

                teardown: function(namespaces) {
                    var $el = $(this);

                    try{
                        $el.data('hammer').destroy();
                        $el.removeData('hammer');
                    }catch(e) {}
                }
            };
        }(event_name));
    });
}(jQuery, Hammer));

(function($, UI){


    function Button(element, options){

        var $this = this;

        this.element = $(element);
        this.options = $.extend({}, options);
        this.hidden  = $('<input type="hidden" name="" value="" />');
        
        if(this.options.active) this.element.addClass("active");

        if(this.options.name){
            this.hidden.attr("name", this.options.name).val($this.element.hasClass("active") ? 1:0);
            this.element.after(this.hidden);
        }

        this.element.on("click", function(e){
            e.preventDefault();
            
            $this.toggle();
            $(this).blur();
        });
    }
    
    $.extend(Button.prototype, {
        options: {
            active: false,
            name: false
        },

        toggle: function() {

            this.element.toggleClass("active");
            this.hidden.val(this.element.hasClass("active") ? 1:0);
        },

        activate: function(){
            this.element.addClass("active");
            this.hidden.val(1);
        },

        deactivate: function() {
            this.element.removeClass("active");
            this.hidden.val(0);
        },

        val: function() {
            return this.hidden.val();
        }
    });

    function ButtonRadioGroup(element, options) {
        
        var $this    = this, 
            $element = $(element);

        this.options = $.extend({}, this.options, options);
        this.hidden  = $('<input type="hidden" name="" value="" />');

        if(this.options.name){
            this.hidden.attr("name", this.options.name).val(this.options.value);
            $element.after(this.hidden);

            if(this.options.value !== false){
                $element.find(".button[data-value='"+this.options.value+"']:first").addClass("active");
            }
        }

        this.element = $element.on("click", ".button", function(e) {
            e.preventDefault();
            $element.find(".button").not(this).removeClass("active");
            $element.trigger("change", [$(this).addClass("active").blur()]);

            $this.hidden.val($(this).data("value"));
        });
    }

    $.extend(ButtonRadioGroup.prototype, {
        options: {
            name: false,
            value: false
        },

        val: function() {
            return this.hidden.val();
        }
    });

    UI.fn.button     = Button;
    UI.fn.radiogroup = ButtonRadioGroup;

})(jQuery, jQuery.baseui);

(function($, UI){


    var active   = false,
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
    };

    $.extend(Dropdown.prototype, {

        options: {

        },

        toggle: function() {
            this.element.toggleClass("active");
            active = this.element.hasClass("active") ? this.element : false;
        }

    });

    $(document).on(UI.util.clickevent, function() {
        $(".active[data-baseui^='dropdown']").not(active).removeClass("active");
        active = false;
    });

    UI.fn.dropdown = Dropdown;

})(jQuery, jQuery.baseui);

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

})(jQuery, jQuery.baseui);

(function($, UI){
    

    var tpl = '<div class="modal-win animated"><div></div><div class="modal-close"></div></div>',
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
                'effect'    : false,

                //events
                'beforeShow'  : function(){},
                'beforeClose' : function(){},
                'onClose'     : function(){}
        }, options);

        if(current){
            UI.modal.close();
        }

        current = $(tpl).addClass(o.effect);

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
            top: 0, left: 0, position: 'absolute', opacity:0.6
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

    $(document).on('keydown.modal', function (e) {
        if (current && e.keyCode === 27) { // ESC
            e.preventDefault();
            UI.modal.close();
        }
    }).delegate(".modal-close", UI.util.clickevent, function(){
        UI.modal.close();
    });

    $win.on('resize.modal', function(){
        
        if(!current) return;

        UI.modal.fit();
    });

})(jQuery, jQuery.baseui);

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

    UI.fn.tip = Tooltip;

    $(function(){
        $tooltip = $('<div class="baseui-tooltip"></div>').appendTo("body");
    });

})(jQuery, jQuery.baseui);

(function($, UI){


    var $this = null;
    
    UI.topbox = $this = {
        
        defaults: {
            'title'     : false,
            'closeOnEsc': true,
            'closeBtn'  : true,
            'theme'     : 'default',
            'height'    : 'auto',
            'width'     : 'auto',
            'speed'     : 500,
            'easing'    : 'swing',
            'buttons'   : false,
            
            //private
            '_status'   : true,

            //events
            'beforeShow'  : function(){},
            'beforeClose' : function(){},
            'onClose'     : function(){}
        },

        box: null,
        options: {},
        persist: false,
        
        show: function(content, options) {
            
            if(this.box) {this.clear();}
            
            this.options = $.extend({}, this.defaults, options);
			
            var tplDlg = '<div class="topbox-window '+$this.options.theme+'">';
                tplDlg+=  '<div class="topbox-close"></div>';
                tplDlg+=  '<div class="topbox-title" style="display:none;"></div>';
                tplDlg+=  '<div class="topbox-content"><div class="topbox-innercontent"></div></div>';
                tplDlg+=  '<div class="topbox-buttonsbar"><div class="topbox-buttons"></div></div>';
                tplDlg+= '</div>';
            
            this.box = $(tplDlg);

            if(!this.options.closeBtn) {
                this.box.find(".topbox-close").hide();
            } else {
                this.box.find(".topbox-close").bind(UI.util.clickevent,function(){
                    $this.close();
                });   
            }
            
            if(this.options.buttons){
                
                var btns = this.box.find(".topbox-buttons");
                
                $.each(this.options.buttons, function(caption, fn){
                    
					$('<button type="button" class="topbox-button">'+caption+'</button>').bind("click", function(e){
						e.preventDefault();
						fn.apply($this);
                    }).appendTo(btns);
                });
            }else{
               this.box.find(".topbox-buttonsbar").hide(); 
            }
            
            if($this.options.height != 'auto'){
                this.box.find(".topbox-innercontent").css({
                  'height'    : $this.options.height,
                  'overflow-y': 'auto'
                });
            }
            
            if($this.options.width != 'auto'){
                this.box.find(".topbox-innercontent").css({
                  'width'     : $this.options.width,
                  'overflow-x': 'auto'
                });
            }
      
            this.setContent(content).setTitle(this.options.title);
			
			
            this.box.css({
                'opacity'   : 0,
                'visibility': 'hidden'
            }).appendTo("body");
			
			this.options.beforeShow.apply(this);
			
            this.box.css({
                'left' : ($(window).width()/2-$this.box.width()/2),
                'top'  : ((-1.5) * $this.box.height())
            }).css({
                'visibility': 'visible'
            }).animate({
                top: 0,
                opacity: 1
            }, this.options.speed, this.options.easing, function(){
            
                //focus
                if($this.box.find(":input:first").length) {
                    $this.box.find(":input:first").focus();
                }
            
            });
            
            $(window).bind('resize.topbox', function(){
                
				$this.center();
				
				$this.overlay.hide().css({
					width: $(document).width(),
					height: $(document).height()
				}).show();
            });
            
            // bind esc
            if(this.options.closeOnEsc){
                $(document).bind('keydown.topbox', function (e) {
                    if (e.keyCode === 27) { // ESC
                        e.preventDefault();
                        $this.close();
                    }
                });
            }
            
            this.showOverlay();
			
            return this;
        },
        
        close: function(){
            
            if(!this.box) {return;}
            
            if(this.options.beforeClose.apply(this)===false){
                return this;
            }
            
            this.overlay.fadeOut();
            
            this.box.animate({ 
                'top'  : ((-1.5) * $this.box.height()),
                'opacity': 0
            }, this.options.speed, this.options.easing, function(){
                $this.clear();
            });
			
			this.options.onClose.apply(this);

            return this;
        },

        blockUI: function(content, options) {
            
            var o = $.extend({
                closeBtn: false,
                closeOnEsc: false
            }, options);
            
            this.show(content, o);
        },
		
		'confirm': function(content, fn, options){

			var defaults = {
				title : UI.topbox.i18n.Confirm,
				buttons: {}
			};

            defaults["buttons"][UI.topbox.i18n.Ok] = function(){ fn.apply($this);};
            defaults["buttons"][UI.topbox.i18n.Cancel] = function(){ this.close();};
			
			this.show(content, $.extend(defaults, options));
		
		},

        'input': function(message, fn, options){
            
            var defaults = {
                title : UI.topbox.i18n.Input,
                value : "",
                buttons: {}
            };

            defaults["buttons"][UI.topbox.i18n.Ok] = function(){
                        
                var val = this.box.find("input[type=text]:first").val();
                fn.apply($this,[val]);
            };

            defaults["buttons"][UI.topbox.i18n.Cancel] = function(){ this.close();};

            var content = '<form class="topbox-input-form">';
                content+= '<div class="topbox-input-message">'+message+'</div>';
                content+= '<input type="text" class="topbox-input" style="width:100%;" />';
                content+= '</form>';

            content = $(content).bind("submit", function(e){
                e.preventDefault();

                UI.topbox.box.find(".topbox-buttons button:first").trigger("click");
            });

            var o = $.extend(defaults, options);

            content.find("input[type=text]:first").val(o.value);

            this.show(content, o);
        
        },
		
		'alert': function(content, options){
			
            var defaults = {
                title : UI.topbox.i18n.Alert,
                buttons: {}
            };

            defaults["buttons"][UI.topbox.i18n.Ok] = function(){ this.close();};
            
            this.show(content, $.extend(defaults, options));
		},
        
        clear: function(){
            
            if(!this.box) {return;}
            
            if (this.persist) {
                this.persist.appendTo(this.persist.data("tb-persist-parent"));
                this.persist = false;
            }
            
            this.box.stop().remove();
            this.box = null;
            
            if(this.overlay){
                this.overlay.hide();
            }
            
            $(window).unbind('resize.topbox');
            $(document).unbind('keydown.topbox');
            
            return this;
        },
		
		center: function(){
			
			if(!this.box) {return;}
			
			this.box.css({
				'left': ($(window).width()/2-$this.box.width()/2)
			});
		},
        
        setTitle: function(title){ 
          
          if(!this.box) {return;}
          
          if(title){
            this.box.find(".topbox-title").html(title).show();
          }else{
            this.box.find(".topbox-title").html(title).hide();
          }
          
          return this;
        },

        setContent: function(content){ 
            
            if(!this.box) {return;}
            
            if (typeof content === 'object') {
				// convert DOM object to a jQuery object
				content = content instanceof jQuery ? content : $(content);
                
                if(content.parent().length) {
                    this.persist = content;
                    this.persist.data("tb-persist-parent", content.parent());
                }
			}
			else if (typeof content === 'string' || typeof content === 'number') {
				// just insert the data as innerHTML
				content = $('<div></div>').html(content);
			}
			else {
				// unsupported data type!
				content = $('<div></div>').html('SimpleModal Error: Unsupported data type: ' + typeof content);
			}
          
            content.appendTo(this.box.find(".topbox-innercontent").html(''));

            return this;
        },
        
        showOverlay: function(){
            
            if(!this.box) {return;}
            
            if(!this.overlay){
                if(!$("#topbox-overlay").length) {
                    $("<div>").attr('id','topbox-overlay').css({
                        top: 0,
                        left: 0,
                        position: 'absolute'
                    }).prependTo('body');
                                        
                }
                
                this.overlay = $("#topbox-overlay");
            }
            
            this.overlay.css({
                width: $(document).width(),
                height: $(document).height()
            }).show();
        }
    };

    UI.topbox.i18n = {
        "Cancel" : "Cancel",
        "Ok"     : "Ok",
        "Confirm": "Please confirm",
        "Input"  : "Please input",
        "Alert"  : "Alert"   
    };

    $.fn.uitopbox = function() {

        var args    = arguments;
        var options = args[0] ? args[0] : {};

        return this.each(function() {
            
			var ele = $(this);
			
			ele.bind("click", function(e) {
				
				e.preventDefault();
				
				var target = String(ele.data('target') || ele.attr("href")),
					type   = ele.data("type") || "html";
				
				//html source
				if(target[0]=="#" || type=="html") {
					UI.topbox.show($(target), options);
				}

			});
        });
    };
})(jQuery, jQuery.baseui);

(function($, UI) {

    var matchers    = {},
        win         = $(window),
        event       = 'resize orientationchange',

    MatchHeight = function(element, options) {

        var $this     = this;

        this.options  = $.extend({}, this.options, options);

        this.element  = $(element);
        this.columns  = this.element.children();
        this.elements = this.options.target ? this.element.find(this.options.target): this.columns;

        win.bind(event, (function(){
            var fn = function(){ $this.match(); };

            $(function(){
                fn();
                win.on("load", fn);
            });

            return UI.util.debounce(fn, 150);
        })());
    };

    $.extend(MatchHeight.prototype, {

        options: {
            "target": false
        },

        match: function() {

            this.revert();

            var stacked = Math.ceil(100 * parseFloat(this.columns.eq(0).css('width'))/parseFloat(this.columns.eq(0).parent().css('width'))) >= 100 ? true:false,
                max     = 0,
                $this   = this;

            if(stacked) {
                return;
            }

            this.elements.each(function() {
                max = Math.max(max, $(this).outerHeight());
            }).each(function(i) {

                var element   = $(this),
                    boxheight = element.css("box-sizing")=="border-box" ? "outerHeight" : "height",
                    box       = $this.columns.eq(i),
                    height    = (element.height() + (max - box[boxheight]()));

                element.css('min-height', height + 'px');
            });

            return this;
        },

        revert: function() {
            this.elements.css('min-height', '');
            return this;
        }

    });

    UI.fn["match-height"] = MatchHeight;

})(jQuery, jQuery.baseui);