class PolygonsController < ApplicationController

  def create
    Polygon.new_from_params(params[:polygon])
    Polygon.save
  end

end
