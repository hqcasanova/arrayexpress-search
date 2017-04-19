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

    initialize: function () {
        this.on('error', this.purgeLastTotal);
    },

    parse: function (response) {
        let converted = {};

        for (let key in response) {
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
            this.set(`total${_.capitalise(totalName)}`, value);
            this.set('total', this.getTotal() + value);
        } else {
            this.set('total', value);
        }
    },

    getTotal: function (totalName = '') {
        if (totalName) {
            return this.get(`total${_.capitalise(totalName)}`);
        } else {
            return this.get('total');
        }
    },

    purgeLastTotal: function () {
        this.set('total',  0);
    }
});