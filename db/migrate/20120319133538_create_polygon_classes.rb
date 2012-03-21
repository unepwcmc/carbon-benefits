class CreatePolygonClasses < ActiveRecord::Migration
  def change
    create_table :polygon_classes do |t|
      t.string :name

      t.timestamps
    end
  end
end
