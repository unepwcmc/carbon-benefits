class Work < ActiveRecord::Base
  BASE_ID = 1234567

  has_many :layers

  def import_from_json(the_json)
    parsed_layers = the_json
    parsed_work = parsed_layers.shift
    #populate the work object
    self.summary = parsed_work['stats'].to_json
    #populate the layer objects
    self.layers.build parsed_layers
  end

  def export_to_json
    the_json = [{'polygons' => [], 'stats' => JSON.parse(summary)}]
    layers.each{ |l| the_json << l.as_json }
    the_json.as_json
  end

  def to_json
    json && json != "[]" ? json : { id: (id + BASE_ID).alphadecimal }
  end
end

