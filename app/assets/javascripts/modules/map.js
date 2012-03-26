
/*
 ===============================================
 control map related things
 ===============================================
*/
App.modules.Map = function(app) {

  // edit, delete popup shown when user is editing a poly
  var Popup = Backbone.View.extend({
    el: $('#polygon_popup'),

    events: {
      'click #delete': 'remove',
      'click #done': 'edit'
    },

    initialize: function() {
      _.bindAll(this, 'show', 'hide', 'remove', 'edit');
      this.map = this.options.mapview;
      this.smooth = this.options.smooth || true;
      this.smooth_k = 0.08;
      this.target_pos = null;
      this.current_pos = null;
    },

    remove: function(e) {
      e.preventDefault();
      this.trigger('remove');
    },

    edit: function(e) {
      e.preventDefault();
      this.trigger('edit');
    },

    show: function(at) {
      var self = this;
      var px = this.map.projector.transformCoordinates(at);
      if(!this.timer) {
        this.timer = setInterval(function() {
          self.current_pos.x += (self.target_pos.x - self.current_pos.x)*self.smooth_k;
          self.current_pos.y += (self.target_pos.y - self.current_pos.y)*self.smooth_k;
          self.set_pos(self.current_pos);
        }, 20);
        this.current_pos = px;
      }
      this.target_pos = px;

      if(!this.smooth) {
        set_pos(px);
      }
    },

    set_pos: function(p) {
      this.el.css({
        top: this.current_pos.y - 20 - 50,
        left: this.current_pos.x
      });
      this.el.show();
    },

    hide: function() {
      this.el.hide();
      if(this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  });

  //TODO: refactor base popup
  var ProtectedZonePopup = Backbone.View.extend({
    el: $('#protected_popup'),

    events: {
      'click .close': 'hide',
      'click #add_protected': 'add_protected_area'
    },

    initialize: function() {
      _.bindAll(this, 'show', 'hide');
      this.map = this.options.mapview;
      this.name_el = this.$('.name');
      this.protected_zone = null;
    },

    show: function(at, protected_zone_info) {
      var self = this;
      self.name_el.html("<a target='_blank' href='http://protectedplanet.net/sites/" + protected_zone_info.slug + "'>" + protected_zone_info.name + "</a>");
      this.protected_zone = protected_zone_info;
      self.at = at;
      self.set_pos(at);
      this.el.show();
    },

    set_pos: function(at) {
      var p = this.map.projector.transformCoordinates(at);
      this.el.css({
        top: p.y - 120,
        left: p.x - 30
      });
    },

    move: function() {
      if(this.at)
        this.set_pos(this.at);
    },

    hide: function(e) {
      if(e) {
        e.preventDefault();
      }
      this.el.hide();
      self.at = null;
    },

    add_protected_area: function(e) {
      var self = this;
      if(e) {
        e.preventDefault();
      }
      self.hide();
      app.WS.ProtectedPlanet.PA_polygon(this.protected_zone.id, function(geom) {
        // convert polygon lon, lat -> lat, lon
        var polygons = geom.the_geom.coordinates;
        if(geom.the_geom.type === "MultiPolygon") {
        } else {
          polygons = [polygons];
        }
        _(polygons).each(function(coord) {
          var polygon = _(coord).map(function(poly) {
            return _(poly).map(function(latlon) {
              return [latlon[1], latlon[0]];
            });
          });
          self.trigger('add_polygon', polygon);
        });
      });
    }
  });

  var PolygonAddPopup = Backbone.View.extend({
    el: $('#polygon_add_popup'),

    events: {
      'click #add': 'add',
      'click #cancel': 'cancel'
    },

    initialize: function() {
      _.bindAll(this, 'show', 'hide', 'add', 'cancel');
      this.map = this.options.mapview;
      this.smooth = this.options.smooth || true;
      this.smooth_k = 0.08;
      this.target_pos = null;
      this.current_pos = null;
    },

    add: function(e) {
      e.preventDefault();
      this.trigger('add');
    },

    cancel: function(e) {
      e.preventDefault();
      this.trigger('cancel');
    },

    show: function(at) {
      var self = this;
      var px = this.map.projector.transformCoordinates(at);
      if(!this.timer) {
        this.timer = setInterval(function() {
          self.current_pos.x += (self.target_pos.x - self.current_pos.x)*self.smooth_k;
          self.current_pos.y += (self.target_pos.y - self.current_pos.y)*self.smooth_k;
          self.set_pos(self.current_pos);
        }, 20);
        this.current_pos = px;
      }
      this.target_pos = px;

      if(!this.smooth) {
        set_pos(px);
      }
    },

    set_pos: function(p) {
      this.el.css({
        top: this.current_pos.y - 20 - 50,
        left: this.current_pos.x
      });
      this.el.show();
    },

    hide: function() {
      this.el.hide();
      if(this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  });

  app.Map = Class.extend({
    init: function(bus) {
      _.bindAll(this, 'show_layer', 'start_edit_polygon', 'end_edit_polygon', 'remove_polygon', 'disable_editing', 'enable_editing', 'enable_map_layer', 'reoder_layers', 'protected_area_click','reorder_layers', 'update_layer', 'remove_all', 'clear');
      var self = this;
      this.map = new MapView({el: $('.map_container')});
      this.seachbox = new Searchbox({el: $('.map_container .search')});
      this.layer_polygons = {};
      // add layers to the map
      _(app.config.MAP_LAYERS).each(function(layer) {
        self.map.add_layer(layer.name, layer);
        self.map.enable_map_layer(layer.name, layer.enabled);
      });

      this.popup = new Popup({mapview: this.map});
      this.protectedzone_popup = new ProtectedZonePopup({mapview: this.map});
      this.polygon_add_popup = new PolygonAddPopup({mapview: this.map});
      this.layer_editor = new LayerEditor({
        el: $('.layers'),
        bus: bus,
        layers: this.map.get_layers()
      });
      this.polygon_edit = new PolygonDrawTool({mapview: this.map});
      this.editing(false);
      this.polygons = [];
      this.bus = bus;

      this.movement_timeout = -1;

      bus.link(this, {
        'view:show_layer': 'show_layer',
        'view:update_layer': 'update_layer',
        'view:new_layer': 'update_layer',
        'view:remove_all': 'clear',
        'polygon': 'disable_editing',
        'map:edit_mode': 'enable_editing',
        'map:no_edit_mode': 'disable_editing',
        'map:enable_map_layer': 'enable_map_layer',
        'map:reorder_layers':'reorder_layers'
      });

      //bindings
      bus.attach(this.polygon_edit, 'polygon');
      this.popup.bind('edit', this.end_edit_polygon);
      this.popup.bind('remove', this.remove_polygon);
      this.map.bind('center_changed', function(pos) {
        self.protectedzone_popup.move(pos);
      });

      this.protectedzone_popup.bind('add_polygon', function(polygon) {
        self.bus.emit('polygon', {paths: polygon});
      });
      this.seachbox.bind('goto', function(latlng, bounds) {
        self.map.set_center(latlng);
        self.map.map.fitBounds(bounds);
      });
      this.show_controls(false);

      // when first vertex is created the tool allows to
      // click on a PA, in the next polygons is not allowed
      /*this.polygon_edit.bind('first_vertex', function() {
        self.map.unbind('click', self.protected_area_click);
      });*/
      $(document).keyup(function(e) {
        if (e.keyCode == 27) {
          if(self._editing) {
            self.editing(false);
            self.editing(true);
          }
        }
      });

    },

    work_mode: function() {
      $('.map_container').css({right: '352px'});
    },

    enable_map_layer: function(name, enable) {
      this.map.enable_map_layer(name, enable);
      if (name === 'protected areas'){
        // If the protected area layer is being switched, toggle the PA Popup
        this.togglePAPopup(enable);
      }
    },

    reoder_layers: function(new_order) {
      this.map.reoder_layers(new_order);
      this.layer_editor.render();
    },

    editing: function(b) {
      this._editing = b;
      this.polygon_edit.editing_state(b);
      this.togglePAPopup(!this._editing);
    },

    togglePAPopup: function(enable) {
      // either binds or unbinds the PA popup, depending on 'enable'
      // always try to unbind to avoid bind twice
      this.map.unbind('click', this.protected_area_click);
      if(!this._editing && enable) {
        this.map.bind('click', this.protected_area_click);
      }
    },

    protected_area_click: function(e) {
      var self = this;
      var pos = [e.latLng.lat(), e.latLng.lng()];
      app.WS.ProtectedPlanet.info_at(pos, function(data) {
        if(data) {
          self.protectedzone_popup.show(e.latLng, data);
        }
      });
    },

    disable_editing: function() {
      this.editing(false);
    },

    enable_editing: function() {
      this.editing(true);
    },

    update_layer: function(rid, data) {
      this.layer_polygons[rid] = data.polygons;
      this.show_layer(this.showing, data);
    },

    clear: function() {
      this.layer_polygons = {};
      this.remove_all();
    },

    remove_all: function() {
      var self = this;
      // clean
      _(self.polygons).each(function(p) {
        p.remove();
      });

      self.polygons = [];
    },

    // render polygons
    show_layer: function(rid, data) {
      this.showing = rid;
      var self = this;

      self.remove_all();

      // reorder - selected AOI's polygon should be at the top
      var selected = {}, others = {}, layer_polygons_ordered, x;
      _(this.layer_polygons).each(function(layer_polys, layer_id) {
        if(rid == layer_id) {
          selected[layer_id] = layer_polys;
        } else {
          others[layer_id] = layer_polys;
        }
      });
      layer_polygons_ordered = [others, selected];

      for(x in layer_polygons_ordered) {
        // recreate
        _(layer_polygons_ordered[x]).each(function(layer_polys, layer_id) {
          _(layer_polys).each(function(polygon, i) {
            var p = new PolygonView({
              mapview: self.map,
              polygon: polygon,
              color: rid == layer_id ? "#66CCCC": "#FFCC00"
            });
            p.layer = rid;
            p.polygon_id = i;
            if(rid == layer_id) {
              p.bind('click', self.start_edit_polygon);
            } else {
              p.bind('click', function(p) {
                self.finish_editing();
                self.editing_poly = p;
                p.hide();
                self.paths = [p.paths];
                self.polygon_edit.editing_state(false);
                self.polygon_edit.edit_polygon(self.paths, false);
                self.polygon_edit.bind('mousemove', function(p, e) {
                  self.polygon_add_popup.show(e.latLng);
                });
                self.map.bind('mousemove', function(e) {
                  self.polygon_add_popup.show(e.latLng);
                });
                self.polygon_add_popup.bind('add', function() {
                  self.polygon_edit.unbind('mousemove');
                  self.map.unbind('mousemove');
                  self.polygon_add_popup.hide();
                  self.finish_editing();

                  var p = self.editing_poly;
                  app.Log.debug("changing polygon", p.layer, p.polygon_id);
                  self.bus.emit('model:update_polygon', p.layer, p.polygon_id, self.paths[0]);
                });
                self.polygon_add_popup.bind('cancel', function() {
                  self.polygon_edit.unbind('mousemove');
                  self.map.unbind('mousemove');
                  self.polygon_add_popup.hide();
                  self.finish_editing();
                });
              });
            }
            self.polygons.push(p.render());
          });
        });
      }
    },

    start_edit_polygon: function(p) {
      var self = this;
      this.finish_editing();
      this.editing_poly = p;
      p.hide();
      this.paths = [p.polygon.the_geom];
      this.polygon_edit.editing_state(false);
      this.polygon_edit.edit_polygon(this.paths);
      this.polygon_edit.bind('mousemove', function(p, e) {
        self.popup.show(e.latLng);
      });
      this.map.bind('mousemove', function(e) {
        self.popup.show(e.latLng);
      });
    },

    finish_editing: function() {
      this.polygon_edit.unbind('mousemove');
      this.map.unbind('mousemove');
      this.popup.hide();
      this.polygon_edit.editing_state(true);
    },

    end_edit_polygon: function() {
      this.finish_editing();
      var p = this.editing_poly;
      app.Log.debug("changing polygon", p.layer, p.polygon_id);
      this.bus.emit('model:update_polygon', p.layer, p.polygon_id, this.paths[0]);
    },

    remove_polygon: function() {
      this.finish_editing();
      var p = this.editing_poly;
      this.bus.emit('model:remove_polygon', p.layer, p.polygon_id);
    },

    reorder_layers: function(order) {
      this.map.reorder_layers(order);
      this.layer_editor.render();
    },

    show_controls: function(show) {
      if(show) {
        this.map.show_controls();
        $('.layers').show();
        $('.search').show();
      } else {
        this.map.hide_controls();
        $('.layers').hide();
        $('.search').hide();
      }
    }
  });
};
