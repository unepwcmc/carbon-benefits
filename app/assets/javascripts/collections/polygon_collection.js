(function() {
  // Stores the polygons in a layer
  // is initialized by layer fetch, and never fetches/saves itself
  App.PolygonCollection = Backbone.Collection.extend({
      model: App.Polygon,
      url: '/polygons',
      findByClass: function(klass) {
         if (typeof(klass) === 'undefined' || klass === null){
           //return everything if class isn't valid
           return this.models;
         } else {
           // Get all the models for klass
           return this.filter(function(poly){
             return poly.class_id === klass;
           });
         }
      }
  });
})();
