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

var entities = [];
var internalIDCounter = 0;
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
    return idName.replace(/\//g,"_");
}

//Is value in array?
function contains(array, value) {
    for(var i = 0; i < array.length; i++)
        if (array[i] == value)
            return true;
    return false;
}

function charIn(string, chr) {
    for(var i = 0; i < string.length; i++)
        if (string.charAt(i) === chr)
            return true;
    return false;
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
    if ($.isArray(value))
        return $.map(value, displayValue).join("<br/>");
    if (value == undefined || value == null)
        return "";
    if (value.id != undefined && value.id != "None")
        return freebaseLink(value.id, textValue(value["/type/object/name"]));
    return textValue(value);
}

function freebaseLink(id, text) {
    return "<a target='_blank' href='"+freebase_url+"/view"+id+"'>" + text + "</a>"
}

function addColumnRecCases(row) {
    if (! row["/rec_ui/column_val"]) {
        var autoQueueLength = automaticQueue.length;
        for (var i = 0; i < mqlProps.length; i++) {
            var values = $.makeArray(row[mqlProps[i]]);
            for (var j = 0; j < values.length; j++) {
                if (values[j]['/type/object/name'] != undefined){
                    automaticQueue.push(values[j]);
                    totalRecords++;
                }
            }
        }
        if (autoQueueLength == 0)
            beginAutoReconciliation();
    }
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
    return partition(array, predicate)[0];
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


/*
** create debugging tools if they're not available
*/


//These messages don't go anywhere at the moment, but it'd be very easy to create the
// places where they'd go
if (window.console == undefined)
    window.console = {
        assert  :function(bool,message){if (!bool) console.error(message)},
        error   :function(message){/*node("div",JSON.stringify(message)).appendTo("#errors");*/ return message;},
        warn    :function(message){/*node("div",JSON.stringify(message)).appendTo("#warnings");*/ return message;},
        log     :function(message){/*node("div",JSON.stringify(message)).appendTo("#log");*/ return message;}        
    };