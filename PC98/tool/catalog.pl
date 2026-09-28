open (LIST,">list.txt");

$start_num = 11075;
$end_num = 11119;

while ($start_num <= $end_num) {
  	print LIST "<TR>"."\n";
	print LIST "<TD><IMG SRC=../JPG_3/$start_num.jpg BORDER=0 WIDTH=640 HEIGHT=480></TD>"."\n";
  	print LIST "</TR>"."\n";
	$start_num++;
}

close(LIST);
