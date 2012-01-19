#!/bin/bash

TARGET="yatelib.js"

cat src/prologue.js > $TARGET
cat src/common.js src/types.js src/ast.js src/ast.items.js src/scope.js src/inputstream.js src/parser.js src/grammar.js src/codetemplates.js >> $TARGET
cat src/ast/*.js >> $TARGET
cat src/ast/yate/*.js >> $TARGET
cat src/ast/js/*.js >> $TARGET
cat src/actions.js >> $TARGET
cat src/epilogue.js >> $TARGET

