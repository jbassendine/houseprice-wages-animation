Data Sources:

Nomis Web for Workplace ASHE data (England Wales and Scotland): 
https://www.nomisweb.co.uk/query/construct/components/stdListComponent.asp?menuopt=12&subcomp=100
Processed using supplied script

ONS for House Price statistics (only England and Wales): 
http://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housepricestatisticsforsmallareas/yearendingdec1995toyearendingdec2015
Processed using supplied script

TopoJSON shape files (E&W, Scotland, N Ireland): 
http://martinjc.github.io/UK-GeoJSON/
Simplified using Topojson npm packaged, using this command:
topojson -s 1e-7 -o topo-lad-simplified.json topo-lad.json
