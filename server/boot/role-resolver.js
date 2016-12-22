// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-example-access-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

module.exports = function(app) {
  var Role = app.models.Role;

  function reject(method,cb) {
    var unauthenticatederror={
      "message": method + " is not authenticated"
    };
    process.nextTick(function() {
      cb(unauthenticatederror, false);
    });
  };


  // function checkUserRolebyId(userid,checkrole,cb){
  //   var system_user = app.models.system_user;
  //   //get user model by id
  //   system_user.findById(userid, function(err, system_user) {
  //     if (err) return cb(err);
  //     //check user role
  //     if(system_user.role==checkrole){
  //       cb(null ,true);
  //     }else{
  //       cb(null ,false);
  //     }
  //
  //   });
  // }

  Role.registerResolver('bank', function(role, context, cb) {
    //get userid
    var userid=context.accessToken.userId;
    var userlist = app.models.SystemUser;
    userlist.findById(userid,function(err, founduser) {
      if (err) return cb(err);
      if(founduser.email=="admin@bank.com"){
        return cb(null,true)
      } else {
        return reject(context.method,cb);
      }
    });
  });

  //if some one has a vendor object created by himself ,then he is a vendor
  Role.registerResolver('vendor', function(role, context, cb) {
    //get userid
    var userid=context.accessToken.userId;
    if(userid==1){return cb(null,false)}
    var vendor = app.models.Vendor;
    vendor.count({
      ownerId: userid,
    }, function(err, count) {
      if (err) {
        console.log(err);
        return cb(context.method, false);
      }
      cb(null, count > 0);
    });

  });
};

