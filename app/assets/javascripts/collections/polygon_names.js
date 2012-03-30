$(function() {
  // Collection of user upload polygon names and their IDs
  window.PolygonNamesCollection = Backbone.Collection.extend({
    model: PolygonName,
    url: function() {
      return '/layers/' + this.layer_id + '/polygons';
    }
  });

}());
