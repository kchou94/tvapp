var mongoose = require('mongoose');
var Email = require('../models/email');
var User = require('../models/user');
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

mongoose.connect(process.env.DB_URL);

var adminEmail = process.env.ADMIN_EMAIL;
var adminUsername = process.env.ADMIN_USERNAME;

emailAdd();
isAdminSetter();

//Add admin email to whitelist
function emailAdd(){
    console.log('Adding admin email to whitelist...');
    if(!process.env.ADMIN_EMAIL){
        return console.log('Please specify an admin email in process.env.ADMIN_EMAIL')
    }
    Email.find({email: adminEmail}, function(err, emailsFound){
        if(err){
            return console.log(err);
        }
        if(emailsFound.length){
            console.log('Email already exists!');
        } else {
            Email.create({email: adminEmail}, function(err, emailCreated){
                if(err){
                    return console.log(err);
                }
                console.log('Added email to whitelist: ' + emailCreated);
            });
        }    
    });
}

//Set admin state on
function isAdminSetter(){
    console.log('Setting admin privilege...');
    if(!process.env.ADMIN_USERNAME){
        return console.log('Please specify an admin username in process.env.ADMIN_USERNAME');
    }
    User.findOne({username: adminUsername}, function(err, userFound){
        if(err){
            return console.log(err);
        }
        if(userFound){
            if(userFound.isAdmin){
                console.log('User is already admin!');
            } else {
                userFound.isAdmin = true;
                userFound.save(function(err, userSaved){
                    if(err){
                        return console.log(err);
                    }
                    console.log('Admin set! ' + userSaved);
                });
            }
        } else {
            console.log('User not found!');
        }
    });
}