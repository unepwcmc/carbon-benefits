var PolygonView = Backbone.View.extend({
    COLOR: 'rgba(255, 204, 204, 0.5)',

    initialize: function() {
      _.bindAll(this, 'click', 'remove', 'update', 'render');
      this.mapview = this.options.mapview;
      this.polygon = this.options.polygon;
      this.color = this.options.color || this.COLOR;
      this.opacity = this.options.opacity || 0.7;
    },

    path: function() {
      return _.map(this.polygon.polygon.path, function(p) {
        return new google.maps.LatLng(p[0], p[1]);
      });
    },

    bounds: function() {
      var b = new google.maps.LatLngBounds();
      _.each(this.polygon.path, function(p) {
        b.extend(new google.maps.LatLng(p[0], p[1]));
      });
      return b;
    },

    render: function() {
      var self = this;
      var fillColor = this.color;
      var fillOpacity = this.opacity;

      var poly = new google.maps.Polygon({
        paths: this.path(),
        fillOpacity: fillOpacity,
        fillColor: fillColor,
        strokeColor: "#fff",
        strokeWeight: 2.5
      });
      this.poly = poly;
      this.show();
      google.maps.event.addListener(poly, 'click', this.click);
      google.maps.event.addListener(poly, 'mouseover', function(e) {
        self.trigger('mouseover', this, e);
      });
      google.maps.event.addListener(poly, 'mouseout', function(e) {
        self.trigger('mouseout', this, e);
      });
      return this;
    },

    update: function() {
      this.poly.setPaths(this.path());
    },

    click: function() {
      this.trigger('click', this);
    },

    hide: function() {
      this.poly.setMap(null);
    },

    show: function() {
      this.poly.setMap(this.mapview.map);
    },

    remove: function() {
      if(this.poly) {
        this.unbind();
        this.poly.setMap(null);
      }
    }
});
