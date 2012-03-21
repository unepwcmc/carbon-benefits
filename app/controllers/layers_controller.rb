class LayersController < ApplicationController

  def select_fields
    debugger
    @layer = Layer.find(params[:id])
  end
end
