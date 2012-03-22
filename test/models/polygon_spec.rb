require 'minitest_helper'

describe Polygon do
  describe "#new" do
    it "should return a polygon object" do
      @it = Polygon.new
      assert_equal Polygon, @it.class
    end

    it "should return a polygon with a cartodb_id" do
      @it = Polygon.new({:cartodb_id => 1234})
      assert_equal 1234, @it.cartodb_id
    end
  end

  describe "#find" do
    before do
      @cartodb_id = 1234
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
      assert_equal @cartodb_id, @it.cartodb_id
    end
  end

  describe "#save" do
    before do
      @polygon_name = "Name1"
      @cartodb_polygon = { :name => @polygon_name }
      @cartodb_connection = MiniTest::Mock.new
      @cartodb_connection.expect(:insert_row, @cartodb_polygon, [Object, Hash])

      CartoDB::Connection = @cartodb_connection

      @it = Polygon.new(@cartodb_polygon).save
    end

    after do 
      @cartodb_connection.verify
    end

    it "should return the saved object similar to @cartodb_polygon" do
      assert_equal @cartodb_polygon[:name], @it[:name]
    end
  end

  describe "#attributes" do
    before do
      @it = Polygon.new
    end
    it "returns an hash" do
      assert_equal true, @it.attributes.is_a?(Hash)
    end

    it "returns an hash with as many elements as there are attributes in the model" do
      assert_equal Polygon::ATTRIBUTES.size, @it.attributes.size
    end

    it "returns the cartodb_id if set" do
      @it.cartodb_id = 1
      assert_equal 1, @it.attributes[:cartodb_id]
    end

    it "returns the name if set" do
      @it.name = "bazinga"
      assert_equal "bazinga", @it.attributes[:name]
    end
  end
end
