ko.bindingHandlers.htmlLazy = {
    update: function (element, valueAccessor) {
        var value = ko.unwrap(valueAccessor());
        if(value === undefined || value === null) value = '';
        element.innerHTML = value;
        //if (!element.isContentEditable) {
        //    element.innerHTML = value;
        //}
    }
};
ko.bindingHandlers.contentEditable = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var value = ko.unwrap(valueAccessor()),
            htmlLazy = allBindingsAccessor().htmlLazy;

        $(element).on("input", function () {
            if (this.isContentEditable && ko.isWriteableObservable(htmlLazy)) {
                htmlLazy(this.innerHTML);
            }
        });
    },
    update: function (element, valueAccessor) {
        var value = ko.unwrap(valueAccessor());

        element.contentEditable = value;

        if (!element.isContentEditable) {
            $(element).trigger("input");
        }
    }
};
ko.bindingHandlers.inner = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var rslt = ko.unwrap(valueAccessor());
        if(!rslt.length) rslt = [rslt];
        _.each(rslt,function(c){
            if(c && c.ELEMENT_NODE)
                element.appendChild(c);
        });
    },
    update: function (element, valueAccessor) {
        var rslt = ko.unwrap(valueAccessor());
        if(!rslt.length) rslt = [rslt];
        element.innerHTML = '';
        _.each(rslt,function(c){
            if(c && c.ELEMENT_NODE)
                element.appendChild(c);
        });
    }
};