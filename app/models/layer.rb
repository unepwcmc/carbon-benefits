class Layer < ActiveRecord::Base
  belongs_to :work

  def as_json(options={})
    {
      :id => id,
      :polygons => polygons,
      :stats => stats
    }
  end

end
