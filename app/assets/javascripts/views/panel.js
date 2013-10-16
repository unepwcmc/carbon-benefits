$(function() {
  window.Panel = Backbone.View.extend({
    el : $('#panel'),

    events: {
        'click #add_layer': 'create_layer'
    },

    initialize: function() {
      _.bindAll(this, 'add_layer', 'create_layer');
      var self = this;
      this.bus = this.options.bus;
      this.layers = [];
      this.layers_map = {};
      this.tabs = new Tabs({el: this.$('#tabs'), bus: this.bus});
      this.tabs.bind('enable', function() {});
      this.tab_contents = this.$('#tab_content');
      this.tabs_frozen = false;
      this.bus.on('loading_started', function() {
        _(self.layers).each(function(r) {
          r.loading(true);
        });
        self.bus.emit("freeze_tabs", true, '#tabs li:not(.enabled) a');
      });
      this.bus.on('loading_finished', function() {
        _(self.layers).each(function(r) {
          r.loading(false);
        });
        self.bus.emit("freeze_tabs", false, '#tabs li:not(.enabled) a');
      });
      this.bus.on("freeze_tabs", function(freeze, selectors) {
        self.freeze_tabs(freeze, selectors);
      });
    },

    create_layer: function(e) {
      e.preventDefault();
      if (this.tabs_frozen === true) {
        return;
      }
      this.trigger("add_layer");
    },

    add_layer: function(cid, data) {
      var r = new Layer({
        bus: this.bus,
        rid: cid
      });
      this.layers.push(r);
      this.layers_map[cid] = r;
      this.tab_contents.append(r.render(data).el);
      this.tabs.add_layer(cid, data);
    },

    remove_all: function() {
      this.tabs.clear();
      this.tab_contents.html('');
      for(var i = 0; i < this.layers.length; ++i) {
        delete this.layers[i];
      }
      this.layers_map = {};
      this.layers = [];
    },

    update_layer: function(cid, data) {
      this.layers_map[cid].render(data);
      this.tabs.update(cid, data);
    },

    show_layer: function(cid) {
      //hide all first
      _(this.layers).each(function(r) {
        if(r.rid != cid) {
          r.hide();
        }
      });
      this.layers_map[cid].show();
      this.tabs.show_tab(cid);
    },

    hide: function() {
      this.el.hide();
    },

    show: function() {
      this.el.show();
    },

    // If a calculation is still going, 
    // then opening a tab will create problems!
    freeze_tabs: function(freeze, selectors) {
      if (freeze) {
        $(selectors)
          .css("opacity", "0")
          .css("cursor", "default");
        this.tabs_frozen = true;
      } else {
        $(selectors)
          .css("opacity", "1")
          .css("cursor", "pointer");
        this.tabs_frozen = false;
      }
    }

  });
});
