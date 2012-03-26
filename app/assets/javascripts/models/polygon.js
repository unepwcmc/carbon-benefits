(function() {  
  // Polygon, stored in cartodb
  // belongs_to layer
  App.Polygon = Backbone.Model.extend({
      defaults: function() {
          return {
              'cartodb_id': null,
              "the_geom": null,
              "class": null,
              "layer_id": null
          };
      },

      idAttribute: 'cartodb_id',
      url: '/polygons/',
      initialize: function() {
        //_.bindAll(this, '_save');

        this.save();
      }
  });
})();
