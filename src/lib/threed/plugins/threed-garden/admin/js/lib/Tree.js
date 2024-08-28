/*
 * @author mattatz / http://mattatz.github.io/
 * */

/*
 * params
 *  theta : the amount of randomization direction
 *  attenuation : the attenuation rate of length
 *  rootRange : the range of segments for branch' parent
 * */
THREE.TreeSpawner = function(params) {
    params = params || {};
    this.theta = params.theta || Math.PI * 0.5; 
    this.attenuation = params.attenuation || 0.75; 

    this.rootRange = params.rootRange || new THREE.Vector2(0.75, 1.0);
};

THREE.TreeSpawner.prototype = {
    spawn : function(branch, extension) {
        var theta = this.theta;
        var atten = this.attenuation;

        var htheta = theta * 0.5;
        var x = Math.random() * theta - htheta;
        var z = Math.random() * theta - htheta;
        var len = branch.length * atten;

        var rot = new THREE.Matrix4();
        var euler = new THREE.Euler(x, 0, z);
        rot.makeRotationFromEuler(euler);
        rot.multiply(branch.rotation);

        var segmentIndex;
        extension = extension || false;
        if(extension) {
            segmentIndex = branch.segments.length - 1;
        } else {
            segmentIndex = Math.floor((Math.random() * (this.rootRange.y - this.rootRange.x) + this.rootRange.x) * branch.segments.length);
        }

        var segment = branch.segments[segmentIndex];
        return new THREE.TreeBranch({
            from : segment,
            rotation : rot,
            length : len,
            uvOffset : segment.uvOffset,
            uvLength : branch.uvLength,
            generation : branch.generation + 1,
            generations : branch.generations,
            radius : branch.radius,
            radiusSegments : branch.radiusSegments,
            heightSegments : branch.heightSegments
        });
    }
};

/*
 * params
 *  from : THREE.Vector3 or TreeSegment
 *  rotation : THREE.Matrix4
 *  length : Number
 *  generation : branch' generation from root
 *  generations : the # of generations
 * */
THREE.TreeBranch = function(params) {
    var from = params.from;
    this.rotation = params.rotation;
    this.length = params.length;

    this.generation = params.generation || 0;
    this.generations = params.generations;

    this.uvLength = params.uvLength || 10.0;
    this.uvOffset = params.uvOffset || 0.0;
    this.radius = params.radius || 0.1;
    this.radiusSegments = params.radiusSegments;
    this.heightSegments = params.heightSegments;

    if(from instanceof THREE.TreeSegment) {
        this.from = from;
        // this.position = from.position;
        this.position = from.position.clone().add(new THREE.Vector3(0, 1, 0).applyMatrix4(from.rotation).setLength(0.05));
    } else if(from instanceof THREE.Vector3) {
        this.from = null; // root branch
        this.position = from;
    } else {
        console.warning("from argument is missing !");
    }

    var direction = (new THREE.Vector3(0, 1, 0)).applyMatrix4(this.rotation);
    this.to = this.position.clone().add(direction.setLength(this.length));

    this.segments = this.buildTreeSegments(this.radius, this.radiusSegments, direction, this.heightSegments);
    this.children = [];
}

THREE.TreeBranch.prototype = {

    buildTreeSegments : function(radius, radiusSegments, direction, heightSegments) {

        // randomize control point
        var theta = Math.PI * 0.25;
        var htheta = theta * 0.5;
        var x = Math.random() * theta - htheta;
        var z = Math.random() * theta - htheta;
        var rot = new THREE.Matrix4();
        var euler = new THREE.Euler(x, 0, z);
        rot.makeRotationFromEuler(euler);
        direction.applyMatrix4(rot);
        var controlPoint = this.position.clone().add(direction.setLength(this.length * 0.5));

        var curve = new THREE.CatmullRomCurve3([this.position, controlPoint, this.to]);

        var fromRatio = this.generation == 0 ? 1.0 : 1.0 - this.generation / (this.generations + 1);
        var toRatio = 1.0 - (this.generation + 1) / (this.generations + 1);

        var fromRadius = radius * fromRatio;
        var toRadius = radius * toRatio;

        var rotation = this.rotation;

        var segments = [];
        var uvLength = this.uvLength;
        var uvOffset = this.uvOffset;
        var points = curve.getPoints(heightSegments);

        if(this.from !== null) {
            uvOffset += this.from.position.distanceTo(points[0]) / uvLength;
        }

        segments.push(new THREE.TreeSegment(points[0], rotation, uvOffset, fromRadius, radiusSegments));

        for(var i = 1; i < heightSegments; i++) {
            var p0 = points[i];
            var p1 = points[i + 1];

            var ry = i / (heightSegments - 1);
            var radius = fromRadius + (toRadius - fromRadius) * ry;
            var d = p1.distanceTo(p0);
            uvOffset += d / uvLength;

            var segment = new THREE.TreeSegment(p0, rotation, uvOffset, radius, radiusSegments);
            segments.push(segment);
        }

        return segments;
    },

    branch : function(spawner, count) {
        for(var i = 0; i < count; i++) {
            // MEMO:
            //  at least one child is an extended branch.
            this.spawn(spawner, i == 0);
        }
        this.children.forEach(function(child) {
            child.branch(spawner, count - 1);
        });
    },

    grow : function(spawner, count) {
        if(this.children.length <= 0) {
            this.branch(spawner, 1);
        } else {
            this.children.forEach(function(child) {
                child.grow(spawner);
            });
        }
    },

    spawn : function(spawner, extension) {
        var child = spawner.spawn(this, extension);
        this.children.push(child);
    },

    branchlets : function() {
        if(this.children.length == 0) {
            return this;
        } else {
            return Array.prototype.concat.apply(
                [],
                this.children.map(function(child) { return child.branchlets(); })
            );
        }
    },

    calculateLength : function() {
        var segments = this.segments;
        var length = 0;
        for(var i = 0, n = segments.length - 1; i < n; i++) {
            var p0 = segments[i].position;
            var p1 = segments[i + 1].position;
            length += p0.distanceTo(p1);
        }
        return length;
    }

};

/*
 * position : THREE.Vector3
 * rotation : THREE.Matrix4
 * */
THREE.TreeSegment = function(position, rotation, uvOffset, radius, radiusSegments) {
    this.position = position;
    this.rotation = rotation;
    this.uvOffset = uvOffset;
    this.radius = radius;

    this.vertices = [];
    this.uvs = [];

    this.build(radius, radiusSegments);
}

THREE.TreeSegment.prototype = {

    build : function(radius, radiusSegments) {
        var thetaLength = Math.PI * 2;
        for(var x = 0; x <= radiusSegments; x++) {
            var u = x / radiusSegments;
            var vertex = new THREE.Vector3(radius * Math.sin(u * thetaLength), 0, radius * Math.cos(u * thetaLength)).applyMatrix4(this.rotation).add(this.position);

            this.vertices.push(vertex);
            this.uvs.push(new THREE.Vector2(u, this.uvOffset));
        }
    }
    
};

THREE.Tree = function(params, spawner) {
    params = params || {};

    var from = params.from || new THREE.Vector3();
    var rotation = new THREE.Matrix4();
    if(params.rotation) {
        if(params.rotation instanceof THREE.Euler) {
            var euler = params.rotation;
            rotation.makeRotationFromEuler(euler);
        } else if(params.rotation instanceof THREE.Matrix4) {
            rotation = params.rotation;
        }
    }

    var length = params.length || 3.0;
    var uvLength = params.uvLength || 10.0;
    var generations = (params.generations !== undefined) ? params.generations : 5;

    var radius = params.radius || 0.1;
    this.radiusSegments = params.radiusSegments || 8;
    this.heightSegments = params.heightSegments || 8;

    this.generations = generations;
    this.root = new THREE.TreeBranch({ 
        from : from,
        rotation : rotation,
        length : length,
        uvLength : uvLength,
        generation : 0,
        generations : this.generations,
        radius : radius,
        radiusSegments : this.radiusSegments,
        heightSegments : this.heightSegments
    });

    this.spawner = spawner || new THREE.TreeSpawner();
    this.root.branch(this.spawner, this.generations);
}

THREE.Tree.prototype = {

    grow : function(count, spawner) {
        spawner = spawner || this.spawner;

        this.generation++;
        this.root.grow(spawner, count);
    },

    branchlets : function() {
        return this.root.branchlets();
    }

};

