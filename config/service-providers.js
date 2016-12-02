var config = require(__dir + "/core/app/config");
var routerLoader = require(__dir + "/core/loader/route-loader");
var event = require(__dir + "/core/app/event");
var logger = (require(__dir + "/core/log/logger-factory")).getLogger();
var redis = require("redis");
var redisClient = redis.createClient(config.get("redis.port"), config.get("redis.host"));
redisClient.select(config.get("redis.db"), function () {});
module.exports = function ($serviceContainer) {
    $serviceContainer.bind("$config", config);
    $serviceContainer.bind("$route", routerLoader);
    $serviceContainer.bind("$event", event);
    $serviceContainer.bind("$logger", logger);
    $serviceContainer.bind("$redis", redisClient);
};
