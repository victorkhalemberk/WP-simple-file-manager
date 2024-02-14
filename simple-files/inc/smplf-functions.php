<?php
class SimpleFiles {

    /**
     * Just the path excluding the selected file or folder
     */
    private static $path;
    /**
     * Just the selected file or folder
     */
    private static $item;
    /**
     * Get the full path of directory and the selected file or folder
     * @return string the full path.
     */
    private function path_and_item(){return self::$path . self::$item;}
    /**
     * The response array sent back to the browser (Javascript)
     */
    private $response = array(
        'path'      => '',
        'folders'   => array(),
        'files'     => array(),
        'fileinfo'  => array(
                        'size'      => 'a',
                        'modified'  => 'a',
                        'file_perms'=> 'c',
                        'contents'  => 'c',
                        'response'  => 'd'
                    ),
        'response'  => '',
    );

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
    private function open_dir($for){

        $target_path = '';
        // Set the path
        if(self::$item == ROOT){
            self::$path = '/';
            $target_path = self::$item;
        } elseif($for == 'back') {
            $target_path = self::$path;
        } else {
            $target_path = $this->path_and_item();
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
    private function mk_dir(){

        $dir_path = $this->path_and_item();

        if(!mkdir($dir_path)){
            $this->open_dir('back');
            $this->response['response'] = 'Failed to make requested folder!';
        } else {
            $this->open_dir('back');
            $this->response['response'] = 'Folder Created!';
        }
    }
    function purge_dir($path) {
        // $path = self::$path . $dir_name;
        return !empty($path) && is_file($path) ?
        @unlink($path) :
        (array_reduce(glob($path.'/*'), function ($r, $i) { return $r && $this->purge_dir($i); }, TRUE)) && @rmdir($path);
    }
    private function copy_dir($src, $folder){
        $dest = self::$path . $folder;
        $src = $src . $folder;
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($src, RecursiveDirectoryIterator::SKIP_DOTS)
          );
          
          foreach ($iterator as $fileInfo) {
            $targetPath = str_replace($src, $dest, $fileInfo->getPathname());
            if ($fileInfo->isDir()) {
              mkdir($targetPath, 0777, true);
            } else {
              copy($fileInfo->getPathname(), $targetPath);
            }
          }
    }
    // File methodes
    private function upload_file($file){

        $targetFile = $this->path_and_item();
        move_uploaded_file($file['tmp_name'], $targetFile);
    }
    private function mk_file(){
        $mk_file = fopen($this->path_and_item(), 'w');
        fclose($mk_file);

        $this->open_dir('back');
        $this->response['response'] = 'Success!';
    }
    private function unlink_file($target){
        $file = self::$path . $target;
        unlink($file);
    }
    private function get_file_info() {
        $file = $this->path_and_item();

        $size = filesize($file);
        $modified = filemtime($file);
        $perms = fileperms($file);
        $contents = file_get_contents($file);

        $this->response['fileinfo']['size']     = $this->byte_format($size);
        $this->response['fileinfo']['modified'] = date('h:ma d/m/y', $modified);
        $this->response['fileinfo']['file_perms'] = $perms;
        $this->response['fileinfo']['contents'] = $contents;
        $this->response['path'] = self::$path;
    }

    private function rename_file($new_name){
        $path = self::$path;
        rename($this->path_and_item(), $path . $new_name);

        $this->open_dir('back');
        $this->response['response'] = 'Renamed!';
    }
    private function move_file($file_name, $old_path){
        $old = $old_path . $file_name;
        $new = self::$path . $file_name;

        rename($old, $new);
    }
    private function edit_file($content){
        if(file_put_contents($this->path_and_item(), $content)){

        } else {
            throw new ErrorException('Failed to edit file!');
        }
    }
    private function copy($file_name, $old_path){
        $old = $old_path . $file_name;
        $new = self::$path . $file_name;

        copy($old, $new);
    }
    public function simple_files($root, $data, $uploads, $upl_data = 0){

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
        // Advanced
        // $cut_coppy = $data->advanced->cut_copy;

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
                $this->open_dir('back');
                echo json_encode($this->response);
                break;

            case 'open_dir':
                $this->open_dir('');
                echo json_encode($this->response);
                break;
            
            case 'mk_dir':
                $this->mk_dir();
                echo json_encode($this->response);
                break;

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
                $this->open_dir('back');
                $this->response['response'] = 'File Deleted!';
                echo json_encode($this->response);
                break;

            case 'multi_unlink_file':
                $array = $data->advanced->selected_files;
                for($x = 0; $x < count($array); $x++){
                    $this->unlink_file($array[$x]->name);
                }
                $this->open_dir('back');
                $this->response['response'] = 'Files Deleted!';
                echo json_encode($this->response);
                break;

            case 'rename':
                $re_name = $data->advanced->rename;
                $this->rename_file($re_name);
                echo json_encode($this->response);
                break;

            case 'cut':
                $old_path = $data->advanced->cut_path;
                $this->move_file($item, $old_path);
                $this->open_dir('back');
                $this->response['response'] = 'Moved';
                echo json_encode($this->response);
                break;

            case 'copy':
                $file_src_path = $data->advanced->cut_path;
                $this->copy($item, $file_src_path);
                $this->open_dir('back');
                $this->response['response'] = 'Copied';
                echo json_encode($this->response);
                break;

            case 'multi_cut':
                $array = $data->advanced->selected_files;
                for($x = 0; $x < count($array); $x++){
                    $this->move_file($array[$x]->name, $array[$x]->path);
                }
                $this->open_dir('back');
                $this->response['response'] = 'Files Moved';
                echo json_encode($this->response);
                break;

            case 'upload';
                $this->upload_file($upl_data);
                $this->open_dir('back');
                $this->response['response'] = 'File Uploaded';
                echo json_encode($this->response);
                break;

            case 'purge_dir':
                $dir = self::$path . $item;
                $this->purge_dir($dir);
                echo json_encode($this->response);
                $this->open_dir('back');
                $this->response['response'] = 'Folder Created!';
                break;

            case 'copy_dir':
                $src = $data->advanced->cut_path;
                $this->copy_dir($src, $item);
                $this->open_dir('back');
                $this->response['response'] = 'Folder Copied';
                break;

            case 'edit_file':
                $this->edit_file($data->advanced->edited_content);
                $this->open_dir('back');
                $this->response['response'] = 'File Edited!';
                break;

            default:
                # code...
                break;
        }
    }
}

define('SMPLF', new SimpleFiles);
define('ROOT', '../../../../');

$upload = false;
$files = 0;

$raw_data = file_get_contents('php://input');
$data = json_decode($raw_data);

if(isset($_FILES['uploadFile'])){
    $upload = true;
    $data = json_decode($_POST['xtra_info']);
    $files = $_FILES['uploadFile'];
}

SMPLF->simple_files(ROOT, $data, $upload, $files);

