class PolygonsController < ApplicationController

  def create
    @polygon = Polygon.new_from_params(params[:polygon])
    @polygon.save
  end

end
