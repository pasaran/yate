#!/bin/bash

cd ../..
./make.sh
cd examples/mailbox
node ../../yate.js mailbox.yate > mailbox.js

node ../run.js mailbox.js mailbox.data.js > mailbox.js.html
xsltproc mailbox.xsl mailbox.data.xml > mailbox.xsl.html

