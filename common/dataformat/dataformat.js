/**
 * Created by wuhuidong on 2016/12/17.
 */

module.exports.userformat=function(requestdata){
  var defineduser={
    username : "",
    password : "",
    email : "",
  };
  defineduser.username=requestdata.username;
  defineduser.password=requestdata.password;
  defineduser.email=requestdata.email;
  defineduser.balance=0;
  return defineduser;
};

module.exports.vendorformat= function(requestdata){
  var definedvendor={
    name : ""
  };
  definedvendor.name=requestdata.name;
  return definedvendor;
};

module.exports.productformat= function(requestdata){
  var definedproduct={
    name : "",
    price : 0,
    active : true
  };
  definedproduct.name=requestdata.name;
  definedproduct.price=requestdata.price;
  definedproduct.active=requestdata.active;
  return definedproduct;
};

module.exports.transactionformat= function(requestdata){
  var definedtransaction={
    to_id : 0 ,
    product_id : 0,
    quantity : 0,
    amount : 0,
    transactiontimestamp:null
  };
  definedtransaction.to_id=requestdata.to_id;
  definedtransaction.product_id=requestdata.product_id;
  definedtransaction.quantity=requestdata.quantity;
  definedtransaction.amount=requestdata.amount;
  definedtransaction.transactiontimestamp = Date.now();
  return definedtransaction;
};
