import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';

export default Backbone.Model.extend({
    defaults: function () {
        return {
            query: '',          //last new query
            total: 0,           //number of results
            apiVersion: 0,
            apiRevision: 0
        }
    },

    initialise: function () {
        this.on('error', this.purgeLastTotal);
    },

    parse: function (response) {
        var converted = {};
        var key;

        for (key in response) {
            converted[this.camelise(key)] = response[key];
        }
        
        return converted;
    },

    camelise: function (propName) {
        return propName.replace(/-([a-z])/g, function (hump) { 
            return hump[1].toUpperCase(); 
        });
    },

    purgeLastTotal: function () {
        this.set('total',  0); 
    }
});