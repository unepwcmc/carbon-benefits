class PolygonsController < ApplicationController

  def create
    @polygon = Polygon.new(params[:polygon])
    @polygon.save

    render :json =>  @polygon
  end

  def update
    @polygon = Polygon.find(params[:id])
    @polygon.update_attributes(params)
    render :json => @polygon
  end

end
