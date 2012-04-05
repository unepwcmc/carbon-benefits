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
     
      // Parse ids to ints for comparison
      _.each(selectedLayerIds, function(idString, index) {
        selectedLayerIds[index] = parseInt(idString, 10);
      })

      this.each(function(polygon) {
        // Reset polygon...
        polygon.set({'selected': false});

        for (i=0, il=selectedLayerIds.length; i < il; i=i+1) {
          // Set selected if polygon id is in selectedLayerIds
          if (selectedLayerIds[i] === polygon.get('cartodb_id')) {
            polygon.set({'selected': true});
            break;
          }
        }
      });
    }
  });

}());
