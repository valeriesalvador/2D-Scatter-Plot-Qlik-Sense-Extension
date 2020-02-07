define( ["qlik", "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.16/d3.min.js"],
	function ( qlik, d3 ) {

		return {
			template: '<div qv-extension style="height: 100%; position: relative; overflow: auto;" class="ng-scope"><div class="rink" ng-style="{\'background-image\': \'url(\' + imgUrl + \')\'}" style="background-repeat: no-repeat; background-size: contain;"></div> </div>',
			initialProperties: {
				qHyperCubeDef: {
					qDimensions: [],
					qMeasures: [],
					qInitialDataFetch: [{
						qWidth: 20,
						qHeight: 500
					}]
				}
			},
			definition: {
				type: "items",
				component: "accordion",
				items: {
					dimensions: {
						uses: "dimensions",
						min: 1,
						max: 2
					},
					measures: {
						uses: "measures",
						min: 2,
						max: 3
					},
					sorting: {
						uses: "sorting"
					},
					settings: {
						uses: "settings",
						items: {
							Background: {
								type: "items",
								label: "Background",
								items: {
									url: {
										type: "string",
										label: "Url",
										ref: "settings.background.url",
										expression: "optional"
									},
									width: {
										type: "number",
										label: "Width",
										ref: "settings.background.width"
									},
									height: {
										type: "number",
										label: "Height",
										ref: "settings.background.height"
									}
								}
							},
							Plot: {
								type: "items",
								label: "Plot",
								items: {
									xLower: {
										type: "number",
										label: "x-axis lower bound",
										ref: "settings.plot.xLower"
									},
									xUpper: {
										type: "number",
										label: "x-axis upper bound",
										ref: "settings.plot.xUpper"
									},
									yLower: {
										type: "number",
										label: "y-axis lower bound",
										ref: "settings.plot.yLower"
									},
									yUpper: {
										type: "number",
										label: "y-axis upper bound",
										ref: "settings.plot.yUpper"
									},
									dotSize: {
										type: "number",
										label: "dot size",
										ref: "settings.plot.dotSize",
										expression : "optional"
									}
								}
							},
							Other: {
								type: "items",
								label: "Other",
								items: {
									selections: {
										type: "boolean",
										component: "switch",
										label: "Selections",
										ref: "settings.other.selections",
										options: [{
											value: true,
											label: "On"
										}, {
											value: false,
											label: "Off"
										}],
										defaultValue: true
									},
									hoverText: {
										type:"string",
										label:"Hover Text",
										ref: "settings.other.hoverText",
									}
								}
							}
						}
					}
				}
			},
			support: {
				snapshot: true,
				export: true,
				exportData: false
			},
			paint: function ($element, layout) {

				var self = this;
				var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;
				console.log(qMatrix);
				var data = [];
				$.each(qMatrix, function(key, val) {
					var obj = {
						shotNumber: val[0].qText,
						xVal: val[1].qNum,
						yVal: val[2].qNum,
						color: val[3] ? val[3].qText : "black",
						state: val[0].qState,
						elemNumber: val[0].qElemNumber
					};
					data.push(obj);
				});

				var $rink = $element.find(".rink");
				$rink.empty();

				var width = $element.width(),
					height = $element.height();
				var x = d3.scale.linear()
							.domain([layout.settings.plot.xLower, layout.settings.plot.xUpper]) //[1, 30]
							.range([0, layout.settings.background.width]);
				var y = d3.scale.linear()
							.domain([layout.settings.plot.yUpper, layout.settings.plot.yLower]) //[25, 1]
							.range([0, layout.settings.background.height]);
				var svg = d3.select($rink.get(0)).append('svg')
							.attr("viewBox", "0 0 " + layout.settings.background.width + " " + layout.settings.background.height)
							.attr("preserveAspectRatio", "xMinYMin meet");
				var tooltip = d3.select($rink.get(0)).append('div')
							.attr("class", "tooltip");


				const circle=svg.selectAll(".shot-dots")
					.data(data)
						.attr("cx", function(d) { return x(d.xVal) })
						.attr("cy", function(d) { return y(d.yVal) })
						.attr("fill", function(d) { if(d.state ==="X"){return "#ccc"} else{return d.color} })
					.enter()
							.append("circle")
							.attr("class", "shot-dots")
							.attr("cx", function(d) { return x(d.xVal) + x(layout.settings.plot.xLower + 1)/2 - layout.settings.plot.dotSize/2 })
							.attr("cy", function(d) { return y(d.yVal) + y(layout.settings.plot.yUpper - 1)/2 - layout.settings.plot.dotSize/2 })
							.attr("fill", function(d) { if(d.state ==="X"){return "#ccc"} else{ return d.color} })
							.attr("r", layout.settings.plot.dotSize)
							.on("click", function(d) {
								if (layout.settings.other.selections) {
									self.backendApi.selectValues(0, [d.elemNumber], true);
								}
							})
							.on("mouseover", function(d) {
								d3.select(this).transition().attr("r", layout.settings.plot.dotSize * 1.5);
								tooltip.style("left", (d3.event.offsetX + 15) +"px");
								tooltip.style("top", (d3.event.offsetY) +"px");
								console.log(d3.event.offsetY+"px");
								tooltip.style("display", "inline-block");
								tooltip.style("position", "absolute");
								tooltip.style("background-color", "#0F1214");
								tooltip.style("color", "#ffffff");
								tooltip.style("padding", "15px");
								tooltip.style("opacity", "0.8");
								tooltip.style("border-radius", "0px 10px 10px 10px");
								tooltip.html(layout.qHyperCube.qDimensionInfo[0].qFallbackTitle + " : " + d.shotNumber + "<br/><br/>" + layout.qHyperCube.qMeasureInfo[0].qFallbackTitle + " : " + d.xVal + "<br/><br/>" + layout.qHyperCube.qMeasureInfo[1].qFallbackTitle + " : " + d.yVal);
							})
							.on("mouseout", function() {
								d3.select(this).transition().attr("r", layout.settings.plot.dotSize);
								tooltip.style("display", "none");
							});

				svg.selectAll(".shot-dots")
					.data(data)
					.exit().remove();

				return qlik.Promise.resolve();
			},
			controller: ['$scope', '$element', function ( $scope, $element ) {
				//$scope.imgUrl = require.s.contexts._.config.baseUrl + "../" + "extensions/hockey-rink-scatterplot/hockeyrink.jpg";
				$scope.$watch("layout.settings.background.url", function(url) {
					if(url.includes("\'")){
						$scope.imgUrl = url;
					}else{
						$scope.imgUrl = "\'" + url + "\'";
					}
						console.log($scope.imgUrl);
				});
			}]
		};

	} );
