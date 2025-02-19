const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const session = require("express-session");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Item = require("./models/Item");
const { register } = require("module");

const app = express();
const port = process.env.port||3000;


//Middleware to serve static data
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));

app.use(session({
    secret:"12345",
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false}
}))

//sendMessage();

//first example route

function isAuthenticated(req,res, next){
    if (req.session.user){
        return next();
    }
    else{
        return res.redirect("/EntriesLogin");
    }
    
}

const mongoURI = "mongodb://localhost:27017/likelist";
mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB Connection Error"));

db.once("open", ()=>{
    console.log("Connected to MongoDB Database");
});

app.get("/register", (req,res)=>{
    res.sendFile(path.join(__dirname, "public", "register.html"));
})

app.post("/register", async (req,res)=>{
    try{
        const {username, password, email} = req.body;

        const existingUser = await User.findOne({username});
        const existingEmail = await User.findOne({email});

        if(existingUser)
        {
            return res.send("Username Already Taken, Try A Different One");
        }

        if (existingEmail)
        {
            return res.send("Email Already In Use")
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        
        const newUser = new User({username, password:hashedPassword, email});
        
        await newUser.save();
        res.redirect("/EntriesLogin");

    }catch(err){
        res.status(500).send("Error Registering New User");
    }
})

app.get("/", function(req, res)
{
    //res.send("Hello Everyone!");
    res.sendFile(path.join(__dirname, "public", "index.html"));
})

app.get("/testjson", (req, res)=>
{
    res.sendFile(path.join(__dirname, "public", "json/games.json"));
})

app.get("/additem", isAuthenticated, (req, res)=>
{
    res.sendFile(path.join(__dirname, "public", "listadd.html"));
})

app.get("/EntriesLogin", (req, res)=>
{
    res.sendFile(path.join(__dirname, "public", "entrieslogin.html"));
})

app.get("/items", async(req,res)=>{
    try{
        const itemdata = await Item.find();
        res.json(itemdata);
    } catch(err){
        res.status(500).json({error:"Failed to get items"})
    }
});

app.get("/items/:id", async (req,res)=>{
    try{
        const item = await Item.findById(req.params.id);
        if (!item){
            return res.status(404).json({error:"Item not found"});
        }
        res.json(item);

    }catch(err){
        res.status(500).json({error:"Failed to get item"});
    }
});

app.post("/additem", async (req,res)=>{
    try{
        const newItem = new Item(req.body);
        const saveItem = await newItem.save();

        res.redirect("/");
    }catch(err){
        res.status(501).json({error:"Failed to add new item"});
    }
});

app.put("/updateitem/:id", (req,res)=>{
    Item.findByIdAndUpdate(req.params.id, req.body, {
        new:true,
        runValidators:true
    }).then((updatedItem)=>{
        if (!updatedItem){
            return res.status(404).json({error:"Failed to find item"});
        }
        res.json(updatedItem);
    }).catch((err)=>{
       res.status(400).json({error:"Failed to update item"});
    });
});

app.delete("/deleteitem/name", async (req,res)=>{
    try{
        const itemName = req.query;
        const item = await Item.find(itemName);

        if (item.length === 0){
            return res.status(404).json({error:"Failed to find item"});
        }
        const deletedItem = await Item.findOneAndDelete(itemName);
        res.json({message:"Item Deleted Successfully"});

    }catch(err){
        console.log(err);
        res.status(404).json({error:"Item not found"});
    }
});

app.post("/EntriesLogin", async (req,res)=>{
    const {username, password} = req.body;

    const user = await User.findOne({username});

    if (user && bcrypt.compareSync(password, user.password))
    {
        req.session.user = username;
        return res.redirect("/");
    }
    req.session.error = "Invalid User";
    return res.redirect("/EntriesLogin");
});

app.get("/logout", (req,res)=>{
    req.session.destroy(()=>{
        res.redirect("/EntriesLogin");
    });
});


setTimeout(()=>
{
    console.log("Hello 2 seconds later");
}, 2000);

setTimeout(()=>
{
    console.log("Hello now");
}, 0);

app.listen(port, function()
{
    console.log(`Server is running on port: ${port}`);
})