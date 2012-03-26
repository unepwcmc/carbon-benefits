App.modules.Data = function(app) {
    var Layer = Backbone.Model.extend({
        defaults: function() {
            return {
                'id': null,
                "polygons": new App.PolygonCollection(),
                "classes": new Array(),
                "selected_class": null,
                "selected_colour": null,
                "stats": new Object()
            };
        },

        initialize: function() {
          _.bindAll(this, '_save');
          this.bind('change:polygons', this.fetch);
          this.save = _.debounce(this._save, 800);
        },

        select_class: function(id, colour) {
          this.set({'selected_colour': colour});
          this.set({'selected_class': id});
          this.save();
        },

        _save: function() {
            return this.collection.save();
        },

        update_polygon: function(index, path) {
            this.get('polygons').at(index).set({the_geom: path});
            this.trigger('change:polygons', this);
            this.trigger('change', this);
            this.save();
        },

        remove_polygon: function(index) {
            this.get('polygons').remove(this.get('polygons').at(index));
            this.trigger('change:polygons', this);
            this.trigger('change', this);
            this.save();
        },

        add_polygon: function(path) {
            if(this.get('total')) {
                app.Log.error("can't add polygons to total");
                return;
            }
            this.get('polygons').add(new App.Polygon({
              the_geom: path,
              layer_id: this.id
            }));

            // activate the signal machinery
            this.trigger('change:polygons', this);
            this.trigger('change', this);
            this.save();
        },

        clear: function() {
            this.set({'polygons': new App.PolygonCollection(), 'stats': {}});
            this.trigger('change:polygons', this);
            this.trigger('change:stats', this);
            this.trigger('change', this);
            this.save();
        },

        fetch: function() {
            var self = this;
            // get data using polygons
            if(self.get('polygons').length === 0) {
                return;
            }
            app.WS.CartoDB.calculate_stats(this.get('polygons'), function(stats) {
              var new_stats = _.extend(self.get('stats'), stats);
              self.set({'stats': new_stats});
              //trigger manually
              self.trigger('change:stats', self);
              self.trigger('change', self);
              self.save();
              if(self.bus) {
                //self.bus.emit('loading_end');
              }
            });
        },

        toJSON: function() {
            //TODO: optimize this using a real shallow copy
            return JSON.parse(JSON.stringify(this.attributes));
        },

        is_total: function() {
          return this.get('total') !== undefined;
        }

    });

    var WorkModel = Backbone.Collection.extend({

        API_URL: app.config.API_URL,
        model: Layer,

        initialize: function() {
          _.bindAll(this, 'on_layer_change', 'on_add', 'on_add_all');
          this.bind('add', this.on_add);
          this.bind('reset', this.on_add_all);
        },

        set_work_id: function(id) {
          this.work_id = id;
          if(app.config.LOCAL_STORAGE) {
            this.localStorage = new Store(this.work_id);
          }
        },

        url: function() {
            return this.API_URL + '/' + this.work_id;
        },

        create: function(success, fail) {
            var self = this;
            function _done(data) {
                // default data
                self.set_work_id(data.id);
                self.new_layer({total: true});
                self.new_layer();
                self.save({
                    success: function() {
                        success(data.id);
                    }
                });
            }
            if(!app.config.LOCAL_STORAGE) {
                $.ajax({
                    url: this.API_URL,
                    type: 'POST'})
                .done(_done)
                .fail(fail);
            } else {
                // simulte some lag
                setTimeout(function() {
                    _done({id: S4() + S4()});
                }, 500);
            }
        },

        // create empty layer
        new_layer: function(defaults, options) {
            var r = new Layer();
            r.set(defaults);
            if(this.bus) {
                r.bus = this.bus;
            }
            this.add(r);
            return r.cid;
        },

        get_total_layer: function() {
           for(var i = 0; i < this.models.length; ++i) {
              var r = this.models[i];
              if(r.get('total')) {
                return r;
              }
           }
        },

        get_layers: function() {
            return _.filter(this.models, function(r) {
                return r.get('total')=== undefined;
            });
        },

        on_add: function(r) {
            r.bind('change', this.on_layer_change);
            if(this.bus) {
                r.bus = this.bus;
            }
        },

        on_add_all: function() {
            var self = this;
            this.each(function(r) { self.on_add(r); });
        },

        delete_layer: function(rid) {
            var r = this.getByCid(rid);
            this.remove(r);
            r.unbind('change', this.on_layer_change);
            //r.remove();
            this.save();
            this.aggregate_stats();
        },

        get_all_polygons: function() {
          // get all polygons in the same array
          var layers = _(this.get_layers()).filter(function(r) {
                return r.get('stats') !== undefined;
          });
          var polygons = [];
          _.each(layers, function(r) {
                _.each(r.get('polygons'), function(p) {
                    polygons.push(p);
                });
          });
          return polygons;
        },

        // agregate all the stats in the total layer
        aggregate_stats: function() {
          var self = this;
          var layers = _(this.get_layers()).filter(function(r) {
                return r.get('stats') !== undefined;
          });
          var polygons = self.get_all_polygons();

          app.WS.CartoDB.aggregate_stats(layers, polygons, function(stats) {
            if(self.get_total_layer()) {
              self.get_total_layer().set({stats: stats});
            }
          });
        },

        on_layer_change: function(r) {
            if(!r.is_total()) {
              this.aggregate_stats();
            }
            this.trigger('layer_change', r);
        },

        save: function(options) {
            Backbone.sync('update', this, options);
        },

        parse: function(data) {
          _.each(data, function(layer, key){
            _.each(layer.polygons, function(polygon, polygon_key){
              data[key].polygons[polygon_key] = new App.Polygon(polygon);
            });
          });
          return data;
        },

        polygon_count: function() {
            return this.reduce(function(memo, r) {
                return memo + r.get('polygons').length;
            }, 0);
        }

    });

    app.Work = Class.extend({

        init: function(bus) {
            var self = this;
            _.bindAll(this, 'on_polygon', 'on_work', 'on_new_layer','add_layer', 'on_create_work', 'active_layer', 'on_remove_polygon', 'on_update_polygon', 'on_clear', 'on_delete_layer', 'on_select_class');
            this.bus = bus;
            this.work = new WorkModel();
            this.work.bus = bus;
            this.active_layer_id = -1;
            this.bus.link(this, {
                'polygon': 'on_polygon',
                'work': 'on_work',
                'model:add_layer': 'add_layer',
                'model:create_work': 'on_create_work',
                'model:active_layer': 'active_layer',
                'model:remove_polygon': 'on_remove_polygon',
                'model:update_polygon': 'on_update_polygon',
                'model:clear': 'on_clear',
                'model:delete_layer': 'on_delete_layer',
                'model:select_class': 'on_select_class'
            });

            this.work.bind('add', this.on_new_layer);
            this.work.bind('reset', function() {
                app.Log.log("reset", this.models);
                self.bus.emit('view:remove_all');
                this.each(function(r) {
                    self.on_new_layer(r);
                });
            });
            this.work.bind('layer_change', function(r) {
                self.bus.emit('view:update_layer', r.cid, r.toJSON());
            });
        },


        on_remove_polygon: function(rid, index) {
            var r = this.work.getByCid(rid);
            if(r) {
                r.remove_polygon(index);
            } else {
                app.Log.error("can't get layer: ", rid);
            }
        },

        on_update_polygon: function(rid, index, new_path) {
            var r = this.work.getByCid(rid);
            if(r) {
                r.update_polygon(index, new_path);
            } else {
                app.Log.error("can't get layer: ", rid);
            }
        },

        on_delete_layer: function(rid) {
            var self = this;
            // if we only have the total and another layer
            // dont remove, only clear polygons
            if(this.work.models.length == 2) {
                this.on_clear();
            } else {
                this.work.delete_layer(rid);
                this.bus.emit('view:remove_all');
                this.work.each(function(r) {
                    self.on_new_layer(r);
                });
            }
        },
        
        on_select_class: function(rid, class_id, colour) {
          var r = this.work.getByCid(rid);
          if(r) {
              r.select_class(class_id, colour);
          } else {
              app.Log.error("can't get layer: ", rid);
          }
        },

        on_polygon: function(polygon) {
            // append polygon to current layer
            var r = this.work.getByCid(this.active_layer_id);
            var path = _.map(polygon.paths[0], function(p) {
              return new google.maps.LatLng(p[0], p[1]);
            });
            var area = google.maps.geometry.spherical.computeArea(path);
            if(area > app.config.MAX_POLYGON_AREA) {
              this.bus.emit("view:show_error", "We are sorry, but the polygon you are trying to analyze is too big.");
            } else {
              r.add_polygon(polygon.paths[0]);
            }
            app.Log.log("area: ", area);
        },

        on_clear: function() {
            var r = this.work.getByCid(this.active_layer_id);
            r.clear();
        },

        on_work: function(work_id) {
            var self = this;
            app.Log.log("on work: ", work_id);
            this.work.set_work_id(work_id);
            this.work.fetch({
                success: function() {
                    self.bus.emit("app:work_loaded");
                }
            });
            //TODO: does not exists
        },

        on_new_layer: function(r) {
            this.bus.emit('view:new_layer', r.cid, r.toJSON());
            this.active_layer(r.cid);
        },

        on_create_work: function() {
            var self = this;
            this.work.create(function(id) {
                self.bus.emit("app:route_to", "w/" + id);
            }, function() {
                app.Log.error("failed creating work id");
            });

        },

        add_layer: function() {
            this.work.new_layer();
            this.work.save();
            this.work.fetch();
        },

        update_layer: function() {
        },

        active_layer: function(rid) {
            this.active_layer_id = rid;
            var r = this.work.getByCid(rid);
            if(r) {
              this.bus.emit('view:show_layer', rid, r.toJSON());
            }
        },

        select_layer: function() {
        }
    });
};
