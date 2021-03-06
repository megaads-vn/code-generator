/**
 * @author Phuluong
 * December 27, 2015
 */

/** Exports **/
module.exports = new RouteLoader();
/** Imports **/
var IO = require("../io/io");
var util = require(__dir + "/core/app/util");
var config = require(__dir + "/core/app/config");
var contentTypes = require(__dir + "/core/io/content-types");
/** Modules **/
function RouteLoader() {
    this.filterContainer = [];
    this.load = function (constructorProperties) {
        this.sessionManager = constructorProperties.sessionManager;
        this.socketIOConnection = constructorProperties.socketIOConnection;
        this.httpConnection = constructorProperties.httpConnection;
        this.autoLoader = constructorProperties.autoLoader;
        this.viewEngine = constructorProperties.viewEngine;
        this.httpConnection.asset(processAssetRequest);
    };
    this.any = function (routeName, route, filters) {
        this.io(routeName, route, filters);
        this.get(routeName, route, filters);
        this.post(routeName, route, filters);
        return this;
    };
    this.io = function (routeName, action, filters) {
        var self = this;
        this.socketIOConnection.addMessageListener(routeName, function (data, session) {
            var io = new IO({
                autoLoader: self.autoLoader,
                routeName: routeName,
                sessionManager: self.sessionManager,
                viewEngine: self.viewEngine
            });
            io.bindSocketIO(data, session);
            executeAction(self, action, io, filters);
        });
        return this;
    };
    this.get = function (routeName, action, filters) {
        var self = this;
        this.httpConnection.get(routeName, function (req, res) {
            var io = new IO({
                autoLoader: self.autoLoader,
                routeName: routeName,
                sessionManager: self.sessionManager,
                viewEngine: self.viewEngine
            });
            io.bindHttp(req, res);
            executeAction(self, action, io, filters);
        });
        return this;
    };
    this.post = function (routeName, action, filters) {
        var self = this;
        this.httpConnection.post(routeName, function (req, res) {
            var io = new IO({
                autoLoader: self.autoLoader,
                routeName: routeName,
                sessionManager: self.sessionManager,
                viewEngine: self.viewEngine
            });
            io.bindHttp(req, res);
            executeAction(self, action, io, filters);
        });
        return this;
    };
    /**
     * Register a filter to the route
     * @param {String} name
     * @param {callable} callbackFn
     * @returns {RouteLoader}
     */
    this.filter = function (name, callbackFn) {
        this.filterContainer[name] = callbackFn;
        return this;
    };
    function executeAction(self, action, io, filters) {
        var interrupt = false;
        // call before-filter
        if (filters != null && filters.before != null) {
            if (typeof filters.before === "function") {
                if (filters.before(io) === false) {
                    interrupt = true;
                }
            } else if (typeof filters.before === "string") {
                if (self.filterContainer[filters.before] != null && self.filterContainer[filters.before](io) === false) {
                    interrupt = true;
                }
            } else if ((typeof filters.before === "object") && filters.before.length > 0) {
                for (var i = 0; i < filters.before.length; i++) {
                    if (typeof filters.before[i] === "function") {
                        if (filters.before[i](io) === false) {
                            interrupt = true;
                        }
                    } else if (typeof filters.before[i] === "string") {
                        if (self.filterContainer[filters.before[i]] != null && self.filterContainer[filters.before[i]](io) === false) {
                            interrupt = true;
                        }
                    }
                }
            }

        }
        // if before-filter return false, return before executing action
        if (interrupt) {
            return;
        }
        // call action
        if (typeof action === "function") {
            action(io);
        } else if (typeof action === "string") {
            var actionFn = self.autoLoader.getAction(action);
            if (actionFn != null) {
                actionFn(io);
            } else {
                io.status(404).json({
                    status: 404,
                    result: "page not found"
                });
            }
        }
        // call after-filter
        if (filters != null && filters.after != null) {
            if (typeof filters.after === "function") {
                filters.after(io);
            } else if (typeof filters.after === "string") {
                if (self.filterContainer[filters.after] != null) {
                    self.filterContainer[filters.after](io);
                }
            } else if ((typeof filters.after === "object") && filters.after.length > 0) {
                for (var i = 0; i < filters.after.length; i++) {
                    if (typeof filters.after[i] === "function") {
                        filters.after[i](io);
                    } else if (typeof filters.after[i] === "string") {
                        if (self.filterContainer[filters.after[i]] != null) {
                            self.filterContainer[filters.after[i]](io);
                        }
                    }
                }
            }
        }
    }
    function processAssetRequest(req, res) {
        var result = util.readFile(__dir + config.get("app.assetPath", "") + req.baseUrl);
        if (result === false) {
            res.writeHead(404, {"Content-Type": "application/json"});
            res.end(JSON.stringify({
                status: 404,
                result: "page not found"
            }));
        } else {
            var header = {"Connection": "close"};
            var fileExtension = req.baseUrl.fileExtension();
            var contentType = contentTypes[fileExtension];
            if (contentType != null) {
                header["Content-Type"] = contentType;
            }
            res.writeHead(200, header);
            res.end(result, "binary");
        }
    }
}