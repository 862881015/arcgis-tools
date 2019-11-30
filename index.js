import * as esriLoader from "esri-loader";
import $ from "jquery";

import { test, Typhoon } from "arcgis-tools";
import { typhoonList, typhoonInfo } from "./mockData.js";

esriLoader.loadCss("https://cdn.jsdelivr.net/gh/862881015/arcgis_js_api@v1.0.0/esri/css/esri.css");

class App {
    constructor() {
        this.initMap();
    }

    initMap() {
        var _this = this;
        esriLoader.loadScript({ url: "https://cdn.jsdelivr.net/gh/862881015/arcgis_js_api@v1.0.0/init.js" }).then(() => {
            esriLoader
                .loadModules([
                    "esri/layers/ArcGISTiledMapServiceLayer",
                    "esri/geometry/Point",
                    "esri/geometry/Polyline",
                    "esri/geometry/Polygon",
                    "esri/map",
                    "esri/layers/GraphicsLayer",
                    "esri/graphic",
                    "esri/symbols/SimpleMarkerSymbol",
                    "esri/symbols/SimpleFillSymbol",
                    "esri/symbols/SimpleLineSymbol",
                    "esri/symbols/PictureMarkerSymbol",

                    "esri/symbols/TextSymbol",
                    "esri/symbols/Font",
                    "esri/Color",
                    "esri/SpatialReference",
                    "esri/InfoTemplate",
                    "esri/dijit/Scalebar",
                    "esri/geometry/Extent",
                    "esri/layers/MapImageLayer",
                    "esri/layers/MapImage",
                    "esri/toolbars/draw",
                    "../layers/TDTImageLayer.js",
                    "../layers/TDTImageAnnoLayer.js",
                    "../layers/TDTVectorLayer.js",
                    "../layers/TDTVectorAnnoLayer.js"
                ])
                .then(
                    ([
                        ArcGISTiledMapServiceLayer,
                        Point,
                        Polyline,
                        Polygon,
                        Map,
                        GraphicsLayer,
                        Graphic,
                        SimpleMarkerSymbol,
                        SimpleFillSymbol,
                        SimpleLineSymbol,
                        PictureMarkerSymbol,
                        TextSymbol,
                        Font,
                        Color,
                        SpatialReference,
                        InfoTemplate,
                        Scalebar,
                        Extent,
                        MapImageLayer,
                        MapImage,
                        Draw,

                        TDTImageLayer,
                        TDTImageAnnoLayer,
                        TDTVectorLayer,
                        TDTVectorAnnoLayer
                    ]) => {
                        var spatialReference = new SpatialReference({
                            wkid: 4490
                        });
                        _this.spatialReference = spatialReference;

                        var map = new Map("map", {
                            logo: false,
                            slider: false,
                            maxZoom: 14
                        });
                        _this.map = map;

                        // 比例尺
                        var scalebar = new Scalebar({
                            map: map,
                            attachTo: "bottom-left",
                            scalebarStyle: "ruler",
                            scalebarUnit: "metric"
                        });

                        var initExtent = new Extent({
                            xmax: 132.2807947421875,
                            xmin: 116.46048224218751,
                            ymax: 37.77832369269531,
                            ymin: 8.95019869269531,
                            spatialReference: spatialReference
                        });
                        map.setExtent(initExtent);

                        // var tdtImageLayer = new TDTImageLayer({ visible: false });
                        // var tdtImageAnnoLayer = new TDTImageAnnoLayer({ visible: false });
                        var tdtVecLayer = new TDTVectorLayer();
                        var tdtVecAnnoLayer = new TDTVectorAnnoLayer();
                        map.addLayers([tdtVecLayer, tdtVecAnnoLayer]);
                        _this.loadTyphoon();
                    }
                );
        });
    }

    loadTyphoon() {
        this.typhoon = new Typhoon({
            map: this.map,
            typhoonInfo: typhoonInfo
        });

        // 加载台风名
        const latestPosition = typhoonInfo.points[typhoonInfo.points.length - 1];
        $("#typhoon-name>.title").text(`${typhoonInfo.tfid}${typhoonInfo.name}(${typhoonInfo.enname})`);
        $("#typhoon-name>.subtitle").text(`等级:${latestPosition.strong}`);

        // 加载当前台风
        this.typhoon.showTyphoon(typhoonInfo);
    }
}

var app = new App();
