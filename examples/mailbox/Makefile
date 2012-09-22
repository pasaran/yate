all:
	../../yate mailbox.yate > mailbox.js
	xsltproc mailbox.xsl mailbox.data.xml > mailbox.xsl.html

clean:
	rm mailbox.js mailbox.xsl.html

.PHONY: clean all

