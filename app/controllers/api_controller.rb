class ApiController < ApplicationController

  def work
    if params[:id]
      render :text => '[{"polygons":[],"stats":{},"total":true},{"polygons":[],"stats":{}}]'
    else
      render :text => '{"id": "BX2K"}'
    end
  end

  def proxy
  end

  def error
    render :nothing => true
  end
end
