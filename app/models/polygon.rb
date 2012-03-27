class Polygon < ActiveRecord::Base

  belongs_to :layer
  belongs_to :polygon_class

  attr_accessor :path

  def path
    JSON.parse(self.string_path)
  end

  def path=(path)
    write_attribute(:string_path, path.to_s)
  end
  
  def to_json
    super(:except => [:string_path], :methods => [:path])
  end
end