<?php

if(!defined('ABSPATH')){
  wp_die('Eat soya');
}

add_action( 'admin_menu', 'smplf_Add_Admin_Link' );
function smplf_Add_Admin_Link()
{
      add_menu_page(
        'Simple Files',
        'Simple Files',
        'manage_options',
        'simple-files',
        'simple_files_views',
        plugins_url('assets/folder-icon4.svg', __FILE__),
    );
}

function simple_files_views(){

  if( ! current_user_can( 'manage_options' ) ){
    wp_die( _( 'No Permission!' ) );
  }
  require_once 'smplf.view.php';
}