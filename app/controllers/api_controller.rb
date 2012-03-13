class ApiController < ApplicationController

  def work
    if params[:work_hash] && params[:work_hash] != 'undefined'
      work = Work.find(params[:work_hash].alphadecimal - Work::BASE_ID)
    else
      work = Work.create
    end
    respond_to do |format|
      format.json { render :json => work.to_json  }
    end
  end

  def proxy
    require 'net/http'
    #due to the protection against path traversal provided by Rack::Protection
    #the URLs that are matched with (.*) are sanitized and they lose the double forward-slash.
    #the following line is to fix that. =)
    url = params[:url].sub(/(http|https)(:\/)/, '\1\2/')
    uri = URI.parse(url)
    if params[:q]
      proxy_page = Net::HTTP.get_response(uri.host, uri.path+"?q=#{params[:q]}")
    elsif request.method == "POST"
      proxy_page = Net::HTTP.post_form(uri, JSON.parse(params[:data]))
    else
      proxy_page = Net::HTTP.get_response(uri)
    end
    render :json => proxy_page.body
  end

  def error
    Error.create(:error => params)
    render :text => "Error logged, thanks!"
  end
end
