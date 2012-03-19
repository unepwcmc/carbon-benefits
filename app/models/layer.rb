class Layer < ActiveRecord::Base
  belongs_to :work

  def as_json(options={})
    {
      'id' => id,
      'polygons' => JSON.parse(polygons),
      'stats' => JSON.parse(stats)
    }.to_json
  end

  def polygons=(polygons_ary)
    write_attribute(:polygons, polygons_ary.to_json)
  end

  def stats=(stats_hash)
    write_attribute(:stats, stats_hash.to_json)
  end
end
