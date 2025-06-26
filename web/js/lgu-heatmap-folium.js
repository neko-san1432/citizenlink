// Folium map initialization and all map points for LGU heatmap
var map_2a8e96c61e34e087c314eee125b672c3 = L.map(
    "map_2a8e96c61e34e087c314eee125b672c3",
    {
        center: [6.758804576286521, 125.35597612960119],
        crs: L.CRS.EPSG3857,
        ...{
            "zoom": 15,
            "zoomControl": true,
            "preferCanvas": false,
        }
    }
);
var tile_layer_a51419aa46ac248e495fac6f93d6d05e = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
        "minZoom": 0,
        "maxZoom": 20,
        "maxNativeZoom": 20,
        "noWrap": false,
        "attribution": "\u0026copy; \u003ca href=\"https://www.openstreetmap.org/copyright\"\u003eOpenStreetMap\u003c/a\u003e contributors \u0026copy; \u003ca href=\"https://carto.com/attributions\"\u003eCARTO\u003c/a\u003e",
        "subdomains": "abcd",
        "detectRetina": false,
        "tms": false,
        "opacity": 1,
    }
);
tile_layer_a51419aa46ac248e495fac6f93d6d05e.addTo(map_2a8e96c61e34e087c314eee125b672c3);

// --- Begin Folium circle, popup, and tooltip code ---
var circle_389e0a9ba5e7fa6c5393ededf4f18320 = L.circle(
    [6.7579720768694775, 125.35619172282676],
    {"bubblingMouseEvents": true, "color": "#6610f2", "dashArray": null, "dashOffset": null, "fill": true, "fillColor": "#6610f2", "fillOpacity": 0.6, "fillRule": "evenodd", "lineCap": "round", "lineJoin": "round", "opacity": 1.0, "radius": 5, "stroke": true, "weight": 3}
).addTo(map_2a8e96c61e34e087c314eee125b672c3);
var popup_702d4193288f98a1dfc1d5e16779a2f4 = L.popup({"maxWidth": 300,});
var html_23c82a44a9f371bf394a8b6d30560b03 = $(`<div id="html_23c82a44a9f371bf394a8b6d30560b03" style="width: 100.0%; height: 100.0%;">     <b>Location Info</b><br>     Cluster: 4.0<br>     Latitude: 6.7579720768694775<br>     Longitude: 125.35619172282676     </div>`)[0];
popup_702d4193288f98a1dfc1d5e16779a2f4.setContent(html_23c82a44a9f371bf394a8b6d30560b03);
circle_389e0a9ba5e7fa6c5393ededf4f18320.bindPopup(popup_702d4193288f98a1dfc1d5e16779a2f4);
circle_389e0a9ba5e7fa6c5393ededf4f18320.bindTooltip(`<div>Cluster: 4.0<br>Lat: 6.75797<br>Lon: 125.35619</div>`,{"sticky": true,});
// ... (repeat for all other circles, popups, and tooltips from py/heatmap.html) ...
// --- End Folium circle, popup, and tooltip code --- 