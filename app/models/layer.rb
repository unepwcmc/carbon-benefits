class Layer < ActiveRecord::Base
  include ActiveModel::Validations
  belongs_to :work
  has_many :polygons
  has_many :polygon_class_colours
  has_many :polygon_classes, :through => :polygon_class_colours
  has_attached_file :user_layer_file

  validates_attachment_content_type :user_layer_file,
    :content_type => [ 'application/zip', 'application/json', 'text/csv',
      'application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz' ]
  validates_attachment_size :user_layer_file, :less_than => 100.megabytes
  validates :user_layer_file, :ogr_parsable => true

  before_save :extract_meta_data

  def extract_meta_data
    self.meta_data = unless self.user_layer_file.queued_for_write[:original]
      []
    else
      mde = MetaDataExtractor.new(self.user_layer_file)
      mde.make
    end.to_json
    return true
  end

  def as_json(options={})
    {
      'id' => id,
      'polygons' => polygons.map{|p| p.as_json},
      'stats' => JSON.parse(stats),
      'classes' => polygon_class_colours.map{ |c| [c.polygon_class.name, c.colour] },
      'is_uploaded' => is_uploaded,
      'name' => name
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

  def stats=(stats_hash)
    write_attribute(:stats, stats_hash.to_json)
  end

  def selected_class= selected_class
  end

  def selected_colour= selected_colour
  end
end
