'use strict';

var config = require('../../server/config.json');
var dataformat = require("../dataformat/dataformat");
var myutil = require("../util/util");
var modelname="system_user";
var path = require('path');


module.exports = function(System_user) {
  System_user.beforeRemote('**', function(ctx, user, next) {
    myutil.modelstartlog(ctx,modelname);
    next();
  });

  System_user.beforeRemote('create', function(context, user, next) {
    context.args.data = dataformat.userformat(context.args.data);
    next();
  });

  //send verification email after registration
  //todo:when deploy to bluemix , config.json need to be edited
  //todo:"protocal":"https",
  //todo:"host": "chancedemo-apiserver.mybluemix.net",
  //todo:"port": 443,
  //todo:when deploy to local , config.json need to be edited
  //todo:"protocal":"http",
  //todo:"host": "localhost",
  //todo:"port": 3000,
  System_user.afterRemote('create', function(context, user, next) {
    console.log('> user.afterRemote triggered');
    var options = {
      type: 'email',
      protocol:config.protocal,
      port:config.port,
      to: user.email,
      from: 'loopbacktestwhd@gmail.com',
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../../server/views/verify.ejs'),
      redirect: '/verified',
      user: user
    };

    user.verify(options, function(err, response) {
      if (err) {
        User.deleteById(user.id);
        return next(err);
      }

      console.log('> verification email sent:', response);

      context.res.render('response', {
        title: 'Signed up successfully',
        content: 'Please check your email and click on the verification link ' +
        'before logging in.',
        redirectTo: '/',
        redirectToLinkText: 'Log in'
      });
    });
  });

  System_user.beforeRemote('prototype.__create__vendors', function(context, user, next) {
    context.args.data = dataformat.vendorformat(context.args.data);
    context.args.data.createtimestamp=Date.now();
    context.args.data.updatetimestamp=Date.now();
    next();
  });

  System_user.beforeRemote('prototype.__updateById__vendors', function(context, user, next) {
    context.args.data = dataformat.vendorformat(context.args.data);
    context.args.data.updatetimestamp=Date.now();
    next();
  });

  System_user.beforeRemote('prototype.__create__transactions', function(context, user, next) {
    var transaction = dataformat.transactionformat(context.args.data);
    System_user.findById(context.req.accessToken.userId,function(err,fromuser){
        if(fromuser.balance<transaction.amount) {
          return next(new Error('balance('+fromuser.balance+'） is not not enough for this transaction (amount:'+transaction.amount+')'));
        }
        System_user.getApp(function(err,app){
          if (err) return next(err);
          var userlist =app.models.SystemUser;
          var productlist = app.models.Product;
          userlist.findById(transaction.to_id,function(err,touser){
            if(touser==undefined) {
              return next(new Error('to_id('+transaction.to_id+'） is not exist'));
            }
            checkProduct(productlist,transaction.product_id,function(err){
              if(err) return next(err);
              context.args.data = transaction;
              fromuser.balance -= transaction.amount;
              fromuser.save();
              touser.balance += transaction.amount;
              touser.save();
              next();
            });
          })
        })
      }
    );
  });

  function checkProduct(productlist,productid,cb){
    if(productid==0){
      cb(null);
    } else {
      productlist.findById(productid,function(err,product){
        if(product){
          cb(null);
        } else {
          cb(new Error('product_id('+productid+'） is not exist'));
        };
      });
    }
  }

  // updateInfo
  // owner can update username , password , email
  System_user.updateInfo = function(id,username, password,email, cb) {
    System_user.findById(id, function(err, founduser) {
      if (err) return cb(err);

      founduser.username = username;
      founduser.password = password;
      founduser.email = email;
      founduser.save();

      cb(null, {
        id:founduser.id ,
        username:founduser.username ,
        email:founduser.email ,
        balance:founduser.balance
      });
    });
  };

  System_user.remoteMethod('updateInfo', {
    accepts: [
      {arg: 'id', type: 'number'},
      {arg: 'username', type: 'string'},
      {arg: 'password', type: 'string'},
      {arg: 'email', type: 'string'}
    ],
    description :"Update user information by user id (you can update : username , email , password)" ,
    returns: {arg: 'after_process', type: 'array'},
    http: {path:'/updateInfo', verb: 'post'}
  });

  // remote method : issueCoin
  // bank user can issue coin to any id
  System_user.issueCoin = function(id, amount, cb) {
    System_user.findById(id, function(err, targetuser) {
      if (err) return cb(err);

      targetuser.balance += amount;
      targetuser.save();

      cb(null, {email:targetuser.email , balance:targetuser.balance});
    });
  };
  System_user.remoteMethod('issueCoin', {
    accepts: [
      {arg: 'id', type: 'number'},
      {arg: 'amount', type: 'number'},
    ],
    description :"Issue coin by bank user to target user id" ,
    returns: {arg: 'after_process', type: 'array'},
    http: {path:'/issueCoin', verb: 'post'}
  });

  // remote method : destroyCoin
  // bank user can only destroy coin in bank id which is set to 1 in initialization
  System_user.destroyCoin = function( amount, cb) {

    System_user.find({where:{email:"admin@bank.com"}}, function(err, founduser) {
      if (err) return cb(err);
      if(founduser[0].balance>=amount){
        founduser[0].balance -= amount;
        founduser[0].save();
        cb(null, {email:founduser[0].email , balance:founduser[0].balance});
      }else{
        cb({"message": "your balance is " + founduser[0].balance + ",not enough to destroy " +amount});
      }
    });
  };
  System_user.remoteMethod('destroyCoin', {
    accepts: [
      {arg: 'amount', type: 'number'}
    ],
    description :"Destroy coin by bank user from bank id" ,
    returns: {arg: 'after_process', type: 'array'},
    http: {path:'/destroyCoin', verb: 'post'}
  });

  // remote method : listTransaction
  // list all related transactions
  System_user.listTransaction = function(id,cb) {
    // var user_id = System_user.getId;
    System_user.getApp(function(err,app){
      var transactionlist = app.models.Transaction;
      transactionlist.find({where:{or:[{"from_id":id},{"to_id":id}]}}, function(err, foundtranscation) {
        if (err) return cb(err);
        cb(null, foundtranscation);
      });
    });

  };
  System_user.remoteMethod('listTransaction', {
    accepts: [
      {arg: 'id', type: 'number'}
    ],
    description :"List all related transactions" ,
    returns: {arg: 'related transaction', type: 'array'},
    http: {path:'/listTransaction', verb: 'post'}
  });

  //send password reset link when requested
  System_user.on('resetPasswordRequest', function(info) {
    var url = 'http://' + config.host + ':' + config.port + '/reset-password';
    var html = 'Click <a href="' + url + '?access_token=' +
      info.accessToken.id + '">here</a> to reset your password';

    System_user.app.models.Email.send({
      to: info.email,
      from: info.email,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return console.log(err);
      console.log('> sending password reset email to:', info.email);
    });
  });
};
