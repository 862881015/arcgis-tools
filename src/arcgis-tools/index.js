let test = function() {
    console.log("test");
};

// require("./static/imgs/typhoon.gif");
// require("./static/imgs/rddy.png");
// require("./static/imgs/rdfb.png");
// require("./static/imgs/qrdfb.png");
// require("./static/imgs/tf.png");
// require("./static/imgs/qtf.png");
// require("./static/imgs/cqtf.png");

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
                // 调换风圈半径字符串的顺序为顺时针，东北->东南->西北->西南
                item.radius7 = sortRadiusStr(item.radius7);
                item.radius10 = sortRadiusStr(item.radius10);
                item.radius12 = sortRadiusStr(item.radius12);
                return item;
            });
        var graLayer = new esri.layers.GraphicsLayer({ id: "tf_" + this.typhoonInfo.tfid });
        this.map.addLayer(graLayer);

        // 台风中心点
        var TFQ = new esri.Graphic();
        var TFQ_Symbol = new esri.symbol.PictureMarkerSymbol("./static/imgs/typhoon.gif", 32, 32);
        TFQ.setSymbol(TFQ_Symbol);
        graLayer.add(TFQ);

        // 台风路径线
        var trackLine = new esri.geometry.Polyline(this.map.spatialReference);
        var lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color([30, 144, 255]), 2);
        var trackLineGra = new esri.Graphic();
        trackLineGra.setSymbol(lineSymbol);
        graLayer.add(trackLineGra);

        var index = 0,
            _this = this,
            trackPaths = [[]],
            graphic_seven = InitGraphic(0.3), //七级风圈graphic
            graphic_ten = InitGraphic(0.5), //十级风圈graphic
            graphic_twelve = InitGraphic(0.7); //十二级风圈graphic
        var inteval = setInterval(function() {
            var _point = points[index];
            var point = new esri.geometry.Point(_point.lng, _point.lat, _this.map.spatialReference);
            var symbol = _this.getSymbol(_point.speed);
            var graphic = new esri.Graphic(point, symbol, Object.assign({}, _point, { type: "历史", name: _this.typhoonInfo.name, tfid: _this.typhoonInfo.tfid }));
            graLayer.add(graphic);
            TFQ.setGeometry(point);

            trackPaths[0].push([_point.lng, _point.lat]);
            trackLine = new esri.geometry.Polyline(trackPaths);
            trackLineGra.setGeometry(trackLine);

            //#region 七级、十级、十二级风圈
            graphic_seven.setGeometry(null);
            graphic_ten.setGeometry(null);
            graphic_twelve.setGeometry(null);
            _point.radius7 != "" ? _this.showTFQCircle(_point.radius7, _point, graphic_seven) : null;
            _point.radius10 != "" ? _this.showTFQCircle(_point.radius10, _point, graphic_ten) : null;
            _point.radius12 != "" ? _this.showTFQCircle(_point.radius12, _point, graphic_twelve) : null;
            //#endregion

            if (index === 0) {
                _this.map.centerAt(point);
            }

            if (++index === points.length) {
                clearInterval(inteval);
                _this.map.centerAt(point);
                _this.showForecast(graLayer);
            }
        }, 70);

        graLayer.on("mouse-over", function(e) {
            let graphic = e.graphic;

            if (graphic.attributes) {
                _this.showDetail(graphic.attributes, e.graphic.geometry);
            }
        });

        graLayer.on("mouse-out", function(e) {
            _this.map.infoWindow.hide();
        });

        // 调换风圈半径字符串的顺序
        function sortRadiusStr(radiusStr) {
            if (radiusStr !== "") {
                let arr = radiusStr.split("|");
                arr[3] = arr.splice(2, 1)[0];
                radiusStr = arr.join("|");
            }
            return radiusStr;
        }

        // 七级、十级、十二级风圈graphic
        function InitGraphic(opacity) {
            let symbol = new esri.symbol.SimpleFillSymbol(
                esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color([238, 160, 29, 0.8]), 1),
                new esri.Color([238, 160, 29, opacity])
            );
            let graphic = new esri.Graphic();
            graphic.setSymbol(symbol);
            graLayer.add(graphic);
            return graphic;
        }
    }

    /**
     * 展示七级、十级、十二级风圈
     * @param {} radiusStr
     */
    showTFQCircle(radiusStr, _point, graphic) {
        let points = getPoints([_point.lng, _point.lat]);
        graphic.setGeometry(
            new esri.geometry.Polygon({
                rings: [points],
                spatialReference: this.map.spatialReference
            })
        );

        // 获取扇形点位
        function getPoints(center) {
            let points = new Array();

            for (let i = 0; i < 4; i++) {
                let startAngle = 90 * i,
                    endAngle = 90 * (i + 1),
                    radius = radiusStr.split("|")[i] / 111;

                for (let j = 0; j <= 30; j++) {
                    let angle = startAngle + ((endAngle - startAngle) * j) / 30;
                    let sin = Math.sin((angle * Math.PI) / 180);
                    let cos = Math.cos((angle * Math.PI) / 180);
                    let x = center[0] + radius * sin;
                    let y = center[1] + radius * cos;
                    points.push([x, y]);
                }
            }
            return points;
        }
    }

    // 展示中国预报路径
    showForecast(graLayer) {
        let ybPaths = [[]],
            lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_LONGDASHDOT, new esri.Color([255, 0, 0]), 1),
            ybLineGra = new esri.Graphic();
        ybLineGra.setSymbol(lineSymbol);
        graLayer.add(ybLineGra);

        let forecast = this.typhoonInfo.points[this.typhoonInfo.points.length - 1].forecast.find(item => item.tm === "中国").forecastpoints;
        forecast.forEach((item, index) => {
            if (index !== 0) {
                let point = new esri.geometry.Point(item.lng, item.lat, this.map.spatialReference);
                let symbol = this.getSymbol(item.speed);
                let graphic = new esri.Graphic(point, symbol, Object.assign({}, item, { type: "预报", name: this.typhoonInfo.name, tfid: this.typhoonInfo.tfid }));
                graLayer.add(graphic);
            }

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

    // 获取台风详情信息
    showDetail(data, point) {
        var html = "<div>";
        if (data.type === "历史") {
            html += "<div>台风名称：" + data.name + "(" + data.tfid + ")</div>";
            html += "<div>到达时间：" + data.time + "</div>";
            html += "<div>中心位置：" + data.lng + "," + data.lat + "</div>";
            html += "<div>风速风力：" + data.speed + " 米/秒," + data.power + "级(" + data.strong + ")" + "</div>";
            html += "<div>中心气压：" + data.pressure + " 百帕</div>";
            html += "<div>移速移向：" + data.movespeed + "公里/小时, " + data.movedirection + "</div>";
            data.radius7 !== "" ? (html += "<div>七级风圈半径：" + getRadiusRange(data.radius7) + "公里</div>") : null;
            data.radius10 !== "" ? (html += "<div>十级风圈半径：" + getRadiusRange(data.radius10) + "公里</div>") : null;
            data.radius12 !== "" ? (html += "<div>十二级风圈半径：" + getRadiusRange(data.radius12) + "公里</div>") : null;
        } else {
            html += "<div>台风名称：" + data.name + "(" + data.tfid + ")</div>";
            html += "<div>预报台：中国</div>";
            html += "<div>到达时间：" + data.time + "</div>";
            html += "<div>中心位置：" + data.lng + "," + data.lat + "</div>";
            html += "<div>风速风力：" + data.speed + " 米/秒," + data.power + "级(" + data.strong + ")" + "</div>";
            html += "<div>中心气压：" + data.pressure + " 百帕</div>";
        }
        html += "</div>";

        this.map.infoWindow.setContent(html);
        this.map.infoWindow.show(point);

        // 获取风圈半径
        function getRadiusRange(radiusStr) {
            var arr = radiusStr.split("|");
            var max = Math.max.apply(null, arr),
                min = Math.min.apply(null, arr);
            return min + "~" + max;
        }
    }
}

// module.exports = {
//     test,
//     Typhoon
// }

export { test, Typhoon };
