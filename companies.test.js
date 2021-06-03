process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("./app");
const db = require("./db");

let testCompany;
beforeEach(async ()=>{
    const results = await db.query(`INSERT INTO companies (code, name, description) 
            VALUES ('ibm', 'IBM', 'Big Blues') RETURNING *`);
    testCompany = results.rows[0];
});

afterEach(async ()=>{
    await db.query(`DELETE FROM companies`);
});

afterAll(async ()=>{
    await db.end();
});

describe("GET /companies", ()=>{
    test("get all companies details", async ()=>{
        const response = await request(app).get('/companies');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({companies:[testCompany]});
    });
});

describe("GET /:code", ()=>{
    test("get the company with specific code", async()=>{
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company : testCompany})
    });
    test("Respond with 404 when wrong code", async ()=>{
        const response = await request(app).get("/companies/abc");
        expect(response.statusCode).toBe(404);
    });
});

describe("POST /companies", ()=>{
    test("add a new company", async ()=>{
        const response = await request(app).post("/companies").send({"code" : "apple", "name" : "Apple", "description" : "apple phones"});
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({company: {"code" : "apple", "name" : "Apple", "description" : "apple phones"}})
    });
    test("duplicate code gives error 404", async()=>{
        const test = await request(app).post("/companies").send(testCompany);
        expect(test.statusCode).toBe(404);
    });
});

describe("PATCH /:code", ()=>{
    test("patch request", async()=>{
        const test = await request(app).patch(`/companies/${testCompany.code}`).send({"code": "teslam", "name": "Tesla", "description": "ds"});
        expect(test.statusCode).toBe(200);
        expect(test.body).toEqual({company : {"code": "teslam", "name": "Tesla", "description": "ds"}});
    });
    test("Respond with 404 if code not in db", async()=>{
        const test = await request(app).patch(`/companies/sdsfd`).send({"code": "teslam", "name": "Tesla", "description": "ds"});
        expect(test.statusCode).toBe(404);
    });
});

describe("DELETE /:code", ()=>{
    test("delete a company", async()=>{
        const test = await request(app).delete(`/companies/${testCompany.code}`);
        expect(test.body).toEqual({"status": "deleted"});
    });
    test("respond with 404 if code not in db", async()=>{
        const test = await request(app).delete(`/companies/ewrt`);
        expect(test.statusCode).toBe(404);
    });
});