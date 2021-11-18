/*
 * @author mattatz / http://mattatz.github.io/
 * */

THREE.TreeGeometry = {

    /*
     * build branch surface geometry.
     * */
    build : function(tree) {
        var geometry = new THREE.Geometry();

        this.buildBranches(tree.root, geometry);
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        return geometry;
    },

    /*
     * build geometry recursively
     * */
    buildBranches : function(branch, geometry) {
        var radiusSegments = branch.radiusSegments;
        var heightSegments = branch.segments.length - 1;

        var thetaLength = Math.PI * 2;

        var vertices = [];
        var faces = [];
        var faceVertexUvs = [];

        var indices = [];
        var uvs = [];

        var index = 0;
        var offset = geometry.vertices.length;

        for(var y = 0; y <= heightSegments; y++) {

            var indicesRow = [];
            var uvsRow = [];

            var segment = branch.segments[y];

            var ry = (y + 1) / heightSegments;

            vertices = vertices.concat(segment.vertices);
            uvs.push(segment.uvs);

            for(var x = 0; x <= radiusSegments; x++) {
                indicesRow.push(index++);
            }

            indices.push(indicesRow);
        }

        for(var x = 0; x < radiusSegments; x++) {
            for(var y = 0; y < heightSegments; y++) {
                var cy = y, ny = y + 1;
                var cx = x, nx = x + 1;

                var v1 = indices[cy][cx] + offset;
                var v2 = indices[ny][cx] + offset;
                var v3 = indices[ny][nx] + offset;
                var v4 = indices[cy][nx] + offset;

                var uv1 = uvs[cy][cx];
                var uv2 = uvs[ny][cx];
                var uv3 = uvs[ny][nx];
                var uv4 = uvs[cy][nx];

                faces.push(new THREE.Face3(v1, v4, v2));
                faceVertexUvs.push([uv1, uv4, uv2]);

                faces.push(new THREE.Face3(v2, v4, v3));
                faceVertexUvs.push([uv2, uv4, uv3]);
            }
        }

        // bottom cap

        /*
         * root branch
         * */
        if(branch.from === null) {
            var bottom = branch.segments[0];
            vertices.push(bottom.position);
            indices.push(index++);

            var y = 0;

            for(var x = 0; x < radiusSegments; x++) {
                var v1 = indices[y][x] + offset;
                var v2 = indices[y][x + 1] + offset;
                var v3 = index - 1 + offset;

                var uv1 = uvs[y][x];
                var uv2 = uvs[y][x + 1];
                var uv3 = new THREE.Vector2(uv2.x, branch.uvOffset);

                faces.push(new THREE.Face3(v1, v3, v2));
                faceVertexUvs.push([uv1, uv3, uv2]);
            }
        } else {
            var from = branch.from;

            var y = 0;
            vertices = vertices.concat(from.vertices);

            var bottomIndices = [];
            for(var x = 0; x <= radiusSegments; x++) {
                bottomIndices.push((index++) + offset);
            }

            for(var x = 0; x < radiusSegments; x++) {
                var v0 = indices[y][x] + offset;
                var v1 = indices[y][x + 1] + offset;
                var v2 = bottomIndices[x];
                var v3 = bottomIndices[x + 1];

                var uv0 = uvs[y][x];
                var uv1 = uvs[y][x + 1];
                var uv2 = from.uvs[x];
                var uv3 = from.uvs[x + 1];

                faces.push(new THREE.Face3(v0, v3, v1));
                faceVertexUvs.push([uv0, uv3, uv1]);

                faces.push(new THREE.Face3(v0, v2, v3));
                faceVertexUvs.push([uv0, uv2, uv3]);
            }
        }

        geometry.vertices = geometry.vertices.concat(vertices);
        geometry.faces = geometry.faces.concat(faces);
        geometry.faceVertexUvs[0] = geometry.faceVertexUvs[0].concat(faceVertexUvs);

        var self = this;
        branch.children.forEach(function(child) {
            self.buildBranches(child, geometry);
        });
    },

    /*
     * build line strips geometry for THREE.Line object.
     * */
    buildLineStrips : function(tree) {
        var vertices = [];

        var recur = function(branch) {
            var segments = branch.segments;
            for(var i = 0, n = segments.length; i < n - 1; i++) {
                var s0 = segments[i];
                var s1 = segments[i + 1];
                vertices.push(s0.position, s1.position);
            }

            branch.children.forEach(function(child) {
                recur(child);
            });
        };
        recur(tree.root);

        var geometry = new THREE.Geometry();
        geometry.vertices = vertices;
        return geometry;
    },

    calculateLength : function(tree) {
        return this.calculateSegmentLength(tree.root);
    },

    calculateSegmentLength : function(branch) {
        var longest = 0.0;
        var self = this;
        branch.children.forEach(function(child) {
            var len = self.calculateSegmentLength(child);
            if(len > longest) {
                longest = len;
            }
        });
        return longest + branch.calculateLength();
    }

};

