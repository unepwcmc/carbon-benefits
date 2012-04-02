$(function() {
  // Collection of user upload polygon names and their IDs
  window.PolygonName = Backbone.Model.extend({
    defaults: function() {
      return {
        "id": null,
        "name": null
      };
    }
  });
}());
