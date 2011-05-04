#!/bin/bash

TARGET="yate.js"

cat lib/common.js lib/types.js lib/ast.js lib/parser.js lib/grammar.js lib/codetemplates.js > $TARGET
cat lib/ast/*.js >> $TARGET
cat lib/ast/yate/*.js >> $TARGET
cat lib/ast/js/*.js >> $TARGET
cat lib/yate.js >> $TARGET

