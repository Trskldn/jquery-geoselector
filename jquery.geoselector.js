// ---------------------------------
// ---------- geoSelector ----------
// ---------------------------------
// Brief plugin description
// ------------------------

;(function ($, window, document, undefined) {
    
    var pluginName = 'geoselector';

    function Plugin (element, options) {
        this.element = element;
        this.$element = $(element);
        this._defaults = $.fn[pluginName].defaults;
        if ($.isNumeric(options)) options = {regionID: options};
        this.options = $.extend( {}, this._defaults, options );
        this.init();
    }

    $.extend(Plugin.prototype, {

        init: function () {
            this.constructDom();
            this.bindEvents();
            if ($.isNumeric(this.options.regionID)) this.loadCitys(this.options.regionID);                       
        },

        // create dom
        constructDom: function() {
            this.$element.addClass(pluginName);
            this.$input  = $('<input "type=text" placeholder="введите регион"/>').appendTo(this.$element);
            this.$regionDom = $("<div/>", { "class" : "regions"}).appendTo(this.$element);
            this.$cityDom = $("<div/>", {"class" : "citys"}).appendTo(this.$element);
        },

        // Remove plugin instance completely
        destroy: function() {
            this.unbindEvents();
            this.$element.removeData();
        },

        // Bind events that trigger methods
        bindEvents: function() {
            var plugin = this;
            
            plugin.$regionDom.on('click'+'.'+pluginName, "a", function(evt) {
                var regId = $.data( this, "regid");

                evt && evt.preventDefault();
                $.isNumeric(regId) && plugin.loadCitys(regId);
            });

            plugin.$input.on(this.options.bindEvent+'.'+pluginName, $.proxy(plugin.onInput, plugin));
        },

        defer: function(fcn, delay){
            var self = this,
                timer = setTimeout(
                            function(){
                                if(!timer){
                                    return;
                                }
                                timer = null;
                                fcn();
                            },
                            delay || 0
                    );

            return {
                remove: function(){
                    if(timer){
                        clearTimeout(timer);
                        timer = null;
                    }
                    return null; 
                }
            };
        },

        onInput: function(e) {
            if(this._queryDeferHandle){
                this._queryDeferHandle = this._queryDeferHandle.remove();
            }
            if (this.$input.val().length >= this.options.minInputChar) {
                this._queryDeferHandle = this.defer($.proxy(this.startSearchRegion, this), this.options.searchDelay);
            }
        },

        startSearchRegion: function() {
            var val = this.$input.val(),
                self = this;

            $.getJSON(this.options.regionUrl, {name: val})
                .done(function(data) {
                    if (!data || $.isArray(data)) self.callback("onGsError", "data is not an array"); 
                    self.callback("onGsData", data);
                    self.renderRegion(data);
                })
                .fail(function(jqxhr, textStatus, error) {
                    self.callback("onGsError", textStatus);
                });
        },

        renderRegion: function(data) {
            var self = this
                regList = $("<ul/>");

            self.renderCitys([]);
            self.$regionDom.html("");
            $.each(data, function(i, item) {
                ($("<li/>"))
                    .append($("<a/>", {"text": item[1],"data": {"regid": item[0]}, "href": "#" }))
                    .appendTo(regList);
            });
            regList.appendTo(self.$regionDom);
        },

        unbindEvents: function() {
            this.$element.off('.'+pluginName);
        },

        loadCitys: function(regId) {
            var self = this;

            $.ajax({
              dataType: "json",
              url: this.options.cityUrl,
              data: {region: regId},
              beforeSend: $.proxy(self.callback, self, "onGsCityStart")
            })
            .done(function(data) {
                self.options.regionID = regId;
                self.callback("onGsCityData", data);
                self.renderCitys(data);
            });          
        },

        renderCitys: function(data) {
            var self = this,
                cityList = $("<ul/>");

            self.$cityDom.html("");
            $.each(data, function(i, item) {
                ($("<li/>", {"text": item[1] })).appendTo(cityList);
            });
               
            cityList.appendTo(self.$cityDom); 
        },

        get: function(name) {
            return this.options[name];
        },

        set: function(name, value) {
            return this.options[name] = value;
        },

        callback: function(name) {
            var fnc = this.options.events[name];

            if ($.isFunction(fnc)) {
                fnc.apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }

    });

    $.fn[pluginName] = function (options) {
        var args = Array.prototype.slice.call(arguments, 1),
            retvals = [];

        this.each(function() {
            var geoInst = $.data( this, "plugin_" + pluginName );

            if ( !geoInst ) {
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            } else {
                switch(typeof options) {
                    case "number":
                        geoInst.loadCitys(options);                       
                    break;
                    case "string":
                        retvals.push(geoInst[options].apply(geoInst, args));
                    break;
                }
            }
        });
        
        switch (retvals.length) {
            case 0:
                return this;
            case 1:
                return retvals[0];
            default:
                return retvals;
        }
    };

    $.fn[pluginName].defaults = {
        // задержка в миллисекундах,междутемкакпользователь закончил печатать
        // запрос, и отправкой самого запроса 
        searchDelay: 200,

        //юрл для получения регионов
        regionUrl: "http://evildevel.com/Test/Region",

        // юрл для получения городов 
        cityUrl: "http://evildevel.com/Test/City",

        // Регион по умолчанию
        regionID: undefined,

        // Минимальноче количество символов                                                       
        // в имени региона, после которого будет 
        // производиться запрос на поиск
        minInputChar: 1,

        // Событие, на которое "повешан" поиск
        bindEvent: 'keyup',

        events: {
            //Происходит при получении 
            // списка регионов с сервера, данные в data
            onGsData: function() {},

            // Происходит при ошибке, текст ошибки в text
            onGsError: function() {},

            // Происходит сразу перед отправкой 
            // запроса на поиск городов
            onGsCityStart: function() {},
            
            // Происходит при получении списка 
            // городов с сервера, данные в data
            onGsCityData: function() {}
        }
    };

})( jQuery, window, document );