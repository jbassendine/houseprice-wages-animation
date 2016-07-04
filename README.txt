Data Sources:

Nomis Web for Workplace ASHE data (England Wales and Scotland): 
https://www.nomisweb.co.uk/query/construct/components/stdListComponent.asp?menuopt=12&subcomp=100
Processed using supplied script, mostly to fill in linear approximation for 2-3 years of missing data at a local level. May be good to highlight this in data?

ONS for House Price statistics (only England and Wales): 
http://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housepricestatisticsforsmallareas/yearendingdec1995toyearendingdec2015
Cut out section from graph with quarterly data, paste into new csv document, process using supplied script to calculate annual values, scottish values can be cut and pasted in, once columns have been rearranged. Then sort by ID.

Ratio calculation
Cut down to 1999-2015 range, make sure sorting/elements are aligned. Copy into ratio reconstruction folder, and process using ratio script

TopoJSON shape files (E&W, Scotland, N Ireland): 
http://martinjc.github.io/UK-GeoJSON/
Simplified using Topojson npm packaged, using this command:
topojson -s 1e-7 -o topo-lad-simplified.json topo-lad.json

No Northern Ireland data because I cannot find a time-series data source for NI ASHE wages by Local Authority District.
