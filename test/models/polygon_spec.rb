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
      @cartodb_response = {:rows => [ @cartodb_polygon.merge({:cartodb_id => 1, :the_geom => {} }) ] }
      @cartodb_connection.expect(:query, @cartodb_response, [String])

      CartoDB::Connection = @cartodb_connection

      @it = Polygon.new(@cartodb_polygon).save
    end

    after do 
      @cartodb_connection.verify
    end

    it "should return the saved object similar to @cartodb_polygon" do
      assert_equal @cartodb_polygon[:name], @it.name
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

  describe '#geojson_to_gmaps_path' do
    before do
      geo_json = {"type"=>"MultiPolygon", "coordinates"=>[[[[-11.317766854539514, 90.0], [26.267053249292076, 90.0], [-69.46152242459357, 90.0], [-11.317766854539514, 90.0]]]]}
      @path = Polygon.geojson_to_gmaps_path geo_json
    end

    it "returns an array" do
      assert @path.is_a?(Array)
    end

    it "contains 3 points" do
      assert_equal 3, @path.length
    end

    it "should have [-11.317766854539514, 90.0] as the first element" do
      assert_equal [-11.317766854539514, 90.0], @path[0]
    end
  end

  describe '#to_json' do
    before do
      @polygon = Polygon.new
      @polygon.cartodb_id = 5
      @polygon.the_geom = {"type"=>"MultiPolygon", "coordinates"=>[[[[-11.317766854539514, 90.0], [26.267053249292076, 90.0], [-69.46152242459357, 90.0], [-11.317766854539514, 90.0]]]]}

      @json = JSON.parse(@polygon.to_json)
    end

    it "should return the correct cartodb id" do
      assert_equal 5, @json['cartodb_id']
    end

    it "should return the geometry as a gmaps path" do
      assert_equal Polygon.geojson_to_gmaps_path(@polygon.the_geom), @json['the_geom']
    end
  end
end
