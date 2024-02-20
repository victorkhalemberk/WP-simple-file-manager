<?php
$path = '../../../../../';
$file = '.tmb/l1_d3AtY29udGVudC91cGxvYWRzL3dwby9pbWFnZXMvd3BvX2xvZ29fc21hbGwucG5n1707427099.png';
$both = $path . $file;

echo json_encode(file($both));