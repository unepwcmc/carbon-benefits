var Searchbox = Backbone.View.extend({
    events: {
        'click a': 'typing'
    },

    initialize: function() {
        _.bindAll(this, 'typing', 'goto', 'keyPress');
        var self = this;
        this.results = new SearchResults();
        this.to_search = this.$('input');
        this.results.bind('reset', function() {
          var r = this.first().get('geometry').location;
          var bounds = this.first().get('geometry').bounds;
          self.trigger('goto', r, bounds);
        });
        $(document).bind('keydown', this.keyPress);
    },

    typing: function(e) {
        if(e) e.preventDefault();
        this.results.to_search = this.to_search.val();
        this.results.fetch();
    },

    goto: function(e) {
        e.preventDefault();
    },

    keyPress: function(e) {
        if (e.keyCode == 13 || e.which == 13) { //lovely
            this.typing();
        }
    }
});
