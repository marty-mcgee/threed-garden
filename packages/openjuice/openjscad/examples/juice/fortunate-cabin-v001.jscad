// title: Fortunate Cabin v001
// author: Marty McGee
// license: MIT
// url: http://marty-mcgee.com/playground/openjuice/openjscad/
//			#examples/juice/fortunate-cabin-v001.jscad
// revision: 0.017

function main() {
    return  build_cabin().
			scale(1/8). // 1:X ratio
			//rotateX(-1.0). // slight slope on X axis ( west-to-east )
			//rotateY(1.0). // slight slope on Y axis ( north-to-south )
			translate([-30,-30,0.0]); // below-to-above-ground ( inches )
}

function build_cabin() {
	// each var returns array of CSG.cube objects
	
	var cabin_base = get_base();
	var cabin_posts = get_posts();
	
	var cabin_blocks = [];//get_blocks();
	
	// boxes
	var cabin_box_A = [];//get_box_A();
	var cabin_box_B = [];//get_box_B();
	var cabin_box_C = [];//get_box_C();
	var cabin_box_D = [];//get_box_D();
	var cabin_box_G = [];//get_box_G();
	
	// beams (support)
	var cabin_beams_top = get_beams_top();
	var cabin_beams_bot = get_beams_bot();
	
	// lattice walls
	var cabin_walls = [];//get_walls();
	
	// door(s) and hinges
	var cabin_door_A = get_door_A();
	//var cabin_door_B = get_door_B();
	var cabin_door_hinges = get_door_hinges();
	
	// sunroom
	var cabin_sunroom_posts = get_sunroom_posts();
	var cabin_sunroom_beams_top = get_sunroom_beams_top();
	var cabin_sunroom_beams_bot = get_sunroom_beams_bot();
	
	var cabin_render = 
		union(
			cabin_base, 
			cabin_posts, 
			cabin_sunroom_posts,
			cabin_sunroom_beams_top,
			cabin_sunroom_beams_bot,
			cabin_blocks,
			cabin_box_A,
			cabin_box_B,
			cabin_box_C,
			cabin_box_D,
			cabin_box_G,
			cabin_beams_top,
			cabin_beams_bot,
			cabin_walls,
			cabin_door_A,
			cabin_door_hinges
		);
	
	return cabin_render;
}

function get_base(){
	
	var cabin,
		cabin_full, 
		cabin_base, 
		cabin_main;
	var cabin_uom = "inches";
	var cabin_x = 149; // 12 feet + wood
	var cabin_y = 296; // 24 feet + wood
	var cabin_z = 79;  // 6 feet 7 inches
	var cabin_base_x = cabin_x;
	var cabin_base_y = cabin_y;
	var cabin_base_z = cabin_z - 66; // 6.5 - 5.5 = 1 foot
	var cabin_main_x = cabin_x;
	var cabin_main_y = cabin_y;
	var cabin_main_z = cabin_z - 12; // 6.5 - 1.0 = 5.5 feet
	
	//cabin_full	= cube({size: [cabin_x, cabin_y, cabin_z]}).
	//				translate([0,0,-12]).
	//				setColor([0.3,0.7,1.0,1.0]);
	cabin_base	= cube({size: [cabin_base_x, cabin_base_y, cabin_base_z]}).
					translate([0,0,-4]).
					setColor([0.6,0.4,0.0,0.9]);
	//cabin_main	= cube({size: [cabin_main_x, cabin_main_y, cabin_main_z]}).
	//				translate([0,0,-12]).
	//				setColor([0.3,0.7,1.0,1.0]);
				 		
	/*cabin = union(
				cabin_full,
				cabin_base,
				cabin_main
			);*/
	
	return cabin_base;
}

function get_posts(){
	var posts = [];
	var posts_count = 10;
	
	// posts (box G)
	
	// north side
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([0, 0, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([0, 96.25, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([0, 192.25, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([0, 288.25, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
			            
	    
	// east side
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([72.25, 288.5, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
	
	// south side
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([144.5, 288.25, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([144.5, 192.25, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([144.5, 96.25, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([144.5, 0, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
	
	// west side
	posts.push(
		cube({size: [7.5, 7.5, 91]}).
		translate([72.25, 0, -12]).
		setColor([0.6,0.3,0.0,1.0])
	);
	
	return posts;
}

function get_sunroom_posts(){
  var sunroom_posts = [];
	var sunroom_posts_count = 8;
	
	// sunroom west side
	sunroom_posts.push(
		cube({size: [3.5, 3.5, 91]}).
		translate([0, 296.5, -12]).
		setColor([0.9,0.6,0.0,0.8])
	);
  sunroom_posts.push(
		cube({size: [3.5, 3.5, 91]}).
		translate([72.5, 296.5, -12]).
		setColor([0.9,0.6,0.0,0.8])
	);
  sunroom_posts.push(
		cube({size: [3.5, 3.5, 91]}).
		translate([144.5, 296.5, -12]).
		setColor([0.9,0.6,0.0,0.8])
	);
	    
	// sunroom south side
	sunroom_posts.push(
		cube({size: [3.5, 3.5, 91]}).
		translate([0, 360.5, -12]).
		setColor([0.9,0.6,0.0,0.8])
	);
	    
	// sunroom north side
	sunroom_posts.push(
		cube({size: [3.5, 3.5, 91]}).
		translate([144.5, 360.5, -12]).
		setColor([0.9,0.6,0.0,0.8])
	);
	    
	// sunroom east side	
	sunroom_posts.push(
		cube({size: [3.5, 3.5, 91]}).
		translate([0, 432.5, -12]).
		setColor([0.9,0.6,0.0,0.8])
	);
	sunroom_posts.push(
		cube({size: [3.5, 3.5, 91]}).
		translate([72.5, 432.5, -12]).
		setColor([0.9,0.6,0.0,0.8])
	);
	sunroom_posts.push(
		cube({size: [3.5, 3.5, 91]}).
		translate([144.5, 432.5, -12]).
		setColor([0.9,0.6,0.0,0.8])
	);
	sunroom_posts.push(
		cube({size: [3.5, 3.5, 14]}).
		translate([72.5, 360.5, -12]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
    return sunroom_posts;
}

function get_sunroom_beams_top(){
    var sunroom_beams_top = [];
	
	// beams top
	
	// sunroom west
	sunroom_beams_top.push(
		cube({size: [148.5, 3.5, 3.5]}).
		translate([0, 296.5, 79]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
	// sunroom east
	sunroom_beams_top.push(
		cube({size: [148.5, 3.5, 3.5]}).
		translate([0, 432.5, 79]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
	// sunroom north
	sunroom_beams_top.push(
		cube({size: [3.5, 144.5, 3.5]}).
		translate([0, 292.5, 79]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
	// sunroom south
	sunroom_beams_top.push(
		cube({size: [3.5, 144.5, 3.5]}).
		translate([144.5, 292.5, 79]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
    return sunroom_beams_top;
}


function get_sunroom_beams_bot(){
    var sunroom_beams_bot = [];

	// beams bottom
	
	// sunroom west
	sunroom_beams_bot.push(
		cube({size: [148.5, 3.5, 5.5]}).
		translate([0, 292.5, 0]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
	// sunroom middle west-to-east
	sunroom_beams_bot.push(
		cube({size: [148.5, 3.5, 5.5]}).
		translate([0, 360.5, 0]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
	// sunroom east
	sunroom_beams_bot.push(
		cube({size: [148.5, 3.5, 5.5]}).
		translate([0, 432.5, 0]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
	// sunroom north
	sunroom_beams_bot.push(
		cube({size: [3.5, 144.5, 5.5]}).
		translate([0, 292.5, 0]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
	// sunroom middle north-to-south
	sunroom_beams_bot.push(
		cube({size: [3.5, 144.5, 5.5]}).
		translate([72.5, 292.5, 0]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
	// sunroom south
	sunroom_beams_bot.push(
		cube({size: [3.5, 144.5, 5.5]}).
		translate([144.5, 292.5, 0]).
		setColor([0.9,0.6,0.0,0.8])
	);
	
    return sunroom_beams_bot;
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

function get_box_G(){
	var box_G = [];
	
	// box G (x)
	// west side
	box_G.push(
		cube({size: [1.5, 192, 3.5]}).
		translate([-1.5, 0, -3.5]).
		setColor([0.8,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 5.5]}).
		translate([-1.5, 0, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 5.5]}).
		translate([-1.5, 0, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 3.5]}).
		translate([-1.5, 192, -3.5]).
		setColor([0.8,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 5.5]}).
		translate([-1.5, 192, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 5.5]}).
		translate([-1.5, 192, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
	// east side
	box_G.push(
		cube({size: [1.5, 192, 3.5]}).
		translate([192, 0, -3.5]).
		setColor([0.8,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 5.5]}).
		translate([192, 0, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 5.5]}).
		translate([192, 0, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 3.5]}).
		translate([192, 192, -3.5]).
		setColor([0.8,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 5.5]}).
		translate([192, 192, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [1.5, 192, 5.5]}).
		translate([192, 192, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
	// box G (y)
	// north side
	box_G.push(
		cube({size: [195, 1.5, 3.5]}).
		translate([-1.5, 384, -3.5]).
		setColor([0.7,0.3,0.0,1.0])
	);
	box_G.push(
		cube({size: [195, 1.5, 5.5]}).
		translate([-1.5, 384, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [195, 1.5, 5.5]}).
		translate([-1.5, 384, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
	// south side
	box_G.push(
		cube({size: [195, 1.5, 3.5]}).
		translate([-1.5, -1.5, -3.5]).
		setColor([0.7,0.3,0.0,1.0])
	);
	// south side (wall)
	box_G.push(
		cube({size: [147.25, 1.5, 5.5]}).
		translate([46.25, -1.5, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [147.25, 1.5, 5.5]}).
		translate([46.25, -1.5, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
	// south side (door)
	box_G.push(
		cube({size: [41.75, 1.5, 5.5]}).
		translate([4.25, -1.5, 0]).
		setColor([1.0,0.4,0.0,0.8])
	);
	box_G.push(
		cube({size: [41.75, 1.5, 5.5]}).
		translate([4.25, -1.5, 5.75]).
		setColor([1.0,0.4,0.0,0.8])
	);
	// south side (door end beams)
	box_G.push(
		cube({size: [5.5, 1.5, 5.5]}).
		translate([-1.5, -1.5, 0]).
		setColor([0.9,0.4,0.0,1.0])
	);
	box_G.push(
		cube({size: [5.5, 1.5, 5.5]}).
		translate([-1.5, -1.5, 5.75]).
		setColor([0.9,0.4,0.0,1.0])
	);
			
	return box_G;
}

function get_beams_top(){
	var beams_top = [];
	
	// beams_top (x)
	beams_top.push(
		cube({size: [7.5, 192, 7.5]}).
		translate([0, 0, 79]).
		setColor([1.0,0.5,0.0,0.8])
	);
	beams_top.push(
		cube({size: [7.5, 96, 7.5]}).
		translate([0, 192.5, 79]).
		setColor([1.0,0.5,0.0,0.8])
	);
	beams_top.push(
		cube({size: [7.5, 192, 7.5]}).
		translate([144.5, 0, 79]).
		setColor([1.0,0.5,0.0,0.8])
	);
	beams_top.push(
		cube({size: [7.5, 96, 7.5]}).
		translate([144.5, 192.5, 79]).
		setColor([1.0,0.5,0.0,0.8])
	);
	// beams_top (y)
	beams_top.push(
		cube({size: [144, 7.5, 7.5]}).
		translate([0, 0, 79]).
		setColor([1.0,0.5,0.0,0.8])
	);
	beams_top.push(
		cube({size: [151.5, 7.5, 7.5]}).
		translate([0, 288.5, 79]).
		setColor([1.0,0.5,0.0,0.8])
	);
	
	// return;
	return beams_top;
}

function get_beams_bot(){
	var beams_bot = [];
	
	// beams_bot (x)
	beams_bot.push(
		cube({size: [7.5, 144, 7.5]}).
		translate([0, 0, 2]).
		setColor([1.0,0.5,0.0,0.9])
	);
	beams_bot.push(
		cube({size: [7.5, 144, 7.5]}).
		translate([0, 144, 2]).
		setColor([1.0,0.5,0.0,0.9])
	);
	beams_bot.push(
		cube({size: [7.5, 144, 7.5]}).
		translate([142.5, 0, 2]).
		setColor([1.0,0.5,0.0,0.9])
	);
	beams_bot.push(
		cube({size: [7.5, 144, 7.5]}).
		translate([142.5, 144, 2]).
		setColor([1.0,0.5,0.0,0.9])
	);
	// beams_bot (y)
	beams_bot.push(
		cube({size: [144, 7.5, 7.5]}).
		translate([0, 0, 2]).
		setColor([1.0,0.5,0.0,0.9])
	);
	beams_bot.push(
		cube({size: [144, 7.5, 7.5]}).
		translate([0, 288.5, 2]).
		setColor([1.0,0.5,0.0,0.9])
	);
	
	// return;
	return beams_bot;
}

function get_walls(){
	var walls = [];
	var walls_count = 12;
	
	// east side
	for(var i = 0; i < 1; i++){
		// south-to-north angle -45
		walls = walls.concat(get_wall(0.5,96,50.25, 0.5,1.5,48, 315, 4));
		// south-to-north angle +45
		walls = walls.concat(get_wall(0.5,96,50.25, 0.5,1.5,48, 46, 4));
	}
	/* north side
	for(var j = 0; j < 4; j++){
	}*/
	
	return walls;
}

// walls[0] = get_wall(96,0.5,48, 0.5,1.5,48, -45, 4);
function get_wall(perimeterX,perimeterY,perimeterZ,pieceX,pieceY,pieceZ,angle,space){
	var wall = [];
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
			CAG.roundedRectangle({
			    center: [0,0], 
			    radius: [1.5, Math.sqrt(Math.pow(48,2) + Math.pow(48,2)) + 4], 
			    roundradius: 1, 
			    resolution: 4
			})
			// 3D (works, but excessive render time)
			/*cube({
				size: [0.5, 1.5, Math.sqrt(Math.pow(48,2) + Math.pow(48,2)) + 4] 
				// pythagorem + 4 inch extra border cut spacing
			}).
			rotateX(angle).
			translate([-0.5, -48 + 4*i, 11.25])//. // with 4 inch spacing between pieces
			//setColor([1.0,0.5,0.0,0.8])
			*/
		);
	}
	
	//console.log(JSON.stringify(pieces));
	//console.log(JSON.stringify(border));
	
    wall = border[0].subtract(pieces);
	
	return wall;
}

function get_door_A(){
	var door = [];
	
	// door (x)
	door.push(
		cube({size: [3.5, 3.5, 78]}).
		translate([146.5, 112, 2]).
		setColor([1.0,0.5,0.0,0.8])
	);
	door.push(
		cube({size: [3.5, 3.5, 78]}).
		translate([146.5, 178, 2]).
		setColor([1.0,0.5,0.0,0.8])
	);
	
	return door;
}

function get_door_B(){
	var door = [];
	return door;
}

function get_door_hinges(){
	var hinges = [];
	return hinges;
}

// end file