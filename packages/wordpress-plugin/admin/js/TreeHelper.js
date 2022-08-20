/*
 * @author mattatz / http://mattatz.github.io/
 * */

THREE.TreeHelper = function(system) {
    THREE.Object3D.call(this);

    this.system = system;
}

THREE.TreeHelper.prototype = Object.create(THREE.Object3D.prototype);
THREE.TreeHelper.prototype.constructor = THREE.TreeHelper;

THREE.TreeHelper.prototype.clear = function() {
    for(var i = this.children.length - 1; i >= 0; i--) {
        this.remove(this.children[i]);
    }
};

THREE.TreeHelper.prototype.showLine = function(opt) {
    this.clear();

    var geometry = THREE.TreeGeometry.buildLineStrips(this.system);
    var vertices = geometry.vertices;

    opt = opt || {};

    var line = new THREE.LineSegments(
        geometry, 
        new THREE.LineBasicMaterial({
            linewidth : opt.linewidth || 1,
            color : opt.linecolor || 0x00ff00
        })
    );
    this.add(line);

    geometry = new THREE.Geometry();
    for(var i = 0, n = vertices.length; i < n; i += 2) {
        geometry.vertices.push(vertices[i]);
    }
    var points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size : opt.pointsize || 0.05,
            color : opt.pointcolor || 0xff0000
        })
    );
    this.add(points);

};

