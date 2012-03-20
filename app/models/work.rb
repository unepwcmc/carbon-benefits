class Work < ActiveRecord::Base
  BASE_ID = 1234567

  def to_json
    json && json != "[]" ? json : { id: (id + BASE_ID).alphadecimal }
  end
end

