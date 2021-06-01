const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

router.get('/', async (req, res, next) => {
    try{
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({companies : results.rows});
    }catch (e) {
        return next(e);
    }
});

router.get("/:code", async (req, res, next)=>{
    try{
    const { code } = req.params;
    const result = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);
    if (result.rows.length === 0){
        throw new ExpressError(`code ${code} not found in database`, 404);
    }
    return res.json({company : result.rows[0]});
}catch (e) {
    return next(e);
}
});

router.post("/", async (req, res, next)=>{
    try{
    const {code, name, description } = req.body;
    if (!code && !name && !description){
        throw new ExpressError("please provide code, name and description", 404);
    }
    if (!code){
        throw new ExpressError(`Please provide code`, 404);
    }
    if (!name){
        throw new ExpressError(`Please provide name`, 404);
    }
    if (!description){
        throw new ExpressError(`Please provide description`, 404);
    }
    lowerCaseCode = code.toLowerCase();
    const test = await db.query(`SELECT code FROM companies WHERE code=$1`, [lowerCaseCode]);
    if (lowerCaseCode == test.rows[0].code){
        throw new ExpressError(`Company with code ${code} already exists in database`, 404);
    }
    const result = await db.query(`INSERT INTO companies (code, name, description) 
            VALUES ($1, $2, $3) RETURNING *`, [lowerCaseCode, name, description]);
    return res.status(201).json({company : result.rows[0]});
    }catch (e) {
        return next(e);
    }
});

router.patch("/:code", async (req, res, next)=>{
    try{
        const {code:codey, name, description } = req.body;
        if (!codey && !name && !description){
            throw new ExpressError(`Please provide details what property/properties you want to change`, 404);
        }
        const result = await db.query(`UPDATE companies SET code = $1, name = $2, description = $3 WHERE code = $4 RETURNING *`, 
            [codey, name, description, req.params.code]);
        if (result.rows.length === 0){
            throw new ExpressError(`Company ${req.params.code} can't be found`, 404);
        }
        return res.json({company : result.rows[0]});
    }catch(e) {
        return next(e);
    }
});

router.delete("/:code",async (req, res, next)=>{
    try{
        const { code } = req.params;
        const test = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);
        if (test.rows.length === 0){
            throw new ExpressError(`company name ${code} can't be found`, 404);
        }
        const result = await db.query(`DELETE FROM companies WHERE code=$1`, [code]);
        res.json({"status": "deleted"})
    }catch(e){
        return next(e);
    }
});

module.exports = router;