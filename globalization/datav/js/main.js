mapboxgl.accessToken = 'pk.eyJ1IjoidWNmbmFuaSIsImEiOiJjazVwODk4M2YwN2E4M2huY3pxbjdjcDNyIn0.JbKiozlXAL02ILZhePZ-bQ';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ucfnani/ckaa63rn63kj41iqk8g79lapk',
    center: [0.5, 51.482444],
    zoom: 8.30
});

var clicked = 0;
var color = ['#fc9977', '#fcbd90', '#b48d6c', '#bd6666', '#a3d96a', '#80d996', '#57cfc9', '#51c0db', '#54a2ab', '#70a5d4', ];

// A single point that animates along the route.
// Coordinates are initially set to origin.
var point = [];

var route = [];

var steps = 500;

// Used to increment the value of the point measurement against the route.
var counter = 0;

function openWorld() {
    document.getElementById("play").style.visibility = "visible";
    document.getElementById("worldPanel").style.width = "35vw";
    
    var worldchart = document.getElementById('world_chart');
    var myBarChart2 = new Chart(worldchart, {
        type: 'horizontalBar',
        data: {
            labels: ["India", "Pakistan", "United States", "Zimbabwe", "Hong Kong", "Bangladesh", "Nigeria", "France", "Philippines", "South Africa", "China", "Sri Lanka", "Somalia", "Ghana", "Malaysia", "Australia"],
            datasets: [{
                label: "Countries have the most migration to London",
                data: [250403, 167249, 140824, 130647, 112434, 106214, 85193, 57686, 47678, 45968, 42507, 41777, 32690, 25838, 24266, 22546],
                backgroundColor: color
            }]
        },
        options: {
            event: ["click"],
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
};

function closeWorld() {
    document.getElementById("worldPanel").style.width = "0";
};

map.on('load',function() {
    // Add a source and layer displaying a point which will be animated in a circle.
    function animate() {
        // Update point geometry to a new position based on counter denoting
        // the index to access the arc.
        for (var i = 0; i < route.features.length; i++) {
            point.features[i].geometry.coordinates = route.features[i].geometry.coordinates[counter];

            // Calculate the bearing to ensure the icon is rotated to match the route arc
            // The bearing is calculate between the current point and the next point, except
            // at the end of the arc use the previous point and the current point
            point.features[i].properties.bearing = turf.bearing(turf.point(route.features[i].geometry.coordinates[counter >= steps ? counter - 1 : counter]), turf.point(route.features[i].geometry.coordinates[counter >= steps ? counter: counter + 1]));
        }

        // Update the source with this new data.
        map.getSource('point').setData(point);

        // Request the next frame of animation so long the end has not been reached.
        if (counter < steps) {
            requestAnimationFrame(animate);
        }

        counter = counter + 1;
    }

    document.getElementById('replay').addEventListener('click',function() {
        // Set the coordinates of the original point back to origin
        // Update the source layer
        map.getSource('point').setData(point);

        // Reset the counter
        counter = 0;

        // Restart the animation.
        animate(counter);
    });

    // Click
    $('.btn-mui').on('click',function() {
        loadMap($(this).data('country'));
    });

    function loadMap(key){
      //d.length
      let route_data = [];
      let point_data = [];

      d3.csv("data.csv",function(d)
      {
        for (var i = 0; i < d.length; i++)
        {
          if (key == 'ALL')
          {
            // Line
            route_data.push({
              "type": "Feature",
              "geometry": {
                  "type": "LineString",
                  "coordinates": [[d[i].geometry_x, d[i].geometry_y], [0, 51.470020]]
              },
              "properties": {
                  "Name": d[i].region_orig,
                  "Flights": d[i].countryflow_2005,
                  "LnFlight": 5.59511985
              }
            }); 

            // Ppint
            point_data.push({
              "type": "Feature",
              "geometry": {
                  "type": "Point",
                  "coordinates": [0, 51.470020]
              },
              "properties": {
                  "City": d[i].region_orig,
                  "Flights": d[i].countryflow_2005,
              }
            }); 
          }else{
            if (key == d[i].region_orig)
            {
              // Line
              route_data.push({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[d[i].geometry_x, d[i].geometry_y], [0, 51.470020]]
                },
                "properties": {
                    "Name": d[i].region_orig,
                    "Flights": d[i].countryflow_2005,
                    "LnFlight": 5.59511985
                }
              }); 

              // Ppint
              point_data.push({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [0, 51.470020]
                },
                "properties": {
                    "City": d[i].region_orig,
                    "Flights": d[i].countryflow_2005,
                }
              }); 
            }
          }
        }

        // A single point that animates along the route.
        // Coordinates are initially set to origin.
        point = {
            "type": "FeatureCollection",
            "features": point_data
        };

        route = {
            "type": "FeatureCollection",
            "features": route_data
        };

        // Draw an arc between the `origin` & `destination` of the two points
        for (var j = 0; j < route.features.length; j++) {
            var lineDistance = turf.lineDistance(route.features[j], 'kilometers');
            var arc = [];
            for (var i = 0; i < lineDistance; i += lineDistance / steps) {
                var segment = turf.along(route.features[j], i, 'kilometers');
                arc.push(segment.geometry.coordinates);
            }
            route.features[j].geometry.coordinates = arc;
        }

        if (clicked == 0)
        {
          map.addSource('route', {
              "type": "geojson",
              "data": route
          });

          map.addSource('point', {
              "type": "geojson",
              "data": point
          });

          map.addLayer({
              "id": "route",
              "source": "route",
              "type": "line",
              'layout': {
                  'visibility': 'none'
              },
              "paint": {
                  "line-width": ['interpolate', ['linear'], ['get', 'LnFlight'], 1, 0.25, 2, 2, 4, 4, 6, 8],
                  'line-opacity': 0.5,
                  "line-color": "#b26a68"
              }
          });

          map.addLayer({
              "id": "point",
              "source": "point",
              "type": "symbol",
              "layout": {
                  "visibility": 'none',
                  "icon-image": "airport-15",
                  "icon-rotate": ["get", "bearing"],
                  "icon-rotation-alignment": "map",
                  "icon-allow-overlap": true,
                  "icon-ignore-placement": true
              }
          });
        }else{
          map.getSource('route').setData(route);
          map.getSource('point').setData(point);
        }

        clicked++;

        map.flyTo({
            // These options control the ending camera position: centered at
            // the target, at zoom level 9, and north up.
            center: [0, 51.470020],
            zoom: 1.47,
            bearing: 21.02,
            pitch: 24.00,
            speed: 0.5,
            // make the flying slow
            curve: 1 // change the speed at which it zooms out
            // This can be any easing function: it takes a number between
            // 0 and 1 and returns another number between 0 and 1.
        });
        map.setLayoutProperty('route', 'visibility', 'visible');
        map.setLayoutProperty('point', 'visibility', 'visible');
        point.features[0].geometry.coordinates = origin;
        // Update the source layer
        map.getSource('point').setData(point);

        // Reset the counter
        counter = 0;
        // Restart the animation.
        animate(counter);
      });

      openWorld();
    };

    function popup(layer) {
        map.on('click', layer,function(e) {
            var coordinates = e.features[0].geometry.coordinates.slice();
            var description = "Country Name:" + e.features[0].properties.City + "<p>" + "Migration:" + e.features[0].properties.Flights;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', layer,function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', layer,function() {
            map.getCanvas().style.cursor = '';
        });

    };

    popup('point');
});