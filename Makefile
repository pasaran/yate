tests:
	cd tests && ./dotests

jshint:
	jshint lib/*.js

clean:
	gfind -name "*.yate.js" | xargs rm
	gfind -name "*.yate.node.js" | xargs rm

.PHONY: tests clean

