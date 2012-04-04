App.modules.Data = function(app) {
    var Layer = Backbone.Model.extend({
        defaults: function() {
            return {
                'id': null,
                "polygons": new App.PolygonCollection(),
                "classes": new Array(),
                "selected_class_id": null,
                "selected_class": null,
                "selected_colour": null,
                "stats": new Object(),
                "is_uploaded": false
            };
        },

        initialize: function() {
          _.bindAll(this, '_save', 'sql_class_where_clause');
          this.bind('change:polygons', this.fetch);
          this.save = _.debounce(this._save, 800);
        },

        select_class: function(id, name, colour) {
          this.set({'selected_colour': colour});
          this.set({'selected_class': name});
          this.set({'selected_class_id': id});
          this.save();

          carbon.map.map.userLayers[this.id].changed = true;
          carbon.map.reorder_layers();
        },

        setSelectedPolygons: function(selected_ids) {
          // set the selected polygons from their cartodb_ids, and fetch the data
          this.set({'selected_polygon_ids': selected_ids});
          this.save();
          carbon.map.map.userLayers[this.id].changed = true;
          this.fetch();
        },

        _save: function() {
            return this.collection.save();
        },

        update_polygon: function(index, path) {
            this.get('polygons').at(index).set({path: path});
            this.trigger('change:polygons', this);
            this.trigger('change', this);
            this.save();
            this.get('polygons').at(index).save();
        },

        remove_polygon: function(index) {
            this.get('polygons').remove(this.get('polygons').at(index));
            this.trigger('change:polygons', this);
            this.trigger('change', this);
            this.save();
        },

        add_polygon: function(path) {
          var self = this;
            if(this.get('total')) {
                app.Log.error("can't add polygons to total");
                return;
            }
            this.polygon = new App.Polygon({path: path, layer_id: this.id });
            this.polygon.collection = this.get('polygons');
            this.get('polygons').create(this.polygon, {
              success: function(polygon) {
                self.polygon = polygon;
                // activate the signal machinery
                self.trigger('change:polygons', self);
                self.trigger('change', self);
                //self.save();
              },
              error: function(){
              }
            });
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
            var polygons = [];
            // get data using polygons
            if(self.get('polygons').length === 0 && !self.get('is_uploaded')) {
                return;
            }
            if (!self.get('is_uploaded')){
              polygons = this.get('polygons').findByClass(this.get('selected_class'));
            } else {
              // This is evil, but we test if this is an upload, we pass this magic object
              polygons = [{
                upload: true,
                layer_id: this.get('id'),
                sql_class_where_clause: this.sql_class_where_clause()
              }];
            }
            app.WS.CartoDB.calculate_stats(polygons, function(stats) {
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
        },

        sql_class_where_clause: function() {
          // Returns a SQL where clause to filter by the selected class and polygons, prefixed with 'AND'
          var sql = '', selected_polygon_ids = this.get('selected_polygon_ids');
          if(this.get('selected_class_id') !== null && this.get('selected_class_id') !== window.ALL_CLASSES){
            if(this.get('selected_class_id') === window.NO_CLASS){
              sql += ' AND class_id IS NULL';
            } else {
              sql += ' AND class_id = ' + this.get('selected_class_id');
            }
          }
          
          // Add SQL clause for selected polygon ids
          if (typeof(selected_polygon_ids) !== 'undefined' && selected_polygon_ids.length > 0) {
            sql += ' AND cartodb_id IN (';
            sql += selected_polygon_ids.join(',');            
            sql += ')';
          }
          return sql;
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

        findByLayerId: function(layer_id) {
          // returns the first layer in the collection with the specified layer id
          var i, il;
          for (i=0, il=this.models.length; i < il; i=i+1) {
            if (this.models[i].id === layer_id) return this.models[i];
          }
          return null;
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
              _.each(r.get('polygons').findByClass(r.get('selected_class')), function(p) {
                  polygons.push(p);
              });
          });
          return polygons;
        },

        // aggregate all the stats in the total layer
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
          var layer_polys;
          _.each(data, function(layer, key){
            layer_polys = [];
            _.each(layer.polygons, function(polygon, polygon_key){
              layer_polys.push(new App.Polygon(polygon));
            });
            data[key].polygons = new App.PolygonCollection(layer_polys);
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
            _.bindAll(this, 'on_polygon', 'on_work', 'on_new_layer','add_layer', 'on_create_work', 'active_layer', 'on_remove_polygon', 'on_update_polygon', 'on_clear', 'on_delete_layer', 'on_select_class', 'on_select_polygons');
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
                'model:select_class': 'on_select_class',
                'layer:select_polygons': 'on_select_polygons'
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
                var data = r.toJSON();
                data['class_where_clause'] = r.sql_class_where_clause;
                self.bus.emit('view:update_layer', r.cid, data);
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
          var class_name = class_id;
          if(r) {
              _.each(r.get('classes'), function(colour_class) {
                if(colour_class[2] == class_id) {
                  colour_class[1] = colour;
                  class_name = colour_class[0];
                }
              });
              $(".classes_list .select_class[data-id='" + class_id + "']").data('colour', colour).find('i').css('background-color', colour);
              r.select_class(class_id, class_name, colour);
              r.fetch();
          } else {
              app.Log.error("can't get layer: ", rid);
          }
        },
        
        on_select_polygons: function(layer_id, selected_ids) {
          // find the layer that has been selected on, and set the selection
          var layer = this.work.findByLayerId(layer_id);
          layer.setSelectedPolygons(selected_ids);
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
                    // fetch any un-stated layers
                    self.get_stats_if_missing();
                }
            });
            //TODO: does not exists
        },

        get_stats_if_missing: function() {
          // Gets the aggregate stats for layers if any are as yet uncalculated
          var self = this;
          this.work.each(function(layer) {
            var key, keyCount;
            if (layer.get('polygons').length > 0 || layer.get('is_uploaded')) {
              // if the layer has polygons, it should have stats
              keyCount = 0;
              for(key in layer.get('stats')){
                keyCount = keyCount + 1;
              }
              if (keyCount === 0) {
                // If layer doesn't yet have stats, load all stats and exit
                layer.fetch();
                return self.work.on_layer_change(layer);
              }
            }
          });
        },

        on_new_layer: function(r) {
            var data = r.toJSON();
            // the tile layer needs the class_where_clause
            data['class_where_clause'] = r.sql_class_where_clause;

            this.bus.emit('view:new_layer', r.cid, data);
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
            var data = r.toJSON();
            // the tile layer needs the class_where_clause
            data['class_where_clause'] = r.sql_class_where_clause;
            if(r) {
              this.bus.emit('view:show_layer', rid, data);
            }
        },

        select_layer: function() {
        }
    });
};
