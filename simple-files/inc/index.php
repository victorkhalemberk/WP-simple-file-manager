<?php
/*
 * Add my new menu to the Admin Control Panel
 */
// Hook the 'admin_menu' action hook, run the function named 'mfp_Add_My_Admin_Link()'
add_action( 'admin_menu', 'smplf_Add_Admin_Link' );
// Add a new top level menu link to the ACP
function smplf_Add_Admin_Link()
{
      add_menu_page(
        'Simple Files', // Title of the page
        'Simple Files', // Text to show on the menu link
        'manage_options', // Capability requirement to see the link
        'simple-files', // The 'slug' - file to display when clicking the link
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