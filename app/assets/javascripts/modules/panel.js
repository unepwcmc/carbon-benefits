/*
 ===============================================
 information panel control
 ===============================================
*/


App.modules.Panel = function(app) {

    var Loader = Backbone.View.extend({
        
        initialize: function() {
            _.bindAll(this, 'show', 'hide');
            this.count = 0;
            this.interval = null;
        },

        show: function() {
            app.Log.log("loading");
            var el = $('.loader');
            el.show();
            this.count++;
            if(this.count === 1) {
                app.bus.emit("loading_started");
                /*this.interval = setInterval(function() {
                   var el = $('.loader');
                   el.show();
                }, 400);
                */
            }
        },

        hide: function() {
            if(this.count === 0) return;
            this.count--;
            if(this.count === 0) {
                app.bus.emit("loading_finished");
                var el = $('.loader');
                el.hide();
                //clearInterval(this.interval);
            }
        }
    });

    app.Panel = Class.extend({

        init: function(bus) {
            _.bindAll(this, 'on_new_layer', 'on_remove_all', 'on_update_layer', 'on_show_layer');

            var self = this;
            this.bus = bus;
            this.loader = new Loader();
            this.panel = new Panel({bus: this.bus});
            this.panel.bind('add_layer', function() {
                bus.emit('model:add_layer');
            });
            this.panel.tabs.bind('enable', function(cid) {
                bus.emit('model:active_layer', cid);
            });
            this.bus.link(this, {
                'view:new_layer': 'on_new_layer',
                'view:remove_all': 'on_remove_all',
                'view:update_layer': 'on_update_layer',
                'view:show_layer': 'on_show_layer'
            });
            this.bus.on('loading_start', function() {
                self.loader.show();
            });
            this.bus.on('loading_end', function() {
                self.loader.hide();
            });

            this.loader.hide();
        },

        on_new_layer: function(cid, data) {
            this.panel.add_layer(cid, data);
        },

        on_remove_all: function() {
            this.panel.remove_all();
        },

        on_update_layer: function(cid, r) {
            this.panel.update_layer(cid, r);
            if(r.polygons.length > 0 || r.is_uploaded) {
                this.show();
            }
        },

        on_show_layer: function(cid) {
            this.panel.show_layer(cid);
        },

        hide: function() {
            this.panel.hide();
        },

        show: function() {
            this.panel.show();
        }

    });

};
