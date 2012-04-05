class Layer < ActiveRecord::Base
  include ActiveModel::Validations
  belongs_to :work
  belongs_to :selected_polygon_class, :class_name => 'PolygonClass'
  has_many :polygons
  has_many :polygon_class_colours
  has_many :polygon_classes, :through => :polygon_class_colours
  has_attached_file :user_layer_file

  validates_attachment_content_type :user_layer_file,
    :content_type => [ 'application/zip', 'application/json', 'text/csv',
      'application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz',
      'application/x-zip', 'application/x-zip-compressed', 'application/octet-stream',
      'application/x-compress', 'application/x-compressed', 'multipart/x-zip' ]
  validates_attachment_size :user_layer_file, :less_than => 100.megabytes
  validates :user_layer_file, :ogr_parsable => true

  before_save :extract_meta_data

  SELECTED_ALL_CLASSES_T = 'All Classes'
  SELECTED_ALL_CLASSES = -1
  SELECTED_NO_CLASS_T = 'No Class'
  SELECTED_NO_CLASS = -2

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
    selected_name, selected_id, selected_colour = case selected_polygon_class_id
                             when SELECTED_ALL_CLASSES
                               [SELECTED_ALL_CLASSES_T, SELECTED_ALL_CLASSES_T, "black"]
                             when SELECTED_NO_CLASS
                               [SELECTED_NO_CLASS_T, SELECTED_NO_CLASS_T, "white"]
                             else
                               [ selected_polygon_class ? selected_polygon_class.name : nil,
                                 selected_polygon_class_id,
                                 selected_polygon_class ? polygon_class_colours.find_by_polygon_class_id(selected_polygon_class_id).colour : nil ]
                           end
    {
      'id' => id,
      'polygons' => polygons.map{|p| p.as_json},
      'total_count' => (is_uploaded ? get_polygons_count : polygons.size),
      'selected_count' => (is_uploaded ? get_polygons_count(false) : polygons.size),
      'stats' => JSON.parse(stats),
      'classes' => polygon_class_colours.map{ |c| [c.polygon_class.name, c.colour, c.polygon_class_id] },
      'is_uploaded' => is_uploaded,
      'name' => name,
      'selected_class' => selected_name,
      'selected_class_id' => selected_id,
      'selected_colour' => selected_colour,
      'selected_polygon_ids' => selected_polygon_ids.present? && selected_polygon_ids != 'null' ? JSON.parse(selected_polygon_ids) : ''
    }.to_json
  end

  def get_polygons_count total=true
    filter_class = if total
                     ""
                   else
                     case self.selected_polygon_class_id
                     when SELECTED_ALL_CLASSES
                       ""
                     when SELECTED_NO_CLASS
                       " AND class_id IS NULL"
                     else
                       self.selected_polygon_class ? " AND class_id = #{self.selected_polygon_class_id}" : ""
                     end
                   end
    res = CartoDB::Connection.query "SELECT COUNT(*) AS polygon_count FROM #{LayerUploadJob::TABLENAME} WHERE layer_id = #{self.id} #{filter_class}"
    first_row = res.rows.first
    first_row && first_row[:polygon_count] || 0
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
