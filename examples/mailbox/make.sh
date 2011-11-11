#!/bin/bash

cd ../..
./make.sh
cd examples/mailbox
../../yate mailbox.yate > mailbox.js

../../yate mailbox.yate mailbox.data.js > mailbox.js.html
xsltproc mailbox.xsl mailbox.data.xml > mailbox.xsl.html

