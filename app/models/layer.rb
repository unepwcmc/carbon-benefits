class Layer < ActiveRecord::Base
  belongs_to :work
  has_many :polygon_class_colours
  has_many :polygon_classes, :through => :polygon_class_colours
  has_attached_file :user_layer_file,
    :styles => {'meta-data' => []},
    :processors => ['meta_data_extractor']
  validates_attachment_content_type :user_layer_file,
    :content_type => [ 'application/zip', 'application/json', 'text/csv', 'application/vnd.google-earth.kml+xml' ]
  validates_attachment_size :user_layer_file, :less_than => 100.megabytes

  def user_layer_file_columns
    #need to read columns from meta data
    File.read(File.join(Rails.root, 'public', user_layer_file('meta-data').sub(/\?.+$/,'')))
  end

  def as_json(options={})
    {
      'id' => id,
      'polygons' => JSON.parse(polygons),
      'stats' => JSON.parse(stats),
      'classes' => polygon_class_colours.map{ |c| [c.polygon_class.name, c.colour] }
    }.to_json
  end

  def classes=(the_classes)
    the_classes.each do |class_name, the_colour|
      polygon_class = PolygonClass.find_or_create_by_name(class_name)

      poly_class_colour = polygon_class_colours.find_or_create_by_polygon_class_id(polygon_class.id)
      poly_class_colour.colour = the_colour
      poly_class_colour.save if poly_class_colour.changed?
    end
  end

  def polygons=(polygons_ary)
    write_attribute(:polygons, polygons_ary.to_json)
  end
  
  def polygons
    #TODO
  end

  def stats=(stats_hash)
    write_attribute(:stats, stats_hash.to_json)
  end

  def selected_class= selected_class
  end

  def selected_colour= selected_colour
  end
end
