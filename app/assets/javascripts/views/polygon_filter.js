$(function() {
  // View to filter the polygons in an uploaded layer
  window.PolygonFilterView = Backbone.View.extend({
    tagName: 'ul',
    className: 'polygon_filter',
    template: JST["templates/polygon_filter"],

    events: {
      'change input': 'changeSelected'
    },

    initialize: function() {
      _.bindAll(this, 'render', 'changeSelected');
      this.bus = this.options.bus;
      this.polygon_names_collection = new PolygonNamesCollection();
    },

    renderTo: function(layer_id) {
      // render the view inside the given element, updating the layer if needed
      if (layer_id !== this.polygon_names_collection.layer_id) {
        // if we've updated the layer_id, fetch then render
        this.polygon_names_collection.layer_id = layer_id;
        this.polygon_names_collection.fetch({
          success: this.render
        });
      } else {
        // nothing's changed, just render
        this.render();
      }
      return this;
    },

    render: function() {
      var templateHtml = this.template({polygons: this.polygon_names_collection.models});
      $(this.el).html(templateHtml);
    },

    show: function() {
      $(this.el).slideDown();
    },

    hide: function() {
      $(this.el).slideUp();
    },

    changeSelected: function() {
      // called when user toggles a layer
      var selected = [];
      _.each(this.$('input[name=selected_layers]:checked'), function(input) {
        selected.push($(input).val());
      });
      
      console.log('selected polygons selected ' + selected + ' in layer ' + this.layer_id);
      this.bus.emit('layer:select_polygons', this.polygon_names_collection.layer_id, selected);
    }

  });
}());
