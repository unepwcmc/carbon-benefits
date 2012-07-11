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
      polygon_class = PolygonClass.find_by_name(layer['selected_class'])
      unless polygon_class.nil?
        polygon_class_colour = PolygonClassColour.find_by_layer_id_and_polygon_class_id(layer['id'], polygon_class.id)
        polygon_class_colour.update_attributes({colour: layer['selected_colour']}) if polygon_class_colour
      end

      case layer['selected_class_id']
        when Layer::SELECTED_ALL_CLASSES_T
          layer['selected_polygon_class_id'] = Layer::SELECTED_ALL_CLASSES
        when Layer::SELECTED_NO_CLASS_T
          layer['selected_polygon_class_id'] = Layer::SELECTED_NO_CLASS
        else
          layer['selected_polygon_class_id'] = layer['selected_class_id']
      end
      ar_layer.attributes= layer.delete_if{|k,v| ['polygons', 'total_count', 'selected_count', 'selected_class_id'].include?(k)}

      # We store this as txt, so make it JSOn
      ar_layer.selected_polygon_ids = ar_layer.selected_polygon_ids.to_json

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

