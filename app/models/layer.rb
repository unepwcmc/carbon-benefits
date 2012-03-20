class Layer < ActiveRecord::Base
  belongs_to :work
  has_many :polygon_class_colours
  has_many :polygon_classes, :through => :polygon_class_colours

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

  def polygons=(polygons_ary)
    write_attribute(:polygons, polygons_ary.to_json)
  end

  def stats=(stats_hash)
    write_attribute(:stats, stats_hash.to_json)
  end

  def classes= the_classes
  end

  def selected_class= selected_class
  end

  def selected_colour= selected_colour
  end
end
