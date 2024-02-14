const body = document.getElementById('smplf-content');
const site_URL = window.location.host;
// START UTILS
///////////////////////////////////////////////////////////////////////////////////////

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
            console.log(rawName + ' -> ' + array[x]);
            return true;
            break;
        }
    }
    return false;
}


function revert_style(elem, _color){
    const item = document.getElementsByClassName(elem);
    for(let x = 0 ; x < item.length; x++){
        item[x].style.color = _color;
    }
}


////////////////////////////////////////////////////////////////////////////////////////
// END UTILS

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

class SendData {
    constructor(to, item, path, newName = 0, cut_path = 0, paste_path = 0){
        this.for = to;
        this.item = item;
        this.path = path;
        this.advanced = {
            rename: newName,
            cut_path: cut_path,
            paste_path: paste_path,
            selected_files: [],
            edited_content: '',
            uploads: '',
        }
    }
}

let response_data;
function get_dir(target){
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '../wp-content/plugins/simple-files/inc/smplf-functions.php', false)
    xhr.onload = () => {
        console.log(target);
        const response = JSON.parse(xhr.responseText);
        response_data = response;
    }
    xhr.send(target);
}

let recieved_file_info;
function accessData(data){
    get_dir(data);
    if(isNaN(response_data.response + 10)){
        alert(response_data.response);
    }
    display(response_data);
    recieved_file_info = response_data.fileinfo;
}
 
const nav = easyHTML('div', 'smplf-nav', '', body);
const nav_head = easyHTML('div', 'smplf-nav-head', '', nav);
const nav_brand = easyHTML('h5', 'smplf-nav-brand', '', nav_head, ()=>{
    _element.innerHTML = 'Simple Files';
});
const view_path = easyHTML('p', 'nav-view-path', '', nav_head, ()=>{
    _element.innerHTML = 'Root:/';
})
const nav_btns_div = easyHTML('div', 'smplf-navbtns-div', '', nav_head);

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

let move_file_data;
const nav_paste = easyHTML('button', 'smplf-nav-paste', 'fa fa-paste', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        if(!select_files.on){
            if(move_file_data != undefined){
                if(move_file_data.advanced.cut_path !== ''){
                    if(response_data.path !== move_file_data.advanced.cut_path){ 
                        nav_paste.style.color = 'rgb(180, 180, 180)';
                        if(!_file_exists(move_file_data.item, response_data.files) && !_file_exists(move_file_data.item, response_data.folders)){
                            const _sure = confirm('Are you sure you want to move/copy "' + move_file_data.item + '" to this directory?');
                            if(_sure){
                                folder_grid.innerHTML = '';
                                move_file_data.path = response_data.path;
                                accessData(JSON.stringify(move_file_data));
                                move_file_data = undefined;
                                move_file_data.advanced.cut_path = '';
                            } else {
                                move_file_data.advanced.cut_path = '';
                            }
                        } else {
                            move_file_data = undefined;
                            nav_paste.style.color = 'rgb(180, 180, 180)';
                            alert('The file/folder you are trying to move already exists in this directory, Create a new directory or choose a different one.')
                        }
                    } else {
                        nav_paste.style.color = 'rgb(180, 180, 180)';
                        move_file_data.advanced.cut_path = '';
                    }
                }
            }
        } else {
            if(select_files.from != response_data.path){
                const _send_selected = new SendData(select_files.to, 'NONE', response_data.path)
                for(let x in select_files.seleced_items){
                    _send_selected.advanced.selected_files.push(select_files.seleced_items[x])
                }
                const _sure = confirm('Are you sure you want to move the selected items?');

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
                    select_files.from = '';
             
                }
            } else {
                alert('Plese move to a different directory');
            }
        }
    }
});

const nav_multi_cut = easyHTML('button', 'smplf-nav-multi-cut', 'icon-gray fa fa-cut', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        if(select_files.on){
            if(select_files.operation == 'copy' || select_files.operation == 'delete'){
                
            } else {
                select_files.to = 'multi_cut';
                select_files.operation = 'cut';
                select_files.from = response_data.path;

                nav_paste.style.color = 'rgb(33, 115, 182)';

                nav_multi_delete.style.color = 'rgb(167, 167, 167)';
                nav_multi_copy.style.color = 'rgb(167, 167, 167)';
            }
        }
    }
});

const nav_multi_copy = easyHTML('button', 'smplf-nav-multi-copy', 'icon-gray fa fa-copy', nav_btns_div, ()=>{
    
});

const nav_multi_delete = easyHTML('button', 'smplf-nav-multi-delete', 'fa fa-trash-can', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        if(select_files.on){
            if(select_files.operation == 'copy' || select_files.operation == 'cut'){
                
            } else {
                const _send_selected = new SendData('multi_unlink_file', 'NONE', response_data.path)
                for(let x in select_files.seleced_items){
                    _send_selected.advanced.selected_files.push(select_files.seleced_items[x])
                }
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
                    select_files.from = '';
             
                }
            }
        }
    }
});

const select_files = {
    on: false,
    to: '',
    operation: '',
    seleced_items: {},
    from: ''
}
const nav_select = easyHTML('button', 'smplf-nav-select', 'fa fa-file-circle-check', nav_btns_div, ()=>{
    _element.onclick = ()=>{
        if(select_files.on == false){
            select_files.on = true;
            move_file_data = undefined;

            nav_select.style.color = 'rgb(33, 115, 182)';
            nav_paste.style.color = 'rgb(167, 167, 167)';
        } else if(select_files.on == true){
            select_files.on = false;

            select_files.seleced_items = {};

            nav_select.style.color = 'black';
            nav_paste.style.color = 'rgb(167, 167, 167)';
            nav_multi_delete.style.color = 'rgb(167, 167, 167)';
            nav_multi_cut.style.color = 'rgb(167, 167, 167)';
            nav_multi_copy.style.color = 'rgb(167, 167, 167)';
            
            revert_style('smplf-file-name', 'black')
            revert_style('smplf-file-icon', 'rgb(167, 167, 167)');
        }
    }
});

const nav_new_file = easyHTML('button', 'smplf-nav-new-file', 'fa fa-file-circle-plus', nav_btns_div);
const nav_new_folder = easyHTML('button', 'smplf-nav-new-folder', 'fa fa-folder-plus', nav_btns_div);
const nav_upload = easyHTML('button', 'smplf-nav-upload', 'fa fa-upload', nav_btns_div);

const folder_grid = easyHTML('div', 'smplf-folder-grid', '', body);

// Micro view
const micro_view = easyHTML('div', 'smplf-micro-view', '', body, ()=>{
    _element.style.display = 'none';
});

// Open file view
const open_file_body = easyHTML('div', 'smplf-opened-file-div', '', body, ()=>{
    _element.style.display = 'none';
})
const open_file_controls = easyHTML('div', 'open-file-view-controls', '', open_file_body);
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
const open_file_name = easyHTML('span', 'open-file-name', '', open_file_controls);
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
const open_file_close_btn = easyHTML('button', 'open-file-close-btn', 'fa-solid fa-xmark', open_file_controls, ()=>{
    _element.onclick = ()=>{
        open_file_body.style.display = 'none';
        open_file_display.innerHTML = '';
    }
});
const open_file_view_div = easyHTML('div', 'open-file-view-div', '', open_file_body);
const open_file_display = easyHTML('textarea', 'smplf-opened-file-display', '', open_file_view_div, ()=>{
    _element.disabled = true;
    _element.rows = 27;
});

function display(data){
    
    const current_path = data.path;
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
        const _folder_name = data.folders[x];
        const folder_div = easyHTML('div', 'smplf-folder-div', '', folder_grid, ()=>{
            _element.onclick = ()=>{
                folder_grid.innerHTML = '';
                const send = JSON.stringify( new SendData('open_dir', data.folders[x] + '/', current_path) );
                accessData(send);
                micro_view.style.display = 'none';
            }
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
                const folder_opt_body             = easyHTML('div', 'file-opt-body', '', micro_view)

                const folder_opt_copy             = easyHTML('div', 'mv-options-btn-div', '', folder_opt_body, ()=>{
                                                    _element.onclick = ()=>{
                                                        nav_paste.style.color = 'rgb(33, 115, 182)';
                                                        micro_view.style.display = 'none';

                                                        move_file_data = new SendData('copy_dir', _folder_name, '', '', current_path, '');
                                                    }
                                                });
                const folder_opt_copy_icon        = easyHTML('span', 'mv-opt-icon', 'fa fa-copy', folder_opt_copy);
                const folder_opt_copy_name        = easyHTML('span', 'mv-opt-name', '', folder_opt_copy, ()=>{_element.innerHTML = ' Copy'});

                const folder_opt_cut              = easyHTML('div', 'mv-options-btn-div', '', folder_opt_body, ()=>{
                                                    _element.onclick = ()=>{
                                                        nav_paste.style.color = 'rgb(33, 115, 182)';
                                                        micro_view.style.display = 'none';

                                                        move_file_data = new SendData('cut', _folder_name, '', '', current_path, '');
                                                    }
                                                });
                const file_opt_cut_icon         = easyHTML('span', 'mv-opt-icon', 'fa fa-cut', folder_opt_cut);
                const file_opt_cut_name         = easyHTML('span', 'mv-opt-name', '', folder_opt_cut, ()=>{_element.innerHTML = ' Cut'});

                const folder_opt_rename           = easyHTML('div', 'mv-options-btn-div', '', folder_opt_body, ()=>{
                                                    _element.onclick = ()=>{
                                                        const new_name = prompt('Enter new folder name.');
                                                        if(new_name !== null){
                                                            if(new_name !== ''){
                                                                if(_file_exists(new_name, data.folders)){
                                                                    alert('A folder with the chosen name already exists');
                                                                    micro_view.style.display = 'none';
                                                                } else {
                                                                    folder_grid.innerHTML = '';
                                                                    micro_view.style.display = 'none';
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
                                                        const are_you_sure = confirm('Are you sure you want to delete the following folder: "' + _folder_name + '" ?');
                                                            if(are_you_sure == true){
                                                            folder_grid.innerHTML = '';
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
        const folder_icon = easyHTML('span', 'smplf-folder-icon', 'icon-blue fa-regular fa-folder', folder_div);
        const folder_name = easyHTML('span', 'smplf-folder-name', '', folder_div, ()=>{
            _element.innerHTML = data.folders[x];
        });
    }

    // Display files last
    for(let x = 0; x < data.files.length; x++){
        const file_name = data.files[x];
        const folder_div = easyHTML('div', 'smplf-folder-div', '', folder_grid, ()=>{
            let im_selected = false;
            _element.onclick = ()=>{
                if(select_files.on){
                    if(!im_selected){
                        im_selected = true;
                        folder_div.style.color = 'red';
                        file_icon.style.color = 'red';
                        nav_multi_delete.style.color = 'black';
                        nav_multi_cut.style.color = 'black';
                        nav_multi_copy.style.color = 'black';

                        const this_selected_file = {name: file_name, path: current_path};
                        select_files.seleced_items[file_name] = this_selected_file;
                    } else {
                        im_selected = false;
                        folder_div.style.color = 'black';
                        file_icon.style.color = 'rgb(167, 167, 167)';
                        delete select_files.seleced_items[file_name];
                        console.log(select_files.seleced_items);
                    }
                } else {
                    // Send a request for file info
                    const info_send = JSON.stringify(new SendData('get_file_info', file_name, current_path));
                    accessData(info_send);

                    // Get recieved info
                    const info_data = recieved_file_info;
                    console.log(info_data.file_perms);

                    // Show hide micro view
                    if(micro_view.style.display == 'none'){
                        micro_view.style.display = 'block';
                    } else {
                        micro_view.style.display = 'none';
                    }

                    // Render the options
                    // Clear micro view
                    micro_view.innerHTML = '';
                    // Add options buttons
                    const file_opt_body             = easyHTML('div', 'file-opt-body', '', micro_view)

                    const file_opt_open             = easyHTML('div', 'mv-options-btn-div', '', file_opt_body, ()=>{
                                                        _element.onclick = ()=>{
                                                            micro_view.style.display = 'none';
                                                            open_file_name.innerHTML = file_name;
                                                            open_file_display.innerHTML = '';
                                                            open_file_display.value = info_data.contents;
                                                            open_file_body.style.display = 'block';
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

                    // Get file type from name
                    const get_Type  = file_name.split('.');
                    const file_type = get_Type[get_Type.length - 1].toUpperCase();

                   

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
        const file_icon = easyHTML('span', 'smplf-folder-icon', 'smplf-file-icon icon-gray fa-solid fa-file-lines', folder_div);
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
                console.log(formData);
                const xhr = new XMLHttpRequest();
                xhr.open('POST',  '../wp-content/plugins/simple-files/inc/smplf-functions.php');
                xhr.onloadstart = ()=>{
                    console.log('Loading...');
                }
                xhr.onloadend = ()=> console.log('Done');
                xhr.onload = ()=>{
                    response_data = JSON.parse(xhr.responseText)
                    display(JSON.parse(xhr.responseText))
                }
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

// console.log(window.file) Fi