class Error < ActiveRecord::Base

  scope :latest, order(:when).limit(10)

  def track(log)
    self.error = log
    self.save
  end
end
