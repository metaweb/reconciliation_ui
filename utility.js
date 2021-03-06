// ========================================================================
// Copyright (c) 2008-2009, Metaweb Technologies, Inc.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY METAWEB TECHNOLOGIES AND CONTRIBUTORS
// ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL METAWEB
// TECHNOLOGIES OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
// BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS
// OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
// TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
// DAMAGE.
// ========================================================================

/*
**  Misc utility functions
*/

var entities;
var internalIDCounter;
function resetEntities() {
    entities = [];
    internalIDCounter = 0;
}
resetEntities();

function newEntity(initialVals) {
    var result = {"/rec_ui/id":internalIDCounter++}
    entities[result["/rec_ui/id"]] = result;
    for (var key in initialVals)
        result[key] = initialVals[key];
    return result;
}

//perform a shallow copy of a JS object
function clone(obj) {
    var copy = {};
    for (var i in obj)
        copy[i] = obj[i];
    return copy;
}

//constructs a DOM node
function node(kind) {
    var node = $(document.createElement(arguments[0]));
    var options = arguments[arguments.length-1]
    var len = arguments.length - 1;
    if (typeof options == "object" && options.insertAfter == undefined){
        if (options["onclick"] != undefined) {
            node.click(options["onclick"]);
            delete options["onclick"];
        }
        node.attr(options);
    }
    else
        len = arguments.length;
    
    for (var i = 1; i < len; i++)
        node.append(arguments[i]);
    return node;
}

function arrayDifference(source, toRemove) {
    source = $.makeArray(source); toRemove = $.makeArray(toRemove);
    var result = [];
    $.each(source, function(_,val){
        if (!contains(toRemove,val))
            result.push(val);
    })
    return result;
}

//Uniquely maps MQL ids to valid CSS class names
function idToClass(idName) {
    return idName.replace(/\//g,"_").replace(":","___");
}

//Is value in array?
function contains(array, value) {
    return $.inArray(value, array) !== -1;
}

function charIn(string, chr) {
    return string.indexOf(chr) !== -1;
}

function textValue(value) {
    if ($.isArray(value))
        return "[" + $.map(value, textValue).join(", ") + "]";
    if (value == undefined || value == null)
        return "";
    if (typeof value === "object"){
        var result = value['/type/object/name'];
        if ($.isArray(result)) result = result[0];
        return textValue(result);
    }
    return value;
}

function displayValue(value) {
    if ($.isArray(value)){
        var result = node("div");
        displayValues = $.map(value, displayValue);
        var overflowCutoff = 4;
        if (displayValues.length > overflowCutoff+1){
            for (var i = 0; i < overflowCutoff; i++)
                result.append(displayValues[i]).append("<br>");
            var overflowContainer = node("div", {"class":"overflowContainer"}).appendTo(result);
            for (var i = overflowCutoff; i < displayValues.length; i++)
                overflowContainer.append(displayValues[i]).append("<br>");
            var showMoreLink = node("a","More &darr;",{"class":"expandOverflow",onclick:function(){showMoreLink.slideUp();overflowContainer.slideDown();}}).appendTo(result);
        }
        else
            for (var i = 0; i < value.length; i++)
                result.append(displayValues[i]).append("<br>");
        return result;
    }
    if (value == undefined || value == null)
        return "";
    if (value.displayValue)
        return value.displayValue()
    if (value.id != undefined && value.id != "None"){
        if ($.isArray(value.name))
            return displayValue($.map($.makeArray(value.name),function(name){return {name:name,id:value.id};}));
        return freebase.link(value.name,value.id);
    }
    return textValue(value);
}

function addColumnRecCases(entity) {
    if (entity["/rec_ui/toplevel_entity"]) {
        var autoQueueLength = automaticQueue.length;
        for (var i = 0; i < mqlProps.length; i++) {
            var values = $.makeArray(getChainedProperty(entity,mqlProps[i]));
            for (var j = 0; j < values.length; j++) {
                if (values[j] && values[j]['/type/object/name'] != undefined){
                    if (!values[j].id)
                        automaticQueue.push(values[j]);
                    totalRecords++;
                }
            }
        }
        if (autoQueueLength == 0)
            beginAutoReconciliation();
    }
}

function isValueProperty(propName) {
    assert(mqlMetadata[propName], "mqlMetadata of " + propName + " is " + mqlMetadata[propName]);
    if (mqlMetadata[propName])
        return isValueType(mqlMetadata[propName].expected_type);
    return undefined;
}

function isValueType(type) {
    return contains(type['extends'], "/type/value");
}

//I can't believe I can't find a better way of doing these:
function getFirstValue(obj) {
    for (var key in obj)
        return obj[key];
    return undefined;
}

function getSecondValue(obj) {
    var i = 1;
    for (var key in obj){
        if (i > 1)
            return obj[key];
        i++;
    }
    return undefined;
}

function isObjectEmpty(obj) {
    for (var key in obj)
        return false;
    return true;
}

function numProperties(obj) {
    var i = 0;
    for (var key in obj)
        i++;
    return i;
}

/* Returns a copy of the array with those elements of that
  don't satisfy the predicate filtered out*/
function filter(array, predicate) {
    return $.grep(array, predicate);
}

/* Returns two new arrays, the first with those elements that satisfy the 
  predicate, the second with those that don't */
function partition(array, predicate) {
    var good = [];
    var bad = [];
    $.each(array, function(i, val) {
        if (predicate(val))
            good.push(val);
        else
            bad.push(val);
    });
    return [good,bad];
}

function all(array, predicate) {
    if (!predicate) predicate = identity;
    for (var i = 0; i < array.length; i++)
        if (!predicate(array[i]))
            return false;
    return true;
}

function any(array, predicate) {
    if (!predicate) predicate = identity;
    for (var i = 0; i < array.length; i++)
        if (predicate(array[i]))
            return true;
    return false;
}

function none(array, predicate) {
    return !any(array,predicate);
}

function identity(value) {return value;}

function getChainedProperty(entity, prop) {
    var slots = [entity];
    $.each(prop.split(":"), function(_,part) {
        var newSlots = [];
        $.each(slots, function(_,slot) {
            newSlots = newSlots.concat($.grep($.makeArray(slot[part]),identity))
        })
        slots = newSlots;
    });
    if (slots === []) return undefined;
    return slots;
}

function unique(array) {
    var lookup = {};
    var result = [];
    for (var i = 0; i < array.length; i++) {
        var val = array[i];
        if (lookup[val])
            continue;
        lookup[val] = true;
        result.push(val);
    }
    return result;
}

function concat(arrays) {
    var result = [];
    $.each(arrays, function(_,array) {
        result = result.concat(array);
    });
    return result;
}

function getMqlProperties(headers) {
    return filter(getProperties(headers), function(header) {
        return !header.match(/(^|:)id$/)
    });
}

function getProperties(headers) {
    return filter(headers, function(header) {
        if (header.charAt(0) !== "/")
            return false;
        var invalidList = ["/type/object/name","/type/object/type","/type/object/id"];
        for (var i = 0; i<invalidList.length; i++){
            if (header.match(invalidList[i]))
                return false;
        }
        return true;
    })
}

/*
** create debugging tools if they're not available
*/
function logger(log_level) {
    if (console[log_level])
        return function(message) {return console[log_level](message);};
    return function(message){/*node("div",JSON.stringify(message)).appendTo("#" + log_level + "Log");*/ return message;}
}

//These messages don't go anywhere at the moment, but it'd be very easy to create the
// places where they'd go
if (!window.console)
    var console = {};
var error  = logger("error");
var warn   = logger("warn" );
var log    = logger("log"  );
var info   = logger("info" );
var assert = function() {
    if (console.assert)
        return function(bool, message) {return console.assert(bool,message);};
    return function(bool,message){if (!bool) error(message)};
}()