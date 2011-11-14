#!/usr/bin/perl
use strict;
use warnings;

my $n = "";
my $indent = "";
my @content = ();

while (my $line = <>) {
    my ($n_, $indent_, $content_);

    if ($line =~ m{^(\s*)r(\d+)\ \+=\ (.*?);$}) {
        $indent_ = $1;
        $n_ = $2;
        $content_ = $3;

        if ($n eq $n_) {
            push( @content, $content_ );
        } else {
            if (@content) {
                print "$indent r$n += ", join( " + ", @content ), ";\n";
            }

            $n = $n_;
            $indent = $indent_;
            @content = ( $content_ );
        }
    } else {
        if (@content) {
            print "$indent r$n += ", join( " + ", @content ), ";\n";
        }

        $n = "";
        $indent = "";
        @content = ();

        print "$line";
    }

}

