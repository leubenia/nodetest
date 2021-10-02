const express = require("express");
const user = require("../schemas/user");
let jwt = require("jsonwebtoken");
let secretObj = require("../private/myconkey");
var cookie = require('cookie-parser');
const joi = require("joi");
const crypto = require('crypto');
require('date-utils');

const router = express.Router();

router.use(cookie())


function usercheck(id, pw, name){
    const users = user.findOne({id: id});
    let salt = users["salt"];
    let hashPassword = crypto.createHash("sha512").update(pw + salt).digest("hex");
    return {
        userdo:() =>{
            if(users === null){
                return false;
            }
            else{
                return true;
            }
        },
        
        idcheck: ()=>{
            if(users["id"] === id){
                return true;
            }
            else{
                return false;
            }
        },
        pwcheck: ()=>{
            if(users["pw"] === hashPassword ){
                return true;
            }
            else{
                return false;
            }
        },
        hashpw: ()=>{
            return hashPassword;
        },
        namecheck:()=>{
            user.findOne({name: name}).then(
                isuser =>{
                    if(isuser === null){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
            )
        }

    }
}

//아이디 찾기
router.get("/userid/:id", async(req, res, next)=> {
    const {id} = req.params;
    const writes = await user.findOne({id: id });
    if(writes == null){
        res.send({ result: "do" });
    }
    else{
        res.send({ result: "err" });
    }
});

// 로그인 POST
router.post("/login", async (req, res, next) => {
    let body = req.body;
    user.findOne({ id: body.id })
    .then(users =>{
        console.log(users)
        if (users != null) {
            let token = jwt.sign({ id: users["id"] , name: users["name"] }, secretObj.secret ,{expiresIn: '5m' })
            let dbPassword = users["pw"]
            let inputPassword = body.pw;
            let salt = users["salt"];
            let hashPassword = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");
            if (dbPassword === hashPassword) {
                console.log("비밀번호 일치");
                res.cookie("user",token,{maxAge: 300000})
                res.redirect("/");
            }
            else {
                console.log("비밀번호 불일치");
                res.send("<script>alert('틀렷네요?');location.href='/';</script>")
            }
        }
        else{
            console.log("아이디 없음");
            res.send("<script>alert('아저씨아이디가아니요');location.href='/';</script>")
        }
    })
});
//회원가입
router.post("/signup", async (req, res, next) => {
    const body = req.body;
    const id = body.id;
    const pwtest = body.pw;
    const name = body.name;
    const {userdo, hashpw ,namecheck} = usercheck(id, pwtest, name)
    if(!/^[0-9a-z+]{3,}/gi.test(name)){
        res.send({error : "닉네임을 확인하세요"})
    }
    if(!/^[0-9]{4,}[^${name}]/gi.test(pwtest)){
        res.send("비밀번호가 4자 이하거나 닉네임과 같은 값이 있습니다.")
    }
    if(!namecheck()){
        res.send("닉네임 중복.")
    }
    let salt = Math.round((new Date().valueOf() * Math.random())) + "";
    let pw = crypto.createHash("sha512").update(pwtest + salt).digest("hex");
    const iswhat = false;
    console.log(id, pw, name ,iswhat, salt)
    await user.create({ id, pw, name ,iswhat, salt})
        .then(result => {
            res.redirect("/")
        })
        .catch(err => {
            console.log(err)
            res.send("<script>alert('다시입력?');location.href='/singup';</script>")
        })
});

//회원가입 다시짜기
const userupjoi = joi.object({
    id: joi.string().required(),
    pw: joi.string().required(),
    conpw: joi.string().required(),
    name: joi.string().required(),
  });
router.post("/users", async (req, res) => {
    const { error, value } = userupjoi.validate(req.body);
    const { nickname, email, password, confirmPassword } = value;
  
    if (error) {
      res.status(400).send({
        errorMessage: "정확한 값입력요망",
      });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).send({
        errorMessage: "페스워드가 페스워드 확인란과 동일하지 않습니다.",
      });
      return;
    }
  
    const exisUsers = await User.findAll({
      where: {
        [Op.or]: [{ nickname }, { email }],
      },
    });
    if (exisUsers.length) {
      res.status(400).send({
        errorMessage: "이미 가입된 아이디 또는 닉네임.",
      });
      return;
    }
  
    await User.create({ email, nickname, password });
  
    res.status(200).send({});
  });







//어드민용 유저리스트
router.get("/userlist", async(req, res, next)=> {
    const admin = req.cookies.user;
    const decoded = jwt.verify(admin, secretObj.secret);
    console.log(decoded["id"]+"접근")
    user.findOne({ id: decoded["id"] })
    .then(users =>{
        if (users != null) {
            if(users["iswhat"]){
                user.find({}).then(list =>{
                    res.json({list : list})
                })   
            }
            else{
                res.redirect("/")
            }
        }
    })
    
});



//세션사용 로그아웃
router.get("/logout", function (req, res, next) {
    req.session.destroy(function (err) { });
    res.clearCookie('sid');
    console.log("삭제완료")

    res.redirect("/")
});



router.post("/Nontestsessen", async (req, res, next) => {
    let body = req.body;

    user.findOne({ id: body.id })
    .then(users =>{
        console.log(users)
        if (users != null) {
            let dbPassword = users["pw"]
            let inputPassword = body.pw;
            //let salt = result.dataValues.salt;
            //let hashPassword = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");

            if (dbPassword === inputPassword) {
                console.log("비밀번호 일치");
                // 세션 설정
                req.session.name = users["name"];
                req.session.save
                console.log(users["name"]);
                console.log(req.session);
                res.redirect("/");
            }
            else {
                console.log("비밀번호 불일치");
                res.send("<script>alert('틀렷네요?');location.href='/';</script>")
            }
        }
    })
});

module.exports = router;