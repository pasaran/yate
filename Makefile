tests:
	cd tests && ./dotests

jshint:
	jshint lib/*.js

.PHONY: tests
