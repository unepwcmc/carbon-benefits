$(function() {
  // Collection of user upload polygon names and their IDs
  window.PolygonNamesCollection = Backbone.Collection.extend({
    model: PolygonName,
    url: function() {
      return '/layers/' + this.layer_id + '/polygon_names';
    },
    setSelected: function() {
      // Sets the selected state of the polygons
      var i, il;
      var selectedLayerIds = carbon.work.work.findByLayerId(this.layer_id).get('selected_polygon_ids');
     

      this.each(function(polygon) {
        // Reset polygon...
        polygon.set({'selected': false});

        for (i=0, il=selectedLayerIds.length; i < il; i=i+1) {
          // Set selected if polygon id is in selectedLayerIds
          if (parseInt(selectedLayerIds[i], 10) === polygon.get('cartodb_id')) {
            polygon.set({'selected': true});
          }
        }
      });
    }
  });

}());
