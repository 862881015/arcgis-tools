let path = require('path');
let webpack = require('webpack');
const HtmlWebpackPlugin = require("html-webpack-plugin");

let scriptLoader = [{
    loader: "babel-loader"
}];

module.exports = {
    mode: 'development',
    devtool: 'source-map', // webpack4在开发阶段可以不写devtool
    devServer: {
        host: '0.0.0.0',
        port: 8889,
        hot: true,
        overlay: true
        // compress: true
    },
    entry: {
        app: './index.js'
    },
    output: {
        path: path.join(__dirname, 'dist'), //输出目录的配置，模板、样式、脚本、图片等资源的路径配置都相对于它
        filename: "bundle.js"
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: scriptLoader
        }]
    },
    plugins: [
        // 开发环境和生产环境二者均需要的插件
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: path.resolve(__dirname, "index.html"),
            chunks: ["app"],
            minify: {
                collapseWhitespace: true
            }
        })
    ]
};