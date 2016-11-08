var express = require('express');
var router = express.Router();
var fs = require("fs");
var util = require('util');
var multer = require("multer");
var Settings = require("../Util/Settings");
var crypto = require('crypto');
var upload = multer({dest : Settings.multerDir});

var win_file_path   = "C:\\tmp\\";
var unix_file_path  = "/tmp/";
/*
  加密方法
  @param key 加密key
  @param iv       向量
  @param data     需要加密的数据
  @returns string
 */
var encrypt = function (key, iv, data) {
    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    var crypted = cipher.update(data, 'utf8', 'binary');
    crypted += cipher.final('binary');
    crypted = new Buffer(crypted, 'binary').toString('base64');
    return crypted;
};
 
/*
  解密方法
  @param key      解密的key
  @param iv       向量
  @param crypted  密文
  @returns string
 */
var decrypt = function (key, iv, crypted) {
    crypted = new Buffer(crypted, 'base64').toString('binary');
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    var decoded = decipher.update(crypted, 'binary', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
};
var key = '1234567812345678';
var iv = '0102030405060708';


/* GET index page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });    // 到达此路径则渲染index文件，并传出title值供 index.html使用
});

/* GET login page. */
router.route("/login").get(function (req, res) {    // 到达此路径则渲染login文件，并传出title值供 login.html使用
    res.render("login", { title: 'User Login' });
}).post(function (req, res) { 					   // 从此路径检测到post方式则进行post数据的处理操作
    //get User info
    //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    var User = global.dbHandel.getModel('user');
    console.log(req.body.uname);
    console.log(req.body.upwd);
	var resuname = req.body.uname.replace(/ /g,'+');
	var resupwd = req.body.uname.replace(/ /g,'+');
	console.log(resuname);
	console.log(resupwd);
    //var unameenc = encrypt(key, iv , req.body.uname);
	//console.log(unameenc);
	//var uname = decrypt(key, iv, unameenc);
	var uname = decrypt(key, iv, resuname);
	var upwd = decrypt(key, iv, resupwd);
    console.log(uname);
    console.log(upwd);
	//获取post上来的 data数据中 uname的值
    User.findOne({ name: uname }, function (err, doc) {   //通过此model以用户名的条件 查询数据库中的匹配信息
        if (err) { 										//错误就返回给原post处（login.html) 状态码为500的错误
            res.end("Error");
            console.log(err);
        } else if (!doc) { 								//查询不到用户名匹配信息，则用户名不存在
            req.session.error = '用户名不存在';
            console.log("Invalid Username");
            res.end("Error");							//	状态码返回404
            //	res.redirect("/login");
        } else {
			if (upwd != doc.password) { 
            //if (req.body.upwd != doc.password) { 	//查询到匹配用户名的信息，但相应的password属性不匹配
                req.session.error = "密码错误";
                console.log("Invalid Pwd");
                res.end("Error");
                //	res.redirect("/login");
            } else { 									//信息匹配成功，则将此对象（匹配到的user) 赋给session.user  并返回成功
                req.session.user = doc;
                console.log("LOGIN-SUCCEED.");
                res.end("OK");
                //res.redirect("/home");
            }
        }
    });
});

/* GET register page. */
router.route("/register").get(function (req, res) {    // 到达此路径则渲染register文件，并传出title值供 register.html使用
    res.render("register", { title: 'User register' });
}).post(function (req, res) {
    //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    var User = global.dbHandel.getModel('user');
    //var uname = req.body.uname;
    //var upwd = req.body.upwd;
	//var uname = decrypt(key, iv, req.body.uname);
	//var upwd = decrypt(key, iv, req.body.upwd);
	var resuname = req.body.uname.replace(/ /g,'+');
	var resupwd =req.body.uname.replace(/ /g,'+');
	console.log(resuname);
	console.log(resupwd);
	var uname = decrypt(key, iv, resuname);
	var upwd = decrypt(key, iv, resupwd);
    User.findOne({ name: uname }, function (err, doc) {   // 同理 /login 路径的处理方式
        if (err) {
            res.end("REGError");
            req.session.error = '网络异常错误！';
            console.log(err);
        } else if (doc) {
            req.session.error = '用户名已存在！';
            res.end("REGError");
        } else {
            User.create({ 							// 创建一组user对象置入model
                name: uname,
                password: upwd,
                createtime : new Date().toLocaleString()
            }, function (err, doc) {
                if (err) {
                    res.end("REGError");
                    console.log(err);
                } else {
                    
                        fs.mkdir(Settings.uploadDir + uname, function(err){

                                if(err){
                                    console.log("[*]Trying Creating User-Directory Failed.");
                                }
                                console.log("[*]Create User-Directory for " + uname + " Succeed.");
                            });
                        }
                    });
                    req.session.message = '用户创建成功！';
                    res.end("REGOK");
                }
            });
        });

/* GET home page. */
router.get("/home", function (req, res) {
    if (!req.session.user) { 					//到达/home路径首先判断是否已经登录
        req.session.error = "请先登录"
        res.redirect("/login");				//未登录则重定向到 /login 路径
        return ;
    }
    res.render("home", { title: 'Home' });         //已登录则渲染home页面
});

/* GET logout page. */
router.get("/logout", function (req, res) {    // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
    req.session.user = null;
    req.session.error = null;
    res.redirect("/");
});


/* GET upload page. */
router.get("/upload", function (req, res) {
	if (!req.session.user){
        res.end("LoginFirst");
        return;
    }
    res.render('upload', { title: 'upload' });
});

router.get("/uplocation", function (req, res) {
	if (!req.session.user){
        res.end("LoginFirst");
        return;
	}
    res.render('uplocation', { title: 'uplocation' });
});

router.post("/uploaded", upload.single('uploaded'), function (req, res) {    // 到达此路径则渲染upload文件

    //Rewrite Here For Session-Check.
    if (!req.session.user){
        res.end("LoginFirst");
        return;
    }
    var username = req.session.user.name;
    var info = req.file;
    console.log(req.file);
    //This indicates filename to store inside file folder.
    var filename    = info['originalname'];
    var tmp_path    = info['path'];
    var new_path    = Settings.uploadDir + username + "/" + filename;
    console.log("[*]TMP_FILENAME: " + tmp_path);
    console.log("[*]New_PathName: " + new_path);
    //Move File to target Place
    fs.rename(tmp_path, new_path, function (err) {
        if (err) {
            throw err;
        }
    });
    var myDate = new Date();
    var file = global.dbHandel.getModel('file');
    file.create({ 							// 创建一组file对象置入model
        name: username,
        filename: filename,
        pathname: Settings.uploadDir + username,
        createtime: myDate.toLocaleString()
    }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("sucessed");
        }
    });
    res.redirect("/home");
});



//Get File Content
router.get("/read", function (req, res) {

    if(!req.session.user){
        res.end("LoginFirst");
        return;
    }
    var username = req.session.user.name;
    var path     = Settings.uploadDir + username;

    fs.readdir(path, function (err, files) {
        //err 为错误 , files 文件名列表包含文件夹与文件
        if (err) {
            console.log('error:\n' + err);
            return;
        }
        res.writeHead(200, { "Content-Type": "text/plain" });
        
        files.forEach(function (file) {
     
                    // 读出所有的文件
                    console.log('文件名:' + path + '/' + file);
                    res.write('文件名: ' + file+'\n' );
                    
        });

        res.end();

    });
});


router.post("/locationup", function (req, res) {
    var obj = req.body.locationup;
    if (!req.session.user){
        res.end("LoginFirst");
        return;
    }

    username = req.session.user.name;
    var location_up = global.dbHandel.getModel('location_up');
    location_up.create({
        name: username,
        coordinate: obj,
        createtime: new Date().toLocaleString()
    }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("sucessed");
        }
    });
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end('上传成功');
});



module.exports = router;
