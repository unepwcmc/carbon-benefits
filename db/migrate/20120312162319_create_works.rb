class CreateWorks < ActiveRecord::Migration
  def change
    create_table :works do |t|
      t.text :json, :default => '[]'

      t.timestamps
    end
  end
end
