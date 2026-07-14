var providersInfo, providerSetsInfo, componentsInfo, componentSetsInfo, interfacesInfo;

var license;

function fillinterfacesInfo() {
    if (isNullOrUndefined(interfacesInfo)) {
        interfacesInfo = sendRequestWithResponse("GET", getRootUrl() + "interfaces" + ".rjson", null);
    }
}

function getMultiworkerCount() {
    var response = sendRequestWithResponse("GET", getIServerUrl() + "/manager/multiworkers/infos.json", null);
    if(response != null) {
        return response.length;
    } else{
        return 0;
    }
}

function addInterfaceInfo(toAddInterfaceInfo) {
    fillinterfacesInfo();
    if (toAddInterfaceInfo != null) {
        interfacesInfo.push(toAddInterfaceInfo);
    }
}

function fillprovidersInfo() {
    if (isNullOrUndefined(providersInfo)) {
        providersInfo = sendRequestWithResponse("GET", getRootUrl() + "providers" + ".rjson", null);
    }
}

$(document)
    .ready(function () {
        license = sendRequestWithResponse("GET", getRootUrl() + "license" + ".rjson", null);
    });

function isExpressVersion() {
    var productInfo = sendRequestWithResponse("GET", getRootUrl() + "productInfo.json", null);
    if (isNotNullAndUndefined(productInfo) && productInfo !== "" && productInfo.name === "iEdge") {
        return true;
    }
    return false;
}

function isEnterpriseVersion() {
    return license.iServerEnterprise ? true : LicenseCheckMsg.EnterpriseExpected;
}

function fillInfos() {
    if (isNullOrUndefined(interfacesInfo)) {
        interfacesInfo = sendRequestWithResponse("GET", getRootUrl() + "interfaces" + ".rjson", null);
    }

    if (isNullOrUndefined(providersInfo)) {
        providersInfo = sendRequestWithResponse("GET", getRootUrl() + "providers" + ".rjson", null);
    }

    if (isNullOrUndefined(componentsInfo)) {
        componentsInfo = sendRequestWithResponse("GET", getRootUrl() + "components" + ".rjson", null);
    }

    if (isNullOrUndefined(providerSetsInfo)) {
        providerSetsInfo = sendRequestWithResponse("GET", getRootUrl() + "providerSets" + ".rjson", null);
    }

    if (isNullOrUndefined(componentSetsInfo)) {
        componentSetsInfo = sendRequestWithResponse("GET", getRootUrl() + "componentSets" + ".rjson", null);
    }
}
/*
 * 是否为有效的url格式，但不保证地址可访问
 */
function isURL(url) {
    var strRegex = "^((https|http|ftp|rtsp|mms)?://)"
        + "(([\wZ_!~*'().&=+$%-]+: )?[\w!~*'().&=+$%-]+@)?" //ftp的user@
        + "(([0-9]{1,3}.){3}[0-9]{1,3}" // IP形式的URL- 127.0.0.1
        + "|" // 允许IP和DOMAIN（域名）
        + "([0-9a-zA-Z_!~*'()-]+.)*" // 域名- www.
        + "([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]." // 二级域名
        + "[a-zA-Z]{2,6})" // first level domain- .com or .museum
        + "(:[0-9]{1,4})?" // 端口- :80
        + "((/?)|" // a slash isn't required if there is no file name
        + "(/[0-9a-zA-Z_\u4e00-\u9fa5_\uac00-\ud7ff!~*'().;?:@&=+$,%#-]+)+/?)$";
    var regExp = new RegExp(strRegex);
    return regExp.test(url);
}
// 用来获得管理服务根路径，例http://localhost:8999/iserver/manager/
function getRootUrl() {
    var
        rootUrl = "",
        regExp = /\/apps|\/web|\/manager|\/services/i,//该正则用于取出contextPath
        href = window.location.href,
        index = href.search(regExp);

    rootUrl += href.indexOf("https") === 0 ? "https://" : "http://";
    rootUrl += window.location.host;
    if (typeof contextPath !== "undefined" && contextPath !== "") {//该逻辑用于判断创建管理员帐号，该页面配置了contextPath
        rootUrl += contextPath + "/manager/";
    } else {
        if (rootUrl === href || (rootUrl + "/") === href) {//没有配置上下文,以"/"结尾或者没有"/"
            rootUrl += "/manager/";
        } else if (index > 0) {//配置了上下文，iportal/iserver/iEdge/自定义，根据目前产品中可能的情况下截取上下文,正则匹配的情况可能不全
            rootUrl += href.substring(rootUrl.length, index) + "/manager/";//非首页
        }
    }

    return rootUrl;
}

function getIServerUrl() {
    var
        rootUrl = "",
        regExp = /\/apps|\/web|\/manager|\/services/i,//该正则用于取出contextPath
        href = window.location.href,
        index = href.search(regExp);

    rootUrl += href.indexOf("https") === 0 ? "https://" : "http://";
    rootUrl += window.location.host;
    if (typeof contextPath !== "undefined" && contextPath !== "") {//该逻辑用于判断创建管理员帐号，该页面配置了contextPath
        rootUrl += contextPath;
    } else if (index > 0) {//配置了上下文，iportal/iserver/iEdge/自定义，根据目前产品中可能的情况下截取上下文,正则匹配的情况可能不全
        rootUrl += href.substring(rootUrl.length, index);
    }

    return rootUrl;
}

// 用来获得服务根路径，例http://localhost:8999/iserver/services/
function getServiceRootUrl() {
    var
        rootUrl = "",
        regExp = /\/apps|\/web|\/manager|\/services/i,//该正则用于取出contextPath
        href = window.location.href,
        index = href.search(regExp);

    rootUrl += href.indexOf("https") === 0 ? "https://" : "http://";
    rootUrl += window.location.host;
    if (typeof contextPath !== "undefined" && contextPath !== "") {//该逻辑用于判断创建管理员帐号，该页面配置了contextPath
        rootUrl += contextPath;
    } else if (index > 0) {//配置了上下文，iportal/iserver/iEdge/自定义，根据目前产品中可能的情况下截取上下文,正则匹配的情况可能不全
        rootUrl += href.substring(rootUrl.length, index) + "/services/";
    }

    return rootUrl;
}
/*
 * IE8不支持字符串的trim()方法
 */
if (String.prototype.trim === undefined) {
    String.prototype.trim = function () {
        return this.replace(/(^\s*)|(\s*$)/g, "");
    };
}
/****
 * alert 弹出框类型
 *
 * 参数
 * tip: 标题
 * message：描述信息
 * status： 状态（success、info、warning、danger）,该参数为空时默认为info
 * isSetTimeout: 在默认的时间内(5秒钟)弹出框自动消失.
 */
function popupAlert(tip, message, status, isSetTimeout) {
    $(".alert.alert-dismissable").remove();

    if (isSetTimeout === undefined) {
        isSetTimeout = true;
    }
    if (isSetTimeout === true) {
        var timeoutId = window.setTimeout(function () {
            window.clearTimeout(timeoutId);
            $(".alert.alert-dismissable").remove();
        }, 5000);
    }

    var html;
    if (status === "warning") {
        html = '<div class="alert alert-warning alert-dismissable alert-popup">' +
            '<button type="button" class="close" data-dismiss="alert" data-hidden="true">&times;</button>' +
            '<strong>' + tip + '</strong>' + message +
            '</div>'
    } else if (status === "danger") {
        html = '<div class="alert alert-danger alert-dismissable alert-popup">' +
            '<button type="button" class="close" data-dismiss="alert" data-hidden="true">&times;</button>' +
            '<strong>' + tip + '</strong>' + message +
            '</div>'
    } else if (status === "success") {
        html = '<div class="alert alert-success alert-dismissable alert-popup">' +
            '<button type="button" class="close" data-dismiss="alert" data-hidden="true">&times;</button>' +
            '<strong>' + tip + '</strong>' + message +
            '</div>'
    } else {
        html = '<div class="alert alert-info alert-dismissable alert-popup">' +
            '<button type="button" class="close" data-dismiss="alert" data-hidden="true">&times;</button>' +
            '<strong>' + tip + '</strong>' + message +
            '</div>'
    }
    $("body").append($(html));
}
//bootstrap的modal确认提示对话框
var BootstrapDialog = BootstrapDialog || {};
BootstrapDialog.confirm = function (title, msg, onOKClick, onCancelClick) {
    var titleName = title ? title : utilityRes.confirmTitle;
    var html;
    msg = msg ? msg : "";
    if (!BootstrapDialog.confirmInited) {
        BootstrapDialog.confirmInited = true;
        html = '<div class="modal fade" tabindex="-1" id="SuperMap_BootstrapDialog_confirm" role="dialog" aria-hidden="false">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">x</button>' +
            '<span id="SuperMap_BootstrapDialog_Title">' + titleName + '</span>' +
            '</div>' +
            '<div class="modal-body"><span id="SuperMap_BootstrapDialog_Msg">' + msg + '</span></div>' +
            '<div class="modal-footer">' +
            '<button type="button" id="SuperMap_BootstrapDialog_OK" class="btn btn-primary" data-dismiss="modal">' + utilityRes.confirmOK + '</button>' +
            '<button type="button" id="SuperMap_BootstrapDialog_Cancel" class="btn btn-default" data-dismiss="modal">' + utilityRes.confirmCancel + '</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        $("body").append(html);
    }
    if (BootstrapDialog.confirmInited) {
        $("#SuperMap_BootstrapDialog_Title").html(titleName);
        $("#SuperMap_BootstrapDialog_Msg").html(msg);
    }
    $("#SuperMap_BootstrapDialog_OK").off("click").on("click", function () {
        onOKClick && onOKClick();
    });
    $("#SuperMap_BootstrapDialog_Cancel").off("click").on("click", function () {
        $("#SuperMap_BootstrapDialog_confirm").modal("hide");
        onCancelClick && onCancelClick();
    });
    $("#SuperMap_BootstrapDialog_confirm").modal("show");
};
// 获取contextPath
function getContextPath() {
    var
        rootUrl = "",
        regExp = /\/apps|\/web|\/manager|\/services/i,//该正则用于取出contextPath
        href = window.location.href,
        index = href.search(regExp), contextPath;

    rootUrl += href.indexOf("https") === 0 ? "https://" : "http://";
    rootUrl += window.location.host;
    if (rootUrl === href || (rootUrl + "/") === href) {//没有配置上下文,以"/"结尾或者没有"/"
        contextPath = "";
    } else if (index > 0) {//配置了上下文，iportal/iserver/iEdge/自定义，根据目前产品中可能的情况下截取上下文,正则匹配的情况可能不全
        contextPath = href.substring(rootUrl.length, index);
    } else {//iportal首页
        if (!(/\/$/.test(href))) {
            href += "/";
        }
        contextPath = href;
    }
    return contextPath;
}

function getXMLHttpRequest() {
    // / <summary>获取HTTPRequest对象。</summary>
    // / <returns type="Object">返回一个HTTPRequest对象。</returns>
    var xh = null;
    try {
        xh = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (ex) {
        try {
            xh = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (ex) {
            xh = null;
        }
    }
    if (!xh && typeof XMLHttpRequest !== "undefined") {
        xh = new XMLHttpRequest();
    }

    return xh;

}

// 返回一个String Array是否包含一个特定的String对象
function contains(strArray, str) {
    var flag = false;
    for (var i = 0; i < strArray.length; i++) {
        if (strArray[i] === str) {
            flag = true;
            break;
        }
    }
    return flag;
}

var SuperMapServer = SuperMapServer ? SuperMapServer : {};
SuperMapServer.Manager = SuperMapServer.Manager ? SuperMapServer.Manager : {};
SuperMapServer.Manager.Security = SuperMapServer.Manager.Security ? SuperMapServer.Manager.Security : {};
SuperMapServer.Util = SuperMapServer.Util ? SuperMapServer.Util : {};
SuperMapServer.Util.getServiceType = function (serviceType) {
    switch (serviceType) {
        case "Map" :
            return serviceTypeRes.Map;
            break;
        case "VectorTile" :
            return serviceTypeRes.VectorTile;
            break;
        case "Data" :
            return serviceTypeRes.Data;
            break;
        case "Realspace" :
            return serviceTypeRes.Realspace;
            break;
        case "SpatialAnalyst" :
            return serviceTypeRes.SpatialAnalyst;
            break;
        case "TrafficTransferAnalyst" :
            return serviceTypeRes.TrafficTransferAnalyst;
            break;
        case "TransportationAnalyst" :
            return serviceTypeRes.TransportationAnalyst;
            break;
        case "GeoprocessorComponent" :
            return serviceTypeRes.GeoprocessorComponent;
            break;
        case "componentSetType" :
            return serviceTypeRes.ComponentSetType;
            break;
        case "AddressMatch" :
            return serviceTypeRes.AddressMatch;
            break;
        case "DataFlow" :
            return serviceTypeRes.DataFlow;
            break;
        case "NetworkAnalys3D" :
            return serviceTypeExtendRes.NetworkAnalys3D;
            break;
        case "Plot" :
            return serviceTypeExtendRes.Plot;
            break;
        case "Geoprocessing" :
            return serviceTypeRes.Geoprocessing;
            break;
        default :
            return serviceTypeRes.Unknown;
    }
};

// 粗粒度的向服务器发送请求方法
// method为请求方法
// uri为请求地址
// entry为请求体内容 ,javascript对象
function sendRequest(method, uri, entry) {
    var commit = getXMLHttpRequest();
    // uri = convertUrl(uri);
    commit.open(method, encodeURI(uri), false, "", "");
    commit.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    // 设置PUT请求的参数
    var entity = null;
    if (entry != null) {
        if (entry.constructor != String) {
            entity = toJSON(entry);
        } else {
            entity = entry;
        }
    }
    commit.send(entity);

    var response = json_parse(commit.responseText, null);
    if (isNullOrUndefined(response) && commit.responseText.indexOf('isISERVERLOGINPAGE') != -1) {
        window.location.reload();
        return response;
    }
    if (response.succeed) {
    } else {
        var errorMsg = response.error.errorMsg;
        SuperMapServer.Dialog.alert(utilityRes.error,xSSFilter(utilityRes.failureReason + errorMsg));
    }
    return response.succeed;
}

//给url地址增加时间戳,防止浏览器使用缓存
function convertUrl(oldUrl) {
    var timstamp = new Date().getTime();
    if (oldUrl.indexOf("?") >= 0) {
        return (oldUrl + "&_t=" + timstamp);
    } else {
        return (oldUrl + "?_t=" + timstamp);
    }
}


// 将一个Object对象转换为JSON字符串
function toJSON(o) {
    // / <summary>将对象转换成JSON字符串</summary>
    // / <param name="o" type="Object">要转换成JSON的Object对象。</param>
    // / <returns type="Object">返回转换后的JSON对象。</returns>
    if (isNullOrUndefined(o))
        return "null";

    switch (o.constructor) {
        case String :
            var s = o; // .encodeURI();
            s = '"' + s.replace(/(["\\])/g, '\\$1') + '"';
            s = s.replace(/\n/g, "\\n");
            s = s.replace(/\r/g, "\\r");
            // s = s.replace(/</g, "&lt;");
            // s = s.replace(/>/g, "&gt;");
            // s = s.replace(/%/g, "%25");
            // s = s.replace(/&/g, "%26");
            return s;
        case Array :
            var v = [];
            for (var i = 0; i < o.length; i++)
                v.push(toJSON(o[i]));
            return "[" + v.join(", ") + "]";
        case Number :
            return isFinite(o) ? o.toString() : toJSON(null);
        case Boolean :
            return o.toString();
        case Date :
            var d = {};
            d.__type = "System.DateTime";
            d.Year = o.getUTCFullYear();
            d.Month = o.getUTCMonth() + 1;
            d.Day = o.getUTCDate();
            d.Hour = o.getUTCHours();
            d.Minute = o.getUTCMinutes();
            d.Second = o.getUTCSeconds();
            d.Millisecond = o.getUTCMilliseconds();
            d.TimezoneOffset = o.getTimezoneOffset();
            return toJSON(d);
        default :
            if (o["toJSON"] != null && typeof o["toJSON"] === "function")
                return o.toJSON();
            var objval = toJsonDefaultStr(o);
            if(objval){
                return objval;
            }
            return o.toString();
    }
}

function toJsonDefaultStr(o){
    if (typeof o === "object") {
        if (o.length) {
            var v = [];
            for (var i = 0; i < o.length; i++)
                v.push(toJSON(o[i]));
            return "[" + v.join(", ") + "]";
        }
        var v = [];
        for (var attr in o) {
            if (typeof o[attr] != "function")
                v.push('"' + attr + '":' + toJSON(o[attr]));
        }

        if (v.length > 0)
            return "{" + v.join(", ") + "}";
        else
            return "{}";
    }
}


// 粗粒度的向服务器发送请求方法,不弹出对话框，返回响应体
function sendRequestWithResponse(method, uri, entry) {
    // var commit = new XMLHttpRequest();
    var commit = getXMLHttpRequest();
    // uri = convertUrl(uri);
    commit.open(method, encodeURI(uri), false, "", "");
    commit.setRequestHeader("Content-Type",
        "application/x-www-form-urlencoded; charset=UTF-8");
    // 设置PUT请求的参数
    var entity = null;
    if (entry != null) {
        entity = toJSON(entry);
    }
    commit.send(entity);

    var response;
    try {
        response = json_parse(commit.responseText, null);
    } catch (error) {
        //json语法错误，原因是服务端还没有创建管理员账户或正在初始化
        response = {"errorMsg": "the server has not be initialized"};
    }

    if (response && response.errorMsg) {
        if (!response.error) {
            var error = {};
            error.errorMsg = response.errorMsg;
            response.error = error;
        }
    }

    if ((isNullOrUndefined(response)) && commit.responseText.indexOf('isISERVERLOGINPAGE') != -1) {
        window.location.reload();
        return response;
    }
    return response;
}

function selectItemInDropdownBoxByValue(boxId, value) {
    if (value) {
        var box = $("#" + boxId)[0];
        for (var j = 0; j < box.options.length; j++) {
            if (box.options[j].value === value) {
                box.options[j].selected = true;
                return true;
            }
        }
    }
    return false;
}

// 得到不含后缀的当前Url
function getPureUri(uri) {
    // 如果uri是以"/"结束的，需要将"/"去掉，否则会模板不匹配
    if (uri.lastIndexOf("/") === (uri.length - 1)) {
        uri = uri.substring(0, uri.length - 1);
    }
    uri = decodeURIComponent(uri);
    // 以 '#' 结尾，需要将'#'去掉。
    if (uri.lastIndexOf('#') === (uri.length - 1)) {
        uri = uri.substring(0, uri.length - 1);
    }
    var pos = uri.lastIndexOf('.');
    if (pos < 0) {
        return uri;
    }

    if (pos != -1) {
        var newUri;
        var strs = uri.split('.');
        var type = strs[strs.length - 1];
        if (type === "html" || type === "xml" || type === "json"
            || type === "rjson") {
            newUri = uri.substring(0, pos);
        } else {
            newUri = uri;
        }
        return newUri;
    }
}

// 从url地址获取指定url参数 eg:var str = "localhost:8090/iserver?ID=123";
// str.GetURLParam("ID")就是123。
String.prototype.GetURLParam = function (para) {
    var reg = new RegExp("(^|&)" + para + "=([^&]*)(&|$)");
    var r = this.substr(this.indexOf("\?") + 1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
};

function isPositiveInteger(s) {
    var number = Number(s);
    var ckeck =/^\d*$/;
    if(number > 0 && ckeck.test(s)) {
        return true;
    }
    return false;
}

function isInteger(s) {
    return /^-?\d+$/.test(s);
}

function isNumber(s) {
    var flag = /^-?\d+$/.test(s) || /^-?\d+.\d+$/.test(s) || /^-?\d+.\d+E-?\d+$/.test(s);
    if (flag && s.indexOf('/') === -1) {
        return true;
    }
    return false;
}

function isColor(s) {
    return /^[A-Fa-f0-9]{6}$/.test(s);
}

// 针对FireFox浏览器，实现表格中行颜色交替的样式
// tableID为表格ID
function setTableStyle(tableID) {
    $("#" + tableID + " tr:odd").css("background-color", "#FFFFFF");
    $("#" + tableID + " tr:even").css("background-color", "#E3E9EF");
    $("#" + tableID + " thead tr").css("background-color", "#4B4B4A");
}

function setTableTitleStyle(tableID) {
    $("#" + tableID + " thead tr").css("background-color", "#4B4B4A");
}

// 得到的字符串实际是个数组，需要转换为真正的字符串
function stringConvertToArray(strArray) {
    var newArray = [];
    if (strArray != "") {
        var tempString = strArray.substring(1, strArray.length - 1);
        var subArray = tempString.split(",");
        for (var m = 0; m < subArray.length; m++) {
            newArray.push(subArray[m].substring(1, subArray[m].length - 1));
        }
    }
    return newArray;
}
//配置文件里面是字符串，逗号分隔的情况，如：a,b,c
function stringToArray(strArray) {
    return strArray  && typeof strArray === "string" ? strArray.split(","):[];
}

// 把表格中的类型英文名影射为中文
function typeMapping(tableID) {
    var record = $("#" + tableID + " tbody tr");
    for (var i = 0; i < record.length; i++) {
        var typeRec = record.eq(i).children().eq(1);
        var typeName = typeRec.text();
        typeName = $.trim(typeName);
        if (enToZh(typeName) != null) {
            typeRec.html(enToZh(typeName));
        } else {
            typeRec.html(typeName);
        }

    }
}

// 勾选一组checkbox
function checkAll(checkSelector, groupSelector) {
    $(checkSelector).click(function () {
        $(groupSelector).prop('checked', $(this).prop('checked'));
    })
}

// 判断一个的类型是否是自定义类型,可以是英文类型也可以是中文类型
function isCustomType(type) {
    if ((isNullOrUndefined(zhToEn(type))) && (isNullOrUndefined(enToZh(type)))) {
        return true;
    } else {
        return false;
    }
}

// 参数验证，如果必填参数有一个为NULL，则提示哪个字段为NULL
function checkParam(container, toCheckNotVisableEle) {
    var valElems = $(container + " .necessary").parent().next();
    for (var i = 0; i < valElems.length; i++) {
        // 如果是Table内容，暂时不验证
        if (!(valElems.eq(i).is("input") || valElems.eq(i).is("select"))) {
            continue;
        }
        var pMsg = null;
        var curId = valElems.eq(i).attr("id");
        var isFilledCheckBox = document.getElementById(curId.substring(0, curId.lastIndexOf('_')) + "-isFilled");
        var isFilled = isNullOrUndefined(isFilledCheckBox) ? false : isFilledCheckBox.checked;
        if (isFilledCheckBox) {
            var text = valElems.eq(i).parent().parent().prev().prev().children().text();
            pMsg = removeEnd(text);
            if (!isFilled) {
                continue;
            }
        }
        //有些隐藏的元素，虽然是.necessary标识的， 但是应该只属性某子逻辑需要的。所以隐藏的元素不应该验证。
        if (toCheckNotVisableEle === false) {
            if (!valElems.eq(i).is(":visible")) {
                continue;
            }
        }
        // document.getElementById(valElems.eq(i).attr("id").substring(0,valElems.eq(i).attr("id").lastIndexOf('_'))+"-isFilled").checked
        if (valElems.eq(i).val() === "" || $.trim(valElems.eq(i).val()) === "") {
            var text = valElems.eq(i).prev().text();
            var pos = text.length - 2;
            var msg = removeEnd(text) + utilityRes.necessary;
            msg = getMsg(pMsg,msg,utilityRes);
            SuperMapServer.Dialog.alert(msg);
            return false;
        }
    }
    return true;
}

function getMsg(pMsg,msg,utilityRes){
    var message;
    if (pMsg != null) {
        message = pMsg + "/" + msg + utilityRes.dontWannaSet + pMsg + utilityRes.dontSelect + pMsg;   // +
        // "。";
        // 国际化的时候注释掉的
    }else{
        message = msg;
    }
    return message;
}

function removeEnd(text) {
    var pos = text.length - 2;
    return text.slice(0, pos);

}

// 验证文件是否存在或URI地址是否可用等.
function validate(type, value) {
    var uri = getRootUrl() + "validation.json";
    var entry = {};
    entry.type = type;
    entry.value = value;
    var response = sendRequestWithResponse("POST", uri, entry);
    // SuperMapServer.Dialog.alert(toJSON(response));
    return response.succeed;
}

// 根据后缀验证一个文件是否为工作空间文件
function isWorkspace(filePath) {
    if (!validate("FILE", filePath)) {
       // SuperMapServer.Dialog.alert(utilityRes.workspace + filePath + utilityRes.notExist);
        return false;
    }
    var dotIndex = filePath.lastIndexOf('.');
    var houzhui = filePath.substring(dotIndex + 1, filePath.length);
    if (houzhui === "smw" || houzhui === "smwu" || houzhui === "sxwu" || houzhui === "sxw") {
        return true;
    } else {
        SuperMapServer.Dialog.alert(utilityRes.selectSuchTypeWorkspace);
        return false;
    }
}
function isSMTiles(filePath, mbtiles) {
    if (!validate("FILE", filePath)) {
        SuperMapServer.Dialog.alert(utilityRes.file + filePath + utilityRes.notExist);
        return false;
    }
    var dotIndex = filePath.lastIndexOf('.');
    var houzhui = filePath.substring(dotIndex + 1, filePath.length);
    if (mbtiles) {
        return true;
    }
    if (houzhui === "smtiles" || houzhui === "mbtiles") {
        return true;
    } else {
        SuperMapServer.Dialog.alert(utilityRes.selectSuchTypeSMTiles);
        return false;
    }
}
function isTPK(filePath) {
    if (!validate("FILE", filePath)) {
        SuperMapServer.Dialog.alert(utilityRes.file + filePath + utilityRes.notExist);
        return false;
    }
    var dotIndex = filePath.lastIndexOf('.');
    var houzhui = filePath.substring(dotIndex + 1, filePath.length);
    if (houzhui === "tpk") {
        return true;
    } else {
        SuperMapServer.Dialog.alert(utilityRes.selectSuchTypeTPK);
        return false;
    }
}

function isXMLorCDI(filePath) {
    if (!validate("FILE", filePath)) {
        SuperMapServer.Dialog.alert(utilityRes.file + filePath + utilityRes.notExist);
        return false;
    }
    var dotIndex = filePath.lastIndexOf('.');
    var houzhui = filePath.substring(dotIndex + 1, filePath.length);
    if (houzhui === "xml" || houzhui === "cdi") {
        return true;
    } else {
        SuperMapServer.Dialog.alert(utilityRes.selectSuchTypeXMLOrCDI);
        return false;
    }
}

function isSCP(filePath) {
    if (!validate("FILE", filePath)) {
        SuperMapServer.Dialog.alert(utilityRes.file + filePath + utilityRes.notExist);
        return false;
    }
    var dotIndex = filePath.lastIndexOf('.');
    var houzhui = filePath.substring(dotIndex + 1, filePath.length);
    if (houzhui === "scp" || houzhui == "sct" || houzhui == "sci3d") {
        return true;
    } else {
        SuperMapServer.Dialog.alert(utilityRes.selectSuchTypeSCP);
        return false;
    }
}

function isVTPK(filePath) {
    if (!validate("FILE", filePath)) {
        SuperMapServer.Dialog.alert(utilityRes.file + filePath + utilityRes.notExist);
        return false;
    }
    var dotIndex = filePath.lastIndexOf('.');
    var houzhui = filePath.substring(dotIndex + 1, filePath.length);
    if (houzhui === "vtpk") {
        return true;
    } else {
        SuperMapServer.Dialog.alert(utilityRes.selectSuchTypeVTPK);
        return false;
    }
}

// 根据一个文件的全路径名获得文件的带后缀文件名
function getFileName(filePath) {
    var index1 = filePath.lastIndexOf('\\');
    var index2 = filePath.lastIndexOf('/');
    var index = index1;
    if (index2 > index1) {
        index = index2;
    }
    var fileName = filePath.substring(index + 1, filePath.length);
    return fileName;
}

//获取文件的目录
function getFileDir(filePath) {
    var index = filePath.lastIndexOf("/");
    if (index < 0) {
        index = filePath.lastIndexOf("\\");
    }
    if (index > 0) {
        return filePath.substring(0, index);
    }
    return filePath;
}
//获取文件的目录
function getParentDirName(filePath) {
    var index = filePath.lastIndexOf("/");
    if (index < 0) {
        index = filePath.lastIndexOf("\\");
    }
    if (index > 0) {
      return getDirectoryName(filePath.substring(0, index));

    }
    return filePath;
}
// 得到不带文件后缀的纯文件名
function getFileNameWithoutSuffix(filePath) {
    var index1 = filePath.lastIndexOf('\\');
    var index2 = filePath.lastIndexOf('/');
    var index = index1;
    if (index2 > index1) {
        index = index2;
    }
    var fileName = filePath.substring(index + 1, filePath.length);
    var dotIndex = fileName.lastIndexOf('.');
    fileName = fileName.substring(0, dotIndex);
    return fileName;
}

//得到目录名
function getDirectoryName(filePath) {
    var index1 = filePath.lastIndexOf('\\');
    var index2 = filePath.lastIndexOf('/');
    var index = index1;
    if (index2 > index1) {
        index = index2;
    }
    var fileName = filePath.substring(index + 1, filePath.length);
    return fileName;
}

// 获得文件后缀
function getFileSuffix(filePath) {
    var index1 = filePath.lastIndexOf('\\');
    var index2 = filePath.lastIndexOf('/');
    var index = index1;
    if (index2 > index1) {
        index = index2;
    }
    var fileName = filePath.substring(index + 1, filePath.length);
    var dotIndex = fileName.lastIndexOf('.');
    var suffix = fileName.substring(dotIndex + 1, fileName.length);
    return suffix;
}

// 从所有服务提供者中选择与组件类型相匹配的提供者
// type是中文表示的服务组件类型，地图服务，数据服务，真空间服务，交通网络分析服务
// msg是通过GET方法获得的Providers的响应体
function getMatchProviders(type, msg) {
    var matchProviders = [];
    if (type === utilityRes.dataComponents || type === utilityRes.dataService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if ($.inArray(zhType, DataProviders) >= 0) {
                matchProviders.push(msg[i]);
            }
        }
    } else if (type === utilityRes.realspaceComponents || type === utilityRes.realspaceService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if ([utilityRes.RESTRealspaceProvider, utilityRes.localRealspaceProvider, utilityRes.OssRealspaceProvider, utilityRes.SuperMapTilesRealspaceProvider, providersRes.providerTypeMongoDBRealspace, providersRes.providerTypeLocal3DCache].contains(zhType)) {
                matchProviders.push(msg[i]);
            }
        }
    } else if (type === utilityRes.transportationanalystComponent || type === utilityRes.transportationanalystService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === utilityRes.transportationanalystProvider || zhType === utilityRes.RESTTransportationAnalystProvider || zhType == utilityRes.ArcGISRestNetworkProvider) {
                matchProviders.push(msg[i]);
            }
        }
    } else if (type === utilityRes.traffictransferanalystComponent || type === utilityRes.traffictransferanalystService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === utilityRes.traffictransferanalystProvider || zhType === utilityRes.RESTTrafficTransferAnalystProvider) {
                matchProviders.push(msg[i]);
            }
        }
    } else if (type == utilityRes.spatialanalystComponent || type == utilityRes.spatialanalystService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === utilityRes.spatialanalystProvider || zhType === utilityRes.RESTSpatialAnalystProvider) {
                matchProviders.push(msg[i]);
            }
        }
    }
    else if (type === utilityRes.mapComponent || type === utilityRes.mapService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (MapProviders.contains(zhType)) {
                matchProviders.push(msg[i]);
            }
        }
    } else if (type === utilityRes.networkAnalyst3DComponent) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === providersRes.providerTypeUGCNetworkAnalyst3DProvider) {
                matchProviders.push(msg[i]);
            }
        }
    } else if(type === utilityRes.addressMatchComponent || type === utilityRes.addressMatchService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === utilityRes.addressMatchProvider||zhType === utilityRes.RESTAddressMatchProvider || zhType === utilityRes.ArcGISRestGeocodeProvider) {
                matchProviders.push(msg[i]);
            }
        }
    } else if(type === utilityRes.geometryServiceComponent || type === utilityRes.geometryService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === utilityRes.geometryServiceProvider || zhType === utilityRes.RESTGeometryServiceProvider) {
                matchProviders.push(msg[i]);
            }
        }
    } else if(type === utilityRes.PlotComponent || type === utilityRes.PlotService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === utilityRes.UGCPlotProvider || zhType === utilityRes.RESTPlotProvider) {
                matchProviders.push(msg[i]);
            }
        }
    } else if(type === utilityRes.GeoprocessingServer) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === utilityRes.GeoprocessingProviderImpl) {
                matchProviders.push(msg[i]);
            }
        }
    }
    else {
        for (var i = 0; i < msg.length; i++) {
            matchProviders.push(msg[i]);
        }
    }
    return matchProviders;
}

// 从所有的服务提供者集合中选择与组件类型相匹配的提供者集合
// type是中文表示的服务组件类型，地图服务，数据服务，真空间服务
// msg是通过GET方法获得的ProviderSets的响应体
function getMatchProviderSets(type, msg) {
    var matchProviderSets = [];
    // 根据服务提供者集合中第一个服务提供者的类型判断集合的类型
    var firstProviderSet;
// if (type == "数据服务组件" || type == "数据服务") {
// for (var i = 0; i < msg.length; i++) {
// if (msg[i].settings.length > 0) {
// if(!isPureProviderSet(msg[i]))
// {
// continue;
// }
// firstProviderSet = msg[i].settings[0];
// var zhType = enToZh(firstProviderSet.type);
// if (zhType == "本地数据服务提供者" || zhType == "WFS数据服务提供者" || zhType ==
// "REST数据服务提供者") {
// matchProviderSets.push(msg[i]);
// }
// }
// }
// } else if (type == "真空间服务组件" || type == "真空间服务") {
// for (var i = 0; i < msg.length; i++) {
// if (msg[i].settings.length > 0) {
// if(!isPureProviderSet(msg[i]))
// {
// continue;
// }
// firstProviderSet = msg[i].settings[0];
// var zhType = enToZh(firstProviderSet.type);
// if (zhType == "本地真空间服务提供者") {
// matchProviderSets.push(msg[i]);
// }
// }
// }
// }else if(type=="交通网络分析服务组件" || type == "交通网络分析服务"){
// for (var i = 0; i < msg.length; i++) {
// if (msg[i].settings.length > 0) {
// if(!isPureProviderSet(msg[i]))
// {
// continue;
// }
// firstProviderSet = msg[i].settings[0];
// var zhType = enToZh(firstProviderSet.type);
// if (zhType == "交通网络分析服务提供者") {
// matchProviderSets.push(msg[i]);
// }
// }
// }
// }
// else if(type=="空间分析服务组件" || type == "空间分析服务"){
// for (var i = 0; i < msg.length; i++) {
// if (msg[i].settings.length > 0) {
// if(!isPureProviderSet(msg[i]))
// {
// continue;
// }
// firstProviderSet = msg[i].settings[0];
// var zhType = enToZh(firstProviderSet.type);
// if (zhType == "空间分析服务提供者") {
// matchProviderSets.push(msg[i]);
// }
// }
// }
// }
// else if(type=="地图服务组件" || type == "地图服务"){
// for (var i = 0; i < msg.length; i++) {
// if (msg[i].settings.length > 0) {
// if(!isPureProviderSet(msg[i]))
// {
// continue;
// }
// firstProviderSet = msg[i].settings[0];
// var zhType = enToZh(firstProviderSet.type);
// if (zhType == "本地地图服务提供者" || zhType == "WMS地图服务提供者" || zhType ==
// "REST地图服务提供者"
// || zhType == "聚合地图服务提供者" || zhType == "集群地图服务提供者") {
// matchProviderSets.push(msg[i]);
// }
// }
// }
// }
// else{
// for (var i = 0; i < msg.length; i++) {
// if (msg[i].settings.length > 0) {
// matchProviderSets.push(msg[i]);
// }
// }
// }

    if (type === utilityRes.dataComponents || type === utilityRes.dataService) {
        for (var i = 0; i < msg.length; i++) {
            for (var j = 0; msg[i].settings.length > 0 && j < msg[i].settings.length; j++) {
                firstProviderSet = msg[i].settings[j];
                var zhType = enToZh(firstProviderSet.type);
                if (zhType == utilityRes.localDataProvider || zhType == utilityRes.WFSDataProvider || zhType == utilityRes.RESTDataProvider) {
                    matchProviderSets.push(msg[i]);
                    break;
                }
            }
        }
    } else if (type === utilityRes.realspaceComponents || type === utilityRes.realspaceService) {
        for (var i = 0; i < msg.length; i++) {
            for (var j = 0; msg[i].settings.length > 0 && j < msg[i].settings.length; j++) {
                firstProviderSet = msg[i].settings[j];
                var zhType = enToZh(firstProviderSet.type);
                if (zhType == utilityRes.localRealspaceProvider) {
                    matchProviderSets.push(msg[i]);
                    break;
                }
            }
        }
    } else if (type === utilityRes.transportationanalystComponent || type === utilityRes.transportationanalystService) {
        for (var i = 0; i < msg.length; i++) {
            for (var j = 0; msg[i].settings.length > 0 && j < msg[i].settings.length; j++) {
                firstProviderSet = msg[i].settings[j];
                var zhType = enToZh(firstProviderSet.type);
                if (zhType == utilityRes.transportationanalystProvider) {
                    matchProviderSets.push(msg[i]);
                    break;
                }
            }
        }
    } else if (type === utilityRes.traffictransferanalystComponent || type === utilityRes.traffictransferanalystService) {
        for (var i = 0; i < msg.length; i++) {
            for (var j = 0; msg[i].settings.length > 0 && j < msg[i].settings.length; j++) {
                firstProviderSet = msg[i].settings[j];
                var zhType = enToZh(firstProviderSet.type);
                if (zhType == utilityRes.traffictransferanalystProvider) {
                    matchProviderSets.push(msg[i]);
                    break;
                }
            }
        }
    } else if (type === utilityRes.spatialanalystComponent || type === utilityRes.spatialanalystService) {
        for (var i = 0; i < msg.length; i++) {
            for (var j = 0; msg[i].settings.length > 0 && j < msg[i].settings.length; j++) {
                firstProviderSet = msg[i].settings[j];
                var zhType = enToZh(firstProviderSet.type);
                if (zhType === utilityRes.spatialanalystProvider) {
                    matchProviderSets.push(msg[i]);
                    break;
                }
            }
        }
    }

    else if (type === utilityRes.mapComponent || type === utilityRes.mapService) {
        for (var i = 0; i < msg.length; i++) {
            for (var j = 0; msg[i].settings.length > 0 && j < msg[i].settings.length; j++) {
                firstProviderSet = msg[i].settings[j];
                var zhType = enToZh(firstProviderSet.type);
                if (zhType === utilityRes.localMapProvider || zhType === utilityRes.WMSMapProvider || zhType === utilityRes.WMTSMapProvider || zhType === utilityRes.ArcGISRestMapProvider || zhType === utilityRes.SMTilesMapProvider || zhType === utilityRes.RESTMapProvider
                        || zhType === utilityRes.aggregationMapProvider || zhType === utilityRes.clusterMapProvier
                        || zhType === utilityRes.BingMapsMapProvider || zhType === utilityRes.TiandituMapProvider || zhType === utilityRes.CloudMapProvider || zhType === utilityRes.BaiduMapProvider || zhType == utilityRes.OpenStreetMapProvider) {
                    matchProviderSets.push(msg[i]);
                    break;
                }
            }
        }
    }

    else {
        for (var i = 0; i < msg.length; i++) {
            if (msg[i].settings.length > 0) {
                matchProviderSets.push(msg[i]);
            }
        }
    }

    return matchProviderSets;
}

function isPureProviderSet(msg) {
// var type = msg.settings[0].type;
//
// for(var i = 1 ; i< msg.settings.length ; i++)
// {
// if(type != msg.settings[i].type)
// {
// return false;
// }
// }
//
    return true;

}

// 从所有接口中选择与组件类型相匹配的接口
// type是中文表示的服务组件类型，地图服务，数据服务，真空间服务，交通网络分析服务
// msg是通过GET方法获得的Interfaces的响应体
function getMatchInterfaces(type, msg) {
    var matchInterfaces = new Array();
    if (type == utilityRes.dataComponents || type == utilityRes.dataService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType == utilityRes.WFSServiceInterface || zhType == utilityRes.WCSServiceInterface || zhType == utilityRes.RESTServiceInterface || zhType == utilityRes.AGSRESTServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }
    } else if (type == utilityRes.realspaceComponents || type == utilityRes.realspaceService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType == utilityRes.RESTServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }
    } else if (type == utilityRes.transportationanalystComponent || type == utilityRes.transportationanalystService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType == utilityRes.RESTServiceInterface || zhType == utilityRes.WPSServiceInterface || zhType == utilityRes.AGSRESTServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }

    } else if (type == utilityRes.traffictransferanalystComponent || type == utilityRes.traffictransferanalystService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType == utilityRes.RJServiceInterface || zhType == utilityRes.WPSServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }

    } else if (type == utilityRes.spatialanalystComponent || type == utilityRes.spatialanalystService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType == utilityRes.RJServiceInterface || zhType == utilityRes.WPSServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }
    } else if (type == utilityRes.mapComponent || type == utilityRes.mapService) {// 增加wfs,wcs
        var versionNotSupportedWFSAndWCS = isExpressVersion() || isEnterpriseVersion();
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if ((zhType == utilityRes.WCSServiceInterface || zhType == utilityRes.WFSServiceInterface) && versionNotSupportedWFSAndWCS) {
                //iEdge不支持通用组件的wfs,wcs .高级版直接发布数据服务，就不用发布只读了。
                continue;
            }
            if (zhType == utilityRes.RESTServiceInterface || zhType == utilityRes.WMSServiceInterface || zhType == utilityRes.WMTSServiceInterface || zhType == utilityRes.WCSServiceInterface 
            		|| zhType == utilityRes.WFSServiceInterface || zhType == utilityRes.AGSRESTServiceInterface || zhType == utilityRes.BaiduRESTServiceInterface || zhType == utilityRes.GoogleRESTServiceInterface
            		|| zhType == utilityRes.TMSRESTServiceInterface|| zhType == utilityRes.OSMRESTServiceInterface || zhType == utilityRes.RJServiceInterface) {
                matchInterfaces.push(msg[i]);
            }

        }
    } else if (type == utilityRes.imageComponent || type == utilityRes.imageService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            //影像服务支持restjsr、wmts100接口,wmts-china接口,wms接口
            if ((zhType == utilityRes.WMTSServiceInterface || zhType == utilityRes.RJServiceInterface || zhType == utilityRes.WMSServiceInterface)) {
                matchInterfaces.push(msg[i]);
            }

        }
    }
    else if (type == utilityRes.geoprocessorComponent || type == utilityRes.geoprocessorService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType == utilityRes.GeoprocessorServiceInterface || zhType == utilityRes.RESTServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }
    } else if (type == utilityRes.networkAnalyst3DComponent || type == utilityRes.networkAnalyst3DService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType == utilityRes.RESTServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }
    } else if(type === utilityRes.addressMatchComponent || type === utilityRes.addressMatchService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === utilityRes.RJServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }
    } else if(type === utilityRes.geometryServiceComponent || type === utilityRes.geometryService) {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            if (zhType === utilityRes.RJServiceInterface || zhType === utilityRes.AGSRESTServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }
    } else {
        for (var i = 0; i < msg.length; i++) {
            var zhType = enToZh(msg[i].type);
            //领域组件只支持发布成REST服务
            if (zhType == utilityRes.RESTServiceInterface || zhType == utilityRes.RJServiceInterface) {
                matchInterfaces.push(msg[i]);
            }
        }
    }
    return matchInterfaces;
}

function _IncludeScript(inc) {
    var script = '<' + 'script type="text/javascript" src="../../lib/' + inc + '"' + '><' + '/script>';
    document.writeln(script);
}

// 判断一个文件名是否是文件的全路径名
function isFullPath(file) {
    var path = file.toString();
    if (path.indexOf("fakepath") > 0) {
        return false;
    }
    var index1 = path.lastIndexOf('\\');
    var index2 = path.lastIndexOf('/');
    var index = index1;
    if (index2 > index1) {
        index = index2;
    }
    var pos = index;
    return pos >= 0;
}
function readFileFirefox(fileBrowser) {
    try {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    }
    catch (e) {
        SuperMapServer.Dialog.alert(utilityRes.upLoadNotAllowed);
        return;
    }

    var fileName = fileBrowser.value;
    // 解决FF下不选工作空间时的错误 by zhouxu 2011.12.22
    if (fileName == "") {
        return "";
    }
    var file = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    try {
        // Back slashes for windows
        if (navigator.platform == "Win32" || navigator.platform == "Windows") {
            file.initWithPath(fileName.replace(/\//g, "\\\\"));
        } else {
            file.initWithPath(fileName);
        }
    }
    catch (e) {
        if (e.result != Components.results.NS_ERROR_FILE_UNRECOGNIZED_PATH) throw e;
        SuperMapServer.Dialog.alert(utilityRes.file + fileName + utilityRes.cannotLoad);
        return;
    }

    if (file.exists() == false) {
        SuperMapServer.Dialog.alert(utilityRes.notFindFile + fileName);
        return;
    }
    return file.path;
}

// 根据File控件ID获得其中的文件全路径名
function readFilePath(browser) {
    var filePath;
    if ($.browser.mozilla) {
        var fileBrowser = document.getElementById(browser);
        filePath = readFileFirefox(fileBrowser);
    } else if ($.browser.msie && ($.browser.version != "9.0")) {
        filePath = $("#" + browser).val();
        // 由于现在将本地文件对话框给隐藏掉了，所以不用下面的逻辑了
        // filePath = getPath(document.getElementById(browser));
    } else { // IE9,chrome等如C:\fakepath\China400.zip
        filePath = $("#" + browser).val();
        var fakePath = "fakepath";
        var tmpIndex = filePath.indexOf(fakePath);
        if (tmpIndex != -1) {
            filePath = filePath.substring(tmpIndex + fakePath.length + 1, filePath.length);
        }
    }
    return filePath;
}


// 获得特定类型的接口名称数组
function getInterfaceNameByType(type) {
    var msg = interfacesInfo;
    if (msg == null) {
        msg = sendRequestWithResponse("GET", getRootUrl() + "interfaces" + ".rjson", null);
    }
    var names = new Array();
    for (var i = 0; i < msg.length; i++) {
        if (type == "wms111" || type == "wms1.1.1") {
            if (msg[i].type == "com.supermap.services.wms.WMSServlet" && msg[i].config.version == "1.1.1") {
                names.push(msg[i].name);
            }
        } else if (type == "wms130" || type == "wms1.3.0") {
            if (msg[i].type == "com.supermap.services.wms.WMSServlet" && msg[i].config.version == "1.3.0") {
                names.push(msg[i].name);
            }
        } else if (type == "wmts100" || type == "wmts1.0.0") {
            // 创建wmts100 服务时，不想创建一个wmts-china 的服务 。
            if (msg[i].type == "com.supermap.services.wmts.WMTSServlet" && msg[i].name != "wmts-china") {
                names.push(msg[i].name);
            }
        } else if (type == "wmts-china") {
            if (msg[i].name == "wmts-china" && msg[i].type == "com.supermap.services.wmts.WMTSServlet") {
                names.push(msg[i].name);
            }
        } else if ((type == "wfs100" || type == "wfs1.0.0") && msg[i].type == "com.supermap.services.wfs.WFSServlet") {
            if (!msg[i].config || !msg[i].config.version || msg[i].config.version == "1.0.0") {
                names.push(msg[i].name);
            }
        } else if (type == "wfs200" || type == "wfs2.0.0") {
            if (msg[i].type == "com.supermap.services.wfs.WFSServlet" && msg[i].config && msg[i].config.version == "2.0.0") {
                names.push(msg[i].name);
            }
        } else if (type == "wcs111" || type == "wcs1.1.1") {
            if (msg[i].type == "com.supermap.services.wcs.WCSServlet" && msg[i].config.version == "1.1.1") {
                names.push(msg[i].name);
            }
        } else if (type == "wcs112" || type == "wcs1.1.2") {
            if (msg[i].type == "com.supermap.services.wcs.WCSServlet" && msg[i].config.version == "1.1.2") {
                names.push(msg[i].name);
            }
        } else if (type == "wps100" || type == "wps1.0.0") {
            if (msg[i].type == "com.supermap.services.wps.WPSServlet") {
                names.push(msg[i].name);
            }
        } else if (type == "rest" || type == "rest-map" || type == "rest-data" || type == "rest-dataHistory" || type == "rest-3D" || type == "rest-transportationAnalyst" || type == "rest-plot") {
            if (msg[i].type == "com.supermap.services.rest.RestServlet") {
                names.push(msg[i].name);
            }
        } else if (type == "rest-spatialAnalysis" || type == "rest-trafficTransferAnalyst"||type=="rest-addressmatch" || type == "rest-vectortile" || type == "rest-geoprocessing") {
            if (msg[i].type == "com.supermap.services.rest.JaxrsServletForJersey") {
                names.push(msg[i].name);
            }
        } else if ($.inArray(type, ["agsrest-map", "agsrest-data", "agsrest-networkanalyst"]) >= 0) {
            if (msg[i].type == "com.supermap.services.rest.AGSRestServlet") {
                names.push(msg[i].name);
            }
        } else if (type == "baidurest") {
            if (msg[i].name == "baidurest" && msg[i].type == "com.supermap.services.rest.BaiduRestServlet") {
                names.push(msg[i].name);
            }
        } else if (type == "googlerest") {
            if (msg[i].name == "googlerest" && msg[i].type == "com.supermap.services.rest.GoogleRestServlet") {
                names.push(msg[i].name);
            }
        } else if (type == "tmsrest") {
            if (msg[i].name == "tmsrest" && msg[i].type == "com.supermap.services.rest.TMSRestServlet") {
                names.push(msg[i].name);
            }
        } else if (type == "osmrest") {
            if (msg[i].name == "osmrest" && msg[i].type == "com.supermap.services.rest.OSMRestServlet") {
                names.push(msg[i].name);
            }
        } else if (type == "rest-geometry") {
            if (msg[i].type == "com.supermap.services.rest.JaxrsServletForJersey") {
                names.push(msg[i].name);
            }
        }
    }
    return names;
}

function isValidName(str) {
    var validChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    validChar += "abcdefghijklmnopqrstuvwxyz";
    validChar += "0123456789_-. ";
    if ("" == str || null == str) {
        return false;
    }
    for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (validChar.indexOf(c) == -1) {
            return false;
        }
    }

    return true;
}

// 根据一个基本名和类型，得到一个带序号的名称
function getIndexName(baseName, type) {
    var msg;
    if (type == "provider") {
        msg = providersInfo;
        msg = getMsgStr(msg,"providers");
    } else if (type == "component") {
        msg = componentsInfo;
        msg = getMsgStr(msg,"components");
    } else if (type == "interface") {
        msg = interfacesInfo;
        msg = getMsgStr(msg,"interfaces");
    }
    var find = false;
    var j = 2;
    var newBaseName;
    var oldBaseName = baseName;
    while (!find) {
        var flag = true;
        for (var i = 0; i < msg.length; i++) {
            if (baseName == msg[i].name) {
                flag = false;
                break;
            }
        }
        if (flag) {
            find = true;
            newBaseName = baseName;
        } else {
            baseName = oldBaseName + j.toString();
            j++;
        }
    }
    return newBaseName;
}

function getMsgStr(msg,msgType){
    var msgStr;
    if (msg == null) {
        if(msgType === "providers" || msgType === "components"){
            msgStr = sendRequestWithResponse("GET", getRootUrl() + msgType + ".rjson" + "?time=" + new Date(), null);
        } else {
            msgStr = sendRequestWithResponse("GET", getRootUrl() + "interfaces" + ".rjson", null);
        }

    }
    return msgStr;
}

function getPath(obj) {
    if (obj) {
        if (window.navigator.userAgent.indexOf("MSIE") >= 1) {
            obj.select();
            return document.selection.createRange().text;
        } else if (window.navigator.userAgent.indexOf("Firefox") >= 1) {
            if (obj.files) {
                return obj.files.item(0).getAsDataURL();
            }
            return obj.value;
        }
        return obj.value;
    }
}

//移动所有选中的项
function moveSelectedItem(sourceName, destName) {
    var source = document.getElementById(sourceName);
    var dest = document.getElementById(destName);
    while (source.selectedIndex !== -1) {
        var newOption = new Option(source.options[source.selectedIndex].text, source.options[source.selectedIndex].value);
        newOption.title = source.options[source.selectedIndex].title;
        dest.options.add(newOption, 0);
        source.remove(source.selectedIndex);
    }
}

function moveSingleItem(sourceName, destName) {
    var source = document.getElementById(sourceName);
    var dest = document.getElementById(destName);
    if (source.selectedIndex == -1)  // 源：没有点选任何项目
        return;
    var newOption = new Option(source.options[source.selectedIndex].text, source.options[source.selectedIndex].value);
    newOption.title = source.options[source.selectedIndex].title;
    dest.options.add(newOption, 0);
    source.remove(source.selectedIndex);
}

function moveAllItems(sourceName, destName) {
    var source = document.getElementById(sourceName);
    var dest = document.getElementById(destName);
    // 首先拷贝所有项目到目标：
    var source_len = source.length;
    for (var j = 0; j < source_len; j++) {
        var newOption = new Option(source.options[source.selectedIndex].text, source.options[source.selectedIndex].value);
        newOption.title = source.options[source.selectedIndex].title;
        dest.options.add(newOption);
    }
    // 然后删除“源”所有项目：
    var k;
    while ((k = source.length - 1) >= 0) {
        source.remove(k);
// if (source.options.length==0) //源：如果删除完所有有用项目，则添加提示项目：“无”
// source.options.add(new Option("无"));
    }
}

function removeAllItems(sourceName) {
    var source = document.getElementById(sourceName);
    var source_len = source.length;
    var k;
    // 然后删除“源”所有项目：
    while ((k = source.length - 1) >= 0) {
        source.remove(k);
    }
}

function removeSingleItem(sourceName) {
    var source = document.getElementById(sourceName);
    if (source.selectedIndex == -1)  // 源：没有点选任何项目
        return;
    var k = source.length - 1;
    // 然后删除所有选中项目：
    while (k >= 0) {
        var option = source.options[k];
        if (option.selected) {
            source.remove(k);
        }
        k--;
    }
}

function checkInput(modul, msg) {
    if (msg == undefined) {
        msg = "";
    } else {
        msg = msg + "\\";
    }
    if (!modul) {
        return true;
    }
    var items = modul.subItems;
    if(!items){
        return true;
    }
    for (var i = 0;  i < items.length; i++) {
        var item = items[i];
        var objDes = item.objDes;
        var fileType = objDes.fileType;
        var judgeFlag = fileType == "Workspace" || fileType == "MBTiles" || fileType == "SMTiles";
        if (judgeFlag || fileType == "TPK" || fileType == "ArcGISREST" || fileType == "VTPK" ) {
            continue;
        }
        if (!needToCheck(item)) {
            continue;
        }
        if(!checkFileType(fileType,item,objDes,msg)){
            return false;
        }
    }
    return true;
}

function checkFileType(fileType,item,objDes,msg){
    if (fileType == "Object" || fileType == "GroupedConfigItems") {
        if (!checkInput(item.modul, objDes.chName)) {
            return false;
        }
    } else if (fileType == "ObjectArray") {
        if (item.moduls.length == 0) {
            SuperMapServer.Dialog.alert(msg + objDes.chName + utilityRes.necessary);
            return false;
        }
        for (var j = 0; j < item.moduls.length; j++) {
            if (!checkInput(item.moduls[j], objDes.chName)) {
                return false;
            }
        }
    } else if (fileType == "CheckboxWithObject") {
        if (!checkInput(item.modul, objDes.object)) {
            return false;
        }
    } else {
        var input = item.htmlElements.input;
        if (fileType == "Array" && input.options.length == 0) {
            SuperMapServer.Dialog.alert(msg + objDes.chName + utilityRes.necessary);
            return false;
        } else if ($("#" + input.id).val() == "" || $.trim($("#" + input.id).val()) == "") {
            SuperMapServer.Dialog.alert(msg + objDes.chName + utilityRes.necessary);
            return false;
        }
    }
    return true;
}

function needToCheck(item) {
    var objDes = item.objDes;
    var checkBox = item.htmlElements.isNecessaryCheck;
    return objDes.isNecessay || (checkBox != undefined && checkBox.checked);
}

function disableLocalBrowse() {

    // 2012-12-6 by duwq 修改禁用本地浏览的逻辑,当浏览器不是ie678时禁用本地浏览

    var isBrowserSupportLocal = ($.browser.msie && ($.browser.version == '7.0' || $.browser.version == '8.0' || $.browser.version == '6.0')) ? true : false;

    if ($.browser.mozilla) {
        try {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
            isBrowserSupportLocal = true;
        }
        catch (e) {
        }
    }
    if (!isBrowserSupportLocal) {
        $("#remotePath").attr("disabled", false);
        $("#fileBrowser").attr("disabled", false);
        $("#localBrowse").attr("disabled", true);
        $("#localSMTilesBrowse").attr("disabled", true);
        $("#localZXYTilesBrowse").attr("disabled", true);
        $("#tpkLocalBrowse").attr("disabled", true);
        $("#localTPKBrowse").attr("disabled", true);
        $("#vtpkLocalBrowse").attr("disabled", true);
        $("#localVTPKBrowse").attr("disabled", true);
        $("#styleFileLocalBrowse").attr("disabled", true);
        var tips = $("#localBrowse").attr("title");
        if (tips == "") {
            $("#localBrowse").attr("title", workspaceDialogConentResource.browseTips)
        }
    }
// if(navigator.userAgent.indexOf("Chrome") != -1
// ||navigator.userAgent.indexOf("Safari") != -1 || $.browser.msie
// &&($.browser.version == "9.0")){
// // IE9 safari chrome默认禁用本地文件选择
// $("#remotePath").attr("disabled",false);
// $("#fileBrowser").attr("disabled",false);
// $("#localBrowse").attr("disabled", true);
// $("#localSMTilesBrowse").attr("disabled", true);
// var tips = $("#localBrowse").attr("title");
// if(tips == ""){
// $("#localBrowse").attr("title",workspaceDialogConentResource.browseTips)
// }
// }
}

// 显示发布的工作空间中的带密码的工作空间时，将密码隐藏，此函数在quickCreateInstance.js和precache.js中有引用到
// zhanghs 5-9 解决ISVJ-130
function setPxxswxxdHide(workspaceConnectStr) {
    var result;
    var workspaceConnectStrArray;
    var pxxswxxdArray;
    if (workspaceConnectStr != "") {
        workspaceConnectStrArray = workspaceConnectStr.split(";");
        if (workspaceConnectStr.indexOf("type") != -1) {
            // 数据库行的工作空间连接字符串,形如type=ORACLE;server=orcl;database=;name=testWorkspace;pxxswxxd=test;uxxrnxxe=test
            result = workspaceConnectStrArray[0] + ";" + workspaceConnectStrArray[1] + ";" + workspaceConnectStrArray[2] + ";" + workspaceConnectStrArray[3] + ";";
            pxxswxxdArray = workspaceConnectStrArray[4].split("=");
            result += getResultStr(pxxswxxdArray);
            result += ";";
            result = result + workspaceConnectStrArray[5];
        } else {
            // 表示带密码的文件型工作空间连接字符串,形如China400.smwu;pxxswxxd=iserver
            if (workspaceConnectStrArray.length > 1) {
                result = workspaceConnectStrArray[0] + ";";
                pxxswxxdArray = workspaceConnectStrArray[1].split("=");
                result += getResultStr(pxxswxxdArray);
            } else {
                return workspaceConnectStr;
            }
        }
    }
    return result;
}

function getResultStr(pxxswxxdArray){
    var result = "";
    if (pxxswxxdArray.length > 1) {
        result += pxxswxxdArray[0] + "=";
        for (var i = 0; i < pxxswxxdArray[1].length; i++) {
            result += "*";
        }
    }
    return result;
}

function getXMLNode(url) {
    url = url.replace(new RegExp("&", "gm"), "%26");
    var proxyUrl = getIServerUrl() + "/manager/proxy.json?url=" + url;
    var commit = getXMLHttpRequest();
    commit.open("get", proxyUrl, false, "", "");
    commit.setRequestHeader("Content-Type",
        "application/x-www-form-urlencoded; charset=UTF-8");
    commit.send(null);
    if (commit.readyState == 4) {
        return getXMLDocument(commit.responseText);
    }
    return null;
}

// 得到WMTS服务的描述信息
// 返回{title:title,layers:layers}
// layer:{identifier:String,tileMatrixSets:Array}
function getWMTSInfo(wmtsUrl, version, token) {
    var root = getRootResource(wmtsUrl,version,token);
    if (root == null) {
        return null;
    }
    var layers = new Array();
    var layerNodes = root.getElementsByTagName("Layer");
    for (var i = 0; i < layerNodes.length; i++) {
        var layerNode = layerNodes[i];
        var titleNodes = layerNode.getElementsByTagName("Identifier"); // chrome
        // 取"Identifier"
        if (titleNodes == null || titleNodes.length == 0) {
            titleNodes = layerNode.getElementsByTagName("ows:Identifier");  // IE
                                                                            // Identifier
            if (titleNodes == null || titleNodes.length == 0) {
                continue;
            }
        }
        var layerName = $.trim($(titleNodes[0]).text());
        var tileMatrixSetNodes = layerNode.getElementsByTagName("TileMatrixSet");
        if (tileMatrixSetNodes == null || tileMatrixSetNodes.length == 0) {
            continue;
        }
        var tileMatrixSets = [];
        for (var j = 0; j < tileMatrixSetNodes.length; j++) {
            tileMatrixSets.put($.trim($(tileMatrixSetNodes[j]).text()));
        }
        var wmtsLayer = {
            identifier: layerName,
            tileMatrixSets: tileMatrixSets
        };
        layers[i] = wmtsLayer;// result.put(wmtsLayer) 结果加的是一个字符串啊，
    }
    var title = getTitle(root);
    var result = {
        title: title,
        layers: layers
    }
    return result;
}

function getRootResource(wmtsUrl,version,token){
    if (version == null) {
        version = "1.0.0";
    }
    wmtsUrl += "?Version=" + version;
    if (token) {
    	wmtsUrl += "&token=" + token;
    }
    wmtsUrl += "&SERVICE=WMTS&REQUEST=GetCapabilities";
    try {
        var root = getXMLNode(wmtsUrl);
    } catch (err) {
        return null;
    }
    if (root == null) {
        return null;
    }
    return root;
}

function getTitle(root){
    var title = "";
    var serviceIdentificationNode = root.getElementsByTagName("ServiceIdentification");
    if (serviceIdentificationNode == null || serviceIdentificationNode.length == 0) {
        serviceIdentificationNode = root.getElementsByTagName("ows:ServiceIdentification");
    }
    if (serviceIdentificationNode != null && serviceIdentificationNode.length > 0) {
        var titleNode = serviceIdentificationNode[0].getElementsByTagName("Title");
        if (titleNode == null || titleNode.length == 0) {
            titleNode = serviceIdentificationNode[0].getElementsByTagName("ows:Title");
        }
        title = $.trim($(titleNode[0]).text());
    }
    return title;
}

// 根据字符串得到XMLDocument
function getXMLDocument(str) {
    // url = url.replace(new RegExp("&","gm"),"%26");
    str = str.replace("?>", " ?>");
    var xml = null;
    if ($.browser.msie) {
        xml = new ActiveXObject("Microsoft.XMLDOM");
        xml.async = false;
        xml.loadXML(str);
    } else {
        xml = new DOMParser().parseFromString(str, "text/xml");
    }
    return xml;
}

Array.prototype.contains = function (item) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == item) {
            return true;
        }
    }
    return false;
}

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "H+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth + 3) / 3),
        "s": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.lenght == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

// 给select赋值
function valSelect(id, value, container) {
    if (!container) {
        container = "";
    } else {
        container += " ";
    }
    if (value == null || value == undefined || value == "") {
        return;
    }
    $(container + "#" + id).val(value);
    if ($(container + "#" + id).val() != value) {
        var diskRootSelected = document.getElementById(id);
        if (diskRootSelected == null) {

        } else {
            for (var i = 0; i < diskRootSelected.options.length; i++) {
                if (diskRootSelected.options[i].value == value) {
                    diskRootSelected.options[i].selected = true;
                    break;
                }
            }
        }
    }
}

// 格式化数字，使长数字以3位1个逗号的方式，清晰显示
function formatNumber(str, step, splitor) {
    if (step == null) {
        step = 3;
    }
    if (splitor == null) {
        splitor = ",";
    }
    str = str.toString();
    var len = str.length;

    if (len > step) {
        var l1 = len % step,
            l2 = parseInt(len / step),
            arr = [],
            first = str.substr(0, l1);
        if (first != '') {
            arr.push(first);
        }

        for (var i = 0; i < l2; i++) {
            arr.push(str.substr(l1 + i * step, step));
        }

        str = arr.join(splitor);
    }

    return str;
}


/**
 * =======WARN===========
 * 早期自己造的轮子，不建议使用。
 * 建议使用jQuery.proxy函数。
 * =======WARN===========
 * 创建指定上下文的回调函数。 该createCallback返回一个新的函数，返回的函数被调用时，将会用传入的上下文调用传入的回调函数。
 * 调用createCallback时参数可以多于2个，多出的参数会传递给fn。 示例代码： function somefunction(arg1,
 * arg2, arg3) { alert(arg1); alert(arg2); alert(arg3); };
 *
 * var f = createCallback(this, somefunction, "test1"); f("test2", "test3");
 * 将会依次alert "test1", "test2", "test3"。
 * PS：通常情况下f并不会直接调用，而是赋给事件回调函数。比如希望某个按钮单击后回调指定的函数，并且带上特定的参数的时候。
 *
 * @param context
 *            期望fn被调用时的上下文。
 * @param fn
 *            期望被调用的函数
 * @returns
 */
SuperMapServer.Util.createCallback = function (context, fn) {
    if (!fn) {
        throw new Exception();
    }
    var args = Array.prototype.slice.call(arguments, 2);
    return function (callBackArgs) {
        return function () {
            var currArgs = Array.prototype.slice.call(arguments, 0);
            fn.apply(context || window, callBackArgs.concat(currArgs));
        };
    }(args);
};

/**
 * 对象克隆是件麻烦事，谨慎使用这个方法。 如果对象中包含了复杂的回调函数或则递归引用结构，不要使用这个函数进行复制。
 *
 * @param toClone
 * @param sourceObjects
 *            不用传,函数自身递归调用参数
 * @param targetObjects
 *            不用传,函数自身递归调用参数
 * @returns
 */
SuperMapServer.Util.clone = function (toClone, sourceObjects, targetObjects) {
    if (sourceObjects == undefined) {
        return clone(toClone, new Array(), new Array());
    }
    var result;
    if (toClone instanceof Object) {
        for (var i = 0; i < sourceObjects.length - 1; i++) {
            if (toClone === sourceObjects[i]) {
                return targetObjects[i];
            }
        }
        sourceObjects[sourceObjects.length] = toClone;
        result = getCloneResult(toClone,sourceObjects,targetObjects);
        return result;
    } else {
        return toClone;
    }
};
function getCloneResult(toClone,sourceObjects,targetObjects){
    var result;
    if (toClone instanceof Function) {
        result = toClone;
        targetObjects[targetObjects.length] = result;
    } else if (toClone instanceof Array) {
        result = new Array();
        targetObjects[targetObjects.length] = result;
        for (var i = 0; i < toClone.length; i++) {
            result[i] = clone(toClone[i], sourceObjects, targetObjects);
        }
    } else {
        result = {};
        targetObjects[targetObjects.length] = result;
        for (var i in toClone) {
            result[i] = clone(toClone[i], sourceObjects, targetObjects);
        }
    }
    return result;
}
/**
 * 格式化消息。 例： formatMsg("向地图服务{0}发送请求失败，服务器发生错误：{1}，请重试。", "map-world/rest",
 * "错误的地图范围") 返回： 向地图服务map-world/rest发送请求失败，服务器发生错误：错误的地图范围，请重试。
 */
SuperMapServer.Util.formatMsg = function (msg, params) {
    var a = [].slice.apply(arguments), s = a.shift();
    return s.replace(/\{[0-9]+\}/g, function (d) {
        return a[d.slice(1, -1)];
    });
};

/**
 * 判断指定的字符串中是否是由字母、数字和下划线组成
 */
SuperMapServer.Util.isAlpha = function (str) {
    var reg = /^[a-zA-Z][a-zA-Z0-9_-]{3,17}$/;
    return reg.test(str);
};

/**
 * 判断指定的字符串是否包含中文字符
 */
SuperMapServer.Util.isInChinese = function (str) {
    var reg = /^[\u4E00-\u9FA5]+$/;
    return reg.test(str);
};

/**
 * 根据指定的数据源向指定table的tbody中填充内容.
 */
SuperMapServer.Util.fillTableContent = function (tableID, datasource) {
    var tbodyObj = $("#" + tableID + " tbody");
    if (tbodyObj.length == 0) {
        // 如果模板中没有设置tbody,则加上
        var tableObj = $("#" + tableID);
        var tbodyHtml = "<tbody></tbody>";
        tableObj.append($(tbodyHtml));
        tbodyObj = $("#" + tableID + " tbody");
    }
    tbodyObj.empty();
    // 变量添加行
    for (var trIndex = 0; trIndex < datasource.length; trIndex++) {
        var trHtml;
        if (trIndex % 2 === 0) {
            trHtml = "<tr id='tr_" + datasource[trIndex].id + "'style='background-color:#FFFFFF;'>";
        } else {
            trHtml = "<tr id='tr_" + datasource[trIndex].id + "' style='background-color:#E3E9EF;'>";
        }
        // 便利添加列
        for (var tdIndex = 0; tdIndex < datasource[trIndex].tds.length; tdIndex++) {
            trHtml += "<td";
            // 便利添加列中的项(有的列可能会有多个HTML元素),目前只写了check一种类型,后续有需要可以在下面扩展
            trHtml += getTrHtml(datasource[trIndex]);
            trHtml += "</td>";
        }
        trHtml += "</tr>";
        tbodyObj.append($(trHtml));
    }
};

function getTrHtml(trIndex){
    var trHtml = "";
    for (var i = 0; i < trIndex.tds[tdIndex].items.length; i++) {
        // 如果后续要获取该列的值,则需要设置id属性.获取值时用 $("#td_"+id)获取,比如角色名/用户名/服务实例名等
        if (trIndex.tds[tdIndex].items[i].id != null && trIndex.tds[tdIndex].items[i].id !== "") {
            trHtml += " id='td_" + trIndex.tds[tdIndex].items[i].id + "'>";
        } else {
            trHtml += ">";
        }
        // 如果设置了href则添加a标签
        if (trIndex.tds[tdIndex].items[i].href != null && trIndex.tds[tdIndex].items[i].href !== "") {
            trHtml += "<a href='" + trIndex.tds[tdIndex].items[i].href + "'>" + trIndex.tds[tdIndex].items[i].value + "</a>";
        } else if (trIndex.tds[tdIndex].items[i].type != null && trIndex.tds[tdIndex].items[i].type === "checkbox") {
            trHtml += "<input type='checkbox' id='" + trIndex.id + "'  name='tagForSearch' class='isUsed'/>";
        } else {
            trHtml += trIndex.tds[tdIndex].items[i].value;
        }
    }
    return trHtml;
}

SuperMapServer.Dialog = SuperMapServer.Dialog ? SuperMapServer.Dialog : {};
SuperMapServer.Dialog.confirm = function (title, msg, onYesClick, onNoClick) {
    if (!SuperMapServer.Dialog.confirmInited) {
        SuperMapServer.Dialog.confirmInited = true;
        var div = $('<div id="SuperMapServer_Confirm_Dialog" class="commonDialog" style="display:none">' +
            '<div  class="publishServiceStepIntro" id="SuperMapServer_Confirm_Dialog_MSG" style=" font-size:12px"> </div>' +
            '<br>' +
            '<div class="dialogButtonContainer" style="width:100%">' +
            '<centre>' +
            '<button id="SuperMapServer_Confirm_Dialog_NO" class="btn btn-default">Cancel</button>' +
            '<button id="SuperMapServer_Confirm_Dialog_YES" class="btn btn-primary" style="margin-right:20px;">OK</button>' +
            '</centre>' +
            '</div>' +
            '<br>' +
            '</div>');
        $('body').append(div);
        $('#SuperMapServer_Confirm_Dialog_YES').html(utilityRes.ButtonYES);
        $('#SuperMapServer_Confirm_Dialog_NO').html(utilityRes.ButtonNO);
        $('#SuperMapServer_Confirm_Dialog').dialog({
            title: "",
            autoOpen: false,
            width: 320,
            minWidth: 220,
            modal: true
        });
    }
    if (title) {
        $('#SuperMapServer_Confirm_Dialog').dialog("option", "title", title);
    } else {
        $('#SuperMapServer_Confirm_Dialog').dialog("option", "title", utilityRes.DialogTitle);
    }
    $('#SuperMapServer_Confirm_Dialog_NO').unbind('click');
    $('#SuperMapServer_Confirm_Dialog_YES').unbind('click');
    $('#SuperMapServer_Confirm_Dialog_NO').bind('click', function () {
        $('#SuperMapServer_Confirm_Dialog').dialog("close");
        if (onNoClick) {
            onNoClick();
        }
    });
    $('#SuperMapServer_Confirm_Dialog_YES').bind('click', function () {
        $('#SuperMapServer_Confirm_Dialog').dialog("close");
        if (onYesClick) {
            onYesClick();
        }
    });
    $('#SuperMapServer_Confirm_Dialog_MSG').html(msg);
    $('#SuperMapServer_Confirm_Dialog').dialog("open");
};
SuperMapServer.Dialog.alert = function (title, msg, onOKClick) {
    if (!SuperMapServer.Dialog.alertInited) {
        SuperMapServer.Dialog.alertInited = true;
        var div = $('\
<div id="SuperMapServer_Alert_Dialog" class="commonDialog" style="display:none">\
    <div id="SuperMapServer_Alert_Dialog_MSG" style=" font-size:12px;white-space:pre-line;"> </div>\
    <br/>\
      <div class="dialogButtonContainer" style="width:100%">\
          <center>\
            <button id="SuperMapServer_Alert_Dialog_OK" class="btn btn-primary">OK</button>\
        </center>\
    </div>\
    <br/>\
</div>');
        $('body').append(div);
        $('#SuperMapServer_Alert_Dialog_OK').html(utilityRes.ButtonOK);
        $('#SuperMapServer_Alert_Dialog').dialog({
            title: "",
            autoOpen: false,
            width: 320,
            minWidth: 220,
            modal: true
        });
    }
    if (title && msg) {
        $('#SuperMapServer_Alert_Dialog').dialog("option", "title", title);
        $('#SuperMapServer_Alert_Dialog_MSG').html(msg);
    } else if (!title && msg) {
        $('#SuperMapServer_Alert_Dialog').dialog("option", "title", utilityRes.DialogTitle);
        $('#SuperMapServer_Alert_Dialog_MSG').html(msg);
    } else if (title && !msg) {
        $('#SuperMapServer_Alert_Dialog_MSG').html(title);
    }
    $('#SuperMapServer_Alert_Dialog_OK').unbind('click');
    $('#SuperMapServer_Alert_Dialog_OK').bind('click', function () {
        $('#SuperMapServer_Alert_Dialog').dialog("close");
        if (onOKClick) {
            onOKClick();
        }
    });
    $('#SuperMapServer_Alert_Dialog').dialog("open");
};

/**
 * 让指定的对象具有tooltip功能。<br>
 *
 * @param element js对象
 * @param tipInfo 提示文字
 * @param place 提示的位置("right","top","left","bottom")，可选，默认为"right".
 */
function enableToolTip(element, tipInfo, place) {
    if ($(element).next().hasClass("tipmark")) {
        $(element).next().remove();//如果已经存在提示，则删除后重新添加
    }
    var tipImage = "<img class='tipmark' title='" + tipInfo + "' src='" + getRootUrl() + "static/img/popUpControl.gif' style='margin-left:10px;'/>";
    if (!place) {
        place = "right";//默认显示到右侧
    }
    $(tipImage).insertAfter($(element)).tooltip({placement: place, title: tipInfo});
}

String.prototype.containsIgnoreCase = function (s) {
    if (s == null || s.length == 0) {
        return true;
    }
    if (s.length > this.length) {
        return false;
    }
    return this.toLowerCase().indexOf(s.toLowerCase()) >= 0;
};

var selectFileByRemoteCallBack;

//add by duwq
function getCookie(c_name) {
    var c_start;
    var c_end;
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return decodeURI(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

//extensions形式如:"sxw|sxwu|udb|tpk"
//callBack(filePath)
function selectFileByRemote(extensions, callBack, curFilePath) {
    selectFileByRemoteCallBack = callBack;
    if (extensions == null) {
        showFileChooser();
        return;
    }
    var wWidth = 896;
    var wHeight = 540;
    var wLeft = (window.screen.width - wWidth) / 2;
    var wTop = (window.screen.height - wHeight) / 2;
    var filechooserUrl = getRootUrl() + "filechooser";

    // 选择自定义的文件不确定
    var filePath = curFilePath;
    if (filePath) {
        filePath = filePath.replace(/\\/g, '/');
        if (filePath.indexOf("/") == 0) {
            var fileRoot = filePath.split("/");
            var docRoot = "/" + fileRoot[1];
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + 10);
            document.cookie = "docRoot=" + encodeURIComponent(docRoot) + ";expires=" + exdate.toGMTString() + ";path=/;";
        } else {
            var fileRoot = filePath.split("/");
            var docRoot = fileRoot[0].toUpperCase() + "\\";
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + 10);
            document.cookie = "docRoot=" + encodeURIComponent(docRoot) + ";expires=" + exdate.toGMTString() + ";path=/;";
        }
    } else if (getCookie('workspaceRoot') != '' && getCookie('workspaceRoot') != null) {
        if (getCookie('workspaceRoot').indexOf("/") == 0) {
            var fileRoot = getCookie('workspaceRoot').split("/");
            var docRoot = "/" + fileRoot[1];
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + 10);
            document.cookie = "docRoot=" + encodeURIComponent(docRoot) + ";expires=" + exdate.toGMTString() + ";path=/;";
        } else {
            var fileRoot = getCookie('workspaceRoot').split("/");
            var docRoot = fileRoot[0].toUpperCase() + "\\";
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + 10);
            document.cookie = "docRoot=" + encodeURIComponent(docRoot) + ";expires=" + exdate.toGMTString() + ";path=/;";
        }
    }

    if (filePath) {
        filePath = getFilePath(filePath,extensions);
        filechooserUrl += "?refer=" + encodeURI(filePath);
    }
    filechooserUrl = getfilechooserUrl(filechooserUrl,extensions);

    if (filePath && filePath.indexOf(".") == 0) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + 10);
        document.cookie = "pathType=relative;expires=" + exdate.toGMTString() + ";path=/;";
    } else {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + 10);
        document.cookie = "pathType=normal;expires=" + exdate.toGMTString() + ";path=/;";
    }
    window.open(filechooserUrl, "_blank", "location=yes, directories=no, status=no, menubar=no, " +
        "scrollbars=yes, resizable=no, left=" + wLeft + ", top=" + wTop + ", width=" + wWidth + ", height=" + wHeight);
}

function getfilechooserUrl(filechooserUrl,extensions){
    var filechooserUrlStr = filechooserUrl;
    if (filechooserUrlStr.lastIndexOf("?") < 0) {
        filechooserUrlStr += "?extensions=" + encodeURIComponent(extensions);
    } else {
        filechooserUrlStr += "&extensions=" + encodeURIComponent(extensions);
    }
    return filechooserUrlStr;
}

function getFilePath(filePath,extensions){
    var filePathStr = filePath;
    if (filePathStr.indexOf("/") == 0) {
        filePathStr = filePathStr.substring(1, filePath.length);
    }
    var array = extensions.split("|");
    for (var i = 0; i < array.length; i++) {
        if (filePathStr.lastIndexOf("." + array[i]) != -1) {
            filePathStr = filePathStr.substring(0, filePathStr.lastIndexOf("/"));
            break;
        }
    }
    return filePathStr;
}

// 从jobInfo中获取使用的服务组件名
function getTileJobComponentName(jobInfo) {
    return jobInfo.dataConnectionString.slice(jobInfo.dataConnectionString.indexOf('<name>'), jobInfo.dataConnectionString.indexOf('</name>')).split('<name>')[1];
}

function addBRsToString(text, wordNumPerRow) {
    var textLength = text.length;
    var rowCount = textLength / Number(wordNumPerRow);
    var stringArray = new Array();
    for (var i = 0; i < textLength; i += wordNumPerRow) {
        stringArray.push(text.substring(i, i + Number(wordNumPerRow)));
    }
    return stringArray.join("<br/>");
}

//去掉string里面所有的空格
function trimAll(string) {
    return string.replace(/\s/g, "");
}

function isNullOrUndefined(value) {
    if (value === null) {
        return true;
    }
    if (typeof(value) === "undefined") {
        return true;
    }
    return false;
}

function isNotNullAndUndefined(value) {
    if (value === null) {
        return false;
    }
    if (typeof(value) === "undefined") {
        return false;
    }
    return true;
}

//防止XSS攻击
function xSSFilter(val) {
    val = val.toString();
    val = val.replace(/</g, "&lt;");
    val = val.replace(/>/g, "&gt;");
    val = val.replace(/"/g, "&quot;");
    val = val.replace(/'/g, "&#39;");
    return val;
}

//判断参数中是否带有特殊字符并提示
SuperMapServer.Util.xSSFilterCheck = function(val) {
    val = val.toString();
    if(val.indexOf("<") > -1 || val.indexOf(">") > -1 || val.indexOf('"') > -1 || val.indexOf("'") > -1){
        return false;
    }else{
        return true;
    }
}

//使用选择器时，如果含有特殊字符，则jquery选择器选择不了，这里对特殊字符进行转义
function escapeJquery(srcStr){
    var escapeResult = srcStr;
    //javascript正则表达式中的特殊字符
    var jsSpecialChars = ["\\","^","$","*","?",".","+","(",")","[","]","|","{","}"];
    //jquery中的特殊字符，不是正则表达式中的特殊字符
    var jquerySpecialChars = ["~","`","@","#","%","&","=","'","\"",":",";","<",">",",","/"];
    for(var i=0;i<jsSpecialChars.length;i++){
        escapeResult = escapeResult.replace(new RegExp("\\"+jsSpecialChars[i],"g"),"\\"+jsSpecialChars[i]);
    }
    for(var i=0;i<jquerySpecialChars.length;i++){
        escapeResult = escapeResult.replace(new RegExp(jquerySpecialChars[i],"g"),"\\"+jquerySpecialChars[i]);
    }
    return escapeResult;
}

/*改变全选按钮状态
 * @param tableSelector 表格元素的选择器
 * @param allSelector 全选按钮元素的选择器
 * @param inputSelector 表格元素的子元素勾选按钮的选择器
 **/
function bindEventForChangeAllSelect(tableSelector, allSelector, inputSelector){
    $(tableSelector).on('click', inputSelector, function(){
        var isChecked = $(this).prop('checked');
        if(isChecked){//加判断，性能好些
            var isAllSelect = true;
            $(tableSelector + ' ' + inputSelector).each(function(){
                $(this).prop('checked') === false && (isAllSelect = false);
            });
            $(allSelector).prop('checked', isAllSelect);
        }else{
            $(allSelector).prop('checked', false);
        }
    });
}

//打开对话框并加上iFrame层,这样在IE下就不会被select划破  备注:BT的IE,相同的系统环境,相同的IE版本,结果一个电脑上没有被划破的问题,一个有.无奈出此下策.  --add by zhousj
(function ($) {
    if ($.ui) {//防止跳转时报null
        $.ui.dialog.prototype.open = function () {
            var that = this;
            if (this._isOpen) {
                if (this._moveToTop()) {
                    this._focusTabbable();
                }
                return;
            }
            this._isOpen = true;
            this.opener = $(this.document[0].activeElement);
            this._size();
            this._position();
            this._createOverlay();
            this._moveToTop(null, true);
            this._show(this.uiDialog, this.options.show, function () {
                that._focusTabbable();
                that._trigger("focus");
            });
            this._trigger("open");
            if ($.browser.msie) {
                var iframeHtml = "<iframe id='iframeUsedForCoverSelect' scrolling='auto' width='100%' height='100%' frameborder='0' framespacing='0' style='filter:alpha(opacity:0);opacity:0;left:0px;top:0px;position:absolute;z-index:-1;'></iframe>";
                that.bindings.append(iframeHtml);
            }
            return this;
        };

        if ($.browser.msie || !!window.ActiveXObject || "ActiveXObject" in window) {
            $.ui.dialog.prototype._blockFrames = function () {
                return $("<div>")
                    .css({
                        position: "absolute",
                        width: "auto",
                        height: "auto"
                    });
            };
            if ($.fn.replaceWith) {
                var $replaceWithFunc = $.fn.replaceWith;
                $.fn.replaceWith = function () {
                    //IE9、IE10、IE11使用$("input").replaceWith("<select></select>")出错
                    //这里直接使用IE支持的outerHTML替换JQuery原有方法(ISVJ-661)。---- by liuyx，
                    //不能尝试先用$replaceWithFunc处理、异常再使用outerHTML， 若出现异常会破坏原对象的dom结构。
                    $(this)[0].outerHTML = $(arguments[0])[0].outerHTML;
                    return $(this);
                }
            }
        }
    }
})(jQuery);