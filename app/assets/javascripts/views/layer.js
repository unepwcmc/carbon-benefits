$(function() {
  window.Layer = Backbone.View.extend({
      template: _.template('<span class="color <%=normalized_name%>">&nbsp</span><%= name %>'),

      tagName: 'li',
      
      LEGENDS: {
          'carbon': 'layer_carbon_legend.png',
          'carbon sequestration': 'layer_carbon_seq_legend.png',
          'restoration potential': 'layer_res_pot_legend.png',
          'forest status': 'layer_forest_status_legend.png'
      },

      events: {
        'click': 'toggle'
      },

      initialize: function(layer) {
          var self = this;
          this.layer = this.options.layer;
          this.bus = this.options.bus;
          this.bus.on('map:enable_layer', function(name, enabled) {
              if(name === self.layer.name) {
                  if(enabled) {
                      $(self.el).addClass('enabled');
                  }
                  else {
                      $(self.el).removeClass('enabled');
                  }
              }
          });
      },

      render: function() {
          var leg;
          var el = $(this.el);
          var d = _.extend(this.layer, {
              normalized_name: this.layer.name.replace(' ', '_')
          });
          var html = this.template(d);
          if(leg = this.LEGENDS[this.layer.name]) {
              html += '<img src="/assets/'+ leg +'" />';
          }
          el.html(html).addClass('sortable').attr('id', this.layer.name);
          if(this.layer.enabled) {
              el.addClass('enabled');
          }
          return this;
      },

      toggle: function() {
          this.bus.emit('map:enable_layer', this.layer.name, !this.layer.enabled);
      }
  });
});
