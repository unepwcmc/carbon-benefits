$(function() {
  // View to filter the polygons in an uploaded layer
  window.PolygonFilterView = Backbone.View.extend({
    template: JST["templates/polygon_filter"],

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
      $(this.el).html(this.template({polygons: this.polygon_names_collection.models}));
    },

    show: function() {
      $(this.el).slideDown();
    },

    hide: function() {
      $(this.el).slideUp();
    }

  });
}());
