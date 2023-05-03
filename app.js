// added async infront of functions so that it wil wait till it get updated and added the mongodb url instead of local database server
// except logging errors all other console logs are removed

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect('mongodb+srv://rerevo7582:WLuqtRzLOJChmpiT@cluster0.ypzxdwm.mongodb.net/todolistDB', { useNewUrlParser: true })
  .then(() => {
    console.log('Successfully connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
const itemsSchema = {
  name: { type: String, required: true }
}
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "welcome to your to do list"
})
const item2 = new Item({
  name: "Hit the + button to add a new item"
})
const item3 = new Item({
  name: "<-- hit this to delete an item"
})

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  await List.findOne({ name: customListName }).then(async (foundlist) => {
    if (!foundlist) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundlist.name, newListItems: foundlist.items })
    }
  })


});

app.get("/", async function (req, res) {

  await Item.find()
    .then(async function (foundItems) {
      if (foundItems.length === 0) {
        await Item.insertMany(defaultItems)
          .then(function (docs) {
            // console.log(docs.length + ' documents inserted');
          })
          .catch(function (error) {
            console.error(error);
          });

        res.redirect("/");
      }
      else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});


app.post("/delete",  async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === 'Today'){
    await Item.findByIdAndDelete(checkedItemId).then(() => {
      // console.log(checkedItemId + "id deleted");
      res.redirect("/");
    }).catch((err) => {
      console.log(err);
    })
  }
  else{
    await List.findOneAndUpdate(
                        {name:listName},
                        {$pull:{items:{_id:checkedItemId}}}
    ).then(() => {
      // console.log(checkedItemId + " id deleted");
      res.redirect("/"+listName);
    }).catch((err) => {
      console.log(err);
    })
  }

})


app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {
    await item.save();
  res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundlist) => {
        foundlist.items.push(item);
        foundlist.save();
        res.redirect("/" + listName);
       
    })
  }

});

app.get("/about", function (req, res) {
  res.render("about");
});


app.listen(3000, function () {
  console.log("Server started on port 3000");
});

