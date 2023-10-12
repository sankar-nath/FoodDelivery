//express
const express = require("express")
const app = express()
const HTTP_PORT = process.env.PORT || 8080

//from Hesus
const path = require("path");


//express-handlebars
const exphbs = require("express-handlebars")
app.engine(`.hbs`, exphbs.engine({ extname: `.hbs` }))
app.set(`view engine`, `.hbs`)

// receive data from a <form>
app.use(express.urlencoded({ extended: true }))

//session code
const session = require(`express-session`)

//configure the express session
app.use(session({
    secret: 'fat cat', // any random string can be used
    resave: false,
    saveUninitialized: true,
    //cookie needs to be set to false since we need to use HTTP instead of HTTPS
    cookie: { secure: false }
}))



//lets create a new middleware that ensures that user is logged in before they can access dashboard or other page

const ensureLogin = (req, res, next) => {
    if (req.session.isLoggedIn !== undefined &&
        req.session.isLoggedIn &&
        req.session.user !== undefined) {
        //user has logged in and we will allow them to go the next endpoint
        next()
    }
    else {
        //else, we will ask them to login again
        return res.render("driver-login", { errorMsg: "You must log-in to see this page!", layout: "main-layout" })
    }
}

// Database mongoose 
const mongoose = require("mongoose")

// const CONNECTION_STRING = "mongodb+srv://zanky9:30NJIgxMpnIRnHh1@cluster0.xa0expf.mongodb.net/myDb?retryWrites=true&w=majority"

const CONNECTION_STRING = "mongodb+srv://betito:bedu1234@cluster0.w9cshvn.mongodb.net/jalapeno?retryWrites=true&w=majority"

// mongoose.connect(CONNECTION_STRING);

// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "Error connecting to database: "));
// db.once("open", () => { console.log("Mongo DB connected successfully."); });
// console.log(`here after db`)

//mongoose
// const MONGODB_URI = process.env.MONGODB_URI;

mongoose
    .connect(CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB: " + err.message);
    });


const orderSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
        },
        deliveryAddress: {
            type: String,
            required: true,
        },
        itemsOrdered: {
            type: [
                {
                    name: String,
                    quantity: Number,
                    price: Number,
                },
            ],
            required: true,
        },
        orderDateTime: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["RECEIVED", "READY FOR DELIVERY", "IN TRANSIT", "DELIVERED"],
            default: "RECEIVED",
        },
        orderConfirmation: {
            type: String,
            unique: true,
            required: true,
        },
        assignedTo: {
            type: String,
            default: "",
        },
    },
    { versionKey: false }
);

const driverSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    vehicleModel: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
    },
  });

const Order = mongoose.model("Order", orderSchema);
const Driver = mongoose.model("Driver", driverSchema);


let menuItemsCollection = [
    {
        name: "Burger",
        image: "burger.jpg",
        description: "Delicious beef burger with lettuce, tomato, and cheese",
        price: 5.99
    },
    {
        name: "Pizza",
        image: "pizza.jpg",
        description: "Large pepperoni pizza with extra cheese",
        price: 12.99
    },
    // Add more menu item objects as needed
];

let ordersCollection = [
    {
        customerName: "John Smith",
        id: "123",
        deliveryAddress: "123 Main St, Cityville",
        itemsOrdered: ["Burger", "Fries", "Soda"],
        dateTimeOfOrder: new Date("2023-10-09T12:00:00"),
        status: "RECEIVED"
    },
    {
        customerName: "Jane Doe",
        id: "666",
        deliveryAddress: "456 Elm St, Townsville",
        itemsOrdered: ["Pizza", "Salad", "Water"],
        dateTimeOfOrder: new Date("2023-10-09T12:30:00"),
        status: "RECEIVED"
    }
];

let driversCollection = [
    {
        username: "driver1",
        password: "password1",
        fullName: "John Doe",
        vehicleModel: "Toyota Camry",
        color: "Blue",
        licensePlate: "ABC123"
    },
    {
        username: "driver2",
        password: "password2",
        fullName: "Jane Smith",
        vehicleModel: "Honda Civic",
        color: "Red",
        licensePlate: "XYZ789"
    }
];




app.get("/", (req, res) => {
    console.log(`here at /`)
    res.render("driver-page",
        {
            layout: "main-layout"
        })
})

app.get("/login", (req, res) => {
    console.log(`here at /login`)
    // Accessing a driver's information
    console.log(driversCollection[0].fullName); // Outputs: "John Doe"
    res.render("driver-login",
        {
            layout: "main-layout"
        })
})

app.post("/login", async (req, res) => {
    console.log(`here at post login`)
    const userNameFromUI = req.body.username;
    const passwordFromUI = req.body.password;
    console.log(`userNameFromUI is: ${userNameFromUI}`)
    console.log(`passwordFromUI is: ${passwordFromUI}`)

    let driverlist = [];

    //code to pull drivers collection from db
    try {
        driverlist = await Driver.find().lean().exec();
        console.log(`printing driverlist`)
        console.log(driverlist)

    } catch (err) {
        console.error(err);
        res.status(500).send("Error getting driver details");
    }

    if (userNameFromUI === undefined ||
        passwordFromUI === undefined ||
        userNameFromUI === "" ||
        passwordFromUI === "") {
        //there is some error as fields are empty
        return res.render("driver-login", { errorMsg: "Please fill in all fields", layout: "main-layout" })
    }
    //let's create a for loop to iterate through the userList
    let flag = true;
    for (driver of driverlist) {

        if (userNameFromUI === driver.username &&
            passwordFromUI === driver.password) {
            //valid login
            console.log(`succesful login`)

            //before redirecting user, we will save our session information 
            req.session.user = {
                name: driver.username,
                fullName: driver.fullName,
            }
            console.log(`setting user profile`)

            //we will use this to pass along data to the profile page
            userProfile = {
                fullName: driver.fullName,
                name: driver.username,
            }
            req.session.isLoggedIn = true
            console.log(`printing req.session.user`)
            console.log(req.session.user)
            flag = true;

            return res.redirect("/orderList")
        }
        else {
            flag = false;

        }
    }
    if (!flag) {
        return res.render("driver-login", { errorMsg: "Please fill in all fields", layout: "main-layout" })
    }



})



// Handle logout, you can clear the session or cookie here
app.get("/logout", (req, res) => {
    // Clear the session or cookie as needed
    // Redirect to the login page or home page
    req.session.destroy()
    res.redirect("/login");
});

app.get("/register", (req, res) => {
    console.log(`here at /register`)
    for (driver of driversCollection) {
        console.log(`${driver.username}`)
    }
    res.render("driver-register",
        {
            layout: "main-layout"
        })
})

app.post("/register", async (req, res) => {
    //getting all the data from the from
    const { username, password, fullName, vehicleModel, color, licensePlate } = req.body;
    //creating an object to push
    const newDriver = {
        username,
        password,
        fullName,
        vehicleModel,
        color,
        licensePlate
    };
    // Add the new driver to the driversCollection array
    try{
        const driverList = await Driver.find().lean().exec();

        if (!driverList) {
            return res.status(404).send("Order not found");
        }

        // Update the status to "IN TRANSIT"
        driverList.push(newDriver);

        // Save the updated order in the database
        await driverList.save();

        for (driver of driverList) {
            console.log(`printing driver full names`)
            console.log(`${driver.fullName}`)
        }
    } catch(err){
        console.log(`driver could not be pushed`)
    }

    
    

    // Redirect to a confirmation page (you can create this page)
    res.redirect("/register-success");
});

app.get("/register-success", (req, res) => {
    console.log(`here at /register-success`)
    res.render("register-success",
        {
            layout: "main-layout"
        })
})

app.get("/orderlist", async (req, res) => {
    console.log(`here at /orderlist`)

    try {
        const currentOrders = await Order.find().lean().exec();

        //     // const responseJSON = await currentOrders.json();
        //     console.log(`currentOrders JSOn stringify: ${JSON.stringify(currentOrders)}`)
        //     // console.log(`responseJSONis: ${responseJSON}`)

        // console.log(currentOrders)
        // console.log(typeof(currentOrders))
        // console.log(`printing typeof`)



        return res.render("order-list",
            {
                layout: "main-layout",
                orders: currentOrders
            })
    } catch (err) {
        console.log(err)
        console.log(`here at error`)
    }



    res.render("order-list",
        {
            layout: "main-layout",
            orders: currentOrders
        })
})

app.get("/deliverylist", ensureLogin, async (req, res) => {
    console.log(`here at /deliverylist`)
    try {
        // Fetch orders assigned to the currently logged-in driver
        const driverName = req.session.user.name;
        const assignedOrders = await Order.find({ assignedTo: driverName }).lean().exec();

        res.render("delivery-fulfillment", {
            layout: "main-layout",
            orders: assignedOrders,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching assigned orders");
    }
})

app.post("/deliver/:orderId", ensureLogin, async (req, res) => {
    console.log(`here at deliver/:orderId`)
    const orderId = req.params.orderId;
    const driverName = req.session.user.name;

    try {
        const selectedOrder = await Order.findOne({ _id: orderId });

        if (!selectedOrder) {
            return res.status(404).send("Order not found");
        }

        // Check if the order is already assigned to another driver
        if (selectedOrder.assignedTo && selectedOrder.assignedTo !== driverName) {
            return res.status(403).send("This order is already assigned to another driver.");
        }
         // Update the assignedTo field to the logged-in driver
         selectedOrder.assignedTo = driverName;

        // Update the status to "IN TRANSIT"
        selectedOrder.status = "IN TRANSIT";

        // Save the updated order in the database
        await selectedOrder.save();

        // You can also redirect to a confirmation page if needed
        res.redirect("/orderlist");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating order status");
    }
})

app.post("/complete/:orderId", ensureLogin, async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const selectedOrder = await Order.findOne({ _id: orderId });

        if (!selectedOrder) {
            return res.status(404).send("Order not found");
        }

        // Check if the order is assigned to the currently logged-in driver
        if (selectedOrder.assignedTo !== req.session.user.name) {
            return res.status(403).send("You are not authorized to complete this order.");
        }

        // Update the status to "DELIVERED"
        selectedOrder.status = "DELIVERED";

        selectedOrder.assignedTo = "";

        // Save the updated order in the database
        await selectedOrder.save();

        // You can also redirect to a confirmation page if needed
        res.redirect("/deliverylist");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error marking the order as delivered");
    }
});

const onHTTPStart = () => {
    console.log("Server is live!")
}

app.listen(HTTP_PORT, onHTTPStart)