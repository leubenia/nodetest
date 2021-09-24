const express = require("express");
const write = require("../schemas/write");
require('date-utils');

const router = express.Router();

//게시물 조회
router.get("/write", async (req, res, next) => {
    try {
        const { category } = req.query;
        const write = await write.find({ category }).sort("-writeId");
        res.json({ write: write });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

//게시물 한가지만 조회
router.get("/write/:writeId", async (req, res) => {
    const { writeId } = req.params;
    write = await write.findOne({ writeId: writeId });
    res.json({ detail: write });
});


//게시물 작성
router.post('/write', async (req, res) => {
    const { title, name, body, pw } = req.body;
    writeId = await write.count() + 1;
    var newDate = new Date();
    var date = newDate.toFormat('YYYY,MM,DD HH24:MI:SS')
    try {
        await write.create({ writeId, title, name, body, date, pw });
        
        res.send({ result: "success" });
    }
    catch {
        res.send({ result: "err" });
    }
});


//게시물 삭제
router.delete("/write/:writeId/re", async (req, res) => {
    const { writeId } = req.params;

    const isGoodsInCart = await Cart.find({ writeId });
    if (isGoodsInCart.length > 0) {
        await Cart.deleteOne({ writeId });
    }

    res.send({ result: "success" });
})

//게시물 수정
router.patch("/goods/:writeId/re", async (req, res) => {
    const { writeId } = req.params;
    const { body } = req.body;

    const isGoodsInCart = await Cart.find({ writeId });
    if (isGoodsInCart.length > 0) {
        await Cart.updateOne({ writeId }, { $set: { body } });
    }

    res.send({ result: "success" });
})


module.exports = router;