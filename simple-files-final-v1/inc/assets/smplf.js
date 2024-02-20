const body = document.getElementById('smplf-content');
const site_URL = window.location.host;

const theme = {
    colors: {
        prime_color: 'rgb(33, 115, 182)',
        folder_color: 'rgb(33, 115, 182)',
        file_color: 'rgb(167, 167, 167)',
        select_color: 'rgb(204, 9, 9)',
    },
    get_color: function(color){
        return this.colors[color];
    },
    set_theme: function(props_array){
        const to_storage = JSON.stringify(props_array);
        localStorage.setItem('smplf_theme_colors', to_storage);
    },
    load_theme: function(){
        if(localStorage.getItem('smplf_theme_colors') == undefined){
            localStorage.setItem('smplf_theme_colors', JSON.stringify(this.colors));
        }
        const colors = JSON.parse(localStorage.getItem('smplf_theme_colors'));
        this.colors.prime_color = colors.prime_color;
        this.colors.folder_color = colors.folder_color;
        this.colors.file_color = colors.file_color;
        this.colors.select_color = colors.select_color;
    }
}
theme.load_theme();

///////////////////////////////////////////////////////////////////////////////////////
// START UTILS

function easyHTML(type, id, classes, appendTo, callback = () =>{}){
    _element = document.createElement(type);
    _element.id = id;
    _element.classList = classes;
    callback();
    appendTo.appendChild(_element);
    return _element;
}

function easyHTMLi(type, id, classes, innertext, appendTo, callback = () =>{}){
    _element = document.createElement(type);
    _element.id = id;
    _element.classList = classes;
    _element.innerHTML = innertext;
    callback();
    appendTo.appendChild(_element);
    return _element;
}
/**
 * 
 * @param rawName 
 * the raw name of the file which includes the extention
 * @param  array 
 * the array from which to search
 * @return True or false
 */
function _file_exists(rawName, array){

    for(let x = 0; x < array.length; x++){
        if(rawName == array[x]){
            return true;
            break;
        }
    }
    return false;
}

/**
 * Checks the file group of a given file by extracting the extension from the file name.
 * @param file The name of the file, it should include the extension.
 * 
 * @returns The file group of the given file i.e. image | video
 */
function file_is_type(file){
    const get_Type  = file.split('.');
    const file_type = get_Type[get_Type.length - 1];

    let group;
    switch(file_type){
        case 'jpg': case 'jpeg': case 'png': case 'svg': case 'webp':
            group = 'image';
            break;

        case 'txt': case 'json': case 'md': case 'html': case 'php': case 'js': case 'css':
            group = text;
            break;
    }
    return group;
}

function revert_style(elem, _color){
    const item = document.getElementsByClassName(elem);
    for(let x = 0 ; x < item.length; x++){
        item[x].style.color = _color;
    }
}

// END UTILS
////////////////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param id the id of the button/element that trigers the show/hide 
 * @param target_id the element to show or hide
 * @param display the CSS display value to switch to. E.g. block | flex| grid, e.t.c. 
 * @param callback an optional callback function to execute
 */
function show_hide(id, target_id, display, callback = ()=>{}){
    const button = document.getElementById(id);
    _target = document.getElementById(target_id);
    button.onclick = ()=>{
        if(_target.style.display == 'none'){
            _target.style.display = display;
        } else {
            _target.style.display = 'none';
        }
        callback();
    }
}

/**
 * A template of the information to send to the server
 * @param item this param is always required
 * @param path also always required. the others can be filled with empty strings if not available.
 */
class SendData {
    constructor(to, item, path, newName = 0, cut_path = 0, paste_path = 0){
        this.for = to;
        this.item = item;
        this.path = path;
        this.advanced = {
            rename: newName,
            cut_path: cut_path,
            folder_cut_path: '',
            copy_folder_name: '',
            paste_path: paste_path,
            selected_files: [],
            selected_folders: [],
            edited_content: '',
            uploads: '',
        }
    }
}

/**
 * Holds the information recieved from @see get_dir()
 */
let response_data;
/**
 * Sends data to the server php script.
 * @param target the information to send, it must always be based on the SendData class.
 */
function get_dir(target){
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../wp-content/plugins/simple-files/inc/smplf-functions.php', false)
    xhr.onload = () => {
        const response = JSON.parse(xhr.responseText);
        response_data = response;
    }
    xhr.send(target);
}

/**
 * Holds file information recieved from the server. it is rendered into the Micro View box.
 */
let recieved_file_info;
/**
 * A function the executes the get_dir() and display() function, so the recieved information is automatically rendered.
 * @param data the data to send to the server script, based on the SendData class.
 */
function accessData(data){
    get_dir(data);
    if(isNaN(response_data.response + 10)){
        alert(response_data.response);
    }
    display(response_data);
    recieved_file_info = response_data.fileinfo;
}

 
//
// The top bar elements and icons and their functionality
//

// Top navigation starts
// The nav body
const nav = easyHTML('div', 'smplf-nav', '', body);
// The nav head div (the plugin title)
const nav_head = easyHTML('div', 'smplf-nav-head', '', nav);
// The plugin title
const nav_brand = easyHTML('h5', 'smplf-nav-brand', '', nav_head, ()=>{
    _element.innerHTML = 'Simple Files';
});
// The section that shows the user the directoty breadcrums
const view_path = easyHTML('p', 'nav-view-path', '', nav_head, ()=>{
    _element.innerHTML = 'Root:/';
})

// The navigation icons/buttons
const nav_btns_div = easyHTML('div', 'smplf-navbtns-div', '', nav_head);
// Back icon
const nav_back = easyHTML('button', 'smplf-nav-back', 'fa fa-chevron-left', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        let item = response_data.path;
        let raw_item = item.split('/');
        let item_name = raw_item[raw_item.length - 2];
        const send = JSON.stringify( new SendData('back', item_name, response_data.path) );
        folder_grid.innerHTML = '',
        accessData(send);
        micro_view.style.display = 'none';
    }
});
/**
 * Holds the information of a selected file or folder.
 * 
 * It is set when the user click on a file or right clicks on folder.
 */
let move_file_data;
// The paste icon and its funcionality
const nav_paste = easyHTML('button', 'smplf-nav-paste', 'fa fa-paste', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        // If file select.on property of the Select object is false, paste the single file
        if(!select_files.on){
            // Check if move file data is empty
            if(move_file_data != undefined){
                // Check if a a path from the cut directoy has been provided, do nothing if it has not been provided
                if(move_file_data.advanced.cut_path !== ''){
                    // A check to ensure the user is not trying to paste to the path theyve copied from
                    if(response_data.path !== move_file_data.advanced.cut_path){ 
                        // Visual que: change the color of the paste icon to show is active
                        nav_paste.style.color = theme.colors.prime_color;
                        // Check if a file or folder with the same name exists in the paste directory
                        if(!_file_exists(move_file_data.item, response_data.files) && !_file_exists(move_file_data.item, response_data.folders)){
                            // Ask the user if they are sue they want to proceed
                            const _sure = confirm('Are you sure you want to move/copy "' + move_file_data.item + '" to this directory?');
                            // if the user is sure proceed with the action
                            if(_sure){
                                // Clear the folder grid so that when recieved data is rendered there is no duplication
                                folder_grid.innerHTML = '';
                                move_file_data.path = response_data.path;
                                // send the data
                                accessData(JSON.stringify(move_file_data));
                                // Reset move_file_data and visual ques
                                move_file_data = undefined;
                                nav_paste.style.color = 'rgb(180, 180, 180)';
                            } else {
                                // If the cancels reset the cut directory
                                move_file_data.advanced.cut_path = '';
                            }
                        } else {
                            // If the file or foldr exists alert the user and clear move_file_data
                            move_file_data = undefined;
                            nav_paste.style.color = 'rgb(180, 180, 180)';
                            alert('The file/folder you are trying to move already exists in this directory, Create a new directory or choose a different one.')
                        }
                    } else {
                        // Else if the user click the paste button in the same directory deactivate pasting
                        nav_paste.style.color = 'rgb(180, 180, 180)';
                        move_file_data.advanced.cut_path = '';
                    }
                }
            }
        } else {
            // Check if he user is trying to paste the selected files in the same directory they cut them from
            if(select_files.from != response_data.path){
                // Costruct the data to send
                const _send_selected = new SendData(select_files.to, 'NONE', response_data.path)
                // Append the selected files to the constructed _send_selected object
                for(let x in select_files.seleced_items){
                    _send_selected.advanced.selected_files.push(select_files.seleced_items[x])
                }
                for(let x in select_files.seleced_folders){
                    _send_selected.advanced.selected_folders.push(select_files.seleced_folders[x])
                }
                // Ask the user if they are sure
                const _sure = confirm('Are you sure you want to move the selected items?');

                if(_sure){
                    // Clear the list
                    folder_grid.innerHTML = '';
                    // Send the data
                    accessData(JSON.stringify(_send_selected));

                    // Reset visual ques
                    nav_select.style.color = 'black';
                    nav_paste.style.color = 'rgb(167, 167, 167)';
                    nav_multi_delete.style.color = 'rgb(167, 167, 167)';
                    nav_multi_cut.style.color = 'rgb(167, 167, 167)';
                    nav_multi_copy.style.color = 'rgb(167, 167, 167)';
                    revert_style('smplf-file-name', 'black');
                    revert_style('smplf-file-icon', 'rgb(167, 167, 167)');

                    // Reset select_files object
                    select_files.on = false;
                    select_files.to = '';
                    select_files.operation = '';
                    select_files.seleced_items = {};
                    select_files.seleced_folders = {};
                    select_files.from = '';
                } else {
                    // Reset visual ques
                    nav_select.style.color = 'black';
                    nav_paste.style.color = 'rgb(167, 167, 167)';
                    nav_multi_delete.style.color = 'rgb(167, 167, 167)';
                    nav_multi_cut.style.color = 'rgb(167, 167, 167)';
                    nav_multi_copy.style.color = 'rgb(167, 167, 167)';
                    revert_style('smplf-file-name', 'black')
                    revert_style('smplf-file-icon', 'rgb(167, 167, 167)');

                    // Reset select_files object
                    select_files.on = false;
                    select_files.to = '';
                    select_files.operation = '';
                    select_files.seleced_items = {};
                    select_files.seleced_folders = {};
                    select_files.from = '';
             
                }
            } else {
                alert('Plese move to a different directory');
            }
        }
    }
});

// The cut multiple buttion and its functionality
const nav_multi_cut = easyHTML('button', 'smplf-nav-multi-cut', 'icon-gray fa fa-cut', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        // Check if select files is on
        if(select_files.on){
            // Check for the current selected operation
            if(select_files.operation == 'delete' || select_files.operation == 'copy'){
                
            } else {
                // Set the properties of the Select files object
                select_files.to = 'multi_cut';
                select_files.operation = 'cut';
                select_files.from = response_data.path;

                // Set the visual ques of the past icon to show its now active
                nav_paste.style.color = 'rgb(33, 115, 182)';
                // Set the visual ques of the copy and delete operations to show hat they are now available
                nav_multi_delete.style.color = 'rgb(167, 167, 167)';
                nav_multi_copy.style.color = 'rgb(167, 167, 167)';
            }
        }
    }
});

// Multi copy icon and its funcionality
const nav_multi_copy = easyHTML('button', 'smplf-nav-multi-copy', 'icon-gray fa fa-copy', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        // Check if select files is on
        if(select_files.on){
            // Check for the current selected operation
            if(select_files.operation == 'delete' || select_files.operation == 'cut'){
                
            } else {
                // Set the properties of the Select files object
                select_files.to = 'multi_copy';
                select_files.operation = 'copy';
                select_files.from = response_data.path;

                // Set the visual ques of the past icon to show its now active
                nav_paste.style.color = 'rgb(33, 115, 182)';
                // Set the visual ques of the copy and delete operations to show hat they are now available
                nav_multi_delete.style.color = 'rgb(167, 167, 167)';
                nav_multi_cut.style.color = 'rgb(167, 167, 167)';
            }
        }
    }
});

// Multi delete icon and its funcionality
const nav_multi_delete = easyHTML('button', 'smplf-nav-multi-delete', 'fa fa-trash-can', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        // Check if select files is on
        if(select_files.on){
            // Check for the current opperation
            if(select_files.operation == 'cut' || select_files.operation == 'copy'){
                
            } else {
                //set the users chosen operation
                select_files.operation = 'delete';
                // Costruct the data to send
                const _send_selected = new SendData('multi_unlink_file', 'NONE', response_data.path)
                for(let x in select_files.seleced_items){
                    _send_selected.advanced.selected_files.push(select_files.seleced_items[x])
                }
                for(let x in select_files.seleced_folders){
                    _send_selected.advanced.selected_folders.push(select_files.seleced_folders[x])
                }
                // Ask the user for confirmation
                const _sure = confirm('Are you sure you want to delete the selected items?');

                if(_sure){
                    // Clear the list
                    folder_grid.innerHTML = '';
                    accessData(JSON.stringify(_send_selected));

                    // Reset visual ques
                    nav_select.style.color = 'black';
                    nav_paste.style.color = 'rgb(167, 167, 167)';
                    nav_multi_delete.style.color = 'rgb(167, 167, 167)';
                    nav_multi_cut.style.color = 'rgb(167, 167, 167)';
                    nav_multi_copy.style.color = 'rgb(167, 167, 167)';
                    revert_style('smplf-file-name', 'black');
                    revert_style('smplf-file-icon', 'rgb(167, 167, 167)');

                    // Reset select_files object
                    select_files.on = false;
                    select_files.to = '';
                    select_files.operation = '';
                    select_files.seleced_items = {};
                    select_files.seleced_folders = {};
                    select_files.from = '';
                } else {
                    // Reset visual ques
                    nav_select.style.color = 'black';
                    nav_paste.style.color = 'rgb(167, 167, 167)';
                    nav_multi_delete.style.color = 'rgb(167, 167, 167)';
                    nav_multi_cut.style.color = 'rgb(167, 167, 167)';
                    nav_multi_copy.style.color = 'rgb(167, 167, 167)';
                    revert_style('smplf-file-name', 'black')
                    revert_style('smplf-file-icon', 'rgb(167, 167, 167)');

                    // Reset select_files object
                    select_files.on = false;
                    select_files.to = '';
                    select_files.operation = '';
                    select_files.seleced_items = {};
                    select_files.seleced_folders = {};
                    select_files.from = '';
             
                }
            }
        }
    }
});

/**
 * Holds the array of selected files, the state of selection whether true or false and operaion related information.
 */
const select_files = {
    on: false,
    operation: '',
    to: '',
    from: '',
    seleced_items: {},
    seleced_folders: {},
}

// Nav select icon and its funcionality
const nav_select = easyHTML('button', 'smplf-nav-select', 'fa fa-file-circle-check', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        if(!select_files.on){
            // Checks if select files is off, if so turns it on
            select_files.on = true;
            //clear move file data so there is no collision when pasting, between the selected files being moved and any
            // single files that may have been previously been cut or copied
            move_file_data = undefined;
            // Set the visual ques
            nav_select.style.color = 'rgb(33, 115, 182)';
            nav_paste.style.color = 'rgb(167, 167, 167)';
        } else if(select_files.on){
            // Else deactivate selecting and reset visual ques
            select_files.on = false;

            select_files.seleced_items = {};
            select_files.seleced_folders = {};
            folder_grid.innerHTML = '';
            const info_send = JSON.stringify(new SendData('reload', '', response_data.path));
            accessData(info_send);

            nav_select.style.color = 'black';
            nav_paste.style.color = 'rgb(167, 167, 167)';
            nav_multi_delete.style.color = 'rgb(167, 167, 167)';
            nav_multi_cut.style.color = 'rgb(167, 167, 167)';
            nav_multi_copy.style.color = 'rgb(167, 167, 167)';
        }
    }
});

// Create new file icon, the functionality of this HTML element and the next 3 is at the bottom as functions to execute
// after the document has loaded  so as to access the show hide function
const nav_new_file = easyHTML('button', 'smplf-nav-new-file', 'fa fa-file-circle-plus', nav_btns_div);
const nav_new_folder = easyHTML('button', 'smplf-nav-new-folder', 'fa fa-folder-plus', nav_btns_div);
const nav_upload = easyHTML('button', 'smplf-nav-upload', 'fa fa-upload', nav_btns_div);

// The folder grid body div
const folder_grid = easyHTML('div', 'smplf-folder-grid', '', body);

// Micro view (the list of file options and information)
const micro_view = easyHTML('div', 'smplf-micro-view', '', body, ()=>{
    _element.style.display = 'none';
});

// The Open file viewer container
const open_file_body = easyHTML('div', 'smplf-opened-file-div', '', body, ()=>{
    _element.style.display = 'none';
})
// The top contols for the open file viewer
const open_file_controls = easyHTML('div', 'open-file-view-controls', '', open_file_body);
// The edit file button
const open_file_edit_btn = easyHTMLi('button', 'open-file-edit-btn', '', 'Edit', open_file_controls, ()=>{
    _element.onclick = ()=>{
        if(open_file_display.disabled){
            open_file_display.disabled = false;
            open_file_edit_btn.innerHTML = 'Save';
        } else {
            _sure = confirm('Are you sure you want to edit this file? Please ensure you know what you are doing! Control + Z (undo) after saving the file is not yet supported!')
            if(_sure){
                open_file_display.disabled = true;
                open_file_edit_btn.innerHTML = 'Edit';
                const _send = new SendData('edit_file', open_file_name.innerHTML, response_data.path);
                _send.advanced.edited_content = open_file_display.value;
                accessData(JSON.stringify(_send));
            } else {
                open_file_display.disabled = true;
                open_file_edit_btn.innerHTML = 'Edit';
                alert('Edit canceled!')
            }
        }
    }
});
// The file name, Its set when the user clicks on a file
const open_file_name = easyHTML('span', 'open-file-name', '', open_file_controls);
// The expand icon
const open_file_expand = easyHTML('button', 'open-file-expand', 'fa-solid fa-expand', open_file_controls, ()=>{
    _element.onclick = ()=>{
        if(open_file_body.style.width != '100%'){
            open_file_body.style.width = '100%';
            open_file_body.style.height = '100%';
            open_file_body.style.borderRadius = 0;
            open_file_body.style.left = 0;
            open_file_body.style.top = 0;
            open_file_body.style.zIndex = 99999;

            document.getElementById('open-file-expand').classList.replace('fa-expand', 'fa-compress');

            open_file_controls.style.width = open_file_body.style.width;
            open_file_controls.style.borderTopLeftRadius = 0;
            open_file_controls.style.borderTopRightRadius = 0;
        } else {
            open_file_body.style.width = '50%';
            open_file_body.style.height = '80%';
            open_file_body.style.borderRadius = '10px';
            open_file_body.style.zIndex = '';
            open_file_body.style.left = '';
            open_file_body.style.top = '';

            document.getElementById('open-file-expand').classList.replace('fa-compress', 'fa-expand');

            open_file_controls.style.width = open_file_body.style.width;
            open_file_controls.style.borderTopLeftRadius = '10px';
            open_file_controls.style.borderTopRightRadius = '10px';
        }
    }
})
// The close icon
const open_file_close_btn = easyHTML('button', 'open-file-close-btn', 'fa-solid fa-xmark', open_file_controls, ()=>{
    _element.onclick = ()=>{
        open_file_display.disabled = true;
        open_file_edit_btn.innerHTML = 'Edit';
        
        open_file_body.style.display = 'none';
        open_file_display.innerHTML = '';
    }
});
// The textarea container
const open_file_view_div = easyHTML('div', 'open-file-view-div', '', open_file_body);
// The textarea
const open_file_display = easyHTML('textarea', 'smplf-opened-file-display', '', open_file_view_div, ()=>{
    _element.disabled = true;
    _element.rows = 27;
});

// The mother of all functions :)
/**
 * This function is responsible for rendering the files and folders, and adding all their event listeners and functionality.
 * @param data it takes the data recieved from the server as a parameter.
 * 
 * Every time the accessData() function is called this function is also called so it can re-render the files and folders. So each time before
 * the accessData() function is called the grid must be cleared
 */
function display(data){
    
    /**
     *  The path to the current directory 
     */
    const current_path = data.path;
    // Clean the path so it can be rendered in const view_path HTML element
    let show_path = current_path;
    let __num = 0;
    while(__num < 20){
        let _path = show_path.replace('../', '');
        show_path = _path;
        __num += 1;
    }
    view_path.innerHTML = 'Root:/' + show_path;

    // Display folders first
    for(let x = 0; x < data.folders.length; x++){
        // Loop through the recieved data and beging rendering
        /**
         * The name of the directory the user has clicked on.
         */
        const _folder_name = data.folders[x];
        // The individual folder div
        const folder_div = easyHTML('div', 'smplf-folder-div', '', folder_grid, ()=>{
            // What to do when the folder div is clicked
            let im_selected = false;
            _element.onclick = ()=>{
                if(select_files.on){
                    if(select_files.operation == ''){
                        // Check if the file has been selected, if not set in_seleced to true
                        if(!im_selected){
                            im_selected = true;
                            //Visual ques
                            folder_div.style.color = 'red';
                            folder_icon.style.color = 'red';
                            nav_multi_delete.style.color = 'black';
                            nav_multi_cut.style.color = 'black';
                            nav_multi_copy.style.color = 'black';

                            // Hold the data relevant data of the file when its selected
                            const this_selected_file = {name: _folder_name, path: current_path};
                            // Create a property of select_files.selected_files object, with a key of the file name and value of const this_selected_file
                            select_files.seleced_folders[_folder_name] = this_selected_file;
                        } else {
                            // If the user clicks the folder when its already selected it will set im_selected to false
                            im_selected = false;
                            // Visual ques
                            folder_div.style.color = 'black';
                            folder_icon.style.color = theme.colors.prime_color;
                            // Then we delete the the property that was created in the select_files.seleced_files object that was created with the file name as key
                            delete select_files.seleced_folders[_folder_name];
                        }
                    } else {
                        // Open the selected folder if files select is on and an operation has been chosen
                        // Clear the grid to prevent duplication
                        folder_grid.innerHTML = '';
                        // Contruct the data to send. REquests for The files and directories that are within the selected directory so tey can be rendered
                        const send = JSON.stringify( new SendData('open_dir', data.folders[x] + '/', current_path) );
                        // Send the data
                        accessData(send);
                        // Hide the Micro view
                        micro_view.style.display = 'none';
                    }
                } else {
                    // Open the selected folder if files select is false
                    // Clear the grid to prevent duplication
                    folder_grid.innerHTML = '';
                    // Contruct the data to send. REquests for The files and directories that are within the selected directory so tey can be rendered
                    const send = JSON.stringify( new SendData('open_dir', data.folders[x] + '/', current_path) );
                    // Send the data
                    accessData(send);
                    // Hide the Micro view
                    micro_view.style.display = 'none';
                }
            }
            // What to do on right click
            _element.oncontextmenu = (event)=>{
                event.preventDefault();
                if(micro_view.style.display == 'none'){
                    micro_view.style.display = 'block';
                } else {
                    micro_view.style.display = 'none';
                }
                // Render the options
                // Clear micro view
                micro_view.innerHTML = '';
                // Add options buttons
                // The options container div
                const folder_opt_body             = easyHTML('div', 'file-opt-body', '', micro_view)
                
                const folder_opt_copy             = easyHTML('div', 'mv-options-btn-div', '', folder_opt_body, ()=>{
                                                    _element.onclick = ()=>{
                                                        // Set visual ques
                                                        nav_paste.style.color = 'rgb(33, 115, 182)';
                                                        micro_view.style.display = 'none';

                                                        // Send the folder information to the sever
                                                        const to_send = new SendData('copy_dir', _folder_name);
                                                        to_send.advanced.cut_path = current_path
                                                        to_send.advanced.copy_folder_name= _folder_name;
                                                        move_file_data = to_send;
                                                    }
                                                });
                const folder_opt_copy_icon        = easyHTML('span', 'mv-opt-icon', 'fa fa-copy', folder_opt_copy);
                const folder_opt_copy_name        = easyHTML('span', 'mv-opt-name', '', folder_opt_copy, ()=>{_element.innerHTML = ' Copy'});

                const folder_opt_cut              = easyHTML('div', 'mv-options-btn-div', '', folder_opt_body, ()=>{
                                                    _element.onclick = ()=>{
                                                        nav_paste.style.color = 'rgb(33, 115, 182)';
                                                        micro_view.style.display = 'none';

                                                        // Send the folder information to the sever
                                                        move_file_data = new SendData('cut', _folder_name, '', '', current_path, '');
                                                    }
                                                });
                const folder_opt_cut_icon         = easyHTML('span', 'mv-opt-icon', 'fa fa-cut', folder_opt_cut);
                const folder_opt_cut_name         = easyHTML('span', 'mv-opt-name', '', folder_opt_cut, ()=>{_element.innerHTML = ' Cut'});

                const folder_opt_rename           = easyHTML('div', 'mv-options-btn-div', '', folder_opt_body, ()=>{
                                                    _element.onclick = ()=>{
                                                        // Ask for the new name
                                                        const new_name = prompt('Enter new folder name.');
                                                        // Check if its empty
                                                        if(new_name !== null){
                                                            if(new_name !== ''){
                                                                // Check if a file with the chosen name already exists
                                                                if(_file_exists(new_name, data.folders)){
                                                                    alert('A folder with the chosen name already exists');
                                                                    micro_view.style.display = 'none';
                                                                } else {
                                                                    folder_grid.innerHTML = '';
                                                                    micro_view.style.display = 'none';
                                                                    // Send the folder information to the sever
                                                                    const _send = JSON.stringify(new SendData('rename', _folder_name, current_path, new_name));
                                                                    accessData(_send);
                                                                }
                                                            } else {
                                                                alert('Please enter a new file name')
                                                            }
                                                        }
                                                    }
                                                });
                const folder_opt_rename_icon      = easyHTML('span', 'mv-opt-icon', 'fa fa-i', folder_opt_rename);
                const folder_opt_rename_name      = easyHTML('span', 'mv-opt-name', '', folder_opt_rename, ()=>{_element.innerHTML = ' Rename'});

                const folder_opt_delete           = easyHTML('div', 'mv-options-btn-div', '', folder_opt_body, ()=>{
                                                    _element.onclick = ()=>{
                                                        // Ask if the user is sure they want to delete the selected file
                                                        const _sure = confirm('Are you sure you want to delete the following folder: "' + _folder_name + '" ?');
                                                            if(_sure){
                                                            folder_grid.innerHTML = '';
                                                            // Send the folder information to the sever
                                                            const to_send = JSON.stringify(new SendData('purge_dir', _folder_name, current_path));
                                                            micro_view.style.display = 'none';
                                                            accessData(to_send);
                                                        } else {
                                                            micro_view.style.display = 'none';
                                                        }
                                                    }
                                                });
                const folder_opt_delete_icon      = easyHTML('span', 'mv-opt-icon', 'fa fa-trash-can', folder_opt_delete);
                const folder_opt_delete_name      = easyHTML('span', 'mv-opt-name', '', folder_opt_delete, ()=>{_element.innerHTML = ' Delete'});

            }
        });
        // The folder display icon
        const folder_icon = easyHTML('span', 'smplf-folder-icon', 'smplf-folder-icon icon-blue fa-regular fa-folder', folder_div);
        // The folder display name
        const folder_name = easyHTML('span', 'smplf-folder-name', 'smplf-folder-name', folder_div, ()=>{
            _element.innerHTML = data.folders[x];
        });
    }

    // Display files last
    for(let x = 0; x < data.files.length; x++){
        /**
         * the file name constatnt
         */
        const file_name = data.files[x];
        // Get file type from name
        const get_Type  = file_name.split('.');
        const file_type = get_Type[get_Type.length - 1].toUpperCase();
        // The individual file div
        const folder_div = easyHTML('div', 'smplf-folder-div', '', folder_grid, ()=>{
            /**
             * Stores the selection state of the file, whether or not it has been selected when file selection is on.
             */
            let im_selected = false;
            _element.onclick = ()=>{
                // When the user clicks the file check if file selection is on
                if(select_files.on){
                    // Check if the file has been selected, if not set in_seleced to true
                    if(!im_selected){
                        im_selected = true;
                        //Visual ques
                        folder_div.style.color = 'red';
                        file_icon.style.color = 'red';
                        nav_multi_delete.style.color = 'black';
                        nav_multi_cut.style.color = 'black';
                        nav_multi_copy.style.color = 'black';

                        // Hold the data relevant data of the file when its selected
                        const this_selected_file = {name: file_name, path: current_path};
                        // Create a property of select_files.selected_files object, with a key of the file name and value of const this_selected_file
                        select_files.seleced_items[file_name] = this_selected_file;
                    } else {
                        // If the user clicks the file when its already selected it will set im_selected to false
                        im_selected = false;
                        // Visual ques
                        folder_div.style.color = 'black';
                        file_icon.style.color = 'rgb(167, 167, 167)';
                        // Then we delete the the property that was created in the select_files.seleced_files object that was created with the file name as key
                        delete select_files.seleced_items[file_name];
                    }
                } else {
                    // Send a request for file info
                    const info_send = JSON.stringify(new SendData('get_file_info', file_name, current_path));
                    accessData(info_send);

                    // Get recieved info
                    const info_data = recieved_file_info;

                    // Show hide micro view
                    if(micro_view.style.display == 'none'){
                        micro_view.style.display = 'block';
                    } else {
                        micro_view.style.display = 'none';
                    }

                    // Render the file options
                    // Clear micro view
                    micro_view.innerHTML = '';
                    // Add options buttons
                    const file_opt_body             = easyHTML('div', 'file-opt-body', '', micro_view)

                    const file_opt_open             = easyHTML('div', 'mv-options-btn-div', '', file_opt_body, ()=>{
                                                        _element.onclick = ()=>{
                                                            if(file_is_type(file_name) == 'text'){
                                                                micro_view.style.display = 'none';
                                                                open_file_name.innerHTML = file_name;
                                                                open_file_display.innerHTML = '';
                                                                open_file_display.value = info_data.contents;
                                                                open_file_body.style.display = 'block';
                                                            } else if(file_is_type(file_name) == 'image'){
                                                                //
                                                            }
                                                        }
                    });
                    const file_opt_open_icon        = easyHTML('span', 'mv-opt-icon', 'fa fa-file', file_opt_open);
                    const file_opt_open_name        = easyHTML('span', 'mv-opt-name', '', file_opt_open, ()=>{_element.innerHTML = ' Open'});

                    const file_opt_copy             = easyHTML('div', 'mv-options-btn-div', '', file_opt_body, ()=>{
                                                        _element.onclick = ()=>{
                                                            nav_paste.style.color = 'rgb(33, 115, 182)';
                                                            micro_view.style.display = 'none';

                                                            move_file_data = new SendData('copy', file_name, '', '', current_path, '');
                                                        }
                                                    });
                    const file_opt_copy_icon        = easyHTML('span', 'mv-opt-icon', 'fa fa-copy', file_opt_copy);
                    const file_opt_copy_name        = easyHTML('span', 'mv-opt-name', '', file_opt_copy, ()=>{_element.innerHTML = ' Copy'});

                    const file_opt_cut              = easyHTML('div', 'mv-options-btn-div', '', file_opt_body, ()=>{
                                                        _element.onclick = ()=>{
                                                            nav_paste.style.color = 'rgb(33, 115, 182)';
                                                            micro_view.style.display = 'none';

                                                            move_file_data = new SendData('cut', file_name, '', '', current_path, '');
                                                        }
                                                    });
                    const file_opt_cut_icon         = easyHTML('span', 'mv-opt-icon', 'fa fa-cut', file_opt_cut);
                    const file_opt_cut_name         = easyHTML('span', 'mv-opt-name', '', file_opt_cut, ()=>{_element.innerHTML = ' Cut'});

                    const file_opt_rename           = easyHTML('div', 'mv-options-btn-div', '', file_opt_body, ()=>{
                                                        _element.onclick = ()=>{
                                                            const new_name = prompt('Enter new file name. (Do not include the file extension)');
                                                            const ext = file_name.split('.');
                                                            const exten = ext[ext.length - 1];
                                                            if(new_name !== null){
                                                                if(new_name !== ''){
                                                                    if( _file_exists(new_name + '.' + exten, data.files)){
                                                                        alert('A file with the chosen name already exists');
                                                                    } else {
                                                                        folder_grid.innerHTML = '';
                                                                        micro_view.style.display = 'none';
                                                                        const _send = JSON.stringify(new SendData('rename', file_name, current_path, new_name + '.' + exten));
                                                                        accessData(_send);
                                                                    }
                                                                } else {
                                                                    alert('Please enter a new file name')
                                                                }
                                                            }
                                                        }
                                                    });
                    const file_opt_rename_icon      = easyHTML('span', 'mv-opt-icon', 'fa fa-i', file_opt_rename);
                    const file_opt_rename_name      = easyHTML('span', 'mv-opt-name', '', file_opt_rename, ()=>{_element.innerHTML = ' Rename'});

                    const file_opt_download         = easyHTML('div', 'mv-options-btn-div', '', file_opt_body, ()=>{
                                                        _element.onclick = ()=>{
                                                            const file = site_URL + '/' + show_path + file_name;
                                                            const dwl = FileReader(file, file_name);
                                                            window.location.assign(dwl);
                                                        }
                                                    });
                    const file_opt_dload_icon       = easyHTML('span', 'mv-opt-icon', 'fa fa-download', file_opt_download);
                    const file_opt_dload_name       = easyHTML('span', 'mv-opt-name', '', file_opt_download, ()=>{_element.innerHTML = ' Download'});

                    const file_opt_delete           = easyHTML('div', 'mv-options-btn-div', '', file_opt_body, ()=>{
                                                        _element.onclick = ()=>{
                                                            const are_you_sure = confirm('Are you sure you want to delete the following file: "' + file_name + '" ?');
                                                                if(are_you_sure == true){
                                                                folder_grid.innerHTML = '';
                                                                const to_send = JSON.stringify(new SendData('unlink_file', file_name, current_path));
                                                                micro_view.style.display = 'none';
                                                                accessData(to_send);
                                                            } else {
                                                                micro_view.style.display = 'none';
                                                            }
                                                        }
                                                    });
                    const file_opt_delete_icon      = easyHTML('span', 'mv-opt-icon', 'fa fa-trash-can', file_opt_delete);
                    const file_opt_delete_name      = easyHTML('span', 'mv-opt-name', '', file_opt_delete, ()=>{_element.innerHTML = ' Delete'});

                    

                    // Get file name only
                    const get_name          = file_name.split('.');
                    const file_name_only    = get_name[0];

                    // Render the recieved info in the info box
                    // Info box
                    const info_box              = easyHTML('div', 'mc-info-box', '', micro_view);

                    const info_box_icon         = easyHTML('span', 'info-box-icon', 'fa-solid fa-circle-info', info_box)

                    const info_name_div         = easyHTML('div', 'info-box-data-div', '', info_box)
                    const info_name_title       = easyHTMLi('span', 'info-data-title', '', 'Name: ', info_name_div);
                    const info_name_value       = easyHTMLi('span', 'info_data_value', '', file_name_only, info_name_div);

                    const info_type_div         = easyHTML('div', 'info-box-data-div', '', info_box)
                    const info_type_title       = easyHTMLi('span', 'info-data-title', '', 'Type: ', info_type_div);
                    const info_type_value       = easyHTMLi('span', 'info_data_value', '', file_type + ' File', info_type_div);

                    const info_size_div         = easyHTML('div', 'info-box-data-div', '', info_box)
                    const info_size_title       = easyHTMLi('span', 'info-data-title', '', 'Size: ', info_size_div);
                    const info_size_value       = easyHTMLi('span', 'info_data_value', '', info_data.size, info_size_div);

                    const info_path_div         = easyHTML('div', 'info-box-data-div', '', info_box)
                    const info_path_title       = easyHTMLi('span', 'info-data-title', '', 'Path: ', info_path_div);
                    const info_path_value       = easyHTMLi('span', 'info_data_value', '', show_path + file_name, info_path_div);

                    const info_modified_div     = easyHTML('div', 'info-box-data-div', '', info_box)
                    const info_modified_title   = easyHTMLi('span', 'info-data-title', '', 'Last Modified: ', info_modified_div);
                    const info_modified_value   = easyHTMLi('span', 'info_data_value', '', info_data.modified, info_modified_div);

                    
                }
            }
        });
        let file_type_icon;
        switch(file_type){
            // Code files
            case 'HTML':
            case 'PHP':
            case 'JS':
            case 'CSS':
                file_type_icon = 'fa-file-code';
                break;

            case 'JPG':
            case 'JPEG':
            case 'PNG':
            case 'SVG':
            case 'WEBP':
                file_type_icon = 'fa-file-image';
                break;

            case 'TXT':
            case 'JSON':
            case 'MD':
                file_type_icon = 'fa-file-lines';
                break;

            case 'ZIP':
                file_type_icon = 'fa-file-zipper';
                break;

            case 'CSV':
                file_type_icon = 'fa-file-csv';
                break;

            case 'PPT':
                file_type_icon = 'fa-file-powerpoint';
                break;

            case 'MPEG':
            case "MP3":
            case 'WAV':
                file_type_icon = 'fa-file-audio';
                break;

            case 'MP4':
            case '3GP':
            case 'MKV':
            case 'M4A':
                file_type_icon = 'fa-file-video';
                break;

            default: 
            file_type_icon = 'fa-file';
            break;
        }
        // Assign the correct icon according to the file type
        const file_icon = easyHTML('span', 'smplf-folder-icon', 'smplf-file-icon icon-gray fa-solid ' + file_type_icon, folder_div);
        const file_div_name = easyHTML('span', 'smplf-folder-name', 'smplf-file-name', folder_div, ()=>{
            _element.innerHTML = data.files[x];
        });
    }
}

const load = JSON.stringify( new SendData('root', '', '') );
accessData(load);

document.addEventListener('load',
    show_hide('smplf-nav-new-file', 'smplf-micro-view', 'block', ()=>{
        _target.innerHTML = '';
        const group = easyHTML('div', 'smplf-new-file-div', 'form-group', _target)
        const lable = easyHTML('label', 'smplf-new-file-name', '', group, ()=>{
            _element.innerHTML = 'File name:';
        })
        const input = easyHTML('input', 'smplf-new-file-input', 'form-control', group, ()=>{
            _element.style.marginBottom = '10px';
        })
        const btn = easyHTML('button', 'smplf-mk-file', 'btn btn-primary', _target, ()=>{
            _element.innerHTML = 'Create';
            _element.onclick = ()=>{
                if(input.value == ''){
                    alert('Please enter file name')
                }
                const send = JSON.stringify(new SendData('mk_file', input.value, response_data.path));
                folder_grid.innerHTML = '';
                micro_view.style.display = 'none';
                accessData(send);
            }
        })
    })
)
document.addEventListener('load',
    show_hide('smplf-nav-new-folder', 'smplf-micro-view', 'block', ()=>{
        _target.innerHTML = '';
        const group = easyHTML('div', 'smplf-new-folder-div', 'form-group', _target)
        const lable = easyHTML('label', 'smplf-new-folder-name', '', group, ()=>{
            _element.innerHTML = 'Folder name:';
        })
        const input = easyHTML('input', 'smplf-new-folder-input', 'form-control', group, ()=>{
            _element.style.marginBottom = '10px';
        })
        const btn = easyHTML('button', 'smplf-mk-dir', 'btn btn-primary', _target, ()=>{
            _element.innerHTML = 'Create';
            _element.onclick = ()=>{
                if(input.value == ''){
                    alert('Please enter folder name')
                }
                const send = JSON.stringify(new SendData('mk_dir', input.value, response_data.path));
                folder_grid.innerHTML = '';
                micro_view.style.display = 'none';
                accessData(send);
            }
        })
    })
)
document.addEventListener('load',
    show_hide('smplf-nav-upload', 'smplf-micro-view', 'block', ()=>{
        _target.innerHTML = '';
        const group = easyHTML('form', 'smplf-upload-div', 'form-group', _target, ()=>{
            _element.onsubmit = (e)=>{
                e.preventDefault();
                var formData = new FormData(document.getElementById('smplf-upload-div')); // Get form data

                // Prepare file information for JSON
                var file = document.getElementById('smplf-select-file-input').files[0];
                var xtra_info = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    for: 'upload',
                    path: response_data.path
                };
                formData.append('xtra_info', JSON.stringify(xtra_info)); // Add file info to FormData
                const xhr = new XMLHttpRequest();
                xhr.open('POST',  '../wp-content/plugins/simple-files/inc/smplf-functions.php');
                xhr.onloadstart = ()=>{
                    console.log('Loading...');
                }
                xhr.onload = ()=>{
                    response_data = JSON.parse(xhr.responseText)
                    folder_grid.innerHTML = '',
                    display(JSON.parse(xhr.responseText))
                }
                xhr.onloadend = ()=>{
                    console.log('Done')
                };
                xhr.send(formData);
            }
        })
        const lable = easyHTML('label', 'smplf-upload-file-label', '', group, ()=>{
            _element.innerHTML = 'Select file:';
        })
        const input = easyHTML('input', 'smplf-select-file-input', 'form-control', group, ()=>{
            _element.type = 'file';
            _element.name = 'uploadFile';
            _element.style.marginBottom = '10px';
        })
        const btn = easyHTML('button', 'smplf-upload-file', 'btn btn-primary', group, ()=>{
            _element.innerHTML = 'Upload'
            _element.type = 'submit';
            _element.onsubmit = (e)=>{
            }
        })
    })
)