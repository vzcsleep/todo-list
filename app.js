const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const date = require(__dirname + '/date');
const https = require('https');
const _ = require('lodash');
const weather = require('openweather-apis');

let app = express();
let day = date.getDate();

weather.setCity('Kelowna');
weather.setLang('en');
weather.setUnits('metric');
weather.setAPPID('4f18b0ceab5e81565ae1ae0816a63940');

// database backend -------------------------------------------------------------------------

// connect to db
try {
    mongoose.connect('mongodb://localhost:27017/todolist');
    console.log('Successfully connected to MongoDB');
} catch(err) {
    console.log(err);
}

// entry format
const itemSchema = mongoose.Schema({
    text: String,
    dateAdded: String
});

const listSchema = mongoose.Schema({
    name: String,
    items: [itemSchema]
});
 
// db model
const Item = mongoose.model('Item', itemSchema);
const List = mongoose.model('List', listSchema);
// database backend -------------------------------------------------------------------------

// website backend --------------------------------------------------------------------------
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public')); 

app.get('/', (request, response) => {
    // gets title of list
    const listName = 'Today';

    // get weather
    weather.getAllWeather(function(err, JSONObj){
		// temp, weather icon, 
        const temperature = Math.floor(JSONObj.main.temp);
        const weatherIcon = JSONObj.weather[0].icon;
        const weatherIconURL = "http://openweathermap.org/img/wn/" + weatherIcon + "@2x.png";
        if(!err) {
            List.findOne({name: listName}, function(err, result) {
                if(!result) {
                    const list = new List({
                        name: listName,
                        items: []
                    });

                    list.save();

                    response.redirect('/');
                } else {
                    response.render('index', {listTitle: 'Today', itemList: result.items, dateAdded: result.items.dateAdded, date: day, temp: temperature, weatherImg: weatherIconURL});
                }
            });
        } else {
            console.log(err);
        }
	});
}); 

app.get('/:customListName', function(request, response) {
    const listName = _.capitalize(request.params.customListName);

    weather.getAllWeather(function(err, JSONObj){
		// temp, weather icon, 
        const temperature = Math.floor(JSONObj.main.temp);
        const weatherIcon = JSONObj.weather[0].icon;
        const weatherIconURL = "http://openweathermap.org/img/wn/" + weatherIcon + "@2x.png";
        List.findOne({name: listName}, function(err, result) {
            // if db doesnt exist with name
            if(!result) {
                // create new list
                const list = new List({
                    name: listName,
                    items: []
                });

                // save the new list to database
                list.save();

                response.redirect('/' + listName);
            } else {
                // show existing list
                response.render('index', {listTitle: listName, itemList: result.items, temp: temperature, weatherImg: weatherIconURL});
            }
        });
	});
});

app.post('/', (request, response) => {
    // Name of list
    const listName = request.body.list;

    // New item object
    const item = new Item({
        text: request.body.newItem,
        dateAdded: day
    });

    // Searches if the name of the database is at the home, then saves it
    if(listName === 'Today') {
        List.findOne({name: listName}, function(err, result) {
            result.items.push(item);
            result.save();
            response.redirect('/');
        });      
    } else {
        // Searches for the custom database, then saves it.
        List.findOne({name: listName}, function(err, result) {
            result.items.push(item);
            result.save();
            response.redirect('/' + listName);
        });
    }
});

app.post('/delete', (request, response) => {
    // Name of the list
    const listName = request.body.listName;

    // Grab id of item in that last
    const itemID = request.body.checkbox;

    // Search for item of that id in the custom database

    // Searches if list is set to home
    if(listName === 'Today') {
        // Deletes item with id
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, function(err, result) {
            if(err) {
                console.log(err);
            } else {
                response.redirect('/');
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, function(err, result) {
            if(err) {
                console.log(err);
            } else {
                response.redirect('/' + listName);
            }
        });
    }
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
// website backend --------------------------------------------------------------------------