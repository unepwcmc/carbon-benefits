$(function() {
  // View to filter filter the polygons in an uploaded layer
  window.PolygonFilterView = Backbone.View.extend({
    template: JST["templates/polygon_filter"],

    initialize: function() {
      this.render();
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
