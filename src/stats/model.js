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

    setTotal: function (value, totalName = '') {
        if (totalName) {
            this.set(`total${this.capitalise(totalName)}`, value);
            this.set('total', this.getTotal() + value);
        } else {
            this.set('total', value);
        }
    },

    getTotal: function (totalName = '') {
        if (totalName) {
            return this.get(`total${this.capitalise(totalName)}`);
        } else {
            return this.get('total');
        }
    },

    capitalise: function (propName) {
        return propName.charAt(0).toUpperCase() + propName.slice(1);
    },

    purgeLastTotal: function () {
        this.set('total',  0); 
    }
});