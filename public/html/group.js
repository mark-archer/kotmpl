
requirejs(
    ['/scripts/ui.utils.js'],

    function(utils) {

        var self = this;
        self.obj = ko.observable();
        self.error = ko.observable();
        self.imports = utils.makeObservable(self.obj,'imports');
        //self.repl = utils.makeObservable(self.obj,'repl');
        self.obj = ko.observable();
        self.obj.subscribe(function(newValue){
            console.log('group newValue');
            window.location.hash = newValue && newValue.name || "";
            if(!newValue && window.location.href.includes('#')){
                // remove hash
                //window.location.href = window.location.href.split('#')[0];
                history.pushState("", document.title, window.location.pathname + window.location.search);
            }
        });

        var hash = (window.location.hash || ' ').substr(1);
        self.ui = ko.observable(hash || 'host-repl2');

        self.switchUI = function(uiName){
            //self.ui(uiName);
        };

        // groups
        self.groups = ko.observableArray();
        self.newGroup = function(){
            var obj = {
                id: utils.newid(),
                type: utils.type_group_id,
                name:'group_' + Date.now()
            };
            obj.code = 'obj\n\t: type type_group_id\n\t: name "' + obj.name + '"';
            self.obj(obj);
        };

        // fns
        self.fns = ko.observableArray();
        self.newFn = function(){
            var fn = {
                id: utils.newid(),
                type: utils.type_fn_id,
                name:'fn_' + Date.now()
            };
            fn.code = 'fn ' + fn.name + ' ()\n\t';
            self.obj(fn);
            return true;
        };

        // scripts
        self.scripts = ko.observableArray();
        self.newScript = function(){
            var obj = {
                id: utils.newid(),
                type: utils.type_script_id,
                name:'script_' + Date.now()
            };
            obj.code = '; new script ';
            self.obj(obj);
        };

        // types
        self.types = ko.observableArray();
        self.newType = function(){
            var obj = {
                id: utils.newid(),
                type: utils.type_type_id,
                name:'type_' + Date.now()
            };
            //obj.code = 'type ' + obj.name + '\n\tfields\n\t\tfieldsName fieldType "default value"; <type>* means list, <type>? means optional';
            obj.code = 'obj type_type_id\n\t: fields <<\n\t\tobj(:name <name> <type> =<default> <desc>';
            self.obj(obj);
        };

        // members
        self.members = ko.observableArray();

        self.group = ko.observable();
        self.group.subscribe(function(newGroup){
            Cookies.set('group',newGroup);
            // get memebers
            utils.data_get({type:utils.type_groupMember_id}, function(rslts){
                if(rslts && rslts.err) return console.error(rslts);
                self.members(rslts);
            });
            // get groups
            utils.data_get({type:{$in:[utils.type_group_id, utils.type_user_id]}}, function(rslts){
                if(rslts && rslts.err) return console.error(rslts);
                self.groups(rslts);
            });
            // get fns
            utils.data_get({type:utils.type_fn_id}, function(rslts){
                if(rslts && rslts.err) return console.error(rslts);
                self.fns(rslts);
            });
            // get scripts
            utils.data_get({type:utils.type_script_id}, function(rslts){
                if(rslts && rslts.err) return console.error(rslts);
                self.scripts(rslts);
            });
            // get types
            utils.data_get({type:utils.type_type_id}, function(rslts){
                if(rslts && rslts.err) return console.error(rslts);
                self.types(rslts);
            });
        });

        utils.getByPath(window.location.href, function(obj){
            console.log(obj);
            if(obj.type != utils.type_group_id && obj.type != utils.type_user_id)
                self.obj(obj);

            if(window.location.pathname == '/'){
                self.group(utils.system_id);
            }
            else if(obj && (obj.group || obj.id)){
                if(obj.type == utils.type_group_id || obj.type == utils.type_user_id)
                    self.group(obj.id);
                else
                    self.group(obj.group);
            }
            else
                self.group(Cookies.get('group'));

            $(document).ready(function(){
                ko.applyBindings(self);
            });

        });
    }
);



