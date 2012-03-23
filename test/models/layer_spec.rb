require 'minitest_helper'

describe Layer do
  describe "#polygons" do
    before do
      @cartodb_connection = MiniTest::Mock.new
      CartoDB::Connection = @cartodb_connection

      @it = Layer.new
    end

    after do
      @cartodb_connection.verify
    end

    it "should return an empty array by default" do
      @cartodb_connection.expect(:query, {time: 0, total_rows: 0, rows: []}, [String])

      assert_equal [], @it.polygons
    end
    
    it "should return an array with one polygon" do
      @cartodb_polygon = {:cartodb_id => 1234, :name => "bazinga"}
      @cartodb_response = {time: 0, total_rows: 1, rows: [@cartodb_polygon]}
      @cartodb_connection.expect(:query, @cartodb_response, [String])

      polygons = @it.polygons

      assert_equal Polygon, polygons.first.class
      assert_equal @cartodb_polygon[:cartodb_id], polygons.first.cartodb_id
      assert_equal @cartodb_polygon[:name], polygons.first.name
      assert_equal 1, polygons.size
    end
  end

  describe "#polygons=" do
    before do
      @cartodb_connection = MiniTest::Mock.new
      CartoDB::Connection = @cartodb_connection

      @rgeo_mock = MiniTest::Mock.new
      RGeo::GeoJSON = @rgeo_mock

      @it = Layer.new
    end

    after do
      @cartodb_connection.verify
      @rgeo_mock.verify
    end

    it "should insert one polygon if single object passed" do
      @cartodb_polygon = {:name => "bazinga"}
      @cartodb_response = {:rows => [ {:cartodb_id => 1, :name => @cartodb_polygon[:name], :the_geom => {} } ] }
      @cartodb_connection.expect(:query, @cartodb_response, [String])

      @rgeo_mock.expect(:encode, "", [Hash])

      response = (@it.polygons = [@cartodb_polygon])
      assert response
    end
  end
end
