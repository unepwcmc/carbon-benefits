var PolygonDrawEditTool = PolygonDrawTool.extend({
    initialize: function() {
        this.constructor.__super__.initialize.call(this);
        this.final_polygon = new google.maps.Polygon({
          path:[],
          //strokeColor: "#DC143C",
          strokeColor: "#0099CC",
          strokeOpacity: 1.0,
          fillColor: 'rgba(102, 204, 204, 0.3)',
          fillOpacity: 0.5,
          strokeWeight: 1,
          map: this.map
        });
    },

    editing_state: function(editing) {
        if(editing) {
            this.mapview.bind('click', this.add_vertex);
        } else {
            this.reset();
            this.final_polygon.setPath([]);
            this.mapview.unbind('click', this.add_vertex);
        }
    },

    add_vertex: function(e) {
        this.final_polygon.setPath([]);
        var latLng = e.latLng;
        var marker = this._add_vertex(latLng);
        var self = this;
        if (this.vertex.length === 1) {
            google.maps.event.addListener(marker, "click", function() {
                self.create_polygon(self.vertex);
            });
        }
    },

    create_polygon: function(vertex) {
        // polygon style
        this.final_polygon.setPath(this.polyline.getPath());
        this.reset();
        var v = _.map(vertex, function(p) { return [p.lat(), p.lng()]; });
        this.trigger('polygon', {path: v});
    }
});
