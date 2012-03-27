class ChangeColumnTypeOfSummaryInWorks < ActiveRecord::Migration
  def up
    change_column :works, :summary, :text
  end

  def down
    change_column :works, :summary, :string
  end
end
