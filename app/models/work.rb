class Work < ActiveRecord::Base
  BASE_ID = 1234567

  has_many :layers

  def classes=(the_classes)
    #TODO
  end

  def import_from_json(the_json)
    parsed_work = the_json.first
    parsed_layers = the_json[1..the_json.length]
    #populate the work object
    self.summary = parsed_work['stats'].to_json
    #populate the layer objects
    parsed_layers.each_with_index do |layer, i|
      ar_layer = if layer['id']
        Layer.find(layer['id'])
      else
        Layer.create
      end
      ar_layer.attributes= layer.delete_if{|k,v| k == 'polygons'}
      layers<< ar_layer
    end
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

