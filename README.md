tcolor
======

Yet Another Color-Manipulation Library

### Usage

Like this:

	# Identical
    tcolor("red").lighten(20).toString();
    new Tcolor("red").lighten(20).toString();

	# Specify output format
	tcolor("#F0F").rotate(120).toString("hsl");

	# colors are immutible
	var c1 = color("#F00");
	var c2 = color("#00F");
	var c3 = c1.mix(c2, 0.20);
	var c4 = c3.mix("purple").desaturate(30);

