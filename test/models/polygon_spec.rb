require 'minitest_helper'

describe Polygon do
  describe "#find" do
    before do
      @cartodb_id = 1
      @cartodb_polygon = {:cartodb_id => @cartodb_id}

      @cartodb_connection = MiniTest::Mock.new
      @cartodb_connection.expect(:row, @cartodb_polygon, [Object, Integer])

      CartoDB::Connection = @cartodb_connection

      @it = Polygon.find(@cartodb_id)
    end

    after do
      @cartodb_connection.verify
    end
    
    it "should return an object with the cartodb_id" do
      assert_equal @cartodb_polygon, @it
    end
  end
end
