class AddSummaryToWorks < ActiveRecord::Migration
  def change
    add_column :works, :summary, :string

  end
end
