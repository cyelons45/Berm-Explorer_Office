var map, view, graphicsLayer, activeGraphic, graphicsLayerLine
require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    // "esri/geometry/geometryEngine"
], function(Map, MapView, FeatureLayer, GraphicsLayer, Graphic, QueryTask, Query) {

    map = new Map({
        basemap: "satellite"
    });

    view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-79.47034228448162, 33.00128049734469], // longitude, latitude
        zoom: 9
    });

    var beachPoints = new FeatureLayer({
        url: `https://giswebtest.dhec.sc.gov/arcgis/rest/services/environment/BERM16A/MapServer/5`,
        outFields: '*'
    });
    map.add(beachPoints);


    view.on("click", function(event) {

        view.hitTest(event).then(function(response) {
            // console.log(response)
            if (response.results.length) {
                var graphic = response.results.filter(function(result) {

                    // check if the graphic belongs to the layer of interest
                    return result.graphic.layer === beachPoints;
                })[0].graphic;

                view.whenLayerView(graphic.layer).then(function(layerView) {

                        if (highlight) {
                            highlight.remove();
                        }
                        highlight = layerView.highlight(graphic);
                        graphicsLayer.removeAll()

                    })
                    // console.log(graphic);
                var search = new ProcessBerm()

                let list = graphic.attributes['NAME'];
                var newquery = search.createQuery(list)

                newquery.queryTask.execute(newquery.query).then(function(results) {
                    // console.log(results)
                    search.addPolygonGraphics(results)
                        // search.addGraphic(results)
                });

            }
        });
    });




    var transact2015 = new FeatureLayer({
        url: 'https://giswebtest.dhec.sc.gov/arcgis/rest/services/environment/BERM16A/MapServer/8',
        outFields: '*'
    });
    map.add(transact2015);
    view.on("click", function(event) {


        view.hitTest(event).then(function(response) {
            // console.log(response)
            if (response.results.length) {
                var graphic = response.results.filter(function(result) {

                    // check if the graphic belongs to the layer of interest
                    return result.graphic.layer === transact2015;
                })[0].graphic;
                var search = new ProcessBerm()
                    // console.log(graphic)
                let list = graphic.attributes['TRAN_ID'];
                var newquery = search.createTransactQuery(list)
                    // console.log(list)
                newquery.tranqueryTask.execute(newquery.tranquery).then(function(results) {
                    console.log(results.features[0].attributes)
                    console.log(results.features)
                    if (graphicsLayerLine) {
                        graphicsLayerLine.removeAll()
                    }

                    graphicsLayerLine = new GraphicsLayer();

                    map.add(graphicsLayerLine);

                    search.addLineGraphics(results, graphicsLayerLine)
                        // search.addGraphic(results)

                });

            }
        });
    });




    // })





    let t = document.querySelector('.nav').addEventListener('click', function(e) {
        let list = e.target.closest('.b-list')
        let down = e.target.closest('.b-down')
        let print = e.target.closest('#print')
        if (list) {
            var search = new ProcessBerm()
            var newquery = search.createQuery(list.innerHTML)

            // console.log(newquery)

            // function addGraphics(result) {
            // graphicsLayer.removeAll();
            // if (highlight) {
            //     highlight.remove();
            // }
            if (graphicsLayer) {
                graphicsLayer.removeAll();
            }

            newquery.queryTask.execute(newquery.query).then(function(results) {

                search.addPolygonGraphics(results)

            });

        } else if (down) {

        } else if (print) {
            let chrt = document.getElementById('toggle-chart').classList.toggle('close-chart')

            // console.log(chrt)

        }


    })



    view.on("pointer-move", function(event) {
        let search = new ProcessBerm()
            // search.findNearestGraphic(event) 
        search.findNearestGraphic(event).then(function(graphic) {
            if (graphic) {
                activeGraphic = graphic;
                $(graphic).ready(function() {
                    $('#viewDiv').css('cursor', 'pointer')
                })

            }
        });
    });

    var activeGraphic;

    function notOnGraphic(event) {
        return view.hitTest(event).then(function(response) {
            //  console.log(response.results.length)
            if (response.results.length === 0) {
                $('#viewDiv').css('cursor', 'default')
            }
        });
    }


    view.on("pointer-move", function(event) {
        notOnGraphic(event)

    });





    class ProcessBerm {
        constructor() {
            this.item = []
        }
        createTransactQuery(list) {


            var pointUrl = "https://giswebtest.dhec.sc.gov/arcgis/rest/services/environment/BERM16A/MapServer/8";
            var tranqueryTask = new QueryTask({
                url: pointUrl
            });

            var tranquery = new Query();
            tranquery.returnGeometry = true;
            tranquery.outFields = ["*"];
            tranquery.where = `TRAN_ID='${list}'`;
            this.tranquery = tranquery;
            this.tranoutFields = tranquery.outFields
            this.tranqueryTask = tranqueryTask;
            return {
                tranquery: this.tranquery,
                tranqueryTask: this.tranqueryTask

            }


        }
        createQuery(list) {
            var pointUrl = "https://giswebtest.dhec.sc.gov/arcgis/rest/services/environment/BERM16A/MapServer/4";
            var queryTask = new QueryTask({
                url: pointUrl
            });

            var query = new Query();
            query.returnGeometry = true;
            query.outFields = ["*"];
            query.where = `NAME='${list}'`;
            this.query = query;
            this.outFields = query.outFields
            this.queryTask = queryTask;
            return {
                query: this.query,
                queryTask: this.queryTask

            }

        }

        findNearestGraphic(event) {
            return view.hitTest(event).then(function(response) {
                var graphic;

                if (response.results.length) {
                    graphic = response.results.filter(function(result) {
                        return (result.graphic.layer === transact2015 || beachPoints);
                    })[0].graphic;
                }
                if (graphic) {
                    if (!activeGraphic || (activeGraphic.attributes.OBJECTID !== graphic.attributes.OBJECTID)) {
                        return graphic;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            });

        }
        addPolygonGraphics(results) {
            graphicsLayer = new GraphicsLayer();
            map.add(graphicsLayer);



            graphicsLayer.removeAll();


            results.features.forEach(function(feature) {

                var g = new Graphic({
                    geometry: feature.geometry,
                    attributes: feature.attributes,
                    symbol: {
                        type: "simple-fill",
                        rings: feature.geometry.rings,
                        color: [227, 139, 79, 0.8],
                        style: "none",
                        outline: {
                            color: [0, 255, 255],
                            width: 6
                        }
                    },

                });
                graphicsLayer.add(g);
                view.goTo(g)
            });
        }
        addLineGraphics(results, graphicsLayerLine) {
            results.features.forEach(function(feature) {

                var gl = new Graphic({
                    geometry: feature.geometry,
                    attributes: feature.attributes,
                    symbol: {
                        type: "simple-line",
                        paths: feature.geometry.paths,
                        color: [226, 230, 33, 0.4],
                        width: 12,

                    },

                });


                graphicsLayerLine.add(gl);
                view.goTo(gl)
            });
        }


        // }



    }







    function findNearestGraphic(event) {
        return view.hitTest(event).then(function(response) {
            var graphic;
            if (graphic) {
                if (!activeGraphic || (activeGraphic.attributes.OBJECTID !== graphic.attributes.OBJECTID)) {
                    return graphic;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        });
    }


    view.on("pointer-move", function(event) {
        findNearestGraphic(event).then(function(graphic) {
            if (graphic) {
                activeGraphic = graphic;

            }
        });
    });




    // ------------------------------------------------------------------------------------------------------------------------
    // var pointUrl = "https://giswebtest.dhec.sc.gov/arcgis/rest/services/environment/BERM16A/MapServer/4";
    // var queryTask = new QueryTask({
    //   url: pointUrl
    // });
    //
    // // `TRL_NAME ='${list.innerHTML}'`;
    // var sql = "NAME='Edisto Beach'";
    // var query = new Query();
    // query.returnGeometry = true;
    // query.outFields = ["*"];
    // query.where =sql
    // queryTask.execute(query).then(function(results){
    //   // addGraphics(results)
    //   console.log(results);
    //
    // });

    // -----------------------------------------------------------------------------------------------------------------












});