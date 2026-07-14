let tunnelObj = {
    tunnelUrl: '',
    blockedUrlRegex: {
        POST: [],
        GET: [],
        PUT: [],
        DELETE: []
    },
    encryptAESKey: generateAESRandomKey(),
    encryptAESIV: generateAESRandomIV()
};
let rootUrl = getRootUrl().substring(0,getRootUrl().indexOf("/manager"));
function encryptionRequest(url,method,entity, headers){
    if(!sessionStorage.tunnelUrl || sessionStorage.JSESSIONID !== getCookie("JSESSIONID")){
        creatTunnel();
    }
    let result;
    //用后端返回的正则表达式进行url拦截，符合条件的进行加密
    for (let i = 0; i < JSON.parse(sessionStorage.blockedUrlRegex)[method].length; i++){
        let pattern = (JSON.parse(sessionStorage.blockedUrlRegex)[method])[i];
        let regex = new RegExp(pattern);
        if(regex.test(url)){
            //将请求体以及url等参数用aes加密并通过隧道发送login请求
            let data = {
                url: url,
                method: method,
                body: entity,
            };
            let responseStr = sendEncryptionRequestWithResponse("POST", sessionStorage.tunnelUrl, AESGCMEncrypt(sessionStorage.encryptAESKey,sessionStorage.encryptAESIV,JSON.stringify(data)), headers);
            responseStr = AESGCMDecrypt(sessionStorage.encryptAESKey, sessionStorage.encryptAESIV, responseStr);
            let resp = JSON.parse(responseStr);
            if(resp.data){
                result = resp.data;
            }
        }
    }
    return result;
}


//创建隧道
function creatTunnel(){
    //获取RSA公钥
    let createRSAKeyApi = sendEncryptionRequestWithResponse("GET", rootUrl + "/services/security/tunnel/v1/publickey.json", null);
    createRSAKeyApi = JSON.parse(createRSAKeyApi);
    //生成aes密钥
    let aesKeyObj = {
        key: tunnelObj.encryptAESKey,
        iv: tunnelObj.encryptAESIV,
        mode: "GCM",
        padding: "NoPadding"
    };
    //将aes密钥用RSA公钥加密
    let aesCipherText = RSAEncrypt(createRSAKeyApi.publicKey, aesKeyObj.key + aesKeyObj.iv);
    //将用RSA加密好的aes密钥发送给后端，创建隧道
    let tunnel = sendEncryptionRequestWithResponse("POST", rootUrl + "/services/security/tunnel/v1/tunnels.json", aesCipherText);
    tunnel = JSON.parse(tunnel);
    tunnelObj.tunnelUrl = tunnel.tunnelUrl;
    tunnelObj.blockedUrlRegex = tunnel.blockedUrlRegex;
    sessionStorage.setItem("tunnelUrl",tunnelObj.tunnelUrl);
    sessionStorage.setItem("encryptAESKey",tunnelObj.encryptAESKey);
    sessionStorage.setItem("encryptAESIV",tunnelObj.encryptAESIV);
    sessionStorage.setItem("blockedUrlRegex",JSON.stringify(tunnelObj.blockedUrlRegex));
    sessionStorage.setItem("JSESSIONID",getCookie("JSESSIONID"));

}
//aes加密
function AESGCMEncrypt(key, iv, msg) {
    msg = forge.util.encodeUtf8(msg)
    let cipher = forge.cipher.createCipher('AES-GCM', key);
    cipher.start({
        iv: iv,
        additionalData: '',//'binary-encoded string', // optional
        tagLength: 128 // optional, defaults to 128 bits
    });
    cipher.update(forge.util.createBuffer(msg));
    let pass = cipher.finish();
    if (pass) {
        let encrypted = cipher.output;
        let tag = cipher.mode.tag;
        return window.btoa(encrypted.data + tag.data);
    }
    return false;
}
//aes解密
function AESGCMDecrypt(key, iv, cipherText) {
    let cipherStrAndMac = window.atob(cipherText);
    let cipherStr = cipherStrAndMac.substring(0, cipherStrAndMac.length - 16);
    let mac = cipherStrAndMac.substring(cipherStrAndMac.length - 16);
    let decipher = forge.cipher.createDecipher('AES-GCM', forge.util.createBuffer(key));
    decipher.start({
        iv: forge.util.createBuffer(iv),
        additionalData: '', // optional
        tagLength: 128, // optional, defaults to 128 bits
        tag: mac // authentication tag from encryption
    });
    decipher.update(forge.util.createBuffer(cipherStr));
    let pass = decipher.finish();
    if(pass) {
        return forge.util.decodeUtf8(decipher.output.data);
    }
    return false;
}
//RSA加密
function RSAEncrypt(publicKeyStr, message) {
    if (publicKeyStr.indexOf('BEGIN PUBLIC KEY') === -1) { // 转为PEM格式
        publicKeyStr = "-----BEGIN PUBLIC KEY-----\n" + publicKeyStr + "\n-----END PUBLIC KEY-----";
    }
    let publicKey = forge.pki.publicKeyFromPem(publicKeyStr);
    let obj = {
        md: forge.md.sha256.create(),
        mgf1: {
            md: forge.md.sha1.create()
        }
    };
    let encrypted = publicKey.encrypt(message, 'RSA-OAEP', obj);
    if (!encrypted) {
        return false; // 加密失败
    }
    return window.btoa(encrypted);
}
function generateAESRandomKey() {
    return randomString(16);
}

function generateAESRandomIV() {
    return randomString(12);
}
function randomString(length) {
    let str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = length; i > 0; --i)
        result += str[Math.floor(Math.random() * str.length)];
    return result;
}
//加密请求专用的发请求的方法，响应体需要先解密再解析json
function sendEncryptionRequestWithResponse(method, uri, entry, headers) {
    // var commit = new XMLHttpRequest();
    var commit = getXMLHttpRequest();
    uri = convertUrl(uri);
    commit.open(method, encodeURI(uri), false, "", "");
    commit.setRequestHeader("Content-Type",
        "application/x-www-form-urlencoded; charset=UTF-8");
    if (headers) {
        for (var i = 0; i < headers.length; i++){
            var header = headers[i];
            commit.setRequestHeader(header.name, header.value);
        }
    }
    // 设置PUT请求的参数
    var entity = null;
    if (entry != null) {
        entity = EncryptiontoJSON(entry);
    }
    commit.send(entity);

    var response = commit.responseText;

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
function EncryptiontoJSON(o) {
    // / <summary>将对象转换成JSON字符串</summary>
    // / <param name="o" type="Object">要转换成JSON的Object对象。</param>
    // / <returns type="Object">返回转换后的JSON对象。</returns>
    if (isNullOrUndefined(o))
        return "null";

    switch (o.constructor) {
        case String :
            var s = o; // .encodeURI();
            s = s.replace(/(["\\])/g, '\\$1');
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
function getCookie(name) {
    var arr;
    var reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    if (arr = document.cookie.match(reg)) {
        return unescape(arr[2]);
    } else {
        return null;
    }
}
