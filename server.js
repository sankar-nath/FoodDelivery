//express
const express = require("express")
const app = express()
const HTTP_PORT = process.env.PORT || 8080

//express-handlebars
const exphbs = require("express-handlebars")
app.engine(`.hbs`, exphbs.engine({ extname: `.hbs` }))
app.set(`view engine`, `.hbs`)

app.get("/", (req, res) => {
    console.log(`here at /`)
    res.render("driver-page",
        {
            layout: false
        })
})

app.get("/login", (req, res) => {
    console.log(`here at /login`)
    res.render("driver-login",
        {
            layout: false
        })
})

app.get("/register", (req, res) => {
    console.log(`here at /register`)
    res.render("driver-register",
        {
            layout: false
        })
})

app.get("/orderlist", (req, res) => {
    console.log(`here at /register`)
    res.render("order-list",
        {
            layout: false
        })
})

app.get("/deliverylist", (req, res) => {
    console.log(`here at /deliverylist`)
    res.render("delivery-fulfillment",
        {
            layout: false
        })
})

const onHTTPStart = () => {
    console.log("Server is live!")
}

app.listen(HTTP_PORT, onHTTPStart)