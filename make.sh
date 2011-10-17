#!/bin/bash

TARGET="yate.js"

cat src/common.js src/types.js src/ast.js src/parser.js src/grammar.js src/codetemplates.js > $TARGET
cat src/ast/*.js >> $TARGET
cat src/ast/yate/*.js >> $TARGET
cat src/ast/js/*.js >> $TARGET
cat src/yate.js >> $TARGET

