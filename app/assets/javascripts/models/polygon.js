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

App.PolygonCollection = Backbone.Collection.extend({
    model: App.Polygon,
    url: '/polygons',
    findByClass: function(klass) {
       if (typeof(klass) === 'undefined' || klass === null){
         //return everything if class isn't valid
         console.log('getting all');
         return this.models;
       } else {
         // Get all the models for klass
         console.log('filtering by ' + klass);
         return this.filter(function(poly){
           return poly.class_id === klass;
         });
       }
    }
});