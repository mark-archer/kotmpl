//define(function(){
define(['/public/scripts/lib/uuid.js'], function(uuid) {

    var utils = {
        system_id :     '00000000-0000-0000-0000-000000000000',
        type_type_id :  '00000000-0000-0000-0000-000000000001',
        type_group_id : '00000000-0000-0000-0000-000000000002',
        type_user_id :  '00000000-0000-0000-0000-000000000003',

        type_fn_id :    '00000000-0000-0000-0000-000000000006',
        type_fn_js_id : '00000000-0000-0000-0000-000000000007',
        type_script_id :'00000000-0000-0000-0000-000000000008',
        type_any_id :   '00000000-0000-0000-0000-00000000000a',
        type_json_id :  '00000000-0000-0000-0000-00000000000b',
        type_symbol_id :'00000000-0000-0000-0000-00000000000c',
        type_error_id : '00000000-0000-0000-0000-00000000000e',
        type_test_id :  '00000000-0000-0000-0000-00000000000f',
        type_atom_id :  '00000000-0000-0000-0000-00000000001a',
        type_task_id :  '00000000-0000-0000-0000-00000000001b'
    };
    utils.underscore = _;
    utils.uuid = uuid;

    var modules = {underscore: _, "node-uuid": uuid, utils: utils, '../public/utils': utils};
    function require(path, reload, context, callback) {
        var module = modules[path];
        if(!reload && module){
            if(_.isFunction(callback))
                callback(null, module);
            return module;
        }
        $.get(path, function(js){
            var module = {exports:{}};
            try {
                eval(js);
                modules[path] = module.exports;
            } catch(e){
                return callback(e)
            }
            return callback(null, modules[path]);
        });
    }
    utils.loadNodeModule = require;
    require('/public/utils.js', null, null, function(err, rslt){
        if(err) return console.error(err);
        for(var name in rslt)
            if(rslt.hasOwnProperty(name))
                utils[name] = rslt[name];
        require('/public/hostlang.js', null, null, function (err, rslt) {
            if(err) return console.error(err);
        });
    });

    // easily register new knockout component by just specifying the name (e.g. 'lookup')
    utils.registerComponent = function(name){
        ko.components.register(name, {template: 'ease',viewModel: 'ease'});
    };

    // setup custom knockout loader
    var myLoader = {
        getConfig: function(name, callback) {
            // another way to auto-register components (keep an eye on it)
            if(!ko.components.isRegistered(name)){
                //console.log('auto-registering component: ' + name);
                utils.registerComponent(name);
            }
            ko.components.defaultLoader.getConfig(name, callback);
        },
        loadTemplate: function(name, templateConfig, callback) {
            if (templateConfig == 'ease') {
                var fullUrl = 'public/components/' + name + '.html';
                utils.uGet(fullUrl, function(data){
                    ko.components.defaultLoader.loadTemplate(name, data, callback);
                });
            } else {
                // Unrecognized config format. Let another loader handle it.
                callback(null);
            }
        },

        loadViewModel: function(name, viewModelConfig, callback) {
            if (viewModelConfig == 'ease') {
                if(name !== name.toString())
                    return console.log({err: 'invalid name given', name: name}) && callback(null);

                requirejs(['/public/components/' + name + '.js'], function(viewModelConstructor) {
                    ko.components.defaultLoader.loadViewModel(name, viewModelConstructor, callback);
                });
                //requirejs(['/ui_js_get/' + name + '.js'], function(vmConstructor) {
                //    ko.components.defaultLoader.loadViewModel(name, vmConstructor, callback);
                //});
            } else {
                // Unrecognized config format. Let another loader handle it.
                callback(null);
            }
        }
    };
    ko.components.loaders.unshift(myLoader);

    // auto-register knockout components (flimsy logic, keep an eye on it)
    ko.components.getComponentNameForNode = function(node) {

        var tagNameLower = node.tagName && node.tagName.toLowerCase();

        if (ko.components.isRegistered(tagNameLower)) {
            // If the element's name exactly matches a preregistered
            // component, use that component
            return tagNameLower;
        } else if(node.getAttribute('params') || node.getAttribute('koAutoLoad') || node.getAttribute('kocom')){
            //console.log('auto-registering component: ' + tagNameLower);
            utils.registerComponent(tagNameLower);
            return tagNameLower;
        }
        else {
            // Treat anything else as not representing a component
            return null;
        }
    };

    utils.makeObservable = function(observableObj, fieldName){
        return ko.pureComputed({
            read: function () {
                return (observableObj() || {})[fieldName];
            },
            write: function (value) {
                var o = observableObj();
                o[fieldName] = value;
                observableObj(o);
            }
        });
    };

    utils.ensureObservable = function (item) {
        if(!ko.isObservable(item))
            return ko.observable(item);
        return item;
    };

    utils.expandId = function (obs) {
        if(utils.isid(obs()))
            utils.data_get_one(obs(),function (rslt) {
                if(!rslt.err) obs(rslt);
            });
    };

    // Id alias for uuid
    utils.Id = uuid.v1;
    utils.newid = uuid.v1;

    //utils.isid = function(sid){
    //    // todo: look into validator: https://www.npmjs.com/package/validator
    //    //return !!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.exec(sid);
    //    return !!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.exec(sid);
    //};

    utils.uGet = function(name, callback){
        if(name[0] != '/') name = '/' + name;
        $.get(name, function(data){
            // note: don't parse since we're probably returning text/html
            callback(data);
        });
    };

    utils.dataFromString = JSON.parse;
    utils.dataToString = JSON.stringify;
    utils.uPost = function(name, data, callback){
        //console.log('uPost');
        // convert data to string
        //var strData = JSON.stringify(data);
        var strData = utils.dataToString(data);
        //console.log(strData);
        if(name.substring(0,1) != '/') name = '/' + name;
        if(data === undefined) data = null;
        $.post(name, strData, function(rslt){
            if(rslt){
                //rslt = JSON.parse(rslt);
                rslt = utils.dataFromString(rslt);
                if(rslt && rslt.err) console.error({err: 'see rslt', name: name, data: data, rslt: rslt});
            }
            if(callback) callback(rslt);
        });
    };

    utils.signin = function(username, password, callback){
        utils.uPost('signin', {name:username,password:password},callback);
    };

    utils.context = function(callback){
        utils.uPost('context', null, callback);
    };

    utils.data_exec = function(code, callback){
        utils.uPost('data_exec', code, callback);
    };

    utils.data_get_one = function(id, callback){
        utils.uPost('get', {id: id}, callback);
    };

    utils.data_get = function(query, callback){
        utils.uPost('find', query, callback);
    };

    utils.data_get_any = function(query, callback){
        utils.uPost('findGlobal', query, callback);
    };

    utils.data_save = function(data, callback){
        //data = utils.toJSON(data);
        utils.uPost('save', data, callback);
    };

    utils.data_delete = function(data, callback){
        utils.uPost('remove', data, callback);
    };

    utils.lookup_type = function(query, callback){
        var query = {
            type: utils.type_type_id,
            name: {$regex: '.*' + query + '.*', $options: 'i' }
        };
        utils.data_get(query, callback);
    };

    utils.get_path = function(obj, callback){
        utils.uPost('get_path',obj, callback);
    };

    utils.resolve_path = function(path, callback){
        utils.uPost('resolve_path',path, callback);
    };

    utils.getByPath = function(path, callback){
        utils.uPost('getByPath', path, callback);
    };

    utils.search = function(type, field_names, queryStr, callback){
        var search_regex = {$regex: '.*' + queryStr + '.*', $options: 'i' };
        var or = [];
        _.each(field_names, function(n){
            var o = {};
            o[n] = search_regex;
            or.push(o);
        });
        var query = {$or: or};
        if(type)
            query.type = type;
        utils.data_get(query, callback);
    };

    utils.localStorage = {
        save: function(name, data, relative){
            if(!localStorage) throw 'local storage not available';
            var strData = JSON.stringify(utils.toHostJSON(data));
            var id = name;
            if(relative)
                id = window.location.href.substring(window.location.origin.length).split(' ')[0] + ' ' + name;
            localStorage[id] = strData;
        },
        load: function(name, relative){
            if(!localStorage) throw 'local storage not available';
            var id = name;
            if(relative)
                id = window.location.href.substring(window.location.origin.length).split(' ')[0] + ' ' + name;
            var strData = localStorage[id];
            var data = null;
            try{
                data = utils.fromHostJSON(JSON.parse(strData));
            }catch(err){}
            return data;
        }
    };

    utils.persistLocal = function(name, defaultValue, relative){
        var data = ko.observable(utils.localStorage.load(name, relative) || defaultValue);
        return ko.pureComputed({
            read: function(){
                return data();
            },
            write: function(newValue){
                utils.localStorage.save(name,newValue,relative);
                data(newValue);
            }
        });
    };

    utils.isEqual = function(o1, o2, shortCircuitOnIds){
        // if arrays check each item is the same
        if(_.isArray(o1)){
            if(!_.isArray(o2)) return false;
            if(o1.length != o2.length) return false;
            for(var i in o1)
                if(o1.hasOwnProperty(i))
                    if(!utils.isEqual(o1[i], o2[i]))
                        return false;
            return true;
        }

        //try short-circuiting on ids. (if a property is an object with an id the values shouldn't really matter)
        if(shortCircuitOnIds){
            var o1id = utils.isid(o1) && o1 || o1 && o1.id;
            var o2id = utils.isid(o2) && o2 || o2 && o2.id;
            if(o1id && o2id && o1id == o2id) return true;
        }

        // if objects check each property is the same (short circuit on ids)
        if(_.isObject(o1)){
            if(!_.isObject(o2)) return false;

            // combine all all the property names from both objs
            var fNames = {};
            for(var name in o1)
                if(o1.hasOwnProperty(name))
                    fNames[name] = true;
            for(var name in o2)
                if(o2.hasOwnProperty(name))
                    fNames[name] = true;

            // check each property is equal
            for(var name in fNames)
                if(name[0] != '_') // don't compare properties that start with '_'
                    if(!utils.isEqual(o1[name], o2[name], true)) // now that we're one lvl deep we should short-circuit on ids
                        return false;

            return true;
        }

        // o1 is not array or object so just use == to compare to o2
        return o1 == o2;
    };

    var sessionid = utils.Id();
    var socket = io();
    var subscriptions = {};
    var subscriptionValues = {};
    socket.on('notify', function(data){
        if(!data) return console.log('received no data');
        if(data.err) return console.error(data);
        var id = data.id;
        subscriptionValues[id] = data;
        _.each(subscriptions[id], function(f){f(data);});
    });
    utils.subscribe = function(id, callback){
        id = id.id || id;
        if(subscriptions[id]){
            subscriptions[id].push(callback);
            return callback(subscriptionValues[id]); // we already have it so don't need to get it again
        }
        subscriptions[id] = [callback];
        socket.emit('subscribe', id);
    };

    var syncedObjs = {};
    utils.syncedObj = function(obj, ms_delay){
        if(!ms_delay) ms_delay = 1000; // default to waiting a second before saving
        var data = ko.utils.unwrapObservable(obj);
        if(_.isFunction(data)) throw 'data is a function. not supported';
        data.id = data.id || utils.Id();
        var id = data.id;
        if(!ko.isObservable(obj))
            obj = syncedObjs[id] || ko.observable(obj);
        syncedObjs[id] = obj;

        var serverValue = null;
        var pid = null;
        obj.save = function(){
            var newValue = obj();
            pid = null;
            // if server and local aren't the same, update server
            if(!utils.isEqual(serverValue, newValue))
                utils.data_save(newValue);
        };
        // when this object changes locally, update the server
        obj.subscribe(function(newValue){
            if(pid) clearTimeout(pid);
            pid = setTimeout(obj.save, ms_delay);
        });

        // when this object changes on the server, update local
        utils.subscribe(data,function(newValue) {
            serverValue = _.clone(newValue);
            if(!utils.isEqual(obj(),newValue))
                obj(newValue);
        });
        return obj;
    };

    //// autoresize stuff
    //self.init = function(inp){
    //    function resizeInput() {
    //        //$(this).attr('size', $(this).val().length);
    //        $(this).style('width', $(this).val().length * 18 + 'px')
    //    }
    //    $(inp)
    //        // event handler
    //        .keyup(resizeInput)
    //        // resize on page load
    //        .each(resizeInput);
    //    return utils.Id();
    //};
    //self.autogrow = function(element) {
    //    //console.log(obj, evt);
    //    //var element = evt.target;
    //    element.style.height = "5px";
    //    element.style.height = (element.scrollHeight+20)+"px";
    //    //return true;
    //};

    // names of known key codes (0-255)
    utils.keyboardMap = [
        "", // [0]
        "", // [1]
        "", // [2]
        "CANCEL", // [3]
        "", // [4]
        "", // [5]
        "HELP", // [6]
        "", // [7]
        "BACK_SPACE", // [8]
        "TAB", // [9]
        "", // [10]
        "", // [11]
        "CLEAR", // [12]
        "ENTER", // [13]
        "ENTER_SPECIAL", // [14]
        "", // [15]
        "SHIFT", // [16]
        "CONTROL", // [17]
        "ALT", // [18]
        "PAUSE", // [19]
        "CAPS_LOCK", // [20]
        "KANA", // [21]
        "EISU", // [22]
        "JUNJA", // [23]
        "FINAL", // [24]
        "HANJA", // [25]
        "", // [26]
        "ESCAPE", // [27]
        "CONVERT", // [28]
        "NONCONVERT", // [29]
        "ACCEPT", // [30]
        "MODECHANGE", // [31]
        "SPACE", // [32]
        "PAGE_UP", // [33]
        "PAGE_DOWN", // [34]
        "END", // [35]
        "HOME", // [36]
        "LEFT", // [37]
        "UP", // [38]
        "RIGHT", // [39]
        "DOWN", // [40]
        "SELECT", // [41]
        "PRINT", // [42]
        "EXECUTE", // [43]
        "PRINTSCREEN", // [44]
        "INSERT", // [45]
        "DELETE", // [46]
        "", // [47]
        "0", // [48]
        "1", // [49]
        "2", // [50]
        "3", // [51]
        "4", // [52]
        "5", // [53]
        "6", // [54]
        "7", // [55]
        "8", // [56]
        "9", // [57]
        "COLON", // [58]
        "SEMICOLON", // [59]
        "LESS_THAN", // [60]
        "EQUALS", // [61]
        "GREATER_THAN", // [62]
        "QUESTION_MARK", // [63]
        "AT", // [64]
        "A", // [65]
        "B", // [66]
        "C", // [67]
        "D", // [68]
        "E", // [69]
        "F", // [70]
        "G", // [71]
        "H", // [72]
        "I", // [73]
        "J", // [74]
        "K", // [75]
        "L", // [76]
        "M", // [77]
        "N", // [78]
        "O", // [79]
        "P", // [80]
        "Q", // [81]
        "R", // [82]
        "S", // [83]
        "T", // [84]
        "U", // [85]
        "V", // [86]
        "W", // [87]
        "X", // [88]
        "Y", // [89]
        "Z", // [90]
        "OS_KEY", // [91] Windows Key (Windows) or Command Key (Mac)
        "", // [92]
        "CONTEXT_MENU", // [93]
        "", // [94]
        "SLEEP", // [95]
        "NUMPAD0", // [96]
        "NUMPAD1", // [97]
        "NUMPAD2", // [98]
        "NUMPAD3", // [99]
        "NUMPAD4", // [100]
        "NUMPAD5", // [101]
        "NUMPAD6", // [102]
        "NUMPAD7", // [103]
        "NUMPAD8", // [104]
        "NUMPAD9", // [105]
        "MULTIPLY", // [106]
        "ADD", // [107]
        "SEPARATOR", // [108]
        "SUBTRACT", // [109]
        "DECIMAL", // [110]
        "DIVIDE", // [111]
        "F1", // [112]
        "F2", // [113]
        "F3", // [114]
        "F4", // [115]
        "F5", // [116]
        "F6", // [117]
        "F7", // [118]
        "F8", // [119]
        "F9", // [120]
        "F10", // [121]
        "F11", // [122]
        "F12", // [123]
        "F13", // [124]
        "F14", // [125]
        "F15", // [126]
        "F16", // [127]
        "F17", // [128]
        "F18", // [129]
        "F19", // [130]
        "F20", // [131]
        "F21", // [132]
        "F22", // [133]
        "F23", // [134]
        "F24", // [135]
        "", // [136]
        "", // [137]
        "", // [138]
        "", // [139]
        "", // [140]
        "", // [141]
        "", // [142]
        "", // [143]
        "NUM_LOCK", // [144]
        "SCROLL_LOCK", // [145]
        "WIN_OEM_FJ_JISHO", // [146]
        "WIN_OEM_FJ_MASSHOU", // [147]
        "WIN_OEM_FJ_TOUROKU", // [148]
        "WIN_OEM_FJ_LOYA", // [149]
        "WIN_OEM_FJ_ROYA", // [150]
        "", // [151]
        "", // [152]
        "", // [153]
        "", // [154]
        "", // [155]
        "", // [156]
        "", // [157]
        "", // [158]
        "", // [159]
        "CIRCUMFLEX", // [160]
        "EXCLAMATION", // [161]
        "DOUBLE_QUOTE", // [162]
        "HASH", // [163]
        "DOLLAR", // [164]
        "PERCENT", // [165]
        "AMPERSAND", // [166]
        "UNDERSCORE", // [167]
        "OPEN_PAREN", // [168]
        "CLOSE_PAREN", // [169]
        "ASTERISK", // [170]
        "PLUS", // [171]
        "PIPE", // [172]
        "HYPHEN_MINUS", // [173]
        "OPEN_CURLY_BRACKET", // [174]
        "CLOSE_CURLY_BRACKET", // [175]
        "TILDE", // [176]
        "", // [177]
        "", // [178]
        "", // [179]
        "", // [180]
        "VOLUME_MUTE", // [181]
        "VOLUME_DOWN", // [182]
        "VOLUME_UP", // [183]
        "", // [184]
        "", // [185]
        "SEMICOLON", // [186]
        "EQUALS", // [187]
        "COMMA", // [188]
        "MINUS", // [189]
        "PERIOD", // [190]
        "SLASH", // [191]
        "BACK_QUOTE", // [192]
        "", // [193]
        "", // [194]
        "", // [195]
        "", // [196]
        "", // [197]
        "", // [198]
        "", // [199]
        "", // [200]
        "", // [201]
        "", // [202]
        "", // [203]
        "", // [204]
        "", // [205]
        "", // [206]
        "", // [207]
        "", // [208]
        "", // [209]
        "", // [210]
        "", // [211]
        "", // [212]
        "", // [213]
        "", // [214]
        "", // [215]
        "", // [216]
        "", // [217]
        "", // [218]
        "OPEN_BRACKET", // [219]
        "BACK_SLASH", // [220]
        "CLOSE_BRACKET", // [221]
        "QUOTE", // [222]
        "", // [223]
        "META", // [224]
        "ALTGR", // [225]
        "", // [226]
        "WIN_ICO_HELP", // [227]
        "WIN_ICO_00", // [228]
        "", // [229]
        "WIN_ICO_CLEAR", // [230]
        "", // [231]
        "", // [232]
        "WIN_OEM_RESET", // [233]
        "WIN_OEM_JUMP", // [234]
        "WIN_OEM_PA1", // [235]
        "WIN_OEM_PA2", // [236]
        "WIN_OEM_PA3", // [237]
        "WIN_OEM_WSCTRL", // [238]
        "WIN_OEM_CUSEL", // [239]
        "WIN_OEM_ATTN", // [240]
        "WIN_OEM_FINISH", // [241]
        "WIN_OEM_COPY", // [242]
        "WIN_OEM_AUTO", // [243]
        "WIN_OEM_ENLW", // [244]
        "WIN_OEM_BACKTAB", // [245]
        "ATTN", // [246]
        "CRSEL", // [247]
        "EXSEL", // [248]
        "EREOF", // [249]
        "PLAY", // [250]
        "ZOOM", // [251]
        "", // [252]
        "PA1", // [253]
        "WIN_OEM_CLEAR", // [254]
        "" // [255]
    ];

    //console.log({utils: utils});

    return utils;
});
