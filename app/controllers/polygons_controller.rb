class PolygonsController < ApplicationController

  def create
    @polygon = Polygon.new(params[:polygon])
    @polygon.save

    render :json =>  @polygon.as_json
  end

  def update
    @polygon = Polygon.find(params[:cartodb_id])
    @polygon.the_geom = RGeo::GeoJSON.encode(@polygon.the_geom)
    render :json => @polygon.to_json
  end
end
