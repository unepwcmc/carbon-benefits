$(function() {
  // View to filter the polygons in an uploaded layer
  window.PolygonFilterView = Backbone.View.extend({
    template: JST["templates/polygon_filter"],

    initialize: function() {
      this.render();
      this.polygon_names_collection = new PolygonNamesCollection({layer_id: this.layer_id});
    },

    render: function() {
      $(this.el).html(this.template({}));
    },

    show: function() {
      $(this.el).slideDown();
    },

    hide: function() {
      $(this.el).slideUp();
    }

  });
}());
