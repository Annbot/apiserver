'use strict';

var dataformat = require("../dataformat/dataformat");
var myutil = require("../util/util");
var modelname="vendor";

module.exports = function(Vendor) {
  Vendor.beforeRemote('**', function(ctx, user, next) {
    myutil.modelstartlog(ctx,modelname);
    next();
  });

  Vendor.beforeRemote('prototype.__create__products', function(context, user, next) {
    context.args.data = dataformat.productformat(context.args.data);
    context.args.data.createtimestamp=Date.now();
    context.args.data.updatetimestamp=Date.now();
    next();
  });
  //
  // Vendor.beforeRemote('prototype.__updateById__products', function(context, user, next) {
  //   context.args.data = dataformat.productformat(context.args.data);
  //   context.args.data.updatetimestamp=Date.now();
  //   next();
  // });

};
