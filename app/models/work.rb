class Work < ActiveRecord::Base
  BASE_ID = 1234567

  has_many :layers

  def import_from_json(the_json)
    parsed_work = the_json.first
    parsed_layers = the_json[1..the_json.length]
    #populate the work object
    self.summary = parsed_work['stats'].to_json
    #populate the layer objects
    build_layers = []
    parsed_layers.each do |layer|
      puts layer.inspect
      if layer['id']
        l = Layer.find(layer['id'])
        l.update_attributes(layer)
      else
        build_layers<< layer
      end
    end
    self.layers.build build_layers
    self
  end

  def export_to_json
    work_json = {
      :id => (id + BASE_ID).alphadecimal,
      :polygons => [],
      :stats => JSON.parse(summary),
      :total => true
    }.to_json
    layers_json = layers.map(&:as_json).join(',')
    '[' + work_json + ',' + layers_json + ']'
  end

  def to_json
    json && json != "[]" ? json : { id: (id + BASE_ID).alphadecimal }
  end
end

