angular.module('jarvis', [])

.controller('FuncController', function ($scope) {

  $scope.getFunc = function(func) {
    $scope.func = angular.copy(func);
  };

  $scope.getTree = function() {

    var globals = $scope.func.globals || '';
    var body = $scope.func.body;
    var call = $scope.func.call;
    var watch = $scope.func.watch || '';

    var firstLine = body.slice(0,body.indexOf('{')+1);
    var middle = body.slice(body.indexOf('{')+1,body.length-body.split('').reverse().indexOf('}')-1);
    var end = body.slice(body.length-body.split('').reverse().indexOf('}')-1);

    middle = JSON.parse(JSON.stringify(middle).replace('//highlight','node.children[node.children.length-1].pass = true;'));
    
    var makeTree = eval(
      "("
      +
      "function recursion() {"
      +
      globals
      +
      "$scope.width = 0;" +
      "var level = 0;" +
      "var ran = 0;" +
      "var callTree;"
      +
      firstLine
      +
      "var args = JSON.stringify(Array.prototype.slice.call(arguments));" +
      "ran++;" +
      "level++;" + 
      "if (level > $scope.width) {" +
        "$scope.width = level;"  +
      "}" + 
      "if (level === 1) {" +
        "callTree = {name: args, children: [], order: ran, watch: ['before: ' + eval(watch)]};" +
      "} else {" +
        "var node = callTree;" + 
        "for (var i = 2; i < level; i++) {" +
          "node = node.children[node.children.length-1];" +
        "}" +
        "node.children.push({name: args, children: [], order: ran, watch: ['before: ' + eval(watch)]});" +
      "}"
      +
      middle
      +
      "level--;" +
      "if (node) {node.children[node.children.length-1].watch.push(' after: ' + eval(watch));}" +
      "else {callTree.watch.push(' after: ' + eval(watch));}"
      +
      end
      +
      call
      +
      "return callTree;}"
      +
      ")"
    );

    $scope.tree = makeTree();
  };

  $scope.plotTree = function() {

    $scope.height = 0;
    var checkNode = function(tree) {
      if (tree.children.length === 0) {
        $scope.height++;
      } else {
        for (var i = 0; i < tree.children.length; i++) {
          checkNode(tree.children[i]);
        }
      }
    };
    checkNode($scope.tree);
  
    var width = $scope.width * 75;
    var height = $scope.height * 25; 

    var cluster = d3.layout.tree()
        .size([height, width - 110]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    d3.select("svg").remove();

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(100,0)");

    var nodes = cluster.nodes($scope.tree),
        links = cluster.links(nodes);

    var link = svg.selectAll("path.link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          if ($scope.func.watch) {
            return 'args: ' + d.name + '<br/>' + $scope.func.watch + ': [' + d.watch + ']';
          } else {
            return 'args: ' + d.name;
          } 
        })

    svg.call(tip);

    var node = svg.selectAll("g.node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

    node.append("circle")
        .attr("r", 5)
        .attr("class", "node")
        .attr("fill", function(d) { return (d.pass ? "red" : "black"); })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)

    node.append("text")
        .attr("dx", function(d) { return -8; })
        .attr("dy", 5)
        .attr("text-anchor", function(d) { return "end" ; })
        .text(function(d) { return d.order; });

    d3.select(self.frameElement).style("height", height + "px");
  };

  $scope.visualize = function(func) {
    $scope.getFunc(func);
    $scope.getTree();
    $scope.plotTree();
  };

});
