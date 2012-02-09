yatelib.js: make.sh $(shell find src -type f)
	./make.sh

tests:
	cd tests && ./dotests

.PHONY: tests
