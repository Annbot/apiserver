/**
 * Created by wuhuidong on 2016/12/17.
 */

module.exports.modelstartlog=function(ctx,modelname){
  if(ctx.req.accessToken){
    var userid=ctx.req.accessToken.userId;
  } else {
    var userid="authenticated user";
  }
  console.log("model(",modelname,") userid(",userid ,"):    ", ctx.methodString, 'was invoked remotely');
};
