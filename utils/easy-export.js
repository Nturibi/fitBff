module.exports = function() {
    let the_export = function(app) {
        for (let i = 0; i < this.functions.length; i++) {
            this.functions[i](app);
        }
        return this.ret_val;
    };
    the_export.ret_val = [];
    the_export.functions = [];
    return the_export;
}
