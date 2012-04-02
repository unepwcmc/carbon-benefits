$(function() {
  // View to filter the polygons in an uploaded layer
  window.PolygonFilterView = Backbone.View.extend({
    template: JST["templates/polygon_filter"],

    events: {
      'change input': 'changeSelected'
    },

    initialize: function() {
      _.bindAll(this, 'render');
      this.layer_id = this.options.layer_id;
      this.polygon_names_collection = new PolygonNamesCollection();
      this.polygon_names_collection.layer_id = this.layer_id;
      this.polygon_names_collection.fetch({
        success: this.render
      });
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
      console.log(selected);
    }

  });
}());
