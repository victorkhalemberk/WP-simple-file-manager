<?php
$path = '../../../../wp-content/uploads/wp-file-manager-pro/users/admin/';

$rawPath = str_replace('/', '=%x=k=x%=', $path);
$pathArr = preg_split('/=%x=k=x%=/', $rawPath);
array_pop($pathArr);
array_pop($pathArr);
$back_path = '';
foreach($pathArr as $dir){
    $back_path .= $dir . '/';
}
echo 'path = ';
echo $back_path;