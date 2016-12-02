module.exports = function ($route, $logger) {
    /** Register HTTP requests **/
    $route.any("/code", "GeneratorController@generateCode", {
        before: []
    });
    /** Register socket.io requests **/
    /** Register filters **/
};
