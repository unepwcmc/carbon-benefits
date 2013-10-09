class PolygonsController < ApplicationController

  def create
    @polygon = Polygon.new(params[:polygon])
    @polygon.save

    render :json =>  @polygon.as_json
  end

  def update
    @polygon = Polygon.find(params[:id])
    @polygon.update_attributes(params[:polygon])
    render :json => @polygon.as_json
  end

  def destroy
    Polygon.find(params[:id]).destroy
  end
end
