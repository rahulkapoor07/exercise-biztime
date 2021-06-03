const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

router.get("/",async (req, res, next)=>{
    const request = await db.query(`SELECT * FROM invoices`);
    res.json({invoices: request.rows});
});

module.exports = router;

router.get("/:id", async(req,res,next)=>{
    try{
        const { id } = req.params;
        const request = await db.query(`SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, i.comp_code,
        c.name, c.description FROM invoices AS i 
            JOIN companies AS c ON i.comp_code = c.code WHERE id=$1`, [id]);
        if (request.rows.length === 0){
            throw new ExpressError(`id ${id} doesn't exists in database`, 404);
        }
        const data = request.rows[0];
        const invoices = {
            id : data.id, amt : data.amt, paid : data.paid, add_date : data.add_date, paid_date: data.paid_date,
            company: {code: data.comp_code, name: data.name, description : data.description}
        }
        return res.json({invoice : invoices});
    }catch(e){
        return next(e);
    }
});

router.post("/", async (req, res, next)=>{
    try{
    const {comp_code , amt } = req.body;
    if (!comp_code && !amt) throw new ExpressError(`Please provide all details`, 404);
    if (!req.body.comp_code) throw new ExpressError(`Please provide comp_code`, 404);
    if (!req.body.amt) throw new ExpressError(`Please provide amt`, 404);
    const request = await  db.query(`INSERT INTO invoices (comp_code, amt)
        VALUES ($1,$2) RETURNING *`, [comp_code, amt]);
    return res.json({invoice: request.rows[0]});
    }catch (e){
        return next(e);
    }
});

router.put("/:id", async (req, res, next)=>{
    try{
    // const {id} = req.params;
    // const { amt } = req.body;
    // if (!amt) throw new ExpressError("Please provide amt", 500);
    // const request = await db.query(`UPDATE invoices SET amt =$1  WHERE id = $2 RETURNING *`, [amt, id]);
    // if (request.rows.length === 0 ){
    //     throw new ExpressError(`id ${id} doesn't exists in database`, 404);
    // }
    // return res.json({invoice : request.rows[0]});
    let {amt, paid} = req.body;
    let id = req.params.id;
    let paidDate = null;

    const currResult = await db.query(`SELECT paid FROM invoices WHERE id = $1`,[id]);

    if (currResult.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }

    const currPaidDate = currResult.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null
    } else {
      paidDate = currPaidDate;
    }

    const result = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,[amt, paid, paidDate, id]);

    return res.json({"invoice": result.rows[0]});

    }catch (e) {
        return next(e); 
    }
});

router.delete("/:id", async (req, res, next)=>{
    try{
    const { id } = req.params;
    const test = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
        if (test.rows.length === 0){
            throw new ExpressError(`invoice id ${id} can't be found`, 404);
        }
    const request = await db.query(`DELETE FROM invoices WHERE id = $1`, [id]);
    return res.json({status: "deleted"});
    }catch(e){
        return next(e);
    }
});