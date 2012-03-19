class AddUserLayerFileToLayer < ActiveRecord::Migration
  def self.up
    change_table :layers do |t|
      t.has_attached_file :user_layer_file
    end
  end

  def self.down
    drop_attached_file :layers, :user_layer_file
  end
end
