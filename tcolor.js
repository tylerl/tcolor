// Tcolor v0.0.1
// 2013-09-09, Tyler Larson, MIT License
//
// Some parts taken from TinyColor:
//    https://github.com/bgrins/TinyColor
//    2013-08-10, Brian Grinstead, MIT License
// Also contains some ideas from http://mudcu.be/sphere/
// Perhaps also https://github.com/less/less.js/
// And maybe even https://github.com/harthur/color-convert/

(function() {

var fn = {};
fn.math = Math;
fn.round = fn.math.round;
fn.min = fn.math.min;
fn.max = fn.math.max;
fn.random = fn.math.random;


function tcolor(color, opts) {
	// If input is already a tcolor, return itself
	if (typeof color == "object" && color.hasOwnProperty("__tcolor")) {
		return color;
	}
	// else create a new one
	return new Tcolor(color,opts);
}

function Tcolor(color,opts) {
	color = (color) ? color : '';
	opts = opts || { };

	this._rgb = any2rgba(color);
	this._a = this._rgb.a;
	this.fmt = opts.fmt || this._rgb.fmt || 'hex';
	this.__tcolor = true;
}

// ##################################################################

// get or set alpha, where alpha is in [0 to 1]
Tcolor.prototype.alpha = function(a) {
	if (typeof a === 'undefined') {
		return this._a;
	}
	var rgb = this.rgb();
	rgb.a = to01(a);
	return new Tcolor(rgb);
};

// get rgb values, where r,g,b are in [0 to 255]
Tcolor.prototype.rgb = function(round) {
	var c=this._rgb;
	return {r:rmax(c.r,255,round), g:rmax(c.g,255,round), b:rmax(c.b,255,round), a:c.a };
};

// get HSV values, where H is in [0 to 360] and S,V are in [0 to 100]
Tcolor.prototype.hsv = function(round) {
	var hsv = rgb2hsv(this._rgb.r, this._rgb.g, this._rgb.b);
	return { h: rmax(hsv.h,360,round), s: rmax(hsv.s,100,round), v: rmax(hsv.v,100,round), a: this._a };
};

// get HSL values, where H is in [0 to 360] and S,L are in [0 to 100]
Tcolor.prototype.hsl = function(round) {
	var hsl = rgb2hsl(this._rgb.r, this._rgb.g, this._rgb.b);
	return { h: rmax(hsl.h,360,round), s: rmax(hsl.s,100,round), l: rmax(hsl.l,100,round), a: this._a };
};

// get color lightened by amount [0 to 100]
Tcolor.prototype.lighten = function(amount) {
	var hsl = this.hsl();
	hsl.l += amount;
	return new Tcolor(hsl,{fmt:this.fmt});
};

// get color darkened by amount [0 to 100]
Tcolor.prototype.darken = function(amount) {
	var hsl = this.hsl();
	hsl.l -= amount;
	return new Tcolor(hsl,{fmt:this.fmt});
};

// get color saturated by amount [0 to 100]
Tcolor.prototype.saturate = function(amount) {
	var hsl = this.hsl();
	hsl.s += amount;
	return new Tcolor(hsl,{fmt:this.fmt});
};

// get color desaturated by amount [0 to 100]
Tcolor.prototype.desaturate = function(amount) {
	var hsl = this.hsl();
	hsl.s -= amount;
	return new Tcolor(hsl,{fmt:this.fmt});
};

// get color with hue rotated x degrees (optionally in ryb space)
Tcolor.prototype.rotate = function(huediff,ryb) {
	var hsl = this.hsl();
	var hue = hsl.h;
	if (ryb) hue = hueconv.ryb2rgb(hue);
	hue += huediff;
	if (ryb) hue = hueconv.rgb2ryb(hue);
	while (hue < 360) hue += 360;
	while (hue > 360) hue -= 360;
	return new Tcolor({ h:hue, s:hsl.s, l:hsl.l, a:hsl.a, fmt:this.fmt });
};

// get color mixed with provided color weighted by amount [0 to 1]
Tcolor.prototype.mix = function(color2,weight) {
	if (typeof weight == 'undefined') weight=0.5;
	weight = 1-to01(weight);
	color2 = tcolor(color2);

	var t1 = weight * 2 - 1;
	var d  = this._a - color2._a;
	var w1 = (((t1 * d == -1) ? t1 : (t1 + d) / (1 + t1 * d)) + 1) / 2;
	var w2 = 1 - w1;
	var rgb1 = this.rgb();
	var rgb2 = color2.rgb();

	return new Tcolor({
		r: rgb1.r*w1 + rgb2.r*w2,
		g: rgb1.g*w1 + rgb2.g*w2,
		b: rgb1.b*w1 + rgb2.b*w2,
		a: this._a*weight + color2._a * (1-weight),
		fmt: this.fmt
	});
};

// convert color to string, where "fmt" is undefined or one of:
// hex,rgb,hsv,hsl,name
// hex cannot have alpha, name fails back to hex/rgb if name not found
// undefined means use the format used to create the color
Tcolor.prototype.toString = function(fmt) {
	var o={};
	if (!fmt) {
		fmt = this.fmt || 'hex';		
		if (this._a != 1 && fmt=='hex') fmt='rgb';
	}
	if (this._a != 1) {
		if (fmt=='name') {
			if (this._a===0) return 'transparent';
			fmt='rgb';
		}
		if (fmt=='rgb' || fmt=='hsv' || fmt=='hsl') fmt = fmt + 'a';
	}

	if (fmt=='name') {
		o=this.rgb(true);
		var hex = toHex(o.r)+toHex(o.g)+toHex(o.b);
		var name = hex_names[hex];
		if (name) return name;
		return '#'+hex;
	}

	switch (fmt) {
		case "hex":
			o = this.rgb(true);
			return "#"+toHex(o.r)+toHex(o.g)+toHex(o.b);
		case 'rgb':
			o = this.rgb(true);			
			return "rgb("+o.r+','+o.g+','+o.b+')';
		case 'rgba':
			o = this.rgb(true);			
			return "rgba("+o.r+','+o.g+','+o.b+','+o.a+')';
		case 'hsl':
			o = this.hsl(true);			
			return "hsl("+o.h+','+o.s+'%,'+o.l+'%)';
		case 'hsla':
			o = this.hsl(true);			
			return "hsla("+o.h+','+o.s+'%,'+o.l+'%,'+o.a+')';
		case 'hsv':
			o = this.hsv(true);			
			return "hsv("+o.h+','+o.s+'%,'+o.v+'%)';
		case 'hsva':
			o = this.hsv(true);			
			return "hsva("+o.h+','+o.s+'%,'+o.v+'%,'+o.a+')';
	}
	// NOT REACHED except when bad format code is provided
	o = this.rgb(true);			
	return "rgba("+o.r+','+o.g+','+o.b+','+o.a+')';
};

// ##################################################################
// # color conversions

// Expects r,g,b in [0,1]
// outputs h,s,v in [0,1]
function rgb2hsv(r,g,b) {
	var max = fn.max(r, g, b);
	var min = fn.min(r, g, b);
	var h = 0;
	var d = max - min;
	var s = max === 0 ? 0 : d / max;
	var v = max;

	if (max != min) { // not achromatic
		switch(max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}
	return { h: h, s: s, v: v };
}
// Expects h,s,v in [0,1]
// Outputs r,g,b in [0,1]
function hsv2rgb(h, s, v) {
	h*=6;
	var i = math.floor(h),
		f = h - i,
		p = v * (1 - s),
		q = v * (1 - f * s),
		t = v * (1 - (1 - f) * s),
		mod = i % 6,
		r = [v, q, p, p, t, v][mod],
		g = [t, v, v, q, p, p][mod],
		b = [p, p, t, v, v, q][mod];

	return { r: r, g: g, b: b };
}


// Expects h,s,l in [0,1]
// Outputs r,g,b in [0,1]
function hsl2rgb(h,s,l) {
	// TODO: not implemented
	var r, g, b;

	function hue2rgb(p, q, t) {
		if(t < 0) t += 1;
		if(t > 1) t -= 1;
		if(t < 1/6) return p + (q - p) * 6 * t;
		if(t < 1/2) return q;
		if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		return p;
	}

	if(s === 0) {
		r = g = b = l; // achromatic
	}
	else {
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return { r:r, g:g, b:b };
}
// Expects r,g,b in [0,1]
// Outputs h,s,l in [0,1]
function rgb2hsl(r,g,b) {
	var max = fn.max(r, g, b);
	var min = fn.min(r, g, b);
	var h=0; 
	var s=0;
	var l = (max + min) / 2;

	if (max != min) { // not achromatic
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch(max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}
	return { h: h, s: s, l: l };
}

// ##################################################################
// # to/from user

// Match input string and create an object representing the color indicated in the string
function str2component(color) {
	color = trim(color).toLowerCase();
	var named = false;
	if (color_names[color]) {
		color = color_names[color];
		named = true;
	}
	else if (color == 'transparent') {
		return { r: 0, g: 0, b: 0, a: 0, fmt: "name" };
	}

	// Try to match string input using regular expressions.
	// Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
	var match;
	if ((match = matchers.rgb.exec(color))) {
		return { r: match[1], g: match[2], b: match[3], 'fmt': 'rgb' };
	}
	if ((match = matchers.rgba.exec(color))) {
		return { r: match[1], g: match[2], b: match[3], a: match[4], 'fmt': 'rgb' };
	}
	if ((match = matchers.hsl.exec(color))) {
		return { h: match[1], s: match[2], l: match[3], 'fmt': 'hsl' };
	}
	if ((match = matchers.hsla.exec(color))) {
		return { h: match[1], s: match[2], l: match[3], a: match[4], 'fmt': 'hsl' };
	}
	if ((match = matchers.hsv.exec(color))) {
		return { h: match[1], s: match[2], v: match[3], 'fmt': 'hsv' };
	}
	if ((match = matchers.hsva.exec(color))) {
		return { h: match[1], s: match[2], v: match[3], a: match[4], 'fmt': 'hsv' };
	}
	if ((match = matchers.hex6.exec(color))) {
		return {
			r: hex2int(match[1]),
			g: hex2int(match[2]),
			b: hex2int(match[3]),
			fmt: named ? "name" : "hex"
		};
	}
	if ((match = matchers.hex3.exec(color))) {
		return {
			r: hex2int(match[1] + '' + match[1]),
			g: hex2int(match[2] + '' + match[2]),
			b: hex2int(match[3] + '' + match[3]),
			fmt: named ? "name" : "hex"
		};
	}

	return false;
}

function any2rgba(color) {
	var a = 1;
	var rgb = {r:0,g:0,b:0};
	var fmt = false;

	if (typeof color == "string") {
		color = str2component(color);
	}

	if (typeof color == "object") {
		if (hasprops(color,['r','g','b'])) {
			rgb = {r:to01(color.r,255), g:to01(color.g,255), b:to01(color.b,255)};
			fmt = 'rgb';
		} else if (hasprops(color,['h','s','l'])) {
			rgb = hsl2rgb(to01(color.h,360),to01(color.s,100),to01(color.l,100));			
			fmt = 'hsl';
		} else if (hasprops(color,['h','s','v'])) {
			rgb = hsv2rgb(to01(color.h,360),to01(color.s,100),to01(color.v,100));			
			fmt = 'hsv';		
		}
		if (color.hasOwnProperty('a')) {
			a = to01(color.a);
		}
		fmt = color.fmt || fmt || "hex";
	} 
	rgb.a = a;
	rgb.fmt = fmt;
	return rgb;
}

function toHex(n) {
	var s = n.toString(16);
	if (s.length==1) s = '0'+s;
	return s;
}


// ##############################################################################################
// ##############################################################################################
// # General Utility

// clamp value to [0,1]
// handles percentages with trailing % mark
function to01(val,div) {
	if (typeof val == 'string') {
		val = trim(val);
		if (endswith(val,'%')) {
			val = val.substr(0,val.length-1);
			val = parseInt(val,10);
			div = 100;
		}
	}
	if (typeof(div)=='number') {
		val /= div;
	}
	return fn.min(1,fn.max(0,val));
}

// string ends with other string
function endswith(subject,suffix) {
	return subject.indexOf(suffix,subject.length-suffix.length) !== -1;
}
// trim whitespace from both sides
function trim(str) {
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}
// parse hex number
function hex2int(val) {
	return parseInt(val,16);
}
// Object all *all* properties listed
function hasprops(obj,proplist) {
	for(var i=0;i<proplist.length;i++) {
		if (!obj.hasOwnProperty(proplist[i])) return false;
	}
	return true;
}
// All objects provided in list are defined
function defined(list) {
	for(var i=0;i<list.length;i++) {
		if (typeof l[i] === 'undefined') return false;
	}
	return true;
}
// takes val as a range 0-1 and coverts it into 0-max, clamped to those extremes
function rmax(val,max,round) {
	val = val * max;
	if (round) val = fn.round(val);
	return fn.min(max,fn.max(0,val));
}


// ##############################################################################################
// ##############################################################################################
// # DATA

var matchers = (function() {
	// <http://www.w3.org/TR/css3-values/#integers>
	var CSS_INTEGER = "[-\\+]?\\d+%?";
	// <http://www.w3.org/TR/css3-values/#number-value>
	var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";
	// Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
	var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";
	// Actual matching.
	// Parentheses and commas are optional, but not required.
	// Whitespace can take the place of commas or opening paren
	var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	return {
		rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
		rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
		hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
		hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
		hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
		hsva: new RegExp("hsva" + PERMISSIVE_MATCH3),
		hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
		hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
	};
})();


// Big List of Colors
// ------------------
// <http://www.w3.org/TR/css3-color/#svg-color>
var color_names = {
	aliceblue: "f0f8ff", antiquewhite: "faebd7", aqua: "00ffff", aquamarine: "7fffd4", 
	azure: "f0ffff", beige: "f5f5dc", bisque: "ffe4c4", black: "00000", blanchedalmond: "ffebcd", 
	blue: "0000ff", blueviolet: "8a2be2", brown: "a52a2a", burlywood: "deb887", burntsienna: "ea7e5d", 
	cadetblue: "5f9ea0", chartreuse: "7fff00", chocolate: "d2691e", coral: "ff7f50", 
	cornflowerblue: "6495ed", cornsilk: "fff8dc", crimson: "dc143c", cyan: "0ff", 
	darkblue: "00008b", darkcyan: "008b8b", darkgoldenrod: "b8860b", darkgray: "a9a9a9", 
	darkgreen: "006400", darkgrey: "a9a9a9", darkkhaki: "bdb76b", darkmagenta: "8b008b", 
	darkolivegreen: "556b2f", darkorange: "ff8c00", darkorchid: "9932cc", darkred: "8b0000", 
	darksalmon: "e9967a", darkseagreen: "8fbc8f", darkslateblue: "483d8b", darkslategray: "2f4f4f", 
	darkslategrey: "2f4f4f", darkturquoise: "00ced1", darkviolet: "9400d3", deeppink: "ff1493", 
	deepskyblue: "00bfff", dimgray: "696969", dimgrey: "696969", dodgerblue: "1e90ff", 
	firebrick: "b22222", floralwhite: "fffaf0", forestgreen: "228b22", fuchsia: "ff00ff", 
	gainsboro: "dcdcdc", ghostwhite: "f8f8ff", gold: "ffd700", goldenrod: "daa520", gray: "808080", 
	green: "008000", greenyellow: "adff2f", grey: "808080", honeydew: "f0fff0", hotpink: "ff69b4", 
	indianred: "cd5c5c", indigo: "4b0082", ivory: "fffff0", khaki: "f0e68c", lavender: "e6e6fa", 
	lavenderblush: "fff0f5", lawngreen: "7cfc00", lemonchiffon: "fffacd", lightblue: "add8e6", 
	lightcoral: "f08080", lightcyan: "e0ffff", lightgoldenrodyellow: "fafad2", 
	lightgray: "d3d3d3", lightgreen: "90ee90", lightgrey: "d3d3d3", lightpink: "ffb6c1", 
	lightsalmon: "ffa07a", lightseagreen: "20b2aa", lightskyblue: "87cefa", lightslategray: "778899", 
	lightslategrey: "778899", lightsteelblue: "b0c4de", lightyellow: "ffffe0", lime: "00ff00", 
	limegreen: "32cd32", linen: "faf0e6", magenta: "ff00ff", maroon: "800000", mediumaquamarine: "66cdaa", 
	mediumblue: "0000cd", mediumorchid: "ba55d3", mediumpurple: "9370db", mediumseagreen: "3cb371", 
	mediumslateblue: "7b68ee", mediumspringgreen: "00fa9a", mediumturquoise: "48d1cc", 
	mediumvioletred: "c71585", midnightblue: "191970", mintcream: "f5fffa", mistyrose: "ffe4e1", 
	moccasin: "ffe4b5", navajowhite: "ffdead", navy: "000080", oldlace: "fdf5e6", olive: "808000", 
	olivedrab: "6b8e23", orange: "ffa500", orangered: "ff4500", orchid: "da70d6", palegoldenrod: "eee8aa", 
	palegreen: "98fb98", paleturquoise: "afeeee", palevioletred: "db7093", papayawhip: "ffefd5", 
	peachpuff: "ffdab9", peru: "cd853f", pink: "ffc0cb", plum: "dda0dd", powderblue: "b0e0e6", 
	purple: "800080", red: "ff0000", rosybrown: "bc8f8f", royalblue: "4169e1", saddlebrown: "8b4513", 
	salmon: "fa8072", sandybrown: "f4a460", seagreen: "2e8b57", seashell: "fff5ee", sienna: "a0522d", 
	silver: "c0c0c0", skyblue: "87ceeb", slateblue: "6a5acd", slategray: "708090", slategrey: "708090", 
	snow: "fffafa", springgreen: "00ff7f", steelblue: "4682b4", tan: "d2b48c", teal: "008080", 
	thistle: "d8bfd8", tomato: "ff6347", turquoise: "40e0d0", violet: "ee82ee", wheat: "f5deb3", 
	white: "ffffff", whitesmoke: "f5f5f5", yellow: "ffff00", yellowgreen: "9acd32"
};

// TODO: I'm still not sure whether I'm doing this bit right. 
var hueconv = (function() {
	var hue2ryb = [ [0, 0], [15, 8], [30, 17], [45, 26], [60, 34], [75, 41], [90, 48], 
			[105, 54], [120, 60], [135, 81], [150, 103], [165, 123], [180, 138], 
			[195, 155], [210, 171], [225, 187], [240, 204], [255, 219], [270, 234], 
			[285, 251], [300, 267], [315, 282], [330, 298], [345, 329], [360, 360] ];
	function rgbryb(hue,invert) {
		while (hue > 360) hue-=360;
		while (hue < 0) hue += 360;
		var from=0, to=1;
		if (invert) {
			from=1; to=0;
		}
		var prev = [0,0];
		for(i=0;i<hue2ryb.length;i++){
			var cur = hue2ryb[i];
			if (cur[from]==hue) return cur[to];
			if (cur[from]>hue) {
				var span = cur[from]-prev[from];
				var diff = hue-prev[from];
				var p = diff/span;

				var span2 = cur[to]-prev[to];
				var p2 = span2 * p;
				return prev[to]+p2;
			}
		}
	}
	return {
		rgb2ryb: function(hue) { return(rgbryb(hue,false)); },
		ryb2rgb: function(hue) { return(rgbryb(hue,true)); },
	};
})();


// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
function flip(o) {
	var flipped = { };
	for (var i in o) {
		if (o.hasOwnProperty(i)) {
			flipped[o[i]] = i;
		}
	}
	return flipped;
}
// Make it easy to access colors via `hex_names[hex]`
var hex_names = flip(color_names);

// ##########################################################################
// # FIN ####################################################################

// Node: Export function
var exports = {
	'tcolor':tcolor,
	'Tcolor':Tcolor
};	

if (typeof module !== "undefined" && module.exports) { module.exports = exports; }
else if (typeof define == 'function') { define(exports); }
else { window.tcolor=tcolor; window.Tcolor=Tcolor; }

})();
