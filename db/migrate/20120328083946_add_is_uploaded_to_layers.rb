class AddIsUploadedToLayers < ActiveRecord::Migration
  def change
    add_column :layers, :is_uploaded, :boolean, :default => false

  end
end
