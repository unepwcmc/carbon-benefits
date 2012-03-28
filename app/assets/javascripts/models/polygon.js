App.Polygon = Backbone.Model.extend({
  defaults: function() {
    return {
      "path": null,
      "polygon_class_id": null,
      "layer_id": null
    };
  },
  toJSON: function() {
    return { polygon: _.clone( this.attributes ) }
  }
});
