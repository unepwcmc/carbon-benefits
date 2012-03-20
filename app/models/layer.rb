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
      'colours' => polygon_class_colours.map{ |c| {:class_id => c.class_id, :colour => c.colour} }
    }.to_json
  end

  def colours=(the_colours)
    #TODO
  end

  def classes=(the_classes)
    #TODO
  end

  def polygons=(polygons_ary)
    write_attribute(:polygons, polygons_ary.to_json)
  end

  def stats=(stats_hash)
    write_attribute(:stats, stats_hash.to_json)
  end
end
