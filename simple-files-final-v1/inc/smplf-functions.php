<?php
define('ROOT', '../../../../');
class SimpleFiles {

    /**
     * Just the path excluding the selected file or folder.
     */
    private static $path;
    /**
     * Just the selected file or folder.
     */
    private static $item;
    /**
     * Get the full path of directory and the selected file or folder.
     * @return string the full path.
     */
    private function path_and_item(){return self::$path . self::$item;}
    /**
     * The response array sent back to the browser (Javascript).
     */
    private $response = array(
        'path'      => '',
        'folders'   => array(),
        'files'     => array(),
        'fileinfo'  => array(
                        'size'      => 'a',
                        'modified'  => 'b',
                        'file_perms'=> 'c',
                        'contents'  => 'd',
                        'response'  => 'e'
                    ),
        'response'  => '',
    );
    /**
     * Simple function that converts file size to human readable form
     * @param int $bytes the value to be converted.
     */
    private function byte_format($bytes){
        if ($bytes >= 1073741824)
            {
                $bytes = number_format($bytes / 1073741824, 2) . ' GB';
            }
            elseif ($bytes >= 1048576)
            {
                $bytes = number_format($bytes / 1048576, 2) . ' MB';
            }
            elseif ($bytes >= 1024)
            {
                $bytes = number_format($bytes / 1024, 2) . ' KB';
            }
            elseif ($bytes > 1)
            {
                $bytes = $bytes . ' bytes';
            }
            elseif ($bytes == 1)
            {
                $bytes = $bytes . ' byte';
            }
            else
            {
                $bytes = '0 bytes';
            }

            return $bytes;
    }
    // Directory methods

    /**
     * opens a given directory, there is no need to pass the path to the directory as this function obtains it from the path_and_item() method.
     * @param string $for indicates whether this mehod should open a new directory or rescan the current one.
     */
    private function open_dir($for){

        if($for == 'scan_dir') {
            $target_path = self::$path;
        } else {
            $target_path = self::path_and_item();
        }

        // Set the response Object
        $this->response['path'] = $target_path;

        $dir_ = scandir($target_path);

        foreach($dir_ as $file_or_folder){

            if($file_or_folder == '.' || $file_or_folder == '..'){
                continue;
            }

            if(is_dir($target_path . '/' .  $file_or_folder)){
                array_push($this->response['folders'], $file_or_folder);
            } else {
                array_push($this->response['files'], $file_or_folder);
            }
        }
        $this->response['response'] = '200';
    }

    /**
     * Makes a new directory in the current directory.
     */
    private function mk_dir(){

        $dir_path = $this->path_and_item();

        if(!mkdir($dir_path)){
            $this->open_dir('scan_dir');
            $this->response['response'] = 'Failed to make requested folder!';
        } else {
            $this->open_dir('scan_dir');
            $this->response['response'] = 'Folder Created!';
        }
    }

    /**
     * Delete the selected directory in the current directory.
     * 
     * @param string $path the path of the selected directory.
     */
    function purge_dir($path) {
        return !empty($path) && is_file($path) ?
        @unlink($path) :
        (array_reduce(glob($path.'/*'), function ($r, $i) { return $r && $this->purge_dir($i); }, TRUE)) && @rmdir($path);
    }

    /**
     * ///////
     */
    private function copy_dir($source, $destination){
        if(!is_dir($destination)){
            $oldumask = umask(0); 
            mkdir($destination, 01777); // so you get the sticky bit set 
            umask($oldumask);
        }
        $dir_handle = @opendir($source) or die("Unable to open");
        while ($file = readdir($dir_handle)) 
        {
            if($file!="." && $file!=".." && !is_dir("$source/$file")) //if it is file
            copy("$source/$file","$destination/$file");
            if($file!="." && $file!=".." && is_dir("$source/$file")) //if it is folder
            $this->copy_dir("$source/$file","$destination/$file");
        }
            closedir($dir_handle);
    }
    // File methodes
    /**
     * Makes a file in the curent directory.
     */
    private function mk_file(){
        $mk_file = fopen($this->path_and_item(), 'w');
        fclose($mk_file);

        $this->open_dir('scan_dir');
        $this->response['response'] = 'Success!';
    }

    /**
     * Uploads a file to the current dirctory.
     */
    private function upload_file($file){
        $targetFile = $this->path_and_item();
        move_uploaded_file($file['tmp_name'], $targetFile);
    }
    
    /**
     * Deletes a file from the current directory.
     */
    private function unlink_file($target){
        $file = self::$path . $target;
        unlink($file);
    }

    /**
     * Copies a file to the currect directory
     */
    private function copy($file_name, $old_path){
        $old = $old_path . $file_name;
        $new = self::$path . $file_name;

        copy($old, $new);
    }

    /**
     * Retrieves the file info of the current file, $this->item
     */
    private function get_file_info() {
        $file = $this->path_and_item();

        $size = filesize($file);
        $modified = filemtime($file);
        $perms = fileperms($file);

        $this->response['fileinfo']['size']     = $this->byte_format($size);
        $this->response['fileinfo']['modified'] = date('h:ma d/m/y', $modified);
        $this->response['fileinfo']['file_perms'] = $perms;
        $this->response['path'] = self::$path;
    }

    /**
     * Adds recieved info to the selected file
     */
    private function edit_file($content){
        if(file_put_contents($this->path_and_item(), $content)){

        } else {
            throw new ErrorException('Failed to edit file!');
        }
    }

    // Non-specifc Methods
    /**
     * Reanmes the current file/folder.
     * 
     * @param string $new_name the new name of the file/folder.
     */
    private function rename($new_name){
        $path = self::$path;
        rename($this->path_and_item(), $path . $new_name);

        $this->open_dir('scan_dir');
        $this->response['response'] = 'Renamed!';
    }

    /**
     * Moves a selected file or folder to the current path.
     * @param string $file_name the name of the file or folder.
     * @param string $old_path the path from which the file is being moves.
     * 
     * this method does not require the new path, because it is alreafy known to this class.
     */
    private function move($file_name, $old_path){
        $old = $old_path . $file_name;
        $new = self::$path . $file_name;

        rename($old, $new);
    }
    
    public function method_manager($root, $data, $uploads, $upl_data = 0){

        if(!$uploads){
            $data_for = $data->for;
            self::$item = $data->item;
            $item = $data->item;
            self::$path = $data->path;
        } else {
            self::$path = $data->path;
            self::$item = $data->name;
            $data_for = 'upload';
        }

        switch ($data_for) {

            case 'root':
                self::$path = $root;
                $this->open_dir('');
                echo json_encode($this->response);
                break;

            case 'back':
                if(self::$path !== $root){
                    $rawPath = str_replace('/', '=%x=k=x%=', self::$path);
                    $pathArr = preg_split('/=%x=k=x%=/', $rawPath);
                    array_pop($pathArr);
                    array_pop($pathArr);
                    $back_path = '';
                    foreach($pathArr as $dir){
                        $back_path .= $dir . '/';
                    }
                    self::$path = $back_path;
                } else {self::$path = $root;}
                $this->open_dir('scan_dir');
                echo json_encode($this->response);
                break;

        // Folder Management
        
            case 'open_dir':
                $this->open_dir('');
                echo json_encode($this->response);
                break;

            case 'reload':
                $this->open_dir('scan_dir');
                echo json_encode($this->response);
                break;
            
            case 'mk_dir':
                $this->mk_dir();
                echo json_encode($this->response);
                break;

            case 'purge_dir':
                $dir = self::$path . $item;
                $this->purge_dir($dir);
                $this->open_dir('scan_dir');
                $this->response['response'] = 'Folder deleted!';
                echo json_encode($this->response);
                break;

            case 'copy_dir':
                $folder_name = $data->advanced->copy_folder_name;
                $src = $data->advanced->cut_path . $folder_name;
                $destination = self::$path;
                mkdir($destination . $folder_name);
                $destination = $destination . $folder_name;
                $this->copy_dir($src, $destination);
                $this->open_dir('scan_dir');
                $this->response['response'] = 'Folder Copied';
                echo json_encode($this->response);
                break;
    
        // File Mamangement

            case 'mk_file':
                $this->mk_file();
                echo json_encode($this->response);
                break;

            case 'get_file_info':
                $this->get_file_info();
                echo json_encode($this->response);
                break;

            case 'unlink_file':
                $this->unlink_file($item);
                $this->open_dir('scan_dir');
                $this->response['response'] = 'File Deleted!';
                echo json_encode($this->response);
                break;

            case 'copy':
                $file_src_path = $data->advanced->cut_path;
                $this->copy($item, $file_src_path);
                $this->open_dir('scan_dir');
                $this->response['response'] = 'Copied';
                echo json_encode($this->response);
                break;

            case 'upload';
                $this->upload_file($upl_data);
                $this->open_dir('scan_dir');
                $this->response['response'] = 'File Uploaded';
                echo json_encode($this->response);
                break;

            case 'edit_file':
                $this->edit_file($data->advanced->edited_content);
                $this->open_dir('scan_dir');
                $this->response['response'] = 'File Edited!';
                break;

        // Non-specific Management

            case 'rename':
                $re_name = $data->advanced->rename;
                $this->rename($re_name);
                echo json_encode($this->response);
                break;

            case 'cut':
                $old_path = $data->advanced->cut_path;
                $this->move($item, $old_path);
                $this->open_dir('scan_dir');
                $this->response['response'] = 'Moved';
                echo json_encode($this->response);
                break;

            case 'multi_cut':
                if($data->advanced->selected_files != ''){
                    $array = $data->advanced->selected_files;
                    for($x = 0; $x < count($array); $x++){
                        $this->move($array[$x]->name, $array[$x]->path);
                    }
                }
                if($data->advanced->selected_folders != ''){
                    $array_F = $data->advanced->selected_folders;
                    for($x = 0; $x < count($array_F); $x++){
                        $this->move($array_F[$x]->name, $array_F[$x]->path);
                    }
                }
                $this->open_dir('scan_dir');
                $this->response['response'] = 'Files Moved';
                echo json_encode($this->response);
                break;

            case 'multi_copy':
                if($data->advanced->selected_files != ''){
                    $array = $data->advanced->selected_files;
                    for($x = 0; $x < count($array); $x++){
                        $name = $array[$x]->name;
                        $old_path = $array[$x]->path;
                        $this->copy($name, $old_path);
                    }
                }
                if($data->advanced->selected_folders != ''){
                    $array_F = $data->advanced->selected_folders;
                    for($x = 0; $x < count($array_F); $x++){
                        $folder_name = $array_F[$x]->name;
                        $src = $array_F[$x]->path . $folder_name;
                        $destination = self::$path;
                        mkdir($destination . $folder_name);
                        $destination = $destination . $folder_name;
                        $this->copy_dir($src, $destination);
                    }
                }
                $this->open_dir('scan_dir');
                $this->response['response'] = 'Files Copied!';
                echo json_encode($this->response);
                break;

            case 'multi_unlink_file':
                if($data->advanced->selected_files != ''){
                    $array = $data->advanced->selected_files;
                    for($x = 0; $x < count($array); $x++){
                        $this->unlink_file($array[$x]->name);
                    }
                }
                if($data->advanced->selected_folders != ''){
                    $array_F = $data->advanced->selected_folders;
                    for($x = 0; $x < count($array_F); $x++){
                        $dir = self::$path . $array_F[$x]->name;
                        $this->purge_dir($dir);
                    }
                }
                $this->open_dir('scan_dir');
                $this->response['response'] = 'Files Deleted!';
                echo json_encode($this->response);
                break;

            default:
                # code...
                break;
        }
    }
}

define('SMPLF', new SimpleFiles);

$upload = false;
$files = 0;

$raw_data = file_get_contents('php://input');
$data = json_decode($raw_data);

if(isset($_FILES['uploadFile'])){
    $upload = true;
    $data = json_decode($_POST['xtra_info']);
    $files = $_FILES['uploadFile'];
}

SMPLF->method_manager(ROOT, $data, $upload, $files);

