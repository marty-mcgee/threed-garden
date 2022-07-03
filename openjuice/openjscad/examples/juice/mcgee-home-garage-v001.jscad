// title: McGee Home Garage v001
// author: Marty McGee
// license: MIT
// url: http://www.marty-mcgee.com/playground/openjscad/#examples/mcgee-home-garage-v001.jscad
// revision: 0.011

function main() {
    return  build_garage().
			scale(1/12);//. // 1 foot = 12 inches
			//rotateY(1.0). // slight slope on Y axis ( west-to-east incline )
			//translate([0,0,0.5]); // below-to-above-ground ( 1/2 inch incline )
}

function build_garage() {
	// each var returns array of CSG.cube objects
	var garage_base = get_base();
	//var garage_posts = get_posts();
	//var garage_blocks = get_blocks();
	// boxes
	//var garage_box_A = get_box_A();
	//var garage_box_B = get_box_B();
	//var garage_box_C = get_box_C();
	//var garage_box_D = get_box_D();
	var garage_box_G = get_box_G();
	// caps (support)
	//var garage_caps_top = get_caps_top();
	//var garage_caps_bot = get_caps_bot();
	// lattice fences
	//var garage_fences = get_fences();
	// gate(s) and hinges
	var garage_gate_A = get_gate_A();
	var garage_gate_B = get_gate_B();
	var garage_gate_hinges = get_gate_hinges();
	
	var garage_render = 
		union(
			garage_base, 
			//garage_posts, 
			//garage_blocks,
			//garage_box_A,
			//garage_box_B,
			//garage_box_C,
			//garage_box_D,
			garage_box_G,
			//garage_caps_top,
			//garage_caps_bot,
			//garage_fences,
			garage_gate_A,
			garage_gate_B,
			garage_gate_hinges
		);
	
	return garage_render;
}

function get_base(){
	
	var garage,
		garage_full, 
		garage_base, 
		garage_main;
	var garage_uom = "inches";
	var garage_x = 320.5; // 26.708 feet
	var garage_y = 487.5; // 40.625 feet
	var garage_z = 360.0; // 30.000 feet
	var garage_base_x = garage_x;
	var garage_base_y = garage_y;
	var garage_base_z = garage_z - garage_z + 12.0; // z-z+1 foot
	var garage_main_x = garage_x;
	var garage_main_y = garage_y;
	var garage_main_z = garage_z - 12.0; // z-1 foot
	
	garage_full	= cube({size: [garage_x, garage_y, garage_z]}).
					translate([0,0,-12]).
					setColor([0.3,0.7,1.0,1.0]);
                    
	garage_base	= cube({size: [garage_base_x, garage_base_y, garage_base_z]}).
					translate([0,0,-12]).
					setColor([0.6,0.5,0.0,0.7]);
	
    garage_main	= cube({size: [garage_main_x, garage_main_y, garage_main_z]}).
					translate([0,0,0]).
					setColor([0.3,0.7,1.0,1.0]);
						
	garage = /*union(
				garage_full,*/
				garage_base/*,
				garage_main
			)*/;
	
	return garage_base;
}

function get_posts(){
	var posts = [];
	var posts_count = 13;
	// posts (box G)
	for(var p = 0; p < posts_count; p++) {
		// common post size and depth
		posts.push(
			cube({size: [3.5, 3.5, 72]}).
			translate([0, 0, -12]).
			setColor([0.6,0.3,0.0,1.0])
		);
	}
	// box G
	// west side
	posts[0] = posts[0].translate([0, 0, 0 ]); // stem post
	posts[1] = posts[1].translate([0, 94.25, 0 ]);
	posts[2] = posts[2].translate([0, 190.25, 0 ]);
	posts[3] = posts[3].translate([0, 286.25, 0 ]);
	posts[4] = posts[4].translate([0, 380.5, 0 ]);
	// north side
	posts[5] = posts[5].translate([94.25, 380.5, 0 ]);
	// east side
	posts[6] = posts[6].translate([188.5, 380.5, 0 ]);
	posts[7] = posts[7].translate([188.5, 286.25, 0 ]);
	posts[8] = posts[8].translate([188.5, 190.25, 0 ]);
	posts[9] = posts[9].translate([188.5, 94.25, 0 ]);
	posts[10] = posts[10].translate([188.5, 0, 0 ]);
	// south side
	//posts[11] = posts[11].translate([94.25, 0, 0 ]);
	posts[11] = posts[11].translate([142.25, 0, 0 ]);
	posts[12] = posts[12].translate([46.25, 0, 0 ]); // gate post
	
	return posts;
}

function get_blocks(){
	var blocks = [];
	var blocks_count = 25;
	
	// blocks (box ABCD)
	for(var b = 0; b < blocks_count; b++) {
		// common block size
		blocks.push(
		cube({size: [3.5, 3.5, 11]}).
			//.translate([0, 0, 0]);
			setColor([0.9,0.6,0.0,1.0])
		);
	}
	// box A
	blocks[0] = blocks[13].translate([49.5, 48, 0 ]);
	blocks[1] = blocks[14].translate([139, 48, 0 ]);
	blocks[2] = blocks[15].translate([49.5, 116.5, 0 ]);
	blocks[3] = blocks[16].translate([139, 116.5, 0 ]);
	// box B
	blocks[4] = blocks[17].translate([49.5, 156, 0 ]);
	blocks[5] = blocks[18].translate([139, 156, 0 ]);
	blocks[6] = blocks[19].translate([49.5, 224.5, 0 ]);
	blocks[7] = blocks[20].translate([139, 224.5, 0 ]);
	// box C
	blocks[8] = blocks[21].translate([49.5, 264, 0 ]);
	blocks[9] = blocks[22].translate([139, 264, 0 ]);
	blocks[10] = blocks[23].translate([49.5, 332.5, 0 ]);
	blocks[11] = blocks[24].translate([139, 332.5, 0 ]);
	// box D
	// west side
	blocks[12] = blocks[12].translate([0, 48, 0 ]);
	blocks[13] = blocks[13].translate([8.5, 48, 0 ]);
	blocks[14] = blocks[14].translate([8.5, 94.25, 0 ]);
	blocks[15] = blocks[15].translate([8.5, 190.25, 0 ]);
	blocks[16] = blocks[16].translate([8.5, 286.25, 0 ]);
	blocks[17] = blocks[17].translate([8.5, 367, 0 ]);
	// north side
	blocks[18] = blocks[18].translate([94.25, 372, 0 ]);
	// east side
	blocks[19] = blocks[19].translate([180, 367, 0 ]);
	blocks[20] = blocks[20].translate([180, 286.25, 0 ]);
	blocks[21] = blocks[21].translate([180, 190.25, 0 ]);
	blocks[22] = blocks[22].translate([180, 94.25, 0 ]);
	blocks[23] = blocks[23].translate([180, 48, 0 ]);
	blocks[24] = blocks[24].translate([188.5, 48, 0 ]);
	
	return blocks;
}

// boxes
	
function get_box_A(){
	var box_A = [];
	
	// box_A (x)
	box_A.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([48, 48, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_A.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([48, 48, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_A.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([142.5, 48, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_A.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([142.5, 48, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	// box_A (y)
	box_A.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 46.5, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_A.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 46.5, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_A.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 120, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_A.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 120, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	
	return box_A;
}

function get_box_B(){
	var box_B = [];
	
	// box_B (x)
	box_B.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([48, 156, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_B.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([48, 156, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_B.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([142.5, 156, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_B.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([142.5, 156, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	// box_B (y)
	box_B.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 154.5, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_B.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 154.5, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_B.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 228, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_B.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 228, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	
	return box_B;
}

function get_box_C(){
	var box_C = [];
	
	// box_C (x)
	box_C.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([48, 264, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_C.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([48, 264, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_C.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([142.5, 264, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_C.push(
		cube({size: [1.5, 72, 5.5]}).
		translate([142.5, 264, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	// box_C (y)
	box_C.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 262.5, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_C.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 262.5, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_C.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 336, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_C.push(
		cube({size: [96, 1.5, 5.5]}).
		translate([48, 336, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
			
	return box_C;
}

function get_box_D(){
	var box_D = [];
	
	// box_D (x)
	// west side
	box_D.push(
		cube({size: [1.5, 144, 5.5]}).
		translate([12, 48, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_D.push(
		cube({size: [1.5, 144, 5.5]}).
		translate([12, 48, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_D.push(
		cube({size: [1.5, 180, 5.5]}).
		translate([12, 192, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_D.push(
		cube({size: [1.5, 180, 5.5]}).
		translate([12, 192, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	// east side
	box_D.push(
		cube({size: [1.5, 144, 5.5]}).
		translate([178.5, 48, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_D.push(
		cube({size: [1.5, 144, 5.5]}).
		translate([178.5, 48, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_D.push(
		cube({size: [1.5, 180, 5.5]}).
		translate([178.5, 192, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_D.push(
		cube({size: [1.5, 180, 5.5]}).
		translate([178.5, 192, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	// box_D (y)
	// south-west side
	box_D.push(
		cube({size: [13.5, 1.5, 5.5]}).
		translate([0, 46.5, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_D.push(
		cube({size: [13.5, 1.5, 5.5]}).
		translate([0, 46.5, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	// north side
	box_D.push(
		cube({size: [175, 1.5, 5.5]}).
		translate([8.5, 370.5, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_D.push(
		cube({size: [175, 1.5, 5.5]}).
		translate([8.5, 370.5, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	// south-east side
	box_D.push(
		cube({size: [13.5, 1.5, 5.5]}).
		translate([178.5, 46.5, 0]).
		setColor([0.7,0.4,0.0,1.0])
	);
	box_D.push(
		cube({size: [13.5, 1.5, 5.5]}).
		translate([178.5, 46.5, 5.75]).
		setColor([0.7,0.4,0.0,1.0])
	);
	
	return box_D;
}

function get_box_G(GXx,GXy,GXz,GYx,GYy,GYz){
	var box_G = [];
    var GXx = 320.5;
	var GXy = 487.5;
    var GYx = 320.5 + 8.5 + 8.5;
    var GYy = 487.5 + 0.0;
	
	// box G (x)
	// west side
	box_G.push(
		cube({size: [8.5, GXy, 3.5]}).
		translate([-8.5, 0, -3.5]).
		setColor([0.8,0.4,0.0,1.0])
	);
    
	box_G.push(
		cube({size: [8.5, GXy, 5.5]}).
		translate([-8.5, 0, 0]).
		setColor([0.9,0.4,0.0,0.5])
	);
	box_G.push(
		cube({size: [8.5, GXy, 5.5]}).
		translate([-8.5, 0, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
	
    // east side
	box_G.push(
		cube({size: [8.5, GXy, 3.5]}).
		translate([GXx, 0, -3.5]).
		setColor([0.8,0.4,0.0,1.0])
	);
    
	box_G.push(
		cube({size: [8.5, GXy, 5.5]}).
		translate([GXx, 0, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [8.5, GXy, 5.5]}).
		translate([GXx, 0, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
    
	// box G (y)
	// north side
	box_G.push(
		cube({size: [GXx+8.5+8.5, 8.5, 3.5]}).
		translate([-8.5, GXy, -3.5]).
		setColor([0.7,0.3,0.0,1.0])
	);
	box_G.push(
		cube({size: [GXx+8.5+8.5, 8.5, 5.5]}).
		translate([-8.5, GXy, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [GXx+8.5+8.5, 8.5, 5.5]}).
		translate([-8.5, GXy, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
    
    // south side
    box_G.push(
		cube({size: [GXx+8.5+8.5, 8.5, 3.5]}).
		translate([-8.5, -8.5, -3.5]).
		setColor([0.7,0.3,0.0,1.0])
	);
	box_G.push(
		cube({size: [GXx+8.5+8.5, 8.5, 5.5]}).
		translate([-8.5, -8.5, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [GXx+8.5+8.5, 8.5, 5.5]}).
		translate([-8.5, -8.5, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
			
	return box_G;
}

function get_caps_top(){
	var caps_top = [];
	
	// caps_top (x)
	caps_top.push(
		cube({size: [3.5, 192, 1.5]}).
		translate([0, 0, 60]).
		setColor([1.0,0.5,0.0,0.8])
	);
	caps_top.push(
		cube({size: [3.5, 192, 1.5]}).
		translate([0, 192, 60]).
		setColor([1.0,0.5,0.0,0.8])
	);
	caps_top.push(
		cube({size: [3.5, 192, 1.5]}).
		translate([188.5, 0, 60]).
		setColor([1.0,0.5,0.0,0.8])
	);
	caps_top.push(
		cube({size: [3.5, 192, 1.5]}).
		translate([188.5, 192, 60]).
		setColor([1.0,0.5,0.0,0.8])
	);
	// caps_top (y)
	caps_top.push(
		cube({size: [192, 3.5, 1.5]}).
		translate([0, 0, 60]).
		setColor([1.0,0.5,0.0,0.8])
	);
	caps_top.push(
		cube({size: [192, 3.5, 1.5]}).
		translate([0, 380.5, 60]).
		setColor([1.0,0.5,0.0,0.8])
	);
			
	return caps_top;
}

function get_caps_bot(){
	var caps_bot = [];
	
	// caps_bot (x)
	caps_bot.push(
		cube({size: [1.5, 192, 3.5]}).
		translate([0, 0, 10]).
		setColor([1.0,0.5,0.0,0.8])
	);
	caps_bot.push(
		cube({size: [1.5, 192, 3.5]}).
		translate([0, 192, 10]).
		setColor([1.0,0.5,0.0,0.8])
	);
	caps_bot.push(
		cube({size: [1.5, 192, 3.5]}).
		translate([190.5, 0, 10]).
		setColor([1.0,0.5,0.0,0.8])
	);
	caps_bot.push(
		cube({size: [1.5, 192, 3.5]}).
		translate([190.5, 192, 10]).
		setColor([1.0,0.5,0.0,0.8])
	);
	// caps_bot (y)
	caps_bot.push(
		cube({size: [192, 1.5, 3.5]}).
		translate([0, 0, 10]).
		setColor([1.0,0.5,0.0,0.8])
	);
	caps_bot.push(
		cube({size: [192, 1.5, 3.5]}).
		translate([0, 382.5, 10]).
		setColor([1.0,0.5,0.0,0.8])
	);
	
	return caps_bot;
}

function get_fences(){
	var fences = [];
	var fences_count = 12;
	
	// east side
	for(var i = 0; i < 1; i++){
		// south-to-north angle -45
		fences = fences.concat(get_fence(0.5,96,50.25, 0.5,1.5,48, 315, 4));
		// south-to-north angle +45
		fences = fences.concat(get_fence(0.5,96,50.25, 0.5,1.5,48, 46, 4));
	}
	/* north side
	for(var j = 0; j < 4; j++){
	}*/
	
	return fences;
}

// fences[0] = get_fence(96,0.5,48, 0.5,1.5,48, -45, 4);
function get_fence(perimeterX,perimeterY,perimeterZ,pieceX,pieceY,pieceZ,angle,space){
	var fence = [];
	var pieces = [];
	var border = [];
	
	border.push(
		cube({
			size: [perimeterX, perimeterY, perimeterZ]
		}).
		translate([-0.5, 0, 11.25]). // with 4 inch spacing between pieces
		setColor([1.0,0.5,0.1,0.8])
	);
	
	for(var i = 0; i < 49; i++){
		pieces.push(
			// 2D (doesn't work, 2D+3D not interchangeable)
			CAG.roundedRectangle({center: [0,0], radius: [1.5, Math.sqrt(Math.pow(48,2) + Math.pow(48,2)) + 4], roundradius: 1, resolution: 4})
			// 3D (works, but excessive render time)
			/*cube({
				size: [0.5, 1.5, Math.sqrt(Math.pow(48,2) + Math.pow(48,2)) + 4] // pythagorem + 4 inch extra border cut spacing
			}).
			rotateX(angle).
			translate([-0.5, -48 + 4*i, 11.25])//. // with 4 inch spacing between pieces
			//setColor([1.0,0.5,0.0,0.8])
			*/
		);
	}
	
	//console.log(JSON.stringify(pieces));
	//console.log(JSON.stringify(border));
	
    fence = border[0].subtract(pieces);
	
	return fence;
}

function get_gate_A(){
	var gate = [];
	return gate;
}

function get_gate_B(){
	var gate = [];
	return gate;
}

function get_gate_hinges(){
	var hinges = [];
	return hinges;
}

// end file