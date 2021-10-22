//jshint esversion:6

const express = require("express");
// const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// connect to local MongoDB w/ table "todolistDB"
mongoose.connect("mongodb://localhost:27017/todolistDB");

// create a new schema for db input
const itemSchema = new mongoose.Schema( {
  name: String
});

const listSchema = new mongoose.Schema( {
  name: String,
  items: [itemSchema]
});


// create mongoos model/collection
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);


// create default items
const item1 = new Item ({
  name: "Create new project"
});
const item2 = new Item ({
  name: "Initialize git repository"
});
const item3 = new Item ({
  name: "Open VS Code"
});


// insert default items into items collection
const defaultItems = [item1, item2, item3];


// display home page
app.get("/", function(req, res) {

  Item.find( {}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfull saved default items");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});


// dynamic parameter passing though URL
app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne( {name: customListName} , function(err, results) {
    if (!results) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {listTitle: customListName, newListItems: results.items})
    }
  });
})

// delete item from db
app.post("/delete", function(req, res) {
  
  const itemID = req.body.checkbox;
  const listName = req.body.listName;

  console.log(listName);

  if (listName === "Today") {
    Item.findByIdAndDelete(itemID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully deleted item from Today table.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate( {name: listName}, {$pull: { items: { _id: itemID } } }, function(err, foundList) {
      
      if (!err) {
        console.log("Succesfully deleted item from " + listName + " collection.");
        res.redirect("/" + listName);
      }

      })
  }

  // return to homepage
})

// post items to database
app.post("/", function(req, res){

  const listName = req.body.list;

  const item = new Item({
    name: req.body.newItem
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne( {name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000 at http://localhost:3000");
});
