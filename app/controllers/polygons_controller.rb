class PolygonsController < ApplicationController

  def create
    @polygon = Polygon.new_from_params(params[:polygon])
    @polygon.save

    render :json =>  @polygon.to_json
  end

end
