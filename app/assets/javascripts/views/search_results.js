var SearchResults = Backbone.Collection.extend({
    model: Result,

    initialize: function() {
      this.geocoder = new google.maps.Geocoder();
    },

    fetch: function() {
      var self = this;
      this.geocoder.geocode( { 'address': this.to_search }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          self.reset(results);
        }
      });
    }
});
