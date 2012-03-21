class AddMetaDataToLayers < ActiveRecord::Migration
  def change
    add_column :layers, :meta_data, :text

  end
end
