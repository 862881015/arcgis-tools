let test = function() {
    console.log("test");
};

class Typhoon {
    constructor(option) {
        this.map = option.map;
        this.typhoonInfo = option.typhoonInfo;

        this.loadAlarmLine();
        this.initSymbol();
        this.showTyphoon();
    }

    // 加载24/48小时警戒线
    loadAlarmLine() {
        let alarmLineLayer = new esri.layers.GraphicsLayer();
        this.map.addLayer(alarmLineLayer);

        const lineArr24 = [
            [
                [127, 34],
                [127, 22],
                [120, 18],
                [120, 11],
                [105, 0]
            ]
        ];
        const lineArr48 = [
            [
                [132, 34],
                [132, 15],
                [120, 0],
                [105, 0]
            ]
        ];

        const symbol24 = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1);
        const symbol48 = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOTDOT, new dojo.Color([21, 129, 29]), 1);

        let polyline_24 = new esri.geometry.Polyline(lineArr24);
        let graphic_24 = new esri.Graphic(polyline_24, symbol24);
        alarmLineLayer.add(graphic_24);

        let polyline_48 = new esri.geometry.Polyline(lineArr48);
        let graphic_48 = new esri.Graphic(polyline_48, symbol48);
        alarmLineLayer.add(graphic_48);
    }

    // 初始化symbol
    initSymbol() {
        this.speed_symbol = [
            { range: "10.8-17.1", color: [52, 255, 68], symbol: new esri.symbol.PictureMarkerSymbol("./static/imgs/rddy.png", 10, 10) },
            { range: "17.2-24.4", color: [1, 107, 248], symbol: new esri.symbol.PictureMarkerSymbol("./static/imgs/rdfb.png", 10, 10) },
            { range: "24.5-32.6", color: [253, 247, 69], symbol: new esri.symbol.PictureMarkerSymbol("./static/imgs/qrdfb.png", 10, 10) },
            { range: "32.7-41.4", color: [251, 166, 48], symbol: new esri.symbol.PictureMarkerSymbol("./static/imgs/tf.png", 10, 10) },
            { range: "41.5-50.9", color: [237, 111, 241], symbol: new esri.symbol.PictureMarkerSymbol("./static/imgs/qtf.png", 10, 10) },
            { range: "51-", color: [250, 0, 18], symbol: new esri.symbol.PictureMarkerSymbol("./static/imgs/cqtf.png", 10, 10) }
        ];
    }

    // 展示台风
    showTyphoon() {
        var points = this.typhoonInfo.points
            .filter(item => item.lat && item.lng)
            .map(item => {
                item.lng = parseFloat(item.lng);
                item.lat = parseFloat(item.lat);
                return item;
            });
        var graLayer = new esri.layers.GraphicsLayer({ id: "tf_" + this.typhoonInfo.tfid });
        this.map.addLayer(graLayer);

        // 台风圈
        var TFQ = new esri.Graphic();
        var TFQ_Symbol = new esri.symbol.PictureMarkerSymbol("./static/imgs/typhoon.gif", 32, 32);
        TFQ.setSymbol(TFQ_Symbol);
        graLayer.add(TFQ);

        // 台风路径线
        var trackLine = new esri.geometry.Polyline(this.map.spatialReference);
        var lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color([30, 144, 255]), 1);
        var trackLineGra = new esri.Graphic();
        trackLineGra.setSymbol(lineSymbol);
        graLayer.add(trackLineGra);

        var index = 0,
            _this = this,
            trackPaths = [[]];
        var inteval = setInterval(function() {
            var point = new esri.geometry.Point(points[index].lng, points[index].lat, _this.map.spatialReference);
            var symbol = _this.getSymbol(points[index].speed);
            var graphic = new esri.Graphic(point, symbol);
            graLayer.add(graphic);
            TFQ.setGeometry(point);

            trackPaths[0].push([points[index].lng, points[index].lat]);
            trackLine = new esri.geometry.Polyline(trackPaths);
            trackLineGra.setGeometry(trackLine);

            if (index === 0) {
                _this.map.centerAt(point);
            }

            if (++index === points.length) {
                clearInterval(inteval);
                _this.map.centerAt(point);
                _this.showForecast(graLayer);
            }
        }, 70);
    }

    // 展示中国预报路径
    showForecast(graLayer) {
        let ybPaths = [[]],
            lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_LONGDASHDOT, new esri.Color([255, 0, 0]), 1),
            ybLineGra = new esri.Graphic();
        ybLineGra.setSymbol(lineSymbol);
        graLayer.add(ybLineGra);

        let forecast = this.typhoonInfo.points[this.typhoonInfo.points.length - 1].forecast.find(item => item.tm === "中国").forecastpoints;
        forecast.forEach(item => {
            let point = new esri.geometry.Point(item.lng, item.lat, this.map.spatialReference);
            let symbol = this.getSymbol(item.speed);
            let graphic = new esri.Graphic(point, symbol);
            graLayer.add(graphic);

            ybPaths[0].push([item.lng, item.lat]);
        });
        let ybLine = new esri.geometry.Polyline(ybPaths);
        ybLineGra.setGeometry(ybLine);
    }

    // 获取台风等级对应的圆点样式
    getSymbol(speed) {
        var mapping = this.speed_symbol.find(item => {
            var minMax = item.range.split("-");
            return speed >= minMax[0] && (minMax[1] !== "" ? speed <= minMax[1] : true);
        });
        return mapping.symbol;
    }
}

export { test, Typhoon };
